import asyncio
import io
import json
import os
import subprocess
import tempfile
import warnings
from dataclasses import dataclass
from pathlib import Path

import anyio
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

READ_CHUNK_SIZE = 1024 * 1024
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024
MAX_IMAGE_PIXELS = 24_000_000
MAX_IMAGE_WIDTH = 8_000
MAX_IMAGE_HEIGHT = 8_000
MAX_VIDEO_DURATION_SECONDS = 5 * 60
MAX_VIDEO_WIDTH = 3_840
MAX_VIDEO_HEIGHT = 2_160

IMAGE_FORMATS = {
    "jpeg": {
        "extensions": {"jpg", "jpeg"},
        "mimes": {"image/jpeg", "image/jpg"},
    },
    "png": {"extensions": {"png"}, "mimes": {"image/png"}},
    "gif": {"extensions": {"gif"}, "mimes": {"image/gif"}},
    "webp": {"extensions": {"webp"}, "mimes": {"image/webp"}},
}

VIDEO_FORMATS = {
    "mp4": {
        "extensions": {"mp4", "m4v"},
        "mimes": {"video/mp4", "video/x-m4v"},
    },
    "mov": {"extensions": {"mov"}, "mimes": {"video/quicktime"}},
    "avi": {"extensions": {"avi"}, "mimes": {"video/x-msvideo", "video/avi"}},
    "matroska": {"extensions": {"mkv"}, "mimes": {"video/x-matroska"}},
    "webm": {"extensions": {"webm"}, "mimes": {"video/webm"}},
}


@dataclass(frozen=True)
class ValidatedUpload:
    contents: bytes | None
    detected_format: str
    mime_type: str
    extension: str
    size: int
    width: int | None = None
    height: int | None = None
    duration: float | None = None
    temp_path: str | None = None


def _normalized_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        raise HTTPException(status_code=400, detail="Dosya uzantısı zorunludur.")
    extension = Path(filename).suffix.lower().lstrip(".")
    if not extension or len(extension) > 10:
        raise HTTPException(status_code=400, detail="Geçersiz dosya uzantısı.")
    return extension


def _normalized_mime(content_type: str | None) -> str:
    if not content_type:
        raise HTTPException(status_code=400, detail="Content-Type zorunludur.")
    return content_type.split(";", 1)[0].strip().lower()


async def _read_bounded(file: UploadFile, max_bytes: int, label: str) -> bytes:
    chunks: list[bytes] = []
    total = 0
    try:
        while True:
            chunk = await file.read(READ_CHUNK_SIZE)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                mb = max_bytes // (1024 * 1024)
                raise HTTPException(
                    status_code=413,
                    detail=f"{label} {mb}MB'dan büyük olamaz.",
                )
            chunks.append(chunk)
    finally:
        with anyio.CancelScope(shield=True):
            await file.close()

    if total == 0:
        raise HTTPException(status_code=400, detail="Boş dosya yüklenemez.")
    return b"".join(chunks)


async def _write_bounded_temp(
    file: UploadFile,
    max_bytes: int,
    label: str,
    suffix: str,
) -> tuple[str, int]:
    descriptor, path = tempfile.mkstemp(suffix=suffix)
    os.close(descriptor)
    total = 0
    try:
        async with await anyio.open_file(path, "wb") as output:
            while True:
                chunk = await file.read(READ_CHUNK_SIZE)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    mb = max_bytes // (1024 * 1024)
                    raise HTTPException(
                        status_code=413,
                        detail=f"{label} {mb}MB'dan büyük olamaz.",
                    )
                await output.write(chunk)
    except BaseException:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass
        raise
    finally:
        with anyio.CancelScope(shield=True):
            await file.close()

    if total == 0:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass
        raise HTTPException(status_code=400, detail="Boş dosya yüklenemez.")
    return path, total


def _detect_image_format(contents: bytes) -> str | None:
    if contents.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if contents.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP":
        return "webp"
    return None


def _validate_declared_type(
    *,
    extension: str,
    mime_type: str,
    detected_format: str,
    formats: dict[str, dict[str, set[str]]],
) -> None:
    policy = formats.get(detected_format)
    if not policy:
        raise HTTPException(status_code=415, detail="Desteklenmeyen dosya biçimi.")
    if extension not in policy["extensions"]:
        raise HTTPException(
            status_code=415,
            detail="Dosya uzantısı gerçek içerik biçimiyle uyuşmuyor.",
        )
    if mime_type not in policy["mimes"]:
        raise HTTPException(
            status_code=415,
            detail="Content-Type gerçek dosya içeriğiyle uyuşmuyor.",
        )


def _inspect_image(contents: bytes) -> tuple[str, int, int]:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(contents)) as image:
                width, height = image.size
                if (
                    width <= 0
                    or height <= 0
                    or width > MAX_IMAGE_WIDTH
                    or height > MAX_IMAGE_HEIGHT
                    or width * height > MAX_IMAGE_PIXELS
                ):
                    raise HTTPException(
                        status_code=413,
                        detail="Görsel çözünürlüğü izin verilen sınırı aşıyor.",
                    )
                image.verify()
            with Image.open(io.BytesIO(contents)) as image:
                detected = (image.format or "").lower()
                width, height = image.size
                frames = getattr(image, "n_frames", 1)
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=413, detail="Görsel piksel sınırını aşıyor.")
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(status_code=415, detail="Geçersiz veya bozuk görsel dosyası.")

    if detected == "jpg":
        detected = "jpeg"
    if frames > 1:
        raise HTTPException(status_code=415, detail="Animasyonlu görseller desteklenmiyor.")
    return detected, width, height


def _video_format_from_probe(format_name: str, extension: str) -> str | None:
    names = {value.strip().lower() for value in format_name.split(",")}
    if "webm" in names:
        return "webm"
    if "matroska" in names:
        return "matroska"
    if "avi" in names:
        return "avi"
    if "mov" in names or "mp4" in names or "m4a" in names or "3gp" in names:
        return "mov" if extension == "mov" else "mp4"
    return None


def _inspect_video_sync(path: str, extension: str) -> tuple[str, int, int, float]:
    try:
        completed = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_type,width,height:format=format_name,duration",
                "-of",
                "json",
                path,
            ],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        if completed.returncode != 0:
            raise HTTPException(status_code=415, detail="Geçersiz veya bozuk video dosyası.")
        probe = json.loads(completed.stdout or "{}")
        streams = probe.get("streams") or []
        if not streams or streams[0].get("codec_type") != "video":
            raise HTTPException(status_code=415, detail="Dosyada video akışı bulunamadı.")
        width = int(streams[0].get("width") or 0)
        height = int(streams[0].get("height") or 0)
        duration = float((probe.get("format") or {}).get("duration") or 0)
        detected = _video_format_from_probe(
            (probe.get("format") or {}).get("format_name") or "",
            extension,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Video doğrulama servisi kullanılamıyor.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=415, detail="Video doğrulaması zaman aşımına uğradı.")
    except (json.JSONDecodeError, TypeError, ValueError):
        raise HTTPException(status_code=415, detail="Video bilgileri doğrulanamadı.")
    if not detected:
        raise HTTPException(status_code=415, detail="Desteklenmeyen video biçimi.")
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=415, detail="Geçersiz video boyutları.")
    if width > MAX_VIDEO_WIDTH or height > MAX_VIDEO_HEIGHT:
        raise HTTPException(status_code=413, detail="Video çözünürlüğü 4K sınırını aşıyor.")
    if duration <= 0 or duration > MAX_VIDEO_DURATION_SECONDS:
        raise HTTPException(status_code=413, detail="Video süresi 5 dakikadan uzun olamaz.")
    return detected, width, height, duration


async def validate_image_upload(file: UploadFile) -> ValidatedUpload:
    extension = _normalized_extension(file.filename)
    mime_type = _normalized_mime(file.content_type)
    contents = await _read_bounded(file, MAX_IMAGE_SIZE, "Görsel")
    signature_format = _detect_image_format(contents)
    if not signature_format:
        raise HTTPException(status_code=415, detail="Görsel dosya imzası tanınmadı.")
    detected, width, height = await asyncio.to_thread(_inspect_image, contents)
    if detected != signature_format:
        raise HTTPException(status_code=415, detail="Görsel dosya imzası ve içeriği uyuşmuyor.")
    _validate_declared_type(
        extension=extension,
        mime_type=mime_type,
        detected_format=detected,
        formats=IMAGE_FORMATS,
    )
    return ValidatedUpload(
        contents=contents,
        detected_format=detected,
        mime_type=mime_type,
        extension=extension,
        size=len(contents),
        width=width,
        height=height,
    )


async def validate_video_upload(file: UploadFile) -> ValidatedUpload:
    extension = _normalized_extension(file.filename)
    mime_type = _normalized_mime(file.content_type)
    if extension not in {ext for item in VIDEO_FORMATS.values() for ext in item["extensions"]}:
        raise HTTPException(status_code=415, detail="Desteklenmeyen video uzantısı.")
    if mime_type not in {mime for item in VIDEO_FORMATS.values() for mime in item["mimes"]}:
        raise HTTPException(status_code=415, detail="Desteklenmeyen video Content-Type değeri.")
    path, size = await _write_bounded_temp(
        file,
        MAX_VIDEO_SIZE,
        "Video",
        f".{extension}",
    )
    try:
        detected, width, height, duration = await asyncio.to_thread(
            _inspect_video_sync,
            path,
            extension,
        )
        _validate_declared_type(
            extension=extension,
            mime_type=mime_type,
            detected_format=detected,
            formats=VIDEO_FORMATS,
        )
        return ValidatedUpload(
            contents=None,
            detected_format=detected,
            mime_type=mime_type,
            extension=extension,
            size=size,
            width=width,
            height=height,
            duration=duration,
            temp_path=path,
        )
    except BaseException:
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass
        raise
