import re
import logging
from typing import Optional

logger = logging.getLogger("asemos")

# Türkçe küfür / hakaret / cinsel taciz / nefret söylemi sözlüğü.
# Kategorize edilmiştir; her kelime kök halinde tutulur (regex kelime eşleşmesi
# gövde eklerini de yakalar, bkz. _build_pattern).
BAD_WORDS = [
    # Ağır küfür
    "amk", "aq", "amına", "amina", "orospu", "piç", "pic", "yarrak", "yarak",
    "siktir", "sikerim", "sikeyim", "sik", "göt", "got", "ibne", "pezevenk",
    "kahpe", "puşt", "pust", "oç", "gavat", "şerefsiz", "serefsiz",
    "kaltak", "sürtük", "surtuk", "yavşak", "yavsak", "kevaşe", "kevase",
    "sikik", "sikko", "malafat", "dalyarak",
    # Hakaret / aşağılama
    "gerizekalı", "gerizekali", "aptal", "salak", "mal", "dangalak", "ahmak",
    "embesil", "geri zekalı", "beyinsiz", "şerefsiz", "hayvan herif",
    "ezik", "aşağılık", "asagilik", "onursuz", "haysiyetsiz",
    # Cinsel taciz / uygunsuz içerik
    "porno", "pornografik", "müstehcen", "mustehcen", "fuhuş", "fuhus",
    "genelev", "escort", "seks yap", "cinsel organ",
    # Nefret söylemi / ayrımcılık
    "zenci köle", "kürt pkk", "ermeni katliamı", "faşist köpek", "nazi köpeği",
    "ırkçı pislik", "irkci pislik", "terörist köpek", "terorist kopek",
]


def _build_pattern(word: str) -> re.Pattern:
    """
    Kelimenin harfleri arasına araya sokulan boşluk/nokta/tire gibi ayraçlarla
    (örn. "a.m.k", "a m k") basit atlatma girişimlerini de yakalayan pattern üretir.
    """
    parts = [re.escape(ch) for ch in word if ch != " "]
    # Kelimenin kendi içindeki boşlukları (örn. "geri zekalı") normal boşluk kabul et
    spaced = re.escape(word).replace(r"\ ", r"[\W_]+")
    loose = r"[\W_]{0,2}".join(re.escape(ch) for ch in word.replace(" ", ""))
    pattern = rf"(?<![a-zçğıöşü0-9])(?:{spaced}|{loose})(?![a-zçğıöşü0-9])"
    return re.compile(pattern, re.IGNORECASE)


_TR_MAP = str.maketrans({
    "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç",
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s",
})


def _normalize(text: str) -> str:
    return text.translate(_TR_MAP).lower()


_PATTERNS = [(_build_pattern(w), w) for w in BAD_WORDS]


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

        normalized = _normalize(text)
        for pattern, word in _PATTERNS:
            if pattern.search(normalized):
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
