# -*- coding: utf-8 -*-
"""Grup 6 - Proje Adım 3 PDF raporu üretici."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted, KeepTogether
)
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

OUTPUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "dökümanlar",
    "Grup_6_Proje_Adım3.pdf",
)

CONTENT_W = 16 * cm  # A4 - 2.5cm sol/sağ margin

FONT = "Times-Roman"
FONT_B = "Times-Bold"
FONT_I = "Times-Italic"
try:
    win = os.environ.get("WINDIR", r"C:\Windows")
    tnr = os.path.join(win, "Fonts", "times.ttf")
    tnrb = os.path.join(win, "Fonts", "timesbd.ttf")
    tnri = os.path.join(win, "Fonts", "timesi.ttf")
    if os.path.exists(tnr):
        pdfmetrics.registerFont(TTFont("TNR", tnr))
        pdfmetrics.registerFont(TTFont("TNRB", tnrb))
        pdfmetrics.registerFont(TTFont("TNRI", tnri))
        FONT, FONT_B, FONT_I = "TNR", "TNRB", "TNRI"
except Exception:
    pass


def build_styles():
    return {
        "title": ParagraphStyle(
            "title", fontName=FONT_B, fontSize=16, leading=24,
            alignment=TA_CENTER, spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontName=FONT, fontSize=12, leading=18,
            alignment=TA_CENTER, spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1", fontName=FONT_B, fontSize=14, leading=21,
            spaceBefore=10, spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "h2", fontName=FONT_B, fontSize=12, leading=18,
            spaceBefore=8, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", fontName=FONT, fontSize=12, leading=18,
            alignment=TA_JUSTIFY, spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet", fontName=FONT, fontSize=12, leading=18,
            leftIndent=18, spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "code", fontName="Courier", fontSize=9, leading=12,
            leftIndent=8, spaceAfter=6,
        ),
        "th": ParagraphStyle(
            "th", fontName=FONT_B, fontSize=9, leading=12, alignment=TA_LEFT,
        ),
        "td": ParagraphStyle(
            "td", fontName=FONT, fontSize=9, leading=12, alignment=TA_LEFT,
        ),
    }


def P(text, style):
    return Paragraph(text.replace("\n", "<br/>"), style)


def table(data, col_widths, styles):
    """Tablo hücrelerini Paragraph ile sararak taşmayı önler."""
    th, td = styles["th"], styles["td"]
    rows = []
    for ri, row in enumerate(data):
        cell_style = th if ri == 0 else td
        rows.append([P(str(c), cell_style) for c in row])
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF4")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def section(title, body_paragraphs, styles):
    """Başlık + paragrafları birlikte tut (sayfa ortasında kopmasın)."""
    items = [P(title, styles["h1"])] + [P(p, styles["body"]) for p in body_paragraphs]
    return KeepTogether(items)


def main():
    styles = build_styles()
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        rightMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )
    story = []

    # Kapak (hazırlayan/danışman/tarih YOK)
    story.append(Spacer(1, 4 * cm))
    story.append(P("Yazılım Gerçekleme, Test ve Bakım – Proje Adımı 3", styles["title"]))
    story.append(P("Arayüz Tasarımı, Gerçekleme ve Kod Kalitesi (Bakım) Analizi", styles["subtitle"]))
    story.append(Spacer(1, 1.2 * cm))
    story.append(P("Proje: AsEmOs – Yapay Zeka Destekli Mekan Öneri ve Sosyal Platform", styles["subtitle"]))
    story.append(Spacer(1, 1 * cm))
    story.append(P("Teslim Dosyası: Grup_6_Proje_Adım3.pdf", styles["subtitle"]))
    story.append(P(
        "Seçilen Opsiyon: OPSİYON A – İç ve Dış Arayüzlerin Gerçeklenmesi ve Dokümantasyonu",
        styles["subtitle"],
    ))
    story.append(PageBreak())

    # 1. Giriş
    story.append(P("1. Proje Adımının Amacı", styles["h1"]))
    story.append(P(
        "Bu proje adımının amacı; Proje Adımı 1'de modellenen sistem tasarımının ve Proje Adımı 2'de "
        "belirlenen teknoloji yığınının kod tabanında gerçeklenmesini, sistemin iç ve dış arayüzlerinin "
        "tanımlanmasını ve bu arayüzlerin dokümante edilmesini sağlamaktır. AsEmOs projesi; mobil istemci, "
        "ana backend API ve AI arama servisi olmak üzere üç katmanlı, yoğun entegrasyon mimarisine sahip "
        "olduğundan bu adımda <b>Opsiyon A</b> seçilmiştir.",
        styles["body"],
    ))
    story.append(P(
        "<b>Opsiyon A seçim gerekçesi:</b> Proje; REST API, WebSocket, mobil UI, LLM servisi, OAuth, "
        "medya yükleme, e-posta, push bildirim ve harici arama API'leri gibi çok sayıda iç/dış arayüz "
        "içermektedir. Monolitik veya yalnızca lokal çalışan bir yapı söz konusu olmadığından Opsiyon B "
        "(statik kod analizi) yerine arayüz gerçekleme ve dokümantasyon odaklı yaklaşım tercih edilmiştir.",
        styles["body"],
    ))

    story.append(P("2. Önceki Adımlarla Uyum", styles["h1"]))
    story.append(P(
        "Proje Adımı 1'de tanımlanan use-case'ler (kayıt, giriş, AI arama, görsel arama, yorum analizi) "
        "ve sınıf/sekans diyagramları; Proje Adımı 2'de seçilen Python/FastAPI, React Native/Expo, "
        "PostgreSQL, Qdrant, Redis ve Groq teknolojileriyle kod tabanında karşılık bulmuştur. "
        "Aşağıdaki tablo, tasarım kararlarının gerçekleme durumunu özetler.",
        styles["body"],
    ))
    story.append(table([
        ["Adım 1 Tasarım", "Adım 2 Teknoloji", "Adım 3 Gerçekleme"],
        ["UC1 Kayıt / UC2 Giriş", "FastAPI + JWT + PostgreSQL", "backend/app/routers/auth.py"],
        ["UC3 AI Mekan Arama", "AI-LLM + SerpAPI + Groq", "ai-llm/app.py, /api/smart-search-v2"],
        ["UC4 Görsel Arama", "Groq Llama Vision", "ai-llm/app.py, /api/image-search"],
        ["UC5 Yorum Analizi", "Review Analyzer + ST", "ai-llm/review_analyzer.py"],
        ["Sınıf diyagramı", "SQLAlchemy ORM", "backend/models.py, crud.py"],
        ["Mobil ekran akışları", "Expo Router + TS", "apps/mobile/app/"],
    ], [4.8 * cm, 5.2 * cm, 6 * cm], styles))
    story.append(Spacer(1, 0.3 * cm))

    story.append(P("3. Sistem Mimarisi", styles["h1"]))
    story.append(P(
        "Sistem üç ana bileşenden oluşur: (1) <b>Mobil uygulama</b> (apps/mobile) – Expo/React Native "
        "ile iOS/Android istemci; (2) <b>Ana backend</b> (backend) – kimlik doğrulama, sosyal akış, mekan "
        "CRUD, eşleşme ve mesajlaşma; (3) <b>AI-LLM servisi</b> (ai-llm) – doğal dil arama, vektör "
        "benzerliği, SerpAPI entegrasyonu ve yorum analizi. Mobil uygulama ana backend ile JSON/HTTPS "
        "üzerinden konuşur; AI servisi bağımsız FastAPI mikroservisi olarak konumlandırılmıştır.",
        styles["body"],
    ))
    story.append(P(
        "Katmanlı backend mimarisi: <b>Router (Controller)</b> → <b>Service / CRUD</b> → <b>Model (ORM)</b> "
        "→ <b>PostgreSQL</b>. Router katmanı HTTP isteklerini doğrular; iş mantığı crud.py ve app/services/ "
        "altında; kalıcılık SQLAlchemy modelleriyle sağlanır. Mobil tarafta servis katmanı (authService, "
        "apiClient vb.) backend REST uçlarına; AI servisi ise SerpAPI, Groq ve Redis gibi dış sistemlere "
        "bağlanır.",
        styles["body"],
    ))

    # 4. İç Arayüzler — PageBreak kaldırıldı, akış devam eder
    story.append(P("4. İç Arayüzler (Internal Interfaces)", styles["h1"]))
    story.append(P("4.1 Backend Katman Sözleşmeleri", styles["h2"]))
    story.append(table([
        ["Katman", "Konum", "Sorumluluk"],
        ["Router", "app/routers/", "HTTP endpoint, auth, şema doğrulama"],
        ["Service", "app/services/", "E-posta, push, moderasyon, feed"],
        ["CRUD", "crud.py", "Veritabanı sorguları, iş kuralları"],
        ["Schema", "schemas.py", "Pydantic request/response DTO"],
        ["Model", "models.py", "SQLAlchemy ORM varlıkları"],
        ["Dependency", "app/dependencies.py", "get_db, get_current_user"],
    ], [2.8 * cm, 4.2 * cm, 9 * cm], styles))
    story.append(Spacer(1, 0.25 * cm))

    story.append(P("4.2 REST API Endpoint Grupları", styles["h2"]))
    story.append(P(
        "Backend API 13 router modülü ile 100'den fazla endpoint sunar. FastAPI otomatik OpenAPI 3 "
        "şeması üretir; Swagger UI: <b>/docs</b>, JSON şema: <b>/openapi.json</b>.",
        styles["body"],
    ))
    story.append(table([
        ["Modül", "Path", "HTTP", "Amaç"],
        ["auth", "/auth/*", "POST/GET/PUT", "Kayıt, giriş, OAuth, profil"],
        ["places", "/places/*", "GET/POST/PUT", "Mekan arama, CRUD"],
        ["recommend", "/recommend", "POST", "LLM mekan önerisi"],
        ["feed", "/feed, /posts/*", "GET/POST", "Sosyal akış, gönderi"],
        ["messages", "/messages/*", "GET/POST", "DM mesajlaşma"],
        ["match", "/match/*", "GET/POST", "Eşleşme profili"],
        ["notifications", "/notifications/*", "GET/POST", "Bildirimler"],
        ["upload", "/upload/*", "POST", "Cloudinary medya"],
        ["saved", "/saved/*", "GET/POST", "Kaydedilen içerik"],
        ["community", "/community/*", "GET/POST", "Topluluk odaları"],
    ], [2.2 * cm, 3.5 * cm, 2.8 * cm, 7.5 * cm], styles))
    story.append(Spacer(1, 0.25 * cm))

    story.append(P("4.3 Kimlik Doğrulama Arayüzü (UC1 / UC2)", styles["h2"]))
    story.append(P("<b>Endpoint:</b> POST /auth/login", styles["body"]))
    story.append(P("<b>Request (UserLogin):</b>", styles["body"]))
    story.append(Preformatted(
        '{ "email": "kullanici@ornek.com", "password": "sifre123" }',
        styles["code"],
    ))
    story.append(P("<b>Response (Token – HTTP 200):</b>", styles["body"]))
    story.append(Preformatted(
        '{ "access_token": "eyJ...", "refresh_token": "eyJ...",\n'
        '  "token_type": "bearer", "user": { "id": 1, "email": "..." } }',
        styles["code"],
    ))
    story.append(P(
        "<b>Hata kodları:</b> 401 e-posta/şifre hatalı; 403 hesap devre dışı veya e-posta doğrulanmamış; "
        "429 rate limit. Kayıt: POST /auth/register → POST /auth/verify-register.",
        styles["body"],
    ))

    story.append(P("4.4 Mekan Öneri Arayüzü", styles["h2"]))
    story.append(P("<b>Endpoint:</b> POST /recommend", styles["body"]))
    story.append(P("<b>Request (RecommendRequest):</b>", styles["body"]))
    story.append(Preformatted(
        '{ "queryText": "sessiz çalışma mekanı",\n'
        '  "preferences": { "vibe": "quiet", "purpose": "work" },\n'
        '  "location": { "lat": 41.0082, "lng": 28.9784 }, "radius_m": 3000 }',
        styles["code"],
    ))
    story.append(P("<b>Response (RecommendResponse):</b>", styles["body"]))
    story.append(Preformatted(
        '{ "items": [{ "id": 12, "name": "...", "score": 0.92 }],\n'
        '  "summary": "...", "cached": false }',
        styles["code"],
    ))
    story.append(P(
        "Akış: Router → recommend_pipeline (llm_recommend.py) → crud.get_places. "
        "Mobil: apps/mobile/src/services/api.ts → apiPost('/recommend', req).",
        styles["body"],
    ))

    story.append(P("4.5 AI-LLM Servisi İç Arayüzleri", styles["h2"]))
    story.append(table([
        ["Endpoint", "Method", "Açıklama"],
        ["/api/smart-search-v2", "POST", "NLP + SerpAPI + skorlama + LLM"],
        ["/api/image-search", "POST", "Görsel → Groq Vision → arama"],
        ["/api/analyze-place-reviews", "POST", "Yorum sentiment analizi"],
        ["/health", "GET", "Servis sağlık kontrolü"],
        ["/api/stats", "GET", "Redis cache istatistikleri"],
    ], [4.2 * cm, 1.8 * cm, 10 * cm], styles))
    story.append(Spacer(1, 0.2 * cm))
    story.append(P("<b>Smart Search Request:</b>", styles["body"]))
    story.append(Preformatted(
        '{ "query": "Kadıköy\'de sessiz kafe", "location": "Istanbul",\n'
        '  "user_lat": 40.99, "user_lng": 29.02, "analyze_reviews": true }',
        styles["code"],
    ))

    story.append(P("4.6 WebSocket İç Arayüzleri", styles["h2"]))
    story.append(table([
        ["Path", "Protokol", "Kullanım"],
        ["/ws/chat/{id}", "WebSocket", "DM mesajlaşma"],
        ["/notifications/ws", "WebSocket", "Canlı bildirim"],
        ["/community/ws/{room_id}", "WebSocket", "Oda sohbeti"],
    ], [5 * cm, 2.5 * cm, 8.5 * cm], styles))
    story.append(P(
        "WebSocket yöneticisi Redis Pub/Sub ile çoklu sunucu desteği sağlar "
        "(backend/app/websocket/manager.py).",
        styles["body"],
    ))

    story.append(P("4.7 Mobil Servis Katmanı", styles["h2"]))
    story.append(P(
        "Mobil uygulama apiClient.ts üzerinden konuşur: Bearer JWT, otomatik token yenileme "
        "(POST /auth/refresh), retry ve multipart upload.",
        styles["body"],
    ))
    story.append(table([
        ["Servis", "Backend Endpoint"],
        ["authService.ts", "/auth/*"],
        ["mekanService.ts", "/places/*, /health"],
        ["api.ts", "POST /recommend"],
        ["feedService.ts", "/feed/*, /posts/*, /upload/*"],
        ["messageService.ts", "/messages/*"],
        ["matchService.ts", "/match/*"],
        ["notificationService.ts", "/notifications/*"],
    ], [4.5 * cm, 11.5 * cm], styles))

    # 5. Dış Arayüzler
    story.append(P("5. Dış Arayüzler (External Interfaces)", styles["h1"]))
    story.append(P("5.1 Kullanıcı Arayüzü (UI) Entegrasyonu", styles["h2"]))
    story.append(P(
        "Mobil UI Expo Router ile dosya tabanlı yönlendirme kullanır. app/_layout.tsx içindeki "
        "useProtectedRoute hook'u accessToken durumuna göre login, verify-email veya (tabs) "
        "ekranlarına yönlendirir. Auth durumu Zustand (useAuthStore) ve AsyncStorage ile saklanır.",
        styles["body"],
    ))

    story.append(P("5.2 Üçüncü Parti Harici Servisler", styles["h2"]))
    story.append(table([
        ["Servis", "Kullanım", "Config"],
        ["Google OAuth", "Sosyal giriş", "GOOGLE_CLIENT_ID"],
        ["Apple Sign-In", "iOS giriş", "APPLE_CLIENT_ID"],
        ["Groq Cloud", "LLM + görsel analiz", "GROQ_API_KEY"],
        ["SerpAPI", "Mekan araması", "SERPAPI_API_KEY"],
        ["Cloudinary", "Medya CDN", "CLOUDINARY_*"],
        ["Gmail SMTP", "E-posta doğrulama", "SMTP_USER/PASS"],
        ["Google Maps", "Fotoğraf proxy", "GOOGLE_MAPS_API_KEY"],
        ["Redis", "Cache + rate limit", "REDIS_URL"],
        ["Expo Push", "Push bildirim", "exp.host API"],
        ["Open-Meteo", "Hava durumu", "Ücretsiz HTTP"],
        ["Qdrant", "Vektör DB (RAG)", "QDRANT_URL"],
    ], [3.2 * cm, 5.5 * cm, 7.3 * cm], styles))

    story.append(P("5.3 Veritabanı Dış Arayüzü", styles["h2"]))
    story.append(P(
        "PostgreSQL, SQLAlchemy ORM ve Alembic migration ile yönetilir. docker-compose.yml ile "
        "PostgreSQL 15 (port 5433), Qdrant ve Redis aynı ortamda çalışır. 28 tablo; User, Place, "
        "Review, Post, Story, Match, Message, Notification ve medya tablolarını içerir.",
        styles["body"],
    ))

    story.append(P("6. API Dokümantasyonu (OpenAPI / Swagger)", styles["h1"]))
    story.append(P(
        "FastAPI otomatik OpenAPI üretir. Pydantic şemaları ve response_model tanımları tek kaynak "
        "olarak hizmet eder.",
        styles["body"],
    ))
    story.append(table([
        ["Ortam", "Swagger UI", "OpenAPI JSON"],
        ["Geliştirme", "localhost:8000/docs", "localhost:8000/openapi.json"],
        ["AI servisi", "localhost:8080/docs", "localhost:8080/openapi.json"],
        ["Production", "api.asemos.com/docs", "api.asemos.com/openapi.json"],
    ], [3.5 * cm, 6.2 * cm, 6.3 * cm], styles))
    story.append(P(
        "main.py: FastAPI(title='AsEmOs API', version='2.0.0'). Rate limiter /docs yolunu whitelist'e alır.",
        styles["body"],
    ))

    story.append(P("7. HTTP Durum Kodları ve Hata Yönetimi", styles["h1"]))
    story.append(table([
        ["Kod", "Anlam", "Örnek"],
        ["200", "Başarılı", "GET /auth/me"],
        ["400", "Geçersiz istek", "Kayıtlı e-posta"],
        ["401", "Yetkisiz", "Geçersiz JWT"],
        ["403", "Yasak", "Devre dışı hesap"],
        ["404", "Bulunamadı", "Mekan yok"],
        ["429", "Rate limit", "Çok fazla deneme"],
        ["500", "Sunucu hatası", "Backend/AI hatası"],
    ], [2 * cm, 3.5 * cm, 10.5 * cm], styles))
    story.append(P(
        "Mobil apiClient 401'de refresh token dener; başarısız olursa logout. Backend JSON hata: "
        '{"detail": "mesaj"}.',
        styles["body"],
    ))

    story.append(P("8. Gerçekleme Örnekleri (Kod Referansları)", styles["h1"]))
    story.append(P("8.1 Router → Pipeline (Recommend)", styles["h2"]))
    story.append(Preformatted(
        '@router.post("/recommend")\n'
        'def recommend_places(req, db):\n'
        '    result = recommend_pipeline(places, query=req.queryText)\n'
        '    return RecommendResponse(items=items, summary=result["summary"])',
        styles["code"],
    ))
    story.append(P("8.2 Mobil → Backend", styles["h2"]))
    story.append(Preformatted(
        'export async function recommendPlaces(req) {\n'
        '  return await apiPost("/recommend", req);\n}',
        styles["code"],
    ))
    story.append(P("8.3 AI Smart Search", styles["h2"]))
    story.append(Preformatted(
        '@app.post("/api/smart-search-v2")\n'
        'async def smart_search_v2(request):\n'
        '    parsed = parse_natural_query(request.query)\n'
        '    places = SerpApiClient().search_places(...)\n'
        '    return {"recommendations": reranked_places}',
        styles["code"],
    ))

    story.append(P("9. Sonuç", styles["h1"]))
    story.append(P(
        "Proje Adımı 3 kapsamında AsEmOs sisteminin iç ve dış arayüzleri gerçeklenmiş ve dokümante "
        "edilmiştir. Backend katmanlı mimarisi, mobil servis katmanı ve AI-LLM mikroservisi Proje "
        "Adımı 1 tasarım kararları ve Proje Adımı 2 teknoloji seçimleriyle tutarlıdır. REST API uçları "
        "Pydantic şemaları ile tip güvenli tanımlanmış; FastAPI otomatik Swagger dokümantasyonu "
        "üretmektedir. Harici entegrasyonlar konfigürasyon tabanlı ayrıştırılmıştır.",
        styles["body"],
    ))

    story.append(P("10. Kaynaklar", styles["h1"]))
    for ref in [
        "Proje Adımı 1: Sistem Analizi ve Tasarım Modelleme Raporu.",
        "Proje Adımı 2: Teknoloji Seçimi ve Karar Analizi Raporu.",
        "AsEmOs Backend API – /docs, /openapi.json",
        "AsEmOs AI-LLM Servisi – ai-llm/app.py",
        "Mobil Uygulama – apps/mobile",
        "FastAPI Documentation – https://fastapi.tiangolo.com/",
    ]:
        story.append(P(f"• {ref}", styles["bullet"]))

    doc.build(story)
    print(f"PDF oluşturuldu: {OUTPUT}")


if __name__ == "__main__":
    main()
