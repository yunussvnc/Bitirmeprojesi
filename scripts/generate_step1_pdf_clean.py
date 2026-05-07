import os
import zlib
import urllib.request
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Image,
    Preformatted,
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
    candidates = [
        ("TimesNewRoman", r"C:\Windows\Fonts\times.ttf"),
        ("TimesNewRoman", r"C:\Windows\Fonts\times.ttf".replace("\\", "/")),
        ("DejaVuSans", r"C:\Windows\Fonts\DejaVuSans.ttf"),
        ("DejaVuSansMono", r"C:\Windows\Fonts\DejaVuSansMono.ttf"),
        ("Consolas", r"C:\Windows\Fonts\consola.ttf"),
    ]
    registered = {}
    for name, path in candidates:
        if _try_register_ttf(name, path):
            registered[name] = path

    body = "TimesNewRoman" if "TimesNewRoman" in registered else ("DejaVuSans" if "DejaVuSans" in registered else "Times-Roman")
    code = "DejaVuSansMono" if "DejaVuSansMono" in registered else ("Consolas" if "Consolas" in registered else "Courier")
    return {"body": body, "code": code}


# --- PlantUML server encoding (no Java needed) ---
_PLANTUML_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"


def _encode_6bit(b: int) -> str:
    if b < 0 or b > 63:
        raise ValueError("6bit out of range")
    return _PLANTUML_ALPHABET[b]


def _append_3bytes(b1: int, b2: int, b3: int) -> str:
    c1 = b1 >> 2
    c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
    c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
    c4 = b3 & 0x3F
    return _encode_6bit(c1 & 0x3F) + _encode_6bit(c2 & 0x3F) + _encode_6bit(c3 & 0x3F) + _encode_6bit(c4 & 0x3F)


def plantuml_deflate_encode(text: str) -> str:
    data = text.encode("utf-8")
    compressed = zlib.compress(data, 9)
    # strip zlib header+checksum to get raw DEFLATE like PlantUML expects
    raw = compressed[2:-4]
    res = []
    i = 0
    while i < len(raw):
        b1 = raw[i]
        b2 = raw[i + 1] if i + 1 < len(raw) else 0
        b3 = raw[i + 2] if i + 2 < len(raw) else 0
        if i + 2 < len(raw):
            res.append(_append_3bytes(b1, b2, b3))
        elif i + 1 < len(raw):
            c1 = b1 >> 2
            c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
            c3 = (b2 & 0xF) << 2
            res.append(_encode_6bit(c1 & 0x3F) + _encode_6bit(c2 & 0x3F) + _encode_6bit(c3 & 0x3F))
        else:
            c1 = b1 >> 2
            c2 = (b1 & 0x3) << 4
            res.append(_encode_6bit(c1 & 0x3F) + _encode_6bit(c2 & 0x3F))
        i += 3
    return "".join(res)


def render_plantuml_png(plantuml_code: str, out_path: str, server_base: str = "https://www.plantuml.com/plantuml") -> None:
    encoded = plantuml_deflate_encode(plantuml_code)
    url = f"{server_base}/png/{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "AsEmOs-Report-Generator/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        png = resp.read()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(png)


def _puml(code: str) -> str:
    return code.strip() + "\n"


def build_pdf(output_path: str, homework_dir: str, *, use_landscape: bool) -> None:
    fonts = _register_fonts()
    pagesize = landscape(A4) if use_landscape else A4
    doc = SimpleDocTemplate(
        output_path,
        pagesize=pagesize,
        # More compact margins in both modes
        leftMargin=(1.7 * cm if use_landscape else 2.2 * cm),
        rightMargin=(1.7 * cm if use_landscape else 2.2 * cm),
        topMargin=(1.6 * cm if use_landscape else 2.0 * cm),
        bottomMargin=(1.6 * cm if use_landscape else 2.0 * cm),
        title="Yazılım Gerçekleme, Test ve Bakım – Proje Adımı 1",
        author="AsEmOs",
    )

    styles = getSampleStyleSheet()
    body = ParagraphStyle("Body", parent=styles["Normal"], fontName=fonts["body"], fontSize=12, leading=18, spaceAfter=6)
    h1 = ParagraphStyle("H1", parent=styles["Title"], fontName=fonts["body"], fontSize=16, leading=22, spaceAfter=10)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName=fonts["body"], fontSize=13, leading=18, spaceBefore=10, spaceAfter=6)
    h3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName=fonts["body"], fontSize=12, leading=18, spaceBefore=6, spaceAfter=3)
    figcap = ParagraphStyle("FigCaption", parent=styles["Normal"], fontName=fonts["body"], fontSize=11, leading=15, spaceBefore=2, spaceAfter=2)
    figdesc = ParagraphStyle("FigDesc", parent=styles["Normal"], fontName=fonts["body"], fontSize=11, leading=15, spaceBefore=0, spaceAfter=6)
    code = ParagraphStyle(
        "Code",
        fontName=fonts["code"],
        fontSize=8.6,
        leading=11.0,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderPadding=6,
        borderWidth=0.5,
        borderColor=colors.HexColor("#e2e8f0"),
    )

    page_w, page_h = pagesize
    usable_w = page_w - doc.leftMargin - doc.rightMargin

    def add_img(fig_no: int, fig_title: str, explanation: str, path: str) -> None:
        if not os.path.exists(path):
            story.append(Paragraph(f"Şekil {fig_no}: {fig_title} — görsel bulunamadı: {path}", body))
            return
        img = Image(path)
        # Fill most of page (leave room for caption + 2-line explanation)
        scale = min(usable_w / img.imageWidth, (page_h * 0.80) / img.imageHeight)
        img.drawWidth = img.imageWidth * scale
        img.drawHeight = img.imageHeight * scale
        story.append(
            KeepTogether(
                [
                    Paragraph(fig_title, h3),
                    Spacer(1, 3),
                    img,
                    Spacer(1, 4),
                    Paragraph(f"<b>Şekil {fig_no}:</b> {fig_title}", figcap),
                    Paragraph(explanation, figdesc),
                    Spacer(1, 2),
                ]
            )
        )

    # --- Clean class diagram PlantUML (fix duplicates, correct methods, add UML relations) ---
    scale_line = "scale 1.3" if use_landscape else "scale 1.15"
    class_diagram_puml = _puml(
        r"""
@startuml
title AsEmOs - Temiz Bütünsel Sınıf Diyagramı (Use-case odaklı)
skinparam classAttributeIconSize 0
""" + scale_line + r"""

package "Mobil (apps/mobile)" {
  class AISearchScreen <<boundary>> {
    +handleSend(query: string)
    +handleImageSearch()
    +analyzeReviews(place: PlaceDTO)
  }

  class AIService <<control>> {
    +smartSearch(req: SmartSearchRequest): SmartSearchResponse
    +imageSearch(imageBase64: string, mimeType: string, opts): SmartSearchResponse
    +analyzeReviews(req: AnalyzeReviewRequest): AnalyzeReviewResponse
    +checkAIHealth(): HealthStatus
  }

  class SmartSearchRequest <<entity>>
  class ImageSearchRequest <<entity>>
  class AnalyzeReviewRequest <<entity>>
  class SmartSearchResponse <<entity>>
  class AnalyzeReviewResponse <<entity>>
  class PlaceDTO <<entity>>

  AISearchScreen --> AIService : uses
}

package "AI-LLM (ai-llm, :8080)" {
  class AILLMApi <<control>> {
    +health()
    +smart_search_v2(req: SmartSearchRequest): SmartSearchResponse
    +image_search(req: ImageSearchRequest): SmartSearchResponse
    +analyze_place_reviews(req: AnalyzeReviewRequest): AnalyzeReviewResponse
  }

  class RedisCacheManager <<control>> {
    +generate_key(query: string, location: string, **kwargs): string
    +get(key: string): dict?
    +set(key: string, data: dict): void
  }

  class NLPParser <<control>> {
    +parse_natural_query(query: string): ParsedContext
  }

  class SerpApiClient <<control>> {
    +search_places(query, location, limit, lat, lng): PlaceDTO[*]
    +get_place_reviews(data_id, max_reviews): ReviewText[*]
  }

  class ScoringEngine <<control>> {
    +calculate_distance(lat1, lng1, lat2, lng2): float
    +hybrid_score(place: PlaceDTO, features: string[*], user_lat, user_lng, time_ctx): ScoreBreakdown
    +rerank_places(places: PlaceDTO[*], query: string, top_k: int): PlaceDTO[*]
  }

  class ReviewAnalyzer <<control>> {
    +fast_extract_insights(reviews: ReviewText[*], place_name: string): ReviewInsights
  }

  class ModelManager <<control>> {
    +preload_models(): void
    +analyze_review_sentiment(reviews: ReviewText[*]): float
  }

  class LayeredLLMWrapper <<control>> {
    +generate_async(prompt: string): string
  }

  class VisionAnalyzer <<control>> {
    +analyze_image_with_llama(image_base64: string, mime_type: string): VisionResult
  }

  AILLMApi o-- RedisCacheManager : cache
  AILLMApi --> NLPParser : parse
  AILLMApi --> SerpApiClient : fetch
  AILLMApi --> ScoringEngine : score
  AILLMApi --> ReviewAnalyzer : insights
  AILLMApi --> ModelManager : sentiment
  AILLMApi ..> LayeredLLMWrapper : <<optional>> LLM
  AILLMApi --> VisionAnalyzer : vision
}

package "Backend (backend, :8000)" {
  class AuthController <<control>> {
    +register_user(user: UserCreate): Token
    +login(user: UserLogin): Token
  }

  class UserServiceCRUD <<control>> {
    +get_user_by_email(email: string): User?
    +get_user_by_username(username: string): User?
    +create_user(user: UserCreate): User
    +authenticate_user(email: string, password: string): User?
  }

  class EmailService <<control>> {
    +create_verification_code(user: User): EmailVerification
    +verify_code(user: User, code: string): bool
  }

  class JWTService <<control>> {
    +create_access_token(user_id: int): string
    +create_refresh_token(user_id: int): string
  }

  class User <<entity>> {
    +id: int
    +email: string
    +username: string
    +password_hash: string
    +is_active: bool
    +is_email_verified: bool
  }

  class Place <<entity>> {
    +id: int
    +name: string
    +address: string
    +city: string
    +category: string
    +latitude: float
    +longitude: float
  }

  class Review <<entity>> {
    +id: int
    +comment_text: text
    +rating: int
    +is_verified: bool
  }

  class ReviewMedia <<entity>> {
    +id: int
    +media_type: string
    +media_url: string
  }

  class EmailVerification <<entity>> {
    +id: int
    +verification_code: string
    +expires_at: datetime
  }

  AuthController --> UserServiceCRUD
  AuthController --> EmailService
  AuthController --> JWTService

  User "1" *-- "0..*" EmailVerification : owns
  User "1" -- "0..*" Review : writes
  Place "1" -- "0..*" Review : has
  Review "1" *-- "0..*" ReviewMedia : contains
}

package "Dış Servisler" {
  class SerpAPI <<external>>
  class GroqAPI <<external>>
  class OpenMeteo <<external>>
  SerpApiClient --> SerpAPI
  LayeredLLMWrapper ..> GroqAPI
  VisionAnalyzer ..> GroqAPI
  AILLMApi ..> OpenMeteo
}

AIService --> AILLMApi : HTTP
@enduml
"""
    )

    class_png = os.path.join(homework_dir, "class_diagram_clean.png")
    try:
        render_plantuml_png(class_diagram_puml, class_png)
    except Exception:
        # If offline, keep existing plant.png as fallback
        class_png = os.path.join(homework_dir, "plant.png")

    # --- Sequence PlantUML codes (appendix + mapping) ---
    puml_uc1 = _puml(open(os.path.join(homework_dir, "uc1.puml"), "r", encoding="utf-8").read()) if os.path.exists(os.path.join(homework_dir, "uc1.puml")) else _puml("""@startuml
title UC1 - Kullanıcı Kayıt (POST /auth/register)
actor Kullanici as U
boundary "Mobil Uygulama\\nRegister UI" as UI
control "Backend\\nAuth Router" as AuthC
control "CRUD/UserService" as UserSvc
control "EmailService\\nVerification Code" as EmailSvc
database "PostgreSQL\\n(users, email_verifications)" as DB
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
    AuthC -> JWT : create_access_token(user_id)
    JWT --> AuthC : access_token
    AuthC -> JWT : create_refresh_token(user_id)
    JWT --> AuthC : refresh_token
    AuthC --> UI : 200 Token{access,refresh,user}
  end
end
UI --> U : Oturum açılır
@enduml""")

    puml_uc2 = _puml("""@startuml
title UC2 - Kullanıcı Giriş (POST /auth/login)
actor Kullanici as U
boundary "Mobil Uygulama\\nLogin UI" as UI
control "Backend\\nAuth Router" as AuthC
control "RateLimiter\\n(Failed login tracking)" as RL
control "CRUD/UserService" as UserSvc
database "PostgreSQL\\n(users)" as DB
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
@enduml""")

    puml_uc3 = _puml("""@startuml
title UC3 - AI Mekan Arama (POST /api/smart-search-v2)
actor Kullanici as U
boundary "Mobil\\nAISearchScreen" as UI
control "Mobile aiService\\nsmartSearch()" as MobileAI
control "AI-LLM API\\n/smart-search-v2" as AIApi
control "RedisCacheManager" as Cache
database "Redis" as Redis
control "NLPParser" as NLP
control "SerpApiClient" as Serp
participant "SerpAPI\\n(Google Maps)" as SerpAPI <<external>>
participant "Open-Meteo API" as WeatherAPI <<external>>
control "ScoringEngine" as Score
control "Reranker" as Rerank
control "ReviewInsight" as Insight
control "LLM Wrapper" as LLM
participant "Groq API" as Groq <<external>>
U -> UI : Sorgu girer
UI -> MobileAI : smartSearch(req)
MobileAI -> AIApi : POST /smart-search-v2
group Cache Check
  AIApi -> Cache : generate_key()
  Cache -> Redis : GET
  Redis --> Cache : cached/null
  Cache --> AIApi : result
end
alt Cache Hit
  AIApi --> MobileAI : cached response
else Cache Miss
  group NLP Processing
    AIApi -> NLP : parse(query)
    NLP --> AIApi : context
  end
  alt invalid / chit-chat
    AIApi --> MobileAI : conversational response
  else normal search
    group Data Fetch
      AIApi -> Serp : search_places()
      Serp -> SerpAPI : external request
      SerpAPI --> Serp : places[]
      Serp --> AIApi : places[]
      opt coords available
        AIApi -> WeatherAPI : get weather
        WeatherAPI --> AIApi : weather
      end
    end
    group Ranking Pipeline
      loop each place
        AIApi -> Score : compute score
        Score --> AIApi : score
      end
      AIApi -> Rerank : rerank top results
      Rerank --> AIApi : top places
    end
    opt review analysis enabled
      AIApi -> Insight : enrich reviews
      Insight --> AIApi : insights
    end
    opt LLM enabled
      AIApi -> LLM : generate response
      LLM -> Groq : completion
      Groq --> LLM : ai message
      LLM --> AIApi : ai message
    end
    group Cache Store
      AIApi -> Cache : set(key, response)
      Cache -> Redis : SETEX
    end
    AIApi --> MobileAI : final response
  end
end
MobileAI --> UI : öneriler
UI --> U : Mekan listesi
@enduml""")

    puml_uc4 = _puml("""@startuml
title UC4 - Görsel ile Mekan Arama (POST /api/image-search)
actor Kullanici as U
boundary "Mobil\\nAISearchScreen" as UI
control "Expo ImagePicker" as Picker
control "Mobile aiService\\nimageSearch()" as MobileAI
control "AI-LLM FastAPI\\n/image-search" as AIApi
control "VisionAnalyzer\\nanalyze_image_with_llama()" as Vision
participant "Groq Multimodal\\n(Llama-4-Scout)" as GroqVision <<external>>
control "SmartSearch\\nsmart_search_v2()" as SmartSearch
U -> UI : Fotoğraf seçer
UI -> Picker : permission + pick()
Picker --> UI : image_base64, mime_type
UI -> MobileAI : imageSearch(b64, mime, opts)
MobileAI -> AIApi : POST /image-search
group Image Analysis (Vision)
  AIApi -> Vision : analyze_image(b64, mime)
  Vision -> GroqVision : multimodal request
  GroqVision --> Vision : JSON(query, category, keywords)
  Vision --> AIApi : detected_query, description
end
group Search Pipeline
  AIApi -> SmartSearch : smart_search_v2(query, location, coords)
  SmartSearch --> AIApi : recommendations
end
AIApi --> MobileAI : response(recommendations, image_analysis)
MobileAI --> UI : sonuçlar + detected_query
UI --> U : Mekan önerileri gösterilir
@enduml""")

    puml_uc5 = _puml("""@startuml
title UC5 - Yorum Analizi (POST /api/analyze-place-reviews)
actor Kullanici as U
boundary "Mobil\\nPlaceCard Modal" as UI
control "AI-LLM FastAPI\\n/analyze-place-reviews" as AIApi
control "SerpApiClient" as Serp
participant "SerpAPI\\nReviews" as SerpAPI <<external>>
control "ReviewAnalyzer\\nfast_extract_insights()" as Analyzer
control "ModelManager\\nanalyze_review_sentiment()" as Sentiment
U -> UI : \"Yorumları Analiz Et\"
UI -> AIApi : POST analyze-place-reviews(data_id, place_name)
AIApi -> Serp : get_place_reviews(data_id, max_reviews=50)
Serp -> SerpAPI : fetch reviews
SerpAPI --> Serp : reviews[]
Serp --> AIApi : reviews[]
alt reviews boş
  AIApi --> UI : error response\\n(success=false, message)
else reviews var
  AIApi -> Analyzer : extract insights
  Analyzer --> AIApi : specialties, tags, summary
  AIApi -> Sentiment : analyze sentiment
  Sentiment --> AIApi : sentiment_score
  AIApi --> UI : success response\\n(analysis_text, specialties, tags, sentiment_score)
end
UI --> U : Analiz sonucu gösterilir
@enduml""")

    # --- Story ---
    story = []
    story.append(Paragraph("Yazılım Gerçekleme, Test ve Bakım – Proje Adımı 1", h1))
    story.append(Paragraph("Sistem Analizi ve Tasarım Modelleme", h1))
    story.append(Paragraph(f"Tarih: {datetime.now().strftime('%d.%m.%Y')}", body))
    story.append(Spacer(1, 6))

    story.append(Paragraph("1. Proje Adımının Amacı", h2))
    story.append(Paragraph("Mevcut gereksinimler ve bağlam doğrultusunda sistemin nesne tabanlı tasarımını oluşturmak; dinamik etkileşimleri sekans diyagramlarıyla, statik yapıyı sınıf diyagramıyla modellemektir.", body))

    story.append(Paragraph("2. Kapsam ve Girdiler", h2))
    story.append(Paragraph("Bu rapor; mobil uygulama (Expo/React Native), ana backend (FastAPI, :8000) ve AI arama servisi (FastAPI, :8080) bileşenlerine ait gerçek endpoint’ler ve servis akışları temel alınarak hazırlanmıştır.", body))

    story.append(Paragraph("3. Ana Use-case Listesi", h2))
    story.append(
        Paragraph(
            "<b>UC1</b> Kayıt: Kullanıcı kayıt olur, benzersizlik kontrolü sonrası token alır.<br/>"
            "<b>UC2</b> Giriş: Kullanıcı kimlik doğrulaması yapılır, rate-limit uygulanır, token üretilir.<br/>"
            "<b>UC3</b> AI Arama: NLP + cache + dış arama + skorlama/rerank (+opsiyonel LLM açıklama).<br/>"
            "<b>UC4</b> Görsel Arama: Görsel analiz → sorgu üretimi → smart-search pipeline.<br/>"
            "<b>UC5</b> Yorum Analizi: Yorumlar çekilir → öne çıkanlar + sentiment → analiz metni.",
            body,
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Sekans Diyagramları", h2))
    add_img(
        1,
        "4.1 UC1 – Kullanıcı Kayıt (POST /auth/register)",
        "Bu diyagramda, kullanıcının kayıt olma sürecinde mobil arayüzün backend ile iletişimi; "
        "veritabanı kontrolü (benzersizlik), doğrulama kodu üretimi ve JWT token oluşturma adımları gösterilmektedir.",
        os.path.join(homework_dir, "plant4.1.png"),
    )
    story.append(PageBreak())
    add_img(
        2,
        "4.2 UC2 – Kullanıcı Giriş (POST /auth/login)",
        "Bu diyagramda, kullanıcının giriş sürecinde rate-limit kontrolü, kimlik doğrulama (e‑posta/şifre) "
        "ve başarılı girişte access/refresh token üretimi adımları gösterilmektedir.",
        os.path.join(homework_dir, "plant2.png"),
    )
    story.append(PageBreak())
    add_img(
        3,
        "4.3 UC3 – AI Mekan Arama (POST /api/smart-search-v2)",
        "Bu diyagram, doğal dil sorgusunun önce cache ile kontrol edilmesini; cache miss durumunda NLP çözümleme, "
        "dış veri çekme (SerpAPI), skorlama/rerank ve opsiyonel LLM açıklaması üretimi adımlarını göstermektedir.",
        os.path.join(homework_dir, "plant23.png"),
    )
    story.append(PageBreak())
    add_img(
        4,
        "4.4 UC4 – Görsel ile Mekan Arama (POST /api/image-search)",
        "Bu diyagramda, görsel seçimi sonrası görsel analiz (multimodal LLM) ile arama sorgusu çıkarılması ve "
        "ardından smart-search pipeline’ının tetiklenerek önerilerin üretilmesi gösterilmektedir.",
        os.path.join(homework_dir, "plant4.png"),
    )
    story.append(PageBreak())
    add_img(
        5,
        "4.5 UC5 – Mekan Yorum Analizi (POST /api/analyze-place-reviews)",
        "Bu diyagramda, seçilen mekana ait yorumların dış servisten çekilmesi; öne çıkan özelliklerin çıkarılması "
        "ve sentiment analizi ile birlikte kullanıcıya özet analiz metni döndürülmesi gösterilmektedir.",
        os.path.join(homework_dir, "plant5.png"),
    )

    story.append(PageBreak())
    story.append(Paragraph("5. Bütünsel Sınıf Diyagramı (Temizlenmiş)", h2))
    add_img(
        6,
        "5.1 Temiz Sınıf Diyagramı (Use-case odaklı, ilişkiler/multiplicity dahil)",
        "Bu sınıf diyagramı, sekans diyagramlarında geçen bileşenleri tek bir modelde toplar. "
        "Composition/Aggregation ve çokluk (multiplicity) değerleri; kalıcı veri nesneleri ile servis/denetleyici "
        "sınıfları arasındaki ilişkileri gösterecek şekilde eklenmiştir.",
        class_png,
    )

    story.append(Paragraph("6. Sekans → Sınıf (Mapping Kontrol Listesi)", h2))
    story.append(Paragraph("Kural: Sekans diyagramındaki <b>her mesaj</b>, sınıf diyagramında ilgili sınıfın <b>bir metodu</b> olmalıdır.", body))

    story.append(Paragraph("UC1 Mapping", h3))
    story.append(Paragraph("AuthController: register_user()", body))
    story.append(Paragraph("UserServiceCRUD: get_user_by_email(), get_user_by_username(), create_user()", body))
    story.append(Paragraph("EmailService: create_verification_code()", body))
    story.append(Paragraph("JWTService: create_access_token(), create_refresh_token()", body))

    story.append(Paragraph("UC2 Mapping", h3))
    story.append(Paragraph("AuthController: login()", body))
    story.append(Paragraph("RateLimiter: get_client_ip(), record_failed_login(), reset_failed_logins()", body))
    story.append(Paragraph("UserServiceCRUD: authenticate_user()", body))
    story.append(Paragraph("JWTService: create_access_token(), create_refresh_token()", body))

    story.append(Paragraph("UC3 Mapping", h3))
    story.append(Paragraph("AILLMApi: smart_search_v2()", body))
    story.append(Paragraph("RedisCacheManager: generate_key(), get(), set()", body))
    story.append(Paragraph("NLPParser: parse_natural_query()", body))
    story.append(Paragraph("SerpApiClient: search_places()", body))
    story.append(Paragraph("ScoringEngine: calculate_distance(), hybrid_score(), rerank_places()", body))
    story.append(Paragraph("ReviewAnalyzer: fast_extract_insights() [review enrichment]", body))
    story.append(Paragraph("LayeredLLMWrapper: generate_async() [opsiyonel]", body))

    story.append(Paragraph("UC4 Mapping", h3))
    story.append(Paragraph("AILLMApi: image_search()", body))
    story.append(Paragraph("VisionAnalyzer: analyze_image_with_llama()", body))
    story.append(Paragraph("AILLMApi: smart_search_v2() [pipeline reuse]", body))

    story.append(Paragraph("UC5 Mapping", h3))
    story.append(Paragraph("AILLMApi: analyze_place_reviews()", body))
    story.append(Paragraph("SerpApiClient: get_place_reviews()", body))
    story.append(Paragraph("ReviewAnalyzer: fast_extract_insights()", body))
    story.append(Paragraph("ModelManager: analyze_review_sentiment()", body))

    story.append(PageBreak())
    story.append(Paragraph("EK A — PlantUML Kodları (Kaynak)", h2))
    story.append(Paragraph("Aşağıdaki kodlar, diyagramları yeniden üretmek için rapora eklenmiştir.", body))

    def add_code_block(title: str, txt: str) -> None:
        story.append(Paragraph(title, h3))
        story.append(Preformatted(txt, code))
        story.append(Spacer(1, 10))

    add_code_block("UC1 PlantUML", puml_uc1)
    add_code_block("UC2 PlantUML", puml_uc2)
    add_code_block("UC3 PlantUML", puml_uc3)
    add_code_block("UC4 PlantUML", puml_uc4)
    add_code_block("UC5 PlantUML", puml_uc5)
    add_code_block("Temiz Sınıf Diyagramı PlantUML", class_diagram_puml)

    doc.build(story)


def main() -> None:
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    homework_dir = os.path.join(workspace_root, "ödev")
    out_portrait = os.path.join(homework_dir, "Grup_ID_Proje_Adim1_Temiz_Portrait.pdf")
    out_landscape = os.path.join(homework_dir, "Grup_ID_Proje_Adim1_Temiz_Landscape.pdf")

    build_pdf(out_portrait, homework_dir=homework_dir, use_landscape=False)
    build_pdf(out_landscape, homework_dir=homework_dir, use_landscape=True)
    print(out_portrait)
    print(out_landscape)


if __name__ == "__main__":
    main()

