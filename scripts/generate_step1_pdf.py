import os
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Preformatted,
    Image,
    KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def _try_register_ttf(font_name: str, path: str) -> bool:
    try:
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont(font_name, path))
            return True
    except Exception:
        return False
    return False


def _register_fonts() -> dict:
    """
    Goal: Times New Roman 12pt with Turkish chars.
    On Windows, Times New Roman is usually available under C:\\Windows\\Fonts.
    Fallback to DejaVuSans or built-in Times-Roman if unavailable.
    """
    candidates = [
        ("TimesNewRoman", r"C:\Windows\Fonts\times.ttf"),
        ("TimesNewRoman", r"C:\Windows\Fonts\times.ttf".replace("\\", "/")),
        ("TimesNewRomanPS", r"C:\Windows\Fonts\timesbd.ttf"),  # bold exists separately sometimes
        ("DejaVuSans", r"C:\Windows\Fonts\DejaVuSans.ttf"),
        ("DejaVuSansMono", r"C:\Windows\Fonts\DejaVuSansMono.ttf"),
        ("Consolas", r"C:\Windows\Fonts\consola.ttf"),
    ]

    registered = {}
    for name, path in candidates:
        ok = _try_register_ttf(name, path)
        if ok:
            registered[name] = path

    # Decide body font
    if "TimesNewRoman" in registered:
        body = "TimesNewRoman"
    elif "DejaVuSans" in registered:
        body = "DejaVuSans"
    else:
        body = "Times-Roman"  # built-in (may not fully support Turkish)

    # Decide code font (prefer a Unicode-capable monospace)
    if "DejaVuSansMono" in registered:
        code = "DejaVuSansMono"
    elif "Consolas" in registered:
        code = "Consolas"
    else:
        code = "Courier"

    return {"body": body, "code": code, "registered": registered}


def _puml(code: str) -> str:
    return code.strip() + "\n"


def build_pdf(output_path: str) -> None:
    fonts = _register_fonts()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        title="Yazılım Gerçekleme, Test ve Bakım – Proje Adımı 1",
        author="AsEmOs",
    )

    styles = getSampleStyleSheet()
    body_style = ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontName=fonts["body"],
        fontSize=12,
        leading=18,  # 1.5 line spacing ~ 12*1.5
        spaceAfter=8,
    )
    title_style = ParagraphStyle(
        name="Title",
        parent=styles["Title"],
        fontName=fonts["body"],
        fontSize=16,
        leading=22,
        spaceAfter=14,
    )
    h2_style = ParagraphStyle(
        name="H2",
        parent=styles["Heading2"],
        fontName=fonts["body"],
        fontSize=13,
        leading=18,
        spaceBefore=10,
        spaceAfter=6,
        textColor=colors.HexColor("#111827"),
    )
    h3_style = ParagraphStyle(
        name="H3",
        parent=styles["Heading3"],
        fontName=fonts["body"],
        fontSize=12,
        leading=18,
        spaceBefore=8,
        spaceAfter=4,
        textColor=colors.HexColor("#111827"),
    )
    code_style = ParagraphStyle(
        name="Code",
        fontName=fonts["code"],
        fontSize=8.8,
        leading=11.2,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderPadding=6,
        borderWidth=0.5,
        borderColor=colors.HexColor("#e2e8f0"),
    )

    story = []

    page_width, page_height = A4
    usable_width = page_width - doc.leftMargin - doc.rightMargin

    def add_diagram_image(title: str, img_path: str) -> None:
        if not os.path.exists(img_path):
            story.append(Paragraph(f"{title} (görsel bulunamadı): {img_path}", body_style))
            return
        img = Image(img_path)
        # Scale to page width; keep aspect ratio
        scale = min(usable_width / img.imageWidth, (page_height * 0.72) / img.imageHeight)
        img.drawWidth = img.imageWidth * scale
        img.drawHeight = img.imageHeight * scale
        story.append(KeepTogether([Paragraph(title, h3_style), Spacer(1, 6), img, Spacer(1, 10)]))

    story.append(Paragraph("Yazılım Gerçekleme, Test ve Bakım – Proje Adımı 1", title_style))
    story.append(Paragraph("Sistem Analizi ve Tasarım Modelleme", title_style))
    story.append(Paragraph(f"Tarih: {datetime.now().strftime('%d.%m.%Y')}", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Proje Adımının Amacı", h2_style))
    story.append(
        Paragraph(
            "Bu adımın amacı, mevcut gereksinim seti ve bağlam doğrultusunda sistemin nesne tabanlı tasarımını "
            "oluşturmaktır. Proje kapsamında dinamik etkileşimler Sekans Diyagramları ile, bu etkileşimleri "
            "destekleyen genel yapı ise bütünsel Sınıf Diyagramı ile modellenmiştir.",
            body_style,
        )
    )

    story.append(Paragraph("2. Kapsam ve Girdiler", h2_style))
    story.append(
        Paragraph(
            "Bu çalışma, mevcut bitirme projesi kod tabanı (mobil uygulama, ana backend ve AI arama servisi) "
            "üzerinden çıkarılan ana kullanım durumlarına göre hazırlanmıştır. Diyagramlarda yer alan sınıflar "
            "ve mesajlar, gerçek uç noktalar (endpoint’ler) ve servis akışlarıyla eşleştirilmiştir.",
            body_style,
        )
    )

    story.append(Paragraph("3. Ana Use-case Listesi", h2_style))
    story.append(
        Paragraph(
            "<b>UC1: Kullanıcı Kayıt</b> (Backend: <b>POST /auth/register</b>)<br/>"
            "Kullanıcı e‑posta/şifre (ve opsiyonel kullanıcı adı) ile kayıt olur. Sistem benzersizlik kontrolü yapar, "
            "kullanıcıyı veritabanına kaydeder, doğrulama kodu üretir ve access/refresh token döndürür.<br/><br/>"
            "<b>UC2: Kullanıcı Giriş</b> (Backend: <b>POST /auth/login</b>)<br/>"
            "Kullanıcı e‑posta/şifre ile giriş yapar. Sistem kimlik doğrulamasını yapar, hatalı girişleri rate-limit ile takip eder "
            "ve başarılı girişte access/refresh token üretir.<br/><br/>"
            "<b>UC3: Doğal Dil ile AI Mekan Arama</b> (AI Servis: <b>POST /api/smart-search-v2</b>)<br/>"
            "Kullanıcı doğal dilde arama yapar (örn. “Kadıköy’de deniz manzaralı sessiz kafe”). AI servis sorguyu NLP ile çözümler; "
            "cache kontrolü, dış arama (SerpAPI), skorlama/rerank ve opsiyonel LLM açıklaması ile mekan önerileri döndürür.<br/><br/>"
            "<b>UC4: Görsel ile AI Mekan Arama</b> (AI Servis: <b>POST /api/image-search</b>)<br/>"
            "Kullanıcı bir fotoğraf seçerek arama başlatır. AI servis görseli multimodal LLM ile analiz ederek bir arama sorgusu üretir "
            "ve bu sorgu ile smart-search akışını çalıştırıp mekan önerileri döndürür.<br/><br/>"
            "<b>UC5: Mekan Yorum Analizi</b> (AI Servis: <b>POST /api/analyze-place-reviews</b>)<br/>"
            "Kullanıcı seçili bir mekan için yorum analizi ister. AI servis yorumları çekip öne çıkan özellikleri (specialties/tag) ve "
            "duygu/sentiment çıkarımı yaparak analiz metni üretir.",
            body_style,
        )
    )
    add_diagram_image(
        "Ana Use-case Listesi (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-afd29bcf-830b-494b-b6eb-ecbf8f0a3cd7.png",
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Sekans Diyagramları (PlantUML Kodları)", h2_style))

    # --- UC1 ---
    story.append(Paragraph("4.1 UC1 – Kullanıcı Kayıt (Register)", h3_style))
    add_diagram_image(
        "UC1 Sekans Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-d0bd8c44-1efa-44f0-844e-08d990949ac4.png",
    )
    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title UC1 - Kullanıcı Kayıt (POST /auth/register)

actor Kullanici as U
boundary "Mobil Uygulama\nRegister UI" as UI
control "Backend\nAuth Router" as AuthC
control "CRUD/UserService" as UserSvc
control "EmailService\nVerification Code" as EmailSvc
database "PostgreSQL\n(users, email_verifications)" as DB
control "JWTService" as JWT

U -> UI : Kayıt bilgilerini girer
UI -> AuthC : POST /auth/register (UserCreate)

AuthC -> UserSvc : get_user_by_email(email)
UserSvc -> DB : SELECT users WHERE email=?
DB --> UserSvc : user?/null
UserSvc --> AuthC : user?/null

alt email zaten kayıtlı
  AuthC --> UI : 400 "Bu e-posta zaten kayıtlı."
else email uygun
  AuthC -> UserSvc : get_user_by_username(username) [opsiyonel]
  UserSvc -> DB : SELECT users WHERE username=?
  DB --> UserSvc : user?/null
  UserSvc --> AuthC : user?/null

  alt username alınmış
    AuthC --> UI : 400 "Bu kullanıcı adı zaten alınmış."
  else oluştur
    AuthC -> UserSvc : create_user(user)
    UserSvc -> DB : INSERT users(password_hash=hash,...)
    DB --> UserSvc : db_user
    UserSvc --> AuthC : db_user

    AuthC -> EmailSvc : create_verification_code(db_user)
    EmailSvc -> DB : INSERT email_verifications(code,expires_at)
    DB --> EmailSvc : ok
    EmailSvc --> AuthC : ok (rate-limit olursa atlanabilir)

    AuthC -> JWT : create_access_token(user_id)
    JWT --> AuthC : access_token
    AuthC -> JWT : create_refresh_token(user_id)
    JWT --> AuthC : refresh_token

    AuthC --> UI : 200 Token{access,refresh,user}
  end
end

UI --> U : Oturum açılır
@enduml
"""
            ),
            code_style,
        )
    )

    # --- UC2 ---
    story.append(Paragraph("4.2 UC2 – Kullanıcı Giriş (Login)", h3_style))
    add_diagram_image(
        "UC2 Sekans Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-71c52b45-5827-4633-aec3-b79443616ace.png",
    )
    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title UC2 - Kullanıcı Giriş (POST /auth/login)

actor Kullanici as U
boundary "Mobil Uygulama\nLogin UI" as UI
control "Backend\nAuth Router" as AuthC
control "RateLimiter\n(Failed login tracking)" as RL
control "CRUD/UserService" as UserSvc
database "PostgreSQL\n(users)" as DB
control "JWTService" as JWT

U -> UI : Email + şifre girer
UI -> AuthC : POST /auth/login (UserLogin)

AuthC -> RL : get_client_ip(request)
RL --> AuthC : ip

AuthC -> UserSvc : authenticate_user(email,password)
UserSvc -> DB : SELECT users WHERE email=?
DB --> UserSvc : user?/null
UserSvc --> AuthC : user?/null

alt kullanıcı yok veya şifre hatalı
  AuthC -> RL : record_failed_login(ip)
  AuthC --> UI : 401 "E-posta veya şifre hatalı."
else kullanıcı bulundu
  alt user.is_active == false
    AuthC --> UI : 403 "Hesabınız devre dışı bırakılmış."
  else aktif
    AuthC -> RL : reset_failed_logins(ip)
    AuthC -> JWT : create_access_token(user_id)
    JWT --> AuthC : access_token
    AuthC -> JWT : create_refresh_token(user_id)
    JWT --> AuthC : refresh_token
    AuthC --> UI : 200 Token{access,refresh,user}
  end
end

UI --> U : Uygulamaya giriş
@enduml
"""
            ),
            code_style,
        )
    )

    story.append(PageBreak())

    # --- UC3 ---
    story.append(Paragraph("4.3 UC3 – Doğal Dil ile AI Mekan Arama (Smart Search V2)", h3_style))
    add_diagram_image(
        "UC3 Sekans Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-770d7c5c-5234-4621-b599-fb0b1ba12f33.png",
    )
    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title UC3 - Doğal Dil ile AI Mekan Arama (POST /api/smart-search-v2)

actor Kullanici as U
boundary "Mobil\nAISearchScreen" as UI
control "Mobile aiService\nsmartSearch()" as MobileAI
control "AI-LLM FastAPI\n/smart-search-v2" as AIApi
control "RedisCacheManager" as Cache
database "Redis" as Redis
control "NLPParser\nparse_natural_query()" as NLP
control "SerpApiClient" as Serp
collections "SerpAPI\n(Google Maps)" as SerpAPI
collections "Open-Meteo\nWeather API" as WeatherAPI
control "Scoring\nhybrid_score()" as Score
control "Rerank\nrerank_places()" as Rerank
control "ReviewInsight\n_enrich_with_review_insights()" as Insight
control "LayeredLLMWrapper\n(Groq->Local)" as LLM
collections "Groq API" as Groq

U -> UI : Sorgu girer + konum seçer
UI -> MobileAI : smartSearch(req)
MobileAI -> AIApi : POST /api/smart-search-v2(req)

AIApi -> Cache : generate_key(query,location,coords)
Cache -> Redis : GET(key)
Redis --> Cache : cached?/null
Cache --> AIApi : cached?/null

alt Cache Hit
  AIApi --> MobileAI : response + _cache.hit=true
  MobileAI --> UI : öneriler
else Cache Miss
  AIApi -> NLP : parse_natural_query(query)
  NLP --> AIApi : parsed_context

  alt parsed_context.is_inappropriate
    AIApi --> MobileAI : conversational message + empty list
    MobileAI --> UI : bot mesajı
  else parsed_context.is_chit_chat
    AIApi --> MobileAI : conversational message + empty list
    MobileAI --> UI : bot mesajı
  else normal arama
    AIApi -> Serp : search_places(search_query, location, limit*2, coords)
    Serp -> SerpAPI : external search
    SerpAPI --> Serp : places[]
    Serp --> AIApi : places[]

    opt coords varsa
      AIApi -> WeatherAPI : current_weather(lat,lng)
      WeatherAPI --> AIApi : weather_data
    end

    loop her place
      AIApi -> Score : hybrid_score(place, features, coords, time_weather)
      Score --> AIApi : match_score + distance_km + breakdown
    end

    AIApi -> Rerank : rerank_places(top20, query, top_k=5)
    Rerank --> AIApi : reranked_places[<=5]

    opt request.analyze_reviews == true
      AIApi -> Insight : _enrich_with_review_insights(places)
      Insight --> AIApi : place.review_insights
    end

    opt GROQ_API_KEY varsa
      AIApi -> LLM : generate_async(prompt)
      LLM -> Groq : chat.completions
      Groq --> LLM : ai_message
      LLM --> AIApi : ai_message
    end

    AIApi -> Cache : set(key,response,ttl)
    Cache -> Redis : SETEX(key,ttl,response)
    Redis --> Cache : ok

    AIApi --> MobileAI : response + _cache.hit=false
    MobileAI --> UI : öneriler
  end
end

UI --> U : Mekan listesi
@enduml
"""
            ),
            code_style,
        )
    )

    # --- UC4 ---
    story.append(Paragraph("4.4 UC4 – Görsel ile AI Mekan Arama (Image Search)", h3_style))
    add_diagram_image(
        "UC4 Sekans Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-7e54ccde-8977-4c9d-b467-549d41fcccd1.png",
    )
    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title UC4 - Görsel ile Mekan Arama (POST /api/image-search)

actor Kullanici as U
boundary "Mobil\nAISearchScreen" as UI
control "Expo ImagePicker" as Picker
control "Mobile aiService\nimageSearch()" as MobileAI
control "AI-LLM FastAPI\n/image-search" as AIApi
control "Vision Analyzer\nanalyze_image_with_llama()" as Vision
collections "Groq Multimodal\n(Llama-4-Scout)" as GroqVision
control "AI-LLM FastAPI\nsmart_search_v2()" as SmartSearch

U -> UI : Fotoğraf seçer
UI -> Picker : permission + pick(base64)
Picker --> UI : image_base64 + mime_type

UI -> MobileAI : imageSearch(image_base64,mime,opts)
MobileAI -> AIApi : POST /api/image-search

AIApi -> Vision : analyze_image_with_llama(b64,mime)
Vision -> GroqVision : chat.completions(text+image_url)
GroqVision --> Vision : JSON {query,category,keywords,description}
Vision --> AIApi : detected_query + description

AIApi -> SmartSearch : smart_search_v2(query=detected_query,\nlocation,coords,analyze_reviews=false)
SmartSearch --> AIApi : recommendations

AIApi --> MobileAI : recommendations + image_analysis
MobileAI --> UI : sonuçlar + detected_query etiketi
UI --> U : Mekan önerileri
@enduml
"""
            ),
            code_style,
        )
    )

    story.append(PageBreak())

    # --- UC5 ---
    story.append(Paragraph("4.5 UC5 – Mekan Yorumlarını AI ile Analiz Et", h3_style))
    add_diagram_image(
        "UC5 Sekans Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-0d4de6e8-ec3d-47bd-af22-5ceefd914686.png",
    )
    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title UC5 - Yorum Analizi (POST /api/analyze-place-reviews)

actor Kullanici as U
boundary "Mobil\nPlaceCard Modal" as UI
control "AI-LLM FastAPI\n/analyze-place-reviews" as AIApi
control "SerpApiClient" as Serp
collections "SerpAPI\nReviews" as SerpAPI
control "ReviewAnalyzer\nfast_extract_insights()" as Analyzer
control "ModelManager\nanalyze_review_sentiment()" as Sentiment

U -> UI : "Yorumları Analiz Et" seçer
UI -> AIApi : POST /api/analyze-place-reviews(data_id, place_name)

AIApi -> Serp : get_place_reviews(data_id, max_reviews=50)
Serp -> SerpAPI : external fetch
SerpAPI --> Serp : reviews[]
Serp --> AIApi : reviews[]

alt reviews boş
  AIApi --> UI : success=false + analysis_text
else reviews var
  AIApi -> Analyzer : fast_extract_insights(reviews, place_name)
  Analyzer --> AIApi : insights(specialties,tags,summary)

  AIApi -> Sentiment : analyze_review_sentiment(reviews)
  Sentiment --> AIApi : sentiment_score

  AIApi --> UI : success=true + analysis_text + specialties + tags + sentiment_score
end

UI --> U : Analiz çıktısı gösterilir
@enduml
"""
            ),
            code_style,
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("5. Bütünsel Sınıf Diyagramı (PlantUML Kodu)", h2_style))
    add_diagram_image(
        "Bütünsel Sınıf Diyagramı (Görsel)",
        r"C:\Users\eruru\.cursor\projects\d-BitirmeProjesi\assets\c__Users_eruru_AppData_Roaming_Cursor_User_workspaceStorage_5d9071331e8ca458ff3e2c6cc38a41c8_images_image-5de32790-7ce6-4386-b1ab-03b14fd3cc15.png",
    )
    story.append(
        Paragraph(
            "Aşağıdaki sınıf diyagramı, sekans diyagramlarında geçen nesneleri ve çağrılan metodları "
            "tek bir bütünsel modelde toplar. Sekans diyagramlarındaki mesajlar, ilgili sınıfların operasyonları "
            "ile eşleştirilmiştir.",
            body_style,
        )
    )

    story.append(
        Preformatted(
            _puml(
                r"""
@startuml
title AsEmOs - Bütünsel Sınıf Diyagramı (Mobil + Backend + AI-LLM)

skinparam classAttributeIconSize 0

package "Mobil (apps/mobile)" {
  class AISearchScreen <<boundary>> {
    -messages
    -selectedLoc
    +handleSend(query)
    +handleImageSearch()
    +analyzeReviews(place)
  }

  class AIService <<control>> {
    +smartSearch(req)
    +imageSearch(imageBase64, mimeType, opts)
    +analyzeReviews(req)
    +checkAIHealth()
  }

  AISearchScreen --> AIService : uses
}

package "AI-LLM (ai-llm/app.py, :8080)" {
  class AILLMApi <<control>> {
    +health()
    +get_info()
    +get_stats()
    +smart_search_v2(request)
    +image_search(request)
    +analyze_place_reviews(request)
  }

  class RedisCacheManager <<control>> {
    +generate_key(query, location, **kwargs)
    +get(key)
    +set(key, data)
    +get_stats()
  }

  class SerpApiClient <<control>> {
    +search_places(query, location, limit, lat, lng)
    +get_place_reviews(data_id, max_reviews)
  }

  class NLPParser <<control>> {
    +parse_natural_query(query)
  }

  class ScoringEngine <<control>> {
    +calculate_distance(lat1,lng1,lat2,lng2)
    +hybrid_score(place, features, user_lat, user_lng, time_ctx)
    +rerank_places(places, query, top_k)
  }

  class ReviewAnalyzer <<control>> {
    +fast_extract_insights(reviews, place_name)
  }

  class ModelManager <<control>> {
    +preload_models()
    +analyze_review_sentiment(reviews)
  }

  class LayeredLLMWrapper <<control>> {
    +generate_async(prompt)
    +active_provider
  }

  class VisionAnalyzer <<control>> {
    +analyze_image_with_llama(image_base64, mime_type)
  }

  AILLMApi --> RedisCacheManager
  AILLMApi --> SerpApiClient
  AILLMApi --> NLPParser
  AILLMApi --> ScoringEngine
  AILLMApi --> ReviewAnalyzer
  AILLMApi --> ModelManager
  AILLMApi --> LayeredLLMWrapper
  AILLMApi --> VisionAnalyzer
}

package "Backend (backend/, :8000)" {
  class AuthController <<control>> {
    +register_user(user)
    +login(user_data, request)
  }

  class UserServiceCRUD <<control>> {
    +get_user_by_email(email)
    +get_user_by_username(username)
    +create_user(user)
    +authenticate_user(email, password)
  }

  class EmailService <<control>> {
    +create_verification_code(user)
    +verify_code(user, code)
  }

  class JWTService <<control>> {
    +create_access_token(user_id)
    +create_refresh_token(user_id)
    +decode_token(token)
  }

  class User <<entity>> { +id +email +password_hash +username +is_active +is_email_verified }
  class Place <<entity>> { +id +name +address +city +description +vector_id +price_range +category +features +latitude +longitude +average_rating }
  class Review <<entity>> { +id +user_id +place_id +comment_text +rating +is_verified +verify_method }

  AuthController --> UserServiceCRUD
  AuthController --> EmailService
  AuthController --> JWTService

  User "1" -- "0..*" Review
  Place "1" -- "0..*" Review
}

package "Veri Katmanı" {
  database PostgreSQL
  database Redis
  AuthController --> PostgreSQL
  UserServiceCRUD --> PostgreSQL
  EmailService --> PostgreSQL
  RedisCacheManager --> Redis
}

package "Dış Servisler" {
  class SerpAPI <<external>>
  class GroqAPI <<external>>
  class OpenMeteo <<external>>
  SerpApiClient --> SerpAPI
  LayeredLLMWrapper --> GroqAPI
  VisionAnalyzer --> GroqAPI
  AILLMApi --> OpenMeteo
}

AIService --> AILLMApi : HTTP calls
@enduml
"""
            ),
            code_style,
        )
    )

    story.append(Spacer(1, 12))
    story.append(Paragraph("6. Sonuç", h2_style))
    story.append(
        Paragraph(
            "Bu raporda, projenin ana kullanım durumları için sekans diyagramları oluşturulmuş ve tüm diyagramlarda "
            "kullanılan sınıflar tek bir bütünsel sınıf diyagramında birleştirilmiştir. Sekans diyagramlarındaki "
            "mesajlar, sınıf diyagramındaki operasyonlarla tutarlı olacak şekilde modellenmiştir.",
            body_style,
        )
    )

    doc.build(story)


def main() -> None:
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    output = os.path.join(workspace_root, "Grup_ID_Proje_Adım1.pdf")
    os.makedirs(os.path.dirname(output), exist_ok=True)
    build_pdf(output)
    print(output)


if __name__ == "__main__":
    main()

