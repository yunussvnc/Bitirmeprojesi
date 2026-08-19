import asyncio
import io
import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from starlette.datastructures import Headers

from app.middleware import upload_size
from app.routers import upload as upload_router
from app.services import upload_validator
from app.services.media_processor import MediaProcessor
from tests.conftest import (
    create_test_place,
    create_test_user,
    create_venue_user,
    get_auth_headers,
)


def _image_bytes(format_name: str = "PNG", size: tuple[int, int] = (16, 12)) -> bytes:
    output = io.BytesIO()
    Image.new("RGB", size, (22, 100, 180)).save(output, format=format_name)
    return output.getvalue()


def _animated_gif_bytes() -> bytes:
    output = io.BytesIO()
    frames = [Image.new("RGB", (8, 8), color) for color in ("red", "blue")]
    frames[0].save(
        output,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=100,
        loop=0,
    )
    return output.getvalue()


def _upload_file(contents: bytes, filename: str, content_type: str) -> UploadFile:
    return UploadFile(
        file=io.BytesIO(contents),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


def test_upload_status_requires_authentication(client):
    response = client.get("/api/v1/upload/status")
    assert response.status_code == 401


def test_content_length_limit_rejects_before_auth_and_multipart_parse(client):
    response = client.post(
        "/api/v1/upload/image",
        headers={"content-length": str(13 * 1024 * 1024)},
        content=b"x",
    )
    assert response.status_code == 413


def test_chunked_upload_is_limited_without_content_length(monkeypatch):
    path = "/api/v1/upload/image"
    monkeypatch.setitem(upload_size.UPLOAD_REQUEST_LIMITS, path, 8)
    sent = []
    messages = iter(
        [
            {"type": "http.request", "body": b"12345", "more_body": True},
            {"type": "http.request", "body": b"6789", "more_body": False},
        ]
    )

    async def receive():
        return next(messages)

    async def send(message):
        sent.append(message)

    async def downstream(_scope, limited_receive, buffered_send):
        while True:
            message = await limited_receive()
            if not message.get("more_body", False):
                break
        await buffered_send({"type": "http.response.start", "status": 200, "headers": []})
        await buffered_send({"type": "http.response.body", "body": b"ok"})

    middleware = upload_size.UploadContentLengthMiddleware(downstream)
    scope = {"type": "http", "path": path, "headers": []}
    asyncio.run(middleware(scope, receive, send))

    statuses = [message["status"] for message in sent if message["type"] == "http.response.start"]
    assert statuses == [413]


def test_full_middleware_stack_returns_single_413_for_chunked_upload(client, monkeypatch):
    path = "/api/v1/upload/image"
    monkeypatch.setitem(upload_size.UPLOAD_REQUEST_LIMITS, path, 8)
    user_id = create_test_user(email="chunked-upload@test.com", username="chunkedupload")
    auth_value = get_auth_headers(user_id)["Authorization"].encode()
    boundary = b"upload-boundary"
    body = (
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="file"; filename="photo.png"\r\n'
        b"Content-Type: image/png\r\n\r\n"
        b"more-than-eight-bytes\r\n--" + boundary + b"--\r\n"
    )
    chunks = iter(
        [
            {"type": "http.request", "body": body[:5], "more_body": True},
            {"type": "http.request", "body": body[5:], "more_body": False},
        ]
    )
    sent = []

    async def receive():
        return next(chunks, {"type": "http.disconnect"})

    async def send(message):
        sent.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "root_path": "",
        "headers": [
            (b"authorization", auth_value),
            (b"content-type", b"multipart/form-data; boundary=" + boundary),
        ],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }
    asyncio.run(client.app(scope, receive, send))

    statuses = [message["status"] for message in sent if message["type"] == "http.response.start"]
    assert statuses == [413]


def test_unverified_user_cannot_upload(client):
    user_id = create_test_user(
        email="unverified-upload@test.com",
        username="unverifiedupload",
        is_email_verified=False,
    )
    response = client.post(
        "/api/v1/upload/image",
        headers=get_auth_headers(user_id),
        files={"file": ("photo.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 403
    assert "doğrulamanız" in response.json()["detail"]


def test_standard_user_cannot_upload_venue_media(client):
    user_id = create_test_user(email="venue-denied@test.com", username="venuedenied")
    response = client.post(
        "/api/v1/upload/image?purpose=venue",
        headers=get_auth_headers(user_id),
        files={"file": ("photo.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 403


def test_venue_role_cannot_upload_media_for_unowned_place(client):
    user_id = create_test_user(
        email="venue-no-place@test.com",
        username="venuenoplace",
        role="venue",
    )
    place_id = create_test_place(name="Unowned Venue")
    response = client.post(
        f"/api/v1/upload/image?purpose=venue&place_id={place_id}",
        headers=get_auth_headers(user_id),
        files={"file": ("photo.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 403


def test_venue_owner_upload_is_namespaced(client, tmp_path, monkeypatch):
    user_id, place_id = create_venue_user(
        email="venue-owner-upload@test.com",
        username="venueownerupload",
    )
    monkeypatch.setattr(upload_router, "_uploads_dir", tmp_path)
    monkeypatch.setattr(upload_router.cloud_storage, "is_configured", lambda: False)
    response = client.post(
        f"/api/v1/upload/image?purpose=venue&place_id={place_id}",
        headers=get_auth_headers(user_id),
        files={"file": ("venue.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 200, response.text
    assert response.json()["url"].startswith(
        f"/uploads/venue/place_{place_id}/user_{user_id}/"
    )


def test_venue_upload_requires_place_id(client):
    user_id, _ = create_venue_user(
        email="venue-place-required@test.com",
        username="venueplacerequired",
    )
    response = client.post(
        "/api/v1/upload/image?purpose=venue",
        headers=get_auth_headers(user_id),
        files={"file": ("venue.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 400


def test_admin_can_upload_for_existing_venue(client, tmp_path, monkeypatch):
    admin_id = create_test_user(
        email="admin-venue-upload@test.com",
        username="adminvenueupload",
        role="admin",
    )
    place_id = create_test_place(name="Admin Managed Venue")
    monkeypatch.setattr(upload_router, "_uploads_dir", tmp_path)
    monkeypatch.setattr(upload_router.cloud_storage, "is_configured", lambda: False)

    response = client.post(
        f"/api/v1/upload/image?purpose=venue&place_id={place_id}",
        headers=get_auth_headers(admin_id),
        files={"file": ("venue.png", _image_bytes(), "image/png")},
    )

    assert response.status_code == 200, response.text
    assert response.json()["url"].startswith(
        f"/uploads/venue/place_{place_id}/user_{admin_id}/"
    )


def test_valid_image_is_reencoded_and_namespaced_to_owner(client, tmp_path, monkeypatch):
    user_id = create_test_user(email="upload-ok@test.com", username="uploadok")
    monkeypatch.setattr(upload_router, "_uploads_dir", tmp_path)
    monkeypatch.setattr(upload_router.cloud_storage, "is_configured", lambda: False)

    response = client.post(
        "/api/v1/upload/image?purpose=avatar",
        headers=get_auth_headers(user_id),
        files={"file": ("profile.png", _image_bytes(), "image/png")},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["url"].startswith(f"/uploads/{user_id}/avatar/")
    assert payload["content_type"] == "image/webp"
    created = list((tmp_path / str(user_id) / "avatar").rglob("*.webp"))
    assert len(created) == 3
    for path in created:
        with Image.open(path) as image:
            assert image.format == "WEBP"
            assert image.getexif() == {}


def test_local_variant_write_failure_leaves_no_public_artifacts(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_router, "_uploads_dir", tmp_path)
    chmod_calls = 0

    def fail_second_chmod(_path, _mode):
        nonlocal chmod_calls
        chmod_calls += 1
        if chmod_calls == 2:
            raise OSError("disk failure")

    monkeypatch.setattr(upload_router.os, "chmod", fail_second_chmod)

    with pytest.raises(OSError, match="disk failure"):
        upload_router._save_local_variants(
            user_id=42,
            purpose="avatar",
            place_id=None,
            variants={
                "full_bytes": b"full",
                "medium_bytes": b"medium",
                "thumbnail_bytes": b"thumb",
            },
        )

    assert list(tmp_path.rglob("*.webp")) == []
    assert not any(path.name.startswith(".upload-") for path in tmp_path.rglob("*"))


def test_cloud_storage_error_does_not_leak_provider_details(client, monkeypatch):
    user_id = create_test_user(email="cloud-error@test.com", username="clouderr")
    monkeypatch.setattr(upload_router.cloud_storage, "is_configured", lambda: True)

    def fail_upload(*args, **kwargs):
        raise RuntimeError("CLOUDINARY_API_SECRET=do-not-leak")

    monkeypatch.setattr(upload_router.cloud_storage, "upload_image_variants", fail_upload)
    response = client.post(
        "/api/v1/upload/image",
        headers=get_auth_headers(user_id),
        files={"file": ("photo.png", _image_bytes(), "image/png")},
    )
    assert response.status_code == 500
    assert response.json() == {"detail": "Görsel yüklenemedi."}
    assert "do-not-leak" not in response.text


def test_cloud_variant_failure_rolls_back_uploaded_objects(monkeypatch):
    uploads = 0
    destroyed = []

    def fake_upload(*_args, **_kwargs):
        nonlocal uploads
        uploads += 1
        if uploads == 1:
            return {
                "secure_url": "https://cdn.example/full.webp",
                "public_id": "folder/full-id",
            }
        raise RuntimeError("provider failed")

    def fake_destroy(public_id, **_kwargs):
        destroyed.append(public_id)

    monkeypatch.setattr(upload_router.cloud_storage, "_ensure_configured", lambda: None)
    monkeypatch.setattr(upload_router.cloud_storage.cloudinary.uploader, "upload", fake_upload)
    monkeypatch.setattr(upload_router.cloud_storage.cloudinary.uploader, "destroy", fake_destroy)

    with pytest.raises(RuntimeError, match="provider failed"):
        upload_router.cloud_storage.upload_image_variants(
            {
                "full_bytes": b"full",
                "medium_bytes": b"medium",
                "thumbnail_bytes": b"thumb",
            }
        )

    assert destroyed == ["folder/full-id"]


def test_video_upload_uses_disk_backed_source_and_removes_temp_file(
    client,
    tmp_path,
    monkeypatch,
):
    user_id = create_test_user(email="video-upload@test.com", username="videoupload")
    temp_path = tmp_path / "validated.mp4"
    temp_path.write_bytes(b"validated-video")
    captured = {}

    async def fake_validate(_file):
        return upload_validator.ValidatedUpload(
            contents=None,
            detected_format="mp4",
            mime_type="video/mp4",
            extension="mp4",
            size=temp_path.stat().st_size,
            width=1280,
            height=720,
            duration=12.5,
            temp_path=str(temp_path),
        )

    def fake_upload(file_source, folder):
        captured["source"] = file_source
        captured["folder"] = folder
        assert temp_path.exists()
        return {
            "url": "https://cdn.example/video.mp4",
            "public_id": "video-id",
            "thumbnail_url": "https://cdn.example/video.jpg",
        }

    monkeypatch.setattr(upload_router.cloud_storage, "is_configured", lambda: True)
    monkeypatch.setattr(upload_router, "validate_video_upload", fake_validate)
    monkeypatch.setattr(upload_router.cloud_storage, "upload_video", fake_upload)

    response = client.post(
        "/api/v1/upload/video?purpose=story",
        headers=get_auth_headers(user_id),
        files={"file": ("clip.mp4", b"request-body", "video/mp4")},
    )

    assert response.status_code == 200, response.text
    assert captured == {
        "source": str(temp_path),
        "folder": f"asemos/story/user_{user_id}",
    }
    assert temp_path.exists() is False


def test_filename_and_mime_must_match_real_image_content(client):
    user_id = create_test_user(email="mime-spoof@test.com", username="mimespoof")
    response = client.post(
        "/api/v1/upload/image",
        headers=get_auth_headers(user_id),
        files={"file": ("fake.jpg", _image_bytes("PNG"), "image/jpeg")},
    )
    assert response.status_code == 415


@pytest.mark.parametrize(
    ("filename", "content_type", "contents"),
    [
        ("payload.jpg", "image/jpeg", b"<script>alert(1)</script>"),
        ("empty.png", "image/png", b""),
        ("animated.gif", "image/gif", _animated_gif_bytes()),
    ],
)
def test_invalid_image_payloads_are_rejected(
    client,
    filename,
    content_type,
    contents,
):
    user_id = create_test_user(
        email=f"{filename.replace('.', '-')}@test.com",
        username=filename.replace(".", "")[:20],
    )
    response = client.post(
        "/api/v1/upload/image",
        headers=get_auth_headers(user_id),
        files={"file": (filename, contents, content_type)},
    )
    assert response.status_code in {400, 415}


def test_streaming_reader_stops_at_size_limit(monkeypatch):
    monkeypatch.setattr(upload_validator, "MAX_IMAGE_SIZE", 8)
    file = _upload_file(b"123456789", "small.png", "image/png")
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(upload_validator.validate_image_upload(file))
    assert exc_info.value.status_code == 413
    assert file.file.closed is True


def test_video_temp_file_is_removed_when_copy_is_cancelled(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_validator.tempfile, "tempdir", str(tmp_path))

    class CancellingUpload:
        filename = "clip.mp4"
        content_type = "video/mp4"

        def __init__(self):
            self.read_count = 0
            self.closed = False

        async def read(self, _size):
            self.read_count += 1
            if self.read_count == 1:
                return b"partial-video"
            raise asyncio.CancelledError

        async def close(self):
            self.closed = True

    file = CancellingUpload()
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(upload_validator.validate_video_upload(file))

    assert file.closed is True
    assert list(tmp_path.iterdir()) == []


def test_video_temp_file_is_removed_when_probe_is_cancelled(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_validator.tempfile, "tempdir", str(tmp_path))

    async def cancel_probe(*_args, **_kwargs):
        raise asyncio.CancelledError

    monkeypatch.setattr(upload_validator.asyncio, "to_thread", cancel_probe)
    file = _upload_file(b"video-container", "clip.mp4", "video/mp4")

    with pytest.raises(asyncio.CancelledError):
        asyncio.run(upload_validator.validate_video_upload(file))

    assert file.file.closed is True
    assert list(tmp_path.iterdir()) == []


def test_image_pixel_limit_is_checked_before_processing(monkeypatch):
    monkeypatch.setattr(upload_validator, "MAX_IMAGE_PIXELS", 4)
    file = _upload_file(_image_bytes(size=(3, 2)), "wide.png", "image/png")
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(upload_validator.validate_image_upload(file))
    assert exc_info.value.status_code == 413


def test_media_processor_fails_closed_for_invalid_image():
    with pytest.raises(UnidentifiedImageError):
        MediaProcessor.process_variants(b"not-an-image")


def test_video_probe_result_must_match_extension_and_mime(monkeypatch):
    completed = SimpleNamespace(
        returncode=0,
        stdout=json.dumps(
            {
                "streams": [{"codec_type": "video", "width": 1280, "height": 720}],
                "format": {"format_name": "matroska,webm", "duration": "12.5"},
            }
        ),
    )
    monkeypatch.setattr(upload_validator.subprocess, "run", lambda *args, **kwargs: completed)
    file = _upload_file(b"fake-container", "clip.mp4", "video/mp4")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(upload_validator.validate_video_upload(file))
    assert exc_info.value.status_code == 415


def test_video_probe_enforces_duration(monkeypatch):
    completed = SimpleNamespace(
        returncode=0,
        stdout=json.dumps(
            {
                "streams": [{"codec_type": "video", "width": 1920, "height": 1080}],
                "format": {"format_name": "mov,mp4,m4a,3gp,3g2,mj2", "duration": "301"},
            }
        ),
    )
    monkeypatch.setattr(upload_validator.subprocess, "run", lambda *args, **kwargs: completed)
    file = _upload_file(b"fake-container", "clip.mp4", "video/mp4")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(upload_validator.validate_video_upload(file))
    assert exc_info.value.status_code == 413
