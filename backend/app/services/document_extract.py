import io
import multiprocessing as mp
import zipfile
from typing import Any

try:
    import resource as _resource
except ImportError:  # Windows'ta resource modülü bulunmaz; süreç/zaman sınırları yine uygulanır.
    _resource = None

MAX_EXTRACTED_TEXT = 80_000
MAX_DOCX_UNCOMPRESSED = 20 * 1024 * 1024
MAX_DOCX_ENTRIES = 200
MAX_PDF_PAGES = 40
WORKER_MEMORY_BYTES = 256 * 1024 * 1024
WORKER_CPU_SECONDS = 6
WORKER_TIMEOUT_SECONDS = 10


class DocumentExtractionError(ValueError):
    """Kullanıcıya güvenle gösterilebilecek belge çıkarım hatası."""


def _set_worker_limits() -> None:
    """POSIX sistemlerde belge ayrıştırıcısını CPU ve adres alanı sınırları içinde tutar."""
    if _resource is None:
        return
    _resource.setrlimit(_resource.RLIMIT_AS, (WORKER_MEMORY_BYTES, WORKER_MEMORY_BYTES))
    _resource.setrlimit(_resource.RLIMIT_CPU, (WORKER_CPU_SECONDS, WORKER_CPU_SECONDS + 1))
    _resource.setrlimit(_resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))


def _extract_txt(contents: bytes) -> str:
    try:
        return contents.decode("utf-8")[:MAX_EXTRACTED_TEXT]
    except UnicodeDecodeError:
        return contents.decode("latin-1")[:MAX_EXTRACTED_TEXT]


def _extract_pdf(contents: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(contents), strict=True)
    if reader.is_encrypted:
        raise DocumentExtractionError("Şifreli PDF dosyaları desteklenmiyor.")
    if len(reader.pages) > MAX_PDF_PAGES:
        raise DocumentExtractionError(f"PDF en fazla {MAX_PDF_PAGES} sayfa olabilir.")

    chunks: list[str] = []
    total = 0
    for page in reader.pages:
        remaining = MAX_EXTRACTED_TEXT - total
        if remaining <= 0:
            break
        text = (page.extract_text() or "")[:remaining]
        chunks.append(text)
        total += len(text)
    return "\n".join(chunks)[:MAX_EXTRACTED_TEXT]


def _validate_docx_archive(contents: bytes) -> None:
    with zipfile.ZipFile(io.BytesIO(contents)) as archive:
        entries = archive.infolist()
        if len(entries) > MAX_DOCX_ENTRIES:
            raise DocumentExtractionError("DOCX çok fazla iç dosya içeriyor.")
        total_uncompressed = sum(item.file_size for item in entries)
        if total_uncompressed > MAX_DOCX_UNCOMPRESSED:
            raise DocumentExtractionError("DOCX içeriği güvenli işleme sınırlarını aşıyor.")
        for item in entries:
            if item.flag_bits & 0x1:
                raise DocumentExtractionError("Şifreli DOCX dosyaları desteklenmiyor.")
            if item.compress_size and item.file_size / item.compress_size > 100:
                raise DocumentExtractionError("DOCX sıkıştırma oranı güvenli sınırı aşıyor.")


def _extract_docx(contents: bytes) -> str:
    from docx import Document

    _validate_docx_archive(contents)
    document = Document(io.BytesIO(contents))
    chunks: list[str] = []
    total = 0
    for paragraph in document.paragraphs:
        remaining = MAX_EXTRACTED_TEXT - total
        if remaining <= 0:
            break
        text = paragraph.text[:remaining]
        chunks.append(text)
        total += len(text)
    return "\n".join(chunks)[:MAX_EXTRACTED_TEXT]


def _worker(extension: str, contents: bytes, result_connection: Any) -> None:
    try:
        _set_worker_limits()
        if extension == "txt":
            text = _extract_txt(contents)
        elif extension == "pdf":
            text = _extract_pdf(contents)
        elif extension == "docx":
            text = _extract_docx(contents)
        else:
            raise DocumentExtractionError("Desteklenmeyen CV formatı.")
        result_connection.send(("ok", text))
    except DocumentExtractionError as exc:
        result_connection.send(("error", str(exc)))
    except (MemoryError, OSError):
        result_connection.send(("error", "Belge güvenli kaynak sınırlarını aşıyor."))
    except Exception:
        result_connection.send(("error", "Belge okunamadı. Metin tabanlı ve bozulmamış bir dosya yükleyin."))
    finally:
        result_connection.close()


def extract_document_text(extension: str, contents: bytes) -> str:
    """Belgeyi izole ve kaynak sınırlı bir alt süreçte metne dönüştürür."""
    context = mp.get_context("spawn")
    parent_connection, child_connection = context.Pipe(duplex=False)
    process = context.Process(target=_worker, args=(extension, contents, child_connection), daemon=True)
    process.start()
    child_connection.close()

    if not parent_connection.poll(WORKER_TIMEOUT_SECONDS):
        process.terminate()
        process.join(1)
        if process.is_alive():
            process.kill()
            process.join(1)
        parent_connection.close()
        raise DocumentExtractionError("Belgenin işlenmesi güvenli süre sınırını aştı.")

    try:
        status, payload = parent_connection.recv()
    except EOFError as exc:
        raise DocumentExtractionError("Belge güvenli kaynak sınırları içinde işlenemedi.") from exc
    finally:
        parent_connection.close()
        process.join(1)
        if process.is_alive():
            process.terminate()
            process.join(1)

    if status != "ok":
        raise DocumentExtractionError(str(payload))
    return str(payload)[:MAX_EXTRACTED_TEXT]
