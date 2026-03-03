# routers/upload.py — Dosya yükleme endpoint'leri

import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File

import cloud_storage

router = APIRouter(prefix="/upload", tags=["Upload"])

_uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


@router.get("/status")
def upload_status():
    return {"configured": cloud_storage.is_configured()}


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Dosya 10MB'dan büyük olamaz.")

    if cloud_storage.is_configured():
        try:
            result = cloud_storage.upload_image(contents)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")
    else:
        # Local fallback — Cloudinary yoksa uploads/ klasörüne kaydet
        os.makedirs(_uploads_dir, exist_ok=True)
        ext = (file.filename or "image.jpg").rsplit(".", 1)[-1] if file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(_uploads_dir, filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        return {"url": f"/uploads/{filename}", "public_id": filename}


@router.post("/video")
async def upload_video(file: UploadFile = File(...)):
    if not cloud_storage.is_configured():
        raise HTTPException(status_code=503, detail="Cloud storage yapılandırılmamış.")
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video 100MB'dan büyük olamaz.")
    try:
        result = cloud_storage.upload_video(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yükleme hatası: {str(e)}")
