"""
Cloudinary entegrasyonu.

Kullanım:
  1. Cloudinary hesabı aç: https://cloudinary.com
  2. .env dosyasına ekle:
     CLOUDINARY_CLOUD_NAME=xxx
     CLOUDINARY_API_KEY=xxx
     CLOUDINARY_API_SECRET=xxx
"""

import cloudinary
import cloudinary.uploader
from config import get_settings

settings = get_settings()

_configured = False


def _ensure_configured():
    global _configured
    if _configured:
        return
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise RuntimeError(
            "Cloudinary yapılandırılmamış. "
            ".env dosyasına CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET ekleyin."
        )
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True


def is_configured() -> bool:
    return bool(settings.CLOUDINARY_CLOUD_NAME)


def upload_image(file_bytes: bytes, folder: str = "asemos/places") -> dict:
    _ensure_configured()
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
        transformation=[
            {"quality": "auto", "fetch_format": "auto"},
            {"width": 1200, "crop": "limit"},
        ],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
    }

def upload_image_variants(variants: dict, folder: str = "asemos/posts") -> dict:
    """
    3 farklı varyantı (thumbnail, medium, full) Cloudinary'ye yükler.
    Aslında Cloudinary tek bir master dosyadan dönüşüm yapabilir ama
    blurhash ve anlık progressive yükleme için 3 ayrı küçük dosya saklamak 
    agresif cache sisteminde (Munia style) daha performanslıdır.
    """
    _ensure_configured()
    
    import uuid
    base_id = uuid.uuid4().hex
    
    # Full (Master) upload
    res_full = cloudinary.uploader.upload(
        variants["full_bytes"],
        folder=folder,
        public_id=f"{base_id}_full",
        resource_type="image"
    )
    
    # Medium upload
    res_med = cloudinary.uploader.upload(
        variants["medium_bytes"],
        folder=folder,
        public_id=f"{base_id}_medium",
        resource_type="image"
    )
    
    # Thumbnail upload
    res_thumb = cloudinary.uploader.upload(
        variants["thumbnail_bytes"],
        folder=folder,
        public_id=f"{base_id}_thumb",
        resource_type="image"
    )
    
    return {
        "url": res_full["secure_url"],
        "medium_url": res_med["secure_url"],
        "thumbnail_url": res_thumb["secure_url"],
        "public_id": res_full["public_id"],
        "width": res_full.get("width"),
        "height": res_full.get("height"),
        "blurhash": variants.get("blurhash")
    }


def upload_video(file_bytes: bytes, folder: str = "asemos/videos") -> dict:
    _ensure_configured()
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="video",
    )
    thumbnail_url = cloudinary.utils.cloudinary_url(
        result["public_id"],
        resource_type="video",
        format="jpg",
        transformation=[{"width": 480, "crop": "limit"}],
    )[0]
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "thumbnail_url": thumbnail_url,
        "duration": result.get("duration"),
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
    }


def upload_from_url(image_url: str, folder: str = "asemos/places") -> dict:
    _ensure_configured()
    result = cloudinary.uploader.upload(
        image_url,
        folder=folder,
        resource_type="image",
        transformation=[
            {"quality": "auto", "fetch_format": "auto"},
            {"width": 1200, "crop": "limit"},
        ],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }
