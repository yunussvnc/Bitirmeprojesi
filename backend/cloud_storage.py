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
