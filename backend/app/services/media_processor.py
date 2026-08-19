import io
import logging

from PIL import Image, ImageOps

logger = logging.getLogger("asemos")


class MediaProcessor:
    """Doğrulanmış görselleri metadata içermeyen WebP varyantlarına dönüştürür."""

    @staticmethod
    def _open_rgb(file_bytes: bytes) -> Image.Image:
        with Image.open(io.BytesIO(file_bytes)) as source:
            source.seek(0)
            image = ImageOps.exif_transpose(source)
            if image.mode != "RGB":
                image = image.convert("RGB")
            else:
                image = image.copy()
        return image

    @staticmethod
    def _encode_webp(image: Image.Image, quality: int) -> bytes:
        output = io.BytesIO()
        image.save(
            output,
            format="WEBP",
            quality=quality,
            method=6,
            exif=b"",
            icc_profile=None,
        )
        return output.getvalue()

    @staticmethod
    def compress_image(file_bytes: bytes, max_width: int = 1200, quality: int = 80) -> bytes:
        image = MediaProcessor._open_rgb(file_bytes)
        resized: Image.Image | None = None
        try:
            if image.width > max_width:
                ratio = max_width / float(image.width)
                resized = image.resize(
                    (max_width, max(1, int(image.height * ratio))),
                    Image.Resampling.LANCZOS,
                )
            return MediaProcessor._encode_webp(resized or image, quality)
        finally:
            if resized is not None:
                resized.close()
            image.close()

    @staticmethod
    def generate_thumbnail(
        file_bytes: bytes,
        size: tuple[int, int] = (300, 300),
        quality: int = 70,
    ) -> bytes:
        image = MediaProcessor._open_rgb(file_bytes)
        try:
            image.thumbnail(size, Image.Resampling.LANCZOS)
            return MediaProcessor._encode_webp(image, quality)
        finally:
            image.close()

    @staticmethod
    def generate_blurhash(file_bytes: bytes) -> str | None:
        image: Image.Image | None = None
        try:
            import blurhash

            image = MediaProcessor._open_rgb(file_bytes)
            image.thumbnail((32, 32), Image.Resampling.LANCZOS)
            return blurhash.encode(image, x_components=4, y_components=3)
        except (ImportError, OSError, TypeError, ValueError) as exc:
            logger.warning("Blurhash oluşturulamadı: %s", exc)
            return None
        finally:
            if image is not None:
                image.close()

    @staticmethod
    def process_variants(file_bytes: bytes) -> dict:
        """Üç güvenli WebP varyantı üretir; decode/encode hatasında başarısız olur."""
        image = MediaProcessor._open_rgb(file_bytes)
        full: Image.Image | None = None
        medium: Image.Image | None = None
        thumbnail: Image.Image | None = None
        try:
            full = image.copy()
            full.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

            medium = image.copy()
            medium.thumbnail((600, 600), Image.Resampling.LANCZOS)

            thumbnail = image.copy()
            thumbnail.thumbnail((150, 150), Image.Resampling.LANCZOS)

            return {
                "thumbnail_bytes": MediaProcessor._encode_webp(thumbnail, 70),
                "medium_bytes": MediaProcessor._encode_webp(medium, 80),
                "full_bytes": MediaProcessor._encode_webp(full, 85),
                "blurhash": MediaProcessor.generate_blurhash(file_bytes),
            }
        finally:
            for variant in (thumbnail, medium, full, image):
                if variant is not None:
                    variant.close()
