import io
import logging
from PIL import Image

logger = logging.getLogger("asemos")

class MediaProcessor:
    """
    Yüklenen medyaları CDN (Bulut) yüklemesi öncesi optimize eder.
    Büyük (10MB+) fotoğrafları WebP formatında, belirlenen kalite ve
    boyutlara (thumbnail, medium) göre küçültür.
    """
    
    @staticmethod
    def compress_image(file_bytes: bytes, max_width: int = 1200, quality: int = 80) -> bytes:
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                # Renk profilini RGB'ye çevir (RGBA veya CMYK ise)
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                # Boyutlandırma (Genişlik sınırını aşıyorsa)
                if img.width > max_width:
                    ratio = max_width / float(img.width)
                    new_height = int(float(img.height) * float(ratio))
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                # WebP olarak belleğe yaz
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=quality)
                return output.getvalue()
        except Exception as e:
            logger.error(f"Görsel sıkıştırma hatası: {e}")
            return file_bytes  # Hata durumunda orijinal dosyayı dön

    @staticmethod
    def generate_thumbnail(file_bytes: bytes, size: tuple = (300, 300), quality: int = 70) -> bytes:
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                # Kare thumbnail için resmi ortadan kırparak küçült (thumbnail fonksiyonu in-place çalışır)
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=quality)
                return output.getvalue()
        except Exception as e:
            logger.error(f"Thumbnail oluşturma hatası: {e}")
            return file_bytes

    @staticmethod
    def generate_blurhash(file_bytes: bytes) -> str | None:
        """Küçük bir versiyonunu alıp blurhash string'i üretir."""
        try:
            import blurhash
            import numpy as np
            with Image.open(io.BytesIO(file_bytes)) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                # Blurhash hesabı için resmi çok küçültmek hızı artırır (ör: 32x32)
                img.thumbnail((32, 32), Image.Resampling.LANCZOS)
                image_array = np.array(img)
                return blurhash.encode(image_array, x_components=4, y_components=3)
        except Exception as e:
            logger.error(f"Blurhash oluşturma hatası: {e}")
            return None

    @staticmethod
    def process_variants(file_bytes: bytes) -> dict:
        """
        Gelen ham görselden 3 varyant (thumbnail, medium, full) ve blurhash üretir.
        Döndürdüğü dict:
        {
            "thumbnail_bytes": bytes,
            "medium_bytes": bytes,
            "full_bytes": bytes,
            "blurhash": str
        }
        """
        variants = {}
        variants["blurhash"] = MediaProcessor.generate_blurhash(file_bytes)
        
        # Thumbnail (150x150)
        variants["thumbnail_bytes"] = MediaProcessor.generate_thumbnail(file_bytes, size=(150, 150), quality=70)
        
        # Medium (600x600 - aspect ratio korunarak)
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.thumbnail((600, 600), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=80)
                variants["medium_bytes"] = output.getvalue()
        except Exception as e:
            logger.error(f"Medium varyant hatası: {e}")
            variants["medium_bytes"] = file_bytes
            
        # Full (max 1200px)
        variants["full_bytes"] = MediaProcessor.compress_image(file_bytes, max_width=1200, quality=85)
        
        return variants
