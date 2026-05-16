import re
import logging
from typing import Optional

logger = logging.getLogger("asemos")

# Basit bir küfür/spam sözlüğü (Örnek amaçlıdır, prodüksiyonda NLP modeli kullanılabilir)
BAD_WORDS = ["küfür1", "spam_link", "uygunsuzkelime"]

class AIModerator:
    """
    Gönderi (Post) ve Yorumların (Comment) içerik güvenliğini denetler.
    Güvenli değilse `is_flagged = True` olarak işaretlenmesini sağlar.
    """
    
    @staticmethod
    def moderate_text(text: Optional[str]) -> bool:
        """
        Metinde uygunsuz kelime varsa True (flagged), temizse False döner.
        """
        if not text:
            return False
            
        text_lower = text.lower()
        for word in BAD_WORDS:
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                logger.warning(f"🚨 [MODERASYON] Uygunsuz kelime tespit edildi: {word}")
                return True
        return False

    @staticmethod
    def moderate_image(image_url: Optional[str]) -> bool:
        """
        Görsellerin güvenliğini denetler.
        (Buraya ileride AWS Rekognition veya Google Vision API eklenecek).
        Şu anlık mock (sahte) olarak False (Temiz) döner.
        """
        if not image_url:
            return False
            
        # Örnek AWS Rekognition Entegrasyon taslağı:
        # client = boto3.client('rekognition')
        # response = client.detect_moderation_labels(Image={'S3Object':{'Bucket':'b','Name':'n'}})
        # if len(response['ModerationLabels']) > 0:
        #     return True
        
        return False
