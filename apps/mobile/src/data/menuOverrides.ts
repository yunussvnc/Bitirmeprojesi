// Kamuya açık menü kaynaklarından doğrulanan yerel menü kayıtları.
// Yayın tarihi kaynakta görünmüyorsa verifiedAt erişim/doğrulama tarihidir; ürün/fiyat uydurulmaz.
export type MenuItemOverride = { name: string; price?: string; desc?: string; category?: string; };
export type MenuOverride = { name: string; sourceUrl: string; sourceName: string; verifiedAt: string; items: MenuItemOverride[]; };

export const MENU_OVERRIDES: Record<string, MenuOverride> = {
  "7288": {
    "name": "Limonlu Bahçe",
    "sourceUrl": "https://www.limonlubahcebeyoglu.com/qrmenu.php",
    "sourceName": "Limonlu Bahçe resmi QR menüsü",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "İSTANBUL KAHVALTI (2 KİŞİLİK)",
        "price": "1650 TL",
        "desc": "beyaz peynir, kars kaşarı, zeytin, tereyağı, zeytinyağı sosunda çörek otlu kaymak lor, ince pekmezli tahin sos, marmelat, bal, kuru ve taze meyveli süzme yoğurt, baharatlı acuka, mini domates, salatalık, sosunda taze otlar, yumurtalı ekmek, kızarmış yumurta, bahçenin ekmeği, simit, 3 çay veya filtre kahve / White cheese, Kars kasar cheese, olives, butter, black seed in olive oil sauce, clotted cream curd cheese, tahini with light molasses sauce, jam, honey, strained yogurt with dried and fresh fruits, spicy acuka, cherry tomatoes, cucumber with fresh herbs in sauce, eggy bread, fried eggs, garden bread, simit, 3 cups of tea or filter coffee.",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI EKİ",
        "price": "375 TL",
        "desc": "Tavada sucuk (4 dilim) / Pan-fried sausage (4 slices)",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI EKİ",
        "price": "230 TL",
        "desc": "Sigara böreği (4 adet) / Fried chee se rolls (4 Pieces)",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "VEGAN KAHVALTI",
        "price": "750 TL",
        "desc": "3 sebzeli börek, acuka ezmeli gevrek, söğüşler, vegan peynir rende, tahin soslu meyve, 3 çay veya filtre kahve / 3 Vegetable pastries, crisp with acuka spread, sliced fresh vegetables, grated vegan cheese, fruit with tahini sauce, 3 teas or filter coffee.",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Mini Kahvaltı",
        "price": "690 TL",
        "desc": "Beyaz peynir, trakya kaşarı, çeri domates, salatalık, yeşil biber, zeytin, tereyağı, bal, kızarmış yumurta, 3 çay veya filtre kahve / Feta cheese, mini cheese, tomatoes, cucumber, butter, olive, honey, fried eggs, 3 cup of tea or filter coffee",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI 3'LEMELERI",
        "price": "790 TL",
        "desc": "Kızarmış dana sosis, kızarmış yumurta, zeytinyağı sosunda acuka, 3 çay veya filtre kahve / Fried beef sausage, fried eggs, acuka in olive oil sauce, 3 cups of tea or filter coffee",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI 3' LEMELERİ",
        "price": "625 TL",
        "desc": "4 sigara böreği, 2 yumurtalı ekmek, tereyağı, kaymak-lor, bal, 3 çay veya filtre kahve / 4 spring rolls (fried pastry rolls), 2 eggy breads, butter, clotted cream and curd cheese, honey, 3 cups of tea or filter coffee",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI 3' LEMELERİ",
        "price": "640 TL",
        "desc": "Limon usulü Fransız tost, yumurtalı ekmek, tahinli sos, tarçın, taze ve kuru meyve, 3 çay veya filtre kahve / Lemon-style French toast, eggy bread, tahini sauce, cinnamon, fresh and dried fruits, 3 cups of tea or filter coffee",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "KAHVALTI 3'LEMELERİ",
        "price": "640 TL",
        "desc": "kızarmış sucuklu yumurta, zeytinyağı sosunda acuka, mini domates, 3 çay veya filtre / Fried eggs with sucuk, acuka in olive oil sauce, cherry tomatoes, 3 cups of tea or filter coffee",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "VEGAN OMLET",
        "price": "330 TL",
        "desc": "taze soğan, patates, kuru domates, yulaf, keten tohumu, susam, ince maydanoz, çeri domates / fresh spring onion, potato, sun-dried tomato, oat, flaxseed, sesame, finely chopped parsley, cherry tomato fresh vegetables",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "YULAFLI OMLET",
        "price": "375 TL",
        "desc": "Süzme peynir, ince maydanoz, ince kuru domates / Cottage cheese, fine parsley, fine dried tomatoes",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Mantar ve Peynirli Omlet",
        "price": "450 TL",
        "desc": "Mushrooms and cheese",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "AKDENİZ OMLET",
        "price": "475 TL",
        "desc": "Karamelize soğan, kuru domates, yeşil zeytin dilimleri, rendelenmiş parmesan / Caramelized onions, sun- dried tomatoes, sliced green olives, grated Parmesan",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Peynirli Omlet",
        "price": "375 TL",
        "desc": "Cheese Omlette",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "SOSİSLİ + PATATESLİ OMLET",
        "price": "575 TL",
        "desc": "Sausage & Fries",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Kızarmış Sosis + Sucuk",
        "price": "825 TL",
        "desc": "Izgara çeri domates, biber / Fried frankfurter, cherry tomatoes, pepper",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Sucuklu Yumurta",
        "price": "490 TL",
        "desc": "Egg with sausages",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Menemen",
        "price": "330 TL",
        "desc": "Scrambled eggs with tomatoes, pepper",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "SÜZME YOĞURT + TAZE ve KURU MEYVELER (TERCİHEN YULAF)",
        "price": "350 TL",
        "desc": "Strained yogurt + fresh and dried fruits (PREFERABLY OATS)",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "Sigara Böreği + Kiraz Domates",
        "price": "425 TL",
        "desc": "Cherry tomatoes + fried patty",
        "category": "KAHVALTILAR | BREAKFAST"
      },
      {
        "name": "ÇITIR PİLİÇ BURGER",
        "price": "650 TL",
        "desc": "çıtır kızarmış piliç, ranch sos, turşu dilimi, karamelize soğan, marul dilimi, baharatlı patates kızartması / crispy fried chicken, ranch sauce, pickle slices, caramelized onion, lettuce, seasoned french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "İKİZ VEGAN BURGER",
        "price": "800 TL",
        "desc": "Bitki bazlı (bezelye) veggy marka vegan köfte,taze yeşillik,domates dilim,salatalık turşu,karamelize soğan,barbekü+hardal sos, baharatlı patates kızartması / Plant-based (pea) Veggy brand vegan meatball, fresh greens, tomato slice, pickled cucumber, caramelized onion, barbecue + mustard sauce, spiced french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "İKİZ BURGER / BURGER PATTIES (120GR)",
        "price": "790 TL",
        "desc": "Burger köfte, domates, karamalize soğan, turşu, baharatlı patates kızartması / Burger patties, special sauce, tomatoes, caramelize onions, pickles and spicy french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "HAMBURGER ( 120 GR KOFTE)",
        "price": "790 TL",
        "desc": "burger köfte, taze yeşillik, salatalık turşusu, karamalize soğan, domates dilim, burger sos, baharatlı patates kızartması / burger meatballs, pickled cucumber, caramelized onions, tomato slice, pickled , burger sauce, french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "CHEESEBURGER ( 120 GR KÖFTE)",
        "price": "820 TL",
        "desc": "burger köftesi, taze yeşillik, cheddar peynir, karamelize soğan, domates dilim, salatalık tursusu, burger sos, baharatlı patates kızartması / burger meatballs, fresh greens, cheddar cheese, caramelized onion, tomato slices, cucumber pickles, burger sauce, spicy potatoes.",
        "category": "LİMON FEST"
      },
      {
        "name": "DOUBLE CHEESEBURGER ( 240 GR KOFTE )",
        "price": "1450 TL",
        "desc": "burger köfte, taze yeşillik, cheddar peynir, karamelize soğan, domates dilim, salatalık turşusu, burger sos, baharatlı patates kızartması / burger meatballs, fresh greens, cheddar cheese, caramelized onions, tomato slices, cucumber pickles, burger sauce, spicy potatoes",
        "category": "LİMON FEST"
      },
      {
        "name": "SEBZELİ ACIK DÜRÜM (vegan)",
        "price": "475 TL",
        "desc": "lavaş ekmeği, lezzetlendirilmiş ince mevsim sebzeleri, kızarmış taze patates / whole wheat lavash bread, flovored thinseasonal vegetables, fried fresh potatoes",
        "category": "LİMON FEST"
      },
      {
        "name": "SEZAR DÜRÜM",
        "price": "660 TL",
        "desc": "Ançuez ve parmesan katkılı sezar sos, ızgara piliç dilimleri, taze marul, salatalık dilim, turşu dilim, baharatlı patates kızartması / Caesar sauce with anchovies and parmesan, grilled chicken slices, fresh lettuce, cucumber slice, pickle slice, spicy french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "ETLİ DÜRÜM (KEBAP KÖFTESİ) / RED MEAT WRAP",
        "price": "800 TL",
        "desc": "Izgara kebap köftesi, acuka sosu, sumaklı ince doğranmış kırmızı soğan, közlenmiş biber dilimleri, ince kıyılmış maydanoz, baharatlı patates kızartması / Grilled kebab meatballs, acuka sauce, thinly sliced red onion with sumac, roasted pepper slices, finely chopped parsley, spiced french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "KIZARMIŞ DANA SOSİS + BAHARATLI PATATES KIZARTMASI",
        "price": "825 TL",
        "desc": "Fried beef sausage + fried potatoes",
        "category": "LİMON FEST"
      },
      {
        "name": "BAHARATLI PATATES KIZARTMASI",
        "price": "330 TL",
        "desc": "Spicy french fries",
        "category": "LİMON FEST"
      },
      {
        "name": "MEVSİMSEL ÇORBA / SOUP OF THE SEASON",
        "price": "220 TL",
        "desc": "Baharatlı gevrek ekmek / With spicy crisp croutons",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "2 PEYNİR / 2 CHEESE",
        "price": "590 TL",
        "desc": "Trakya kaşarı, kimyonlu goudo, kuru meyve, çörek otlu zeytinyağı / Thracian cheddar, goudo with cumin, dried fruit, nigella seed olive oil",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "4 PEYNİR / 4 CHEESE (2 kişi icin tavsiye edilir)",
        "price": "995 TL",
        "desc": "kimyonlu gouda, bergama tulum, trakya kaşarı, gravyer peyniri, kuru dut, kuru erik, gevrek, çörek otlu zeytinyağı/ cumin gouda, bergama tulum cheese, trakya kashar cheese, gruyere cheese, dried mulberries, dried prunes, crispy bread, nigella seed olive oil",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "MİNİ DOMATESİ + PEYNİR KREMASI",
        "price": "390 TL",
        "desc": "Taze fesleğen katkılı sos ile lezzetlendirilmiş 2 renkli çeri domates, 2 çeşit peynir ile hazırladığımız peynir ezmesi / two-colored cherry tomatoes flavored with a fresh basil-infused sauce, cheese spread prepared with two types of cheese",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "3'LÜ MEZE",
        "price": "700 TL",
        "desc": "Üç adet meze / mezze trio",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "LİMON KARIŞIK / LEMON MIXED",
        "price": "995 TL",
        "desc": "çıtır patates, çıtır piliç dilimleri, kızarmış dana sosis, sigara böreği, 2 dip sos / crispy fries, crispy chicken strips, fried beef sausage, turkish spring rolls, 2 dipping sauce",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "SOMON FÜME (80 GR.)",
        "price": "695 TL",
        "desc": "kuzu kulağı, kuru domates, ince parmesan, nar ekşili zeytinyağı / smoked salmon, lamb’s lettuce, sun- dried tomatoes, shaved parmesan, pomegranate molasses olive oil",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "ÇEREZ KITIR / SNACK KITIR",
        "price": "540 TL",
        "desc": "baharatlı patates kızartması, çıtır piliç dilimleri, 2 dip sos/ revised / spicy french fries, crispy chicken strips, 2 dipping sauces",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "Bruschetta - 2 dilim (SEÇİM 1)",
        "price": "440 TL",
        "desc": "fesleğen soslu domates dilimi, ince peynir kreması + köz patlıcan / tomato with basil sauce, fine cheese cream + roasted eggplant",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "Bruschetta - 2 dilim (SEÇİM 2)",
        "price": "495 TL",
        "desc": "peynir kreması + somon füme (ince salatalık), fesleğen soslu domates dilimi / cheese cream + smoked salmon (thin cucumber), tomato with basil sauce",
        "category": "BAŞLANGIÇLAR | STARTERS"
      },
      {
        "name": "MELİMELO",
        "price": "425 TL",
        "desc": "ince turp, ince yeşil elma, kuzu kulağı, ince zencefil, yeşil zeytin, ince kuru domates, kuru dut, peynir soslu gevrekler, fresh sos / thinly sliced radish, thinly sliced green apple, sorrel, thinly sliced ginger, green olives, thinly sliced sun-dried tomatoes, dried mulberries, cheese-coated crisps, fresh dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "EGE SALATA / EGE  SALAD",
        "price": "400 TL",
        "desc": "marul, kuzu kulağı, taze nane, ince dilim turp, yeşil zeytin, ince dilim kuru domates, kuru erik, süzme peynir, nar ekşili zeytinyağı/ lettuce, lamb’s lettuce, fresh mint, thin sliced radish, green olives, thin sliced sun-dried tomatoes, dried prunes, strained cheese, pomegranate molasses olive oil",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "VEGAN EGE",
        "price": "470 TL",
        "desc": "marul, kuzu kulağı ve taze nane, ince dilim turp, yeşil zeytin, ince dilim kuru domates, kuru erik, vegan bitkisel peynir rendesi, nar ekşili zeytinyağı / lettuce, lamb’s lettuce, fresh mint, radish, green olives, sun-dried tomatoes, dried prunes, grated vegan cheese, pomegranate molasses olive oil",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "SOMON FÜMELİ (80 GR. SOMON)",
        "price": "695 TL",
        "desc": "ince turp, ince yeşil elma, kuzu kulağı, taze zencefil, yeşil zeytin, kuru domates, kuru dut, gevrek, fresh sos / smoked salmon, thinly sliced radish, thinly sliced green apple, sorrel, fresh ginger, green olives, sun-dried tomatoes, dried mulberries, crisps, fresh dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "ETLİ SALATA (100 GR. BONFİLE) / STEAK SALAD",
        "price": "995 TL",
        "desc": "marul dilimi, salatalık, turp, ince dilim kuru domates, parmesan rendesi, kişnişli limon sos / lettuce wedge, cucumber, radish, sun-dried tomatoes, grated parmesan, lemon & coriander dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "IZGARA PİLİÇ SALATASI (140 GR PİLİÇ)",
        "price": "420 TL",
        "desc": "Taze marul dilimleri, kuru üzüm, ince yeşil elma dilim, ızgara baharatlı piliç dilimleri, fresh sos / Fresh lettuce slices, raisins, thinly sliced green apple, grilled spiced chicken slices, fresh dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "SEZAR SALATA",
        "price": "640 TL",
        "desc": "Marul, ızgara piliç, parmesan, sezar sos, krotan ekmek / Caeser salad, green salad, grilled chicken, parmesan with caesar sauce,croutons bread",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "ÇITIR PİLİÇ / CHICKEN TENDERS (140 GR)",
        "price": "440 TL",
        "desc": "taze yeşillik, yeşil elma, kuru dut, kuru üzüm, mini domates, fresh sos / fresh greens, green apple, dried mulberries, raisins, cherry tomatoes, house dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "MEYVELİ PİRİNÇ SALATASI",
        "price": "425 TL",
        "desc": "Siyah pirinç,küp elma dilim, ince zencefil, taze otlar, ince turp, kuru erik, kuru üzüm, fresh sos / black rice, cubed apple slices,thinly sliced ginger, fresh herbs, thinly sliced radish, dried plums, raisins, fresh dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "MEVSİM SALATASI",
        "price": "375 TL",
        "desc": "Lifli 3 çeşit rendelenmiş mevsim sebzesi, taze frenk maydanoz, ekşili sos / Three types of shredded seasonal vegetables, fresh chervil, tangy dressing",
        "category": "SALATALAR | SALADS"
      },
      {
        "name": "PENNE ARABIATTA (tercİhen glutensİz spagettİ İle uygulanır)",
        "price": "460 TL",
        "desc": "İnce sarımsaklı acılı taze domates sos, zeytin dilim, parmesan peynir / Tomatoes sauce with chili and garlic, olive, parmesan",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "LINGUINI PİLİÇLİ / CHICKEN LINGUINI",
        "price": "540 TL",
        "desc": "İnce sarımsaklı, zerdaçallı ince krema, parmesan / Light garlic and turmeric cream sauce with parmesan",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "LINGUINI MANTARLI / MUSHROOM LINGUINI",
        "price": "525 TL",
        "desc": "İnce sarımsak, kültür mantarı, ince krema, parmesan / Light garlic, button mushrooms, light cream, and parmesan",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "RAVIOLI ETLİ  /  RAVIOLI WİHT MEAT",
        "price": "880 TL",
        "desc": "İnceltilmiş süzme yoğurt, ince zeytinyağı sosu/ meat ravioli, thinned strained yogurt, light olive oil dressing",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "ERİŞTE  NATUREL",
        "price": "460 TL",
        "desc": "kızarmış ince ceviz, kuru dut, ince sarımsak, sebze baharatı, karamelize ince soğan/ toasted sliced walnuts, dried mulberries, thinly sliced garlic, vegetable seasoning, caramelized thinly sliced onions",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "ERİŞTE SEBZELİ (VEGAN)",
        "price": "490 TL",
        "desc": "Özel yapım erişte, İnce soya soslu mevsim sebze, rende vegan peynir / Handmade noodles with seasonal vegetables in light soy sauce, topped with grated vegan cheese",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "RIGATONI PEYNIR KREMALI",
        "price": "620 TL",
        "desc": "Karamelize soğan, cherry domates, taze fesleğen, peynir katkılı ince krema, parmesan / Caramelized onion, cherry tomato, fresh basil, thin cream with cheese, parmesan",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "RIGATONİ SOMON FÜME",
        "price": "900 TL",
        "desc": "fırınlanmış domates, ince kapari ezmeli krema sos, ince sarımsak, ince taze soğan / smoked salmon, roasted tomatoes, creamy sauce with fine caper paste, thinly sliced garlic, thinly sliced spring onions",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "SPAGETTİ FESLEĞEN SOS",
        "price": "560 TL",
        "desc": "ince kuru domates, ince kavrulmuş ceviz, ince sarımsak, ince fesleğenli krema sos / thin sun-dried tomatoes, finely roested walnuts, fine garlic, thin basil cream sauce",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "TORTELLINI PORCİNİ MANTARLI",
        "price": "840 TL",
        "desc": "Parmesanlı krema sos / tortellini with porcini mushrooms, parmesan cream sauce",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "SPAGETTİ NAPOLITEN",
        "price": "420 TL",
        "desc": "İnce sarımsak lezzetli domates sos / Light garlic-flavored tomato sauce",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "SPAGETTİ BOLONEZ / SPAGHETTI BOLOGNESE  (tercihen glutensiz spagetti ile uygulanır)",
        "price": "800 TL",
        "desc": "İnce sarımsak ve etli bolenez sos / Light garlic and meaty Bolognese sauce",
        "category": "MAKARNALAR | PASTAS"
      },
      {
        "name": "TAVADA VEGAN KÖFTE",
        "price": "820 TL",
        "desc": "Bitki bazlı (bezelye) veggy marka vegan köfte, mini taze salata, ızgara domates, halka çıtır patates / Plant-based (pea) veggy brand vegan meatballs, mini fresh salad, grilled tomato, crispy potato rings",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "IZGARA SEBZE / GRILLED VEGETABLES",
        "price": "550 TL",
        "desc": "Izgara mevsim sebzeleri & peynir kreması, ince fesleğen sos / Grilled seasonal vegetables & cheese cream, thin basil sauce",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BEYTİ KEBAP (160 GR. KEBAP KÖFTESİ) LİMONLU BAHÇE SUNUMU İLE",
        "price": "995 TL",
        "desc": "süzme yoğurtlu közlenmiş patlıcan, hafif acılı domates sosu, ızgara kebap köftesi, köz mini domates / roasted eggplant with strained yogurt, mildly spicy tomato sauce, grilled kebab meatballs, roasted cherry tomatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "İSTANBUL KEBAP / İSTANBUL KEBAB (160 GR. KEBAP KÖFTESİ)",
        "price": "995 TL",
        "desc": "ızgara kebap köftesi ve tortilla ekmek, köz mini domates, kebap salatası (ince kırmızı soğan, köz biber, maydanoz, sumak, zeytinyağı, nar ekşisi) / grilled kebab meatballs with tortilla, roasted cherry tomatoes, kebab salad with red onion, roasted pepper, parsley, sumac, olive oil and pomegranate molasses",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "FIRINDA KUZU İNCİK (450 GR) / BAKED LAMB SHANK",
        "price": "1.995 TL",
        "desc": "karamelize soğan, ince kremalı taze patates / caramelized onions, baby potatoes with light cream sauce",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "FESLEĞEN SOSLU IZGARA  KÖFTE",
        "price": "895 TL",
        "desc": "Peynir kremalı fesleğen sosunda ızgara köfte, çıtır patates / Grilled meatballs with basil cream cheese sauce, accompanied by crispy potato",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "KÖFTE IZGARA (180 GR) / GRILLED MEATBALL",
        "price": "900 TL",
        "desc": "halka çıtır patates, köz domates, köz biber, acuka ezme / crispy potato rings, roasted tomatoes, roasted peppers, acuka dip",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "ETLİ DOLMA (SÜZME YOĞURT EŞLİĞİNDE)",
        "price": "660 TL",
        "desc": "pazı, lahana veya yaprak / stuffed chard, cabbage or vine leaves with minced meat, served with strained yogurt",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BONFİLE IZGARA (200 GR) /  FILLET STEAK",
        "price": "1.750 TL",
        "desc": "ince kremalı, karamelize soğanlı taze patates, mini sebzeler / baby potatoes with creamy caramelized onions, seasonal mini vegetables",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BONFİLE BİBERLİ (200 GR) / PEPPER FILLET",
        "price": "1.750 TL",
        "desc": "Tane karabiberli krema sos, baharatlı taze patates /cream sauce with whole black peppercorns, crispy fries",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BONFİLE ŞİNİTZEL (110 GR.)",
        "price": "1.150 TL",
        "desc": "kızarmış pane bonfile dilim, çıtır patates / breaded fried beef tenderloin slices, crispy fries",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BONFİLE FAJİTA (200 GR)",
        "price": "1.750 TL",
        "desc": "ince kırmızı soğan, kırmızı biber, havuç dilimleri, acı-tatlı sos, soya sosu ve worcester sos, çıtır patates / thin sliced red onion, red pepper, carrot slices, sweet chili sauce, soy sauce and worcestershire sauce, crispy fries",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "FIRIN SOMON (220 GR.)",
        "price": "975 TL",
        "desc": "natürel kemikli / natural bone-in",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "PİLİÇ ŞİNİTZEL (150 GR)  / FRİED CHİCKEN",
        "price": "475 TL",
        "desc": "Kızarmış pane piliç göğüs, çıtır patates / Fried chicken breast, crispy potatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "PİLİÇ MEKSİKA (200 GR) / CHICKEN MEXICAN",
        "price": "650 TL",
        "desc": "Taze soğan, kırmızı ve yeşil biber, acılı krema sos, çıtır patates / Chicken Mexican, green onion, red and green pepper, hot cream sauce, crispy potatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "PİLİÇ MANTAR  (200 GR) / CHICKEN WITH MUSHROOMS",
        "price": "650 TL",
        "desc": "Kültür mantarı, ince krema sos, çıtır patates / Chicken with mushrooms, cream sauce and crispy potatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "PİLİÇ ZERDECAL (200 GR)",
        "price": "650 TL",
        "desc": "Kuru dut, kuru üzüm, taze soğan, ince sarımsak, zerdeçallı krema sos, çıtır patates / Dried mulberries, raisins, spring onions, light garlic, turmeric cream sauce and crispy potatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "ÇÖKERTME (LİMONLU BAHÇE SUNUMU)",
        "price": "1.350 TL",
        "desc": "Izgara julyen bonfile dilim, ızgara köfte, süzme yoğurt, çıtır kibrit patates / Grilled julienne beef tenderloin slice, grilled meatball, strained yogurt, crispy shoestring potatoes",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "VİŞNELİ+PEYNİR KREMALI PİRİNÇ",
        "price": "690 TL",
        "desc": "Risotto usulü siyah pirinç, sotelenmiş ince mantar, peynir kreması, vişne, parmesan/ Risotto- style black rice with sautéed mushrooms, cheese cream, cherry, and Parmesan",
        "category": "ANA YEMEKLER | MAIN COURSES"
      },
      {
        "name": "BROWNI",
        "price": "450 TL",
        "desc": "Dondurma eşliğinde / with ıce cream",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "DONDURMALI PROFİTEROL",
        "price": "440 TL",
        "desc": "(1 top dondurma) Profiterole with Chocolate Sauce and Ice Cream",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "TAHİN SOSLU PROFİTEROL (3 TOP)",
        "price": "420 TL",
        "desc": "(1 top dondurma) Profiterole with Tahin Sauce and Ice Cream",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "TAHİN SOSLU PROFİTEROL (2TOP)",
        "price": "350 TL",
        "desc": "profiterole with tahin sauce",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "ÇİKOLATALI PROFİTEROL (3 TOP)",
        "price": "370 TL",
        "desc": "profiterole with chocolate sauce",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "ÇİKOLATALI PROFİTEROL (2 top)",
        "price": "350 TL",
        "desc": "Profiterole with Chocolate Sauce",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "SAN SEBASTIAN CHEESECAKE",
        "price": "400 TL",
        "desc": "Limon, Çikolata veya Frambuaz Püresi Lemon, Chocolate or Raspberry Sauce",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "LİMON MUHALLEBİ",
        "price": "350 TL",
        "desc": "tercihen çikolata veya franbuaz veya tahin sos / chocolete mus with preferably chocolate or raspberry or tahini sauce.",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "DONDURMA",
        "price": "440 TL",
        "desc": "ICE CREAM",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "MEVSİM MEYVESİ",
        "price": "350 TL",
        "desc": "Seasonal Fruits",
        "category": "TATLILAR | DESSERTS"
      },
      {
        "name": "BİTKİ ÇAYI / HERBAL TEA",
        "price": "290 TL",
        "desc": "Elma, Kuşburnu, Adaçayı, Ihlamur, Yeşil Çay / Apple, Rosehip, Sage, Linden, Green Tea",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "KIŞ CAYI",
        "price": "300 TL",
        "desc": "Karışık bitki otları, taze limon suyu, taze zencefil, taze meyveler / Mixed herbs, fresh lemon juice, fresh ginger, fresh berries",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "LATTE - CAPPUCCINO",
        "price": "250 TL",
        "desc": "...",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "DOUBLE ESPRESSO",
        "price": "250 TL",
        "desc": ".....",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "DOUBLE TÜRK KAHVESİ",
        "price": "240 TL",
        "desc": "TÜRK KAHVESİ",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "ESPRESSO - AMERICANO",
        "price": "180 TL",
        "desc": "...",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "DEMLEME ÇAY / TEA",
        "price": "100 TL",
        "desc": "Organik Organic",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "TÜRK KAHVESİ / TURKISH COFFEE",
        "price": "175 TL",
        "desc": "...",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "FİLTRE KAHVE / FILTER COFFEE",
        "price": "220 TL",
        "desc": "...",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "ROMLU BİTKİ ÇAYLARI / HERBAL TEA WITH RUM",
        "price": "490 TL",
        "desc": "Elma, Kuşburnu, Adaçayı, Ihlamur, Yeşil Çay Apple, Rosehip, Sage, Linden, Green Tea",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "KAHVE & KONYAK / COFFEE & COGNAC",
        "price": "390 TL",
        "desc": "Türk Kahvesi veya Espresso + Remy Martin Konyak 3 cl",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "KAHVE & VİSKİ / COFFEE & WHISKEY",
        "price": "400 TL",
        "desc": "Türk Kahvesi veya Espresso + Jameson Viski 3 cl",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "BAILEY'S CAFE",
        "price": "390 TL",
        "desc": "...",
        "category": "SICAK İÇEÇEKLER | HOT BEVERAGES"
      },
      {
        "name": "LİMONSOFT",
        "price": "375 TL",
        "desc": "Limonata, çilek püresi, Sprite Mix Lemonade, strawberry puree, Sprite",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "LİMONATA / LEMONADE",
        "price": "275 TL",
        "desc": "...",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "FROZEN ÇİLEK",
        "price": "375 TL",
        "desc": "Frozen çilek veya Frambuaz",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "LİMON VİTAMİN / LEMON VITAMINE",
        "price": "350 TL",
        "desc": "Limonata, fesleğen, zencefil, elma dilim mix Lemonade, basil, fresh ginger, apple slice",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "LİMONBELLA",
        "price": "290 TL",
        "desc": "Ananas suyu, elma ve çilek püresi mix Pineapple juice, apple and strawberry mix",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "LİMON KEYFİ",
        "price": "350 TL",
        "desc": "Lavanta ve hindistan cevizi şurubu, limonata , taze nane Lavender and coconut syrup, lemonade, fresh mint",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "MOJİTO (ALKOLSÜZ)",
        "price": "340 TL",
        "desc": "Majito alkolsüz",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "SIKMA PORTAKAL SUYU /  FRESH ORANGE JUİCE",
        "price": "290 TL",
        "desc": "...",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "CARAMEL FRAPPE",
        "price": "300 TL",
        "desc": "Frape",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "KLASİK FRAPPE",
        "price": "340 TL",
        "desc": "double espresso, 1 top kaymak dondurma",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "BAILEY'S  FRAPPE",
        "price": "400 TL",
        "desc": "....",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "DOMATES SUYU",
        "price": "220 TL",
        "desc": "Çubuk salatalık, taze nane / Cucumber sticks, fresh mint",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "AYRAN",
        "price": "200 TL",
        "desc": "Salatalık, nane Drink made with yoghurt, cucumber, mint",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "ICE AMERICANO",
        "price": "200 TL",
        "desc": "americano, filter, coffe",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "ICE LATTE",
        "price": "260 TL",
        "desc": "ice latte",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "SCHWEPPES",
        "price": "225 TL",
        "desc": "Mandalina",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "MEŞRUBATLAR / SOFT DRINKS",
        "price": "225 TL",
        "desc": "Cola, Zero Cola, Sprite, Ice tea",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "MEYVE SULARI / FRUIT JUICES",
        "price": "225 TL",
        "desc": "Vişne, şeftali , kayısı , elma Cherry, Peach, Apricot, Apple",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "ENERGY",
        "price": "275 TL",
        "desc": "...",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "ULUDAG PREMIUM",
        "price": "340 TL",
        "desc": "75 cl",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "SODA / MINERAL WATER",
        "price": "140 TL",
        "desc": "...",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "SU / WATER",
        "price": "125 TL",
        "desc": "33 cl",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "SU / WATER",
        "price": "240 TL",
        "desc": "75 cl",
        "category": "SOĞUK İÇECEKLER | COLD BEVERAGES"
      },
      {
        "name": "BUZZ BEYAZ",
        "price": "720 TL",
        "desc": "Beyaz şarap,votka,p.likör,cin,sprite,lime,nane / White wine,orange liquer,gin,sprite,lime,fresh mint",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BUZZ ROZE",
        "price": "720 TL",
        "desc": "Blush sarap,votka,sprite,lime,çilek,nane Blush,vodka,sprite,lime,strawberry,fresh mint.",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BAHÇE LİMONATASI / GARDEN LEMONADE",
        "price": "660 TL",
        "desc": "Misket limon aromalı smirnoff, Limonata / Lime vodka , lemonade",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "CİN VİTAMİN",
        "price": "660 TL",
        "desc": "Gordon cin, fesleğen ve zencefilli limonata / Gordon gin, basil and ginger lemonade",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "KUZU KULAKLI CİN",
        "price": "680 TL",
        "desc": "cin, ekşi elma ve taze limon suyu, şeker şurubu, kuzu kulağı püresi / gin, sour apple and fresh lemon juice, sugar syrup, sorrel puree",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LİMON MİMOSA",
        "price": "700 TL",
        "desc": "beyaz şarap, fresh portakal suyu,soda,limonlu dondurma / white wine, fresh orange juice, soda water, lemon ice cream",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BAHÇE SOUR",
        "price": "760 TL",
        "desc": "konyak, amaretto, şeker suyu / şurubu, taze limon sugar cognac, amaretto, syrup, fresh lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BAHÇE SANGRIA  - DONKİŞOT",
        "price": "760 TL",
        "desc": "Kırmızı şarap, Gordon Cin, portakal ve vişne suyu , esmer şeker / Red wine, gordon gin, orange and sour cherry juice, brown sugar",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "MOJITO",
        "price": "680 TL",
        "desc": "Rom, misket limon, taze nane / Rum, lime, fresh peppermint",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "MOJITO ÇİLEKLİ - KIRMIZI RÜYA",
        "price": "680 TL",
        "desc": "Rom, misket limonu, çilek püresi , taze nane / Rum, lime, strawberry puree, fresh peppermint",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LYNCHBURG LEMONADE",
        "price": "690 TL",
        "desc": "Jack's daniel's , Cointreau, Sprite, taze limon suyu / Jack daniel’s, Cointreau, Sprite, fresh lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "ESPRESSO MARTINI",
        "price": "650 TL",
        "desc": "Espresso kahve, votka, kahlua, kokteyl surubu / espresso coffee , vodka, kahlua, cocktail syrup",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LONG ISLAND ICE TEA  - AŞK VE GURUR",
        "price": "825 TL",
        "desc": "Rom, tequila, gordon gin, cointreau, smirnoff, cola, limon suyu / Rum, tequila, gordon gin, cointreau, smirnoff, cola, lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "WHISKEY SOUR",
        "price": "660 TL",
        "desc": "Vıskı, taze limonsuyu,şeker şurubu Wıskey, fresh lemon , juıce , şugar syrup",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LİMONELLA",
        "price": "660 TL",
        "desc": "Gordon Cin, Kavun likörü, Sprite, çilek püresi / Gordon Gin , melon liquer , Sprite, strawberry puree",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "KIRMIZI LİMON",
        "price": "660 TL",
        "desc": "Misket limon aromalı Smirnoff, Limonata, çilek püresi / Lime Vodka, lemonade, strawberry puree",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "KEYF'E KEDER",
        "price": "660 TL",
        "desc": "Cointreau, Smirnoff, vişne suyu, fgrambuaz püresi, taze meyveler / Smirnoff, cointreau, cherry juice, raspberry puree, fresh fruits",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LİMON LAVANTA  - MADAME BOVARY",
        "price": "660 TL",
        "desc": "limon mamülü lavanta şurubu, Gordon Cin, fresh limon suyu / Lavender syrup, gordon gin, fresh lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "MARGARITA",
        "price": "695 TL",
        "desc": "Tequilla, cointreau, taze limon suyu / Tequilla, cointreau, fresh lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "MARGARITA ÇİLEK - JULYET",
        "price": "740 TL",
        "desc": "Tequilla, cointreau, taze limon suyu, çilek püresi / Tequilla, cointreau, fresh lemon juice, strawberry puree",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LİMON FRESH",
        "price": "660 TL",
        "desc": "Gordon cin , limon aromalı lavanta, Hindistan cevizi şurubu, limonata, ekşi elma suyu / gorson’s cin lemon-infused lavander. Coconut syrup, lemonade, sour Apple juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "VOTKA MARTINI",
        "price": "645 TL",
        "desc": "Votka martını",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "CIN MARTINI",
        "price": "645 TL",
        "desc": "cin martini",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "NEGRONI",
        "price": "780 TL",
        "desc": "Martini rosso , cin, campari, soda / martini rosso , gin, campari, soda",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BLOODY MARY - KUZULARIN SESİZLİGİ",
        "price": "650 TL",
        "desc": "Smirnoff, domates suyu, acı sos, kereviz sosu, karabiber, limon suyu / Smirnoff, tomato juice, hot sauce, celeriac powder, black pepper, lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "CUBA LIBRE",
        "price": "600 TL",
        "desc": "Rom, cola, taze limon suyu / Rum cola, fresh lemon juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "APPLE MARTINI - YEŞİL YOL",
        "price": "600 TL",
        "desc": "Yeşil elma aromalı Smirnoff, elma suyu / Smirnoff green apple, apple juice",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "PINA COLADA",
        "price": "660 TL",
        "desc": "Rom, Malibu, ananas suyu, süt / Rum, malibu, pineapple juice, milk",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BLACK RUSSIAN - KOYU GECELER",
        "price": "640 TL",
        "desc": "Kahlua, Smirnoff / Kahlua, smirnoff",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LONG ISLAND ICE TEA",
        "price": "2.200 TL",
        "desc": "KOKTEYL SÜRAHİ / COCKTAIL CARAFE",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BAHÇE SANGRIA",
        "price": "1.950 TL",
        "desc": "KOKTEYL SÜRAHİ / COCKTAIL CARAFE ...",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "BAHÇE LİMONATASI / GARDEN LEMONADE",
        "price": "1.900 TL",
        "desc": "KOKTEYL SÜRAHİ / COCKTAIL CARAFE ...",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "LYNCHBURG LEMONADE",
        "price": "1.950 TL",
        "desc": "KOKTEYL SÜRAHİ / COCKTAIL CARAFE ...",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "KIRMIZI LİMON",
        "price": "1.950 TL",
        "desc": "KOKTEYL SÜRAHİ / COCKTAIL CARAFE ...",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "SMIRNOFF VODKA COCKTAİL",
        "price": "690 TL",
        "desc": "KOKTEYL FROZEN / FROZEN WİTH ALCOHOL Çilek , limon, greyfurt, portakal, donuk frambuaz / strawberry, lemon, grapefruit, orange, frozen raspberry",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "ROM COCKTAIL",
        "price": "670 TL",
        "desc": "KOKTEYL FROZEN/ FROZEN WİTH ALCOHOL Çilek , limon, greyfurt, portakal, donuk frambuaz / strawberry, lemon, grapefruit, orange, frozen raspberry",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "MARGARITA",
        "price": "695 TL",
        "desc": "KOKTEYL FROZEN / FROZEN WİTH ALCOHOL Çilek , limon, greyfurt, portakal, donuk frambuaz / strawberry, lemon, grapefruit, orange, frozen raspberry",
        "category": "KOKTEYLLER | COCKTAILS"
      },
      {
        "name": "EFES BİRA şişe 33 cl",
        "price": "245 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES BİRA şişe 50 cl",
        "price": "295 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES BİRA / EFES BEER Fıçı 33 cl",
        "price": "225 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES BİRA / EFES BEER Fıçı 50 cl",
        "price": "285 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES MALT BİRA / EFES MALT BEER Şişe 50 cl",
        "price": "335 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES BİRA / EFES BEER efes özel seri Şişe 50 cl",
        "price": "335 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "EFES BİRA glutensiz 50 cl",
        "price": "450 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BOMONTİ FİLTRESİZ BİRA / BOMONTİ FİLTRESİZ BEER Şişe 50 cl",
        "price": "335 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "MİLLER Şişe 33 cl",
        "price": "360 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "MİLLER Şişe 50 cl",
        "price": "400 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BECKS Şişe 50 cl",
        "price": "375 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BECKS şişe 33 cl",
        "price": "335 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BECKS Fıçı 50 cl",
        "price": "345 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BECKS Fıçı 33 cl",
        "price": "300 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BELFAST şişe 50 cl",
        "price": "335 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "BUD Şişe 33 cl",
        "price": "375 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "AMSTERDAM Şişe 50 cl",
        "price": "550 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "DUVEL Şişe 33 cl",
        "price": "675 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "ERDINGER Şişe 33 cl",
        "price": "550 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "CORONA Şişe 33 cl",
        "price": "475 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "LEFFE BLONDE Şişe 33 cl",
        "price": "525 TL",
        "desc": "",
        "category": "BİRALAR | BEERS"
      },
      {
        "name": "RAKI / RAKİ Rakı Tek",
        "price": "290 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "RAKI / RAKİ RAKİ DOUBLE",
        "price": "450 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "TEQUILA SHOT",
        "price": "270 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "BOMBAY SAPPHIRE SHOT",
        "price": "325 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JACK DANIEL'S SHOT",
        "price": "290 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JAMESON SHOT",
        "price": "290 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JACK DANIEL'S HONEY SHOT",
        "price": "290 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "CAPTAN MORGAN BLACK SHOT",
        "price": "300 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JAGERMAISTER SHOT",
        "price": "270 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "COURVOISIER KONYAK / COGNAC",
        "price": "695 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "J.W RED LABEL SCOTCH WHISKEY",
        "price": "375 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "J&B SCOTCH WHISKEY",
        "price": "350 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "J.W BLACK LABEL SCOTCH WHISKEY",
        "price": "490 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "J.W DOUBLE BLACK SCOTCH WHISKEY",
        "price": "560 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "DIMPLE SCOTCH WHISKEY",
        "price": "550 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "CHIVAS SCOTCH WHISKEY",
        "price": "560 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JACK DANIEL'S AMERICAN WHISKEY",
        "price": "460 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JACK DANIEL'S  + ENERGY AMERICAN WHISKEY",
        "price": "790 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JACK DANIEL'S HONEY AMERICAN WHISKEY",
        "price": "525 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "GENTLEMAN JACK AMERICAN WHISKEY",
        "price": "525 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JIM BEAM AMERICAN WHISKEY",
        "price": "420 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "TALISKER MALT WHISKEY",
        "price": "800 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "GLENFIDDICH 12 YEARS OLD MALT WHISKEY",
        "price": "800 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "GLENLIVET MALT WHISKEY",
        "price": "800 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JAMESON IRISH WHISKEY",
        "price": "460 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "ABSOLUT VOTKA & CİN / VODKA & GIN",
        "price": "480 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "SMIRNOFF VOTKA & CİN / VODKA & GIN",
        "price": "480 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "STOLICHNAYA VOTKA & CİN / VODKA & GIN",
        "price": "480 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "SMIRNOFF+ENERGY VOTKA & CİN / VODKA & GIN",
        "price": "660 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "GORDON'S CİN VOTKA & CİN / VODKA & GIN",
        "price": "500 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "BEEFEATER VOTKA & CİN / VODKA & GIN",
        "price": "580 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "BOMBAY SAPPHIRE VOTKA & CİN / VODKA & GIN",
        "price": "670 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "BACARDİ ROM & VERMUT / RUM & VERMUT",
        "price": "480 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "CAPTAN MORGAN BLACK ROM & VERMUT / RUM & VERMUT",
        "price": "550 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "CAMPARI ROM & VERMUT / RUM & VERMUT",
        "price": "480 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "MARTINI ROM & VERMUT / RUM & VERMUT",
        "price": "450 TL",
        "desc": "Extra dry, Bianco, Rosso",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "BAILEY'S LİKÖR / LIQUER",
        "price": "420 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "SMIRNOFF NORTH LİKÖR / LIQUER",
        "price": "420 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "KAHLUA LİKÖR / LIQUER",
        "price": "450 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "MALIBU LİKÖR / LIQUER",
        "price": "450 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "DISARONNO AMERETTO LİKÖR / LIQUER",
        "price": "450 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "APEROL LİKÖR / LIQUER",
        "price": "490 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JAGER MEISTER LİKÖR / LIQUER",
        "price": "480 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "JAGER + ENERGY LİKÖR / LIQUER",
        "price": "700 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "CARDINAL MELON LİKÖR / LIQUER",
        "price": "480 TL",
        "desc": "",
        "category": "ALKOLLÜ İÇECEKLER | ALCOHOLIC BEVERAGES"
      },
      {
        "name": "ANCYRA (KALECİK KARASI) kadeh / glass",
        "price": "470 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (KALECİK KARASI) 75 cl",
        "price": "2200 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (ÖKÜZGÖZÜ) kadeh / glass",
        "price": "470 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (ÖKÜZGÖZÜ) 75 cl",
        "price": "2200 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (BOĞAZKERE) kadeh / glass",
        "price": "470 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (BOĞAZKERE) 75 cl",
        "price": "2200 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (MERLOT) kadeh / glass",
        "price": "470 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (MERLOT) 75 cl",
        "price": "2200 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (CABARENET - SYRAH) kadeh / glass",
        "price": "470 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "ANCYRA (CABARENET - SYRAH) 75 cl",
        "price": "2200 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "EGEO (CABERNET - SAUVIGNON) 75 cl",
        "price": "3900 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "SELECTION (ÖKÜZGÖZÜ - BOĞAZKERE) 75 cl",
        "price": "3900 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "PRESTIGE (KALECİK KARASI) 75 cl",
        "price": "4250 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "PRESTIGE (ÖKÜZGÖZÜ) 75 cl",
        "price": "4250 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "PRESTIGE (BOĞAZKERE) 75 cl",
        "price": "4250 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "MAISON  (KAVAKLIDERE) LA CROIX LARTIGUE / FRANSA",
        "price": "4500 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "MAISON (KAVAKLIDERE) CHATEAU CLAUD BELLEVUE / FRANSA",
        "price": "3300 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "MAISON (KAVAKLIDERE) LA FOLIE / FRANSA",
        "price": "2800 TL",
        "desc": "Kış Aylarında servis edilir. / Only In Winter Season",
        "category": "KIRMIZI ŞARAP | RED WINES"
      },
      {
        "name": "KAVAKLIDERE MİSKET ( BORNOVA MİSKET ÜZÜMÜ) kadeh / glass",
        "price": "690 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "KAVAKLIDERE MİSKET ( BORNOVA MİSKET ÜZÜMÜ) 75 cl",
        "price": "3350 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "ANCYRA (NARİNCE) kadeh / glass",
        "price": "470 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "ANCYRA (NARİNCE) 75 cl",
        "price": "2200 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "EGEO (SAUVIGNON BLANC) 75 cl",
        "price": "3750 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "SULTANİYE (YARI TATLI ) 75 cl",
        "price": "2490 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "SELECTION (NARİNCE - EMİR) 75 cl",
        "price": "3750 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "COTES D'AVANOS (NARİNCE - CHARDONNAY) 75 cl",
        "price": "4250 TL",
        "desc": "",
        "category": "BEYAZ ŞARAP | WHITE WINES"
      },
      {
        "name": "LAL kadeh / glass",
        "price": "470 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "LAL 75 cl",
        "price": "2200 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "ANCRYRA (BLUSH) kadeh / glass",
        "price": "470 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "ANCRYRA (BLUSH) 75 cl",
        "price": "2200 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "ANCYRA (BLUSH BUZLU) - TAZE MEVSİM MEYVELERİ kadeh / glass",
        "price": "495 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "EGEO ROSE 75 cl",
        "price": "3750 TL",
        "desc": "",
        "category": "ROSE ŞARAP | ROSE WINES"
      },
      {
        "name": "PEMBE KÖPÜK ROSE",
        "price": "2800 TL",
        "desc": "",
        "category": "KÖPÜKLÜ ŞARAP | SPARKLING WINES"
      },
      {
        "name": "ALTINKÖPÜK (NATURAL SPARKLING)",
        "price": "4900 TL",
        "desc": "",
        "category": "KÖPÜKLÜ ŞARAP | SPARKLING WINES"
      },
      {
        "name": "İNCİ DAMLASI",
        "price": "2800 TL",
        "desc": "",
        "category": "KÖPÜKLÜ ŞARAP | SPARKLING WINES"
      },
      {
        "name": "SELECTION (ÖKÜZGÖZÜ) 75 cl - kırmızı şarap / red wines",
        "price": "3900 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      },
      {
        "name": "PRESTIGE (KALECİK KARASI) 75 cl - kırmızı şarap / red wines",
        "price": "4250 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      },
      {
        "name": "PRESTIGE (ÖKÜZGÖZÜ) 75 cl - kırmızı şarap / red wines",
        "price": "4250 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      },
      {
        "name": "EGEO (SAUVIGNON BLANC) 75 cl - beyaz şarap / white wines",
        "price": "3750 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      },
      {
        "name": "SELECTION (NARİNCE - EMİR) 75 cl  - beyaz şarap / white wines",
        "price": "3750 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      },
      {
        "name": "EGEO ROSE 75 cl - rose şarap / rose wines",
        "price": "3750 TL",
        "desc": "",
        "category": "AYIN İNDİRİMLİ (% 25) ŞARAPLARI | MONTHLY WINE SPECIALS (% 25 OFF)"
      }
    ]
  },
  "7287": {
    "name": "BEYKOZ/KAVACIK GECE DÖNERCİSİ",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/gho2/kavacik-gece-donercisi-mahir-usta",
    "sourceName": "Yemeksepeti",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (80 gr.)",
        "price": "500 TL",
        "desc": "Domates, soğan, turşu, patates kızartması",
        "category": "Et Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (100 gr.)",
        "price": "590 TL",
        "desc": "Domates, soğan, turşu, patates kızartması",
        "category": "Et Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (120 gr.)",
        "price": "690 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (150 gr.)",
        "price": "800 TL",
        "desc": "Domates, soğan, turşu, patates kızartması, et döner,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (180 gr.)",
        "price": "1.000 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Kuzu Et Döner (200 gr.)",
        "price": "1.100 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (100 gr.)",
        "price": "590 TL",
        "desc": "Domates, soğan, turşu, patates kızartması",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (120 gr.)",
        "price": "650 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (150 gr.)",
        "price": "800 TL",
        "desc": "Domates, soğan, turşu, patates kızartması, et döner,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (180 gr.)",
        "price": "1.000 TL",
        "desc": "Domates, soğan, turşu, patates,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (200 gr.)",
        "price": "1.100 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner Dürüm (250 gr.)",
        "price": "1.300 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (100 gr.)",
        "price": "550 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (120 gr.)",
        "price": "650 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (150 gr.)",
        "price": "800 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (180 gr.)",
        "price": "1.000 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (250 gr.)",
        "price": "1.300 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Kuzu Et Döner (200 gr.)",
        "price": "1.100 TL",
        "desc": "Domates, soğan, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Et Döner (120 gr.)",
        "price": "700 TL",
        "desc": "120 gr. kuzu et döner. Soğan, domates, turşu, patates kızartması, tandır lavaşı ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (150 gr.)",
        "price": "850 TL",
        "desc": "Soğan, domates, turşu, patates kızartması, tandır ekmek ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (200 gr.)",
        "price": "1.150 TL",
        "desc": "Soğan, domates, turşu, patates kızartması ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tam Ekmek Arası Kuzu Et Döner (150 gr.)",
        "price": "800 TL",
        "desc": "Soğan, domates, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tam Ekmek Arası Kuzu Et Döner (180 gr.)",
        "price": "1.000 TL",
        "desc": "Soğan, domates, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tam Ekmek Arası Kuzu Et Döner (200 gr.)",
        "price": "1.100 TL",
        "desc": "Soğan, domates, turşu,patates,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Tam Ekmek Arası Et Döner (250 gr.)",
        "price": "1.300 TL",
        "desc": "Soğan, domates, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "3/4 Ekmek Arası Et Döner (150 gr.)",
        "price": "800 TL",
        "desc": "150 gr. et döner, soğan, domates, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "3/4 Ekmek Arası Et Döner (180 gr.)",
        "price": "1.000 TL",
        "desc": "180 gr. et döner, soğan, domates, turşu, patates kızartması,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "3/4 Ekmek Arası Et Döner (200 gr.)",
        "price": "1.100 TL",
        "desc": "200 gr. et döner, soğan, domates, turşu, patates,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "3/4 Ekmek Arası Et Döner (250 gr.)",
        "price": "1.300 TL",
        "desc": "250 gr. et döner, soğan, domates, turşu,patates,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Pilav Üstü Kuzu Döner (120 gr.)",
        "price": "750 TL",
        "desc": "Soğan, domates, turşu, patates kızartması, tandır ekmeği, biber turşusu ile",
        "category": "Et Dönerler"
      },
      {
        "name": "Pilav Üstü Kuzu Döner (150 gr.)",
        "price": "900 TL",
        "desc": "Soğan, domates, turşu, patates kızartması ile",
        "category": "Et Dönerler"
      },
      {
        "name": "Pilav Üstü Et Döner (200 gr.)",
        "price": "1.200 TL",
        "desc": "200 gr. kuzu döner. Soğan, domates, turşu, patates kızartması, tandır lavaş ile",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (250 gr.)",
        "price": "1.350 TL",
        "desc": "Tandır lavaşı, patates kızartması, soğan, domates, turşu ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (500 gr.)",
        "price": "2.600 TL",
        "desc": "Tandır lavaşı, patates kızartması, soğan, domates, turşu ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (750 gr.)",
        "price": "3.900 TL",
        "desc": "Tandır lavaşı, patates kızartması, soğan, domates, turşu ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Kuzu Döner (1 kg.)",
        "price": "5.400 TL",
        "desc": "Tandır lavaşı, patates kızartması, soğan, domates, turşu ile,YANINA TURŞU BİBER",
        "category": "Et Dönerler"
      },
      {
        "name": "Hamsiköy Sütlacı",
        "price": "250 TL",
        "desc": "Tek kişilik",
        "category": "Tatlılar"
      },
      {
        "name": "Pepsi (33 cl.)",
        "price": "90 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Pepsi Max (33 cl.)",
        "price": "90 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Tropicana Karışık (33 cl.)",
        "price": "90 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Lipton Ice Tea Limon (33 cl.)",
        "price": "90 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "7UP (33 cl.)",
        "price": "90 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Ekşili Yayık Ayranı (27 cl.)",
        "price": "70 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Acılı Ayran (27 cl.)",
        "price": "70 TL",
        "desc": "Serinletici acılı ayran içeceği pratik pet şişe ambalajında sunulur. Geleneksel lezzet ve modern kolaylığın mükemmel birleşimi.",
        "category": "İçecekler"
      },
      {
        "name": "Özerhisar Ayran (24,5 cl.)",
        "price": "90 TL",
        "desc": "Geleneksel yöntemle fermente edilen Özerhisar ayranı. Taze ve besleyici içeriğiyle serinletici bir içecek.",
        "category": "İçecekler"
      },
      {
        "name": "Soda (20 cl.)",
        "price": "50 TL",
        "desc": "Ferah ve serinletici soda içeceği 20 cl cam şişede sunulmaktadır. Buzlu olarak servis edilir.",
        "category": "İçecekler"
      },
      {
        "name": "Su (50 cl.)",
        "price": "30 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Coca-Cola (1 L.)",
        "price": "170 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "SEK BÜYÜK AYRAN",
        "price": "60 TL",
        "desc": "Serinletici ve besleyici 285 ml büyük ayran. Geleneksel yoğurt içeceği tuz ve su ile hazırlanmış. Soğuk servis edilir.",
        "category": "İçecekler"
      },
      {
        "name": "Plastic Bag",
        "price": "1 TL",
        "desc": "It's compulsory to purchase plastic bags for fixed price 1 TL according to the amendments on Environment Law by the Ministry of Environment, Urbanization and Climate Change. If you require a plastic bag, you should add it to your basket. The amount will be charged to you for each plastic bag.",
        "category": "Poşet"
      }
    ]
  },
  "7289": {
    "name": "SushiCo Zorlu Center",
    "sourceUrl": "https://zorlu-center-sushico.arimenu.com/",
    "sourceName": "SushiCo Zorlu Center QR menüsü (mobil görünüm)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Mochi (Hindistan Cevizi)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Crunchy Calı̇fornı̇a Roll (8 Adet)",
        "price": "860.00 TL",
        "desc": "Surumi Yengeç, avokado,çıtır soğan, teriyaki sos, acılı mayonez Kcal:421",
        "category": "Yeniler"
      },
      {
        "name": "Acılı Sebzeli Tavuk",
        "price": "880.00 TL",
        "desc": "Tavuk but, kapya biber, sivri biber, mantar. Sade Pilav ile servis edilir. Kcal:1259",
        "category": "Yeniler"
      },
      {
        "name": "Mochi (Çilek)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Golden Ebi Roll (8 Adet)",
        "price": "920.00 TL",
        "desc": "Golden Ebi, mango, krem peynir, avokado, tenkasu, yuzu mayonez Kcal:443",
        "category": "Yeniler"
      },
      {
        "name": "Sarımsak Soslu Green Bean",
        "price": "480.00 TL",
        "desc": "Yeşil fasulye, özel sarımsak sos Kcal:316",
        "category": "Yeniler"
      },
      {
        "name": "Hamachı̇ Tropı̇cal Tartar",
        "price": "980.00 TL",
        "desc": "Hamachi Balığı Kcal:401",
        "category": "Yeniler"
      },
      {
        "name": "Hikari Roll (8 Adet)",
        "price": "860.00 TL",
        "desc": "Salatalık, avokado, çıtır patates, hamachi, trüf mantarı, hikari sos Kcal:331",
        "category": "Yeniler"
      },
      {
        "name": "Yeşil Soğanlı Dana Eti",
        "price": "1100.00 TL",
        "desc": "Dana eti , yeşil soğan, Sade Pilav ile servis edilir. Kcal:1427",
        "category": "Yeniler"
      },
      {
        "name": "Susamlı Tavuklu Zenı̇th Salata",
        "price": "640.00 TL",
        "desc": "Susamlı tavuk, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:1070",
        "category": "Yeniler"
      },
      {
        "name": "Baby Bento Menü",
        "price": "714.00 TL",
        "desc": "Susamlı Tavuk, Parmesanlı Mısır Topları(4 Adet), Soft İçecek Kcal: 1389",
        "category": "Yeniler"
      },
      {
        "name": "Matcha Crepe Cake",
        "price": "480.00 TL",
        "desc": "",
        "category": "Yeniler"
      },
      {
        "name": "Çıtır Levrekli Zenı̇th Salata",
        "price": "819.00 TL",
        "desc": "Levrek, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:987",
        "category": "Yeniler"
      },
      {
        "name": "Parmesanlı Mısır Topları",
        "price": "570.00 TL",
        "desc": "Mısır, parmesan peyniri, yuzu mayonez, frenk soğan Kcal:816",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Carpaccio",
        "price": "980.00 TL",
        "desc": "Hamachi Balığı, akdeniz yeşilliği, susam, özel hamchi sosu Kcal:227",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Roll (6 Adet)",
        "price": "580.00 TL",
        "desc": "Hamachi Balığı Kcal:181",
        "category": "Yeniler"
      },
      {
        "name": "Mochi (Çikolata)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Buharda Somonlu Zenı̇th Salata",
        "price": "819.00 TL",
        "desc": "Somon, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:475",
        "category": "Yeniler"
      },
      {
        "name": "Terı̇yakı̇ Tavuk Udon Bowl",
        "price": "890.00 TL",
        "desc": "Udon noodle, kapya biber, yeşil soğan, brokoli, Tavuk but, noodle sos, teriyaki sos, susam Kcal:1245",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Nigiri (2 Adet)",
        "price": "610.00 TL",
        "desc": "Hamachi Balığı Kcal:106",
        "category": "Yeniler"
      },
      {
        "name": "Mango Soslu Denı̇z Mahsullü Salata",
        "price": "882.00 TL",
        "desc": "Yedikule marul , akdeniz yeşilliği, Surimi yengeç, karides, edamame, avokado, mango sos Kcal:487",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Sashimi (12 Adet)",
        "price": "1200.00 TL",
        "desc": "Hamachi Balığı Kcal:176",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Carpaccio",
        "price": "980.00 TL",
        "desc": "Hamachi Balığı Kcal :227",
        "category": "Başlangıçlar"
      },
      {
        "name": "Parmesanlı Mısır Topları",
        "price": "570.00 TL",
        "desc": "Mısır, parmesan peyniri, yuzu mayonez, frenk soğan Kcal :816",
        "category": "Başlangıçlar"
      },
      {
        "name": "Hamachı̇ Tropı̇cal Tartar",
        "price": "980.00 TL",
        "desc": "Hamachi Balığı , Sushi Pilavı , Mango , Avokado , İkura , Nori Cips , Samurai Sos , Shichimi Kcal:414",
        "category": "Başlangıçlar"
      },
      {
        "name": "Crispy green bean tempura",
        "price": "546.00 TL",
        "desc": "Tempura Yeşil Çin Faulyesi, Yanında Tempura Sos, Yuzu Mayonez Kcal:926",
        "category": "Başlangıçlar"
      },
      {
        "name": "Mongolian Chicken",
        "price": "624.00 TL",
        "desc": "özel sosumuzla marine edilmiş ve kızarmış tavuk but, aromatik körili Japon mayonezi Kcal: 1051",
        "category": "Başlangıçlar"
      },
      {
        "name": "Kimchi Cucumber Salad",
        "price": "430.00 TL",
        "desc": "Salatalık, Yeşil Soğan,İnce Havuç,Kimchi Sos,Susam Kcal:110",
        "category": "Başlangıçlar"
      },
      {
        "name": "Golden Ebi Bites",
        "price": "880.00 TL",
        "desc": "Özel teknikle tempuralanmış 3 adet Jumbo Karides, Frenk Soğanı, Lime dilimi ve yuzu mayonez Kcal:536",
        "category": "Başlangıçlar"
      },
      {
        "name": "Somon Carpaccio",
        "price": "980.00 TL",
        "desc": "Somon, goma wakame Kcal :301",
        "category": "Başlangıçlar"
      },
      {
        "name": "Chicken Katsu Finger",
        "price": "680.00 TL",
        "desc": "Pane tavuk göğüs, japon köri sos ile. Kcal: 1215",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Topları",
        "price": "714.00 TL",
        "desc": "Karides, Havuç, Sarımsak, Zencefil, Taze Soğan, Mayonez, Frenk Soğan Kcal:809",
        "category": "Başlangıçlar"
      },
      {
        "name": "Edamame",
        "price": "382.00 TL",
        "desc": "Organik Soya Fasulyesi Kcal :240",
        "category": "Başlangıçlar"
      },
      {
        "name": "Chili Garlic Edamame",
        "price": "410.00 TL",
        "desc": "Organik soya fasülyesi, chilli garlic sos. Kcal:267",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Cipsi",
        "price": "346.00 TL",
        "desc": "Kcal :560",
        "category": "Başlangıçlar"
      },
      {
        "name": "Tavuk Topları",
        "price": "590.00 TL",
        "desc": "ane tavuk köfte, sriracha sos ve tatlı ekşi sos ile. (8 adet) Kcal:839",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Tempura",
        "price": "910.00 TL",
        "desc": "Tempura karides, tempura sebze, tempura sos ile. Kcal:920",
        "category": "Başlangıçlar"
      },
      {
        "name": "Fish & Cips",
        "price": "980.00 TL",
        "desc": "Pane levrek, patates kızartması, acı mayonez ve trüflü mayonez ile. Kcal:1528",
        "category": "Başlangıçlar"
      },
      {
        "name": "Shrimp Bomb",
        "price": "910.00 TL",
        "desc": "Tempura karides, kore acı mayonez. Kcal:1091",
        "category": "Başlangıçlar"
      },
      {
        "name": "Çıtır Karides",
        "price": "910.00 TL",
        "desc": "Pane karides, sriracha sos ve sweet chili sos ile. Kcal:1172",
        "category": "Başlangıçlar"
      },
      {
        "name": "Corn Tempura",
        "price": "616.00 TL",
        "desc": "Tempura mısır, shicimi baharatı ve trüflü mayonez ile. Kcal:775",
        "category": "Başlangıçlar"
      },
      {
        "name": "Trüflü Çin Mantısı",
        "price": "546.00 TL",
        "desc": "Asya sebzeli dana kıymalı Çin mantısı, frenk soğan, susam, trüf mantarı, trüf ve yuzu aromalı sos ile. Kcal:865",
        "category": "Dim-Sum"
      },
      {
        "name": "Dana Etli Gyoza",
        "price": "600.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda japon mantısı, gyoza sos ile.(5 adet) Kcal:780",
        "category": "Dim-Sum"
      },
      {
        "name": "Karides Spring Roll",
        "price": "496.00 TL",
        "desc": "Nefis Çin yufkasına sarılı karidesler ve yuzu mayonez Kcal:593",
        "category": "Dim-Sum"
      },
      {
        "name": "Karidesli Gyoza (5 Adet)",
        "price": "640.00 TL",
        "desc": "Asya sebzeli karides kıymalı buharda japon mantısı, gyoza sos ile. Kcal:729",
        "category": "Dim-Sum"
      },
      {
        "name": "Çıtır Çin Mantısı",
        "price": "560.00 TL",
        "desc": "Asya sebzeli dana kıymalı kızarmış çin mantısı, sriracha sos ve tatlı ekşi sos ile( 4adet) Kcal:1038",
        "category": "Dim-Sum"
      },
      {
        "name": "Çin Böreği",
        "price": "410.00 TL",
        "desc": "Asya sebzeli dana kıymalı kızarmış çin böreği. (2 adet) Kcal:838",
        "category": "Dim-Sum"
      },
      {
        "name": "Buharda Çin Mantısı",
        "price": "560.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda çin mantısı, sarımsak sos ile. (4 adet) Kcal:868",
        "category": "Dim-Sum"
      },
      {
        "name": "Korean Wonton (4 Adet)",
        "price": "598.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda mantı, yer fıstığı, taze soğan, susam, çin acı yağı, salkım biber ile. Kcal:386",
        "category": "Dim-Sum"
      },
      {
        "name": "Tavuklu Bao Burger",
        "price": "688.00 TL",
        "desc": "Köri ile aromalandırılmış tavuk but, köri mayonezli göbek marul salatası, kırmızı soğan turşusu. Kcal:1606",
        "category": "BUN"
      },
      {
        "name": "Tavuklu Bun",
        "price": "730.00 TL",
        "desc": "(2 Ad) Pane tavuk göğüs (trüf mayonez ve acı mayonez ile), kırmızı lahana, kırmızı soğan, kişniş. Kcal:1192",
        "category": "BUN"
      },
      {
        "name": "Bao Burger (karidesli)",
        "price": "794.00 TL",
        "desc": "(2 Ad) Panko ile kızartılmış karides köfte, kimchi soslu salatalık ve trüf mayonez Kcal:1150",
        "category": "BUN"
      },
      {
        "name": "Çıtır Dana Bun",
        "price": "760.00 TL",
        "desc": "Dana Eti, Trüf Mayonez, salatalık salatası, patates, acı mayonez Kcal:1248",
        "category": "BUN"
      },
      {
        "name": "Çıtır Levrekli Bun (2 Adet)",
        "price": "794.00 TL",
        "desc": "Levrek, Sarımsak ve Coleslaw Kcal:1031",
        "category": "BUN"
      },
      {
        "name": "Ördek Bun",
        "price": "870.00 TL",
        "desc": "(2 Ad) Kızarmış ördek, sivri biber, domates, taze soğan. Kcal:935",
        "category": "BUN"
      },
      {
        "name": "Acılı Ekşili Çorba",
        "price": "418.00 TL",
        "desc": "Tavuk göğüs, havuç, beyaz lahana, soya filizi, sirkesi, yumurta, çin acı sos. Kcal:581",
        "category": "Çorbalar"
      },
      {
        "name": "Tavuk Mısır Çorba",
        "price": "418.00 TL",
        "desc": "Tavuk göğüs, mısır, yumurta. Kcal:581",
        "category": "Çorbalar"
      },
      {
        "name": "Buharda Mantılı Çorba",
        "price": "460.00 TL",
        "desc": "Çin Mantısı (3 Ad), taze soğan, yumurta. Kcal:563",
        "category": "Çorbalar"
      },
      {
        "name": "Miso Çorba",
        "price": "460.00 TL",
        "desc": "Miso sos, tofu, yosun, yeşil soğan. / Alkol içerir. Kcal:511",
        "category": "Çorbalar"
      },
      {
        "name": "Tom Yum",
        "price": "498.00 TL",
        "desc": "Tom Yum, Shitake Mantar, Ceri Domates, Lemon Grass, Kırmızı Soğan, Karides Çim Çim (3 Adet),Kişniş, Zencefil, Sarımsak ve Fish Sos Kcal:619",
        "category": "Çorbalar"
      },
      {
        "name": "Tom Ga Kai",
        "price": "880.00 TL",
        "desc": "Aromatik Thai rameni; tavuk göğüs, Nissin noodle, hindistan cevizi sütü, limon çubuğu, shiitake mantarı, kişniş, taze soğan, acı yağ. Kcal: 1829",
        "category": "Ramen"
      },
      {
        "name": "Tavuklu Ramen",
        "price": "880.00 TL",
        "desc": "Tavuk, nissin noodle, shitake mantarı, taze soğan, baby mısır, kişniş, ıspanak, 1/2 Haşlanmış Yumurta. Kcal: 1213",
        "category": "Ramen"
      },
      {
        "name": "Dana Etli Ramen",
        "price": "966.00 TL",
        "desc": "Dana eti, ıspanak, kişniş, shitake mantar, baby mısır, miso, nissin, sarımsak, zencefil, taze soğan ve yumurta Kcal: 1173",
        "category": "Ramen"
      },
      {
        "name": "Karidesli Ramen",
        "price": "980.00 TL",
        "desc": "Jumbo Karides (4 adet), nissin noodle, shitake Mantarı taze soğan, baby mısır, kişniş, ıspanak, 1/2 Haşlanmış Yumurta. Kcal: 1138",
        "category": "Ramen"
      },
      {
        "name": "Mango Soslu Denı̇z Mahsullü Salata",
        "price": "882.00 TL",
        "desc": "Yedikule marul , akdeniz yeşilliği, Surimi yengeç, karides, edamame, avokado, mango sos Kcal:487",
        "category": "Salatalar"
      },
      {
        "name": "Susamlı Tavuklu Zenı̇th Salata",
        "price": "640.00 TL",
        "desc": "Susamlı tavuk, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:1070",
        "category": "Salatalar"
      },
      {
        "name": "Buharda Somonlu Zenı̇th Salata",
        "price": "819.00 TL",
        "desc": "Somon, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:475",
        "category": "Salatalar"
      },
      {
        "name": "Çıtır Levrekli Zenı̇th Salata",
        "price": "819.00 TL",
        "desc": "Levrek, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:987",
        "category": "Salatalar"
      },
      {
        "name": "Sushico Yosun Salatası",
        "price": "714.00 TL",
        "desc": "Karışık yeşillik, yosun, tobiko, salatalık, susam, ponzu sos. Kcal:160",
        "category": "Salatalar"
      },
      {
        "name": "Acı Lahana Salatası",
        "price": "376.00 TL",
        "desc": "Kırmızı lahana, domates, sirke, çin acı sos, limon. Kcal:96",
        "category": "Salatalar"
      },
      {
        "name": "Mhu Shu Tavuk",
        "price": "880.00 TL",
        "desc": "Tavuk, dolmalık biber, kapya biber, havuç, mantar, salatalık, soya filizi Kcal:738",
        "category": "Tavuk"
      },
      {
        "name": "Acılı Sebzeli Tavuk",
        "price": "880.00 TL",
        "desc": "Tavuk but, kapya biber, sivri biber, mantar. Sade Pilav ile servis edilir. Kcal:1259",
        "category": "Tavuk"
      },
      {
        "name": "Tatlı Ekşi Soslu Tavuk",
        "price": "870.00 TL",
        "desc": "Pane tavuk göğüs, ananas, dolmalık biber, kuru soğan, tatlı ekşi sos. Kcal:1195",
        "category": "Tavuk"
      },
      {
        "name": "General Tso Tavuk",
        "price": "880.00 TL",
        "desc": "Pane tavuk but, tatlı ekşi ve çin acı sos. Kcal:1386",
        "category": "Tavuk"
      },
      {
        "name": "Zencefil Soslu Çıtır Tavuk",
        "price": "870.00 TL",
        "desc": "Pane tavuk göğüs, zencefil, taze soğan, salkım biber, çin acı sos. Kcal:1014",
        "category": "Tavuk"
      },
      {
        "name": "Kırmızı Köri Soslu Tavuk",
        "price": "890.00 TL",
        "desc": "Tavuk but, kırmızı köri, hindistan cevizi sütü, dolmalık biber, kapya biber, taze soğan, shitake mantar, kuru soğan, 150 Gr Sade pilav ile. Kcal:1373",
        "category": "Tavuk"
      },
      {
        "name": "Mançuryan Usulü Tavuk",
        "price": "880.00 TL",
        "desc": "Pane tavuk göğüs, kabak, shitake mantar, sivri biber, soya filizi, yer fıstığı, salkım biber, çin acı sos. Kcal:1081",
        "category": "Tavuk"
      },
      {
        "name": "Chicken Katsu Bowl",
        "price": "890.00 TL",
        "desc": "Tavuk, Pilav, Coleslaw Salad Kcal:1720",
        "category": "Tavuk"
      },
      {
        "name": "Ballı Kore Tavuk",
        "price": "880.00 TL",
        "desc": "Ballı ve yer fıstıklı, Gochujang soslu Kore tavuk but Kcal:1209",
        "category": "Tavuk"
      },
      {
        "name": "Rabokki",
        "price": "726.00 TL",
        "desc": "Rice cake, noodle, Beyaz lahana, havuç, Taze soğan, Kcal:631",
        "category": "Kore"
      },
      {
        "name": "Tavuklu Rabokki",
        "price": "770.00 TL",
        "desc": "Tavuk, pirinç kek, noodle, beyaz lahana, havuç, taze soğan, sarımsak, zencefil, taze soğan ve susam Kcal:763",
        "category": "Kore"
      },
      {
        "name": "Cheesy Tteokbokki",
        "price": "660.00 TL",
        "desc": "Pirinç keki, beyaz lahana, havuç, sarımsak, zencefil, kore acı sos, susam, mozerella Kcal:601",
        "category": "Kore"
      },
      {
        "name": "Korean Wonton (4 Adet)",
        "price": "598.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda mantı, yer fıstığı, taze soğan, susam, çin acı yağı, salkım biber ile. Kcal:386",
        "category": "Kore"
      },
      {
        "name": "Kore Usulü Tavuklu Bulgogi Udon",
        "price": "914.00 TL",
        "desc": "Tavuk, Shitake Mantarı, Kuru Soğan, Sarımsak, Zencefil ve Yumurta / Üzerine Frenk Soğanı ve Susam Kcal:672",
        "category": "Kore"
      },
      {
        "name": "Kore Usulü Bulgogi Dana Udon",
        "price": "980.00 TL",
        "desc": "Dana Eti, Udon, shitake mantar, kuru soğan, sarımsak, yumurta, renk soğan, beyaz susam Kcal:716",
        "category": "Kore"
      },
      {
        "name": "Yeşil Soğanlı Dana Eti",
        "price": "1100.00 TL",
        "desc": "Dana eti , yeşil soğan, Sade Pilav ile servis edilir. Kcal:1427",
        "category": "Dana Eti"
      },
      {
        "name": "Çıtır Patlıcanlı Dana Eti",
        "price": "1200.00 TL",
        "desc": "Dana eti, pane patlıcan, taze soğan, sirke, salkım biber, chilli garlic sos, Kcal:1623",
        "category": "Dana Eti"
      },
      {
        "name": "Limon Soslu Çıtır Dana Eti",
        "price": "1220.00 TL",
        "desc": "Pane dana eti, limon, susam. Kcal:1977",
        "category": "Dana Eti"
      },
      {
        "name": "İnce Kıyım Biberli Dana",
        "price": "1200.00 TL",
        "desc": "Dana Eti, sivri biber, havuç Kcal:940",
        "category": "Dana Eti"
      },
      {
        "name": "Yeşil Biberli Dana Eti",
        "price": "1100.00 TL",
        "desc": "Dana eti, dolmalık biber, havuç, sarımsak / 150 Gr Sade pilav ile servis edilir Kcal:1253",
        "category": "Dana Eti"
      },
      {
        "name": "Shitake Mantarlı Dana Eti",
        "price": "1220.00 TL",
        "desc": "Dana eti, kabak, shitake mantarı, sivri biber, fıstık, kurutulmuş kırmızı biber, çin acı sos, 150 Gr Sade pilav ile. Kcal:1355",
        "category": "Dana Eti"
      },
      {
        "name": "Tatlı Ekşi Soslu Karides",
        "price": "1230.00 TL",
        "desc": "Jumbo Karides, dolmalık biber, kuru soğan, ananas, tatlı ekşi sos. Kcal:966",
        "category": "Deniz Mahsülleri"
      },
      {
        "name": "Zencefilli Çıtır Levrek",
        "price": "1200.00 TL",
        "desc": "Pane levrek, brokoli, shitake mantarı, taze soğan, salkım biber. Kcal:758",
        "category": "Deniz Mahsülleri"
      },
      {
        "name": "Kung Pao Karides",
        "price": "1230.00 TL",
        "desc": "Jumbo Karides, sivri biber, kapya biber, taze soğan, kırmızı soğan, tuzlu fıstık Kcal:853",
        "category": "Deniz Mahsülleri"
      },
      {
        "name": "Kızarmış Pekin Ördeği (Çeyrek)",
        "price": "1360.00 TL",
        "desc": "Ördek, salatalık, taze soğan, ördek sos, 5 adet pancake ile. Kcal:1488",
        "category": "Ördek"
      },
      {
        "name": "Ördek Bun",
        "price": "870.00 TL",
        "desc": "Kızarmış ördek, sivri biber, domates, taze soğan. Kcal:935",
        "category": "Ördek"
      },
      {
        "name": "Kızarmış Pekin Ördeği (Yarım)",
        "price": "2600.00 TL",
        "desc": "Ördek, salatalık, taze soğan, ördek sos, 10 adet pancake ile. Kcal:2672",
        "category": "Ördek"
      },
      {
        "name": "Ördek Donburi",
        "price": "980.00 TL",
        "desc": "Ördek, sivri biber, yeşil soğan, domates, çin acı sos, schimi baharatı, haşlanmış pilav. Kcal:1333",
        "category": "Ördek"
      },
      {
        "name": "Sarımsak Soslu Green Bean",
        "price": "480.00 TL",
        "desc": "Yeşil fasulye, özel sarımsak sos Kcal:316",
        "category": "Sebzeler"
      },
      {
        "name": "Karışık Sebze",
        "price": "480.00 TL",
        "desc": "Baby mısır, brokoli, havuç, kabak, beyaz lahana, pakçoy, shitake mantar, soya filizi, kapya biber, Green Bean ve Pırasa Kcal:482",
        "category": "Sebzeler"
      },
      {
        "name": "Acılı Karışık Sebze",
        "price": "480.00 TL",
        "desc": "Baby mısır, brokoli, havuç, kabak, beyaz lahana, pakçoy, shitake mantar, soya filizi, kapya biber, çin acı sos, Green Bean ve Pırasa Kcal:494",
        "category": "Sebzeler"
      },
      {
        "name": "Sarımsak Soslu Brokoli",
        "price": "480.00 TL",
        "desc": "Brokoli, havuç, sarımsak. Kcal:306",
        "category": "Sebzeler"
      },
      {
        "name": "Siyah Sarımsaklı Udon",
        "price": "860.00 TL",
        "desc": "Ispanak, kapya biber, siyah sarımsak, baby mısır, shitake mantar Kcal:476",
        "category": "Noodle"
      },
      {
        "name": "Siyah Sarımsaklı Dana Udon",
        "price": "980.00 TL",
        "desc": "Dana Eti, ıspanak, kapya biber, siyah sarımsak, baby mısır, havuç, shitake mantar, Kcal:648",
        "category": "Noodle"
      },
      {
        "name": "Kore Usulü Tavuklu Bulgogi Udon",
        "price": "914.00 TL",
        "desc": "Udon, tavuk, shitake mantar, kuru soğan, yumurta, susam. Kcal:672",
        "category": "Noodle"
      },
      {
        "name": "Kore Usulü Bulgogi Dana Udon",
        "price": "980.00 TL",
        "desc": "Udon, dana eti, shitake mantar, kuru soğan, yumurta, susam. Kcal:716",
        "category": "Noodle"
      },
      {
        "name": "Mamma Bao Noodle",
        "price": "966.00 TL",
        "desc": "Kalın Şerit Makarna, dana eti, ıspanak, kırmızı soğan turşusu, susamlı trüflü acı sos Kcal:655",
        "category": "Noodle"
      },
      {
        "name": "Sade Noodle",
        "price": "548.00 TL",
        "desc": "Erişte, noodle sos. Kcal:624",
        "category": "Noodle"
      },
      {
        "name": "Sebzeli Noodle",
        "price": "684.00 TL",
        "desc": "Erişte, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:497",
        "category": "Noodle"
      },
      {
        "name": "Tavuklu Noodle",
        "price": "754.00 TL",
        "desc": "Erişte, tavuk göğüs, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:629",
        "category": "Noodle"
      },
      {
        "name": "Dana Etli Noodle",
        "price": "850.00 TL",
        "desc": "Erişte, dana eti, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:667",
        "category": "Noodle"
      },
      {
        "name": "Karidesli Noodle",
        "price": "914.00 TL",
        "desc": "Erişte, 7 adet jumbo karides, brokoli, havuç, soya filizi, yeşil soğan,lahana, kapya biber, noodle sos. Kcal:596",
        "category": "Noodle"
      },
      {
        "name": "Körili Singapur Noodle",
        "price": "924.00 TL",
        "desc": "Erişte, tavuk göğüs, 3 adet jumbo karides, brokoli, havuç, salatalık, soya filizi, yeşil soğan, kapya biber, yumurta, körili noodle sos. Kcal:646",
        "category": "Noodle"
      },
      {
        "name": "Pad Thai Tavuk",
        "price": "880.00 TL",
        "desc": "Vermicelli Pirinç eriştesi, tavuk göğüs, soya filizi, taze soğan, fıstık, yumurta, lime ve pul biber ile. Kcal:660",
        "category": "Noodle"
      },
      {
        "name": "Pad Thai Karides",
        "price": "980.00 TL",
        "desc": "Vermicelli Pirinç eriştesi, karides, soya filizi, taze soğan, fıstık, yumurta, lime ve pul biber ile. Kcal:649",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Sebzeli Noodle",
        "price": "714.00 TL",
        "desc": "Nissin noodle, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:428",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Tavuklu Noodle",
        "price": "770.00 TL",
        "desc": "Nissin noodle, tavuk göğüs, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:560",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Dana Etli Noodle",
        "price": "880.00 TL",
        "desc": "Nissin noodle, dana eti, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:601",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Karidesli Noodle",
        "price": "940.00 TL",
        "desc": "Nissin noodle, 7 adet jumbo karides, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal: 487",
        "category": "Noodle"
      },
      {
        "name": "Sade Pilav",
        "price": "410.00 TL",
        "desc": "Buharda pişmiş basmati pilavı. 300 Gr Kcal:390",
        "category": "Pilav"
      },
      {
        "name": "Sebzeli Pilav",
        "price": "494.00 TL",
        "desc": "Buharda pişmiş basmati , bezelye, havuç, mısır, yeşil soğan. beyaz ve kırmızı lahana Kcal:453",
        "category": "Pilav"
      },
      {
        "name": "Sade Pilav 150 Gr",
        "price": "240.00 TL",
        "desc": "Buharda pişmiş basmati pilavı. Kcal:195",
        "category": "Pilav"
      },
      {
        "name": "Yumurtalı Pilav",
        "price": "520.00 TL",
        "desc": "Buharda pişmiş basmati ,yumurta, bezelye, havuç, mısır, yeşil soğan Kcal:483",
        "category": "Pilav"
      },
      {
        "name": "Tavuklu Pilav",
        "price": "620.00 TL",
        "desc": "Buharda pişmiş basmati ,tavuk, yumurta, bezelye, havuç, mısır, yeşil soğan Kcal:549",
        "category": "Pilav"
      },
      {
        "name": "Dana Etli ve Körili Pilav",
        "price": "720.00 TL",
        "desc": "Buharda pişmiş basmati , dana eti, bezelye, yumurta, mantar, havuç, mısır, yeşil soğan, köri, Yumurta. Kcal:569",
        "category": "Pilav"
      },
      {
        "name": "Dana Etli Pilav",
        "price": "720.00 TL",
        "desc": "Buharda pişmiş basmati , dana eti, bezelye, yumurta, havuç, mısır, yeşil soğan Kcal:588",
        "category": "Pilav"
      },
      {
        "name": "Thai Usulü Ananaslı Pilav",
        "price": "700.00 TL",
        "desc": "Buharda pişmiş basmati, ananas, kaju, bezelye, havuç, mısır, yeşil soğan, beyaz ve kırmızı lahana, köri. Kcal:582",
        "category": "Pilav"
      },
      {
        "name": "Karidesli Pilav",
        "price": "838.00 TL",
        "desc": "Buharda pişmiş basmati , karides, bezelye, yumurta, havuç, mısır, yeşil soğan, Kcal:582",
        "category": "Pilav"
      },
      {
        "name": "Hamachi Nigiri (2 Adet)",
        "price": "610.00 TL",
        "desc": "Hamachi Balığı 2 adet Kcal:106",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hamachi Sashimi (12 Adet)",
        "price": "1200.00 TL",
        "desc": "Hamachi Balığı Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hot salmon nigiri",
        "price": "484.00 TL",
        "desc": "Samurai Sos, Teriyaki Sos, Goma wakame, susam (Pürmüzlenmiş) 2 Adet Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Tamago",
        "price": "298.00 TL",
        "desc": "Omlet 2 Adet Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Saba",
        "price": "386.00 TL",
        "desc": "Uskumru",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Maguro",
        "price": "610.00 TL",
        "desc": "Ton 2 Adet Kcal:106",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Kani",
        "price": "400.00 TL",
        "desc": "Surimi 2 Adet Kcal:84",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Toro",
        "price": "630.00 TL",
        "desc": "Yağlı Ton 2 Adet Kcal:130",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Suzuki",
        "price": "398.00 TL",
        "desc": "Levrek 2 Adet Kcal:92",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake",
        "price": "450.00 TL",
        "desc": "Somon 2 Adet Kcal:124",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake Avokado",
        "price": "460.00 TL",
        "desc": "Somon ve Avokado 2 adet Kcal:156",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Ebi",
        "price": "460.00 TL",
        "desc": "Karides 2 adet Kcal:90",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Unagi",
        "price": "788.00 TL",
        "desc": "Yılan Balığı 2 adet Kcal:148",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Ikura",
        "price": "788.00 TL",
        "desc": "Balık Yumurtası 2 adet Kcal:140",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Nigiri Mix 5 Adet",
        "price": "1040.00 TL",
        "desc": "",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake Sashimi (12 adet)",
        "price": "1200.00 TL",
        "desc": "120 gr Somon / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir Kcal:250",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Karışık Sashimi (12 adet)",
        "price": "1260.00 TL",
        "desc": "3 Maguro, 3 Somon, 2 Ebi, 2 Levrek, 2 Uskumru / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Maguro Sashimi (12 adet)",
        "price": "1260.00 TL",
        "desc": "120 gr Ton / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake & Maguro Sashimi (12 adet)",
        "price": "1260.00 TL",
        "desc": "6 Maguro, 6 Somon / Soya Sosu, Wasabi ve Zencefil Turşusu ile servis edilmektedir",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hamachi Roll (6 Adet)",
        "price": "580.00 TL",
        "desc": "Hamachi Balığı Kcal:181",
        "category": "Sushi Rolls"
      },
      {
        "name": "Kappa Roll",
        "price": "368.00 TL",
        "desc": "Salatalık (6 adet) Kcal:128",
        "category": "Sushi Rolls"
      },
      {
        "name": "Maguro Roll",
        "price": "616.00 TL",
        "desc": "Ton (6 adet) Kcal:181",
        "category": "Sushi Rolls"
      },
      {
        "name": "Ebi Roll",
        "price": "570.00 TL",
        "desc": "Karides (6 adet) Kcal:151",
        "category": "Sushi Rolls"
      },
      {
        "name": "Kani Roll",
        "price": "500.00 TL",
        "desc": "Surimi (6 Adet) Kcal:140",
        "category": "Sushi Rolls"
      },
      {
        "name": "Sake Roll",
        "price": "560.00 TL",
        "desc": "Somon (6 adet) Kcal:206",
        "category": "Sushi Rolls"
      },
      {
        "name": "Unagi Roll",
        "price": "746.00 TL",
        "desc": "Yılan Balığı (6 adet) Kcal:212",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Ebi Roll",
        "price": "578.00 TL",
        "desc": "Karides ve Avokado (6 adet) Kcal:199",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Sake Roll",
        "price": "570.00 TL",
        "desc": "Somon ve Avokado (6 adet) Kcal:254",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Roll",
        "price": "400.00 TL",
        "desc": "(6 adet) Kcal:219",
        "category": "Sushi Rolls"
      },
      {
        "name": "Lord Of The Rolls (22 Parça)",
        "price": "2680.00 TL",
        "desc": "Trüflü Ebi Tempura Roll, Tokyo Drift Roll, Dragon Roll Kcal: 1598",
        "category": "Set Menüler"
      },
      {
        "name": "Hot'n Roll Set (20 Adet)",
        "price": "2530.00 TL",
        "desc": "Zen Roll 8 parça, Tokyo Drift roll 8 parça, Hot Salmon Nigiri 4 adet Kcal: 1374",
        "category": "Set Menüler"
      },
      {
        "name": "First Kiss Set (24 Adet)",
        "price": "2380.00 TL",
        "desc": "Kibuka Roll 8 parça, Mizu Roll 8 parça, Tsunami Roll 8 parça Kcal: 1483",
        "category": "Set Menüler"
      },
      {
        "name": "Best Of (22 Parça)",
        "price": "2250.00 TL",
        "desc": "California Roll 8, Philly Roll 8, Sake Roll 6 Kcal: 863",
        "category": "Set Menüler"
      },
      {
        "name": "California Dream",
        "price": "1660.00 TL",
        "desc": "16 Parça/ California Roll 4, Spicy California Roll 4, Sesame California Roll 4, Black Sesame California Roll 4 Kcal: 859",
        "category": "Set Menüler"
      },
      {
        "name": "Salmon Dream",
        "price": "1550.00 TL",
        "desc": "(16 parça) Philadelphia Roll 4, Spicy Philadelphia Roll 4, Tobikko Philadelphia Roll 4, Black Sesame Philadelphia Roll 4 Kcal:1044",
        "category": "Set Menüler"
      },
      {
        "name": "Sushi King",
        "price": "2000.00 TL",
        "desc": "15 Parça + Edamame/ Sake Roll 3, Kani Roll 3, California Roll 3, Maguro 1, Suzuki 1, Sake 1, Ebi 1, Saba 1, Kani 1 Kcal:785",
        "category": "Set Menüler"
      },
      {
        "name": "Salmon Lovers",
        "price": "2300.00 TL",
        "desc": "20 Parça/ San Diego Roll 6, Philadelphia Roll 6, Sake Roll 6, Sake Nigiri 2 Kcal: 931",
        "category": "Set Menüler"
      },
      {
        "name": "Sushi Prince 1",
        "price": "2980.00 TL",
        "desc": "25 Parça/ California Roll 3, Spicy California Roll 3, Sake Roll 3, Kappa Roll 3, Crunchy Roll 5, Sake Nigiri 2, Suzuki Nigiri 2, Kani Nigiri 2, Ebi Nigiri 2, SushiCo Yosun Salatası Kcal:1141",
        "category": "Set Menüler"
      },
      {
        "name": "Veggie Set Menü",
        "price": "1390.00 TL",
        "desc": "Veggie Roll 8, Avocado Roll 3, Takuan Roll 3, Tamago Nigiri 2, Goma Wakame (16 adet) Kcal:798",
        "category": "Set Menüler"
      },
      {
        "name": "Terı̇yakı̇ Tavuk Udon Bowl",
        "price": "890.00 TL",
        "desc": "Udon noodle, kapya biber, yeşil soğan, brokoli, Tavuk but, noodle sos, teriyaki sos, susam Kcal:1515",
        "category": "Poke Bowl"
      },
      {
        "name": "Salmon Poke Bowl",
        "price": "1260.00 TL",
        "desc": "Sushi Pilavı, Somon, Avokado, İç Edamame, Wakame, Mayonez(Somon),Schimi baharatı/ Soya Sosu ile servis edilmektedir. Kcal:598",
        "category": "Poke Bowl"
      },
      {
        "name": "Teriyaki Somon Bowl",
        "price": "1200.00 TL",
        "desc": "Teriyaki soslu kızarmış somon, avokado, pilav, nori cips ve acı lahana salatası Kcal:1239",
        "category": "Poke Bowl"
      },
      {
        "name": "Salmon & Maguro Poke Bowl",
        "price": "1260.00 TL",
        "desc": "Sushi Pilavı, Somon, Maguro, Edamame, Yosun Salatası, Avokado, Mayonez, Schimi baharatı / Soya Sosu ile servis edilmektedir. Kcal:573",
        "category": "Poke Bowl"
      },
      {
        "name": "Ördek Donburi",
        "price": "980.00 TL",
        "desc": "Ördek,İnce Kıyım Yeşil Soğan,İnce Kıyım Domates, İnce Kıyım Sivri Biber, Schimi Baharatı ve Kuru Soğan / Sos ile servis edilmemektedir. Kcal:1063",
        "category": "Poke Bowl"
      },
      {
        "name": "Chicken Katsu Bowl",
        "price": "890.00 TL",
        "desc": "Pane tavuk göğüs, pilav, coleslaw salad, japon köri sos ile. Kcal:1450",
        "category": "Poke Bowl"
      },
      {
        "name": "Dana Etli Bowl",
        "price": "1080.00 TL",
        "desc": "sebzeli pilav, dana eti, nori cipsi, biber, kırmızı soğan, soya filizi Kcal:884",
        "category": "Poke Bowl"
      },
      {
        "name": "SushiCo Special 1",
        "price": "1240.00 TL",
        "desc": "California Roll, Sake Roll / Dışı Susam Kaplı, 1 Adet Coca-Cola",
        "category": "Özel Menü"
      },
      {
        "name": "SushiCo Special 2",
        "price": "1386.00 TL",
        "desc": "California Roll, Sake Roll / Dışı Susam Kaplı, 1 Kadeh Şarap",
        "category": "Özel Menü"
      },
      {
        "name": "Sushi Keyfi 1",
        "price": "2800.00 TL",
        "desc": "California Roll, Philadelphia Roll, Dragon Roll, Kani Roll, 2 Adet Coca-Cola",
        "category": "Özel Menü"
      },
      {
        "name": "Sushi Keyfi 2",
        "price": "3300.00 TL",
        "desc": "California Roll, Philadelphia Roll, Dragon Roll, Kani Roll, 2 Kadeh Şarap",
        "category": "Özel Menü"
      },
      {
        "name": "Sushi Banda",
        "price": "590.00 TL",
        "desc": "Tempura Somon Kcal: 239",
        "category": "Çocuk Menü"
      },
      {
        "name": "Baby Shark Roll (8 Adet)",
        "price": "714.00 TL",
        "desc": "Pankolu Levrek, Mayonez, Kıtır patates Kcal:387",
        "category": "Çocuk Menü"
      },
      {
        "name": "Çocuk Menüsü 1",
        "price": "1100.00 TL",
        "desc": "Sushi Banda (6 adet),Çıtır Levrek, Sebzeli Noodle, Mozaik Roll (2 adet)Fuse Tea Veya Cappy",
        "category": "Çocuk Menü"
      },
      {
        "name": "Baby Bento Menü",
        "price": "714.00 TL",
        "desc": "Susamlı Tavuk, Parmesanlı Mısır Topları(4 Adet), Soft İçecek Kcal:1389",
        "category": "Çocuk Menü"
      },
      {
        "name": "Çocuk Menüsü 2",
        "price": "1100.00 TL",
        "desc": "Sebzeli Erişte, Çıtır Mantı 2 Adet, Tavuk Topları, Ballı Kızarmış Muz,Fustea veya Cappy Kcal: 1944",
        "category": "Çocuk Menü"
      },
      {
        "name": "Bento Menü 1",
        "price": "1500.00 TL",
        "desc": "Edamame, Trüflü Ebi Tempura Roll (8 adet), Philly Roll (8 adet), Hot Salmon Nigiri (2 adet), Coca-Cola Kcal:1306",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento",
        "price": "1240.00 TL",
        "desc": "Edamame, Dana Etli Gyoza (3 adet), Seçeceğiniz 1 Special Roll, Coca-Cola / Unagi içeren ürünler için +10 TL eklenir",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 2",
        "price": "1100.00 TL",
        "desc": "1 adet çin böreği, sebzeli noodle, mançuryan tavuk Kcal: 1209",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 3",
        "price": "1150.00 TL",
        "desc": "Çıtır Çin Mantısı (2 adet) / Karışık Sebzeli Dana Eti, Körili Sebzeli Pilav / Coca-Cola",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 5",
        "price": "1250.00 TL",
        "desc": "Sebzeli Egg Noodle 1/2 pors, Acı Lahana Salatası 1/2 pors, seçeceğiniz bir Cooked Roll ile",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 6",
        "price": "990.00 TL",
        "desc": "Levrek Bun 2 adet, Fresh Kimchi Salad 1 pors Kcal:1141",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 2",
        "price": "1260.00 TL",
        "desc": "Çıtır Çin Mantısı (2 adet), Zencefil Soslu Çıtır Tavuk, Sebzeli Noodle, Acı Lahana Salatası, Coca-Cola *12.00-17.00 arası geçerlidir Kcal:1010",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 3",
        "price": "1500.00 TL",
        "desc": "Edamame, Sesame Maki Roll (6 adet), California Roll (6 adet), Sake Roll (6 adet), Coca-Cola *12.00-22.00 arası geçerlidir Kcal:762",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 4",
        "price": "1500.00 TL",
        "desc": "Tavuk Topları (4 adet), Sebzeli Noodle, Ebi Ten Roll (5 adet), Sake Ten Roll (3 adet), Coca-Cola - (Pişmiş roller bulunur) *12.00-22.00* arası geçerlidir Kcal:1217",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 5",
        "price": "1500.00 TL",
        "desc": "California Roll (6 adet), Philadelphia Roll (6 adet), Kappa Roll (6 adet), SushiCo Yosun Salatası, Coca-Cola Kcal:689",
        "category": "Bento Menü"
      },
      {
        "name": "Hikari Roll (8 Adet)",
        "price": "860.00 TL",
        "desc": "Salatalık, avokado, çıtır patates, hamachi, trüf mantarı, hikari sos Kcal:331",
        "category": "Special Roll"
      },
      {
        "name": "Crunchy Calı̇fornı̇a Roll (8 Adet)",
        "price": "860.00 TL",
        "desc": "Surumi Yengeç, avokado,çıtır soğan, teriyaki sos, acılı mayonez Kcal:421",
        "category": "Special Roll"
      },
      {
        "name": "Mizu Roll",
        "price": "856.00 TL",
        "desc": "Somon, maguro, mango/ salatalık, krem peynir, yuzu mayonez, ikura Kcal:489",
        "category": "Special Roll"
      },
      {
        "name": "Sesame Maki Roll",
        "price": "866.00 TL",
        "desc": "Karides, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Susam (8 adet) Kcal:277",
        "category": "Special Roll"
      },
      {
        "name": "Süper Salmon Roll (8 Adet)",
        "price": "878.00 TL",
        "desc": "Somon, krem paynir, salatalık / Kızarmış panko, yuzu mayonez Kcal:555",
        "category": "Special Roll"
      },
      {
        "name": "Osaka Roll (8 adet)",
        "price": "860.00 TL",
        "desc": "Avokado, salatalık, krem peynir/ pürmüzlenmiş somon, goma wakame, siyah ve beyaz susam, teriyaki sos. Kcal:419",
        "category": "Special Roll"
      },
      {
        "name": "Kimchi Tuna Roll (8 adet)",
        "price": "850.00 TL",
        "desc": "Salatalık, avokado/ maguro, taze soğan, kimchi sos, frenk soğanı. Kcal:227",
        "category": "Special Roll"
      },
      {
        "name": "California Roll",
        "price": "860.00 TL",
        "desc": "Surimi Yengeç, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Tobikko (8 adet) Kcal:303",
        "category": "Special Roll"
      },
      {
        "name": "Spicy California Roll",
        "price": "860.00 TL",
        "desc": "Surimi Yengeç, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Tobikko ve Acı Baharat (8 adet) Kcal:309",
        "category": "Special Roll"
      },
      {
        "name": "Philadelphia Roll",
        "price": "860.00 TL",
        "desc": "Somon, Kıvırcık, Salatalık, Krem Peynir / Dışı Susam (8 adet) Kcal:284",
        "category": "Special Roll"
      },
      {
        "name": "Spicy Philadelphia Roll",
        "price": "860.00 TL",
        "desc": "Somon, Kıvırcık, Salatalık, Krem Peynir / Dışı Acı Baharat (8 adet) Kcal:338",
        "category": "Special Roll"
      },
      {
        "name": "Ebi California Roll",
        "price": "866.00 TL",
        "desc": "Karides, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Masago (8 adet) Kcal:330",
        "category": "Special Roll"
      },
      {
        "name": "San Diego Roll",
        "price": "850.00 TL",
        "desc": "Somon, Avokado, Salatalık / Dışı Masago (6 adet) Kcal:317",
        "category": "Special Roll"
      },
      {
        "name": "Mango Roll",
        "price": "880.00 TL",
        "desc": "Somon, Avokado, Krem Peynir / Dışı Mango & Masago (8 adet) Kcal:342",
        "category": "Special Roll"
      },
      {
        "name": "Crunchy Roll",
        "price": "850.00 TL",
        "desc": "Yengeç Salatası, Mayonez / Dışı Tobikko (5 adet) Kcal:226",
        "category": "Special Roll"
      },
      {
        "name": "Rainbow Roll",
        "price": "866.00 TL",
        "desc": "Surimi Yengeç, Salatalık / Dışı Somon, Avokado, Ton Balığı, Levrek (6 adet) Kcal:268",
        "category": "Special Roll"
      },
      {
        "name": "Veggie Roll",
        "price": "690.00 TL",
        "desc": "Green Bean tempura, Avokado, Havuç, Salatalık, Kıvırcık / Dışı Susam (8 adet) Kcal:283",
        "category": "Special Roll"
      },
      {
        "name": "Tiger Roll",
        "price": "890.00 TL",
        "desc": "Yılan Balığı, Avokado, Salatalık, Krem Peynir, Acı Sos / Dışı Karides (5 adet) Kcal:321",
        "category": "Special Roll"
      },
      {
        "name": "Two Way Salmon Roll",
        "price": "866.00 TL",
        "desc": "Somon, Salatalık, Krem Peynir / Dışı Pürmüzlenmiş Somon, Ponzu Sos, Teriyaki Sos ve Acı Sos ile (5 adet) Kcal:355",
        "category": "Special Roll"
      },
      {
        "name": "Exotic Roll 8 adet",
        "price": "690.00 TL",
        "desc": "Avokado / Mango Kcal:265",
        "category": "Special Roll"
      },
      {
        "name": "Riki Roll (8pcs)",
        "price": "900.00 TL",
        "desc": "Tempura levrek, avokado,krem peynir/ dışı yuzulu mayonez, pırasa kıtırı Kcal:458",
        "category": "Cooked Roll"
      },
      {
        "name": "Tsunami Roll",
        "price": "920.00 TL",
        "desc": "Tempura somon, salatalık, avokado/ lezzetlendirilmiş panko, samurai sos, mikro yeşillik Kcal:455",
        "category": "Cooked Roll"
      },
      {
        "name": "Corn Tempura Roll (8 adet)",
        "price": "920.00 TL",
        "desc": "Tempura karides, salatalık, avokado /dışı corn tempura, trüflü mayonez ve schimi baharatı Kcal:579",
        "category": "Cooked Roll"
      },
      {
        "name": "Zen Roll (8 adet)",
        "price": "920.00 TL",
        "desc": "Tempura karides, avokado/ dışı trüf mantar dilimleri, trüflü mayonez,schimi baharatı Kcal:382",
        "category": "Cooked Roll"
      },
      {
        "name": "Yuzu Special Roll",
        "price": "920.00 TL",
        "desc": "Kızarmış Levrek, Salatalık, Avokado, / Dışı pürmüzlenmiş Levrek, mikro filizi, tobikko, yuzu sos Kcal:391",
        "category": "Cooked Roll"
      },
      {
        "name": "Kibuka Roll (8 pcs)",
        "price": "900.00 TL",
        "desc": "Tempura karides, avokado, takuan/dışı pürmüzlenmiş somon, acılı mayonez,soğan turşusu, beyaz ve siyah susam Kcal:539",
        "category": "Cooked Roll"
      },
      {
        "name": "Sake Teriyaki Roll (8 adet)",
        "price": "900.00 TL",
        "desc": "Teriyaki sos ile pişirilmiş somon, salatalık, avokado/ tenkasu, yuzu mayonez, teriyaki sos. Kcal:472",
        "category": "Cooked Roll"
      },
      {
        "name": "Golden Ebi Roll (8 Adet)",
        "price": "920.00 TL",
        "desc": "Golden Ebi, mango, krem peynir, avokado, tenkasu, yuzu mayonez (acılı) Kcal:443",
        "category": "Cooked Roll"
      },
      {
        "name": "Sake Ten Roll",
        "price": "900.00 TL",
        "desc": "Kızarmış Somon, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Masago (6 adet) Kcal:358",
        "category": "Cooked Roll"
      },
      {
        "name": "Ebi Ten Roll",
        "price": "900.00 TL",
        "desc": "Kızarmış Karides, Avokado, Mayonez, Masago / Dışı Susam (5 adet) Kcal:368",
        "category": "Cooked Roll"
      },
      {
        "name": "Samurai Roll",
        "price": "860.00 TL",
        "desc": "Kızarmış Karides, Avokado, Kıvırcık, Japon Turbu / Dışı Susam ve Masago (8 adet)",
        "category": "Cooked Roll"
      },
      {
        "name": "Philly Roll",
        "price": "920.00 TL",
        "desc": "Surimi Yengeç, Avokado, Krem Peynir / Dışı Kızarmış (8 adet) Kcal:354",
        "category": "Cooked Roll"
      },
      {
        "name": "İstanbul Roll",
        "price": "920.00 TL",
        "desc": "Kızarmış Karides, Avokado, Mayonez, Salatalık, Masago / Dışı Kızarmış Somon (5 adet) Kcal:362",
        "category": "Cooked Roll"
      },
      {
        "name": "Dragon Roll",
        "price": "960.00 TL",
        "desc": "Avokado, Salatalık/ Dışı Yılan Balığı (6 adet) Kcal:302",
        "category": "Cooked Roll"
      },
      {
        "name": "Tokyo Drift Roll",
        "price": "920.00 TL",
        "desc": "Kızarmış Somon,Mayonez, Avokado, Salatalık / Masago, Kıtır Patates (8 adet) Kcal:640",
        "category": "Cooked Roll"
      },
      {
        "name": "Trüflü Ebi Tempura Roll",
        "price": "920.00 TL",
        "desc": "Kızarmış Karides, Avokado, Salatalık / Dışı Trüf Yağlı Mayonez, Kıtır Patates, Teriyaki Sos, Beyaz Susam (8 adet) Kcal:656",
        "category": "Cooked Roll"
      },
      {
        "name": "Fish & Chips Roll",
        "price": "900.00 TL",
        "desc": "Kızarmış Levrek, Kıtır Patates, Salatalık, Trüf Yağlı Mayonez / Dışı Avokado, Kıtır Patates, Teriyaki Sos (6 adet) Kcal:564",
        "category": "Cooked Roll"
      },
      {
        "name": "Super Dragon Roll",
        "price": "2000.00 TL",
        "desc": "Avokado, Salatalık/ Dışı Yılan Balığı(125 Gr)/ Teriyaki Sos (8 adet) Kcal:290",
        "category": "Cooked Roll"
      },
      {
        "name": "Chicken Teriyaki Roll",
        "price": "860.00 TL",
        "desc": "Kızarmış Tempura Tavuk, Mayonez, Beyaz Lahana / Dışı Susam, Kıtır Soğan, Teriyaki Sos (8 adet) Kcal:443",
        "category": "Cooked Roll"
      },
      {
        "name": "Matcha Crepe Cake",
        "price": "480.00 TL",
        "desc": "",
        "category": "Tatlılar"
      },
      {
        "name": "Mochi (Hindistan Cevizi)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Mochi (Çikolata)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Mochi (Çilek)",
        "price": "280.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Dondurma",
        "price": "520.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Kcal:974",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Dondurma",
        "price": "520.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Çikolata Kcal:974",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Muz",
        "price": "510.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Kcal:1084",
        "category": "Tatlılar"
      },
      {
        "name": "Sweet Roll",
        "price": "520.00 TL",
        "desc": "Muz, Armut, Yeşil elma, kızarmış ceviz, bal, nutella, çilek",
        "category": "Tatlılar"
      },
      {
        "name": "Mozaik Roll",
        "price": "480.00 TL",
        "desc": "Kcal:389",
        "category": "Tatlılar"
      },
      {
        "name": "BUN’utella (2 Adet)",
        "price": "480.00 TL",
        "desc": "Nutella, muz, çilek, yer fıstığı. Kcal:502",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Ceviz",
        "price": "518.00 TL",
        "desc": "Kcal:671",
        "category": "Tatlılar"
      },
      {
        "name": "Kyoto Cheesecake",
        "price": "450.00 TL",
        "desc": "",
        "category": "Tatlılar"
      },
      {
        "name": "Apple pie rolls",
        "price": "480.00 TL",
        "desc": "kırmızı elma, ceviz, tarçın harcı, bal Kcal:779",
        "category": "Tatlılar"
      },
      {
        "name": "Limon Sorbe",
        "price": "360.00 TL",
        "desc": "Kcal: 162",
        "category": "Tatlılar"
      },
      {
        "name": "Coca-Cola",
        "price": "176.00 TL",
        "desc": "Orijinal Tat / Zero Sugar",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Fanta",
        "price": "176.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Sprite",
        "price": "176.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Cappy",
        "price": "176.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Fuse Tea",
        "price": "176.00 TL",
        "desc": "Şeftali / Limon",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Su",
        "price": "110.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Su (750 ml)",
        "price": "226.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Minera Maden Suyu",
        "price": "176.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Minera Maden Suyu (750 ml)",
        "price": "242.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Schweppes",
        "price": "176.00 TL",
        "desc": "Mandarin / Bitter Lemon",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Limonata",
        "price": "242.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Taze Sıkılmış Portakal Suyu",
        "price": "266.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Rem",
        "price": "440.00 TL",
        "desc": "Havlıcan / Reyhan",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Milk Oolong",
        "price": "210.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Espresso",
        "price": "186.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Americano",
        "price": "210.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Türk Kahvesi",
        "price": "174.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Sencha",
        "price": "210.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Egeo Cabernet Franc–Merlot",
        "price": "3270.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Borgobruno ( Kadeh )",
        "price": "390.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Çakır Winery ( Kadeh )",
        "price": "500.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Selection Öküzgözü–Boğazkere ( Kadeh )",
        "price": "650.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Borgobruno ( Karaf )",
        "price": "970.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Çakır Winery ( Karaf )",
        "price": "1150.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Selection Öküzgözü–Boğazkere ( Karaf )",
        "price": "1520.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Porta Caeli Diverti Cabernet Sauvignon ( Şişe )",
        "price": "2410.00 TL",
        "desc": "Merlot Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Montes Classic Series Merlot ( Şişe )",
        "price": "2840.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Borgobruno ( Şişe )",
        "price": "1950.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Vourla ( Şişe )",
        "price": "4370.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Çakır Winery ( Şişe )",
        "price": "2300.00 TL",
        "desc": "",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Suvla Kalecik Karası ( Şişe )",
        "price": "2300.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Selection Öküzgözü–Boğazkere ( Şişe )",
        "price": "3040.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Akın Gürbüz ( Şişe )",
        "price": "3030.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Selection Narince Emir ( Kadeh)",
        "price": "650.00 TL",
        "desc": "",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Borgobruno Pinot Grigio ( Kadeh )",
        "price": "390.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Pamukkale Anfora Sauvignon Blanc ( Kadeh )",
        "price": "500.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Selection Narince Emir ( Karaf )",
        "price": "1520.00 TL",
        "desc": "",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Borgobruno Pinot Grigio ( Karaf )",
        "price": "970.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Pamukkale Anfora Sauvignon Blanc ( Karaf )",
        "price": "1150.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Pamukkale Anfora Sauvignon Blanc ( Şişe )",
        "price": "2300.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Khilon ( Şişe )",
        "price": "3790.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Egeo Fumé Blanc ( Şişe )",
        "price": "3730.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Rindera ( Şişe )",
        "price": "2070.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Borgobruno Pinot Grigio ( Şişe )",
        "price": "1950.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Kuzubağ Narince Chardonnay ( Şişe )",
        "price": "2300.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Selection Narince Emir ( Şişe )",
        "price": "3040.00 TL",
        "desc": "Beyaz Şarap",
        "category": "Beyaz Şarap"
      },
      {
        "name": "La Gioiosa Prosecco Frizzante ( Kadeh )",
        "price": "410.00 TL",
        "desc": "Yarı Köpüklü Beyaz Şarap",
        "category": "Köpüklü Şarap"
      },
      {
        "name": "La Gioiosa Prosecco Treviso ( Şişe )",
        "price": "4020.00 TL",
        "desc": "Beyaz Köpüklü Şarap",
        "category": "Köpüklü Şarap"
      },
      {
        "name": "La Gioiosa Prosecco Frizzante ( Şişe )",
        "price": "2070.00 TL",
        "desc": "Yarı Köpüklü Beyaz Şarap",
        "category": "Köpüklü Şarap"
      },
      {
        "name": "Peyrassol Roze Şarap ( Kadeh )",
        "price": "550.00 TL",
        "desc": "",
        "category": "Rose Şarap"
      },
      {
        "name": "Peyrassol Roze Şarap ( Karaf )",
        "price": "1260.00 TL",
        "desc": "",
        "category": "Rose Şarap"
      },
      {
        "name": "Peyrassol Roze Şarap ( Şişe )",
        "price": "2530.00 TL",
        "desc": "",
        "category": "Rose Şarap"
      },
      {
        "name": "Belfiore Pinot Grigio Blush Roze Şarap ( Şişe )",
        "price": "2180.00 TL",
        "desc": "Veneto Cielo Pinot Grigio",
        "category": "Rose Şarap"
      },
      {
        "name": "Tuborg Ice 33 cl",
        "price": "300.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Frederik Neipa 35 cl",
        "price": "360.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Tuborg Smooth 33 cl",
        "price": "300.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Tokyo Zen Green Tea Lager",
        "price": "470.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Frederik Local 35 cl",
        "price": "360.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Frederik Tropic Ipa 35 cl",
        "price": "360.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Tuborg Gold 33 cl",
        "price": "300.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Tuborg Gold 50 cl",
        "price": "330.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Tuborg Filtresiz",
        "price": "330.00 TL",
        "desc": "50 cl",
        "category": "Bira"
      },
      {
        "name": "Carlsberg 33 cl",
        "price": "330.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Carlsberg Luna",
        "price": "340.00 TL",
        "desc": "50 cl",
        "category": "Bira"
      },
      {
        "name": "Frederik India Pale Ale",
        "price": "360.00 TL",
        "desc": "35 cl",
        "category": "Bira"
      },
      {
        "name": "Frederik Yakima IPA",
        "price": "360.00 TL",
        "desc": "35 cl",
        "category": "Bira"
      },
      {
        "name": "Frederik Wheat IPA",
        "price": "360.00 TL",
        "desc": "35 cl",
        "category": "Bira"
      },
      {
        "name": "Frederik Marzen Lager",
        "price": "360.00 TL",
        "desc": "35 cl",
        "category": "Bira"
      },
      {
        "name": "Frederik Brown Ale",
        "price": "360.00 TL",
        "desc": "35 cl",
        "category": "Bira"
      },
      {
        "name": "Sol",
        "price": "410.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Desperados",
        "price": "420.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Weihenstephan Hefeweisbier",
        "price": "440.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Weihenstephan Vitus",
        "price": "440.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Kronenbourg Blanc 1664",
        "price": "370.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Guinness",
        "price": "480.00 TL",
        "desc": "44 cl",
        "category": "Bira"
      },
      {
        "name": "Grimbergen Blonde",
        "price": "440.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Grimbergen Double Ambree",
        "price": "440.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Tsingtao",
        "price": "470.00 TL",
        "desc": "33 cl",
        "category": "Bira"
      },
      {
        "name": "Asahi Super Dry 33 cl",
        "price": "470.00 TL",
        "desc": "",
        "category": "Bira"
      },
      {
        "name": "Chivas Rgl Smooth&Smoky",
        "price": "640.00 TL",
        "desc": "5cl",
        "category": "WHİSKEY"
      },
      {
        "name": "The Glengrant Arboralis (5cl)",
        "price": "610.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Ballantines Finest (5cl)",
        "price": "560.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Hibiki (5cl)",
        "price": "2370.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Chivas Rgl 12 YO (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Chivas Rgl 18 YO (5cl)",
        "price": "1160.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Jameson (5cl)",
        "price": "610.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Chivas Extra 13YO Sheery Cask (5cl)",
        "price": "680.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Glenlivet 12 YO (5cl)",
        "price": "840.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Ballantines 7 YO Bourbon (5cl)",
        "price": "630.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Jameson Black Barrel 6 (5cl)",
        "price": "680.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Oje de Tigre Joven",
        "price": "720.00 TL",
        "desc": "",
        "category": "Tekila"
      },
      {
        "name": "Olmeca Altos (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Tekila"
      },
      {
        "name": "Bumbu XO",
        "price": "570.00 TL",
        "desc": "",
        "category": "Rom"
      },
      {
        "name": "Havana Club (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Rom"
      },
      {
        "name": "Roku (5cl)",
        "price": "700.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Beefeater (5cl)",
        "price": "560.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Beefeater Pink (5cl)",
        "price": "560.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Malfy Limone (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Malfy Rosa (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Malfy Orginale (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Cin"
      },
      {
        "name": "Haku (5cl)",
        "price": "800.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Absolute Blue (5cl)",
        "price": "550.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Absolute Mandarin (5cl)",
        "price": "460.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Absolute Citron (5cl)",
        "price": "550.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Absolute Elyx V (5cl)",
        "price": "1100.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Beefeater Gin",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Beefeater Pink",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Roku Gin",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Aperol Spritz",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Malfy Gin con Limone",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Sparkling Sake Spritz",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Garrone Dry (5cl)",
        "price": "670.00 TL",
        "desc": "",
        "category": "Vermut"
      },
      {
        "name": "Garrone Bianco (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Vermut"
      },
      {
        "name": "Garrone Rosso (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Vermut"
      },
      {
        "name": "Martell VSOP (5cl)",
        "price": "640.00 TL",
        "desc": "",
        "category": "Konyak"
      },
      {
        "name": "Aperol (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Baker's Field İresh Cream (5cl)",
        "price": "490.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Kahlua (5cl)",
        "price": "490.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Campari (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Jagermaster (5cl)",
        "price": "540.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Triple Sec (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Likör"
      },
      {
        "name": "Citrus Lemonade",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Over The Rainbow",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Virgin Mojito",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Green Mill Zero",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Blue Skies Alkolsüz",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Sandos Alkolsüz",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Rooibos & Peach",
        "price": "220.00 TL",
        "desc": "Roobios Çayı, Şeftali",
        "category": "Moctails"
      },
      {
        "name": "Raspberry",
        "price": "220.00 TL",
        "desc": "Ahududu, Acai",
        "category": "Moctails"
      },
      {
        "name": "Japanese Lime",
        "price": "220.00 TL",
        "desc": "Misket Limonu, Nane",
        "category": "Moctails"
      },
      {
        "name": "Margarita",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "Espresso Martini",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "Mojito",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "Bellini",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "Whisky Sour",
        "price": "750.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "Negroni",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
      },
      {
        "name": "özeki junmai premium 9 cl.",
        "price": "550.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai ginjo gold label 18 cl.",
        "price": "690.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai ginjo gold label 72 cl.",
        "price": "2775.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai namachozo fresh - light 18 cl.",
        "price": "590.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai namachozo fresh - light 72 cl.",
        "price": "2360.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai ginjo gold label 9 cl.",
        "price": "345.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika sparkling sake 72 cl.",
        "price": "3720.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika sparkling sake 15 cl.",
        "price": "775.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "özeki junmai premium 75 cl.",
        "price": "4400.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "midorikawa junmai ginjo sake 72 cl.",
        "price": "4200.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "hakushika junmai namachozo fresh - light 9 cl.",
        "price": "295.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "midorikawa junmai ginjo sake 9cl.",
        "price": "525.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "özeki junmai premium 18 cl.",
        "price": "1100.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "midorikawa junmai ginjo sake 18cl.",
        "price": "1050.00 TL",
        "desc": "",
        "category": "Sake"
      },
      {
        "name": "Dynamite",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Shibumi",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Samurai",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Ninja",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Blue Skies",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Satsuma",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Soju Shot",
        "price": "100.00 TL",
        "desc": "4 cl",
        "category": "DAMSO ARİJİNAL SOJU"
      },
      {
        "name": "Soju Lowbal",
        "price": "410.00 TL",
        "desc": "10 cl",
        "category": "DAMSO ARİJİNAL SOJU"
      },
      {
        "name": "Damso ( Orijinal-Peach-Blueberry-Lhychee) Soju",
        "price": "780.00 TL",
        "desc": "35 cl",
        "category": "DAMSO ARİJİNAL SOJU"
      }
    ]
  },
  "7285": {
    "name": "U/We Coffee Roasters",
    "sourceUrl": "https://uwecoffee.com/",
    "sourceName": "U/WE Coffee Roastery resmi sitesi",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Cool Lime",
        "price": "₺200",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Berry Hibiscus",
        "price": "₺200",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Buzlu Matcha Latte",
        "price": "₺230",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Buzlu Chai Tea Latte",
        "price": "₺230",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Buzlu Çay",
        "price": "₺200+",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Milkshake",
        "price": "₺220",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Smoothie",
        "price": "₺230",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Frappuccino",
        "price": "₺230",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      },
      {
        "name": "Ube latte",
        "price": "₺230",
        "desc": "",
        "category": "U/WE Coffee menüsü"
      }
    ]
  },
  "7276": {
    "name": "Dürümcü Esnaf Paşabahçe - Beykoz",
    "sourceUrl": "https://durumcuesnaf.com/menu/",
    "sourceName": "Dürümcü Esnaf resmi menüsü",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Adana Tava (180g)",
        "desc": "Adana Tava, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Urfa Tava (180g)",
        "desc": "Urfa Tava, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Kilis Tava (180g)",
        "desc": "Kilis Tava, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Adana Dürüm Menü(120g)",
        "desc": "Adana Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Urfa Dürüm Menü(120g)",
        "desc": "Urfa Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Sucuk Kebap Dürüm Menü(120g)",
        "desc": "Sucuk Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Kuzu Şiş Dürüm Menü (120g)",
        "desc": "Kuzu Şiş Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Tavuk Şiş Dürüm Menü (120g)",
        "desc": "Tavuk Şiş Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Tavuk Kanat Menü (280g)",
        "desc": "Tavuk Kanat Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Ciğer Kavurma Dürüm Menü(120g)",
        "desc": "Ciğer Kavurma Dürüm, Çiğ Köfte, Halka Tatlı, Ayran",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Çorba",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Çiğ Köfte",
        "desc": "200gr Çiğ Köfte",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Halka Tatlı",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Açık Ayran",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Su",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Pepsi Kola",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Soda",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "1,5 LT Pepsi",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Eker Ayran",
        "desc": "",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Cheddar Peynirli Adana Dürüm (120gr.)+ Pepsi (250 ml)",
        "desc": "Cheddar Peynirli Adana Dürüm + Pepsi",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Köz Patlıcanlı Adana Dürüm(120GR.) + Pepsi (250 ML)",
        "desc": "Köz Patlıcanlı Adana Dürüm(120GR.) + Pepsi (250 ML) Köz Patlıcanlı Adana Dürüm(120GR.) + Pepsi (250 ML)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Cheddar Peynirli Tavuk Şiş Dürüm (120GR.) + Pepsi (250 ML)",
        "desc": "Cheddar Peynirli Tavuk Şiş Dürüm (120GR.) + Pepsi (250 ML) Cheddar Peynirli Tavuk Şiş Dürüm (120GR.) + Pepsi (250 ML)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Urfa Dürüm (120GR.) + Pepsi (250 ML) Menü",
        "desc": "Urfa Dürüm (120GR.) + Pepsi (250 ML) Menü Urfa Dürüm (120GR.) + Pepsi (250 ML) Menü",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Adana Dürüm (120GR.) + Pepsi (250ML) Menü",
        "desc": "Adana Dürüm (120GR.) + Pepsi (250ML) Menü Adana Dürüm (120GR.) + Pepsi (250ML) Menü",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Tavuk Şiş Dürüm (120GR.) + Pepsi (250ML) Menü",
        "desc": "Tavuk Şiş Dürüm (120GR.) + Pepsi (250ML) Menü Tavuk Şiş Dürüm (120GR.) + Pepsi (250ML) Menü",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Sucuk Kebap Dürüm (120gr.) + Pepsi (250ml) Menü",
        "desc": "Sucuk Kebap Dürüm (120gr.) + Pepsi (250ml) Menü Sucuk Kebap Dürüm (120gr.) + Pepsi (250ml) Menü",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Ciğer Kavurma Dürüm (120gr.) + Pepsi (250ml) Menü",
        "desc": "Ciğer Kavurma Dürüm (120gr.) + Pepsi (250ml) Menü Ciğer Kavurma Dürüm (120gr.) + Pepsi (250ml) Menü",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Patates (90 gr.)",
        "desc": "Patates (90 gr.) Patates (90 gr.)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Patates (180 Gr)",
        "desc": "Patates (180 Gr) Patates (180 Gr)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Bulgur Pilavı (150 Gr)",
        "desc": "Bulgur Pilavı (150 Gr) Bulgur Pilavı (150 Gr)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Humus (150 Gr)",
        "desc": "Humus (150 Gr) Humus (150 Gr)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "İçli Köfte",
        "desc": "İçli Köfte İçli Köfte",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Köz Patlıcan (150 Gr)",
        "desc": "Köz Patlıcan (150 Gr) Köz Patlıcan (150 Gr)",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Kuru Patlıcan Dolma",
        "desc": "Kuru Patlıcan Dolma Kuru Patlıcan Dolma",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Hızlı Erişim",
        "desc": "Ana Sayfa Hikayemiz Menü Franchise İletişim",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "İletişim",
        "desc": "Cevizli Mah. Mustafa Kemal Cad. Hukukçular Towers Sitesi A Blok No: 66A / 111 0532 705 61 63 info@durumcuesnaf.com",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Çalışma Saatleri",
        "desc": "Pazartesi - Pazar: 11:00 - 02:00 * Çalışma saatleri şubelere göre değişiklik gösterebilir.",
        "category": "Dürümcü Esnaf resmi menüsü"
      },
      {
        "name": "Çerez Tercihleri",
        "desc": "Sitemizde deneyiminizi geliştirmek, trafiği analiz etmek ve kişiselleştirilmiş içerik sunmak için çerezler kullanıyoruz. Zorunlu çerezler her zaman etkindir. Diğer çerez kategorileri için tercihlerinizi belirleyebilirsiniz. Daha fazla bilgi için Çerez Politikamızı inceleyebilirsiniz.",
        "category": "Dürümcü Esnaf resmi menüsü"
      }
    ]
  },
  "7278": {
    "name": "Pizza Wich Beşiktaş",
    "sourceUrl": "https://www.yemeksepeti.com/restaurant/j9va/pizza-wich-j9va",
    "sourceName": "Yemeksepeti / Pizza Wich Beşiktaş",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Mega Turco",
        "price": "420 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Pastırmalı Pizza (Orta Boy)",
        "price": "470 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Gideros (Orta)",
        "price": "430 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Arrabbiata (Orta)",
        "price": "420 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Barbekü Soslu Tavuklu Pizza",
        "price": "420 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Chicken Steak",
        "price": "420 TL",
        "desc": "",
        "category": "Popüler"
      },
      {
        "name": "Margherita Pizza (24 cm.)",
        "price": "290 TL",
        "desc": "Özel sos, mozzarella peyniri, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Quattro Formaggi Pizza(24cm)",
        "price": "320 TL",
        "desc": "Özel sos,mozzarellapeyniri,rokforpeyniri,parmesanpeyniri,cheddarpeyniri,roka Special sauce,mozzarellacheese,bluecheese,parmesancheese,cheddarcheese,arragula",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Funghi Pizza (24 cm.)",
        "price": "320 TL",
        "desc": "Özel sos, mozzarella peyniri, kültür mantarı, kestane mantarı, istiridye mantarı",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Pepperoni Pizza (24 cm.)",
        "price": "320 TL",
        "desc": "Özel sos, mozzarella peyniri, pepperoni",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Anatolian Pizza (24 cm.)",
        "price": "320 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, kırmızıbiber, közlenmiş patlıcan, domates, roka, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Ricotta Spinach Pizza (24 cm.)",
        "price": "320 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, ıspanak, soğan, sarımsak, domates, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Veggie Pizza (24 cm.)",
        "price": "335 TL",
        "desc": "Özel sos, mozzarella peyniri, mantar, kırmızı soğan, ıspanak, brokoli, zeytin, domates, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Anatolia Mushroom Pizza (24 cm.)",
        "price": "330 TL",
        "desc": "Özel sos, mozzarella peyniri, mantar, kırmızıbiber, yeşil biber, mısır, zeytin",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Mediterrenean Pizza (24 cm.)",
        "price": "320 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, yeşil biber, zeytin, domates, roka, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Zucchini Pesto Pizza (24 cm.)",
        "price": "330 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, kabak, sarımsak, domates, roka, fesleğen sos",
        "category": "Küçük Boy Klasik Pizzalar (24 cm.)"
      },
      {
        "name": "Mega Turco Pizza (24 cm.)",
        "price": "350 TL",
        "desc": "Özel sos, mozzarella peyniri, mantar, yeşil biber, kırmızıbiber, sucuk, salam, sosis, mısır, zeytin",
        "category": "Küçük Boy Gurme Pizzalar (24 cm.)"
      },
      {
        "name": "BBQ Tavuklu Pizza (24 cm.)",
        "price": "350 TL",
        "desc": "Özel sos, mozzarella peyniri, kırmızı soğan, yeşil biber, kırmızıbiber, piliç bonfile, barbekü sos",
        "category": "Küçük Boy Gurme Pizzalar (24 cm.)"
      },
      {
        "name": "Mediterranean",
        "price": "380 TL",
        "desc": "Mozzarella peyniri, domates, yeşil biber, siyah zeytin, ricotta peyniri, fesleğen sos",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Funghi",
        "price": "390 TL",
        "desc": "Mozzarella peyniri, özel sos, istiridye mantarı, kestane mantarı, kültür mantarı",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Quattro Formaggi",
        "price": "390 TL",
        "desc": "Mozzarella peyniri, özel sos, rokfor peyniri, parmesan peyniri, cheddar peyniri",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Anatolian",
        "price": "380 TL",
        "desc": "Mozzarella peyniri, özel sos, közlenmiş patlıcan, kaymak, lor peyniri, domates, kırmızıbiber, fesleğen sos",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Ricotta & Spinach",
        "price": "380 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, ıspanak, soğan, sarımsak, domates",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Margherita (Orta)",
        "price": "340 TL",
        "desc": "Özel sos, mozzarella peyniri, fesleğen sos",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Pepperoni (Orta)",
        "price": "390 TL",
        "desc": "Mozzarella peyniri, özel sos, dana pepperoni",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Veggie Pizza (Orta Boy)",
        "price": "380 TL",
        "desc": "Mozzarella peyniri, özel sos, mantar, brokoli, siyah zeytin, soğan, ıspanak, domates",
        "category": "Orta Boy Klasik Pizzalar (28 cm.)"
      },
      {
        "name": "Kavurma Zengini",
        "price": "470 TL",
        "desc": "Özel sos, mozarella peyniri, kavurma, kırmızısoğan, yeşil biber, kırmızıbiber",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Goat Cheese (Orta)",
        "price": "470 TL",
        "desc": "Özel sos, mozzarella peyniri, keçi peyniri, kurutulmuş domates, siyah zeytin, fesleğen sos",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Pastırmalı Pizza (Orta Boy)",
        "price": "470 TL",
        "desc": "Özel sos, mozzarella peyniri, pastırma, yeşil biber, kırmızıbiber, kırmızı soğan",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Mega Turco",
        "price": "420 TL",
        "desc": "Mozzarella peyniri, salam, sucuk, sosis, mantar, mısır, zeytin, kırmızıbiber, yeşil biber",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Arrabbiata (Orta)",
        "price": "420 TL",
        "desc": "Mozzarella peyniri, özel sos, dana pepperoni, mantar, mısır, zeytin, jalapeno biberi",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Barbekü Soslu Tavuklu Pizza",
        "price": "420 TL",
        "desc": "Mozzarella peyniri, özel sos, tavuk bonfile, barbekü sos, kırmızıbiber, yeşil biber, soğan",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Chicken Steak",
        "price": "420 TL",
        "desc": "Özel sos, mozarella peyniri, tavuk, mantar, kırmızı soğan, jalapeno biberi",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Gideros (Orta)",
        "price": "430 TL",
        "desc": "Mozzarella peyniri, özel sos, mantar, dana jambon, siyah zeytin, soğan, jalapeno biberi",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Hawaiian",
        "price": "430 TL",
        "desc": "Mozzarella peyniri, özel sos, dana jambon, ananas",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Jambon & Cheddar Pizza",
        "price": "420 TL",
        "desc": "Mozzarella peyniri, özel sos, dana jambon, cheddar peyniri, yeşil biber, soğan",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Zucchini & Pesto",
        "price": "380 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, kabak, sarımsak, domates, fesleğen sos",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Küp Sucuk Pizza (Orta Boy)",
        "price": "420 TL",
        "desc": "Özel sos, mozzarella peyniri, küp sucuk, yeşil biber, kırmızıbiber, zeytin",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Pizza Sosis & Cheddar (Orta)",
        "price": "420 TL",
        "desc": "Özel sos, mozzarella peyniri, sosis, cheddar peyniri",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Al Tonno Pizza",
        "price": "450 TL",
        "desc": "Mozzarella peyniri, özel sos, ton balığı, mısır, soğan, kapari",
        "category": "Orta Boy Gurme Pizzalar (28 cm.)"
      },
      {
        "name": "Mediterranean (Büyük)",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, domates, yeşil biber, siyah zeytin, ricotta peyniri, fesleğen sos",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Funghi (Büyük)",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, istiridye mantarı, kestane mantarı, kültür mantarı",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Quattro Formaggi (Büyük)",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, rokfor peyniri, parmesan peyniri, cheddar peyniri",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Anatolian Pizza",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, közlenmiş patlıcan, kaymak, lor peyniri, domates, kırmızıbiber, fesleğen sos",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Ricotta & Spinach Pizza",
        "price": "870 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, ıspanak, soğan, sarımsak, domates",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Margherita Pizza (Büyük)",
        "price": "830 TL",
        "desc": "Özel sos, mozzarella peyniri, fesleğen sos",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Pepperoni",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, dana pepperoni",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Veggie Pizza",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, mantar, brokoli, siyah zeytin, soğan, ıspanak, domates",
        "category": "Büyük Boy Klasik Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Kavurma Zengini Pizza",
        "price": "940 TL",
        "desc": "Özel sos, mozarella peyniri, kavurma, kırmızı soğan, yeşil biber, kırmızıbiber",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Anatolia Gourmet Pizza",
        "price": "950 TL",
        "desc": "Özel sos, mozzarella peyniri, pastırma, kavurma, küp sucuk, kırmızı soğan, yeşil biber, kırmızıbiber",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Goat Cheese Pizza",
        "price": "920 TL",
        "desc": "Özel sos, mozzarella peyniri, keçi peyniri, kurutulmuş domates, siyah zeytin, fesleğen sos",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Pastırmalı Pizza",
        "price": "970 TL",
        "desc": "Özel sos, mozzarella peyniri, dana pastırma, yeşil biber, kırmızıbiber, kırmızı soğan",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Mega Turco (Büyük)",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, salam, sucuk, sosis, mantar, mısır, zeytin, kırmızıbiber, yeşil biber",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Arrabbiata Pizza",
        "price": "850 TL",
        "desc": "Mozzarella peyniri, özel sos, dana pepperoni, mantar, mısır, zeytin, jalapeno biberi",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "BBQ Tavuk Pizza",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, tavuk bonfile, barbekü sos, kırmızıbiber, yeşil biber, soğan",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Chicken Steak Pizza",
        "price": "870 TL",
        "desc": "Özel sos, mozarella peyniri, tavuk, mantar, kırmızı soğan, jalapeno biberi",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Gideros Pizza",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, mantar, dana jambon, siyah zeytin, soğan, jalapeno biberi",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Hawaiian Pizza",
        "price": "900 TL",
        "desc": "Mozzarella peyniri, özel sos, dana jambon, ananas",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Jambon & Cheddar Pizza",
        "price": "870 TL",
        "desc": "Mozzarella peyniri, özel sos, dana jambon, cheddar peyniri, yeşil biber, soğan",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Pizza Kabak Pesto (Büyük)",
        "price": "870 TL",
        "desc": "Özel sos, mozzarella peyniri, ricotta peyniri, kabak, sarımsak, domates, fesleğen sos",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Küp Sucuk (Büyük)",
        "price": "870 TL",
        "desc": "Özel sos, mozzarella peyniri, küp sucuk, yeşil biber, kırmızıbiber, zeytin",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Sosis & Cheddar Pizza",
        "price": "870 TL",
        "desc": "Özel sos, mozzarella peyniri, sosis, cheddar peyniri",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Al Tonno",
        "price": "920 TL",
        "desc": "Mozzarella peyniri, özel sos, ton balığı, mısır, soğan, kapari",
        "category": "Büyük Boy Gurme Pizzalar (45 cm.) (3-4 Kişilik)"
      },
      {
        "name": "Coca-Cola (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-Cola Şekersiz (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Ayran (33 cl.)",
        "price": "60 TL",
        "desc": "Büyük",
        "category": "İçecekler"
      },
      {
        "name": "Soda (20 cl.)",
        "price": "50 TL",
        "desc": "Cam şişe",
        "category": "İçecekler"
      },
      {
        "name": "Su (50 cl.)",
        "price": "25 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Acı Sos",
        "price": "7 TL",
        "desc": "Paket",
        "category": "Soslar"
      },
      {
        "name": "BBQ Sos",
        "price": "7 TL",
        "desc": "Paket",
        "category": "Soslar"
      },
      {
        "name": "Ketçap",
        "price": "6 TL",
        "desc": "Paket",
        "category": "Soslar"
      },
      {
        "name": "Mayonez",
        "price": "6 TL",
        "desc": "Paket",
        "category": "Soslar"
      },
      {
        "name": "Poşet",
        "price": "1 TL",
        "desc": "Çevre Kanunu kapsamında yapılan değişiklikle her bir plastik poşetin tüketicilere 1 TL fiyat karşılığı satılması Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafından zorunlu hale getirilmiştir. Plastik poşet talep etmeniz halinde ürünü sepete eklemeniz gerekmektedir. Sepete eklenen her bir plastik poşet için ilgili bedel tarafınızdan tahsil edilecektir.",
        "category": "Poşet"
      }
    ]
  }
};
