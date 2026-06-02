# routers/upload.py — Dosya yükleme endpoint'leri (MIME doğrulama dahil)

import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends

import models
import cloud_storage
from app.dependencies import get_current_user
from app.services.media_processor import MediaProcessor

router = APIRouter(prefix="/upload", tags=["Upload"])

_uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "heic", "heif"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}
ALLOWED_IMAGE_MIMES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/heic", "image/heif",
}
ALLOWED_VIDEO_MIMES = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/x-matroska", "video/webm",
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB


def _validate_extension(filename: str | None, allowed: set[str]) -> str:
    """Dosya uzantısını doğrular ve döndürür."""
    ext = (filename or "file.bin").rsplit(".", 1)[-1].lower() if filename else ""
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz dosya türü '.{ext}'. İzin verilen: {', '.join(sorted(allowed))}"
        )
    return ext


def _validate_mime(content_type: str | None, allowed: set[str]) -> None:
    """MIME type doğrulaması — sahte dosya yüklemelerine karşı koruma."""
    if content_type and content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz MIME türü '{content_type}'. Dosya uzantısı ve içeriği uyuşmuyor olabilir."
        )


def _validate_size(contents: bytes, max_bytes: int, label: str) -> None:
    """Dosya boyutu sınır kontrolü."""
    if len(contents) > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"{label} {mb}MB'dan büyük olamaz.")


@router.get("/status")
def upload_status():
    """Cloud storage yapılandırma durumunu kontrol eder."""
    return {"configured": cloud_storage.is_configured()}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """
    Görsel yükler. Desteklenen formatlar: JPG, PNG, GIF, WebP, HEIC.
    Maksimum boyut: 10MB.
    """
    ext = _validate_extension(file.filename, ALLOWED_IMAGE_EXTENSIONS)
    _validate_mime(file.content_type, ALLOWED_IMAGE_MIMES)

    contents = await file.read()
    _validate_size(contents, MAX_IMAGE_SIZE, "Görsel")

    from fastapi.concurrency import run_in_threadpool

    # Media Optimizasyonu (Event loop bloke olmaması için threadpool'da çalıştırılır)
    variants = await run_in_threadpool(MediaProcessor.process_variants, contents)

    if cloud_storage.is_configured():
        try:
            result = await run_in_threadpool(cloud_storage.upload_image_variants, variants)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")
    else:
        # Local fallback — Cloudinary yoksa uploads/ klasörüne kaydet
        os.makedirs(_uploads_dir, exist_ok=True)
        base_filename = uuid.uuid4().hex
        
        full_path = os.path.join(_uploads_dir, f"{base_filename}_full.webp")
        with open(full_path, "wb") as f:
            f.write(variants["full_bytes"])
            
        med_path = os.path.join(_uploads_dir, f"{base_filename}_medium.webp")
        with open(med_path, "wb") as f:
            f.write(variants["medium_bytes"])
            
        thumb_path = os.path.join(_uploads_dir, f"{base_filename}_thumb.webp")
        with open(thumb_path, "wb") as f:
            f.write(variants["thumbnail_bytes"])
            
        return {
            "url": f"/uploads/{base_filename}_full.webp",
            "medium_url": f"/uploads/{base_filename}_medium.webp",
            "thumbnail_url": f"/uploads/{base_filename}_thumb.webp",
            "blurhash": variants.get("blurhash"),
            "public_id": base_filename
        }


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """
    Video yükler. Desteklenen formatlar: MP4, MOV, AVI, MKV, WebM.
    Maksimum boyut: 100MB. Cloud storage yapılandırması gerektirir.
    """
    if not cloud_storage.is_configured():
        raise HTTPException(status_code=503, detail="Cloud storage yapılandırılmamış.")

    _validate_extension(file.filename, ALLOWED_VIDEO_EXTENSIONS)
    _validate_mime(file.content_type, ALLOWED_VIDEO_MIMES)

    contents = await file.read()
    _validate_size(contents, MAX_VIDEO_SIZE, "Video")

    try:
        result = cloud_storage.upload_video(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")
