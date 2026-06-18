"""
Bitirme Projesi — PowerPoint Sunumu v3 (Güncellenmiş v2)
Tasarım: Tech / Minimal — Siyah, Beyaz, Yeşil
Görselsiz slaytlar: tam genişlik + grafik/diyagram
Görselli slaytlar: maks 1 ekran görüntüsü
VERİTABANI slaytında mini ER diyagramı
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.text import MSO_ANCHOR
import math
import os

SCREEN_DIR = "/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/sunum"

# ─── RENKLER ───────────────────────────────────────────────────────────────
BG          = RGBColor(0x07, 0x0A, 0x07)
SURFACE     = RGBColor(0x0F, 0x14, 0x0F)
SURFACE2    = RGBColor(0x14, 0x1A, 0x14)
GREEN       = RGBColor(0x00, 0xE5, 0x60)
GREEN_DIM   = RGBColor(0x00, 0x7A, 0x30)
GREEN_GLOW  = RGBColor(0x39, 0xFF, 0x8C)
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
GRAY_LIGHT  = RGBColor(0xA0, 0xAA, 0xA0)
GRAY_MID    = RGBColor(0x40, 0x4A, 0x40)
GRAY_DARK   = RGBColor(0x1A, 0x22, 0x1A)

TOTAL_SLIDES = 18

# ─── BOYUT ─────────────────────────────────────────────────────────────────
W = Inches(13.33)
H = Inches(7.5)

# Sol içerik bölgesi (görselli slaytlar için)
LX = Inches(0.55)
LW = Inches(5.8)

# Tam genişlik (görselsiz slaytlar için)
FW = Inches(12.2)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H
BLANK = prs.slide_layouts[6]

# ─── YARDIMCILAR ───────────────────────────────────────────────────────────

def new_slide():
    s = prs.slides.add_slide(BLANK)
    bg = s.shapes.add_shape(1, 0, 0, W, H)
    bg.fill.solid(); bg.fill.fore_color.rgb = BG; bg.line.fill.background()
    return s

def add_full_grid(slide):
    """Tam genişlik ince noktalı grid — görselsiz slaytlar için"""
    for i in range(16):
        x = Inches(0.55) + i * Inches(0.82)
        if x < W:
            ln = slide.shapes.add_connector(1, x, Inches(0.1), x, Inches(7.4))
            ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.15)
    for i in range(9):
        y = Inches(0.8) + i * Inches(0.74)
        ln = slide.shapes.add_connector(1, Inches(0.3), y, Inches(13.0), y)
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.15)

def add_tech_grid(slide):
    """Sağ tarafa ince noktalı grid — teknolojik hava"""
    for i in range(9):
        x = Inches(6.85) + i * Inches(0.74)
        ln = slide.shapes.add_connector(1, x, Inches(0.1), x, Inches(7.4))
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.25)
    for i in range(8):
        y = Inches(0.9) + i * Inches(0.82)
        ln = slide.shapes.add_connector(1, Inches(6.75), y, Inches(13.2), y)
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.25)
    for gx in [Inches(6.85) + i * Inches(0.74) for i in range(9)]:
        for gy in [Inches(0.9) + i * Inches(0.82) for i in range(8)]:
            dot = slide.shapes.add_shape(9, gx - Inches(0.025), gy - Inches(0.025),
                                          Inches(0.05), Inches(0.05))
            dot.fill.solid(); dot.fill.fore_color.rgb = GRAY_MID; dot.line.fill.background()

def add_left_stripe(slide):
    bar = slide.shapes.add_shape(1, Inches(0.0), Inches(0), Inches(0.04), H)
    bar.fill.solid(); bar.fill.fore_color.rgb = GREEN; bar.line.fill.background()

def add_divider_line(slide):
    ln = slide.shapes.add_connector(1, Inches(6.55), Inches(0.15), Inches(6.55), Inches(7.35))
    ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.75)
    dot = slide.shapes.add_shape(9, Inches(6.525), H/2 - Inches(0.09), Inches(0.05), Inches(0.05))
    dot.fill.solid(); dot.fill.fore_color.rgb = GREEN; dot.line.fill.background()

def t(slide, text, x, y, w, h, size=12, bold=False, color=WHITE,
      align=PP_ALIGN.LEFT, italic=False):
    tf = slide.shapes.add_textbox(x, y, w, h)
    tf.word_wrap = True
    frame = tf.text_frame
    frame.auto_size = None
    p = frame.paragraphs[0]
    p.alignment = align
    p.space_before = Pt(0); p.space_after = Pt(0)
    r = p.add_run()
    r.text = text
    r.font.size   = Pt(size)
    r.font.bold   = bold
    r.font.italic = italic
    r.font.color.rgb = color
    r.font.name = "Arial"
    return tf

def badge(slide, text, x=None):
    bx = x if x is not None else LX
    bw = Inches(min(len(text) * 0.105 + 0.28, 2.6))
    b = slide.shapes.add_shape(1, bx, Inches(0.32), bw, Inches(0.26))
    b.fill.solid(); b.fill.fore_color.rgb = GREEN_DIM; b.line.fill.background()
    t(slide, text, bx + Inches(0.1), Inches(0.33), bw - Inches(0.1), Inches(0.22),
      size=8, bold=True, color=GREEN_GLOW)

def title_block(slide, line1, line2=None, w=None):
    tw = w or LW
    ty = Inches(0.68)
    t(slide, line1, LX, ty, tw, Inches(0.6), size=28, bold=True, color=WHITE)
    if line2:
        t(slide, line2, LX, ty + Inches(0.62), tw, Inches(0.6), size=28, bold=True, color=WHITE)

def subtitle_text(slide, text, y=Inches(1.95), w=None):
    sw = w or LW
    t(slide, text, LX, y, sw, Inches(0.42), size=10.5, color=GRAY_LIGHT)

def card(slide, x, y, w, h, fill=SURFACE2):
    sh = slide.shapes.add_shape(1, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill; sh.line.fill.background()
    acc = slide.shapes.add_shape(1, x, y + Inches(0.12), Inches(0.03), h - Inches(0.24))
    acc.fill.solid(); acc.fill.fore_color.rgb = GREEN; acc.line.fill.background()
    return sh

def stat_card(slide, x, y, w, h, value, label):
    sh = slide.shapes.add_shape(1, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = SURFACE2; sh.line.fill.background()
    top = slide.shapes.add_shape(1, x, y, w, Inches(0.04))
    top.fill.solid(); top.fill.fore_color.rgb = GREEN; top.line.fill.background()
    t(slide, value, x, y + Inches(0.1), w, Inches(0.48),
      size=22, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    t(slide, label, x, y + Inches(0.52), w, Inches(0.3),
      size=8.5, color=GRAY_LIGHT, align=PP_ALIGN.CENTER)

def bullet_item(slide, x, y, w, h, no_or_icon, title, body, use_circle=True):
    card(slide, x, y, w, h)
    if use_circle:
        circ = slide.shapes.add_shape(9, x + Inches(0.1), y + h/2 - Inches(0.18),
                                       Inches(0.36), Inches(0.36))
        circ.fill.solid(); circ.fill.fore_color.rgb = GREEN_DIM; circ.line.fill.background()
        t(slide, str(no_or_icon), x + Inches(0.1), y + h/2 - Inches(0.18),
          Inches(0.36), Inches(0.36), size=11, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
        txt_x = x + Inches(0.58)
        txt_w = w - Inches(0.65)
    else:
        txt_x = x + Inches(0.12)
        txt_w = w - Inches(0.18)
    t(slide, title, txt_x, y + Inches(0.1), txt_w, Inches(0.25), size=10.5, bold=True, color=WHITE)
    t(slide, body, txt_x, y + Inches(0.35), txt_w, h - Inches(0.42), size=9, color=GRAY_LIGHT)

def tech_corner(slide):
    ln1 = slide.shapes.add_connector(1, Inches(12.8), Inches(7.1), Inches(13.2), Inches(7.1))
    ln1.line.color.rgb = GREEN; ln1.line.width = Pt(1)
    ln2 = slide.shapes.add_connector(1, Inches(12.8), Inches(7.1), Inches(12.8), Inches(6.7))
    ln2.line.color.rgb = GREEN; ln2.line.width = Pt(1)

def slide_number(slide, n, total=TOTAL_SLIDES):
    t(slide, f"{n:02d} / {total}", Inches(0.08), Inches(7.2), Inches(1.2), Inches(0.25),
      size=8, color=GRAY_MID)

def add_phone_screenshot(slide, img_filename, label=None):
    img_path = os.path.join(SCREEN_DIR, img_filename)
    if not os.path.exists(img_path):
        return
    phone_w = Inches(2.85); phone_h = Inches(6.15)
    phone_x = Inches(8.55); phone_y = Inches(0.62)

    panel = slide.shapes.add_shape(1, Inches(6.72), Inches(0), Inches(6.61), H)
    panel.fill.solid(); panel.fill.fore_color.rgb = RGBColor(0x05, 0x08, 0x05)
    panel.line.fill.background()

    for gi in range(7):
        gx = Inches(6.85) + gi * Inches(0.94)
        ln = slide.shapes.add_connector(1, gx, Inches(0.1), gx, Inches(7.4))
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.2)
    for gi in range(10):
        gy = Inches(0.5) + gi * Inches(0.72)
        ln = slide.shapes.add_connector(1, Inches(6.75), gy, Inches(13.2), gy)
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.2)

    for corner_x, corner_y in [(phone_x - Inches(0.18), phone_y - Inches(0.18)),
                                 (phone_x + phone_w + Inches(0.04), phone_y - Inches(0.18))]:
        ln1 = slide.shapes.add_connector(1, corner_x, corner_y, corner_x + Inches(0.28), corner_y)
        ln1.line.color.rgb = GREEN; ln1.line.width = Pt(1.5)
        ln2 = slide.shapes.add_connector(1, corner_x, corner_y, corner_x, corner_y + Inches(0.28))
        ln2.line.color.rgb = GREEN; ln2.line.width = Pt(1.5)
    for corner_x, corner_y in [(phone_x - Inches(0.18), phone_y + phone_h + Inches(0.04)),
                                 (phone_x + phone_w + Inches(0.04), phone_y + phone_h + Inches(0.04))]:
        ln1 = slide.shapes.add_connector(1, corner_x, corner_y, corner_x + Inches(0.28), corner_y)
        ln1.line.color.rgb = GREEN; ln1.line.width = Pt(1.5)
        ln2 = slide.shapes.add_connector(1, corner_x, corner_y, corner_x, corner_y - Inches(0.28))
        ln2.line.color.rgb = GREEN; ln2.line.width = Pt(1.5)

    frame = slide.shapes.add_shape(1,
        phone_x - Inches(0.1), phone_y - Inches(0.12),
        phone_w + Inches(0.2), phone_h + Inches(0.24))
    frame.fill.solid(); frame.fill.fore_color.rgb = RGBColor(0x10, 0x10, 0x10)
    frame.line.color.rgb = RGBColor(0x30, 0x30, 0x30)
    frame.line.width = Pt(1)

    slide.shapes.add_picture(img_path, phone_x, phone_y, phone_w, phone_h)

    if label:
        t(slide, label,
          phone_x - Inches(0.1), phone_y + phone_h + Inches(0.1),
          phone_w + Inches(0.2), Inches(0.3),
          size=9, color=GRAY_MID, align=PP_ALIGN.CENTER)

def add_pill_tags(slide, pills, start_x=None, start_y=None, max_w=None):
    px2 = start_x or LX
    py2 = start_y or Inches(2.45)
    limit = max_w or (LX + LW - Inches(0.5))
    for pill in pills:
        pw = Inches(len(pill)*0.088 + 0.2)
        sh = slide.shapes.add_shape(1, px2, py2, pw, Inches(0.26))
        sh.fill.solid(); sh.fill.fore_color.rgb = GREEN_DIM; sh.line.fill.background()
        t(slide, pill, px2 + Inches(0.07), py2 + Inches(0.05), pw - Inches(0.08), Inches(0.2),
          size=8.5, color=GREEN_GLOW)
        px2 += pw + Inches(0.08)
        if px2 > limit:
            px2 = start_x or LX; py2 += Inches(0.32)

def er_box(slide, x, y, w, h, name, fields, is_primary=False):
    """ER diyagramı entity kutusu"""
    sh = slide.shapes.add_shape(1, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor(0x0A, 0x20, 0x12) if is_primary else SURFACE2
    sh.line.color.rgb = GREEN if is_primary else GRAY_MID
    sh.line.width = Pt(1.5 if is_primary else 0.75)
    # Üst bar
    bar = slide.shapes.add_shape(1, x, y, w, Inches(0.04))
    bar.fill.solid(); bar.fill.fore_color.rgb = GREEN if is_primary else GREEN_DIM
    bar.line.fill.background()
    # Tablo adı
    t(slide, name, x, y + Inches(0.06), w, Inches(0.22),
      size=9, bold=True, color=GREEN if is_primary else WHITE, align=PP_ALIGN.CENTER)
    # Alanlar
    for i, field in enumerate(fields):
        t(slide, field, x + Inches(0.06), y + Inches(0.3) + i * Inches(0.16),
          w - Inches(0.12), Inches(0.16), size=7, color=GRAY_LIGHT)

def er_connector(slide, x1, y1, x2, y2):
    """ER diyagramı bağlantı çizgisi"""
    ln = slide.shapes.add_connector(1, x1, y1, x2, y2)
    ln.line.color.rgb = GREEN_DIM; ln.line.width = Pt(1)

def flow_box(slide, x, y, w, h, text, is_highlight=False):
    """Akış diyagramı kutusu"""
    sh = slide.shapes.add_shape(1, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = GREEN_DIM if is_highlight else SURFACE2
    sh.line.color.rgb = GREEN if is_highlight else GRAY_MID
    sh.line.width = Pt(1)
    t(slide, text, x, y, w, h, size=8.5, bold=True,
      color=WHITE, align=PP_ALIGN.CENTER)

def flow_arrow(slide, x1, y1, x2, y2):
    """Akış oku"""
    ln = slide.shapes.add_connector(1, x1, y1, x2, y2)
    ln.line.color.rgb = GREEN; ln.line.width = Pt(1.5)
    # Ok ucu simgesi (küçük üçgen/nokta)
    dot = slide.shapes.add_shape(9, x2 - Inches(0.04), y2 - Inches(0.04),
                                  Inches(0.08), Inches(0.08))
    dot.fill.solid(); dot.fill.fore_color.rgb = GREEN; dot.line.fill.background()


# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 1 — KAPAK (Tam genişlik — değişmedi)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
for i in range(4):
    sh = s.shapes.add_shape(1,
        Inches(8.5) + i * Inches(1.2), Inches(-1.5),
        Inches(0.25), Inches(5.5))
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor(0x0A, 0x28, 0x18) if i % 2 == 0 else RGBColor(0x07, 0x18, 0x0F)
    sh.line.fill.background()
    sh.rotation = -15

acc = s.shapes.add_shape(1, Inches(0.0), Inches(2.0), Inches(0.06), Inches(3.0))
acc.fill.solid(); acc.fill.fore_color.rgb = GREEN; acc.line.fill.background()

ln = s.shapes.add_connector(1, Inches(0.6), Inches(0.5), Inches(12.7), Inches(0.5))
ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.5)

t(s, "İSTANBUL SAĞLIK VE TEKNOLOJİ ÜNİVERSİTESİ",
  Inches(0.7), Inches(0.22), Inches(10), Inches(0.32),
  size=9, bold=True, color=GREEN, align=PP_ALIGN.LEFT)
t(s, "Yazılım Mühendisliği Bölümü  ·  Bitirme Projesi 2025 – 2026",
  Inches(0.7), Inches(0.52), Inches(10), Inches(0.28),
  size=9, color=GRAY_LIGHT, align=PP_ALIGN.LEFT)

ic = s.shapes.add_shape(1, Inches(0.7), Inches(1.15), Inches(0.65), Inches(0.65))
ic.fill.solid(); ic.fill.fore_color.rgb = GREEN_DIM; ic.line.fill.background()
t(s, "📍", Inches(0.7), Inches(1.13), Inches(0.65), Inches(0.65), size=22, align=PP_ALIGN.CENTER)

t(s, "Yapay Zeka Destekli", Inches(1.55), Inches(1.12), Inches(9.5), Inches(0.7),
  size=42, bold=True, color=WHITE)
t(s, "Konum Bazlı Mekan Öneri Sistemi", Inches(1.55), Inches(1.78), Inches(10), Inches(0.7),
  size=42, bold=True, color=GREEN)

ln2 = s.shapes.add_connector(1, Inches(0.7), Inches(2.62), Inches(9.5), Inches(2.62))
ln2.line.color.rgb = GREEN; ln2.line.width = Pt(1.5)

t(s, "Kişiselleştirilmiş sosyal mekan keşfi — konumunuza, zevklerinize ve çevrenize göre AI destekli öneriler.",
  Inches(0.7), Inches(2.75), Inches(9.5), Inches(0.45), size=11, color=GRAY_LIGHT)

members = [
    ("U", "Ulaş Can Demirtaş", "220609013"),
    ("Y", "Yunusemre Sevinç",  "220609007"),
    ("U", "Utku Gülrek",       "220609026"),
]
cw = Inches(3.55); ch = Inches(0.88); gap = Inches(0.28)
total_w = 3 * cw + 2 * gap
start_x = (W - total_w) / 2

for i, (initial, name, number) in enumerate(members):
    cx = start_x + i * (cw + gap); cy = Inches(3.42)
    sh = s.shapes.add_shape(1, cx, cy, cw, ch)
    sh.fill.solid(); sh.fill.fore_color.rgb = SURFACE2; sh.line.fill.background()
    top = s.shapes.add_shape(1, cx, cy, cw, Inches(0.04))
    top.fill.solid(); top.fill.fore_color.rgb = GREEN; top.line.fill.background()
    av = s.shapes.add_shape(9, cx + Inches(0.18), cy + Inches(0.22), Inches(0.46), Inches(0.46))
    av.fill.solid(); av.fill.fore_color.rgb = GREEN_DIM; av.line.fill.background()
    t(s, initial, cx + Inches(0.18), cy + Inches(0.22), Inches(0.46), Inches(0.46),
      size=16, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    t(s, name, cx + Inches(0.76), cy + Inches(0.15), cw - Inches(0.9), Inches(0.3),
      size=11, bold=True, color=WHITE)
    t(s, number, cx + Inches(0.76), cy + Inches(0.48), cw - Inches(0.9), Inches(0.25),
      size=9.5, color=GREEN, bold=True)

t(s, "GRUP ÜYELERİ", start_x, Inches(3.3), total_w, Inches(0.18),
  size=8, bold=True, color=GRAY_MID, align=PP_ALIGN.LEFT)

bot = s.shapes.add_shape(1, Inches(0), H - Inches(0.06), W, Inches(0.06))
bot.fill.solid(); bot.fill.fore_color.rgb = GREEN; bot.line.fill.background()

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 2 — UYGULAMA NEDİR  →  Giriş Ekranı (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 2)
badge(s, "● UYGULAMA")
title_block(s, "Bu uygulama", "ne yapar?")
subtitle_text(s, "Bulunduğunuz konuma ve sosyal çevrenize göre\nkişiselleştirilmiş mekan keşfi yapan AI tabanlı mobil platform.", Inches(2.0))

items = [
    ("📍", "Konum Bazlı Keşif",         "Yakın çevredeki kafeler ve restoranlar gerçek zamanlı listelenir."),
    ("🤖", "Yapay Zeka Önerileri",       "Groq LLM tabanlı motor; geçmişe ve sosyal bağlantılara göre sıralar."),
    ("👥", "Sosyal Akış",                "Fotoğraf paylaş; takip ettiklerinin deneyimlerini gör."),
    ("💬", "Gerçek Zamanlı Mesajlaşma",  "WebSocket ile anlık mesajlaşma ve hikaye paylaşımı."),
    ("⭐", "Değerlendirme & Kaydetme",   "Mekan puanlama, yorum yazma ve favorilere ekleme."),
]
iw = LW; ih = Inches(0.72); iy = Inches(2.55)
for i, (icon, tit, body) in enumerate(items):
    y = iy + i * (ih + Inches(0.08))
    card(s, LX, y, iw, ih)
    t(s, icon, LX + Inches(0.1), y + Inches(0.18), Inches(0.35), Inches(0.38), size=16)
    t(s, tit, LX + Inches(0.55), y + Inches(0.1), iw - Inches(0.62), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, LX + Inches(0.55), y + Inches(0.36), iw - Inches(0.62), Inches(0.3),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_giris.png", "Giriş Ekranı")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 3 — SEKTÖREL PROBLEM (TAM GENİŞLİK + VS GRAFİĞİ)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 3)
badge(s, "● PROBLEM")
title_block(s, "Neden bu uygulamayı", "geliştirdik?", w=FW)
subtitle_text(s, "Mevcut platformlar kullanıcı niyetini anlamıyor. Kelime tabanlı arama, anlamsal aramaya karşı yetersiz kalıyor.", Inches(2.0), w=FW)

# Sol 3 kart
prob_left = [
    ("1", "Google Maps Kısıtları",     "'Sessiz ders çalışmalık kafe' gibi vibe aramaları kelimede tıkanır."),
    ("2", "Bilgi ve Yorum Kirliliği",  "Binlerce yorum; kullanıcılar okumaktan yorulur, özetlenmiş veri yok."),
    ("3", "Semantik Çelişkiler",       "'Kahvaltı' sunan meyhane, kahvaltı aramasında üst sırada çıkabilir."),
]
cw3 = Inches(5.8)
for i, (no, tit, body) in enumerate(prob_left):
    bullet_item(s, LX, Inches(2.55) + i * Inches(0.8), cw3, Inches(0.72), no, tit, body)

# Sağ 2 kart
prob_right = [
    ("4", "Kişiselleştirme Eksikliği", "Herkese aynı sonuç; geçmiş tercihler ve sosyal bağlam hesaba katılmaz."),
    ("5", "Tümleşik Deneyim Yok",      "Keşif, paylaşım, mesajlaşma ve yorum farklı uygulamalara dağılmış."),
]
rx = Inches(6.6)
for i, (no, tit, body) in enumerate(prob_right):
    bullet_item(s, rx, Inches(2.55) + i * Inches(0.8), cw3, Inches(0.72), no, tit, body)

# VS karşılaştırma kutusu (sağ alt)
vs_x = Inches(6.6); vs_y = Inches(4.55)
# Kelime arama kutusu
sh = s.shapes.add_shape(1, vs_x, vs_y, Inches(2.6), Inches(2.4))
sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x28, 0x0A, 0x0A); sh.line.color.rgb = RGBColor(0xF8, 0x71, 0x71); sh.line.width = Pt(1)
t(s, "❌ Kelime Tabanlı Arama", vs_x, vs_y + Inches(0.1), Inches(2.6), Inches(0.28),
  size=10, bold=True, color=RGBColor(0xF8, 0x71, 0x71), align=PP_ALIGN.CENTER)
t(s, "• Katı etiket eşleşmesi\n• Niyeti anlayamaz\n• Bağlam görmezden gelinir\n• Herkese aynı sonuç",
  vs_x + Inches(0.15), vs_y + Inches(0.45), Inches(2.3), Inches(1.8), size=9, color=GRAY_LIGHT)

# VS
vs_circle = s.shapes.add_shape(9, vs_x + Inches(2.7), vs_y + Inches(0.85), Inches(0.5), Inches(0.5))
vs_circle.fill.solid(); vs_circle.fill.fore_color.rgb = BG
vs_circle.line.color.rgb = GREEN; vs_circle.line.width = Pt(2)
t(s, "VS", vs_x + Inches(2.7), vs_y + Inches(0.85), Inches(0.5), Inches(0.5),
  size=11, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# Anlamsal arama kutusu
sh2 = s.shapes.add_shape(1, vs_x + Inches(3.3), vs_y, Inches(2.6), Inches(2.4))
sh2.fill.solid(); sh2.fill.fore_color.rgb = RGBColor(0x08, 0x22, 0x10); sh2.line.color.rgb = GREEN; sh2.line.width = Pt(1)
t(s, "✅ Anlamsal Arama (Biz)", vs_x + Inches(3.3), vs_y + Inches(0.1), Inches(2.6), Inches(0.28),
  size=10, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
t(s, "• Vektör benzerliği (Qdrant)\n• Niyet sınıflandırma (Groq)\n• Bağlam farkındalığı\n• Kişisel sıralama",
  vs_x + Inches(3.45), vs_y + Inches(0.45), Inches(2.3), Inches(1.8), size=9, color=GRAY_LIGHT)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 4 — PAZAR ANALİZİ (TAM GENİŞLİK)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 4)
badge(s, "● PAZAR ANALİZİ")
title_block(s, "Piyasada nerede", "duruyoruz?", w=FW)
subtitle_text(s, "Küresel lokasyon tabanlı uygulama pazarı büyüyor. Türkiye'de bu alanda özgün bir AI ürünü bulunmuyor.", Inches(2.0), w=FW)

# Geniş stat kartları — 5 adet
sw = Inches(2.35); sh2 = Inches(0.85); sg = Inches(0.1)
stats = [("52B $", "Küresel Pazar"), ("% 18", "Yıllık Büyüme"), ("85M+", "TR Kullanıcı"),
         ("0", "Yerli AI Rakip"), ("5+", "Global Rakip")]
for i, (v, l) in enumerate(stats):
    stat_card(s, LX + i*(sw+sg), Inches(2.55), sw, sh2, v, l)

# Geniş bar chart
t(s, "PAZAR KAPSAMI  /  RAKİPLER VE BİZİM KONUMUMUZ", LX, Inches(3.55), FW, Inches(0.22),
  size=8, bold=True, color=GRAY_MID)

bars = [
    ("Foursquare",  72, GREEN_DIM,  "Konum check-in odaklı, AI yok"),
    ("Google Maps", 58, GRAY_DARK,  "Kelime tabanlı arama, kişiselleştirme yok"),
    ("Yelp",        35, GRAY_DARK,  "TR'de yetersiz, sosyal özellik az"),
    ("Bizim App",   95, GREEN,      "AI + Sosyal + Harita + Mesajlaşma"),
]
btrack_w = Inches(6.5); label_w = Inches(1.2); desc_w = Inches(4.0)
for i, (label, pct, col, desc) in enumerate(bars):
    ry = Inches(3.85) + i * Inches(0.72)
    lc = GREEN_GLOW if label == "Bizim App" else GRAY_LIGHT
    t(s, label, LX, ry + Inches(0.15), label_w, Inches(0.28), size=10, color=lc, bold=(label=="Bizim App"))
    # track bg
    tr = s.shapes.add_shape(1, LX + label_w + Inches(0.1), ry + Inches(0.15), btrack_w, Inches(0.28))
    tr.fill.solid(); tr.fill.fore_color.rgb = GRAY_DARK; tr.line.fill.background()
    # fill
    fw_bar = btrack_w * pct / 100
    fl = s.shapes.add_shape(1, LX + label_w + Inches(0.1), ry + Inches(0.15), fw_bar, Inches(0.28))
    fl.fill.solid(); fl.fill.fore_color.rgb = col; fl.line.fill.background()
    # pct
    t(s, f"%{pct}", LX + label_w + btrack_w + Inches(0.18), ry + Inches(0.15),
      Inches(0.5), Inches(0.28), size=10, color=lc, bold=(label=="Bizim App"))
    # desc
    t(s, desc, LX + label_w + btrack_w + Inches(0.72), ry + Inches(0.15),
      desc_w, Inches(0.28), size=9, color=GRAY_MID, italic=True)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 5 — PAZAR BOŞLUĞU (TAM GENİŞLİK — 2 SÜTUN)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 5)
badge(s, "● FIRSATLAR")
title_block(s, "Mevcut uygulamalarda", "neler eksik?", w=FW)
subtitle_text(s, "Rakipler bu 5 kritik sorunu hâlâ çözemiyor. Biz bu boşlukları doldurmak için AsEmOs'u geliştirdik.", Inches(2.0), w=FW)

gaps = [
    ("1", "Kişiselleştirme Yok",          "Google Maps ve Foursquare herkese aynı listeyi gösterir. Kullanıcı zevkleri hiç hesaba katılmaz."),
    ("2", "Sosyal Bağlam Eksik",           "Arkadaşların beğendiği mekanlar diğer platformlarda öne çıkarılmıyor."),
    ("3", "Türkçe / Yerel İçerik",         "Yelp ve Foursquare Türkiye'de yetersiz. Yerele özgü AI öneri yok."),
    ("4", "AI Destekli Öneri Motoru Yok",  "Kural tabanlı sıralama kullanılıyor; LLM destekli anlamsal öneri yok."),
    ("5", "Tümleşik Deneyim Eksikliği",    "Keşif + paylaşım + mesajlaşma + yorum farklı uygulamalara dağılmış."),
]
col_w = Inches(5.9)
for i, (no, tit, body) in enumerate(gaps):
    col = 0 if i < 3 else 1
    row = i if i < 3 else (i - 3)
    gx = LX + col * (col_w + Inches(0.2))
    gy = Inches(2.55) + row * (Inches(0.88) + Inches(0.1))
    bullet_item(s, gx, gy, col_w, Inches(0.88), no, tit, body, use_circle=True)

# Sağ alt — çözüm önerisi kutusu
sol_box = s.shapes.add_shape(1, LX + col_w + Inches(0.2), Inches(4.45), col_w, Inches(2.5))
sol_box.fill.solid(); sol_box.fill.fore_color.rgb = RGBColor(0x08, 0x22, 0x10)
sol_box.line.color.rgb = GREEN; sol_box.line.width = Pt(1)
t(s, "💡 AsEmOs Çözümü", LX + col_w + Inches(0.2), Inches(4.55), col_w, Inches(0.3),
  size=12, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
t(s, "• Groq LLM ile kişisel öneri\n• Qdrant ile anlamsal arama\n• Sosyal akış + mesajlaşma + hikaye\n• Türkçe odaklı, yerel veri\n• Tek platformda tümleşik deneyim",
  LX + col_w + Inches(0.4), Inches(4.95), col_w - Inches(0.4), Inches(1.8), size=10, color=WHITE)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 6 — RAKİP KARŞILAŞTIRMA (TAM GENİŞLİK TABLO)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 6)
badge(s, "● KONUMLANDIRMA")
title_block(s, "Rakiplerden nasıl", "ayrışıyoruz?", w=FW)
subtitle_text(s, "Özellik bazlı karşılaştırma tablosu — rakiplere kıyasla tam fark.", Inches(2.0), w=FW)

headers = ["Özellik", "AsEmOs", "Google Maps", "Foursquare", "Yelp"]
col_ws  = [Inches(3.5), Inches(2.0), Inches(2.2), Inches(2.2), Inches(2.0)]
rows = [
    ["AI Öneri Motoru (Groq LLM)",   "✓","~","✗","✗"],
    ["Anlamsal Arama (Qdrant)",      "✓","✗","✗","✗"],
    ["Sosyal Akış & Story",          "✓","✗","~","✗"],
    ["Gerçek Zamanlı Mesajlaşma",    "✓","✗","✗","✗"],
    ["Kişisel Sıralama (Reranking)", "✓","✗","✗","✗"],
    ["Türkçe / Yerel Odak",         "✓","~","✗","✗"],
    ["Fotoğraf Düzenleme",          "✓","✗","✗","✗"],
    ["Asenkron Moderasyon",         "✓","~","✗","✗"],
    ["Redis Cache Altyapısı",       "✓","✓","✗","✗"],
]
tx = LX; ty = Inches(2.35); row_h = Inches(0.42); header_h = Inches(0.36)

hx = tx
for j, (hdr, cw2) in enumerate(zip(headers, col_ws)):
    bg_col = GREEN_DIM if j == 0 else (RGBColor(0x00,0x3A,0x18) if j == 1 else GRAY_DARK)
    sh = s.shapes.add_shape(1, hx, ty, cw2, header_h)
    sh.fill.solid(); sh.fill.fore_color.rgb = bg_col; sh.line.fill.background()
    al = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
    fc = WHITE if j <= 1 else GRAY_LIGHT
    t(s, hdr, hx + Inches(0.08), ty + Inches(0.06), cw2 - Inches(0.1), header_h - Inches(0.1),
      size=10, bold=True, color=fc, align=al)
    hx += cw2

for i, row in enumerate(rows):
    ry = ty + header_h + i * row_h
    rx = tx
    for j, (cell, cw2) in enumerate(zip(row, col_ws)):
        bg2 = SURFACE if i%2==0 else SURFACE2
        if j == 1: bg2 = RGBColor(0x08, 0x18, 0x0E)
        sh = s.shapes.add_shape(1, rx, ry, cw2, row_h)
        sh.fill.solid(); sh.fill.fore_color.rgb = bg2; sh.line.fill.background()
        if j == 0:
            fc = GRAY_LIGHT; sz = 9.5; al = PP_ALIGN.LEFT
        elif cell == "✓":
            fc = GREEN; sz = 15; al = PP_ALIGN.CENTER
        elif cell == "~":
            fc = RGBColor(0xFC,0xD3,0x4D); sz = 15; al = PP_ALIGN.CENTER
        else:
            fc = RGBColor(0xF8,0x71,0x71); sz = 15; al = PP_ALIGN.CENTER
        t(s, cell, rx + Inches(0.08), ry + Inches(0.06), cw2 - Inches(0.1), row_h - Inches(0.1),
          size=sz, bold=(j>0), color=fc, align=al)
        rx += cw2

t(s, "✓ Tam Destek    ~  Kısmi Destek    ✗ Yok",
  tx, ty + header_h + len(rows)*row_h + Inches(0.12), FW, Inches(0.22),
  size=9, color=GRAY_MID)

# Skor kartları (alt)
score_y = ty + header_h + len(rows)*row_h + Inches(0.5)
scores = [("9/9", "AsEmOs"), ("3/9", "Google Maps"), ("1/9", "Foursquare"), ("0/9", "Yelp")]
sw_sc = Inches(2.8); sg_sc = Inches(0.2)
for i, (v, l) in enumerate(scores):
    sx = LX + i * (sw_sc + sg_sc)
    sh = s.shapes.add_shape(1, sx, score_y, sw_sc, Inches(0.55))
    sh.fill.solid(); sh.fill.fore_color.rgb = SURFACE2 if i > 0 else RGBColor(0x08,0x22,0x10)
    sh.line.fill.background()
    clr = GREEN if i == 0 else GRAY_LIGHT
    t(s, v, sx, score_y + Inches(0.05), Inches(0.8), Inches(0.45),
      size=18, bold=True, color=clr, align=PP_ALIGN.CENTER)
    t(s, l, sx + Inches(0.8), score_y + Inches(0.1), sw_sc - Inches(0.9), Inches(0.35),
      size=10, color=clr)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 7 — MİMARİ  →  Harita/Keşfet Ekranı (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 7)
badge(s, "● SİSTEM MİMARİSİ")
title_block(s, "Uçtan uca sistem", "mimarimiz")
subtitle_text(s, "Ölçeklenebilir, modüler ve bulut-native yapı.\nGroq, Qdrant ve Redis entegrasyonuyla yüksek performans.", Inches(2.0))

arch = [
    ("📱", "Mobil — React Native",    "Expo SDK 52, TypeScript, Zustand, Leaflet JS WebView"),
    ("⚙️", "Backend — FastAPI",       "Python 3.12, async I/O, SQLAlchemy, Background Tasks"),
    ("🤖", "AI — Groq & Qdrant",      "Groq Llama 3.1, Qdrant vektör DB, RAG pipeline, reranking"),
    ("☁️", "Bulut — Render / AWS",    "Docker, S3, Managed PostgreSQL, CI/CD"),
    ("🗄️", "Önbellek — Redis",        "Embedding cache, feed cache, akıllı cache invalidation"),
    ("🔐", "Güvenlik",                "JWT, bcrypt, rate limiting, Pydantic validation"),
]
aw = Inches(2.72); ah = Inches(0.95); agap = Inches(0.1)
for i, (icon, tit, body) in enumerate(arch):
    col = i % 2; row = i // 2
    ax = LX + col * (aw + agap)
    ay = Inches(2.55) + row * (ah + agap)
    card(s, ax, ay, aw, ah)
    t(s, icon, ax + Inches(0.1), ay + Inches(0.1), Inches(0.38), Inches(0.38), size=16)
    t(s, tit, ax + Inches(0.56), ay + Inches(0.1), aw - Inches(0.64), Inches(0.28),
      size=10, bold=True, color=WHITE)
    t(s, body, ax + Inches(0.56), ay + Inches(0.38), aw - Inches(0.64), Inches(0.5),
      size=8.5, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_harita.png", "Keşfet — Harita")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 8 — FRONTEND  →  Ana Sayfa Ekranı (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 8)
badge(s, "● FRONTEND")
title_block(s, "Mobil uygulama", "nasıl inşa edildi?")
subtitle_text(s, "React Native + Expo ile iOS ve Android\ntek kod tabanından.", Inches(2.0))

add_pill_tags(s, ["React Native", "Expo SDK 52", "TypeScript", "Zustand", "Reanimated 3", "Expo Router", "Leaflet JS"])

fe_items = [
    ("🗂", "Dosya Tabanlı Navigasyon",   "Expo Router v3 ile stack, tab ve modal navigasyon."),
    ("🎞", "Gelişmiş Animasyonlar",       "Reanimated 3 + Gesture Handler ile akıcı geçişler."),
    ("🗺", "Leaflet JS Harita",           "WebView ile OpenStreetMap; dark mode tile ve marker drift çözümü."),
    ("🖼", "İçerik Oluşturma Akışı",      "Seç → Kırp → Filtre → Paylaş; tahribatsız düzenleme."),
]
fih = Inches(0.82); fiy = Inches(3.2)
for i, (icon, tit, body) in enumerate(fe_items):
    col = i % 2; row = i // 2
    fx = LX + col * (Inches(2.77) + Inches(0.1))
    fy = fiy + row * (fih + Inches(0.1))
    card(s, fx, fy, Inches(2.77), fih)
    t(s, icon, fx + Inches(0.1), fy + Inches(0.1), Inches(0.35), Inches(0.35), size=15)
    t(s, tit, fx + Inches(0.54), fy + Inches(0.1), Inches(2.1), Inches(0.26),
      size=10, bold=True, color=WHITE)
    t(s, body, fx + Inches(0.54), fy + Inches(0.36), Inches(2.1), Inches(0.4),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_anasayfa.png", "Ana Sayfa")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 9 — BACKEND (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 9)
badge(s, "● BACKEND")
title_block(s, "Sunucu tarafı", "nasıl çalışıyor?")
subtitle_text(s, "FastAPI ile yüksek performanslı, async REST API.\nRedis cache ve Background Tasks entegrasyonu.", Inches(2.0))

add_pill_tags(s, ["FastAPI", "Python 3.12", "SQLAlchemy", "PostgreSQL", "WebSocket", "JWT Auth", "Redis"])

be_items = [
    ("🔀", "Modüler Router Yapısı",   "Her domain ayrı router: auth, users, places, feed, stories, messages…"),
    ("⚡", "Async I/O & Redis Cache",  "async/await + Redis embedding/feed cache ile yüksek performans."),
    ("🔐", "Güvenlik & Validation",    "JWT + bcrypt, Pydantic şema doğrulama, SQLAlchemy ORM (SQL injection koruması)."),
    ("📡", "WebSocket & Background",   "Anlık mesajlaşma; Background Tasks ile asenkron içerik moderasyonu."),
]
for i, (icon, tit, body) in enumerate(be_items):
    col = i % 2; row = i // 2
    bx2 = LX + col * (Inches(2.77) + Inches(0.1))
    by2 = Inches(3.2) + row * (Inches(0.82) + Inches(0.1))
    card(s, bx2, by2, Inches(2.77), Inches(0.82))
    t(s, icon, bx2 + Inches(0.1), by2 + Inches(0.1), Inches(0.35), Inches(0.35), size=15)
    t(s, tit, bx2 + Inches(0.54), by2 + Inches(0.1), Inches(2.1), Inches(0.26),
      size=10, bold=True, color=WHITE)
    t(s, body, bx2 + Inches(0.54), by2 + Inches(0.36), Inches(2.1), Inches(0.4),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_kayit.png", "Kayıt Ekranı")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 10 — ANLAMSAL ARAMA (TAM GENİŞLİK + AKIŞ DİYAGRAMI)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 10)
badge(s, "● ANLAMSAL ARAMA")
title_block(s, "Vektör DB ve", "Anlamsal Arama Motoru", w=FW)
subtitle_text(s, "SentenceTransformers ile mekan açıklamaları vektörleştirilir; Qdrant DB üzerinden anlamsal eşleşme yapılır.", Inches(2.0), w=FW)

add_pill_tags(s, ["SentenceTransformers", "Qdrant", "PyTorch", "Cosine Similarity", "Groq LLM"],
              max_w=Inches(12.5))

# Sol taraf: 4 adım kartı
search_items = [
    ("1", "Vektörleştirme",                "SentenceTransformers modeli ile mekan açıklamaları çok boyutlu vektörlere dönüştürülür."),
    ("2", "Vektör Veritabanı (Qdrant)",    "Vektörler Qdrant DB'ye yazılır. Arama anında kosinüs benzerliği hesaplanır."),
    ("3", "Eşik Filtresi (> 0.40)",        "Deneysel F1-Score optimizasyonuyla belirlenen eşik. Precision/Recall dengesi."),
    ("4", "Niyet Sınıflandırıcı",          "Groq LLM ile arama niyeti tespiti. Alakasız sorgulara rehberlik yanıtı üretilir."),
]
for i, (no, tit, body) in enumerate(search_items):
    y = Inches(3.0) + i * (Inches(0.82) + Inches(0.08))
    bullet_item(s, LX, y, Inches(5.5), Inches(0.82), no, tit, body, use_circle=True)

# Sağ taraf: Akış pipeline diyagramı
t(s, "ARAMA PIPELINE", Inches(6.5), Inches(2.85), Inches(6), Inches(0.25),
  size=9, bold=True, color=GRAY_MID)

pipeline_steps = [
    ("Kullanıcı\nSorgusu", False),
    ("Niyet\nSınıflandırma", True),
    ("Embedding\n(Vektörleştirme)", True),
    ("Qdrant\nVektör Arama", True),
    ("Eşik Filtresi\n(> 0.40)", False),
    ("Sonuç\nListesi", True),
]
fbw = Inches(1.6); fbh = Inches(0.65); fby_start = Inches(3.2)
for i, (step_text, is_hl) in enumerate(pipeline_steps):
    col = i % 2
    row = i // 2
    fbx = Inches(6.5) + col * (fbw + Inches(0.5))
    fby = fby_start + row * (fbh + Inches(0.5))
    flow_box(s, fbx, fby, fbw, fbh, step_text, is_highlight=is_hl)

    # Ok çizgileri
    if i < len(pipeline_steps) - 1:
        if col == 0:  # sağa ok
            flow_arrow(s, fbx + fbw, fby + fbh/2, fbx + fbw + Inches(0.5), fby + fbh/2)
        else:  # aşağı ok (sağdan sola, alta)
            flow_arrow(s, fbx + fbw/2, fby + fbh, fbx + fbw/2, fby + fbh + Inches(0.15))
            if i < len(pipeline_steps) - 1:
                next_col = (i+1) % 2
                if next_col == 0:
                    flow_arrow(s, fbx + fbw/2, fby + fbh + Inches(0.15),
                               Inches(6.5) + fbw/2, fby + fbh + Inches(0.15))

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 11 — YAPAY ZEKA / LLM  →  Akış Ekranı (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 11)
badge(s, "● YAPAY ZEKA")
title_block(s, "Groq LLM Destekli", "Öneri ve Reranking")
subtitle_text(s, "Groq Cloud API (Llama 3.1) ile 3 aşamalı reranking;\nkullanıcı bağlamına göre kişisel mekan önerileri üretilir.", Inches(2.0))

ai_items = [
    ("🧮", "Aşama 1: Kaba Sıralama",    "Qdrant ve DB sorgusuyla mesafe, kategori ve anlamsal skoru yüksek ilk 15 aday çekilir."),
    ("🎯", "Aşama 2: Groq Reranking",    "15 adayın özellikleri ve kullanıcı tercihleri Groq Llama 3.1 modeline gönderilir."),
    ("💬", "Aşama 3: Doğal Dil Üretimi", "En uygun 5 mekan belirlenir; Türkçe gerekçeli açıklamalar JSON formatında döner."),
    ("⚠️", "Anomali Çözümü",             "Gündüz/gece kategori cezalandırma: 'kahvaltı' aramasında meyhane sonuçları -5.0 ceza alır."),
    ("🔄", "Fallback Mekanizması",        "Groq API kesilirse kural tabanlı kaba sıralama otomatik devreye girer."),
]
for i, (icon, tit, body) in enumerate(ai_items):
    y = Inches(2.55) + i * (Inches(0.72) + Inches(0.08))
    card(s, LX, y, LW, Inches(0.72))
    t(s, icon, LX + Inches(0.1), y + Inches(0.18), Inches(0.35), Inches(0.38), size=16)
    t(s, tit, LX + Inches(0.55), y + Inches(0.1), LW - Inches(0.62), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, LX + Inches(0.55), y + Inches(0.36), LW - Inches(0.62), Inches(0.3),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_akis.png", "Akış Ekranı")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 12 — MODERASYON & GÜVENLİK (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 12)
badge(s, "● MODERASYON & GÜVENLİK")
title_block(s, "Asenkron moderasyon", "ve güvenlik katmanı")
subtitle_text(s, "Background Tasks ile içerik denetimi;\nPydantic ve SQLAlchemy ile güvenlik altyapısı.", Inches(2.0))

mod_items = [
    ("🛡️", "Asenkron İçerik Denetimi",     "Gönderi eklendiğinde işlem anında tamamlanır; moderasyon Background Tasks ile yürütülür."),
    ("🤖", "Groq Llama 3.1 Moderasyon",    "Metinler argo, şiddet, nefret söylemi ve yasadışı içerik yönünden analiz edilir."),
    ("🚫", "Otomatik Engelleme",            "Uygunsuz içerikler 'rejected' yapılarak yayından gizlenir; Redis cache anında invalidate edilir."),
    ("✅", "Pydantic Veri Doğrulama",       "Tüm API isteklerinin formatı, sınırları ve tipleri kontrol edilir (HTTP 422)."),
    ("🔒", "SQL Injection Koruması",        "Tüm DB işlemleri SQLAlchemy ORM parametrik sorgu motoru ile sanitize edilir."),
]
for i, (icon, tit, body) in enumerate(mod_items):
    y = Inches(2.55) + i * (Inches(0.72) + Inches(0.08))
    card(s, LX, y, LW, Inches(0.72))
    t(s, icon, LX + Inches(0.1), y + Inches(0.18), Inches(0.35), Inches(0.38), size=16)
    t(s, tit, LX + Inches(0.55), y + Inches(0.1), LW - Inches(0.62), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, LX + Inches(0.55), y + Inches(0.36), LW - Inches(0.62), Inches(0.3),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_yeni_gonderi.png", "Yeni Gönderi Paylaşım Ekranı")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 13 — BULUT (TEK GÖRSEL — eskiden 2 görsel vardı)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 13)
badge(s, "● BULUT ALTYAPISI")
title_block(s, "Nasıl deploy ettik?")
subtitle_text(s, "Yönetilen bulut servisleriyle düşük maliyetli,\nölçeklenebilir altyapı. Redis ve RAM optimizasyonları.", Inches(1.65))

cloud_items = [
    ("🚀", "Render.com",             "FastAPI Docker konteyneri; otomatik deploy, SSL, özel domain."),
    ("🗄", "AWS S3 & CDN",           "Fotoğraf ve videolar CloudFront CDN önbellekli S3'te."),
    ("🐘", "Managed PostgreSQL",     "Render PostgreSQL; otomatik yedekleme ve bağlantı havuzu."),
    ("⚡", "Redis / Valkey Cache",   "Embedding cache (30 gün) + feed cache. Cache invalidation ile veri tutarlılığı."),
    ("🧠", "RAM Optimizasyonu",      "Model singleton, PyTorch thread sınırlandırma, worker=1 ile 500 MB RAM."),
]
for i, (icon, tit, body) in enumerate(cloud_items):
    y = Inches(2.3) + i * (Inches(0.78) + Inches(0.08))
    card(s, LX, y, LW, Inches(0.78))
    t(s, icon, LX + Inches(0.1), y + Inches(0.2), Inches(0.35), Inches(0.38), size=16)
    t(s, tit, LX + Inches(0.55), y + Inches(0.1), LW - Inches(0.62), Inches(0.26),
      size=10.5, bold=True, color=GREEN)
    t(s, body, LX + Inches(0.55), y + Inches(0.36), LW - Inches(0.62), Inches(0.35),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_isletme_paneli.png", "İşletme Paneli")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 14 — VERİTABANI + ER DİYAGRAMI (GÖRSEL YERİNE ER)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 14)
badge(s, "● VERİTABANI")
title_block(s, "Verilerimiz nasıl", "toplandı?")
subtitle_text(s, "PostgreSQL tabanlı ilişkisel şema;\ngerçek mekan verileriyle dolduruldu.", Inches(2.0))

# Stat kartları
sw2 = Inches(1.33); sh3 = Inches(0.82); sg3 = Inches(0.1)
stats3 = [("500+", "Mekan"), ("2.000+", "Yorum"), ("15+", "Tablo"), ("İST", "Odak")]
for i, (v, l) in enumerate(stats3):
    stat_card(s, LX + i*(sw2+sg3), Inches(2.48), sw2, sh3, v, l)

# Timeline
steps = [
    ("1", "Google Places API",         "İstanbul mekanları; kategori, konum, puan, fotoğraf."),
    ("2", "Temizleme & Zenginleştirme", "Eksikler tamamlandı, tekrarlar silindi."),
    ("3", "Şema Tasarımı",             "Kullanıcı → Post → Mekan → Yorum normalize edildi."),
    ("4", "Seed & Test Verisi",        "Gerçekçi yorumlar, puanlar ve gönderi verisi."),
]
for i, (no, tit, body) in enumerate(steps):
    ry = Inches(3.52) + i * Inches(0.82)
    nc = s.shapes.add_shape(9, LX, ry + Inches(0.1), Inches(0.34), Inches(0.34))
    nc.fill.solid(); nc.fill.fore_color.rgb = GREEN_DIM; nc.line.fill.background()
    t(s, no, LX, ry + Inches(0.1), Inches(0.34), Inches(0.34),
      size=11, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    if i < len(steps)-1:
        ln = s.shapes.add_connector(1, LX + Inches(0.17), ry + Inches(0.44),
                                     LX + Inches(0.17), ry + Inches(0.44) + Inches(0.38))
        ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.75)
    t(s, tit, LX + Inches(0.45), ry + Inches(0.08), LW - Inches(0.5), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, LX + Inches(0.45), ry + Inches(0.34), LW - Inches(0.5), Inches(0.35),
      size=9, color=GRAY_LIGHT)

# ─── SAĞ TARAF: ER DİYAGRAMI ───────────────────────────────────────────
# Koyu arka plan panel
panel = s.shapes.add_shape(1, Inches(6.72), Inches(0), Inches(6.61), H)
panel.fill.solid(); panel.fill.fore_color.rgb = RGBColor(0x05, 0x08, 0x05)
panel.line.fill.background()

# Hafif grid
for gi in range(7):
    gx = Inches(6.85) + gi * Inches(0.94)
    ln = s.shapes.add_connector(1, gx, Inches(0.1), gx, Inches(7.4))
    ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.15)
for gi in range(10):
    gy = Inches(0.5) + gi * Inches(0.72)
    ln = s.shapes.add_connector(1, Inches(6.75), gy, Inches(13.2), gy)
    ln.line.color.rgb = GRAY_MID; ln.line.width = Pt(0.15)

t(s, "ER DİYAGRAMI  ·  İLİŞKİSEL ŞEMA", Inches(7.2), Inches(0.25), Inches(5.5), Inches(0.25),
  size=9, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# Entity kutuları
ebw = Inches(1.55); ebh_sm = Inches(0.85); ebh_lg = Inches(1.25)

# users (merkez üst — ana varlık)
er_box(s, Inches(9.2), Inches(0.65), Inches(1.8), Inches(1.35),
       "users", ["id (PK)", "email, password", "username, bio", "avatar_url", "token_version"], is_primary=True)

# places (sol)
er_box(s, Inches(7.1), Inches(2.5), ebw, Inches(1.15),
       "places", ["id (PK)", "name, category", "lat, lng", "rating, photo_url"])

# posts (orta sol)
er_box(s, Inches(9.0), Inches(2.5), ebw, Inches(1.0),
       "posts", ["id (PK)", "user_id (FK)", "place_id (FK)", "image_url, caption"])

# reviews (sol alt)
er_box(s, Inches(7.1), Inches(4.15), ebw, Inches(0.85),
       "reviews", ["id (PK)", "user_id (FK)", "place_id (FK)", "rating, text"])

# stories (sağ üst)
er_box(s, Inches(11.3), Inches(0.65), ebw, Inches(0.85),
       "stories", ["id (PK)", "user_id (FK)", "media_url", "expires_at"])

# conversations (sağ)
er_box(s, Inches(10.9), Inches(2.5), Inches(1.7), Inches(0.85),
       "conversations", ["id (PK)", "user1_id (FK)", "user2_id (FK)"])

# messages (sağ alt)
er_box(s, Inches(10.9), Inches(3.85), Inches(1.7), Inches(0.85),
       "messages", ["id (PK)", "conv_id (FK)", "sender_id (FK)", "content"])

# follows (alt orta)
er_box(s, Inches(9.0), Inches(4.15), ebw, Inches(0.85),
       "follows", ["follower_id (FK)", "following_id (FK)", "created_at"])

# saved_places (alt sağ)
er_box(s, Inches(7.1), Inches(5.5), ebw, Inches(0.85),
       "saved_places", ["user_id (FK)", "place_id (FK)", "saved_at"])

# place_interactions (alt orta)
er_box(s, Inches(9.0), Inches(5.5), ebw, Inches(0.85),
       "place_interact.", ["user_id (FK)", "place_id (FK)", "score"])

# ─── Bağlantı çizgileri ───
# users → posts
er_connector(s, Inches(9.2 + 0.9), Inches(0.65 + 1.35), Inches(9.0 + 0.78), Inches(2.5))
# users → stories
er_connector(s, Inches(9.2 + 1.8), Inches(0.65 + 0.6), Inches(11.3), Inches(0.65 + 0.4))
# users → conversations
er_connector(s, Inches(9.2 + 1.8), Inches(0.65 + 1.0), Inches(10.9), Inches(2.5 + 0.4))
# users → follows
er_connector(s, Inches(9.2 + 0.5), Inches(0.65 + 1.35), Inches(9.0 + 0.78), Inches(4.15))
# posts → places
er_connector(s, Inches(9.0), Inches(2.5 + 0.5), Inches(7.1 + 1.55), Inches(2.5 + 0.5))
# places → reviews
er_connector(s, Inches(7.1 + 0.78), Inches(2.5 + 1.15), Inches(7.1 + 0.78), Inches(4.15))
# conversations → messages
er_connector(s, Inches(10.9 + 0.85), Inches(2.5 + 0.85), Inches(10.9 + 0.85), Inches(3.85))
# places → saved_places
er_connector(s, Inches(7.1 + 0.78), Inches(4.15 + 0.85), Inches(7.1 + 0.78), Inches(5.5))
# places → place_interactions
er_connector(s, Inches(7.1 + 1.55), Inches(5.5 + 0.42), Inches(9.0), Inches(5.5 + 0.42))

# Legend
t(s, "── 1:N İlişki     ■ PK: Primary Key     ■ FK: Foreign Key",
  Inches(7.0), Inches(6.7), Inches(5.8), Inches(0.25),
  size=8, color=GRAY_MID, align=PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 15 — HARİTA (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 15)
badge(s, "● HARİTA")
title_block(s, "Mobil Harita ve", "WebView Entegrasyonu")
subtitle_text(s, "Leaflet JS ve OpenStreetMap ile lisans maliyetleri sıfıra\nindirildi. WebView sarmalama ile native hissiyat sağlandı.", Inches(2.0))

add_pill_tags(s, ["Leaflet JS", "OpenStreetMap", "WebView", "Dark Mode Tile", "Custom Markers"])

map_items = [
    ("🗺", "Leaflet JS + OpenStreetMap",  "WebView sarmalama ile Leaflet JS kullanıldı; lisans maliyetleri sıfırlandı."),
    ("🌙", "Gelişmiş Dark Mode",          "dark_all harita tile'ı ile gece modunda sokak isimleri ve etiketler net görünür."),
    ("📌", "Marker Drift Çözümü",         "Leaflet divIcon wrapper class boş bırakılıp alt div ile konumlandırma yapılarak çözüldü."),
    ("🔍", "Dinamik Etiketler",           "Harita pin isimleri sadece zoom >= 14 olduğunda görünür; görsel karmaşa önlendi."),
]
for i, (icon, tit, body) in enumerate(map_items):
    y = Inches(3.15) + i * (Inches(0.82) + Inches(0.1))
    card(s, LX, y, LW, Inches(0.82))
    t(s, icon, LX + Inches(0.1), y + Inches(0.1), Inches(0.35), Inches(0.35), size=15)
    t(s, tit, LX + Inches(0.54), y + Inches(0.1), LW - Inches(0.62), Inches(0.26),
      size=10, bold=True, color=WHITE)
    t(s, body, LX + Inches(0.54), y + Inches(0.36), LW - Inches(0.62), Inches(0.4),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_harita.png", "Keşfet — Harita Görünümü")

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 16 — TESTLER (TAM GENİŞLİK — 3 SÜTUN)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 16)
badge(s, "● TEST SÜRECİ")
title_block(s, "Projeyi nasıl", "test ettik?", w=FW)
subtitle_text(s, "Manuel ve otomatik testlerle kritik akışlar doğrulandı. 200+ Postman senaryosu, 100 gerçekçi AI sorgusu.", Inches(2.0), w=FW)

tests = [
    (True,  "API Entegrasyon",          "Postman koleksiyonuyla 200+ senaryo. Auth, mekan, gönderi, mesajlaşma."),
    (True,  "Kimlik & Yetkilendirme",   "JWT süresi dolma, yenileme ve yetkisiz istek engelleme test edildi."),
    (True,  "Gerçek Zamanlı Mesajlaşma","WebSocket bağlantı, iletim, kopma ve yeniden bağlanma senaryoları."),
    (True,  "İçerik Oluşturma Akışı",   "Seçim → Kırpma → Filtre → Paylaşım; iOS cihazda uçtan uca test."),
    (True,  "AI Öneri & Reranking",     "100 gerçekçi sorgu ile test. %98 niyet doğruluğu, %92 P@3 hassasiyeti."),
    (True,  "Moderasyon & Güvenlik",    "Groq ile içerik denetimi, SQL injection ve prompt injection testleri."),
]
tw2 = Inches(3.85); th3 = Inches(1.1); tgap = Inches(0.15)
for i, (passed, tit, body) in enumerate(tests):
    col = i % 3; row = i // 3
    tx2 = LX + col * (tw2 + tgap)
    ty2 = Inches(2.55) + row * (th3 + tgap)
    card(s, tx2, ty2, tw2, th3, fill=SURFACE2)
    # Badge
    b_fill = GREEN_DIM
    b_text = "BAŞARILI"
    b_color = GREEN
    bsh = s.shapes.add_shape(1, tx2 + Inches(0.08), ty2 + Inches(0.08), Inches(0.7), Inches(0.2))
    bsh.fill.solid(); bsh.fill.fore_color.rgb = b_fill; bsh.line.fill.background()
    t(s, b_text, tx2 + Inches(0.08), ty2 + Inches(0.08), Inches(0.7), Inches(0.2),
      size=7, bold=True, color=b_color, align=PP_ALIGN.CENTER)
    t(s, tit, tx2 + Inches(0.08), ty2 + Inches(0.34), tw2 - Inches(0.15), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, tx2 + Inches(0.08), ty2 + Inches(0.62), tw2 - Inches(0.15), Inches(0.42),
      size=9, color=GRAY_LIGHT)

# Alt: test özeti bar
sum_y = Inches(5.2)
sum_items = [("200+", "API Senaryosu"), ("100", "AI Sorgusu"), ("6/6", "Başarılı Modül"), ("%98", "Niyet Doğruluğu")]
sw_sum = Inches(2.85); sg_sum = Inches(0.2)
for i, (v, l) in enumerate(sum_items):
    stat_card(s, LX + i*(sw_sum+sg_sum), sum_y, sw_sum, Inches(0.85), v, l)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 17 — DENEYSEL SONUÇLAR (TAM GENİŞLİK + CHART)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_full_grid(s); tech_corner(s); slide_number(s, 17)
badge(s, "● SONUÇLAR")
title_block(s, "Deneysel test", "sonuçları", w=FW)
subtitle_text(s, "100 gerçekçi kullanıcı sorgusuyla başarı analizi. Metrik bazlı performans ölçümü.", Inches(2.0), w=FW)

# Büyük stat kartları — 3 adet (geniş)
sw3 = Inches(3.85); sh4 = Inches(1.5); sg4 = Inches(0.15)
results = [
    ("%98.0", "Niyet Sınıflandırma\nDoğruluğu"),
    ("%92.0", "Öneri Hassasiyeti\n(P@3)"),
    ("0.90", "Deneysel\nF1-Skor"),
]
for i, (v, l) in enumerate(results):
    rx = LX + i * (sw3 + sg4)
    ry = Inches(2.55)
    sh = s.shapes.add_shape(1, rx, ry, sw3, sh4)
    sh.fill.solid(); sh.fill.fore_color.rgb = SURFACE2; sh.line.fill.background()
    top = s.shapes.add_shape(1, rx, ry, sw3, Inches(0.05))
    top.fill.solid(); top.fill.fore_color.rgb = GREEN; top.line.fill.background()
    t(s, v, rx, ry + Inches(0.2), sw3, Inches(0.65),
      size=40, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    t(s, l, rx, ry + Inches(0.9), sw3, Inches(0.5),
      size=11, color=GRAY_LIGHT, align=PP_ALIGN.CENTER)

# Alt: Açıklama kartları (3 sütun)
detail_items = [
    ("🎯", "Niyet Sınıflandırma",     "Groq LLM ile arama sorgusunun niyeti (mekan arama / genel sohbet) %98 doğrulukla tespit edildi."),
    ("📊", "Öneri Hassasiyeti",        "İlk 3 önerideki ilgili mekan oranı %92. Reranking ve anomali çözümü doğruluğu artırdı."),
    ("⚖️", "F1-Skor Optimizasyonu",   "Vektör benzerlik eşiği 0.40'ta Precision ve Recall dengesi sağlandı; F1 = 0.90."),
]
dw = Inches(3.85); dh = Inches(1.0)
for i, (icon, tit, body) in enumerate(detail_items):
    dx = LX + i * (dw + Inches(0.15))
    dy = Inches(4.35)
    card(s, dx, dy, dw, dh)
    t(s, icon, dx + Inches(0.1), dy + Inches(0.1), Inches(0.35), Inches(0.35), size=15)
    t(s, tit, dx + Inches(0.54), dy + Inches(0.1), dw - Inches(0.62), Inches(0.26),
      size=10.5, bold=True, color=WHITE)
    t(s, body, dx + Inches(0.54), dy + Inches(0.38), dw - Inches(0.62), Inches(0.55),
      size=9, color=GRAY_LIGHT)

# Alt bar chart: metrik karşılaştırma
chart_y = Inches(5.65)
t(s, "METRİK KARŞILAŞTIRMA", LX, chart_y, FW, Inches(0.22), size=8, bold=True, color=GRAY_MID)

metrics = [
    ("Niyet Doğruluğu",  98, GREEN),
    ("P@3 Hassasiyeti",  92, GREEN),
    ("F1-Skor (×100)",   90, GREEN_DIM),
    ("Recall",           88, GREEN_DIM),
    ("Precision",        94, GREEN),
]
chart_bw = Inches(2.0)
chart_h = Inches(0.22)
for i, (label, val, col) in enumerate(metrics):
    cy = chart_y + Inches(0.3) + i * Inches(0.32)
    t(s, label, LX, cy, Inches(1.8), chart_h, size=9, color=GRAY_LIGHT)
    # track
    tr = s.shapes.add_shape(1, LX + Inches(2.0), cy, Inches(8.5), chart_h)
    tr.fill.solid(); tr.fill.fore_color.rgb = GRAY_DARK; tr.line.fill.background()
    # fill
    fw2 = Inches(8.5) * val / 100
    fl = s.shapes.add_shape(1, LX + Inches(2.0), cy, fw2, chart_h)
    fl.fill.solid(); fl.fill.fore_color.rgb = col; fl.line.fill.background()
    t(s, f"%{val}", LX + Inches(10.7), cy, Inches(0.6), chart_h, size=9, bold=True, color=GREEN)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 18 — GELECEK PLANLAR (TEK GÖRSEL)
# ═══════════════════════════════════════════════════════════════════════════
s = new_slide()
add_left_stripe(s); add_divider_line(s); tech_corner(s); slide_number(s, 18)
badge(s, "● GELECEK PLANLAR")
title_block(s, "Bundan sonra", "ne geliyor?")
subtitle_text(s, "Proje bir başlangıç. Yol haritamızdaki sonraki adımlar.", Inches(2.0))

future_items = [
    ("Kısa",  "📱", "App Store Yayını",          "iOS ve Android mağaza süreci, beta test ve sertifika."),
    ("Kısa",  "🗺", "Gelişmiş Harita Rotaları",  "Dinamik rota çizimleri ve grup buluşma noktaları hesaplama."),
    ("Orta",  "🤖", "Fine-Tuned AI Modeli",      "SentenceTransformers modelinin kullanıcı geçmişiyle kişiselleştirilmesi."),
    ("Orta",  "🏢", "İşletme Profilleri",        "Mekan sahibi dashboard: istatistik ve promosyon."),
    ("Uzun",  "💰", "Gelir Modeli",              "Sponsorlu öneriler, premium üyelik, reklam."),
    ("Uzun",  "🌍", "Ölçekleme & Genişleme",     "Qdrant bulut kümesi ile milyonlarca mekan; İstanbul'dan dünyaya."),
]
tag_colors2 = {
    "Kısa": (RGBColor(0x08, 0x22, 0x10), GREEN),
    "Orta": (RGBColor(0x18, 0x14, 0x30), RGBColor(0xA5, 0x8E, 0xFF)),
    "Uzun": (RGBColor(0x28, 0x18, 0x06), RGBColor(0xFC, 0xD3, 0x4D)),
}
fw3 = Inches(2.72); fh3 = Inches(0.9); fgap3 = Inches(0.1)
for i, (tag, icon, tit, body) in enumerate(future_items):
    col = i % 2; row = i // 2
    fx2 = LX + col * (fw3 + fgap3)
    fy2 = Inches(2.48) + row * (fh3 + fgap3)
    card(s, fx2, fy2, fw3, fh3)
    tc_bg, tc_fg = tag_colors2[tag]
    ts = s.shapes.add_shape(1, fx2 + Inches(0.08), fy2 + Inches(0.08), Inches(0.62), Inches(0.2))
    ts.fill.solid(); ts.fill.fore_color.rgb = tc_bg; ts.line.fill.background()
    t(s, tag.upper(), fx2 + Inches(0.08), fy2 + Inches(0.08), Inches(0.62), Inches(0.2),
      size=7.5, bold=True, color=tc_fg, align=PP_ALIGN.CENTER)
    t(s, icon, fx2 + Inches(0.08), fy2 + Inches(0.3), Inches(0.35), Inches(0.35), size=16)
    t(s, tit, fx2 + Inches(0.5), fy2 + Inches(0.28), fw3 - Inches(0.6), Inches(0.26),
      size=10, bold=True, color=WHITE)
    t(s, body, fx2 + Inches(0.08), fy2 + Inches(0.62), fw3 - Inches(0.15), Inches(0.24),
      size=9, color=GRAY_LIGHT)
add_phone_screenshot(s, "screen_profil.png", "Profil Ekranı")

# ─── KAYDET ────────────────────────────────────────────────────────────────
out = "/Users/ulascandemirtas/Desktop/AsEmOs sunum/BitirmeProjesi_Sunum_v3.pptx"
prs.save(out)
print(f"✅ Kaydedildi: {out}")
print(f"📊 Toplam slayt: {len(prs.slides)}")

# Rapor
screenshot_slides = []
fullwidth_slides = []
for i, slide in enumerate(prs.slides, 1):
    has_img = False
    for shape in slide.shapes:
        if shape.shape_type == 13:  # Picture
            has_img = True; break
    if has_img:
        screenshot_slides.append(i)
    else:
        fullwidth_slides.append(i)

print(f"📱 Görselli slaytlar ({len(screenshot_slides)}): {screenshot_slides}")
print(f"📐 Tam genişlik slaytlar ({len(fullwidth_slides)}): {fullwidth_slides}")
