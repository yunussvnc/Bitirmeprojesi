"""Cohesive module extracted from the original AI FastAPI application."""

import os
import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, UploadFile, File, Form  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional, Dict, Union
from contextlib import asynccontextmanager
import math
import asyncio
import hashlib
import json
import re
import httpx  # type: ignore[import]
from datetime import datetime
import redis  # type: ignore[import]
import sqlite3
from dotenv import load_dotenv  # type: ignore[import]
import pathlib as _pl
import logging
from review_analyzer import fast_extract_insights  # type: ignore[import]
import sys, os as _os
from src.models.llm.llm_wrapper import LayeredLLMWrapper  # type: ignore[import]
from src.config import settings  # type: ignore[import]
from scripts.prepare_vector_db import (  # type: ignore[import]
    get_mekanlar_from_json,
    create_embedding_text,
)
from qdrant_client.models import PointStruct  # type: ignore[import]
from src.rag.pipeline import RAGPipeline  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

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
