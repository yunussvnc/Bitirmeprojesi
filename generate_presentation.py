"""
AsEmOs PowerPoint Presentation Generator
Generates a professional dark-theme 16:9 presentation using python-pptx
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ─── COLOR PALETTE ───────────────────────────────────────────────────────────
BG_DARK       = RGBColor(0x0F, 0x17, 0x2A)   # #0F172A  — slide background
BG_CARD       = RGBColor(0x1E, 0x29, 0x3B)   # #1E293B  — content box bg
ACCENT_BLUE   = RGBColor(0x38, 0xBD, 0xF8)   # #38BDF8  — neon blue
ACCENT_GOLD   = RGBColor(0xF5, 0xD0, 0x60)   # #F5D060  — gold / key labels
WHITE         = RGBColor(0xFF, 0xFF, 0xFF)   # #FFFFFF  — title text
LIGHT_GRAY    = RGBColor(0xE2, 0xE8, 0xF0)   # #E2E8F0  — body text
MID_GRAY      = RGBColor(0x94, 0xA3, 0xB8)   # #94A3B8  — secondary text
DIVIDER       = RGBColor(0x33, 0x4E, 0x68)   # separator line

# ─── SLIDE DIMENSIONS (16:9) ─────────────────────────────────────────────────
SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
L_MARGIN   = Inches(0.75)   # left margin
T_MARGIN   = Inches(0.55)   # top margin for title
CONTENT_T  = Inches(1.65)   # top for content box
CONTENT_H  = Inches(5.45)   # height of content box
CONTENT_W  = Inches(11.83)  # width of content box


def set_bg(slide, color: RGBColor):
    """Fill slide background with a solid color."""
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_title_box(slide, title_text: str):
    """Add the title text box (top area)."""
    txBox = slide.shapes.add_textbox(L_MARGIN, T_MARGIN, Inches(11.83), Inches(0.95))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title_text
    run.font.name = "Calibri"
    run.font.bold = True
    run.font.size = Pt(28)
    run.font.color.rgb = WHITE

    # Thin accent line under title
    ln = slide.shapes.add_connector(1, L_MARGIN, Inches(1.50), Inches(13.33) - L_MARGIN, Inches(1.50))
    ln.line.color.rgb = ACCENT_BLUE
    ln.line.width = Pt(1.5)


def add_content_box(slide):
    """Add a semi-dark rounded content box and return its text frame."""
    box = slide.shapes.add_textbox(L_MARGIN, CONTENT_T, CONTENT_W, CONTENT_H)
    box.fill.solid()
    box.fill.fore_color.rgb = BG_CARD
    tf = box.text_frame
    tf.word_wrap = True
    return tf


def add_paragraph(tf, text: str, level: int = 0,
                  bold: bool = False, color: RGBColor = None,
                  size: int = 18, space_before: int = 6,
                  italic: bool = False, bullet: bool = True):
    """Append a paragraph to a text frame."""
    p = tf.add_paragraph()
    p.level = level
    p.alignment = PP_ALIGN.LEFT
    p.space_before = Pt(space_before)
    if bullet and level > 0:
        # pptx doesn't do auto bullets easily in textboxes; use manual symbol
        bullet_char = "  ▸  " if level == 1 else "      –  "
        run = p.add_run()
        run.text = bullet_char
        run.font.name = "Calibri"
        run.font.size = Pt(size)
        run.font.color.rgb = ACCENT_BLUE if level == 1 else MID_GRAY
        run.font.bold = False

    run = p.add_run()
    run.text = text
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color if color else LIGHT_GRAY
    return p


def add_label_value(tf, label: str, value: str, size: int = 17, space_before: int = 10):
    """Add a highlighted label + value line."""
    p = tf.add_paragraph()
    p.alignment = PP_ALIGN.LEFT
    p.space_before = Pt(space_before)

    prefix = p.add_run()
    prefix.text = "  ▸  "
    prefix.font.name = "Calibri"
    prefix.font.size = Pt(size)
    prefix.font.color.rgb = ACCENT_BLUE
    prefix.font.bold = False

    rl = p.add_run()
    rl.text = label + ": "
    rl.font.name = "Calibri"
    rl.font.size = Pt(size)
    rl.font.bold = True
    rl.font.color.rgb = ACCENT_GOLD

    rv = p.add_run()
    rv.text = value
    rv.font.name = "Calibri"
    rv.font.size = Pt(size)
    rv.font.bold = False
    rv.font.color.rgb = LIGHT_GRAY


def add_section_header(tf, text: str, space_before: int = 14):
    """Bold section header inside content box."""
    p = tf.add_paragraph()
    p.alignment = PP_ALIGN.LEFT
    p.space_before = Pt(space_before)
    run = p.add_run()
    run.text = text
    run.font.name = "Calibri"
    run.font.size = Pt(19)
    run.font.bold = True
    run.font.color.rgb = ACCENT_BLUE


def add_table_row(tf, cols, widths=None, header=False, space_before=4):
    """Simulate a table row using a single paragraph with tab stops."""
    p = tf.add_paragraph()
    p.alignment = PP_ALIGN.LEFT
    p.space_before = Pt(space_before)
    for i, col in enumerate(cols):
        run = p.add_run()
        pad = "  " if i == 0 else "    "
        run.text = pad + col
        run.font.name = "Calibri"
        run.font.size = Pt(16)
        run.font.bold = header
        run.font.color.rgb = ACCENT_GOLD if header else (WHITE if i == 0 else LIGHT_GRAY)
        if i < len(cols) - 1:
            sep = p.add_run()
            sep.text = "  │  "
            sep.font.name = "Calibri"
            sep.font.size = Pt(16)
            sep.font.color.rgb = DIVIDER
            sep.font.bold = False


# ═══════════════════════════════════════════════════════════════════════════
#  BUILD PRESENTATION
# ═══════════════════════════════════════════════════════════════════════════

prs = Presentation()
prs.slide_width  = SLIDE_W
prs.slide_height = SLIDE_H

blank_layout = prs.slide_layouts[6]  # blank


# ─── SLIDE 1: Title / Intro ───────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)

# Big centered title area
title_box = slide.shapes.add_textbox(L_MARGIN, Inches(1.2), Inches(11.83), Inches(1.5))
tf = title_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
run = p.add_run()
run.text = "AsEmOs"
run.font.name = "Calibri"
run.font.bold = True
run.font.size = Pt(52)
run.font.color.rgb = ACCENT_BLUE

sub_box = slide.shapes.add_textbox(L_MARGIN, Inches(2.5), Inches(11.83), Inches(0.7))
tf2 = sub_box.text_frame
p2 = tf2.paragraphs[0]
p2.alignment = PP_ALIGN.LEFT
r2 = p2.add_run()
r2.text = "Yapay Zeka Destekli Sosyal Mekan ve Lezzet Öneri Platformu"
r2.font.name = "Calibri"
r2.font.size = Pt(26)
r2.font.bold = False
r2.font.color.rgb = WHITE

# divider
ln = slide.shapes.add_connector(1, L_MARGIN, Inches(3.3), Inches(12.58), Inches(3.3))
ln.line.color.rgb = ACCENT_BLUE
ln.line.width = Pt(1.5)

info_box = slide.shapes.add_textbox(L_MARGIN, Inches(3.55), Inches(11.83), Inches(3.2))
tf3 = info_box.text_frame
tf3.word_wrap = True

add_label_value(tf3, "Proje Adı", "AsEmOs  (AI-Powered Social Venue & Food Recommendation Platform)", size=17, space_before=8)
add_label_value(tf3, "Tasarım Amacı",
                "Konum, bütçe, atmosfer (vibe) ve amaca özel kişiselleştirilmiş mekan ve yemek önerileri sunan Full-Stack sosyal ekosistem.",
                size=17, space_before=14)
add_label_value(tf3, "Mimari",
                "Mobil İstemci (React Native) | Web Yönetim Arayüzü (Next.js) | FastAPI Backend + AI Servisi",
                size=17, space_before=14)

# Slide number
sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
sn.text_frame.paragraphs[0].runs  # placeholder
r = sn.text_frame.paragraphs[0].add_run()
r.text = "01 / 17"
r.font.size = Pt(10)
r.font.color.rgb = MID_GRAY


# ─── SLIDE 2: Problem ─────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Sektörel Problem: Kelime Ağırlıklı Arama vs Anlamsal Arama")
tf = add_content_box(slide)

p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Problem 1",
                'Google Maps vb. klasik harita uygulamalarının kullanıcı niyetini (örn: "sessiz ders çalışmalık kafe") doğrudan anlayamaması.',
                size=17, space_before=12)
add_label_value(tf, "Problem 2",
                "Bilgi kirliliği ve kullanıcıların yüzlerce mekan yorumu arasında boğulması.",
                size=17, space_before=18)
add_label_value(tf, "Problem 3",
                '"Sabah kahvaltısı" kelimesini barındıran bir "meyhane"nin kahvaltı aramasında çıkması — semantik çelişki.',
                size=17, space_before=18)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "02 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 3: Hedefler ────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "AsEmOs Platform Hedefleri ve Özgün Değeri")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Kişiselleştirilmiş Vibe & Amaç Eşleştirmesi",
                "Sessiz/canlı atmosfer ve çalışma/randevu/arkadaş grubu amaç filtreleri.",
                size=17, space_before=12)
add_label_value(tf, "Lokasyon ve Bütçe Duyarlılığı",
                "Harita üzerinde gerçek zamanlı mesafe bazlı skorlama.",
                size=17, space_before=18)
add_label_value(tf, "Güvenli Sosyal Platform",
                "Kullanıcıların post ve hikaye paylaşabildiği, yapay zekanın kötü niyetli içerikleri otomatik ayıkladığı güvenli akış.",
                size=17, space_before=18)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "03 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 4: Mimari ──────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Uçtan Uca Sistem Mimarisi")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Frontend",
                "React Native (Expo) Mobil Uygulama  +  Next.js 15 Web Admin / Venue Paneli",
                size=17, space_before=12)
add_label_value(tf, "Backend Service",
                "FastAPI (Python)  ·  SQLAlchemy ORM  ·  PostgreSQL (Render cloud)",
                size=17, space_before=18)
add_label_value(tf, "AI & Vektör Altyapısı",
                "Qdrant (Vektör DB)  ·  PyTorch (Embedding)  ·  Groq Cloud API — Llama 3.1",
                size=17, space_before=18)
add_label_value(tf, "Caching & Message Broker",
                "Redis (Valkey) — embedding ve feed önbellek yönetimi",
                size=17, space_before=18)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "04 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 5: Veri Modeli ─────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "İlişkisel Veritabanı (RDBMS) Tasarımı")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "`users` Tablosu",
                "Kullanıcı bilgileri, şifre hash'leri ve rol tanımları: admin | venue | standard",
                size=17, space_before=12)
add_label_value(tf, "`places` Tablosu",
                "Mekan adı, kategori, adres, çalışma saatleri ve Qdrant vektör anahtarı (vector_id)",
                size=17, space_before=16)
add_label_value(tf, "`posts` & `stories` Tablosu",
                "Kullanıcı içerikleri, moderasyon durumları — status: approved | pending | rejected",
                size=17, space_before=16)
add_label_value(tf, "`PlaceInteraction` Tablosu",
                "Kullanıcıların mekanlarla etkileşim skorları (RAG kişiselleştirmesi için)",
                size=17, space_before=16)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "05 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 6: Vektör Arama ────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Anlamsal Arama ve Vektör Veritabanı")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Embedding Üretimi",
                "PyTorch tabanlı SentenceTransformers modeli ile mekan açıklamalarının vektörleştirilmesi",
                size=17, space_before=12)
add_label_value(tf, "Qdrant Vektör Tabanı",
                "Vektörlerin saklanması ve Kosinüs Benzerliği (Cosine Similarity) araması",
                size=17, space_before=18)
add_label_value(tf, "Eşik Değeri (Threshold)",
                "Cosine Similarity  >  0.40",
                size=17, space_before=18)
add_label_value(tf, "Niyet Algılama",
                "Groq LLM Sınıflandırıcısı ile kullanıcının mekanla ilgili arama yapıp yapmadığının tespiti",
                size=17, space_before=18)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "06 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 7: Threshold ───────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Deneysel Vektör Eşik Değeri Seçimi  (> 0.40)")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(14)

add_section_header(tf, "  Eşik Değeri Karşılaştırma Tablosu", space_before=8)

add_table_row(tf, ["Eşik Değeri", "Precision", "Recall", "Değerlendirme"], header=True, space_before=12)

# separator line via dashes
sep = tf.add_paragraph()
sep.space_before = Pt(2)
sr = sep.add_run()
sr.text = "  " + "─" * 72
sr.font.size = Pt(10)
sr.font.color.rgb = DIVIDER

add_table_row(tf, ["0.30", "%64", "%96", "Çok gevşek — alakasız mekanlar sızıyor"], space_before=4)
add_table_row(tf, ["0.40 ★ OPTİMUM", "%92", "%88", "Sweet Spot — F1-Score: 0.90"], space_before=4)
add_table_row(tf, ["0.50", "%98", "%46", "Çok katı — anlamsal eşleşmeleri kaçırıyor"], space_before=4)

add_section_header(tf, "  Sonuç", space_before=16)
add_paragraph(tf, "F1-Skorunu maksimuma çıkaran 0.40 değeri optimum benzerlik eşiği olarak seçilmiştir.",
              level=0, size=17, space_before=6, bullet=False, color=LIGHT_GRAY)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "07 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 8: Reranking ───────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Groq Cloud ile Yeniden Sıralama (Reranking)")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Aşama 1 — Kaba Arama",
                "Qdrant ve PostgreSQL üzerinden en yüksek skora sahip ilk 15 aday mekan çekilir.",
                size=17, space_before=14)
add_label_value(tf, "Aşama 2 — Hassas Sıralama",
                "15 mekanın özellikleri + kullanıcı tercihleri (vibe, bütçe, amaç) → Groq API  (llama-3.1-8b-instant)",
                size=17, space_before=20)
add_label_value(tf, "Aşama 3 — JSON Çıktısı",
                "Model en uygun 5-10 mekanı sıralar, her biri için Türkçe açıklama hazırlar ve sistemi yönlendirir.",
                size=17, space_before=20)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "08 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 9: Anomali ─────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Semantik Anomalilerin Algoritma ile Önlenmesi")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_section_header(tf, "  Problem — Meyhane Sofrası Anomalisi", space_before=10)
add_paragraph(tf,
              '"Kadıköy\'de güzel kahvaltı yapabileceğim yer" sorgusunda en yüksek benzerlik skorunun bir meyhanenin üzerinde kalması — açıklamasında "hafta sonu kahvaltısı" geçtiği için.',
              level=0, size=16, space_before=6, bullet=False, color=LIGHT_GRAY)

add_section_header(tf, "  Çözüm — Kategori Cezalandırma Sistemi", space_before=16)
add_paragraph(tf,
              "Sorguda gündüz aktiviteleri (kahvaltı, kahve, kafe, ders çalışma vb.) algılanırsa;",
              level=0, size=16, space_before=6, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf,
              'Kategorisi gece mekanı (bar, pub, meyhane, gece kulübü) olan yerlerin skoruna  −5.0  ceza puanı otomatik uygulanır.',
              level=0, size=16, space_before=4, bullet=False, color=ACCENT_GOLD)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "09 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 10: Moderasyon ─────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Background Tasks ile İçerik Güvenliği")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Asenkron Çalışma",
                "Gönderi (post) veya hikaye (story) oluşturulduğunda moderasyon işlemi arka planda tetiklenir.",
                size=17, space_before=14)
add_label_value(tf, "Groq Analizi",
                "Metinler llama-3.1-8b-instant modeli ile argo, şiddet, hakaret, nefret söylemi ve yasadışı madde özendirme açısından taranır.",
                size=17, space_before=20)
add_label_value(tf, "Otomatik İşlem",
                'Uygunsuz içeriklerin durumu  pending → rejected  yapılarak yayından kaldırılır.',
                size=17, space_before=20)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "10 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 11: Redis Cache ────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Redis ile Önbellek ve Veri Tutarlılığı")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Embedding Caching",
                "Hesaplanan metin vektörleri Redis'te 30 gün saklanır. Tekrarlanan aramalarda model CPU çalıştırmaz.",
                size=17, space_before=14)
add_label_value(tf, "Feed Caching",
                "Kullanıcı ana akışları önbelleğe alınır; hız ve ölçeklenebilirlik artırılır.",
                size=17, space_before=18)

add_section_header(tf, "  Cache Invalidation (Geçersiz Kılma)", space_before=18)
add_paragraph(tf, "Yeni gönderi eklendiğinde → ilgili feed cache silinir.",
              level=0, size=16, space_before=6, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf, "Moderasyon bir gönderiyi engellediğinde → cache anında geçersiz kılınarak silinir.",
              level=0, size=16, space_before=4, bullet=False, color=LIGHT_GRAY)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "11 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 12: JWT ────────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "JWT Yetkilendirme ve Oturum Yönetimi")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "JWT HS256",
                "Güvenli imzalama algoritması ile stateless yetkilendirme.",
                size=17, space_before=14)
add_label_value(tf, "Token Revocation",
                "token_version mekanizması ile oturum iptali sağlanır.",
                size=17, space_before=18)

add_section_header(tf, "  Nasıl Çalışır?", space_before=18)
add_paragraph(tf, "1.  Kullanıcı tablosunda token_version (tamsayı) tutulur.",
              level=0, size=16, space_before=6, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf, '2.  Şifre değiştiğinde veya "Tüm oturumları kapat" dendiğinde bu versiyon artırılır.',
              level=0, size=16, space_before=4, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf, "3.  Eski token versiyonu uyuşmadığı için anında geçersiz olur.",
              level=0, size=16, space_before=4, bullet=False, color=LIGHT_GRAY)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "12 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 13: Input Validation ───────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Input Validation ve SQL Injection Önlemleri")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Pydantic Şemaları",
                "API'ye gelen tüm verilerin tipleri, sınırları ve formatları katı kurallarla doğrulanır.",
                size=17, space_before=14)
add_label_value(tf, "SQL Injection Engelleme",
                "Ham SQL sorgusu kullanılmadan tamamen SQLAlchemy ORM parametrik sorguları tercih edilmiştir.",
                size=17, space_before=18)
add_label_value(tf, "Yapay Zeka Güvenlik Filtresi",
                "Kötü niyetli prompt injection ve siyasi/uygunsuz kelime saldırıları regex sınır kontrolü ile API katmanında engellenir.",
                size=17, space_before=18)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "13 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 14: OOM Optimizasyon ───────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Sunucu Altyapı ve RAM Optimizasyonları")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_section_header(tf, "  Problem", space_before=10)
add_paragraph(tf,
              "Bulut sunucuda (Render) PyTorch modellerinin yüklenirken 2 GB+ RAM tüketerek sistemi çökertmesi — Out-of-Memory (OOM) hatası.",
              level=0, size=16, space_before=5, bullet=False, color=LIGHT_GRAY)

add_section_header(tf, "  Uygulanan Çözümler", space_before=16)
add_label_value(tf, "Model Singleton",
                "SentenceTransformers modeli belleğe yalnızca 1 kez yüklenir ve paylaşımlı kullanılır.",
                size=16, space_before=8)
add_label_value(tf, "Thread Kısıtlaması",
                "PyTorch CPU iş parçacığı sayısı  torch.set_num_threads(1)  ile sınırlandırıldı.",
                size=16, space_before=10)
add_label_value(tf, "Worker Optimizasyonu",
                "Uvicorn worker sayısı 1'e düşürülerek izole süreçlerin RAM tüketimi yarıya indirildi.",
                size=16, space_before=10)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "14 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 15: Mobil & Harita ─────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Mobil Arayüz ve Dinamik WebView Haritası")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Teknolojiler",
                "React Native (Expo Router)  ·  Leaflet JS & OpenStreetMap (WebView sarmalaması)",
                size=17, space_before=14)

add_section_header(tf, "  Harita Özellikleri", space_before=18)
add_paragraph(tf, "Dark Mode uyumlu etiketli harita tasarımı  (dark_all tile entegrasyonu)",
              level=0, size=16, space_before=8, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf, "Pinlerin altında sürekli görünen ve zoom seviyesine duyarlı etiketler  (Zoom ≥ 14 → etiketler görünür)",
              level=0, size=16, space_before=5, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf, "Aktif pini otomatik ortalama ve büyütme animasyonları",
              level=0, size=16, space_before=5, bullet=False, color=LIGHT_GRAY)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "15 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 16: Test Sonuçları ─────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "100 Gerçekçi Kullanıcı Sorgusu ile Başarı Analizi")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(14)

add_section_header(tf, "  Değerlendirme Metrikleri", space_before=8)

add_table_row(tf, ["Metrik", "Değer"], header=True, space_before=10)
sep = tf.add_paragraph(); sep.space_before = Pt(2)
sr = sep.add_run(); sr.text = "  " + "─" * 52; sr.font.size = Pt(10); sr.font.color.rgb = DIVIDER

rows = [
    ("Niyet Sınıflandırma Doğruluğu (Intent Accuracy)", "%98.0"),
    ("Öneri Hassasiyeti (Precision@3)", "%92.0"),
    ("Öneri Duyarlılığı (Recall@10)", "%88.0"),
    ("Ort. Yanıt Süresi — Yerel Arama", "140 ms"),
    ("Ort. Yanıt Süresi — LLM Rerank", "1.25 sn"),
    ("F1-Skoru", "0.90  ★"),
]
for row in rows:
    add_table_row(tf, list(row), space_before=4)

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "16 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SLIDE 17: Sonuç ──────────────────────────────────────────────────────────
slide = prs.slides.add_slide(blank_layout)
set_bg(slide, BG_DARK)
add_title_box(slide, "Sonuç ve Gelecek Vizyonu")
tf = add_content_box(slide)
p0 = tf.paragraphs[0]; p0.space_before = Pt(12)

add_label_value(tf, "Proje Çıktısı",
                "Anlamsal arama, yapay zeka sıralaması ve asenkron moderasyon entegrasyonuna sahip, "
                "ölçeklenebilir ve güvenli bir Full-Stack platform başarıyla tamamlanmıştır.",
                size=17, space_before=14)

add_section_header(tf, "  Gelecek Çalışmalar", space_before=20)
add_paragraph(tf,
              "Embedding modelinin kullanıcıların yorum geçmişine göre daha da kişiselleştirilmesi (Fine-tuning).",
              level=0, size=16, space_before=8, bullet=False, color=LIGHT_GRAY)
add_paragraph(tf,
              "Harita üzerinde rota çizimi ve arkadaş grupları için ortak buluşma noktası öneren yapay zeka algoritmalarının eklenmesi.",
              level=0, size=16, space_before=6, bullet=False, color=LIGHT_GRAY)

# Final badge
badge = slide.shapes.add_textbox(L_MARGIN, Inches(6.75), Inches(6), Inches(0.5))
b_tf = badge.text_frame
br = b_tf.paragraphs[0].add_run()
br.text = "AsEmOs  ·  Full-Stack AI Platform  ·  2025"
br.font.name = "Calibri"
br.font.size = Pt(12)
br.font.italic = True
br.font.color.rgb = MID_GRAY

sn = slide.shapes.add_textbox(Inches(12.5), Inches(7.1), Inches(0.6), Inches(0.3))
r = sn.text_frame.paragraphs[0].add_run()
r.text = "17 / 17"; r.font.size = Pt(10); r.font.color.rgb = MID_GRAY


# ─── SAVE ────────────────────────────────────────────────────────────────────
output_path = r"d:\BitirmeProjesi\AsEmOs_Presentation.pptx"
prs.save(output_path)
print(f"[OK] Sunum olusturuldu: {output_path}")
print(f"     Toplam slayt sayisi: {len(prs.slides)}")
