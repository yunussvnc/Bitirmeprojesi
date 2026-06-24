"""
AsEmOs PowerPoint Presentation Generator
Generates a professional, premium 16:9 presentation using python-pptx with App Screenshot layouts.
"""

import os
import glob
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# ─── COLOR PALETTE (Premium Deep Ocean Theme) ─────────────────────────────────
BG_DARK       = RGBColor(0x0A, 0x0F, 0x1D)   # #0A0F1D  — deep dark space background
BG_CARD       = RGBColor(0x16, 0x1D, 0x30)   # #161D30  — card fill color
ACCENT_BLUE   = RGBColor(0x38, 0xBD, 0xF8)   # #38BDF8  — neon cyan
ACCENT_GOLD   = RGBColor(0xFB, 0xBF, 0x24)   # #FBBF24  — gold / highlight
WHITE         = RGBColor(0xFF, 0xFF, 0xFF)   # #FFFFFF  — header text
LIGHT_GRAY    = RGBColor(0xF1, 0xF5, 0xF9)   # #F1F5F9  — primary text
MID_GRAY      = RGBColor(0x94, 0xA3, 0xB8)   # #94A3B8  — secondary text
BORDER_COLOR  = RGBColor(0x33, 0x41, 0x55)   # #334155  — card outline

# ─── SLIDE DIMENSIONS (16:9 Wide) ─────────────────────────────────────────────
SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# ─── AUTO-COPY RECENT SCREENSHOTS FROM APP DATA ───────────────────────────────
def auto_copy_screenshots():
    app_data_dir = r"C:\Users\eruru\.gemini\antigravity-ide\brain\b7032cb0-5b0e-47f8-ae04-c8e3102e8ac0"
    project_dir = r"d:\BitirmeProjesi"
    if os.path.exists(app_data_dir):
        # Find all png files, sorted by newest first
        pngs = sorted(glob.glob(os.path.join(app_data_dir, "*.png")), key=os.path.getmtime, reverse=True)
        # We target specific names in the project directory
        dest_names = [
            "screenshot_map.png",       # 1st newest
            "screenshot_ai.png",        # 2nd newest
            "screenshot_login.png",     # 3rd newest
            "screenshot_register.png",  # 4th newest
            "screenshot_chat.png",      # 5th newest
            "screenshot_admin.png"      # 6th newest
        ]
        for idx, name in enumerate(dest_names):
            dest_path = os.path.join(project_dir, name)
            # Only copy if destination doesn't exist to prevent overriding user customization
            if not os.path.exists(dest_path) and idx < len(pngs):
                try:
                    shutil.copy(pngs[idx], dest_path)
                    print(f"[AUTO-COPY] {os.path.basename(pngs[idx])} -> {name}")
                except Exception as e:
                    print(f"[AUTO-COPY ERR] Failed: {e}")

auto_copy_screenshots()

# ─── CORE SETUP ───────────────────────────────────────────────────────────────
prs = Presentation()
prs.slide_width  = SLIDE_W
prs.slide_height = SLIDE_H
blank_layout = prs.slide_layouts[6]  # Use a blank layout for absolute control

# ─── LAYOUT HELPER FUNCTIONS ──────────────────────────────────────────────────

def set_slide_background(slide, color=BG_DARK):
    """Sets a solid background color for the slide."""
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_slide_header(slide, title_text: str, slide_num_str: str):
    """Draws a premium header bar, thin divider, and slide number."""
    # Title Box
    title_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.4), Inches(10.5), Inches(0.8))
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title_text
    run.font.name = "Calibri"
    run.font.bold = True
    run.font.size = Pt(26)
    run.font.color.rgb = WHITE

    # Accent Line Divider
    ln = slide.shapes.add_connector(1, Inches(0.75), Inches(1.15), Inches(12.58), Inches(1.15))
    ln.line.color.rgb = ACCENT_BLUE
    ln.line.width = Pt(1.5)

    # Slide Number Box (top right)
    num_box = slide.shapes.add_textbox(Inches(11.25), Inches(0.4), Inches(1.33), Inches(0.8))
    ntf = num_box.text_frame
    ntf.margin_left = ntf.margin_right = ntf.margin_top = ntf.margin_bottom = 0
    np = ntf.paragraphs[0]
    np.alignment = PP_ALIGN.RIGHT
    nrun = np.add_run()
    nrun.text = slide_num_str
    nrun.font.name = "Calibri"
    nrun.font.size = Pt(11)
    nrun.font.bold = True
    nrun.font.color.rgb = MID_GRAY


def create_card_shape(slide, left, top, width, height, border=True):
    """Creates a rounded rectangle card to act as container for content."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = BG_CARD
    if border:
        shape.line.color.rgb = BORDER_COLOR
        shape.line.width = Pt(1.2)
    else:
        shape.line.fill.background()
    return shape


def add_text_to_card(shape, title: str, bullets: list, title_color=ACCENT_GOLD):
    """Fills the card shape with structured text (title + bullets)."""
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.25)
    tf.margin_bottom = Inches(0.2)

    # Card Title
    p_title = tf.paragraphs[0]
    p_title.alignment = PP_ALIGN.LEFT
    p_title.space_after = Pt(10)
    run_title = p_title.add_run()
    run_title.text = title
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = title_color

    # Bullets
    for i, b in enumerate(bullets):
        p = tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_before = Pt(6)
        
        # Add custom bullet arrow
        bullet_run = p.add_run()
        bullet_run.text = " ▸  "
        bullet_run.font.name = "Calibri"
        bullet_run.font.size = Pt(14)
        bullet_run.font.color.rgb = ACCENT_BLUE
        
        # Add actual text
        text_run = p.add_run()
        text_run.text = b
        text_run.font.name = "Calibri"
        text_run.font.size = Pt(14)
        text_run.font.color.rgb = LIGHT_GRAY


def add_image_or_placeholder(slide, img_name: str, left, top, width, height, placeholder_title: str):
    """
    Checks if the screenshot file exists in d:\\BitirmeProjesi.
    If so, injects the image with a subtle border.
    Otherwise, draws a premium mockup-like dashed container with a guide.
    """
    img_path = os.path.join(r"d:\BitirmeProjesi", img_name)
    if os.path.exists(img_path):
        try:
            pic = slide.shapes.add_picture(img_path, left, top, width, height)
            pic.line.color.rgb = BORDER_COLOR
            pic.line.width = Pt(1.5)
            print(f"[IMG] Slayta eklendi: {img_name}")
            return pic
        except Exception as e:
            print(f"[IMG ERR] Resim yüklenemedi ({img_name}): {e}")

    # Draw dashed placeholder container
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(0x0C, 0x11, 0x1F) # Darker inner slate
    shape.line.color.rgb = ACCENT_BLUE
    shape.line.width = Pt(1.5)
    
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0.15)
    
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = f"\n📷 [UYGULAMA GÖRSELİ]\n\n"
    run.font.name = "Calibri"
    run.font.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = ACCENT_GOLD
    
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    run2 = p2.add_run()
    run2.text = f"{placeholder_title}\n\nDosya Yolu:\nd:\\{img_name}"
    run2.font.name = "Calibri"
    run2.font.size = Pt(11)
    run2.font.color.rgb = MID_GRAY
    return shape


def style_table_cell(cell, text, font_size=13, bold=False, text_color=LIGHT_GRAY, bg_color=None, align=PP_ALIGN.LEFT):
    """Applies premium formatting to a table cell."""
    cell.text_frame.word_wrap = True
    cell.text_frame.margin_left = Inches(0.12)
    cell.text_frame.margin_right = Inches(0.12)
    cell.text_frame.margin_top = Inches(0.08)
    cell.text_frame.margin_bottom = Inches(0.08)
    
    if bg_color:
        cell.fill.solid()
        cell.fill.fore_color.rgb = bg_color
        
    p = cell.text_frame.paragraphs[0]
    p.alignment = align
    
    run = p.runs[0] if p.runs else p.add_run()
    run.text = text
    run.font.name = "Calibri"
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = text_color


# ═══════════════════════════════════════════════════════════════════════════
#  SLIDE CREATION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════

# ─── SLIDE 1: Başlık / Giriş ──────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)

# Left Accent Pillar (Visual Touch)
pillar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.2), SLIDE_H)
pillar.fill.solid()
pillar.fill.fore_color.rgb = ACCENT_BLUE
pillar.line.fill.background()

# Title text box
title_box = slide.shapes.add_textbox(Inches(0.75), Inches(1.5), Inches(11.5), Inches(2.2))
tf = title_box.text_frame
tf.word_wrap = True
tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

# App Name
p1 = tf.paragraphs[0]
r1 = p1.add_run()
r1.text = "AsEmOs\n"
r1.font.name = "Calibri"
r1.font.bold = True
r1.font.size = Pt(56)
r1.font.color.rgb = ACCENT_BLUE

# Subtitle
p2 = tf.add_paragraph()
p2.space_before = Pt(8)
r2 = p2.add_run()
r2.text = "Yapay Zeka Destekli Sosyal Mekan ve Lezzet Öneri Platformu"
r2.font.name = "Calibri"
r2.font.size = Pt(22)
r2.font.color.rgb = WHITE

# Horizontal divider
divider = slide.shapes.add_connector(1, Inches(0.75), Inches(3.6), Inches(6.5), Inches(3.6))
divider.line.color.rgb = ACCENT_BLUE
divider.line.width = Pt(1.5)

# Details Box (3 columns grid at bottom)
cols_data = [
    ("Proje Amacı", ["Kişiselleştirilmiş öneriler", "Lokasyon & Bütçe analizi", "Atmosfer & vibe eşleştirme"]),
    ("Teknolojik Mimari", ["React Native mobil istemci", "FastAPI backend altyapısı", "Groq & Qdrant AI katmanı"]),
    ("Temel Özgün Değer", ["Anlamsal arama motoru", "LLM tabanlı reranking", "Asenkron moderasyon"])
]
for idx, (title, items) in enumerate(cols_data):
    x_pos = Inches(0.75 + idx * 4.0)
    card = create_card_shape(slide, x_pos, Inches(4.2), Inches(3.8), Inches(2.4))
    add_text_to_card(card, title, items)

# Slide numbering
num_box = slide.shapes.add_textbox(Inches(11.5), Inches(6.8), Inches(1.0), Inches(0.4))
num_box.text_frame.paragraphs[0].add_run().text = "01 / 17"
num_box.text_frame.paragraphs[0].runs[0].font.size = Pt(10)
num_box.text_frame.paragraphs[0].runs[0].font.color.rgb = MID_GRAY


# ─── SLIDE 2: Problem Tanımı ──────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Sektörel Problem: Kelime Ağırlıklı Arama vs Anlamsal Arama", "02 / 17")

problems = [
    ("Google Maps Kısıtları", ["Kullanıcı niyetini anlayamaz", "'Sessiz ders çalışmalık kafe' gibi vibe aramaları kelimede tıkanır", "Sadece katı etiket eşleşmesi sunar"]),
    ("Bilgi ve Yorum Kirliliği", ["Binlerce mekan yorumu bulunur", "Kullanıcılar yorum okumaktan yorulur", "Özetlenmiş/damıtılmış veri eksiktir"]),
    ("Semantik Çelişkiler", ["Açıklamada geçen tali kelimeler aramayı kirletir", "Örn: 'sabah kahvaltısı' sunan 'meyhane' kahvaltı aramasında çıkabilir"])
]
for idx, (title, items) in enumerate(problems):
    x_pos = Inches(0.75 + idx * 4.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(3.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 3: Platform Hedefleri ──────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "AsEmOs Platform Hedefleri ve Özgün Değeri", "03 / 17")

goals = [
    ("Vibe & Amaç Eşleştirmesi", ["Sessiz/canlı atmosfer modları", "Çalışma/randevu/grup amaç filtreleri", "Niyete uygun anlamsal eşleşmeler"]),
    ("Akıllı Hibrit Puanlama", ["Konum ve bütçe duyarlılığı", "Haritada mesafe bazlı skor bonusu", "Kullanıcı profil geçmişi entegrasyonu"]),
    ("Güvenli Sosyal Ağ", ["Kullanıcılar arası post & story akışı", "Arka planda asenkron çalışan yapay zeka", "Kötü niyetli içeriklerin filtrelenmesi"])
]
for idx, (title, items) in enumerate(goals):
    x_pos = Inches(0.75 + idx * 4.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(3.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 4: Sistem Mimarisi ─────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Uçtan Uca Sistem Mimarisi", "04 / 17")

arch = [
    ("Mobil & Web İstemciler", ["React Native (Expo Router)", "Next.js 15 Web Yönetim Paneli", "Zustand ile temiz durum yönetimi", "Leaflet JS WebView haritası"]),
    ("Asenkron Backend Servis", ["FastAPI (Python) micro-framework", "SQLAlchemy ORM katmanı", "PostgreSQL (Veri tabanı)", "FastAPI Background Tasks"]),
    ("AI & Vektör Altyapısı", ["Qdrant Vektör Veritabanı", "PyTorch SentenceTransformers", "Groq Cloud API (Llama 3.1)", "RAG (Retrieval-Augmented) pipeline"]),
    ("Performans ve Cache", ["Redis (Valkey) cache server", "Vektör (Embedding) önbellekleme", "Feed & akış cache invalidation", "Hata anında veri tabanı fallback"])
]
# 2x2 Grid Layout positions
positions = [
    (Inches(0.75), Inches(1.8)),  # Row 1 Col 1
    (Inches(6.78), Inches(1.8)),  # Row 1 Col 2
    (Inches(0.75), Inches(4.3)),  # Row 2 Col 1
    (Inches(6.78), Inches(4.3))   # Row 2 Col 2
]
for idx, (title, items) in enumerate(arch):
    x, y = positions[idx]
    card = create_card_shape(slide, x, y, Inches(5.8), Inches(2.2))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 5: Veri Modeli ve Chat Arayüzü (SCREENSHOT INSTALLED) ───────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "İlişkisel Veritabanı (RDBMS) ve Chat Görünümü", "05 / 17")

# Left: DB Schema Text Card (width 5.8)
card = create_card_shape(slide, Inches(0.75), Inches(1.8), Inches(6.8), Inches(4.8))
add_text_to_card(card, "Veritabanı Modelleri & Chat Entegrasyonu", [
    "users & match_profiles: Kullanıcı yetkilendirmesi, yaş, biyografi ve ilgi alanları.",
    "places & saved_places: Mekan bilgileri, konum koordinatları ve kullanıcı kaydetme listeleri.",
    "conversations & messages: Beğenilen mekanlar üzerinden kullanıcılar arası kurulan eşleşmeler ve anlık DMs mesajlaşma altyapısı.",
    "PlaceInteraction: Kullanıcıların mekan bazlı etkileşim skorları (RAG kişiselleştirmesinde kullanılır)."
])

# Right: Screenshot Chat Screen (vertical)
add_image_or_placeholder(slide, "screenshot_chat.png", Inches(8.8), Inches(1.8), Inches(2.8), Inches(4.8), "Mobil Sohbet (Chat) Ekranı")


# ─── SLIDE 6: Vektör Arama Modeli ─────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Anlamsal Arama ve Vektör Veritabanı", "06 / 17")

search_steps = [
    ("1. Vektörleştirme (Embedding)", ["SentenceTransformers modeli kullanılır", "Mekan açıklamaları çok boyutlu vektörlere dönüştürülür"]),
    ("2. Vektör Veritabanı (Qdrant)", ["Vektörler Qdrant DB'ye yazılır", "Arama anında kosinüs benzerliği (Cosine Similarity) hesaplanır"]),
    ("3. Eşik Değeri Filtresi", ["Benzerlik skoru > 0.40 olanlar seçilir", "Benzerlik skoru hibrit puanlama algoritmasına girdi sağlar"]),
    ("4. Niyet Sınıflandırıcı", ["Groq LLM ile arama niyeti tespiti", "Alakasız/genel sohbet sorgularına rehberlik yanıtı üretilir"])
]
for idx, (title, items) in enumerate(search_steps):
    x_pos = Inches(0.75 + idx * 3.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(2.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 7: Threshold Kararı (Table) ────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Deneysel Vektör Eşik Değeri Seçimi (> 0.40)", "07 / 17")

rows, cols = 4, 4
left, top, width, height = Inches(0.75), Inches(1.8), Inches(11.83), Inches(2.2)
table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
table = table_shape.table
table.columns[0].width = Inches(2.5)
table.columns[1].width = Inches(2.0)
table.columns[2].width = Inches(2.0)
table.columns[3].width = Inches(5.33)

headers = ["Eşik Değeri", "Precision", "Recall", "Değerlendirme"]
for col_idx, text in enumerate(headers):
    style_table_cell(table.cell(0, col_idx), text, font_size=14, bold=True, text_color=ACCENT_BLUE, bg_color=BG_CARD)

rows_data = [
    ["0.30", "%64", "%96", "Çok gevşek — alakasız mekanlar arama sonuçlarına sızıyor."],
    ["0.40 ★ OPTİMUM", "%92", "%88", "Sweet Spot — En yüksek dengeli F1-Skorunu (0.90) veriyor."],
    ["0.50", "%98", "%46", "Çok katı — anlamsal olarak uygun olan many mekanları eliyor."]
]
for row_idx, data in enumerate(rows_data):
    bg = RGBColor(0x1F, 0x2E, 0x48) if row_idx == 1 else BG_CARD
    t_color = ACCENT_GOLD if row_idx == 1 else LIGHT_GRAY
    for col_idx, text in enumerate(data):
        style_table_cell(table.cell(row_idx+1, col_idx), text, font_size=13, bold=(row_idx==1), text_color=t_color, bg_color=bg)

card = create_card_shape(slide, Inches(0.75), Inches(4.5), Inches(11.83), Inches(1.8))
add_text_to_card(card, "Metrik Analizi ve F1-Score Optimizasyonu", [
    "Benzerlik eşiğinde Precision (Hassasiyet) ve Recall (Duyarlılık) dengelenerek F1-Skorunun maksimuma ulaştığı 0.40 seçilmiştir.",
    "Arama sonuçlarının doğruluğunu artırırken anlamsal eşleşmeleri de kaçırmayan optimum nokta deneysel olarak doğrulanmıştır."
])


# ─── SLIDE 8: Reranking & AI Ekran Görüntüsü (SCREENSHOT INSTALLED) ────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Groq Rerank ve Yapay Zeka Öneri Görünümü", "08 / 17")

# Left: Explanations (width 6.8)
card = create_card_shape(slide, Inches(0.75), Inches(1.8), Inches(6.8), Inches(4.8))
add_text_to_card(card, "Yeniden Sıralama (Reranking) Altyapısı", [
    "Aşama 1 (Kaba Sıralama): Qdrant ve DB sorgusuyla mesafe, kategori ve anlamsal skoru yüksek ilk 15 aday çekilir.",
    "Aşama 2 (Hassas Rerank): 15 aday mekanın özellikleri, bütçeleri ve kullanıcı tercihleri Groq API Llama 3.1 modeline gönderilir.",
    "Aşama 3 (Doğal Dil Üretimi): Groq, sorguya en uygun 5 mekanı belirler, her biri için Türkçe gerekçeli açıklamaları JSON formatında döner.",
    "Hata Toleransı (Fallback): Groq API kesilirse, sistem doğrudan kural tabanlı kaba sıralamayı gösterir."
])

# Right: Screenshot AI Chat Recommendation (vertical)
add_image_or_placeholder(slide, "screenshot_ai.png", Inches(8.8), Inches(1.8), Inches(2.8), Inches(4.8), "Yapay Zeka Mekan Önerisi")


# ─── SLIDE 9: Arama Anomali Giderme ───────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Semantik Anomalilerin Algoritma ile Önlenmesi", "09 / 17")

anomali_cols = [
    ("Problem: Meyhane Sofrası Anomalisi", [
        "Sorgu: 'Kadıköy'de güzel kahvaltı yapabileceğim yer'",
        "Anomali: Açıklamasında 'hafta sonu serpme kahvaltımız vardır' ifadesi geçen bir meyhanenin, yüksek vektör benzerliği nedeniyle listenin en tepesinde çıkması.",
        "Neden: Vektör benzerliğinin genel mekan bağlamını (gece/meyhane konsepti) göz ardı edebilmesi."
    ]),
    ("Çözüm: Gündüz vs Gece Kategori Cezalandırma", [
        "Arama sorgusundaki gündüz aktiviteleri algılanır ('kahvaltı', 'kahve', 'kafe', 'ders çalışma', 'kütüphane').",
        "Eğer bu kelimeler varsa, kategorisi gece mekanı olan yerlerin ('bar', 'pub', 'meyhane', 'gece kulübü') skorlarına otomatik olarak −5.0 ceza puanı uygulanır.",
        "Bu sayede semantik doğruluk performansa ek yük getirmeden sağlanır."
    ])
]
for idx, (title, items) in enumerate(anomali_cols):
    x_pos = Inches(0.75 + idx * 6.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(5.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=(ACCENT_GOLD if idx == 0 else ACCENT_BLUE))


# ─── SLIDE 10: Asenkron Moderasyon & Admin Panel (SCREENSHOT INSTALLED) ────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Background Tasks ile Sosyal Moderasyon", "10 / 17")

# Left: Moderation Text Card (width 5.8)
card = create_card_shape(slide, Inches(0.75), Inches(1.8), Inches(5.8), Inches(4.8))
add_text_to_card(card, "Asenkron İçerik Denetimi", [
    "Gönderi veya hikaye eklendiğinde işlem anında tamamlanır; asenkron denetim FastAPI Background Tasks ile yürütülür.",
    "Groq Llama 3.1 modeli metinleri argo, şiddet, nefret söylemi veya yasadışı madde özendirme yönünden analiz eder.",
    "Uygunsuz bulunan postlar anında 'rejected' yapılarak yayından gizlenir.",
    "İçerik engellendiğinde, o içeriği barındıran tüm Redis feed cache'leri anında geçersiz kılınarak (invalidate) silinir."
])

# Right: Web Admin Panel Screenshot (horizontal - wide 16:9 ratio)
add_image_or_placeholder(slide, "screenshot_admin.png", Inches(6.8), Inches(2.2), Inches(5.8), Inches(3.26), "Next.js 15 Web Yönetim Paneli")


# ─── SLIDE 11: Önbellek Yönetimi ──────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Redis ile Önbellek ve Veri Tutarlılığı", "11 / 17")

cache_cols = [
    ("Önbellek Katmanları (Redis / Valkey)", [
        "Embedding Cache: Hesaplanan metin vektörleri Redis'te 30 gün boyunca saklanır. Tekrarlı sorgularda CPU yükü engellenir.",
        "Feed Cache: Kullanıcıların ana akışları (feed) önbelleğe alınarak yüksek veritabanı yükü ve gecikmeler sıfıra indirilir."
    ]),
    ("Cache Invalidation (Geçersiz Kılma)", [
        "Veri Tutarlılığı: Veritabanında bir post eklendiğinde ilgili feed cache anahtarı anında silinir.",
        "Güvenlik Entegrasyonu: Moderasyon bir gönderiyi engellediğinde, o gönderiyi içeren tüm feed cache'leri saniyeler içinde temizlenir."
    ])
]
for idx, (title, items) in enumerate(cache_cols):
    x_pos = Inches(0.75 + idx * 6.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(5.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 12: Kimlik Doğrulama & Giriş Kartı (2 SCREENSHOTS INSTALLED) ─────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "JWT Yetkilendirme ve Mobil Giriş/Kayıt Arayüzleri", "12 / 17")

# Left: Auth Text Card (width 5.5)
card = create_card_shape(slide, Inches(0.75), Inches(1.8), Inches(5.5), Inches(4.8))
add_text_to_card(card, "Stateless Auth & Token Revocation", [
    "JWT HS256: Tüm API istekleri stateless tokenlar ile imzalanıp doğrulanır.",
    "token_version Kontrolü: Şifre sıfırlandığında veya çıkış yapıldığında veritabanındaki sürüm artırılarak eski tokenlar anında geçersiz kılınır.",
    "OOM & BlurView Düzenlemesi: Android'deki BlurView kart taşma ve kırpılma hataları, BlurView'ün standard View içine absolute yerleştirilmesiyle çözüldü.",
    "Input Göz İkonu: Şifre göster/gizle ikonunun tıklama duyarlılığı hitSlop eklenerek artırıldı."
])

# Right: Two screenshots side-by-side (Login & Register vertical mockups)
add_image_or_placeholder(slide, "screenshot_login.png", Inches(6.8), Inches(1.8), Inches(2.6), Inches(4.8), "Mobil Giriş Ekranı")
add_image_or_placeholder(slide, "screenshot_register.png", Inches(9.7), Inches(1.8), Inches(2.6), Inches(4.8), "Mobil Kayıt Ekranı")


# ─── SLIDE 13: Girdi Güvenliği ────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Input Validation ve SQL Injection Önlemleri", "13 / 17")

security_cards = [
    ("Pydantic Veri Doğrulama", ["FastAPI Pydantic şemaları ile API'ye gelen tüm isteklerin formatı, sınırları ve tipleri kontrol edilir.", "Hatalı formatta gelen istekler iş katmanına ulaşmadan elenir (HTTP 422)."]),
    ("SQL Injection Koruması", ["Ham SQL sorguları kullanılmaz.", "Tüm veritabanı işlemleri SQLAlchemy ORM'in parametrik sorgu motoru ile sanitize edilir."]),
    ("Regex Güvenlik Süzgeci", ["Arama girdilerine yönelik kötü niyetli prompt injection girişimleri engellenir.", "Filtrelenen argo ve yasaklı kelimeler sınır kontrolüyle elenir."])
]
for idx, (title, items) in enumerate(security_cards):
    x_pos = Inches(0.75 + idx * 4.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(3.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 14: Sunucu Bellek Optimizasyonları ─────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Sunucu Altyapı ve RAM Optimizasyonları", "14 / 17")

oom_cols = [
    ("Sorun: Out-of-Memory (OOM) Hatası", [
        "PyTorch ve SentenceTransformers modelleri bulut sunucuda (Render) yüklenirken 2 GB+ RAM tüketerek sistemi çökertmekteydi.",
        "Sunucu CPU çekirdeği başına ayrı thread'ler oluşturarak bellek taşması yaratıyordu."
    ]),
    ("Uygulanan Çözümler ve RAM Sonuçları", [
        "Model Singleton Sarmalayıcı: Embedding modeli belleğe sadece 1 kez yüklenir ve ortak kullanılır.",
        "Thread Sınırlandırması: PyTorch CPU thread sayısı torch.set_num_threads(1) ile sınırlandırıldı.",
        "Worker Optimizasyonu: Uvicorn worker sayısı 1'e düşürülerek izole processes sayısı azaltıldı ve RAM kullanımı 500 MB'a indirildi."
    ])
]
for idx, (title, items) in enumerate(oom_cols):
    x_pos = Inches(0.75 + idx * 6.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(5.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SLIDE 15: Mobil WebView Haritası (SCREENSHOT INSTALLED) ──────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Mobil Harita ve Dinamik WebView Entegrasyonu", "15 / 17")

# Left: Harita Detayları Card (width 6.5)
card = create_card_shape(slide, Inches(0.75), Inches(1.8), Inches(6.8), Inches(4.8))
add_text_to_card(card, "Harita Teknolojisi & Leaflet JS", [
    "WebView sarmalaması ile Leaflet JS ve OpenStreetMap altyapısı kullanılmış, lisans maliyetleri sıfırlanmıştır.",
    "Gelişmiş Dark Mode: dark_all harita tile'ı ile gece modunda sokak isimleri ve etiketlerin net görünümü sağlandı.",
    "Marker Kayma Çözümü: Leaflet divIcon wrapper class'ı boş bırakılıp .custom-marker-inner alt div'i ile konumlandırma yapılarak marker drift çözüldü.",
    "Dinamik Etiketler: Harita pin isim etiketleri sadece zoom >= 14 olduğunda görünür hale getirilerek görsel karmaşa önlendi."
])

# Right: Screenshot Map (vertical)
add_image_or_placeholder(slide, "screenshot_map.png", Inches(8.8), Inches(1.8), Inches(2.8), Inches(4.8), "Mobil Harita Görünümü")


# ─── SLIDE 16: Test Sonuçları (Metrics Showcase) ──────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "100 Gerçekçi Kullanıcı Sorgusu ile Başarı Analizi", "16 / 17")

# 3 Large Metric Cards at top
metrics_data = [
    ("%98.0", "Niyet Sınıflandırma Doğruluğu", ACCENT_BLUE),
    ("%92.0", "Öneri Hassasiyeti (P@3)", ACCENT_GOLD),
    ("0.90", "Deneysel F1-Skor Başarısı", RGBColor(0x10, 0xB9, 0x81)) # green
]
for idx, (num, desc, color) in enumerate(metrics_data):
    x_pos = Inches(0.75 + idx * 4.0)
    card = create_card_shape(slide, x_pos, Inches(1.6), Inches(3.8), Inches(1.8))
    tf_m = card.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = Inches(0.15)
    
    p_num = tf_m.paragraphs[0]
    p_num.alignment = PP_ALIGN.CENTER
    r_num = p_num.add_run()
    r_num.text = num
    r_num.font.name = "Calibri"
    r_num.font.size = Pt(44)
    r_num.font.bold = True
    r_num.font.color.rgb = color
    
    p_desc = tf_m.add_paragraph()
    p_desc.alignment = PP_ALIGN.CENTER
    p_desc.space_before = Pt(4)
    r_desc = p_desc.add_run()
    r_desc.text = desc
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(13)
    r_desc.font.bold = True
    r_desc.font.color.rgb = LIGHT_GRAY

# Table underneath for latency and recall
rows, cols = 4, 3
left, top, width, height = Inches(0.75), Inches(3.7), Inches(11.83), Inches(1.8)
table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
table = table_shape.table
table.columns[0].width = Inches(5.5)
table.columns[1].width = Inches(3.16)
table.columns[2].width = Inches(3.17)

headers = ["Ölçülen Performans Metriği", "Elde Edilen Sonuç", "Açıklama / Hedef"]
for col_idx, text in enumerate(headers):
    style_table_cell(table.cell(0, col_idx), text, font_size=13, bold=True, text_color=ACCENT_BLUE, bg_color=BG_CARD)

rows_data = [
    ["Öneri Duyarlılığı (Recall@10)", "%88.0", "Top 10 adayda hedeflenen mekanları yakalama başarısı."],
    ["Ortalama Yanıt Süresi (Yerel Arama)", "140 ms", "FastAPI + DB sorgu süresi (Redis cache ile 20 ms)."],
    ["Ortalama Yanıt Süresi (LLM Rerank Arama)", "1.25 sn", "Groq API ağ gecikmesi dahil uçtan uca süre."]
]
for row_idx, data in enumerate(rows_data):
    for col_idx, text in enumerate(data):
        style_table_cell(table.cell(row_idx+1, col_idx), text, font_size=12, bold=False, text_color=LIGHT_GRAY, bg_color=BG_CARD)

# Bottom badge
badge = slide.shapes.add_textbox(Inches(0.75), Inches(6.8), Inches(6), Inches(0.4))
badge.text_frame.paragraphs[0].add_run().text = "AsEmOs  ·  Deneysel Test Raporu  ·  2025"
badge.text_frame.paragraphs[0].runs[0].font.size = Pt(11)
badge.text_frame.paragraphs[0].runs[0].font.italic = True
badge.text_frame.paragraphs[0].runs[0].font.color.rgb = MID_GRAY


# ─── SLIDE 17: Sonuç ve Gelecek Çalışmalar ────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_slide_background(slide)
add_slide_header(slide, "Sonuç ve Gelecek Çalışmalar", "17 / 17")

result_cols = [
    ("Proje Çıktısı ve Katkıları", [
        "Full-Stack Platform: Kullanıcıların mekan paylaşabildiği ve akıllı öneri alabildiği bütünsel bir sosyal harita ekosistemi başarıyla tamamlandı.",
        "Düşük Maliyet ve Yüksek Performans: Groq, Qdrant ve Redis entegrasyonuyla sunucu maliyetleri en aza indirilerek 1 saniye civarında AI yanıt performansı elde edildi.",
        "Güvenli Topluluk: Asenkron çalışan arka plan moderasyonu ile spam ve kötü niyetli içerikler izole edildi."
    ]),
    ("Gelecek Vizyonu", [
        "Fine-Tuning: SentenceTransformers modelinin kullanıcıların geçmiş yorum ve puanlama geçmişine göre daha da kişiselleştirilmesi (Fine-tuning).",
        "Gelişmiş Harita Rotaları: Harita üzerinde dinamik rota çizimleri ve arkadaş grupları için ortak buluşma noktaları hesaplayan algoritmaların eklenmesi.",
        "Ölçekleme: Qdrant bulut kümesi entegrasyonu ile milyonlarca mekan verisinin anlık taranabilmesi."
    ])
]
for idx, (title, items) in enumerate(result_cols):
    x_pos = Inches(0.75 + idx * 6.0)
    card = create_card_shape(slide, x_pos, Inches(1.8), Inches(5.8), Inches(4.5))
    add_text_to_card(card, title, items, title_color=ACCENT_GOLD)


# ─── SAVE PRESENTATION ────────────────────────────────────────────────────────
output_path = r"d:\BitirmeProjesi\AsEmOs_Presentation.pptx"
prs.save(output_path)
print(f"[OK] Görselli premium sunum başarıyla oluşturuldu: {output_path}")
