"""
Mini Demo Backend - SerpApi + LLM Test (FAZ 2 - Performance Optimized)
Faz 2 Özellikleri:
- 2.1: Redis Cache (TTL desteği)
- 2.2: Model Preloading (startup'ta yükleme)
- 2.3: Async Pipeline (paralel işlemler)
"""

from fastapi import FastAPI, HTTPException  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import os
import math
import asyncio
import hashlib
import json
import re
import httpx  # type: ignore[import]
from datetime import datetime
import redis  # type: ignore[import]

# .env dosyasını yükle — her koşulda bulunur
from dotenv import load_dotenv  # type: ignore[import]
import pathlib as _pl
_env_path = _pl.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)



import logging
logger = logging.getLogger(__name__)

# Yorum analizi modülü
from review_analyzer import fast_extract_insights  # type: ignore[import]

# ==================== KATMANLI LLM (Groq → Local fallback) ====================
# llm_wrapper.py'dan import; key .env'den otomatik okunur
import sys, os as _os
_ai_llm_root = _os.path.dirname(_os.path.abspath(__file__))
if _ai_llm_root not in sys.path:
    sys.path.insert(0, _ai_llm_root)

from src.models.llm.llm_wrapper import LayeredLLMWrapper  # type: ignore[import]
from src.config import settings  # type: ignore[import]
from scripts.prepare_vector_db import (  # type: ignore[import]
    get_mekanlar_from_json,
    create_embedding_text,
)
from qdrant_client.models import PointStruct  # type: ignore[import]

# ==================== RAG SYSTEM ====================
from src.rag.pipeline import RAGPipeline  # type: ignore[import]

_llm: Optional[LayeredLLMWrapper] = None  # lazy singleton

def _get_llm() -> LayeredLLMWrapper:
    global _llm
    if _llm is None:
        _llm = LayeredLLMWrapper()
    return _llm


SUPPORTED_LANGUAGES = {
    "tr": "Turkish",
    "en": "English",
    "de": "German",
    "fr": "French",
    "es": "Spanish",
    "ar": "Arabic",
    "ru": "Russian",
}

LANGUAGE_ALIASES = {
    "turkish": "tr", "turkce": "tr", "türkçe": "tr",
    "english": "en", "ingilizce": "en", "İngilizce": "en",
    "german": "de", "deutsch": "de", "almanca": "de",
    "french": "fr", "francais": "fr", "français": "fr", "fransizca": "fr", "fransızca": "fr",
    "spanish": "es", "espanol": "es", "español": "es", "ispanyolca": "es", "İspanyolca": "es",
    "arabic": "ar", "arabic": "ar", "arapca": "ar", "arapça": "ar",
    "russian": "ru", "russkiy": "ru", "rusca": "ru", "rusça": "ru",
}

MESSAGE_TEMPLATES = {
    "inappropriate": {
        "tr": "Üzgünüm, ben sadece bir mekan öneri asistanıyım. Siyasi, dini veya argo sohbetlere katılamıyorum. Lütfen bana mekanlarla ilgili bir soru sor. 🤖🍔",
        "en": "Sorry, I am only a venue recommendation assistant. I cannot join political, religious, or offensive chats. Please ask me something about places. 🤖🍔",
        "de": "Tut mir leid, ich bin nur ein Assistent für Ortsempfehlungen. An politischen, religiösen oder beleidigenden Gesprächen kann ich nicht teilnehmen. Bitte frage mich etwas über Orte. 🤖🍔",
        "fr": "Désolé, je suis uniquement un assistant de recommandation de lieux. Je ne peux pas participer aux discussions politiques, religieuses ou offensantes. Pose-moi plutôt une question sur des lieux. 🤖🍔",
        "es": "Lo siento, solo soy un asistente de recomendación de lugares. No puedo participar en conversaciones políticas, religiosas u ofensivas. Pregúntame algo sobre lugares. 🤖🍔",
        "ar": "عذرًا، أنا مساعد مخصص فقط لاقتراح الأماكن. لا يمكنني المشاركة في محادثات سياسية أو دينية أو مسيئة. من فضلك اسألني عن الأماكن. 🤖🍔",
        "ru": "Извините, я только помощник по рекомендациям мест. Я не участвую в политических, религиозных или оскорбительных беседах. Пожалуйста, спросите меня о местах. 🤖🍔",
    },
    "chit_chat": {
        "tr": "Merhaba! İyiyim, teşekkür ederim. Ben seni aradığın en güzel mekanlara götürmek için buradayım. Bugün nasıl bir yere gitmek istersin? (Örn: Beşiktaş'ta deniz manzaralı sakin bir kafe) ☕",
        "en": "Hi! I am doing well, thank you. I am here to help you find great places. What kind of place would you like today? (Example: a quiet cafe with a sea view in Besiktas) ☕",
        "de": "Hallo! Mir geht es gut, danke. Ich helfe dir, tolle Orte zu finden. Was für einen Ort suchst du heute? (Beispiel: ein ruhiges Café mit Meerblick in Besiktas) ☕",
        "fr": "Bonjour ! Je vais bien, merci. Je suis là pour t’aider à trouver de super lieux. Quel type d’endroit cherches-tu aujourd’hui ? (Exemple : un café calme avec vue sur la mer à Besiktas) ☕",
        "es": "¡Hola! Estoy bien, gracias. Estoy aquí para ayudarte a encontrar buenos lugares. ¿Qué tipo de lugar buscas hoy? (Ejemplo: un café tranquilo con vista al mar en Besiktas) ☕",
        "ar": "مرحبًا! أنا بخير، شكرًا لك. أنا هنا لمساعدتك في العثور على أماكن رائعة. ما نوع المكان الذي تريده اليوم؟ (مثال: مقهى هادئ بإطلالة على البحر في بشكتاش) ☕",
        "ru": "Привет! У меня всё хорошо, спасибо. Я помогу тебе найти отличные места. Какое место ты ищешь сегодня? (Например: тихое кафе с видом на море в Бешикташе) ☕",
    },
    "no_vector_match": {
        "tr": "Vektör veritabanında eşleşen mekan bulunamadı",
        "en": "No matching places were found in the vector database",
        "de": "In der Vektordatenbank wurden keine passenden Orte gefunden",
        "fr": "Aucun lieu correspondant n’a été trouvé dans la base vectorielle",
        "es": "No se encontraron lugares coincidentes en la base de datos vectorial",
        "ar": "لم يتم العثور على أماكن مطابقة في قاعدة بيانات المتجهات",
        "ru": "В векторной базе данных не найдено подходящих мест",
    },
    "reviews_unavailable": {
        "tr": "Yapay zeka sistemi yorumlara şu anda erişemiyor.",
        "en": "The AI system cannot access reviews right now.",
        "de": "Das KI-System kann derzeit nicht auf Bewertungen zugreifen.",
        "fr": "Le système d’IA ne peut pas accéder aux avis pour le moment.",
        "es": "El sistema de IA no puede acceder a las reseñas en este momento.",
        "ar": "لا يستطيع نظام الذكاء الاصطناعي الوصول إلى المراجعات حاليًا.",
        "ru": "Система ИИ сейчас не может получить доступ к отзывам.",
    },
    "not_enough_reviews": {
        "tr": "Yapay zeka analizine elverişli yeterli müşteri geri bildirimi bulunamamıştır.",
        "en": "There is not enough customer feedback for AI analysis.",
        "de": "Es gibt nicht genügend Kundenfeedback für eine KI-Analyse.",
        "fr": "Il n’y a pas assez d’avis clients pour une analyse par IA.",
        "es": "No hay suficientes comentarios de clientes para el análisis de IA.",
        "ar": "لا توجد ملاحظات كافية من العملاء لإجراء تحليل بالذكاء الاصطناعي.",
        "ru": "Недостаточно отзывов клиентов для анализа ИИ.",
    },
}

REASON_LABELS = {
    "high_rating": {"tr": "Yüksek puan", "en": "High rating", "de": "Hohe Bewertung", "fr": "Note élevée", "es": "Alta puntuación", "ar": "تقييم مرتفع", "ru": "Высокий рейтинг"},
    "many_reviews": {"tr": "Çok yorumlu", "en": "Many reviews", "de": "Viele Bewertungen", "fr": "Beaucoup d’avis", "es": "Muchas reseñas", "ar": "مراجعات كثيرة", "ru": "Много отзывов"},
    "reviews": {"tr": "yorum", "en": "reviews", "de": "Bewertungen", "fr": "avis", "es": "reseñas", "ar": "مراجعة", "ru": "отзывов"},
    "very_near": {"tr": "Çok yakın", "en": "Very close", "de": "Sehr nah", "fr": "Très proche", "es": "Muy cerca", "ar": "قريب جدًا", "ru": "Очень близко"},
    "near": {"tr": "Yakın", "en": "Nearby", "de": "In der Nähe", "fr": "Proche", "es": "Cerca", "ar": "قريب", "ru": "Рядом"},
    "general_fit": {"tr": "Genel uygunluk", "en": "Overall fit", "de": "Allgemein passend", "fr": "Bonne adéquation générale", "es": "Adecuación general", "ar": "ملاءمة عامة", "ru": "Общее соответствие"},
}

FEATURE_LABELS = {
    "wifi": {"tr": "📶 Sınırsız Wi-Fi", "en": "📶 Unlimited Wi-Fi", "de": "📶 Unbegrenztes WLAN", "fr": "📶 Wi-Fi illimité", "es": "📶 Wi-Fi ilimitado", "ar": "📶 واي فاي غير محدود", "ru": "📶 Безлимитный Wi-Fi"},
    "deniz": {"tr": "🌊 Deniz Manzaralı", "en": "🌊 Sea view", "de": "🌊 Meerblick", "fr": "🌊 Vue sur mer", "es": "🌊 Vista al mar", "ar": "🌊 إطلالة بحرية", "ru": "🌊 Вид на море"},
    "sessiz": {"tr": "🤫 Sessiz Ortam", "en": "🤫 Quiet atmosphere", "de": "🤫 Ruhige Atmosphäre", "fr": "🤫 Ambiance calme", "es": "🤫 Ambiente tranquilo", "ar": "🤫 أجواء هادئة", "ru": "🤫 Тихая атмосфера"},
    "açık": {"tr": "🌳 Açık Alan / Bahçe", "en": "🌳 Outdoor seating / garden", "de": "🌳 Außenbereich / Garten", "fr": "🌳 Terrasse / jardin", "es": "🌳 Zona exterior / jardín", "ar": "🌳 جلسات خارجية / حديقة", "ru": "🌳 Открытая зона / сад"},
    "çalışma": {"tr": "💻 Çalışmaya Uygun", "en": "💻 Good for working", "de": "💻 Gut zum Arbeiten", "fr": "💻 Adapté au travail", "es": "💻 Adecuado para trabajar", "ar": "💻 مناسب للعمل", "ru": "💻 Подходит для работы"},
}

SPECIALTY_TRANSLATIONS = {
    "kahve": {"en": "Known for coffee", "de": "Bekannt für Kaffee", "fr": "Réputé pour son café", "es": "Famoso por su café", "ar": "مشهور بالقهوة", "ru": "Известно кофе"},
    "çay": {"en": "Known for tea", "de": "Bekannt für Tee", "fr": "Réputé pour son thé", "es": "Conocido por su té", "ar": "مشهور بالشاي", "ru": "Известно чаем"},
    "hamburger": {"en": "Famous for burgers", "de": "Berühmt für Burger", "fr": "Réputé pour ses burgers", "es": "Famoso por sus hamburguesas", "ar": "مشهور بالبرغر", "ru": "Известно бургерами"},
    "pizza": {"en": "Known for pizza", "de": "Bekannt für Pizza", "fr": "Réputé pour ses pizzas", "es": "Conocido por su pizza", "ar": "مشهور بالبيتزا", "ru": "Известно пиццей"},
    "tatlı": {"en": "Famous for desserts", "de": "Berühmt für Desserts", "fr": "Réputé pour ses desserts", "es": "Famoso por sus postres", "ar": "مشهور بالحلويات", "ru": "Известно десертами"},
    "kahvaltı": {"en": "Popular for breakfast", "de": "Beliebt fürs Frühstück", "fr": "Populaire pour le petit-déjeuner", "es": "Popular para desayunar", "ar": "مشهور بالإفطار", "ru": "Популярно для завтрака"},
    "kebap": {"en": "Known for kebab", "de": "Bekannt für Kebab", "fr": "Réputé pour ses kebabs", "es": "Conocido por su kebab", "ar": "مشهور بالكباب", "ru": "Известно кебабом"},
    "balık": {"en": "Famous for seafood", "de": "Berühmt für Fisch und Meeresfrüchte", "fr": "Réputé pour ses fruits de mer", "es": "Famoso por sus mariscos", "ar": "مشهور بالمأكولات البحرية", "ru": "Известно морепродуктами"},
    "sandviç": {"en": "Known for sandwiches", "de": "Bekannt für Sandwiches", "fr": "Réputé pour ses sandwichs", "es": "Conocido por sus sándwiches", "ar": "مشهور بالسندويتشات", "ru": "Известно сэндвичами"},
    "manzara": {"en": "Known for the view", "de": "Bekannt für die Aussicht", "fr": "Réputé pour la vue", "es": "Destaca por sus vistas", "ar": "مشهور بالإطلالة", "ru": "Известно видом"},
    "atmosfer": {"en": "Loved for the atmosphere", "de": "Beliebt wegen der Atmosphäre", "fr": "Apprécié pour son ambiance", "es": "Apreciado por su ambiente", "ar": "محبوب بسبب الأجواء", "ru": "Ценится за атмосферу"},
    "müzik": {"en": "Known for music", "de": "Bekannt für Musik", "fr": "Réputé pour sa musique", "es": "Conocido por su música", "ar": "مشهور بالموسيقى", "ru": "Известно музыкой"},
    "hizmet": {"en": "Known for service quality", "de": "Bekannt für guten Service", "fr": "Réputé pour la qualité du service", "es": "Conocido por su buen servicio", "ar": "مشهور بجودة الخدمة", "ru": "Известно качеством обслуживания"},
    "fiyat": {"en": "Known for good value", "de": "Bekannt für faire Preise", "fr": "Réputé pour son bon rapport qualité-prix", "es": "Conocido por sus buenos precios", "ar": "مشهور بالقيمة الجيدة", "ru": "Известно хорошими ценами"},
    "smoothie": {"en": "Famous for drinks", "de": "Berühmt für Getränke", "fr": "Réputé pour ses boissons", "es": "Famoso por sus bebidas", "ar": "مشهور بالمشروبات", "ru": "Известно напитками"},
    "kokteyl": {"en": "Popular for drinks", "de": "Beliebt für Getränke", "fr": "Populaire pour ses boissons", "es": "Popular por sus bebidas", "ar": "مشهور بالمشروبات", "ru": "Популярно благодаря напиткам"},
    "nargile": {"en": "Known for hookah", "de": "Bekannt für Shisha", "fr": "Réputé pour la chicha", "es": "Conocido por la shisha", "ar": "مشهور بالشيشة", "ru": "Известно кальяном"},
    "döner": {"en": "Famous for doner", "de": "Berühmt für Döner", "fr": "Réputé pour son döner", "es": "Famoso por su döner", "ar": "مشهور بالدونر", "ru": "Известно донером"},
    "simit": {"en": "Known for simit and pastries", "de": "Bekannt für Simit und Gebäck", "fr": "Réputé pour le simit et les viennoiseries", "es": "Conocido por simit y bollería", "ar": "مشهور بالسميت والمعجنات", "ru": "Известно симитом и выпечкой"},
    "künefe": {"en": "Known for Turkish desserts", "de": "Bekannt für türkische Desserts", "fr": "Réputé pour ses desserts turcs", "es": "Conocido por postres turcos", "ar": "مشهور بالحلويات التركية", "ru": "Известно турецкими десертами"},
    "çorba": {"en": "Known for soup", "de": "Bekannt für Suppen", "fr": "Réputé pour ses soupes", "es": "Conocido por sus sopas", "ar": "مشهور بالشوربة", "ru": "Известно супами"},
    "meze": {"en": "Famous for meze", "de": "Berühmt für Meze", "fr": "Réputé pour ses mezzés", "es": "Famoso por sus mezes", "ar": "مشهور بالمقبلات", "ru": "Известно мезе"},
    "çay bahçesi": {"en": "Known as a tea garden", "de": "Bekannt als Teegarten", "fr": "Réputé comme jardin de thé", "es": "Conocido como jardín de té", "ar": "مشهور كحديقة شاي", "ru": "Известно как чайный сад"},
    "romantik": {"en": "Known for a romantic atmosphere", "de": "Bekannt für romantische Atmosphäre", "fr": "Réputé pour son ambiance romantique", "es": "Conocido por su ambiente romántico", "ar": "مشهور بالأجواء الرومانسية", "ru": "Известно романтической атмосферой"},
}


def normalize_language(language: Optional[str] = None, locale: Optional[str] = None) -> Optional[str]:
    """Request dil/locale bilgisini desteklenen iki harfli koda indirger."""
    for value in (language, locale):
        if not value:
            continue
        cleaned = value.strip().lower().replace("_", "-")
        primary = cleaned.split("-")[0]
        if primary in SUPPORTED_LANGUAGES:
            return primary
        if cleaned in LANGUAGE_ALIASES:
            return LANGUAGE_ALIASES[cleaned]
        if primary in LANGUAGE_ALIASES:
            return LANGUAGE_ALIASES[primary]
    return None


def detect_language_from_query(query: str) -> str:
    """Harici bağımlılık olmadan demo için basit dil sezgisi."""
    text = (query or "").lower()
    if re.search(r"[\u0600-\u06ff]", text):
        return "ar"
    if re.search(r"[\u0400-\u04ff]", text):
        return "ru"
    if any(ch in text for ch in "çğıöşü"):
        return "tr"

    keyword_scores = {
        "tr": ["merhaba", "mekan", "kafe", "kahve", "yemek", "öner", "oner", "sessiz", "yakın", "yakin"],
        "en": ["hello", "place", "coffee", "restaurant", "recommend", "quiet", "near", "best"],
        "de": ["hallo", "ort", "cafe", "kaffee", "restaurant", "empfehlen", "ruhig", "nähe", "nahe"],
        "fr": ["bonjour", "lieu", "cafe", "café", "restaurant", "recommande", "veux", "calme", "près", "pres", "meilleur"],
        "es": ["hola", "lugar", "cafe", "café", "restaurante", "quiero", "recomienda", "tranquilo", "cerca", "mejor"],
    }
    best_lang = "tr"
    best_score = 0
    for lang, words in keyword_scores.items():
        score = sum(1 for word in words if word in text)
        if score > best_score:
            best_lang = lang
            best_score = score
    return best_lang if best_score else "tr"


def resolve_response_language(
    query: str,
    language: Optional[str] = None,
    locale: Optional[str] = None
) -> str:
    return normalize_language(language, locale) or detect_language_from_query(query)


def lang_name(lang: str) -> str:
    return SUPPORTED_LANGUAGES.get(lang, "Turkish")


def localized(template_key: str, lang: str) -> str:
    return MESSAGE_TEMPLATES.get(template_key, {}).get(lang) or MESSAGE_TEMPLATES[template_key]["tr"]


def reason_label(key: str, lang: str) -> str:
    return REASON_LABELS.get(key, {}).get(lang) or REASON_LABELS[key]["tr"]


def translate_specialty_label(spec: Dict, lang: str) -> str:
    if lang == "tr":
        return spec.get("label", "")
    key = spec.get("key", "")
    return SPECIALTY_TRANSLATIONS.get(key, {}).get(lang) or spec.get("label", "")


def localize_review_insights(insights: Dict, lang: str) -> Dict:
    """Review analyzer skorlarını korur, sadece kullanıcıya görünen metinleri uyarlar."""
    if lang == "tr" or not insights:
        return insights

    localized_insights = {**insights}
    specialties = []
    review_word = reason_label("reviews", lang)

    for spec in insights.get("specialties", []):
        label = translate_specialty_label(spec, lang)
        translated = {**spec, "label": label}
        translated["display"] = f"{spec.get('emoji', '')} {label} ({spec.get('mention_count', 0)} {review_word})"
        specialties.append(translated)

    localized_insights["specialties"] = specialties
    localized_insights["top_specialty"] = specialties[0]["display"] if specialties else None
    localized_insights["highlight_tags"] = [
        f"{s.get('emoji', '')} {s.get('key', '').title()}" for s in specialties[:3]
    ]
    if specialties:
        labels = ", ".join(s["label"] for s in specialties[:2])
        localized_insights["summary"] = {
            "en": f"This place stands out in customer reviews for: {labels}.",
            "de": f"Dieses Lokal sticht in Kundenbewertungen besonders hervor durch: {labels}.",
            "fr": f"Ce lieu se distingue dans les avis clients pour : {labels}.",
            "es": f"Este lugar destaca en las reseñas de clientes por: {labels}.",
            "ar": f"يبرز هذا المكان في مراجعات العملاء بسبب: {labels}.",
            "ru": f"Это место выделяется в отзывах клиентов благодаря: {labels}.",
        }.get(lang, localized_insights.get("summary", ""))
    return localized_insights


def build_review_analysis_text(count: int, specialties: List[Dict], sentiment_bonus: float, lang: str) -> str:
    if specialties:
        specialty_text = ", ".join([s["emoji"] + " " + s["label"] for s in specialties[:3]])
        if lang == "tr":
            if sentiment_bonus > 0.10:
                return f"Yapay zeka {count} yorumu inceledi. Bu mekan özellikle şunlarla öne çıkıyor: {specialty_text}. Müşteri memnuniyeti genel olarak çok yüksek."
            return f"Yapay zeka {count} yorumu inceledi. Bu mekan özellikle şunlarla biliniyor: {specialty_text}."
        templates = {
            "en": "AI analyzed {count} reviews. This place especially stands out for: {specialty_text}.",
            "de": "Die KI hat {count} Bewertungen analysiert. Dieser Ort fällt besonders auf durch: {specialty_text}.",
            "fr": "L’IA a analysé {count} avis. Ce lieu se distingue surtout pour : {specialty_text}.",
            "es": "La IA analizó {count} reseñas. Este lugar destaca especialmente por: {specialty_text}.",
            "ar": "حلل الذكاء الاصطناعي {count} مراجعة. يبرز هذا المكان خصوصًا بسبب: {specialty_text}.",
            "ru": "ИИ проанализировал {count} отзывов. Это место особенно выделяется благодаря: {specialty_text}.",
        }
        extra = {
            "en": " Customer satisfaction is generally very high.",
            "de": " Die Kundenzufriedenheit ist insgesamt sehr hoch.",
            "fr": " La satisfaction client est globalement très élevée.",
            "es": " La satisfacción del cliente es generalmente muy alta.",
            "ar": " رضا العملاء مرتفع جدًا بشكل عام.",
            "ru": " Удовлетворенность клиентов в целом очень высокая.",
        }.get(lang, "")
        return templates.get(lang, templates["en"]).format(count=count, specialty_text=specialty_text) + (extra if sentiment_bonus > 0.10 else "")

    if lang == "tr":
        if sentiment_bonus > 0.15:
            return f"Yapay zeka analizine göre, {count} müşteri geri bildiriminde çok yüksek oranda memnuniyet saptanmıştır."
        if sentiment_bonus > 0.05:
            return f"Yapay zeka tarafından analiz edilen {count} yorumda müşteri memnuniyeti genel olarak pozitif yönde."
        if sentiment_bonus < -0.15:
            return f"{count} yorumda ciddi müşteri şikayetleri tespit edilmiştir. Ziyaret öncesi dikkatli değerlendirme önerilir."
        return f"{count} yorum analiz edildi. Mekan ortalama standartlar etrafında şekilleniyor."

    sentiment_templates = {
        "positive_high": {
            "en": "AI analysis found very high satisfaction across {count} customer reviews.",
            "de": "Die KI-Analyse zeigt eine sehr hohe Zufriedenheit in {count} Kundenbewertungen.",
            "fr": "L’analyse IA indique une très forte satisfaction dans {count} avis clients.",
            "es": "El análisis de IA encontró una satisfacción muy alta en {count} reseñas de clientes.",
            "ar": "أظهر تحليل الذكاء الاصطناعي رضا مرتفعًا جدًا في {count} مراجعة من العملاء.",
            "ru": "Анализ ИИ выявил очень высокий уровень удовлетворенности в {count} отзывах клиентов.",
        },
        "positive": {
            "en": "In {count} reviews analyzed by AI, customer satisfaction is generally positive.",
            "de": "In {count} von der KI analysierten Bewertungen ist die Kundenzufriedenheit insgesamt positiv.",
            "fr": "Dans {count} avis analysés par l’IA, la satisfaction client est globalement positive.",
            "es": "En {count} reseñas analizadas por IA, la satisfacción del cliente es generalmente positiva.",
            "ar": "في {count} مراجعة حللها الذكاء الاصطناعي، تبدو رضا العملاء إيجابيًا بشكل عام.",
            "ru": "В {count} отзывах, проанализированных ИИ, удовлетворенность клиентов в целом положительная.",
        },
        "negative": {
            "en": "AI detected serious customer complaints in {count} reviews. Consider carefully before visiting.",
            "de": "Die KI hat in {count} Bewertungen deutliche Kundenbeschwerden erkannt. Vor dem Besuch sorgfältig abwägen.",
            "fr": "L’IA a détecté des plaintes clients importantes dans {count} avis. À considérer avant la visite.",
            "es": "La IA detectó quejas importantes de clientes en {count} reseñas. Conviene evaluarlo antes de visitar.",
            "ar": "اكتشف الذكاء الاصطناعي شكاوى جدية من العملاء في {count} مراجعة. يُنصح بالتقييم قبل الزيارة.",
            "ru": "ИИ обнаружил серьезные жалобы клиентов в {count} отзывах. Стоит внимательно оценить перед посещением.",
        },
        "neutral": {
            "en": "{count} reviews were analyzed. This place appears to be around average standards.",
            "de": "{count} Bewertungen wurden analysiert. Dieser Ort scheint im durchschnittlichen Bereich zu liegen.",
            "fr": "{count} avis ont été analysés. Ce lieu semble se situer dans la moyenne.",
            "es": "Se analizaron {count} reseñas. Este lugar parece estar dentro de estándares promedio.",
            "ar": "تم تحليل {count} مراجعة. يبدو هذا المكان ضمن المستوى المتوسط.",
            "ru": "Проанализировано {count} отзывов. Это место выглядит примерно на среднем уровне.",
        },
    }
    key = "positive_high" if sentiment_bonus > 0.15 else "positive" if sentiment_bonus > 0.05 else "negative" if sentiment_bonus < -0.15 else "neutral"
    return sentiment_templates[key].get(lang, sentiment_templates[key]["en"]).format(count=count)


async def generate_llm_response(query: str, places: list, parsed_context: dict, language: str = "tr") -> str:
    """
    Katmanlı LLM ile doğal dil yanıtı üretir.
      Katman 1: Groq Cloud (hızlı, ~1 sn)
      Katman 2: Local HuggingFace/Gemma (yavaş ama her zaman çalışır)
    """
    if not places:
        return ""

    # Mekan özetleri
    summaries = []
    for i, p in enumerate(places[:5], 1):
        name    = p.get("name", "?")
        rating  = p.get("rating", 0)
        address = p.get("address", "")
        desc    = p.get("description", "")[:100]
        reason  = p.get("recommendation_reason", "")
        summaries.append(f"{i}. {name} (⭐{rating}) - {address}. {desc}. Reason: {reason}")

    mood     = parsed_context.get("mood") or "normal"
    category = parsed_context.get("category", "mekan")
    district = parsed_context.get("district", "İstanbul")
    features = ", ".join(parsed_context.get("features", [])) or "belirtilmedi"

    prompt = (
        f'Kullanıcı sorgusu: "{query}"\n'
        f"Ruh hali: {mood}, Kategori: {category}, Bölge: {district}, Özellikler: {features}\n\n"
        f"Bulunan en iyi mekanlar:\n" + "\n".join(summaries) + "\n\n"
        f"Bu mekanlara dayanarak kişiselleştirilmiş, sıcak bir öneri mesajı yaz. "
        f"Respond only in {lang_name(language)}."
    )

    try:
        llm = _get_llm()
        response = await llm.generate_async(prompt)
        print(f"[LLM] Yanit uretildi — provider={llm.active_provider}")
        return response
    except Exception as e:
        print(f"[LLM] Tum katmanlar basarisiz: {e}")
        return ""



# ==================== FAZ 2.1: CACHE SYSTEM ====================

class RedisCacheManager:
    """Redis cache manager (TTL destekli)"""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        self.redis_url = redis_url
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0
        self.client: redis.Redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.is_connected = False
        self._connect()

    def _connect(self) -> None:
        try:
            self.client.ping()
            self.is_connected = True
        except Exception as exc:
            self.is_connected = False
            raise RuntimeError(f"Redis baglantisi kurulamadi: {exc}")

    def generate_key(self, query: str, location: str, **kwargs) -> str:
        """Sorgu parametrelerine gore unique cache key olustur"""
        key_str = f"{query}|{location}|{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Dict]:
        """Redis'ten veri al"""
        try:
            raw = self.client.get(key)
            if raw is None:
                self.misses += 1
                return None

            self.hits += 1
            return json.loads(raw)
        except Exception:
            self.misses += 1
            return None

    def set(self, key: str, data: Dict) -> None:
        """Redis'e veri yaz (TTL ile) - hata olursa sessizce atla"""
        try:
            payload = json.dumps(data, ensure_ascii=False)
            self.client.setex(key, self.ttl, payload)
        except Exception as e:
            print(f"[Cache] set hata (atlanıyor): {e}")

    def clear(self) -> None:
        """Redis DB temizle"""
        try:
            self.client.flushdb()
        except Exception:
            pass

    def get_stats(self) -> Dict:
        """Cache istatistikleri"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        try:
            total_items = self.client.dbsize()
        except Exception:
            total_items = 0

        return {
            "backend": "redis",
            "redis_url": self.redis_url,
            "total_items": total_items,
            "ttl_seconds": self.ttl,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "last_updated": datetime.now().isoformat()
        }


# Global cache instance - lazy init, startup'ta bağlantı kurulur
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_ttl = int(os.getenv("REDIS_TTL_SECONDS", "3600"))
cache_manager: Optional[RedisCacheManager] = None

# ==================== FAZ 2.2: MODEL PRELOADING ====================

class ModelManager:
    """Model preloading ve management"""
    
    def __init__(self):
        self.embedding_model = None
        self.llm_model = None
        self.tokenizer = None
        self.device: Optional[str] = None
        self.is_loaded = False
    
    async def preload_models(self) -> Dict:
        """Startup'ta modelleri yükle"""
        try:
            import torch  # type: ignore[import]
            from sentence_transformers import SentenceTransformer  # type: ignore[import]
            
            # Device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[Model] Device: {self.device}")
            
            # Embedding model
            print("[Model] Embedding model yükleniyor...")
            self.embedding_model = SentenceTransformer(
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                device=self.device
            )
            
            self.is_loaded = True
            print("[Model] OK Modeller yüklendi!")
            
            return {
                "status": "success",
                "embedding_model": "loaded",
                "device": self.device,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"[Model] Preload hatası: {e}")
            return {"status": "error", "error": str(e)}

    def analyze_review_sentiment(self, reviews: Union[str, List[str]]) -> float:
        """Kısa yorum veya yorum listesi üzerinden kabaca pozitif/negatif duygu analizi skorlaması (-0.2 ile +0.2)"""
        if not reviews or not self.embedding_model:
            return 0.0
            
        try:
            import torch  # type: ignore[import]
            positive_refs = ["Harika bir mekan", "Çok lezzetli", "Kesinlikle tavsiye ederim", "Çok güzel", "Mükemmel", "Bayıldım", "Güler yüzlü", "good", "great", "excellent", "amazing", "delicious", "perfect"]
            negative_refs = ["Çok kötü", "Berbat", "Berbat bir yer", "Tavsiye etmem", "Pahalı", "Kötü hizmet", "Lezzetsiz", "bad", "terrible", "worst", "awful", "expensive"]
            
            # Eğer tek bir string geldiyse liste yap
            if isinstance(reviews, str):
                reviews = [reviews]
                
            # Embeddings hesapla (Batch Inference - Hızlı çalışır)
            review_embs = self.embedding_model.encode(reviews, convert_to_tensor=True)  # type: ignore[union-attr]
            pos_embs = self.embedding_model.encode(positive_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            neg_embs = self.embedding_model.encode(negative_refs, convert_to_tensor=True)  # type: ignore[union-attr]
            
            from torch.nn.functional import cosine_similarity  # type: ignore[import]
            total_bonus = 0.0
            
            # Her bir yorumu analiz edip ortalamasını alıyoruz
            for review_emb in review_embs:
                pos_scores = cosine_similarity(review_emb.unsqueeze(0), pos_embs)
                neg_scores = cosine_similarity(review_emb.unsqueeze(0), neg_embs)
                
                max_pos = pos_scores.max().item()
                max_neg = neg_scores.max().item()
                
                sentiment_diff = max_pos - max_neg
                # Eskiden 0.4 ile çarpıp +-0.20'ye sınırlandırıyorduk.
                # Kullanıcı etkinin artmasını istediği için çarpanı 0.8 yapıp sınırı +-0.40 yapıyoruz.
                bonus = min(max(sentiment_diff * 0.8, -0.40), 0.40)
                total_bonus += bonus
                
            avg_bonus = total_bonus / len(reviews)
            print(f"🧐 {len(reviews)} adet yorum Analizi Ortalama Bonus: {avg_bonus:.3f}")
            return avg_bonus
            
        except Exception as e:
            print(f"[Model] Yorum analizi başarısız: {e}")
            return 0.0

# Global model manager
model_manager = ModelManager()

# Global RAG pipeline (lazy init)
rag_pipeline: Optional[RAGPipeline] = None
rag_bootstrap_lock = asyncio.Lock()
rag_bootstrap_status: Dict[str, Union[str, int, bool, None]] = {
    "ready": False,
    "indexed_count": 0,
    "source_count": 0,
    "storage_mode": None,
    "data_path": None,
    "last_error": None,
}


def _resolve_rag_data_path() -> str:
    data_path = settings.RAG_DATA_PATH or "data/loaded_places.json"
    if os.path.isabs(data_path):
        return data_path
    return os.path.join(_ai_llm_root, data_path)


def _bootstrap_rag_index_sync(force_reindex: Optional[bool] = None) -> Dict[str, Union[str, int, bool, None]]:
    """loaded_places.json snapshot'ını Qdrant'a güvenli şekilde indeksler."""
    global rag_bootstrap_status

    if not settings.RAG_AUTO_INDEX:
        rag_bootstrap_status.update({"ready": False, "last_error": "RAG_AUTO_INDEX disabled"})
        return rag_bootstrap_status

    data_path = _resolve_rag_data_path()
    force = settings.RAG_FORCE_REINDEX if force_reindex is None else force_reindex

    try:
        rag = _get_rag_pipeline()
        if not rag:
            raise RuntimeError("RAG pipeline başlatılamadı")

        retriever = rag.retriever
        vector_db = retriever.vector_db
        embedding_model = retriever.embedding_model

        mekanlar = get_mekanlar_from_json(json_path=data_path)
        if not mekanlar:
            raise RuntimeError(f"RAG veri dosyasında mekan bulunamadı: {data_path}")

        vector_size = embedding_model.get_vector_size()
        vector_db.create_collection_if_not_exists(vector_size=vector_size)

        current_count = vector_db.count_vectors()
        source_count = len(mekanlar)
        if current_count >= source_count and not force:
            rag_bootstrap_status = {
                "ready": True,
                "indexed_count": current_count,
                "source_count": source_count,
                "storage_mode": getattr(vector_db, "storage_mode", "unknown"),
                "data_path": data_path,
                "last_error": None,
            }
            print(f"[RAG] Index hazır: {current_count}/{source_count} vektör")
            return rag_bootstrap_status

        print(f"[RAG] Index yükleniyor: {source_count} mekan ({data_path})")
        embedding_texts = [create_embedding_text(mekan) for mekan in mekanlar]
        embeddings = embedding_model.encode(embedding_texts)

        points = []
        for i, (embedding, mekan) in enumerate(zip(embeddings, mekanlar), 1):
            point_id = int(mekan.get("id") or i)
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "id": point_id,
                    "ad": mekan.get("ad", ""),
                    "aciklama": mekan.get("aciklama", ""),
                    "kategori": mekan.get("kategori", ""),
                    "enlem": mekan.get("enlem"),
                    "boylam": mekan.get("boylam"),
                    "adres": mekan.get("adres", ""),
                    "rating": mekan.get("rating", 0),
                    "review_count": mekan.get("review_count", 0),
                    "user_review": mekan.get("user_review", "")
                }
            ))

        batch_size = 100
        uploaded = 0
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            if vector_db.add_vectors(batch):
                uploaded += len(batch)
            else:
                raise RuntimeError(f"Qdrant batch yükleme başarısız: {i}-{i + len(batch)}")

        indexed_count = vector_db.count_vectors() or uploaded
        rag_bootstrap_status = {
            "ready": indexed_count > 0,
            "indexed_count": indexed_count,
            "source_count": source_count,
            "storage_mode": getattr(vector_db, "storage_mode", "unknown"),
            "data_path": data_path,
            "last_error": None,
        }
        print(f"[RAG] Index yüklendi: {indexed_count}/{source_count} vektör")
        return rag_bootstrap_status
    except Exception as e:
        rag_bootstrap_status.update({
            "ready": False,
            "last_error": str(e),
            "data_path": data_path,
        })
        print(f"[RAG] Index bootstrap hatası: {e}")
        return rag_bootstrap_status


async def ensure_rag_ready(force_reindex: Optional[bool] = None) -> Dict[str, Union[str, int, bool, None]]:
    """İlk RAG isteğinde veya startup arka planında index'in hazır olmasını sağlar."""
    if rag_bootstrap_status.get("ready") and not force_reindex:
        return rag_bootstrap_status

    async with rag_bootstrap_lock:
        if rag_bootstrap_status.get("ready") and not force_reindex:
            return rag_bootstrap_status
        return await asyncio.to_thread(_bootstrap_rag_index_sync, force_reindex)

def _get_rag_pipeline() -> Optional[RAGPipeline]:
    """RAG pipeline'ını lazy init ile al"""
    global rag_pipeline
    if rag_pipeline is None:
        try:
            print("[RAG] RAG sistemi başlatılıyor...")
            rag_pipeline = RAGPipeline()
            print("[RAG] OK RAG sistemi hazır!")
            return rag_pipeline
        except Exception as e:
            print(f"[RAG] UYARI RAG başlatılamadı (devre dışı): {e}")
            return None
    return rag_pipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan: startup ve shutdown işlemleri"""
    global cache_manager
    print("\n" + "="*60)
    print("FAZ 2: STARTUP - Sistem Başlatılıyor")
    print("="*60)

    # 1. Redis Cache - bağlantı yoksa fallback
    try:
        cache_manager = RedisCacheManager(redis_url=redis_url, ttl_seconds=redis_ttl)
        print(f"[Startup] Cache Manager (Redis): OK {redis_url}")
    except Exception as e:
        print(f"[Startup] Redis baglanamadi ({e}), in-memory fallback")
        cache_manager = None

    # 2. Model Preloading — ARKA PLANDA (servis hemen baslar)
    async def _load_models_bg():
        model_status = await model_manager.preload_models()
        print(f"[Model] Yukleme tamamlandi: {model_status['status']}")

    asyncio.create_task(_load_models_bg())
    print(f"[Startup] Model yukleme arka planda baslatildi...")

    # 3. RAG System - ARKA PLANDA (opsiyonel)
    async def _load_rag_bg():
        if settings.RAG_INDEX_ON_STARTUP:
            await ensure_rag_ready()
        else:
            _get_rag_pipeline()

    asyncio.create_task(_load_rag_bg())
    print(f"[Startup] RAG sistemi arka planda baslatiliyor...")
    print(f"[Startup] Version: 2.1 (Performance Optimized + RAG)")
    print("="*60 + "\n")

    yield  # Uygulama burada çalışır

    # Shutdown
    print("[Shutdown] Sistem kapatiliyor...")


app = FastAPI(
    title="AI-LLM Demo Backend (FAZ 2)",
    version="2.1.0",
    lifespan=lifespan
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Her yerden erisime izin ver (Demo icin)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== MODELS ====================

class PlaceData(BaseModel):
    """Mekan verisi modeli"""
    name: str
    address: str
    latitude: float
    longitude: float
    rating: float = 0.0
    price_level: int = 2
    category: str = "Kafe"
    description: str = ""
    photo_url: Optional[str] = None
    review_count: int = 0
    user_review: Optional[str] = None


class SmartSearchRequest(BaseModel):
    """Akıllı arama isteği"""
    query: str
    location: str = "Istanbul"
    limit: int = 10
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    max_distance_km: float = 10.0
    analyze_reviews: bool = True   # Yorum analizi açık/kapalı (API kredi tasarrufu için)
    language: Optional[str] = None
    locale: Optional[str] = None


class AnalyzeReviewRequest(BaseModel):
    """İsteğe bağlı yorum çekme ve analiz isteği"""
    data_id: str
    place_name: Optional[str] = None
    language: Optional[str] = None
    locale: Optional[str] = None


class ImageSearchRequest(BaseModel):
    """Görselden mekan arama isteği"""
    image_base64: str          # base64 encoded image (data:image/jpeg;base64,... veya salt base64)
    mime_type: str = "image/jpeg"
    location: str = "Istanbul"
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    limit: int = 5
    max_distance_km: float = 10.0
    language: Optional[str] = None
    locale: Optional[str] = None


# ==================== GEMINI VISION HELPER ====================

async def analyze_image_with_llama(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Groq Llama-4-Scout (multimodal) ile gorseli analiz et.
    Ekstra API key gerektirmez — mevcut GROQ_API_KEY kullanilir.
    Doner: { query: str, category: str, keywords: list[str], description: str }
    """
    import re

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        return {
            "query": "kafe",
            "category": "kafe",
            "keywords": ["kafe"],
            "description": "GROQ_API_KEY eksik",
            "error": "no_key"
        }

    # base64 prefix temizle ve data URL olustur
    if "base64," in image_base64:
        image_base64 = image_base64.split("base64,")[1]

    data_url = f"data:{mime_type};base64,{image_base64}"

    prompt = (
        "Bu gorseli analiz et. Istanbul'da hangi tur mekan aranmali?\n"
        "Asagidaki JSON formatinda dondef (baska hicbir sey yazma):\n"
        '{"query":"turkce_arama_sorgusu","category":"kafe|restoran|bar|diger",'
        '"keywords":["kelime1","kelime2"],"description":"ne gordun"}\n\n'
        "Ornekler:\n"
        '- Kahve fincani -> {"query":"espresso latte sicak kahve","category":"kafe","keywords":["kahve","sicak"],"description":"Kahve fincani"}\n'
        '- Hamburger    -> {"query":"hamburger lezzetli fast food","category":"restoran","keywords":["hamburger"],"description":"Hamburger"}\n'
        '- Deniz manzarasi -> {"query":"deniz manzarali teras restorani","category":"restoran","keywords":["deniz","manzara"],"description":"Deniz manzarasi"}\n'
        '- Kokteyl, bar -> {"query":"kokteyl bar gece hayati","category":"bar","keywords":["alkol","bar"],"description":"Kokteyl icecek"}'
    )

    body = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_url}}
            ]
        }],
        "max_tokens": 200,
        "temperature": 0.1
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
            )

        if r.status_code != 200:
            print(f"[LlamaVision] Hata {r.status_code}: {r.text[:200]}")
            return {"query": "kafe", "category": "kafe", "keywords": [], "description": "Analiz basarisiz"}

        text = r.json()["choices"][0]["message"]["content"].strip()
        print(f"[LlamaVision] Ham yanit: {text[:200]}")

        json_match = re.search(r'\{[\s\S]+?\}', text)
        if json_match:
            result = json.loads(json_match.group())
            print(f"[LlamaVision] Gorsel analiz: {result}")
            return result

        return {"query": text[:80], "category": "kafe", "keywords": [], "description": text}

    except Exception as e:
        print(f"[LlamaVision] Hata: {e}")
        return {"query": "mekan", "category": "kafe", "keywords": [], "description": str(e)}



# ==================== HELPER FUNCTIONS ====================

def parse_natural_query(query: str) -> Dict:
    """Doğal dil sorgusunu parse et"""
    query_lower = query.lower()
    
    # Kategori algılama
    categories = {
        'kafe': ['kafe', 'kahve', 'coffee', 'cafe'],
        'restoran': ['restoran', 'restaurant', 'yemek', 'lokanta', 'restorant', 'kebap', 'et', 'balık'],
        'bar': ['bar', 'drink', 'pub', 'meyhane', 'içki', 'bira', 'şarap', 'gece', 'night'],
        'tatlı': ['tatlı', 'pasta', 'dessert', 'tatli', 'baklava'],
        'pizza': ['pizza'],
        'burger': ['burger', 'hamburger', 'fast food', 'fastfood'],
    }
    
    detected_category = 'kafe'  # default
    for category, keywords in categories.items():
        if any(kw in query_lower for kw in keywords):
            detected_category = category
            break
    
    # Bölge algılama (İstanbul'un tüm ilçeleri ve alternatif yazılımları)
    district_map = {
        'adalar': 'Adalar', 'arnavutköy': 'Arnavutköy', 'arnavutkoy': 'Arnavutköy',
        'ataşehir': 'Ataşehir', 'atasehir': 'Ataşehir', 'avcılar': 'Avcılar', 'avcilar': 'Avcılar',
        'bağcılar': 'Bağcılar', 'bagcilar': 'Bağcılar', 'bahçelievler': 'Bahçelievler', 'bahcelievler': 'Bahçelievler',
        'bakırköy': 'Bakırköy', 'bakirkoy': 'Bakırköy', 'başakşehir': 'Başakşehir', 'basaksehir': 'Başakşehir',
        'bayrampaşa': 'Bayrampaşa', 'bayrampasa': 'Bayrampaşa', 'beşiktaş': 'Beşiktaş', 'besiktas': 'Beşiktaş',
        'beykoz': 'Beykoz', 'beylikdüzü': 'Beylikdüzü', 'beylikduzu': 'Beylikdüzü',
        'beyoğlu': 'Beyoğlu', 'beyoglu': 'Beyoğlu', 'büyükçekmece': 'Büyükçekmece', 'buyukcekmece': 'Büyükçekmece',
        'çatalca': 'Çatalca', 'catalca': 'Çatalca', 'çekmeköy': 'Çekmeköy', 'cekmekoy': 'Çekmeköy',
        'esenler': 'Esenler', 'esenyurt': 'Esenyurt', 'eyüp': 'Eyüpsultan', 'eyup': 'Eyüpsultan', 
        'eyüpsultan': 'Eyüpsultan', 'eyupsultan': 'Eyüpsultan', 'fatih': 'Fatih',
        'gaziosmanpaşa': 'Gaziosmanpaşa', 'gaziosmanpasa': 'Gaziosmanpaşa', 'güngören': 'Güngören', 'gungoren': 'Güngören',
        'kadıköy': 'Kadıköy', 'kadikoy': 'Kadıköy', 'kağıthane': 'Kağıthane', 'kagithane': 'Kağıthane',
        'kartal': 'Kartal', 'küçükçekmece': 'Küçükçekmece', 'kucukcekmece': 'Küçükçekmece',
        'maltepe': 'Maltepe', 'pendik': 'Pendik', 'sancaktepe': 'Sancaktepe',
        'sarıyer': 'Sarıyer', 'sariyer': 'Sarıyer', 'silivri': 'Silivri', 'sultanbeyli': 'Sultanbeyli',
        'sultangazi': 'Sultangazi', 'şile': 'Şile', 'sile': 'Şile', 'şişli': 'Şişli', 'sisli': 'Şişli',
        'tuzla': 'Tuzla', 'ümraniye': 'Ümraniye', 'umraniye': 'Ümraniye',
        'üsküdar': 'Üsküdar', 'uskudar': 'Üsküdar', 'zeytinburnu': 'Zeytinburnu',
        'eminönü': 'Eminönü', 'eminonu': 'Eminönü' # Sık aranan ilçe dışı semt
    }
    
    detected_district = None
    for key, proper_name in district_map.items():
        if key in query_lower:
            detected_district = proper_name
            break
    
    # Özellik algılama
    features = []
    feature_keywords = {
        'wifi': ['wifi', 'wi-fi', 'internet', 'bağlantı'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view', 'boğaz', 'göl'],
        'sessiz': ['quiet', 'sessiz', 'sakin', 'peaceful', 'huzurlu', 'tenha'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras', 'balkon', 'dış mekan'],
        'çalışma': ['work', 'study', 'çalışma', 'workspace', 'laptop', 'uzaktan'],
        'aile': ['aile', 'aileyle', 'çocuk', 'family', 'bebek', 'aile dostu'],
        'evcil': ['evcil', 'köpek', 'pet friendly', 'hayvan'],
        'park': ['park', 'otopark', 'park yeri'],
    }
    
    for feature, keywords in feature_keywords.items():
        if any(kw in query_lower for kw in keywords):
            features.append(feature)
    
    # ===================== GELİŞTİRİLMİŞ TÜRKÇE NLP =====================
    
    # 1. DUYGU / RUH HALİ ALGILAMA
    mood_map = {
        'yorgun':    ['yorgun', 'yoruğum', 'bitik', 'dinlenmek', 'dinginlik', 'stresliyim'],
        'mutlu':     ['mutlu', 'kutlama', 'kutlamak', 'eğlence', 'eğlenmek', 'parti'],
        'romantik':  ['romantik', 'sevgili', 'sevgilimle', 'özel gün', 'yıldönümü', 'evlilik teklifi', 'aşk'],
        'çalışma':  ['müşteri toplantısı', 'iş toplantısı', 'proje', 'online toplantı'],
        'kahvaltı': ['sabah', 'kahvaltı', 'uyandım', 'kahvaltıya', 'serpme'],
    }
    detected_mood = None
    for mood, keywords in mood_map.items():
        if any(kw in query_lower for kw in keywords):
            detected_mood = mood
            if mood == 'yorgun' and 'sessiz' not in features:
                features.append('sessiz')  # Yorgun → sessiz yer ekle
            if mood == 'romantik' and 'açık' not in features:
                features.append('manzara')  # Romantik → manzara tercih et
            break
    
    # 2. GRUP TİPİ ALGILAMA
    group_type = 'bireysel'
    group_keywords = {
        'aile':       ['aileyle', 'aile olarak', 'çocuklar', 'aileçe', 'anne baba'],
        'arkadaş':   ['arkadaşlarla', 'grup halinde', 'ekip'],
        'iş':         ['iş yemeği', 'meslektaş', 'patron', 'toplantı sonrası'],
        'sevgili':    ['sevgilimle', 'sevgiliye', 'çift olarak', 'romantik'],
        'kalabalık': ['kalabalık grup', '10 kişi', 'organizasyon', 'toplantı']
    }
    for gtype, keywords in group_keywords.items():
        if any(kw in query_lower for kw in keywords):
            group_type = gtype
            if gtype == 'aile' and 'aile' not in features:
                features.append('aile')
            break
    
    # 3. BÜÜ ALGILAMA
    budget = 'orta'  # varsayılan
    if any(kw in query_lower for kw in ['ucuz', 'ekonomik', 'uygun fiyat', 'bütçem kısıtlı', 'hesaplı']):
        budget = 'ucuz'
    elif any(kw in query_lower for kw in ['lüks', 'premium', 'özel', 'pahalı olsun', 'en iyi']):
        budget = 'lüks'
    
    # 4. ŞU AN AÇIK MI ALGILAMA
    want_open_now = any(kw in query_lower for kw in [
        'şu an açık', 'açık mı', 'gece', 'gece yarısı', 'geç saatte', "şu an", 'hemen'
    ])
    
    # --- Niyet ve Sohbet Tespiti (Intent Classification) ---
    is_chit_chat = False
    is_inappropriate = False
    
    # 1. Yasaklı/Alakasız Konular (Siyaset, Din, Küfür vb.)
    inappropriate_keywords = ['siyaset', 'parti', 'din', 'küfür', 'argo', 'kavga', 'seçim', 'oy', 'başkan']
    import re
    words = set(re.findall(r'\w+', query_lower, flags=re.UNICODE))
    if any(kw in words for kw in inappropriate_keywords):
        is_inappropriate = True
        
    # 2. Günlük Sohbet (Chit-chat) Tespiti
    chit_chat_keywords = ['merhaba', 'selam', 'nasılsın', 'naber', 'iyi misin', 'hey', 'günaydın', 'iyi akşamlar']
    
    # Eğer cümle çok kısaysa VE chit_chat kelimelerinden biriyse
    if len(query_lower.split()) <= 3 and any(query_lower.startswith(kw) or query_lower == kw for kw in chit_chat_keywords):
        is_chit_chat = True
        
    # Eğer cümlede hiç mekan kelimesi veya özelliği geçmiyorsa ve chit-chat ise
    mekan_anlami = detected_category != 'kafe' or any(kw in query_lower for kw in ['kafe', 'kahve', 'mekan', 'yer', 'restoran', 'yemek'])
    if not mekan_anlami and any(kw in query_lower for kw in chit_chat_keywords):
        is_chit_chat = True
    
    return {
        'category': detected_category,
        'district': detected_district,
        'features': features,
        'mood': detected_mood,
        'group_type': group_type,
        'budget': budget,
        'want_open_now': want_open_now,
        'is_chit_chat': is_chit_chat,
        'is_inappropriate': is_inappropriate
    }


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """İki nokta arası mesafe (Haversine formülü)"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def is_place_open(place: Dict) -> Optional[bool]:
    """
    SerpAPI'dan gelen mekan verisindeki çalışma saatlerini parse eder.
    
    Returns:
        True  → kesinlikle açık
        False → kesinlikle kapalı
        None  → bilinmiyor (bilgi yok)
    """
    hours_raw = place.get('hours') or place.get('opening_hours') or place.get('open_state')
    
    if not hours_raw:
        return None
    
    hours_str = str(hours_raw).lower()
    
    # Açık sinyalleri
    if any(kw in hours_str for kw in ['open now', 'şu an açık', 'opens soon']):
        return True
    if 'open' in hours_str and 'closed' not in hours_str:
        return True
    
    # Kapalı sinyalleri
    if any(kw in hours_str for kw in ['closed', 'kapalı']):
        return False
    
    # Saat aralığı parse et (örn: "08:00-22:00")
    import re
    time_match = re.search(r'(\d{1,2})[:\.]?(\d{2})\s*[-–]\s*(\d{1,2})[:\.]?(\d{2})', hours_str)
    if time_match:
        try:
            open_h, open_m = int(time_match.group(1)), int(time_match.group(2))
            close_h, close_m = int(time_match.group(3)), int(time_match.group(4))
            now = datetime.now()
            current_minutes = now.hour * 60 + now.minute
            open_minutes = open_h * 60 + open_m
            close_minutes = close_h * 60 + close_m
            
            if close_minutes < open_minutes:  # Gece yarısını geçiyor
                return current_minutes >= open_minutes or current_minutes < close_minutes
            return open_minutes <= current_minutes < close_minutes
        except Exception:
            pass
    
    return None  # Parse edilemedi



def hybrid_score(place: Dict, features: List[str], user_lat=None, user_lng=None, time_of_day=None) -> Dict[str, float]:
    """Hibrit skorlama (feature + distance + popularity + time)"""
    scores: Dict[str, float] = {
        "feature_score": 0.0,
        "distance_score": 0.0,
        "popularity_score": 0.0,
        "time_score": 0.0,
        "total_score": 0.0,
        "distance_km": 0.0
    }
    
    # 1. Feature matching (%35)
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    feature_keywords = {
        'wifi': ['wifi', 'wi-fi', 'internet'],
        'deniz': ['deniz', 'sea', 'ocean', 'manzara', 'view'],
        'sessiz': ['quiet', 'sessiz', 'sakin'],
        'açık': ['outdoor', 'açık', 'garden', 'bahçe', 'teras'],
        'çalışma': ['work', 'study', 'çalışma'],
    }
    
    matched: int = 0
    for feature in features:
        if feature in feature_keywords:
            if any(kw in place_desc for kw in feature_keywords[feature]):
                matched += 1  # type: ignore[operator]
    
    if features:
        scores["feature_score"] = float(matched / len(features)) * 0.35
    
    # 2. Distance score (%30)
    if user_lat and user_lng and place.get('latitude') and place.get('longitude'):
        dist = calculate_distance(user_lat, user_lng, place['latitude'], place['longitude'])
        scores["distance_km"] = float(round(dist, 2))  # type: ignore[call-overload]
        
        if dist <= 1:
            dist_score = 1.0
        elif dist <= 3:
            dist_score = 0.8
        elif dist <= 5:
            dist_score = 0.5
        else:
            dist_score = 0.2
        
        scores["distance_score"] = dist_score * 0.3
    
    # 3. Popularity (%20)
    rating: float = float(place.get('rating', 0) or 0)
    review_count: int = int(place.get('review_count', 0) or 0)
    
    rating_score = (rating / 5.0) * 0.5
    
    if review_count > 1000:
        review_score = 0.5
    elif review_count > 500:
        review_score = 0.4
    elif review_count > 100:
        review_score = 0.3
    elif review_count > 50:
        review_score = 0.2
    else:
        review_score = 0.1
    
    scores["popularity_score"] = (rating_score + review_score) * 0.2
    
    # 4. Time & Weather Intelligence (%10)
    time_score_val = 0.0
    weather_condition = "Unknown"
    
    if isinstance(time_of_day, dict):
        hour = time_of_day.get('hour', int(datetime.now().hour))
        weather = time_of_day.get('weather', {})
        weather_condition = weather.get('condition', 'Unknown').lower()
    else:
        hour = int(datetime.now().hour)
        
    category = place.get('category', '').lower()
    place_desc = (place.get('description', '') + ' ' + place.get('name', '')).lower()
    
    # --- Saat Zekası ---
    if 6 <= hour < 11 and ('cafe' in category or 'kahve' in category or 'fırın' in category):
        time_score_val += 0.05
    elif 11 <= hour < 15 and 'restaurant' in category:
        time_score_val += 0.05
    elif 18 <= hour <= 23 and ('bar' in category or 'restaurant' in category or 'pub' in category):
        time_score_val += 0.08
    elif hour >= 23 or hour < 6:
        if 'bar' in category or 'pub' in category or 'gece' in place_desc:
            time_score_val += 0.10
        elif 'cafe' in category:
            time_score_val -= 0.10
            
    # --- Hava Durumu Zekası ---
    is_outdoor = any(kw in place_desc for kw in ['açık', 'bahçe', 'teras', 'outdoor', 'sahil', 'deniz'])
    
    if 'rain' in weather_condition or 'snow' in weather_condition or 'storm' in weather_condition:
        if is_outdoor:
            time_score_val -= 0.15
        else:
            time_score_val += 0.05
            
    elif 'clear' in weather_condition or 'sun' in weather_condition:
        if is_outdoor:
            time_score_val += 0.10
            
    scores["time_score"] = max(min(time_score_val, 0.10), -0.15)
    
    # 5. Review AI Sentiment (%15)
    review_score_val = 0.0
    user_review = place.get('user_review', '')
    if user_review:
        sentiment_bonus = model_manager.analyze_review_sentiment(user_review)
        if sentiment_bonus > 0.05:
            review_score_val = 0.15
        elif sentiment_bonus < -0.05:
            review_score_val = -0.15
        else:
            review_score_val = 0.05
    
    scores["review_ai_score"] = review_score_val
    
    # Tüm skorları topla
    scores["total_score"] = float(min(
        max(
            scores["feature_score"] +
            scores["distance_score"] +
            scores["popularity_score"] +
            scores["time_score"] +
            scores.get("review_ai_score", 0.0),
            0.0
        ),
        1.0
    ))
    
    return scores


def strict_category_match(user_category: str, place_category: str) -> bool:
    """Sıkı kategori eşleştirme"""
    user_cat = user_category.lower()
    place_cat = place_category.lower()
    
    category_synonyms = {
        'kafe': ['cafe', 'coffee', 'kahve', 'kahvehane', 'coffeehouse', 'coffee shop'],
        'restoran': ['restaurant', 'restoran', 'food', 'lokanta', 'restorant', 'yemek', 'kebap', 'steakhouse'],
        'bar': ['bar', 'pub', 'drink', 'meyhane', 'night club', 'lounge'],
        'burger': ['burger', 'hamburger', 'fast food'],
    }
    
    if user_cat in category_synonyms:
        synonyms = category_synonyms[user_cat]
        return any(syn in place_cat for syn in synonyms)
    
    return user_cat in place_cat


def rerank_places(places: List[Dict], query: str, top_k: int = 5) -> List[Dict]:
    """Reranking algoritması - importance keywords ile"""
    importance_keywords = set(query.lower().split())
    importance_keywords.discard('ve')
    importance_keywords.discard('bir')
    importance_keywords.discard('için')
    
    reranked = []
    
    for place in places:
        base_score = place.get('match_score', 0)
        bonus = 0
        
        place_text = (place.get('name', '') + ' ' + place.get('description', '')).lower()
        
        premium_words = ['muhteşem', 'premium', 'özel', 'lüks', 'manzara', 'güzel', 'harika']
        for word in premium_words:
            if word in query.lower() and word in place_text:
                bonus += 0.05
        
        final_score = min(base_score + bonus, 1.0)
        
        reranked.append({
            **place,
            'rerank_score': round(final_score, 3)
        })
    
    reranked.sort(key=lambda x: x['rerank_score'], reverse=True)
    
    return reranked[:top_k]  # type: ignore[return-value]


# ==================== ENDPOINTS ====================

@app.get("/", include_in_schema=False)
@app.get("/ui", include_in_schema=False)
async def serve_ui():
    """Chat UI'yi doğrudan backend üzerinden serve et (CORS sorunu olmaz)"""
    from fastapi.responses import HTMLResponse  # type: ignore[import]
    ui_path = os.path.join(os.path.dirname(__file__), "chat_ui.html")
    if not os.path.exists(ui_path):
        return HTMLResponse("<h1>chat_ui.html bulunamadı</h1>", status_code=404)
    with open(ui_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)


@app.get("/health")
async def health():
    """Health check"""
    cache_ok = cache_manager is not None and cache_manager.is_connected
    return {
        "status": "ok",
        "version": "2.1.0",
        "cache": "redis" if cache_ok else "none (fallback)",
        "model_loaded": model_manager.is_loaded,
        "rag": {
            "ready": rag_bootstrap_status.get("ready"),
            "indexed_count": rag_bootstrap_status.get("indexed_count"),
            "source_count": rag_bootstrap_status.get("source_count"),
            "storage_mode": rag_bootstrap_status.get("storage_mode"),
            "auto_index": settings.RAG_AUTO_INDEX,
            "last_error": rag_bootstrap_status.get("last_error")
        }
    }


@app.get("/api/info")
async def get_info():
    """Sistem bilgileri ve istatistikler (Faz 2)"""
    cache_stats = cache_manager.get_stats() if cache_manager else {"backend": "none (no redis)"}
    return {
        "version": "2.1.0",
        "phase": "Faz 2 - Performance Optimized",
        "features": [
            "2.1: Redis Cache with TTL",
            "2.2: Model Preloading at Startup",
            "2.3: Async Pipeline Support"
        ],
        "cache_stats": cache_stats,
        "model_stats": {
            "is_loaded": model_manager.is_loaded,
            "device": model_manager.device
        },
        "rag": {
            **rag_bootstrap_status,
            "auto_index": settings.RAG_AUTO_INDEX,
            "index_on_startup": settings.RAG_INDEX_ON_STARTUP,
            "collection": settings.QDRANT_COLLECTION_NAME,
            "qdrant_url": settings.QDRANT_URL or ":memory:"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/stats")
async def get_stats():
    """
    Detaylı sistem istatistikleri:
    - Cache hit/miss oranı
    - Redis bellek kullanımı
    - Kaç anahtar saklanıyor
    - Yorum insight cache sayısı
    - Uptime
    """
    stats = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "version": "2.1.0",
            "model_loaded": model_manager.is_loaded,
            "model_device": model_manager.device,
        },
        "cache": {},
        "review_insights": {},
        "nlp": {
            "categories": 6,
            "districts": 42,
            "features": 8,
            "moods": 5,
            "specialty_patterns": 23,   # review_analyzer kategorileri
        }
    }
    
    if cache_manager and cache_manager.is_connected:
        try:
            import redis as _redis
            r = _redis.Redis.from_url(cache_manager.redis_url)
            info = r.info()
            
            total_keys: int = int(r.dbsize())
            
            insight_keys: int = len(r.keys("review_insights_*"))  # type: ignore[arg-type]
            search_keys: int  = len(r.keys("smart_search*"))      # type: ignore[arg-type]
            
            # Redis info'dan direkt typed değerler al
            hits: int   = int(info.get("keyspace_hits", 0) or 0)
            misses: int = int(info.get("keyspace_misses", 0) or 0)
            hit_total: int = hits + misses
            hit_rate: float = float(round(hits / hit_total * 100, 1)) if hit_total > 0 else 0.0
            
            mem_used_mb:  float = float(round(int(info.get("used_memory", 0) or 0) / 1024 / 1024, 2))
            mem_peak_mb:  float = float(round(int(info.get("used_memory_peak", 0) or 0) / 1024 / 1024, 2))
            clients: int  = int(info.get("connected_clients", 0) or 0)
            
            stats["cache"] = {  # type: ignore[assignment]
                "status": "connected",
                "total_keys": total_keys,
                "search_cache_keys": search_keys,
                "insight_cache_keys": insight_keys,
                "memory_used_mb": mem_used_mb,
                "memory_peak_mb": mem_peak_mb,
                "connected_clients": clients,
                "hits": hits,
                "misses": misses,
                "hit_rate_pct": hit_rate,
            }
            
            stats["review_insights"] = {  # type: ignore[assignment]
                "cached_insights": insight_keys,
                "ttl_hours": 24,
                "note": "Her mekan için 24 saat cache tutulur"
            }
            
        except Exception as e:
            stats["cache"] = {"status": "error", "detail": str(e)}  # type: ignore[assignment]
    else:
        stats["cache"] = {"status": "not_connected", "detail": "Redis çalışmıyor"}  # type: ignore[assignment]
    
    return stats


@app.post("/api/smart-search-v2")
async def smart_search_v2(request: SmartSearchRequest):
    """
    Akıllı mekan arama - Faz 2 Optimized (Async + Cache)
    
    Yeni Özellikler:
    - Cache: Aynı sorgu 2. kez çok hızlı
    - Preloading: Modeller startup'ta yüklü
    - Async: Paralel işlemler
    """
    try:
        response_language = resolve_response_language(request.query, request.language, request.locale)
        # 1. CACHE CHECK
        cache_key = None
        if cache_manager:
            cache_key = cache_manager.generate_key(
                request.query,
                request.location,
                user_lat=str(request.user_lat),
                user_lng=str(request.user_lng),
                language=response_language
            )
            cached_result = cache_manager.get(cache_key)
            if cached_result:
                return {
                    **cached_result,
                    "_cache": {
                        "hit": True,
                        "timestamp": datetime.now().isoformat()
                    }
                }
        
        # 2. SEARCH
        start_time = datetime.now()
        
        from serpapi_client import SerpApiClient
        
        parsed = parse_natural_query(request.query)
        
        # --- Niyet Kontrolü (Intent Check) ---
        if parsed.get('is_inappropriate'):
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": localized("inappropriate", response_language),
                "recommendations": [],
                "_cache": {"hit": False}
            }
            
        if parsed.get('is_chit_chat'):
            return {
                "query": request.query,
                "found": 0,
                "is_conversational": True,
                "message": localized("chit_chat", response_language),
                "recommendations": [],
                "_cache": {"hit": False}
            }
        
        search_location = parsed['district'] or request.location
        
        # Sadece kategori yerine çıkartılan özellikleri de Google Maps aramasına dahil et
        # Eğer hiç özellik yoksa, tüm query'i aratmak daha spesifik sonuç verebilir
        if parsed['features']:
            feature_str = " ".join(parsed['features'])
            search_query = f"{feature_str} {parsed['category']} in {search_location}"
        else:
            # Doğrudan NLP'nin kaçırdığı detaylar için orijinal query'i kullan ama lokasyon ekle
            search_query = f"{request.query} in {search_location}"
            
        client = SerpApiClient()
        places = client.search_places(
            query=search_query,
            location=f"{search_location}, Turkey",
            limit=request.limit * 2,
            lat=request.user_lat,
            lng=request.user_lng
        )
        
        if not places:
            return {
                "query": request.query,
                "found": 0,
                "recommendations": [],
                "_cache": {"hit": False}
            }
        
        # Kategori filtresi
        filtered_places = [p for p in places if strict_category_match(parsed['category'], p.get('category', ''))]
        if len(filtered_places) < 3:
            filtered_places = places
        
        # Mesafe filtresi
        if request.user_lat and request.user_lng:
            distance_filtered = [
                p for p in filtered_places
                if p.get('latitude') and p.get('longitude')
                and calculate_distance(request.user_lat, request.user_lng, p['latitude'], p['longitude']) <= request.max_distance_km
            ]
            if len(distance_filtered) >= 5:
                filtered_places = distance_filtered
        
        # Çalışma Saatleri Filtresi
        if parsed.get('want_open_now'):
            open_places = [p for p in filtered_places if is_place_open(p) is not False]
            if len(open_places) >= 3:
                filtered_places = open_places
                print(f"[OpenNow] {len(open_places)}/{len(filtered_places)} mekan açık")
        
        # Bütçe Filtresi (NLP'den alınan budget bilgisi)
        budget = parsed.get('budget', 'orta')
        if budget == 'ucuz':
            budget_filtered = [p for p in filtered_places if p.get('price_level', 2) <= 2]
            if len(budget_filtered) >= 3:
                filtered_places = budget_filtered
        elif budget == 'lüks':
            budget_filtered = [p for p in filtered_places if p.get('price_level', 2) >= 3]
            if len(budget_filtered) >= 2:
                filtered_places = budget_filtered
        
        # Hava Durumu Çekme (Open-Meteo API - Ücretsiz, Limitsiz)
        weather_data = {"condition": "Unknown", "temp": None}
        if request.user_lat and request.user_lng:
            try:
                # WMO Weather interpretation codes
                weather_codes = {
                    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Fog", 48: "Depositing rime fog",
                    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
                    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
                    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
                    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                }
                
                with httpx.Client(timeout=3.0) as w_client:
                    w_res = w_client.get(f"https://api.open-meteo.com/v1/forecast?latitude={request.user_lat}&longitude={request.user_lng}&current_weather=true")
                    if w_res.status_code == 200:
                        current = w_res.json().get("current_weather", {})
                        code = current.get("weathercode", -1)
                        weather_data["condition"] = weather_codes.get(code, "Unknown")
                        weather_data["temp"] = current.get("temperature")
            except Exception as e:
                print(f"[Weather] Hava durumu çekilemedi: {e}")

        # Skorlama İçin Zaman ve Hava Durumu Paketi
        time_weather_context = {
            "hour": int(datetime.now().hour),
            "weather": weather_data
        }
        
        scored_places = []
        for place in filtered_places:
            scores = hybrid_score(
                place,
                parsed['features'],
                user_lat=request.user_lat,
                user_lng=request.user_lng,
                time_of_day=time_weather_context
            )
            
            # Mesafe filtresi: max_distance_km'den uzak mekanları çıkar
            distance_km = scores.get("distance_km", 0)
            if request.max_distance_km and distance_km > 0 and distance_km > request.max_distance_km:
                continue  # Çok uzak, atla
            
            scored_places.append({
                **place,
                "match_score": round(scores["total_score"], 3),
                "distance_km": distance_km,
                "score_breakdown": {
                    "feature": round(scores["feature_score"], 3),
                    "distance": round(scores["distance_score"], 3),
                    "popularity": round(scores["popularity_score"], 3),
                    "time": round(scores["time_score"], 3)
                }
            })
        
        scored_places.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Reranking
        reranked_places = rerank_places(scored_places[:min(20, len(scored_places))], request.query, top_k=5)
        
        # ==================== RAG ENHANCEMENT ====================
        # RAG sistemi ile ek bağlam ekle (vektör veritabanından semantik arama)
        rag_context = None
        rag_status = await ensure_rag_ready()
        try:
            rag = _get_rag_pipeline()
            if rag and rag_status.get("ready"):
                print(f"[RAG] Sorgu için ek bağlam aranıyor: {request.query}")
                rag_result = rag.process(
                    user_query=request.query,
                    location={"lat": request.user_lat, "lng": request.user_lng} if request.user_lat and request.user_lng else None,
                    language=response_language
                )
                if rag_result and rag_result.get("oneriler"):
                    rag_context = {
                        "similar_places_count": len(rag_result["oneriler"]),
                        "source_count": rag_status.get("source_count", 0),
                        "indexed_count": rag_status.get("indexed_count", 0),
                        "storage_mode": rag_status.get("storage_mode"),
                        "analysis": rag_result.get("sorgu_analizi", ""),
                        "top_matches": [
                            {
                                "name": place.get("ad"),
                                "category": place.get("kategori"),
                                "score": place.get("benzerlik_skoru", 0)
                            }
                            for place in rag_result["oneriler"][:3]
                        ]
                    }
                    print(f"[RAG] OK {len(rag_result['oneriler'])} benzer mekan bulundu (vektör veritabanı)")
        except Exception as e:
            print(f"[RAG] Hata (atlanıyor): {e}")

        # ==================== YORUM BAZLI INSIGHT ANALİZİ ====================
        # Her mekan için SerpAPI yorumlarını çekip ne ile övüldüğünü tespit et
        if request.analyze_reviews:
            await _enrich_with_review_insights(reranked_places, response_language)
        
        # Gerekçeler
        feature_names = {
            key: labels.get(response_language, labels["tr"])
            for key, labels in FEATURE_LABELS.items()
        }
        
        for place in reranked_places:
            reasons = []
            
            if place.get('rating', 0) >= 4.8:
                reasons.append(f"⭐ {reason_label('high_rating', response_language)} ({place['rating']})")
            
            if place.get('review_count', 0) > 500:
                reasons.append(f"💬 {reason_label('many_reviews', response_language)} ({place['review_count']} {reason_label('reviews', response_language)})")
            
            if place.get('distance_km') and place['distance_km'] > 0:
                if place['distance_km'] <= 2:
                    reasons.append(f"📍 {reason_label('very_near', response_language)} ({place['distance_km']}km)")
                elif place['distance_km'] <= 5:
                    reasons.append(f"📍 {reason_label('near', response_language)} ({place['distance_km']}km)")
            
            if parsed['features']:
                for feature in parsed['features']:
                    if feature in feature_names:
                        reasons.append(feature_names[feature])
            
            if place.get('recommendation_reason_bonus'):
                reasons.append(place['recommendation_reason_bonus'])
            
            # Yorum bazlı insight'ları gerekçeye ekle
            review_insights = place.get('review_insights', {})
            if review_insights and review_insights.get('specialties'):
                top_specs = review_insights['specialties'][:2]
                for spec in top_specs:
                    reasons.insert(0, spec['display'])  # Başa ekle - en önemli bilgi
            
            place['recommendation_reason'] = " • ".join(reasons) if reasons else reason_label("general_fit", response_language)
        
        # ==================== GROQ LLM DOĞAL DİL CEVABI ====================
        llm_message = ""
        if settings.GROQ_API_KEY and reranked_places:
            try:
                llm_message = await generate_llm_response(
                    request.query, reranked_places, parsed, response_language
                )
            except Exception as e:
                print(f"[Groq] LLM atlandı: {e}")

        
        response = {
            "query": request.query,
            "found": len(places),
            "recommendations": reranked_places,
            "ai_message": llm_message,
            "message": llm_message,
            "context": {
                "weather": weather_data.get("condition"),
                "temperature": weather_data.get("temp"),
                "rag_enhanced": rag_context is not None,
                "rag_source_count": rag_status.get("source_count", 0),
                "rag_indexed_count": rag_status.get("indexed_count", 0),
                "language": response_language
            },
            "rag_context": rag_context,  # RAG'dan gelen ek bilgi
            "_cache": {"hit": False}
        }

        # Cache'e kaydet (Redis varsa)
        if cache_manager and cache_key:
            cache_manager.set(cache_key, response)

        elapsed = (datetime.now() - start_time).total_seconds()
        response["_performance"] = {
            "response_time_seconds": round(elapsed, 3),
            "cached": False
        }
        
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== REVIEW INSIGHT HELPER ====================

async def _enrich_with_review_insights(places: List[Dict], language: str = "tr") -> None:
    """
    Reranked mekanların yorumlarını paralel olarak çekip
    ne ile övüldüklerini tespit eder.
    
    Örnek çıktı:
      place['review_insights'] = {
          'specialties': [
              {'emoji': '☕', 'label': 'Kahvesiyle ünlü', 'mention_count': 8, ...},
              {'emoji': '🍔', 'label': 'Hamburgeriyle meşhur', 'mention_count': 5, ...}
          ],
          'top_specialty': '☕ Kahvesiyle ünlü (8 yorum)',
          'highlight_tags': ['☕ Kahve', '🍔 Hamburger'],
          'summary': 'Bu mekan özellikle kahvesi ile öne çıkıyor.'
      }
    """
    try:
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
    except Exception as e:
        print(f"[ReviewInsight] SerpApiClient başlatılamadı: {e}")
        return

    async def _fetch_and_analyze(place: Dict) -> None:
        """Tek mekan için yorum çek ve analiz et (async wrapper)"""
        data_id = place.get('data_id', '')
        if not data_id:
            place['review_insights'] = {'specialties': [], 'top_specialty': None,
                                        'highlight_tags': [], 'summary': ''}
            return

        # Redis cache'de var mı?
        insight_cache_key = f"review_insights_{data_id}_{language}"
        if cache_manager:
            cached = cache_manager.get(insight_cache_key)
            if cached:
                place['review_insights'] = cached
                print(f"[ReviewInsight] Cache hit: {place.get('name', data_id)}")
                return

        # Yorumları çek (sync → thread pool)
        try:
            loop = asyncio.get_event_loop()
            reviews = await loop.run_in_executor(
                None,
                lambda: client.get_place_reviews(data_id, max_reviews=20)  # 20 yorum yeterli
            )
        except Exception as e:
            print(f"[ReviewInsight] Yorum çekme hatası ({data_id}): {e}")
            reviews = []

        # Yorumları analiz et
        place_name = place.get('name', '')
        insights = fast_extract_insights(reviews, place_name)
        insights = localize_review_insights(insights, language)
        place['review_insights'] = insights

        # Specialties'i log'a yaz
        if insights.get('specialties'):
            specs = ', '.join([s['emoji'] + ' ' + s['key'] for s in insights['specialties'][:3]])
            print(f"[ReviewInsight] {place_name}: {specs}")
        else:
            print(f"[ReviewInsight] {place_name}: No specialties detected ({len(reviews)} reviews)")

        # Cache'e kaydet (24 saat TTL - yorum verileri sık değişmez)
        if cache_manager and reviews:
            try:
                cache_manager.client.setex(insight_cache_key, 86400, json.dumps(insights, ensure_ascii=False))
            except Exception:
                pass

    # Tüm mekanlar için paralel olarak çalıştır
    tasks = [_fetch_and_analyze(place) for place in places]
    await asyncio.gather(*tasks, return_exceptions=True)


@app.post("/api/rag-search")
async def rag_search(request: SmartSearchRequest):
    """
    Pure RAG search - Sadece vektör veritabanı araması
    SerpAPI kullanmadan, sadece yerel veritabanından semantik arama yapar
    """
    try:
        response_language = resolve_response_language(request.query, request.language, request.locale)
        rag_status = await ensure_rag_ready()
        if not rag_status.get("ready"):
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "RAG index hazır değil.",
                    "rag": rag_status
                }
            )

        rag = _get_rag_pipeline()
        if not rag:
            raise HTTPException(
                status_code=503,
                detail="RAG sistemi kullanılamıyor. Vektör veritabanı yüklenmemiş olabilir."
            )

        # RAG ile ara
        result = rag.process(
            user_query=request.query,
            location={
                "lat": request.user_lat,
                "lng": request.user_lng
            } if request.user_lat and request.user_lng else None,
            language=response_language
        )

        if not result or not result.get("oneriler"):
            return {
                "query": request.query,
                "found": 0,
                "recommendations": [],
                "message": localized("no_vector_match", response_language),
                "source": "RAG (Vector Database)",
                "rag": rag_status
            }

        # Format response
        recommendations = []
        for oneri in result["oneriler"]:
            recommendations.append({
                "name": oneri.get("ad"),
                "address": oneri.get("adres"),
                "latitude": oneri.get("enlem"),
                "longitude": oneri.get("boylam"),
                "category": oneri.get("kategori"),
                "description": oneri.get("aciklama"),
                "similarity_score": round(oneri.get("benzerlik_skoru", 0), 3),
                "recommendation_reason": oneri.get("gerekce", "")
            })

        return {
            "query": request.query,
            "found": len(recommendations),
            "recommendations": recommendations,
            "analysis": result.get("sorgu_analizi", ""),
            "source": "RAG (Vector Database)",
            "hybrid_mode": False,
            "rag_context": {
                "rag_enhanced": True,
                "rag_source_count": rag_status.get("source_count", 0),
                "rag_indexed_count": rag_status.get("indexed_count", 0),
                "storage_mode": rag_status.get("storage_mode")
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-place-reviews")
async def analyze_place_reviews(request: AnalyzeReviewRequest):
    """
    Seçilen mekan için derinlemesine yorum analizi:
    - Sentiment skoru
    - Mekanın neyle övüldüğü (kahve, hamburger, atmosfer vs.)
    - Örnek yorumlar
    """
    try:
        response_language = resolve_response_language(
            request.place_name or "",
            request.language,
            request.locale
        )
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
        
        deep_reviews = client.get_place_reviews(request.data_id, max_reviews=50)
        
        if not deep_reviews:
            return {
                "success": False,
                "review_count": 0,
                "analysis_text": localized("not_enough_reviews", response_language),
                "specialties": []
            }
        
        count = len(deep_reviews)
        place_name = request.place_name or ""
        
        # 1. Keyword bazlı specialty çıkarma (hızlı, her zaman çalışır)
        insights = fast_extract_insights(deep_reviews, place_name)
        insights = localize_review_insights(insights, response_language)
        
        # 2. Embedding tabanlı sentiment (model yüklüyse)
        sentiment_bonus = model_manager.analyze_review_sentiment(deep_reviews)
        
        # 3. Analiz metni üret
        analysis_text = build_review_analysis_text(
            count,
            insights.get('specialties', []),
            sentiment_bonus,
            response_language
        )
        
        # Örnek yorumlar (her specialty için)
        example_reviews = []
        for spec in insights.get('specialties', [])[:3]:
            if spec.get('example_review'):
                example_reviews.append({
                    "specialty": spec['label'],
                    "emoji": spec['emoji'],
                    "review": spec['example_review']
                })
            
        return {
            "success": True,
            "review_count": count,
            "sentiment_score": round(sentiment_bonus, 3),
            "analysis_text": analysis_text,
            "specialties": insights.get('specialties', []),
            "highlight_tags": insights.get('highlight_tags', []),
            "example_reviews": example_reviews,
            "summary": insights.get('summary', ''),
            "language": response_language
        }
    except Exception as e:
        print(f"[ReviewInsight] HATA Yorum analizi hatası: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "review_count": 0,
            "analysis_text": localized("reviews_unavailable", response_language if 'response_language' in locals() else "tr"),
            "specialties": []
        }


# ==================== GÖRSEL ARAMA ====================

@app.post("/api/image-search")
async def image_search(request: ImageSearchRequest):
    """
    Görsel ile mekan arama:
    1. Görseli Gemini Vision ile analiz et → ne tür mekan istendiğini anla
    2. Çıkan sorgu ile smart-search-v2 pipeline'ını çalıştır
    3. Mekan kartlarını döndür
    """
    try:
        # 1. Görsel Analiz
        print(f"[ImageSearch] Gorsel analiz ediliyor... ({len(request.image_base64)} bytes b64)")
        vision_result = await analyze_image_with_llama(request.image_base64, request.mime_type)

        detected_query    = vision_result.get("query", "kafe")
        detected_category = vision_result.get("category", "kafe")
        description       = vision_result.get("description", "")
        has_gemini_error  = "error" in vision_result

        print(f"[ImageSearch] Tespit: '{detected_query}' / {detected_category}")

        # 2. Smart Search pipeline'ını çağır (aynı mantık, farklı sorgu)
        smart_req = SmartSearchRequest(
            query=detected_query,
            location=request.location,
            limit=request.limit,
            user_lat=request.user_lat,
            user_lng=request.user_lng,
            max_distance_km=request.max_distance_km,
            analyze_reviews=False,
            language=request.language,
            locale=request.locale,
        )
        search_result = await smart_search_v2(smart_req)

        # 3. Sonucu zenginleştir
        return {
            **search_result,
            "image_analysis": {
                "detected_query": detected_query,
                "category": detected_category,
                "description": description,
                "gemini_available": not has_gemini_error,
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
