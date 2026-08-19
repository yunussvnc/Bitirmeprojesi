import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

import cloud_storage
import models
from app.dependencies import get_current_user, get_db
from app.services.media_processor import MediaProcessor
from app.services.upload_validator import validate_image_upload, validate_video_upload

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = logging.getLogger("asemos.upload")

_uploads_dir = Path(__file__).resolve().parents[2] / "uploads"
UploadPurpose = Literal["post", "story", "message", "avatar", "review", "venue"]


def _authorize_upload(
    user: models.User,
    purpose: UploadPurpose,
    place_id: int | None,
    db: Session,
) -> str:
    if not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Dosya yüklemek için e-posta adresinizi doğrulamanız gerekir.",
        )
    if purpose == "venue" and user.role not in {"venue", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="Mekan medyası yükleme yetkiniz bulunmamaktadır.",
        )
    if purpose == "venue":
        if place_id is None:
            raise HTTPException(status_code=400, detail="Mekan yüklemeleri için place_id zorunludur.")
        place = db.query(models.Place).filter(models.Place.id == place_id).first()
        if not place:
            raise HTTPException(status_code=404, detail="Mekan bulunamadı.")
        if user.role == "venue" and place.owner_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Bu mekan için medya yükleme yetkiniz bulunmamaktadır.",
            )
        return f"asemos/venue/place_{place_id}/user_{user.id}"
    if place_id is not None:
        raise HTTPException(status_code=400, detail="place_id yalnızca mekan yüklemelerinde kullanılabilir.")
    return f"asemos/{purpose}/user_{user.id}"


def _save_local_variants(
    *,
    user_id: int,
    purpose: UploadPurpose,
    place_id: int | None,
    variants: dict,
) -> dict:
    if purpose == "venue" and place_id is not None:
        relative_dir = Path("venue") / f"place_{place_id}" / f"user_{user_id}"
    else:
        relative_dir = Path(str(user_id)) / purpose
    target_dir = _uploads_dir / relative_dir
    target_dir.mkdir(mode=0o750, parents=True, exist_ok=True)
    base_filename = uuid.uuid4().hex
    staging_dir = Path(tempfile.mkdtemp(prefix=".upload-", dir=target_dir))
    final_dir = target_dir / base_filename

    outputs = {
        "full": variants["full_bytes"],
        "medium": variants["medium_bytes"],
        "thumb": variants["thumbnail_bytes"],
    }
    try:
        for suffix, contents in outputs.items():
            path = staging_dir / f"{suffix}.webp"
            with path.open("xb") as output:
                output.write(contents)
            os.chmod(path, 0o640)
        os.replace(staging_dir, final_dir)
    except BaseException:
        shutil.rmtree(staging_dir, ignore_errors=True)
        shutil.rmtree(final_dir, ignore_errors=True)
        raise

    url_prefix = f"/uploads/{relative_dir.as_posix()}/{base_filename}"
    return {
        "url": f"{url_prefix}/full.webp",
        "medium_url": f"{url_prefix}/medium.webp",
        "thumbnail_url": f"{url_prefix}/thumb.webp",
        "blurhash": variants.get("blurhash"),
        "public_id": f"{relative_dir.as_posix()}/{base_filename}",
    }


@router.get("/status")
def upload_status(
    _current_user: Annotated[models.User, Depends(get_current_user)],
):
    """Kimliği doğrulanmış istemci için cloud storage durumunu döndürür."""
    return {"configured": cloud_storage.is_configured()}


@router.post("/image")
async def upload_image(
    file: Annotated[UploadFile, File()],
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    purpose: Annotated[UploadPurpose, Query()] = "post",
    place_id: Annotated[int | None, Query(gt=0)] = None,
):
    """Doğrulanmış JPG/PNG/GIF/WebP görseli güvenli WebP varyantlarına dönüştürür."""
    folder = await run_in_threadpool(_authorize_upload, current_user, purpose, place_id, db)
    upload = await validate_image_upload(file)

    try:
        variants = await run_in_threadpool(
            MediaProcessor.process_variants,
            upload.contents,
        )
        if cloud_storage.is_configured():
            result = await run_in_threadpool(
                cloud_storage.upload_image_variants,
                variants,
                folder,
            )
        else:
            result = await run_in_threadpool(
                _save_local_variants,
                user_id=current_user.id,
                purpose=purpose,
                place_id=place_id,
                variants=variants,
            )
        return {
            **result,
            "content_type": "image/webp",
            "source_size": upload.size,
        }
    except HTTPException:
        raise
    except Exception:
        logger.error("Görsel yükleme başarısız (user=%s)", current_user.id)
        raise HTTPException(status_code=500, detail="Görsel yüklenemedi.")


@router.post("/video")
async def upload_video(
    file: Annotated[UploadFile, File()],
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    purpose: Annotated[UploadPurpose, Query()] = "post",
    place_id: Annotated[int | None, Query(gt=0)] = None,
):
    """Doğrulanmış ve sınırlandırılmış video dosyasını kullanıcı namespace’ine yükler."""
    folder = await run_in_threadpool(_authorize_upload, current_user, purpose, place_id, db)
    if not cloud_storage.is_configured():
        raise HTTPException(status_code=503, detail="Cloud storage yapılandırılmamış.")

    upload = await validate_video_upload(file)
    if not upload.temp_path:
        raise HTTPException(status_code=500, detail="Video işleme sırasında hata oluştu.")

    try:
        result = await run_in_threadpool(
            cloud_storage.upload_video,
            upload.temp_path,
            folder,
        )
        return {
            **result,
            "content_type": upload.mime_type,
            "source_size": upload.size,
            "validated_duration": upload.duration,
        }
    except Exception:
        logger.error("Video yükleme başarısız (user=%s)", current_user.id)
        raise HTTPException(status_code=500, detail="Video yüklenemedi.")
    finally:
        try:
            os.unlink(upload.temp_path)
        except FileNotFoundError:
            pass
