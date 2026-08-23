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
  },
  "7210": {
    "name": "Sushico Sushi & Chinese & Thai - Acar Loft Kavacık",
    "sourceUrl": "https://acr-loft-kavacik-sushico.arimenu.com/",
    "sourceName": "SushiCo Acar Loft Kavacık QR menüsü",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Hamachi Nigiri (2 Adet)",
        "price": "560.00 TL",
        "desc": "Hamachi Balığı Kcal:106",
        "category": "Yeniler"
      },
      {
        "name": "Mango Soslu Denı̇z Mahsullü Salata",
        "price": "840.00 TL",
        "desc": "Yedikule marul , akdeniz yeşilliği, Surimi yengeç, karides, edamame, avokado, mango sos Kcal:487",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Sashimi (12 Adet)",
        "price": "1150.00 TL",
        "desc": "Hamachi Balığı Kcal:176",
        "category": "Yeniler"
      },
      {
        "name": "Mochi (Hindistan Cevizi)",
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Crunchy Calı̇fornı̇a Roll (8 Adet)",
        "price": "830.00 TL",
        "desc": "Surumi Yengeç, avokado,çıtır soğan, teriyaki sos, acılı mayonez Kcal:421",
        "category": "Yeniler"
      },
      {
        "name": "Acılı Sebzeli Tavuk",
        "price": "838.00 TL",
        "desc": "Tavuk but, kapya biber, sivri biber, mantar. Sade Pilav ile servis edilir. Kcal:1259",
        "category": "Yeniler"
      },
      {
        "name": "Mochi (Çilek)",
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Golden Ebi Roll (8 Adet)",
        "price": "880.00 TL",
        "desc": "Golden Ebi, mango, krem peynir, avokado, tenkasu, yuzu mayonez Kcal:443",
        "category": "Yeniler"
      },
      {
        "name": "Sarımsak Soslu Green Bean",
        "price": "460.00 TL",
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
        "price": "830.00 TL",
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
        "price": "580.00 TL",
        "desc": "Susamlı tavuk, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:1070",
        "category": "Yeniler"
      },
      {
        "name": "Baby Bento Menü",
        "price": "680.00 TL",
        "desc": "Susamlı Tavuk, Parmesanlı Mısır Topları(4 Adet), Soft İçecek Kcal: 1389",
        "category": "Yeniler"
      },
      {
        "name": "Çıtır Levrekli Zenı̇th Salata",
        "price": "780.00 TL",
        "desc": "Levrek, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:987",
        "category": "Yeniler"
      },
      {
        "name": "Matcha Crepe Cake",
        "price": "480.00 TL",
        "desc": "",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Carpaccio",
        "price": "980.00 TL",
        "desc": "Hamachi Balığı, akdeniz yeşilliği, susam, özel hamchi sosu Kcal:227",
        "category": "Yeniler"
      },
      {
        "name": "Parmesanlı Mısır Topları",
        "price": "580.00 TL",
        "desc": "Mısır, parmesan peyniri, yuzu mayonez, frenk soğan Kcal:816",
        "category": "Yeniler"
      },
      {
        "name": "Hamachi Roll (6 Adet)",
        "price": "560.00 TL",
        "desc": "Hamachi Balığı Kcal:181",
        "category": "Yeniler"
      },
      {
        "name": "Buharda Somonlu Zenı̇th Salata",
        "price": "780.00 TL",
        "desc": "Somon, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:475",
        "category": "Yeniler"
      },
      {
        "name": "Mochi (Çikolata)",
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Yeniler"
      },
      {
        "name": "Terı̇yakı̇ Tavuk Udon Bowl",
        "price": "850.00 TL",
        "desc": "Udon noodle, kapya biber, yeşil soğan, brokoli, Tavuk but, noodle sos, teriyaki sos, susam Kcal:1245",
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
        "price": "520.00 TL",
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
        "price": "520.00 TL",
        "desc": "Tempura Yeşil Çin Faulyesi, Yanında Tempura Sos, Yuzu Mayonez Kcal:926",
        "category": "Başlangıçlar"
      },
      {
        "name": "Mongolian Chicken",
        "price": "594.00 TL",
        "desc": "özel sosumuzla marine edilmiş ve kızarmış tavuk but, aromatik körili Japon mayonezi Kcal: 1051",
        "category": "Başlangıçlar"
      },
      {
        "name": "Kimchi Cucumber Salad",
        "price": "410.00 TL",
        "desc": "Salatalık, Yeşil Soğan,İnce Havuç,Kimchi Sos,Susam Kcal:110",
        "category": "Başlangıçlar"
      },
      {
        "name": "Golden Ebi Bites",
        "price": "840.00 TL",
        "desc": "Özel teknikle tempuralanmış 3 adet Jumbo Karides, Frenk Soğanı, Lime dilimi ve yuzu mayonez Kcal:536",
        "category": "Başlangıçlar"
      },
      {
        "name": "Somon Carpaccio",
        "price": "960.00 TL",
        "desc": "Somon, goma wakame Kcal :301",
        "category": "Başlangıçlar"
      },
      {
        "name": "Chicken Katsu Finger",
        "price": "650.00 TL",
        "desc": "Pane tavuk göğüs, japon köri sos ile. Kcal: 1215",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Topları",
        "price": "680.00 TL",
        "desc": "Karides, Havuç, Sarımsak, Zencefil, Taze Soğan, Mayonez, Frenk Soğan Kcal:809",
        "category": "Başlangıçlar"
      },
      {
        "name": "Edamame",
        "price": "364.00 TL",
        "desc": "Organik Soya Fasulyesi Kcal :240",
        "category": "Başlangıçlar"
      },
      {
        "name": "Chili Garlic Edamame",
        "price": "388.00 TL",
        "desc": "Organik soya fasülyesi, chilli garlic sos. Kcal:267",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Cipsi",
        "price": "330.00 TL",
        "desc": "Kcal :560",
        "category": "Başlangıçlar"
      },
      {
        "name": "Tavuk Topları",
        "price": "564.00 TL",
        "desc": "ane tavuk köfte, sriracha sos ve tatlı ekşi sos ile. (8 adet) Kcal:839",
        "category": "Başlangıçlar"
      },
      {
        "name": "Karides Tempura",
        "price": "870.00 TL",
        "desc": "Tempura karides, tempura sebze, tempura sos ile. Kcal:920",
        "category": "Başlangıçlar"
      },
      {
        "name": "Fish & Cips",
        "price": "956.00 TL",
        "desc": "Pane levrek, patates kızartması, acı mayonez ve trüflü mayonez ile. Kcal:1528",
        "category": "Başlangıçlar"
      },
      {
        "name": "Shrimp Bomb",
        "price": "872.00 TL",
        "desc": "Tempura karides, kore acı mayonez. Kcal:1091",
        "category": "Başlangıçlar"
      },
      {
        "name": "Çıtır Karides",
        "price": "870.00 TL",
        "desc": "Pane karides, sriracha sos ve sweet chili sos ile. Kcal:1172",
        "category": "Başlangıçlar"
      },
      {
        "name": "Corn Tempura",
        "price": "588.00 TL",
        "desc": "Tempura mısır, shicimi baharatı ve trüflü mayonez ile. Kcal:775",
        "category": "Başlangıçlar"
      },
      {
        "name": "Tavuklu Bao Burger",
        "price": "654.00 TL",
        "desc": "Köri ile aromalandırılmış tavuk but, köri mayonezli göbek marul salatası, kırmızı soğan turşusu. Kcal:1606",
        "category": "BUN"
      },
      {
        "name": "Tavuklu Bun",
        "price": "700.00 TL",
        "desc": "(2 Ad) Pane tavuk göğüs (trüf mayonez ve acı mayonez ile), kırmızı lahana, kırmızı soğan, kişniş. Kcal:1192",
        "category": "BUN"
      },
      {
        "name": "Bao Burger (karidesli)",
        "price": "756.00 TL",
        "desc": "(2 Ad) Panko ile kızartılmış karides köfte, kimchi soslu salatalık ve trüf mayonez Kcal:1150",
        "category": "BUN"
      },
      {
        "name": "Çıtır Dana Bun",
        "price": "724.00 TL",
        "desc": "Dana Eti, Trüf Mayonez, salatalık salatası, patates, acı mayonez Kcal:1248",
        "category": "BUN"
      },
      {
        "name": "Ördek Bun",
        "price": "830.00 TL",
        "desc": "(2 Ad) Kızarmış ördek, sivri biber, domates, taze soğan. Kcal:935",
        "category": "BUN"
      },
      {
        "name": "Çıtır Levrekli Bun (2 Adet)",
        "price": "756.00 TL",
        "desc": "Levrek, Sarımsak ve Coleslaw Kcal:1031",
        "category": "BUN"
      },
      {
        "name": "Trüflü Çin Mantısı",
        "price": "520.00 TL",
        "desc": "Asya sebzeli dana kıymalı Çin mantısı, frenk soğan, susam, trüf mantarı, trüf ve yuzu aromalı sos ile. Kcal:865",
        "category": "Dim-Sum"
      },
      {
        "name": "Dana Etli Gyoza",
        "price": "572.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda japon mantısı, gyoza sos ile.(5 adet) Kcal:780",
        "category": "Dim-Sum"
      },
      {
        "name": "Karides Spring Roll",
        "price": "472.00 TL",
        "desc": "Nefis Çin yufkasına sarılı karidesler ve yuzu mayonez Kcal:593",
        "category": "Dim-Sum"
      },
      {
        "name": "Karidesli Gyoza (5 Adet)",
        "price": "610.00 TL",
        "desc": "Asya sebzeli karides kıymalı buharda japon mantısı, gyoza sos ile. Kcal:729",
        "category": "Dim-Sum"
      },
      {
        "name": "Çıtır Çin Mantısı",
        "price": "536.00 TL",
        "desc": "Asya sebzeli dana kıymalı kızarmış çin mantısı, sriracha sos ve tatlı ekşi sos ile( 4adet) Kcal:1038",
        "category": "Dim-Sum"
      },
      {
        "name": "Çin Böreği",
        "price": "390.00 TL",
        "desc": "Asya sebzeli dana kıymalı kızarmış çin böreği. (2 adet) Kcal:838",
        "category": "Dim-Sum"
      },
      {
        "name": "Buharda Çin Mantısı",
        "price": "536.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda çin mantısı, sarımsak sos ile. (4 adet) Kcal:868",
        "category": "Dim-Sum"
      },
      {
        "name": "Korean Wonton (4 Adet)",
        "price": "570.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda mantı, yer fıstığı, taze soğan, susam, çin acı yağı, salkım biber ile. Kcal:386",
        "category": "Dim-Sum"
      },
      {
        "name": "Acılı Ekşili Çorba",
        "price": "398.00 TL",
        "desc": "Tavuk göğüs, havuç, beyaz lahana, soya filizi, sirkesi, yumurta, çin acı sos. Kcal:581",
        "category": "Çorbalar"
      },
      {
        "name": "Tavuk Mısır Çorba",
        "price": "398.00 TL",
        "desc": "Tavuk göğüs, mısır, yumurta. Kcal:581",
        "category": "Çorbalar"
      },
      {
        "name": "Buharda Mantılı Çorba",
        "price": "420.00 TL",
        "desc": "Çin Mantısı (3 Ad), taze soğan, yumurta. Kcal:563",
        "category": "Çorbalar"
      },
      {
        "name": "Miso Çorba",
        "price": "420.00 TL",
        "desc": "Miso sos, tofu, yosun, yeşil soğan. / Alkol içerir. Kcal:511",
        "category": "Çorbalar"
      },
      {
        "name": "Tom Yum",
        "price": "452.00 TL",
        "desc": "Tom Yum, Shitake Mantar, Ceri Domates, Lemon Grass, Kırmızı Soğan, Karides Çim Çim (3 Adet),Kişniş, Zencefil, Sarımsak ve Fish Sos Kcal:619",
        "category": "Çorbalar"
      },
      {
        "name": "Tom Ga Kai",
        "price": "840.00 TL",
        "desc": "Aromatik Thai rameni; tavuk göğüs, Nissin noodle, hindistan cevizi sütü, limon çubuğu, shiitake mantarı, kişniş, taze soğan, acı yağ. Kcal: 1829",
        "category": "Ramen"
      },
      {
        "name": "Tavuklu Ramen",
        "price": "840.00 TL",
        "desc": "Tavuk, nissin noodle, shitake mantarı, taze soğan, baby mısır, kişniş, ıspanak, 1/2 Haşlanmış Yumurta. Kcal: 1213",
        "category": "Ramen"
      },
      {
        "name": "Dana Etli Ramen",
        "price": "920.00 TL",
        "desc": "Dana eti, ıspanak, kişniş, shitake mantar, baby mısır, miso, nissin, sarımsak, zencefil, taze soğan ve yumurta Kcal: 1173",
        "category": "Ramen"
      },
      {
        "name": "Karidesli Ramen",
        "price": "940.00 TL",
        "desc": "Jumbo Karides (4 adet), nissin noodle, shitake Mantarı taze soğan, baby mısır, kişniş, ıspanak, 1/2 Haşlanmış Yumurta. Kcal: 1138",
        "category": "Ramen"
      },
      {
        "name": "Mango Soslu Denı̇z Mahsullü Salata",
        "price": "840.00 TL",
        "desc": "Yedikule marul , akdeniz yeşilliği, Surimi yengeç, karides, edamame, avokado, mango sos Kcal:487",
        "category": "Salatalar"
      },
      {
        "name": "Susamlı Tavuklu Zenı̇th Salata",
        "price": "580.00 TL",
        "desc": "Susamlı tavuk, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:1070",
        "category": "Salatalar"
      },
      {
        "name": "Buharda Somonlu Zenı̇th Salata",
        "price": "780.00 TL",
        "desc": "Somon, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:475",
        "category": "Salatalar"
      },
      {
        "name": "Çıtır Levrekli Zenı̇th Salata",
        "price": "780.00 TL",
        "desc": "Levrek, yedikule marul, akdeniz yeşilliği, susamlı dressing sos Kcal:987",
        "category": "Salatalar"
      },
      {
        "name": "Sushico Yosun Salatası",
        "price": "680.00 TL",
        "desc": "Karışık yeşillik, yosun, tobiko, salatalık, susam, ponzu sos. Kcal:160",
        "category": "Salatalar"
      },
      {
        "name": "Acı Lahana Salatası",
        "price": "358.00 TL",
        "desc": "Kırmızı lahana, domates, sirke, çin acı sos, limon. Kcal:96",
        "category": "Salatalar"
      },
      {
        "name": "Mhu Shu Tavuk",
        "price": "838.00 TL",
        "desc": "Tavuk, dolmalık biber, kapya biber, havuç, mantar, salatalık, soya filizi Kcal:738",
        "category": "Tavuk"
      },
      {
        "name": "Acılı Sebzeli Tavuk",
        "price": "838.00 TL",
        "desc": "Tavuk but, kapya biber, sivri biber, mantar. Sade Pilav ile servis edilir. Kcal:1259",
        "category": "Tavuk"
      },
      {
        "name": "Tatlı Ekşi Soslu Tavuk",
        "price": "828.00 TL",
        "desc": "Pane tavuk göğüs, ananas, dolmalık biber, kuru soğan, tatlı ekşi sos. Kcal:1195",
        "category": "Tavuk"
      },
      {
        "name": "General Tso Tavuk",
        "price": "838.00 TL",
        "desc": "Pane tavuk but, tatlı ekşi ve çin acı sos. Kcal:1386",
        "category": "Tavuk"
      },
      {
        "name": "Zencefil Soslu Çıtır Tavuk",
        "price": "838.00 TL",
        "desc": "Pane tavuk göğüs, zencefil, taze soğan, salkım biber, çin acı sos. Kcal:1014",
        "category": "Tavuk"
      },
      {
        "name": "Kırmızı Köri Soslu Tavuk",
        "price": "850.00 TL",
        "desc": "Tavuk but, kırmızı köri, hindistan cevizi sütü, dolmalık biber, kapya biber, taze soğan, shitake mantar, kuru soğan, 150 Gr Sade pilav ile. Kcal:1373",
        "category": "Tavuk"
      },
      {
        "name": "Mançuryan Usulü Tavuk",
        "price": "838.00 TL",
        "desc": "Pane tavuk göğüs, kabak, shitake mantar, sivri biber, soya filizi, yer fıstığı, salkım biber, çin acı sos. Kcal:1081",
        "category": "Tavuk"
      },
      {
        "name": "Chicken Katsu Bowl",
        "price": "850.00 TL",
        "desc": "Tavuk, Pilav, Coleslaw Salad Kcal:1720",
        "category": "Tavuk"
      },
      {
        "name": "Ballı Kore Tavuk",
        "price": "838.00 TL",
        "desc": "Ballı ve yer fıstıklı, Gochujang soslu Kore tavuk but Kcal:1209",
        "category": "Tavuk"
      },
      {
        "name": "Cheesy Tteokbokki",
        "price": "630.00 TL",
        "desc": "Pirinç keki, beyaz lahana, havuç, sarımsak, zencefil, kore acı sos, susam, mozerella Kcal:601",
        "category": "Kore"
      },
      {
        "name": "Rabokki",
        "price": "690.00 TL",
        "desc": "Rice cake, noodle, Beyaz lahana, havuç, Taze soğan, Kcal:631",
        "category": "Kore"
      },
      {
        "name": "Tavuklu Rabokki",
        "price": "734.00 TL",
        "desc": "Tavuk, pirinç kek, noodle, beyaz lahana, havuç, taze soğan, sarımsak, zencefil, taze soğan ve susam Kcal:763",
        "category": "Kore"
      },
      {
        "name": "Korean Wonton (4 Adet)",
        "price": "570.00 TL",
        "desc": "Asya sebzeli dana kıymalı buharda mantı, yer fıstığı, taze soğan, susam, çin acı yağı, salkım biber ile. Kcal:386",
        "category": "Kore"
      },
      {
        "name": "Kore Usulü Tavuklu Bulgogi Udon",
        "price": "870.00 TL",
        "desc": "Tavuk, Shitake Mantarı, Kuru Soğan, Sarımsak, Zencefil ve Yumurta / Üzerine Frenk Soğanı ve Susam Kcal:672",
        "category": "Kore"
      },
      {
        "name": "Kore Usulü Bulgogi Dana Udon",
        "price": "960.00 TL",
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
        "price": "1150.00 TL",
        "desc": "Dana eti, pane patlıcan, taze soğan, sirke, salkım biber, chilli garlic sos, Kcal:1623",
        "category": "Dana Eti"
      },
      {
        "name": "Limon Soslu Çıtır Dana Eti",
        "price": "1170.00 TL",
        "desc": "Pane dana eti, limon, susam. Kcal:1977",
        "category": "Dana Eti"
      },
      {
        "name": "İnce Kıyım Biberli Dana",
        "price": "1150.00 TL",
        "desc": "Dana Eti, sivri biber, havuç Kcal:940",
        "category": "Dana Eti"
      },
      {
        "name": "Yeşil Biberli Dana Eti",
        "price": "1150.00 TL",
        "desc": "Dana eti, dolmalık biber, havuç, sarımsak / 150 Gr Sade pilav ile servis edilir Kcal:1253",
        "category": "Dana Eti"
      },
      {
        "name": "Shitake Mantarlı Dana Eti",
        "price": "1170.00 TL",
        "desc": "Dana eti, kabak, shitake mantarı, sivri biber, fıstık, kurutulmuş kırmızı biber, çin acı sos, 150 Gr Sade pilav ile. Kcal:1355",
        "category": "Dana Eti"
      },
      {
        "name": "Tatlı Ekşi Soslu Karides",
        "price": "1170.00 TL",
        "desc": "Jumbo Karides, dolmalık biber, kuru soğan, ananas, tatlı ekşi sos. Kcal:966",
        "category": "Deniz Mahsülleri"
      },
      {
        "name": "Zencefilli Çıtır Levrek",
        "price": "1150.00 TL",
        "desc": "Pane levrek, brokoli, shitake mantarı, taze soğan, salkım biber. Kcal:758",
        "category": "Deniz Mahsülleri"
      },
      {
        "name": "Kung Pao Karides",
        "price": "1170.00 TL",
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
        "price": "830.00 TL",
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
        "price": "940.00 TL",
        "desc": "Ördek, sivri biber, yeşil soğan, domates, çin acı sos, schimi baharatı, haşlanmış pilav. Kcal:1333",
        "category": "Ördek"
      },
      {
        "name": "Sarımsak Soslu Green Bean",
        "price": "460.00 TL",
        "desc": "Yeşil fasulye, özel sarımsak sos Kcal:316",
        "category": "Sebzeler"
      },
      {
        "name": "Karışık Sebze",
        "price": "460.00 TL",
        "desc": "Baby mısır, brokoli, havuç, kabak, beyaz lahana, pakçoy, shitake mantar, soya filizi, kapya biber, Green Bean ve Pırasa Kcal:482",
        "category": "Sebzeler"
      },
      {
        "name": "Acılı Karışık Sebze",
        "price": "460.00 TL",
        "desc": "Baby mısır, brokoli, havuç, kabak, beyaz lahana, pakçoy, shitake mantar, soya filizi, kapya biber, çin acı sos, Green Bean ve Pırasa Kcal:494",
        "category": "Sebzeler"
      },
      {
        "name": "Sarımsak Soslu Brokoli",
        "price": "460.00 TL",
        "desc": "Brokoli, havuç, sarımsak. Kcal:306",
        "category": "Sebzeler"
      },
      {
        "name": "Siyah Sarımsaklı Udon",
        "price": "820.00 TL",
        "desc": "Ispanak, kapya biber, siyah sarımsak, baby mısır, shitake mantar Kcal:476",
        "category": "Noodle"
      },
      {
        "name": "Siyah Sarımsaklı Dana Udon",
        "price": "960.00 TL",
        "desc": "Dana Eti, ıspanak, kapya biber, siyah sarımsak, baby mısır, havuç, shitake mantar, Kcal:648",
        "category": "Noodle"
      },
      {
        "name": "Kore Usulü Tavuklu Bulgogi Udon",
        "price": "870.00 TL",
        "desc": "Udon, tavuk, shitake mantar, kuru soğan, yumurta, susam. Kcal:672",
        "category": "Noodle"
      },
      {
        "name": "Kore Usulü Bulgogi Dana Udon",
        "price": "960.00 TL",
        "desc": "Udon, dana eti, shitake mantar, kuru soğan, yumurta, susam. Kcal:716",
        "category": "Noodle"
      },
      {
        "name": "Mamma Bao Noodle",
        "price": "920.00 TL",
        "desc": "Kalın Şerit Makarna, dana eti, ıspanak, kırmızı soğan turşusu, susamlı trüflü acı sos Kcal:655",
        "category": "Noodle"
      },
      {
        "name": "Sade Noodle",
        "price": "522.00 TL",
        "desc": "Erişte, noodle sos. Kcal:624",
        "category": "Noodle"
      },
      {
        "name": "Sebzeli Noodle",
        "price": "650.00 TL",
        "desc": "Erişte, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:497",
        "category": "Noodle"
      },
      {
        "name": "Tavuklu Noodle",
        "price": "718.00 TL",
        "desc": "Erişte, tavuk göğüs, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:629",
        "category": "Noodle"
      },
      {
        "name": "Dana Etli Noodle",
        "price": "810.00 TL",
        "desc": "Erişte, dana eti, brokoli, havuç, soya filizi, lahana, yeşil soğan, kapya biber, noodle sos. Kcal:667",
        "category": "Noodle"
      },
      {
        "name": "Karidesli Noodle",
        "price": "870.00 TL",
        "desc": "Erişte, 7 adet jumbo karides, brokoli, havuç, soya filizi, yeşil soğan,lahana, kapya biber, noodle sos. Kcal:596",
        "category": "Noodle"
      },
      {
        "name": "Körili Singapur Noodle",
        "price": "880.00 TL",
        "desc": "Erişte, tavuk göğüs, 3 adet jumbo karides, brokoli, havuç, salatalık, soya filizi, yeşil soğan, kapya biber, yumurta, körili noodle sos. Kcal:646",
        "category": "Noodle"
      },
      {
        "name": "Pad Thai Tavuk",
        "price": "840.00 TL",
        "desc": "Vermicelli Pirinç eriştesi, tavuk göğüs, soya filizi, taze soğan, fıstık, yumurta, lime ve pul biber ile. Kcal:660",
        "category": "Noodle"
      },
      {
        "name": "Pad Thai Karides",
        "price": "966.00 TL",
        "desc": "Vermicelli Pirinç eriştesi, karides, soya filizi, taze soğan, fıstık, yumurta, lime ve pul biber ile. Kcal:649",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Sebzeli Noodle",
        "price": "680.00 TL",
        "desc": "Nissin noodle, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:428",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Tavuklu Noodle",
        "price": "734.00 TL",
        "desc": "Nissin noodle, tavuk göğüs, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:560",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Dana Etli Noodle",
        "price": "840.00 TL",
        "desc": "Nissin noodle, dana eti, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal:601",
        "category": "Noodle"
      },
      {
        "name": "Yaki Soba Karidesli Noodle",
        "price": "900.00 TL",
        "desc": "Nissin noodle, 7 adet jumbo karides, pakçoy, havuç, soya filizi, shitake mantarı, kapya biber, dolma biber, kırmızı soğan, karabiber, noodle sos. Kcal: 487",
        "category": "Noodle"
      },
      {
        "name": "Sade Pilav",
        "price": "388.00 TL",
        "desc": "Buharda pişmiş basmati pilavı. 300 Gr Kcal:390",
        "category": "Pilav"
      },
      {
        "name": "Sebzeli Pilav",
        "price": "470.00 TL",
        "desc": "Buharda pişmiş basmati , bezelye, havuç, mısır, yeşil soğan. beyaz ve kırmızı lahana Kcal:453",
        "category": "Pilav"
      },
      {
        "name": "Sade Pilav 150 Gr",
        "price": "230.00 TL",
        "desc": "Buharda pişmiş basmati pilavı. Kcal:195",
        "category": "Pilav"
      },
      {
        "name": "Yumurtalı Pilav",
        "price": "498.00 TL",
        "desc": "Buharda pişmiş basmati ,yumurta, bezelye, havuç, mısır, yeşil soğan Kcal:483",
        "category": "Pilav"
      },
      {
        "name": "Tavuklu Pilav",
        "price": "592.00 TL",
        "desc": "Buharda pişmiş basmati ,tavuk, yumurta, bezelye, havuç, mısır, yeşil soğan Kcal:549",
        "category": "Pilav"
      },
      {
        "name": "Dana Etli ve Körili Pilav",
        "price": "690.00 TL",
        "desc": "Buharda pişmiş basmati , dana eti, bezelye, yumurta, mantar, havuç, mısır, yeşil soğan, köri, Yumurta. Kcal:569",
        "category": "Pilav"
      },
      {
        "name": "Dana Etli Pilav",
        "price": "690.00 TL",
        "desc": "Buharda pişmiş basmati , dana eti, bezelye, yumurta, havuç, mısır, yeşil soğan Kcal:588",
        "category": "Pilav"
      },
      {
        "name": "Thai Usulü Ananaslı Pilav",
        "price": "670.00 TL",
        "desc": "Buharda pişmiş basmati, ananas, kaju, bezelye, havuç, mısır, yeşil soğan, beyaz ve kırmızı lahana, köri. Kcal:582",
        "category": "Pilav"
      },
      {
        "name": "Karidesli Pilav",
        "price": "798.00 TL",
        "desc": "Buharda pişmiş basmati , karides, bezelye, yumurta, havuç, mısır, yeşil soğan, Kcal:582",
        "category": "Pilav"
      },
      {
        "name": "Hamachi Nigiri (2 Adet)",
        "price": "560.00 TL",
        "desc": "Hamachi Balığı 2 adet Kcal:106",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hamachi Sashimi (12 Adet)",
        "price": "1150.00 TL",
        "desc": "Hamachi Balığı Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hot salmon nigiri",
        "price": "460.00 TL",
        "desc": "Samurai Sos, Teriyaki Sos, Goma wakame, susam (Pürmüzlenmiş) 2 Adet Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Tamago",
        "price": "284.00 TL",
        "desc": "Omlet 2 Adet Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Saba",
        "price": "368.00 TL",
        "desc": "Uskumru",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Kani",
        "price": "388.00 TL",
        "desc": "Surimi 2 Adet Kcal:84",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Maguro",
        "price": "588.00 TL",
        "desc": "Ton 2 Adet Kcal:106",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Toro",
        "price": "600.00 TL",
        "desc": "Yağlı Ton 2 Adet Kcal:130",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Suzuki",
        "price": "378.00 TL",
        "desc": "Levrek 2 Adet Kcal:92",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake",
        "price": "430.00 TL",
        "desc": "Somon 2 Adet Kcal:124",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake Avokado",
        "price": "440.00 TL",
        "desc": "Somon ve Avokado 2 adet Kcal:156",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Ebi",
        "price": "440.00 TL",
        "desc": "Karides 2 adet Kcal:90",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Unagi",
        "price": "750.00 TL",
        "desc": "Yılan Balığı 2 adet Kcal:148",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Ikura",
        "price": "750.00 TL",
        "desc": "Balık Yumurtası 2 adet Kcal:140",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Nigiri Mix 5 Adet",
        "price": "988.00 TL",
        "desc": "",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake Sashimi (12 adet)",
        "price": "1150.00 TL",
        "desc": "120 gr Somon / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir Kcal:250",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Karışık Sashimi (12 adet)",
        "price": "1200.00 TL",
        "desc": "3 Maguro, 3 Somon, 2 Ebi, 2 Levrek, 2 Uskumru / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Maguro Sashimi (12 adet)",
        "price": "1200.00 TL",
        "desc": "120 gr Ton / Soya Sosu,Wasabi ve Zencefil Turşusu ile servis edilmektedir Kcal:176",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Sake & Maguro Sashimi (12 adet)",
        "price": "1200.00 TL",
        "desc": "6 Maguro, 6 Somon / Soya Sosu, Wasabi ve Zencefil Turşusu ile servis edilmektedir",
        "category": "Nigiri / Sashimi"
      },
      {
        "name": "Hamachi Roll (6 Adet)",
        "price": "560.00 TL",
        "desc": "Hamachi Balığı Kcal:181",
        "category": "Sushi Rolls"
      },
      {
        "name": "Kappa Roll",
        "price": "350.00 TL",
        "desc": "Salatalık (6 adet) Kcal:128",
        "category": "Sushi Rolls"
      },
      {
        "name": "Maguro Roll",
        "price": "588.00 TL",
        "desc": "Ton (6 adet) Kcal:181",
        "category": "Sushi Rolls"
      },
      {
        "name": "Ebi Roll",
        "price": "546.00 TL",
        "desc": "Karides (6 adet) Kcal:151",
        "category": "Sushi Rolls"
      },
      {
        "name": "Kani Roll",
        "price": "480.00 TL",
        "desc": "Surimi (6 Adet) Kcal:140",
        "category": "Sushi Rolls"
      },
      {
        "name": "Sake Roll",
        "price": "536.00 TL",
        "desc": "Somon (6 adet) Kcal:206",
        "category": "Sushi Rolls"
      },
      {
        "name": "Unagi Roll",
        "price": "710.00 TL",
        "desc": "Yılan Balığı (6 adet) Kcal:212",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Ebi Roll",
        "price": "550.00 TL",
        "desc": "Karides ve Avokado (6 adet) Kcal:199",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Sake Roll",
        "price": "546.00 TL",
        "desc": "Somon ve Avokado (6 adet) Kcal:254",
        "category": "Sushi Rolls"
      },
      {
        "name": "Avocado Roll",
        "price": "370.00 TL",
        "desc": "(6 adet) Kcal:219",
        "category": "Sushi Rolls"
      },
      {
        "name": "Best Of (22 Parça)",
        "price": "2150.00 TL",
        "desc": "California Roll 8, Philly Roll 8, Sake Roll 6 Kcal: 863",
        "category": "Set Menüler"
      },
      {
        "name": "Lord Of The Rolls (22 Parça)",
        "price": "2560.00 TL",
        "desc": "Trüflü Ebi Tempura Roll, Tokyo Drift Roll, Dragon Roll Kcal: 1598",
        "category": "Set Menüler"
      },
      {
        "name": "Hot'n Roll Set (20 Adet)",
        "price": "2410.00 TL",
        "desc": "Zen Roll 8 parça, Tokyo Drift roll 8 parça, Hot Salmon Nigiri 4 adet Kcal: 1374",
        "category": "Set Menüler"
      },
      {
        "name": "First Kiss Set (24 Adet)",
        "price": "2270.00 TL",
        "desc": "Kibuka Roll 8 parça, Mizu Roll 8 parça, Tsunami Roll 8 parça Kcal: 1483",
        "category": "Set Menüler"
      },
      {
        "name": "California Dream",
        "price": "1580.00 TL",
        "desc": "16 Parça/ California Roll 4, Spicy California Roll 4, Sesame California Roll 4, Black Sesame California Roll 4 Kcal: 859",
        "category": "Set Menüler"
      },
      {
        "name": "Salmon Dream",
        "price": "1680.00 TL",
        "desc": "(16 parça) Philadelphia Roll 4, Spicy Philadelphia Roll 4, Tobikko Philadelphia Roll 4, Black Sesame Philadelphia Roll 4 Kcal:1044",
        "category": "Set Menüler"
      },
      {
        "name": "Sushi King",
        "price": "1920.00 TL",
        "desc": "15 Parça + Edamame/ Sake Roll 3, Kani Roll 3, California Roll 3, Maguro 1, Suzuki 1, Sake 1, Ebi 1, Saba 1, Kani 1 Kcal:785",
        "category": "Set Menüler"
      },
      {
        "name": "Salmon Lovers",
        "price": "2200.00 TL",
        "desc": "20 Parça/ San Diego Roll 6, Philadelphia Roll 6, Sake Roll 6, Sake Nigiri 2 Kcal: 931",
        "category": "Set Menüler"
      },
      {
        "name": "Sushi Prince 1",
        "price": "2940.00 TL",
        "desc": "25 Parça/ California Roll 3, Spicy California Roll 3, Sake Roll 3, Kappa Roll 3, Crunchy Roll 5, Sake Nigiri 2, Suzuki Nigiri 2, Kani Nigiri 2, Ebi Nigiri 2, SushiCo Yosun Salatası Kcal:1141",
        "category": "Set Menüler"
      },
      {
        "name": "Veggie Set Menü",
        "price": "1330.00 TL",
        "desc": "Veggie Roll 8, Avocado Roll 3, Takuan Roll 3, Tamago Nigiri 2, Goma Wakame (16 adet) Kcal:798",
        "category": "Set Menüler"
      },
      {
        "name": "Terı̇yakı̇ Tavuk Udon Bowl",
        "price": "850.00 TL",
        "desc": "Udon noodle, kapya biber, yeşil soğan, brokoli, Tavuk but, noodle sos, teriyaki sos, susam Kcal:1515",
        "category": "Poke Bowl"
      },
      {
        "name": "Salmon Poke Bowl",
        "price": "1200.00 TL",
        "desc": "Sushi Pilavı, Somon, Avokado, İç Edamame, Wakame, Mayonez(Somon),Schimi baharatı/ Soya Sosu ile servis edilmektedir. Kcal:598",
        "category": "Poke Bowl"
      },
      {
        "name": "Teriyaki Somon Bowl",
        "price": "1150.00 TL",
        "desc": "Teriyaki soslu kızarmış somon, avokado, pilav, nori cips ve acı lahana salatası Kcal:1239",
        "category": "Poke Bowl"
      },
      {
        "name": "Salmon & Maguro Poke Bowl",
        "price": "1200.00 TL",
        "desc": "Sushi Pilavı, Somon, Maguro, Edamame, Yosun Salatası, Avokado, Mayonez, Schimi baharatı / Soya Sosu ile servis edilmektedir. Kcal:573",
        "category": "Poke Bowl"
      },
      {
        "name": "Ördek Donburi",
        "price": "940.00 TL",
        "desc": "Ördek,İnce Kıyım Yeşil Soğan,İnce Kıyım Domates, İnce Kıyım Sivri Biber, Schimi Baharatı ve Kuru Soğan / Sos ile servis edilmemektedir. Kcal:1063",
        "category": "Poke Bowl"
      },
      {
        "name": "Chicken Katsu Bowl",
        "price": "850.00 TL",
        "desc": "Pane tavuk göğüs, pilav, coleslaw salad, japon köri sos ile. Kcal:1450",
        "category": "Poke Bowl"
      },
      {
        "name": "Dana Etli Bowl",
        "price": "1030.00 TL",
        "desc": "sebzeli pilav, dana eti, nori cipsi, biber, kırmızı soğan, soya filizi Kcal:884",
        "category": "Poke Bowl"
      },
      {
        "name": "SushiCo Special 1",
        "price": "1180.00 TL",
        "desc": "California Roll, Sake Roll / Dışı Susam Kaplı, 1 Adet Coca-Cola",
        "category": "Özel Menü"
      },
      {
        "name": "SushiCo Special 2",
        "price": "1320.00 TL",
        "desc": "California Roll, Sake Roll / Dışı Susam Kaplı, 1 Kadeh Şarap",
        "category": "Özel Menü"
      },
      {
        "name": "Sushi Keyfi 1",
        "price": "2670.00 TL",
        "desc": "California Roll, Philadelphia Roll, Dragon Roll, Kani Roll, 2 Adet Coca-Cola",
        "category": "Özel Menü"
      },
      {
        "name": "Sushi Keyfi 2",
        "price": "3150.00 TL",
        "desc": "California Roll, Philadelphia Roll, Dragon Roll, Kani Roll, 2 Kadeh Şarap",
        "category": "Özel Menü"
      },
      {
        "name": "Çocuk Menüsü 1",
        "price": "1050.00 TL",
        "desc": "Sushi Banda (6 adet),Çıtır Levrek, Sebzeli Noodle, Mozaik Roll (2 adet)Fuse Tea Veya Cappy",
        "category": "Çocuk Menü"
      },
      {
        "name": "Sushi Banda",
        "price": "570.00 TL",
        "desc": "Tempura Somon Kcal: 239",
        "category": "Çocuk Menü"
      },
      {
        "name": "Baby Shark Roll (8 Adet)",
        "price": "680.00 TL",
        "desc": "Pankolu Levrek, Mayonez, Kıtır patates Kcal:387",
        "category": "Çocuk Menü"
      },
      {
        "name": "Baby Bento Menü",
        "price": "680.00 TL",
        "desc": "Susamlı Tavuk, Parmesanlı Mısır Topları(4 Adet), Soft İçecek Kcal:1389",
        "category": "Çocuk Menü"
      },
      {
        "name": "Çocuk Menüsü 2",
        "price": "1050.00 TL",
        "desc": "Sebzeli Erişte, Çıtır Mantı 2 Adet, Tavuk Topları, Ballı Kızarmış Muz,Fustea veya Cappy Kcal: 1944",
        "category": "Çocuk Menü"
      },
      {
        "name": "Bento Menü 1",
        "price": "1450.00 TL",
        "desc": "Edamame, Trüflü Ebi Tempura Roll (8 adet), Philly Roll (8 adet), Hot Salmon Nigiri (2 adet), Coca-Cola Kcal:1306",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento",
        "price": "1180.00 TL",
        "desc": "Edamame, Dana Etli Gyoza (3 adet), Seçeceğiniz 1 Special Roll, Coca-Cola / Unagi içeren ürünler için +10 TL eklenir",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 2",
        "price": "1040.00 TL",
        "desc": "1 adet çin böreği, sebzeli noodle, mançuryan tavuk Kcal: 1209",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 3",
        "price": "1100.00 TL",
        "desc": "Çıtır Çin Mantısı (2 adet) / Karışık Sebzeli Dana Eti, Körili Sebzeli Pilav / Coca-Cola",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 5",
        "price": "1180.00 TL",
        "desc": "Sebzeli Egg Noodle 1/2 pors, Acı Lahana Salatası 1/2 pors, seçeceğiniz bir Cooked Roll ile",
        "category": "Bento Menü"
      },
      {
        "name": "Trio Bento 6",
        "price": "940.00 TL",
        "desc": "Levrek Bun 2 adet, Fresh Kimchi Salad 1 pors Kcal:1141",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 2",
        "price": "1200.00 TL",
        "desc": "Çıtır Çin Mantısı (2 adet), Zencefil Soslu Çıtır Tavuk, Sebzeli Noodle, Acı Lahana Salatası, Coca-Cola *12.00-17.00 arası geçerlidir Kcal:1010",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 3",
        "price": "1450.00 TL",
        "desc": "Edamame, Sesame Maki Roll (6 adet), California Roll (6 adet), Sake Roll (6 adet), Coca-Cola *12.00-22.00 arası geçerlidir Kcal:762",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 4",
        "price": "1450.00 TL",
        "desc": "Tavuk Topları (4 adet), Sebzeli Noodle, Ebi Ten Roll (5 adet), Sake Ten Roll (3 adet), Coca-Cola - (Pişmiş roller bulunur) *12.00-22.00* arası geçerlidir Kcal:1217",
        "category": "Bento Menü"
      },
      {
        "name": "Bento Menü 5",
        "price": "1450.00 TL",
        "desc": "California Roll (6 adet), Philadelphia Roll (6 adet), Kappa Roll (6 adet), SushiCo Yosun Salatası, Coca-Cola Kcal:689",
        "category": "Bento Menü"
      },
      {
        "name": "Crunchy Calı̇fornı̇a Roll (8 Adet)",
        "price": "830.00 TL",
        "desc": "Surumi Yengeç, avokado,çıtır soğan, teriyaki sos, acılı mayonez Kcal:421",
        "category": "Special Roll"
      },
      {
        "name": "Hikari Roll (8 Adet)",
        "price": "830.00 TL",
        "desc": "Salatalık, avokado, çıtır patates, hamachi, trüf mantarı, hikari sos Kcal:331",
        "category": "Special Roll"
      },
      {
        "name": "Mizu Roll",
        "price": "816.00 TL",
        "desc": "Somon, maguro, mango/ salatalık, krem peynir, yuzu mayonez, ikura Kcal:489",
        "category": "Special Roll"
      },
      {
        "name": "Sesame Maki Roll",
        "price": "824.00 TL",
        "desc": "Karides, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Susam (8 adet) Kcal:277",
        "category": "Special Roll"
      },
      {
        "name": "Süper Salmon Roll (8 Adet)",
        "price": "836.00 TL",
        "desc": "Somon, krem paynir, salatalık / Kızarmış panko, yuzu mayonez Kcal:555",
        "category": "Special Roll"
      },
      {
        "name": "Osaka Roll (8 adet)",
        "price": "820.00 TL",
        "desc": "Avokado, salatalık, krem peynir/ pürmüzlenmiş somon, goma wakame, siyah ve beyaz susam, teriyaki sos. Kcal:419",
        "category": "Special Roll"
      },
      {
        "name": "Kimchi Tuna Roll (8 adet)",
        "price": "816.00 TL",
        "desc": "Salatalık, avokado/ maguro, taze soğan, kimchi sos, frenk soğanı. Kcal:227",
        "category": "Special Roll"
      },
      {
        "name": "California Roll",
        "price": "824.00 TL",
        "desc": "Surimi Yengeç, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Tobikko (8 adet) Kcal:303",
        "category": "Special Roll"
      },
      {
        "name": "Spicy California Roll",
        "price": "824.00 TL",
        "desc": "Surimi Yengeç, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Tobikko ve Acı Baharat (8 adet) Kcal:309",
        "category": "Special Roll"
      },
      {
        "name": "Philadelphia Roll",
        "price": "824.00 TL",
        "desc": "Somon, Kıvırcık, Salatalık, Krem Peynir / Dışı Susam (8 adet) Kcal:284",
        "category": "Special Roll"
      },
      {
        "name": "Spicy Philadelphia Roll",
        "price": "824.00 TL",
        "desc": "Somon, Kıvırcık, Salatalık, Krem Peynir / Dışı Acı Baharat (8 adet) Kcal:338",
        "category": "Special Roll"
      },
      {
        "name": "Ebi California Roll",
        "price": "824.00 TL",
        "desc": "Karides, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Masago (8 adet) Kcal:330",
        "category": "Special Roll"
      },
      {
        "name": "San Diego Roll",
        "price": "810.00 TL",
        "desc": "Somon, Avokado, Salatalık / Dışı Masago (6 adet) Kcal:317",
        "category": "Special Roll"
      },
      {
        "name": "Mango Roll",
        "price": "838.00 TL",
        "desc": "Somon, Avokado, Krem Peynir / Dışı Mango & Masago (8 adet) Kcal:342",
        "category": "Special Roll"
      },
      {
        "name": "Crunchy Roll",
        "price": "810.00 TL",
        "desc": "Yengeç Salatası, Mayonez / Dışı Tobikko (5 adet) Kcal:226",
        "category": "Special Roll"
      },
      {
        "name": "Rainbow Roll",
        "price": "824.00 TL",
        "desc": "Surimi Yengeç, Salatalık / Dışı Somon, Avokado, Ton Balığı, Levrek (6 adet) Kcal:268",
        "category": "Special Roll"
      },
      {
        "name": "Veggie Roll",
        "price": "660.00 TL",
        "desc": "Green Bean tempura, Avokado, Havuç, Salatalık, Kıvırcık / Dışı Susam (8 adet) Kcal:283",
        "category": "Special Roll"
      },
      {
        "name": "Tiger Roll",
        "price": "850.00 TL",
        "desc": "Yılan Balığı, Avokado, Salatalık, Krem Peynir, Acı Sos / Dışı Karides (5 adet) Kcal:321",
        "category": "Special Roll"
      },
      {
        "name": "Two Way Salmon Roll",
        "price": "826.00 TL",
        "desc": "Somon, Salatalık, Krem Peynir / Dışı Pürmüzlenmiş Somon, Ponzu Sos, Teriyaki Sos ve Acı Sos ile (5 adet) Kcal:355",
        "category": "Special Roll"
      },
      {
        "name": "Exotic Roll 8 adet",
        "price": "660.00 TL",
        "desc": "Avokado / Mango Kcal:265",
        "category": "Special Roll"
      },
      {
        "name": "Golden Ebi Roll (8 Adet)",
        "price": "880.00 TL",
        "desc": "Golden Ebi, mango, krem peynir, avokado, tenkasu, yuzu mayonez (acılı) Kcal:443",
        "category": "Cooked Roll"
      },
      {
        "name": "Riki Roll (8pcs)",
        "price": "860.00 TL",
        "desc": "Tempura levrek, avokado,krem peynir/ dışı yuzulu mayonez, pırasa kıtırı Kcal:458",
        "category": "Cooked Roll"
      },
      {
        "name": "Tsunami Roll",
        "price": "880.00 TL",
        "desc": "Tempura somon, salatalık, avokado/ lezzetlendirilmiş panko, samurai sos, mikro yeşillik Kcal:455",
        "category": "Cooked Roll"
      },
      {
        "name": "Corn Tempura Roll (8 adet)",
        "price": "880.00 TL",
        "desc": "Tempura karides, salatalık, avokado /dışı corn tempura, trüflü mayonez ve schimi baharatı Kcal:579",
        "category": "Cooked Roll"
      },
      {
        "name": "Zen Roll (8 adet)",
        "price": "880.00 TL",
        "desc": "Tempura karides, avokado/ dışı trüf mantar dilimleri, trüflü mayonez,schimi baharatı Kcal:382",
        "category": "Cooked Roll"
      },
      {
        "name": "Yuzu Special Roll",
        "price": "880.00 TL",
        "desc": "Kızarmış Levrek, Salatalık, Avokado, / Dışı pürmüzlenmiş Levrek, mikro filizi, tobikko, yuzu sos Kcal:391",
        "category": "Cooked Roll"
      },
      {
        "name": "Kibuka Roll (8 pcs)",
        "price": "860.00 TL",
        "desc": "Tempura karides, avokado, takuan/dışı pürmüzlenmiş somon, acılı mayonez,soğan turşusu, beyaz ve siyah susam Kcal:539",
        "category": "Cooked Roll"
      },
      {
        "name": "Sake Teriyaki Roll (8 adet)",
        "price": "860.00 TL",
        "desc": "Teriyaki sos ile pişirilmiş somon, salatalık, avokado/ tenkasu, yuzu mayonez, teriyaki sos. Kcal:472",
        "category": "Cooked Roll"
      },
      {
        "name": "Sake Ten Roll",
        "price": "860.00 TL",
        "desc": "Kızarmış Somon, Avokado, Salatalık, Mayonez, Kıvırcık / Dışı Masago (6 adet) Kcal:358",
        "category": "Cooked Roll"
      },
      {
        "name": "Ebi Ten Roll",
        "price": "860.00 TL",
        "desc": "Kızarmış Karides, Avokado, Mayonez, Masago / Dışı Susam (5 adet) Kcal:368",
        "category": "Cooked Roll"
      },
      {
        "name": "Samurai Roll",
        "price": "820.00 TL",
        "desc": "Kızarmış Karides, Avokado, Kıvırcık, Japon Turbu / Dışı Susam ve Masago (8 adet)",
        "category": "Cooked Roll"
      },
      {
        "name": "Philly Roll",
        "price": "880.00 TL",
        "desc": "Surimi Yengeç, Avokado, Krem Peynir / Dışı Kızarmış (8 adet) Kcal:354",
        "category": "Cooked Roll"
      },
      {
        "name": "İstanbul Roll",
        "price": "880.00 TL",
        "desc": "Kızarmış Karides, Avokado, Mayonez, Salatalık, Masago / Dışı Kızarmış Somon (5 adet) Kcal:362",
        "category": "Cooked Roll"
      },
      {
        "name": "Dragon Roll",
        "price": "920.00 TL",
        "desc": "Avokado, Salatalık/ Dışı Yılan Balığı (6 adet) Kcal:302",
        "category": "Cooked Roll"
      },
      {
        "name": "Tokyo Drift Roll",
        "price": "880.00 TL",
        "desc": "Kızarmış Somon,Mayonez, Avokado, Salatalık / Masago, Kıtır Patates (8 adet) Kcal:640",
        "category": "Cooked Roll"
      },
      {
        "name": "Trüflü Ebi Tempura Roll",
        "price": "880.00 TL",
        "desc": "Kızarmış Karides, Avokado, Salatalık / Dışı Trüf Yağlı Mayonez, Kıtır Patates, Teriyaki Sos, Beyaz Susam (8 adet) Kcal:656",
        "category": "Cooked Roll"
      },
      {
        "name": "Fish & Chips Roll",
        "price": "880.00 TL",
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
        "price": "820.00 TL",
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
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Mochi (Çikolata)",
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Mochi (Çilek)",
        "price": "260.00 TL",
        "desc": "1 Adet",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Dondurma",
        "price": "498.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Kcal:974",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Dondurma",
        "price": "498.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Çikolata Kcal:974",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Muz",
        "price": "484.00 TL",
        "desc": "Kızarmış ceviz ve bal ile. Kcal:1084",
        "category": "Tatlılar"
      },
      {
        "name": "Sweet Roll",
        "price": "536.00 TL",
        "desc": "Muz, Armut, Yeşil elma, kızarmış ceviz, bal, nutella, çilek",
        "category": "Tatlılar"
      },
      {
        "name": "Mozaik Roll",
        "price": "460.00 TL",
        "desc": "Kcal:389",
        "category": "Tatlılar"
      },
      {
        "name": "BUN’utella (2 Adet)",
        "price": "460.00 TL",
        "desc": "Nutella, muz, çilek, yer fıstığı. Kcal:502",
        "category": "Tatlılar"
      },
      {
        "name": "Kızarmış Ceviz",
        "price": "494.00 TL",
        "desc": "Kcal:671",
        "category": "Tatlılar"
      },
      {
        "name": "Kyoto Cheesecake",
        "price": "430.00 TL",
        "desc": "",
        "category": "Tatlılar"
      },
      {
        "name": "Apple pie rolls",
        "price": "460.00 TL",
        "desc": "kırmızı elma, ceviz, tarçın harcı, bal Kcal:779",
        "category": "Tatlılar"
      },
      {
        "name": "Limon Sorbe",
        "price": "342.00 TL",
        "desc": "Kcal: 162",
        "category": "Tatlılar"
      },
      {
        "name": "Coca-Cola",
        "price": "168.00 TL",
        "desc": "Orijinal Tat / Zero Sugar",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Fanta",
        "price": "168.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Sprite",
        "price": "168.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Cappy",
        "price": "168.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Fuse Tea",
        "price": "168.00 TL",
        "desc": "Şeftali / Limon",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Su",
        "price": "104.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Su (750 ml)",
        "price": "216.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Minera Maden Suyu",
        "price": "168.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Damla Minera Maden Suyu (750 ml)",
        "price": "230.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Schweppes",
        "price": "168.00 TL",
        "desc": "Mandarin / Bitter Lemon",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Limonata",
        "price": "230.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Taze Sıkılmış Portakal Suyu",
        "price": "254.00 TL",
        "desc": "",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Rem",
        "price": "420.00 TL",
        "desc": "Havlıcan / Reyhan",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Milk Oolong",
        "price": "194.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Espresso",
        "price": "176.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Americano",
        "price": "198.00 TL",
        "desc": "",
        "category": "Sıcak İçecekler"
      },
      {
        "name": "Türk Kahvesi",
        "price": "166.00 TL",
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
        "name": "Borgobruno ( Karaf )",
        "price": "970.00 TL",
        "desc": "",
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
        "name": "Akın Gürbüz ( Şişe )",
        "price": "3030.00 TL",
        "desc": "Kırmızı Şarap",
        "category": "Kırmızı Şarap"
      },
      {
        "name": "Selection Narince Emir ( Karaf )",
        "price": "1520.00 TL",
        "desc": "",
        "category": "Beyaz Şarap"
      },
      {
        "name": "Khilon ( Şişe )",
        "price": "3790.00 TL",
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
        "name": "Tokyo Zen Green Tea Lager",
        "price": "470.00 TL",
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
        "name": "Tuborg Ice 33 cl",
        "price": "300.00 TL",
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
        "name": "Jameson (5cl)",
        "price": "610.00 TL",
        "desc": "",
        "category": "WHİSKEY"
      },
      {
        "name": "Olmeca Altos (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Tekila"
      },
      {
        "name": "Havana Club (5cl)",
        "price": "510.00 TL",
        "desc": "",
        "category": "Rom"
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
        "name": "Absolute Blue (5cl)",
        "price": "550.00 TL",
        "desc": "",
        "category": "Votka"
      },
      {
        "name": "Beefeater Pink",
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
        "name": "Sparkling Sake Spritz",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
      },
      {
        "name": "Beefeater Gin",
        "price": "740.00 TL",
        "desc": "",
        "category": "Gin Tonic & Spritz"
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
        "name": "Over The Rainbow",
        "price": "220.00 TL",
        "desc": "",
        "category": "Moctails"
      },
      {
        "name": "Citrus Lemonade",
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
        "name": "Espresso Martini",
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
        "name": "Margarita",
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
        "name": "Negroni",
        "price": "740.00 TL",
        "desc": "",
        "category": "Classic Kokteyller"
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
        "name": "Satsuma",
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
        "name": "Dynamite",
        "price": "750.00 TL",
        "desc": "",
        "category": "Signature Kokteyller"
      },
      {
        "name": "Damso ( Orijinal-Peach-Blueberry-Lhychee) Soju",
        "price": "780.00 TL",
        "desc": "35 cl",
        "category": "DAMSO ARİJİNAL SOJU"
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
      }
    ]
  },
  "7198": {
    "name": "Papa John's Pizza Beşiktaş",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/byjp/papa-johns-pizza-byjp",
    "sourceName": "Yemeksepeti / Papa John's Beşiktaş",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Algidalı Büyük Boy Menü",
        "price": "654,49 TL769,99 TL",
        "desc": "Valid for vegetarian pizzas. Special pizzas can be purchased for 44 TL, World pizzas for 54 TL, Classic pizzas for 74 TL.",
        "category": "Algida Special Menu Category"
      },
      {
        "name": "Algidalı Orta Boy Menü",
        "price": "569,49 TL669,99 TL",
        "desc": "Vejetaryen pizzalar için geçerlidir. Özel pizzalar 34 TL, Dünya pizzalar 44 TL, Klasik pizzalar 64 TL farkla alınabilir",
        "category": "Algida Special Menu Category"
      },
      {
        "name": "Love-Filled Menu",
        "price": "790,49 TL929,99 TL",
        "desc": "Enjoy the taste of love with a Heart-Shaped Pepperoni Pizza specially made for Valentine’s Day, 2 delicious soufflés, and 1 L drink",
        "category": "Deals of the Month"
      },
      {
        "name": "Big Size Pepperoni Deal",
        "price": "518,49 TL609,99 TL",
        "desc": "1 Large Pepperoni Pizza",
        "category": "Deals of the Month"
      },
      {
        "name": "Single Medium Pizza",
        "price": "424,99 TL499,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 34 TL, World pizzas for 44 TL, and Classic pizzas for 64 TL",
        "category": "Deals of the Month"
      },
      {
        "name": "Single Large Pizza",
        "price": "543,99 TL639,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 44 TL, World pizzas for 54 TL, and Classic pizzas for 74 TL",
        "category": "Deals of the Month"
      },
      {
        "name": "Large Spinach Alfredo Deal",
        "price": "535,49 TL629,99 TL",
        "desc": "A delicious pizza made with rich Alfredo sauce and mozzarella cheese",
        "category": "Deals of the Month"
      },
      {
        "name": "Large Garlic Basil Cheddar Cheese Pizza Deal",
        "price": "535,49 TL629,99 TL",
        "desc": "Garlic, basil, cheddar cheese, mozzarella cheese",
        "category": "Deals of the Month"
      },
      {
        "name": "Large Mixed Papa Menu",
        "price": "679,99 TL799,99 TL",
        "desc": "Mixed Papa Pizza (Large) + Drink of Your Choice (1 L) + Sauce",
        "category": "Deals of the Month"
      },
      {
        "name": "Large Pepperoni Pizza + 2 Garlic Sauce",
        "price": "560,99 TL659,99 TL",
        "desc": "Large Pepperoni Pizza + 2 Pieces Garlic Sauce",
        "category": "Deals of the Month"
      },
      {
        "name": "Large Pepperoni Pizza – Lipton Sparkling",
        "price": "552,49 TL649,99 TL",
        "desc": "Büyük Boy Pepperoni Pizza + Elma Dilim Patates + Sarımsak Sos + Lipton Ice Tea Sparkling",
        "category": "Deals of the Month"
      },
      {
        "name": "2-Piece Callzone Menu",
        "price": "744,57 TL875,96 TL",
        "desc": "Choose 2 Callzones",
        "category": "Deals of the Month"
      },
      {
        "name": "Callzone Menü",
        "price": "470,02 TL552,97 TL",
        "desc": "Choose your Callzone Apple Slice Potato Drink (33 cl.)",
        "category": "Deals of the Month"
      },
      {
        "name": "Medium Pizza & Canned Drink & Garlic Sauce",
        "price": "492,99 TL579,99 TL",
        "desc": "Your choice of Medium Pizza + Garlic Sauce + Canned Drink",
        "category": "Legendary Menus"
      },
      {
        "name": "Medium Pepperoni Pizza & Garlic Sauce",
        "price": "424,99 TL499,99 TL",
        "desc": "Medium Pepperoni Pizza + Garlic Sauce",
        "category": "Legendary Menus"
      },
      {
        "name": "2 Medium Pizzas + 1 Liter Drink",
        "price": "764,99 TL899,99 TL",
        "desc": "Your choice of 2 Medium Pizzas + 1 Liter Drink",
        "category": "Legendary Menus"
      },
      {
        "name": "Medium Spinach Alfredo Pizza Deal",
        "price": "416,49 TL489,99 TL",
        "desc": "Spinach Alfredo Pizza (Medium)",
        "category": "Legendary Menus"
      },
      {
        "name": "Medium Garlic Basil Cheddar Cheese Pizza Deal",
        "price": "416,49 TL489,99 TL",
        "desc": "Garlic Basil Cheddar Cheese Pizza (Medium)",
        "category": "Legendary Menus"
      },
      {
        "name": "Red Bull Menu (Large)",
        "price": "722,49 TL849,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 44 TL, World pizzas for 54 TL, and Classic pizzas for 74 TL",
        "category": "Special Offers Menus"
      },
      {
        "name": "3 Medium Pizzas",
        "price": "1.019,99 TL1.199,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 34 TL, World pizzas for 44 TL, and Classic pizzas for 64 TL",
        "category": "Special Offers Menus"
      },
      {
        "name": "Party Menu",
        "price": "1.036,99 TL1.219,99 TL",
        "desc": "2 Large Pizzas + 1 Liter Drink + Free Lipton (1 L.) (Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 44 TL, World pizzas for 54 TL, and Classic pizzas for 74 TL)",
        "category": "Special Offers Menus"
      },
      {
        "name": "Large Duo Menu",
        "price": "960,49 TL1.129,99 TL",
        "desc": "2 Large Pizzas (Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 44 TL, World pizzas for 54 TL, and Classic pizzas for 74 TL)",
        "category": "Special Offers Menus"
      },
      {
        "name": "Mega Filler Menu",
        "price": "2.719,99 TL3.199,99 TL",
        "desc": "Pepperoni Pizza (Large) + Meatball Pizza (Large) + Doner Pizza (Large) + 2 Potato Wedges + 2 Chocolate Soufflés + 2 Liter Drinks",
        "category": "Special Offers Menus"
      },
      {
        "name": "Medium Duo Menu",
        "price": "722,49 TL849,99 TL",
        "desc": "2 Medium Pizzas (Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 34 TL, World pizzas for 44 TL, and Classic pizzas for 64 TL)",
        "category": "Match Menus"
      },
      {
        "name": "Medium Pizza with Garlic Dip Sauce",
        "price": "441,99 TL519,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 34 TL, World pizzas for 44 TL, and Classic pizzas for 64 TL",
        "category": "Garlic Flavors"
      },
      {
        "name": "Large Pizza with Garlic Dip Sauce",
        "price": "552,49 TL649,99 TL",
        "desc": "Valid for vegetarian pizzas. Specialty pizzas can be selected for an additional 34 TL, World pizzas for 54 TL, and Classic pizzas for 74 TL",
        "category": "Garlic Flavors"
      },
      {
        "name": "Papa's Rolls",
        "price": "203,99 TL239,99 TL",
        "desc": "Flavor of your choice on Ranch Sauce",
        "category": "Starters"
      },
      {
        "name": "Pepperoni Roll",
        "price": "216,74 TL254,99 TL",
        "desc": "Pepperoni and mozzarella cheese on ranch sauce (8 Roll pieces)",
        "category": "Starters"
      },
      {
        "name": "Classic Breadstick",
        "price": "148,74 TL174,99 TL",
        "desc": "6 oven-baked sticks. Served with pizza sauce and special garlic sauce.",
        "category": "Starters"
      },
      {
        "name": "Apple Sliced Fries",
        "price": "110,49 TL129,99 TL",
        "desc": "200g of wedge-cut potatoes, oven-baked until golden. Served with BBQ dipping sauce.",
        "category": "Starters"
      },
      {
        "name": "Pickled Peppers (4 pcs)",
        "price": "25,49 TL29,99 TL",
        "desc": "4 pieces",
        "category": "Starters"
      },
      {
        "name": "Pickled Peppers (6 pcs)",
        "price": "35,69 TL41,99 TL",
        "desc": "6 pieces",
        "category": "Starters"
      },
      {
        "name": "Pickled Peppers (20 pcs)",
        "price": "84,99 TL99,99 TL",
        "desc": "20 pieces",
        "category": "Starters"
      },
      {
        "name": "Chicken Poppers",
        "price": "314,49 TL369,99 TL",
        "desc": "10 chicken nuggets. Served with BBQ dipping sauce.",
        "category": "Starters"
      },
      {
        "name": "Classic Breadsticks with Special Garlic Parmesan Sauce",
        "price": "169,99 TL199,99 TL",
        "desc": "6 oven-baked sticks, special garlic sauce, parmesan cheese. Served with pizza sauce.",
        "category": "Starters"
      },
      {
        "name": "Cheese Breadstick",
        "price": "356,99 TL419,99 TL",
        "desc": "Papa John’s fresh dough, special garlic sauce, mozzarella cheese. Served with pizza sauce.",
        "category": "Starters"
      },
      {
        "name": "Papa’s Feast Platter",
        "price": "424,99 TL499,99 TL",
        "desc": "4 chicken wings, 200g of wedge-cut potatoes, 4 chicken poppers. Served with hot sauce and BBQ dipping sauce.",
        "category": "Starters"
      },
      {
        "name": "Chicken Wings (8 pcs)",
        "price": "424,99 TL499,99 TL",
        "desc": "Served with BBQ dipping sauce.",
        "category": "Starters"
      },
      {
        "name": "Cheese Croissant",
        "price": "254,99 TL299,99 TL",
        "desc": "8 delicious Papa John’s style cheesy croissants.",
        "category": "Starters"
      },
      {
        "name": "Callzone with Spicy Sausage",
        "price": "249,04 TL292,99 TL",
        "desc": "Mozzarella cheese, diced sausage, jalapeno peppers, garlic sauce",
        "category": "Starters"
      },
      {
        "name": "Hidden Mediterranean Callzone",
        "price": "249,04 TL292,99 TL",
        "desc": "Mozzarella cheese, feta cheese, tomatoes, black olives, garlic sauce",
        "category": "Starters"
      },
      {
        "name": "Callzone with Plenty of Cheese",
        "price": "249,04 TL292,99 TL",
        "desc": "Mozzarella cheese, halloumi cheese, cheddar cheese, parmesan cheese, garlic sauce",
        "category": "Starters"
      },
      {
        "name": "Create Your Own Pizza (Medium)",
        "price": "467,49 TL549,99 TL",
        "desc": "With pizza sauce, mozzarella cheese and toppings of your choice",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Bodrum Pizza (Medium)",
        "price": "467,49 TL549,99 TL",
        "desc": "Pizza sauce, mozzarella cheese, sliced tomatoes",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Margherita Pizza (Medium)",
        "price": "467,49 TL549,99 TL",
        "desc": "Pizza sauce, mozzarella cheese",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Mediterranean Pizza (Medium)",
        "price": "467,49 TL549,99 TL",
        "desc": "Mozzarella cheese, white onion, tomato, black olives, white cheese",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Garden Delight Pizza (Medium)",
        "price": "467,49 TL549,99 TL",
        "desc": "Mozzarella cheese, sliced fresh tomatoes, fresh mushrooms, white onion, green pepper, black olives, corn",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Pepperoni Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "Mozzarella cheese, extra pepperoni, pizza sauce",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Favorite Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "Mozzarella cheese, pepperoni, mushroom, corn",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "BBQ Chicken Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, white onion, fresh mushrooms, barbecue sauce",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Buddy Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "Mozzarella cheese, sausage, mushrooms, onion, green pepper, ham (halal)",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Carnival Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, pepperoni, mushrooms, black olives",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "BBQ Blaze Pizza (Medium)",
        "price": "488,74 TL574,99 TL",
        "desc": "BBQ sauce on top; mozzarella cheese, meatballs, pepperoni, mushrooms, jalapeno pepper",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Mexican Wave Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, sliced fresh tomatoes, white onion, green pepper, jalapeno pepper, corn",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Pera Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, grilled chicken, mushrooms, roasted red peppers, jalapeno peppers",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Fiery Red Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, sausage, red pepper, mushroom, black olives",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Quattro Formaggi Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, halloumi cheese, fresh kashar cheese, parmesan cheese",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Hawaiian Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, ham (halal), pineapple, extra cheese",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Mixed Papa Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, sausage, mushrooms, corn, black olives, Turkish sausage (sucuk)",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Sailor’s Pizza (Medium)",
        "price": "509,99 TL599,99 TL",
        "desc": "Mozzarella cheese, corn, tuna, onion, tomato",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Roast Meat Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Green pepper, onion, braised beef, roasted red peppers",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Fresh Mozzarella Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Fresh mozzarella in brine, green pepper, tomato, roasted red peppers",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Meat Lover’s Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Diced Turkish sausage (sucuk), pepperoni, ham (halal)",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Carnivore Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, special ground meat, ham (halal)",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Ottoman Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, Turkish sausage (sucuk), pastirma, feta cheese, green pepper, black olives",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Little Italy Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, mushrooms, black olives, oregano",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Super Papa’s Pizza (Medium)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, ham (halal), fresh mushrooms, white onion, green pepper, black olives",
        "category": "Medium Pizzas (Serves 2)"
      },
      {
        "name": "Vegan Pizza (Large)",
        "price": "467,49 TL549,99 TL",
        "desc": "Pizza sauce, tomato, mushrooms, onion, green pepper, olives, corn (Contains no animal products or cheese.)",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Create Your Own Pizza (Large)",
        "price": "552,49 TL649,99 TL",
        "desc": "Pizza sauce, mozzarella cheese, and your choice of toppings",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Bodrum Pizza (Large)",
        "price": "552,49 TL649,99 TL",
        "desc": "Pizza sauce, mozzarella cheese, sliced tomatoes",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Garden Delight Pizza (Large)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, sliced fresh tomatoes, fresh mushrooms, white onion, green pepper, black olives, corn",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Mediterranean Pizza (Large)",
        "price": "552,49 TL649,99 TL",
        "desc": "Mozzarella cheese, white onion, tomato, black olives, feta cheese",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Margherita Pizza (Large)",
        "price": "552,49 TL649,99 TL",
        "desc": "Pizza sauce, mozzarella cheese",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "BBQ Chicken Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, white onion, fresh mushrooms, barbecue sauce",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Pepperoni Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Mozzarella cheese, extra pepperoni, pizza sauce",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Buddy Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Mozzarella cheese, sausage, mushroom, onion, green pepper, ham (halal)",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Favorite Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Mozzarella cheese, pepperoni, mushroom, corn",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Carnival Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, pepperoni, mushroom, black olives",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Pera Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, grilled chicken, mushroom, roasted red pepper, jalapeno pepper",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Fiery Red Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, Turkish sausage (sucuk), red roasted pepper, mushroom, black olives",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Hawaiian Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, ham (halal), pineapple, extra cheese",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "BBQ Blaze Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "On BBQ sauce; mozzarella cheese, meatballs, pepperoni, mushroom, jalapeno pepper",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Mexican Wave Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, sliced fresh tomatoes, white onion, green pepper, jalapeno pepper, corn",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Sailor’s Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, corn, tuna, onion, tomato",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Quattro Formaggi Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, halloumi cheese, fresh kashar cheese, parmesan cheese",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Roast Meat Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Green pepper, onion, braised meat, roasted red pepper",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Fresh Mozzarella Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Fresh mozzarella in water, green pepper, tomato, roasted red pepper",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Meat Lover’s Pizza (Large)",
        "price": "573,74 TL674,99 TL",
        "desc": "Cubed Turkish sausage (sucuk), pepperoni, ham (halal)",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Super Papa’s Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, ham (halal), fresh mushroom, white onion, green pepper, black olives",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Carnivore Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, special minced meat, ham (halal)",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Little Italy Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, mushroom, black olives, oregano",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Ottoman Pizza (Large)",
        "price": "679,99 TL799,99 TL",
        "desc": "Mozzarella cheese, Turkish sausage (sucuk), pastrami, white cheese, green pepper, black olives",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Mixed Papa Pizza (Large)",
        "price": "594,99 TL699,99 TL",
        "desc": "Mozzarella cheese, sausage, mushroom, corn, black olives, Turkish sausage (sucuk)",
        "category": "Large Pizzas (Serves 3–4)"
      },
      {
        "name": "Vegan Pizza (Small)",
        "price": "244,79 TL287,99 TL",
        "desc": "Pizza sauce, tomato, mushroom, onion, green pepper, olives, corn (Does not contain animal products or cheese.)",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Create Your Own Pizza (Small)",
        "price": "297,49 TL349,99 TL",
        "desc": "Pizza sauce, mozzarella cheese and ingredients of your choice",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Bodrum Pizza (Small)",
        "price": "297,49 TL349,99 TL",
        "desc": "Pizza sauce, mozzarella cheese, sliced tomato",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Mediterranean Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, white onion, tomato, black olives, white cheese",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Garden Delight Pizza (Small)",
        "price": "297,49 TL349,99 TL",
        "desc": "Mozzarella cheese, sliced fresh tomato, fresh mushroom, white onion, green pepper, black olives, corn",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Margherita Pizza (Small)",
        "price": "297,49 TL349,99 TL",
        "desc": "Pizza sauce, mozzarella cheese",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Pepperoni Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Mozzarella cheese, extra pepperoni, pizza sauce",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "BBQ Chicken Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, white onion, fresh mushroom, barbecue sauce",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Buddy Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Mozzarella cheese, sausage, mushroom, onion, green pepper, ham (halal)",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Carnival Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, pepperoni, mushroom, black olives",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Favorite Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Mozzarella cheese, pepperoni, mushroom, corn",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Quattro Formaggi Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, halloumi cheese, fresh kashar cheese, parmesan cheese",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Mexican Wave Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, grilled chicken, sliced fresh tomato, white onion, green pepper, jalapeno pepper, corn",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Pera Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, pizza sauce, grilled chicken, mushroom, roasted red pepper, jalapeno pepper",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Fiery Red Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, Turkish sausage (sucuk), red roasted pepper, mushroom, black olives",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Hawaiian Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, ham (halal), pineapple, extra cheese",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "BBQ Blaze Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "On BBQ sauce; mozzarella cheese, meatballs, pepperoni, mushroom, jalapeno pepper",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Mixed Papa Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, sausage, mushroom, corn, black olives, Turkish sausage (sucuk)",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Sailor’s Pizza (Small)",
        "price": "339,99 TL399,99 TL",
        "desc": "Mozzarella cheese, corn, tuna, onion, tomato",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Roast Meat Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Green pepper, onion, braised meat, roasted red pepper",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Meat Lover’s Pizza (Small)",
        "price": "314,49 TL369,99 TL",
        "desc": "Cubed Turkish sausage (sucuk), pepperoni, ham (halal)",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Fresh Mozzarella Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Fresh mozzarella in water, green pepper, tomato, roasted red pepper",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Carnivore Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, special minced meat, ham (halal)",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Ottoman Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Mozzarella cheese, Turkish sausage (sucuk), pastrami, white cheese, green pepper, black olives",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Super Papa’s Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, ham (halal), fresh mushroom, white onion, green pepper, black olives",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Little Italy Pizza (Small)",
        "price": "382,49 TL449,99 TL",
        "desc": "Mozzarella cheese, pepperoni, Italian meatballs, mushroom, black olives, oregano",
        "category": "Small Pizzas (Serves 1)"
      },
      {
        "name": "Algida Maraş Cup (105 ml)",
        "price": "84,99 TL99,99 TL",
        "desc": "(105 ml.)",
        "category": "Ice Creams"
      },
      {
        "name": "Algida Carte d'Or Chocolate Dream (110 ml)",
        "price": "101,99 TL119,99 TL",
        "desc": "100 ml.",
        "category": "Ice Creams"
      },
      {
        "name": "Carte D'or Fruit Dream Cup (110 ml)",
        "price": "101,99 TL119,99 TL",
        "desc": "110 ml.",
        "category": "Ice Creams"
      },
      {
        "name": "Magnum Mini Sandwich Almond",
        "price": "101,99 TL119,99 TL",
        "desc": "Package",
        "category": "Ice Creams"
      },
      {
        "name": "Dövme Kaymaklı",
        "price": "38,24 TL44,99 TL",
        "desc": "Package",
        "category": "Ice Creams"
      },
      {
        "name": "Carte d'Or Petite Bar",
        "price": "59,49 TL69,99 TL",
        "desc": "Package",
        "category": "Ice Creams"
      },
      {
        "name": "Chocolate Soufflé",
        "price": "144,49 TL169,99 TL",
        "desc": "Chocolate flavored",
        "category": "Desserts"
      },
      {
        "name": "Double Chocolate Soufflé",
        "price": "229,49 TL269,99 TL",
        "desc": "2 pieces",
        "category": "Desserts"
      },
      {
        "name": "Chocolate Rolls",
        "price": "178,49 TL209,99 TL",
        "desc": "8 pieces",
        "category": "Desserts"
      },
      {
        "name": "Pepsi (33 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Pepsi Zero Sugar (33 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Yedigün (33 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Peach (33 cl)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Mango (33 cl)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Lemon (33 cl)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Fruko Cool Lime (33 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Sütaş Ayran (20 cl.)",
        "price": "67,99 TL79,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Uludağ Premium Water (40 cl)",
        "price": "42,49 TL49,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Uludağ Sparkling Mineral Water (20 cl)",
        "price": "59,49 TL69,99 TL",
        "desc": "Glass bottle",
        "category": "Drinks"
      },
      {
        "name": "Uludağ Fruity Mineral Water Lemon (20 cl)",
        "price": "63,74 TL74,99 TL",
        "desc": "Glass bottle",
        "category": "Drinks"
      },
      {
        "name": "Uludağ Fruity Mineral Water Apple (20 cl)",
        "price": "63,74 TL74,99 TL",
        "desc": "Glass bottle",
        "category": "Drinks"
      },
      {
        "name": "Pepsi (1 L.)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Pepsi Zero Sugar (1 L.)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Yedigün Orange (1 L)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Yedigün Tangerine (1 L)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Peach (1 L)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Lemon (1 L)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Fruko Cool Lime (1 L.)",
        "price": "135,99 TL159,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Sütaş Ayran (1 L.)",
        "price": "127,49 TL149,99 TL",
        "desc": "Plastic bottle",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Sparkling Tropical (1 L.)",
        "price": "135,99 TL159,99 TL",
        "desc": "Pet şişe",
        "category": "Drinks"
      },
      {
        "name": "Lipton Ice Tea Sparkling Lemon Yuzu (1 L.)",
        "price": "135,99 TL159,99 TL",
        "desc": "Pet şişe",
        "category": "Drinks"
      },
      {
        "name": "Red Bull (25 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Red Bull Sugarfree (25 cl.)",
        "price": "110,49 TL129,99 TL",
        "desc": "Canned beverage",
        "category": "Drinks"
      },
      {
        "name": "Ketchup",
        "price": "12,74 TL14,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Mayonnaise",
        "price": "12,74 TL14,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Ranch Sauce",
        "price": "25,49 TL29,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Hot Sauce",
        "price": "21,24 TL24,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Honey Mustard Sauce",
        "price": "21,24 TL24,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "BBQ Crust Sauce",
        "price": "21,24 TL24,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Special Pizza Sauce",
        "price": "21,24 TL24,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Garlic Sauce",
        "price": "22,94 TL26,99 TL",
        "desc": "Pack",
        "category": "Sauces"
      },
      {
        "name": "Colorado Ranch Sauce",
        "price": "424,99 TL499,99 TL",
        "desc": "510 gr.",
        "category": "Sauces"
      },
      {
        "name": "Plastic Bag",
        "price": "1 TL",
        "desc": "It's compulsory to purchase plastic bags for fixed price 1 TL according to the amendments on Environment Law by the Ministry of Environment, Urbanization and Climate Change. If you require a plastic bag, you should add it to your basket. The amount will be charged to you for each plastic bag.",
        "category": "Carrier bag"
      }
    ]
  },
  "7211": {
    "name": "The Coffee Factory Beylikdüzü Makyol",
    "sourceUrl": "https://thecoffeefactory.com/menu",
    "sourceName": "The Coffee Factory resmi menüsü",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "BERRY LATTE",
        "price": "",
        "desc": "Çilek aroması, espresso ve süt ile hazırlanır; tatlı ve meyvemsi bir içim sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CAFFE AMERICANO",
        "price": "",
        "desc": "Yoğun espresso, sıcak suyla dengelenerek daha uzun içime uygun, hafif ama aromatik bir yapı kazanır. Lezzet profilini korurken keyfi katlar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CAFFE LATTE",
        "price": "",
        "desc": "Espresso ve süt karışımının, üzerindeki ipeksi süt kremasıyla dengelendiği zamansız bir klasik.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CAFFE MOCHA",
        "price": "",
        "desc": "Klasik çikolata aroması, espresso ve süt ile hazırlanır; çikolatamsı notalarla zenginleştirilir Krema ile de tercih edilebilir.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CAPPUCCINO",
        "price": "",
        "desc": "Sıcak süt,süt köpüğü ve espresso birleşimi, 2–2.5 cm süt köpüğüyle tamamlanarak sunulur.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CARAMEL MACCHIATO",
        "price": "",
        "desc": "Vanilya aroması, süt ve espresso buluşur; üzerine karamel aroması ile sunulur.",
        "category": "Espresso Beverage"
      },
      {
        "name": "COCONUT MOCHA",
        "price": "",
        "desc": "Hindistan cevizi aroması, hindistan cevizi kırıntıları, süt ve espressoyla hazırlanan, tropikal dokunuşlu bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CORTADO",
        "price": "",
        "desc": "Yoğun espresso, sıcak sütle eşit ölçüde buluşur; güçlü ama yumuşak içimli bir denge sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ESPRESSO",
        "price": "",
        "desc": "Yoğun gövdeli yapısı ve dengeli asiditesiyle, sade kahve deneyiminin en rafine hali.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ESPRESSO MACCHIATO",
        "price": "",
        "desc": "Espresso’nun üzerine eklenen süt kremasıyla dengelenmiş yoğun bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "FLAT WHITE",
        "price": "",
        "desc": "Yoğun double shot espresso, ipeksi mikro süt köpüğüyle dengelenir.",
        "category": "Espresso Beverage"
      },
      {
        "name": "MINT MOCHA",
        "price": "",
        "desc": "Nane aroması ve çikolata sosuyla hazırlanan mocha, ipeksi kremayla servis edilen ferahlatıcı ve tatlı bir lezzet sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "SALTED CARAMEL LATTE",
        "price": "",
        "desc": "Tuzlu karamel aromasının süt ve espressoyla dengelendiği, tatlı-tuzlu bir içecek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "SPANISH LATTE",
        "price": "",
        "desc": "Zengin Spanish sos, espresso ve süt ile hazırlanır; tatlı ve yoğun aromasıyla öne çıkar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "TOFFEE NUT LATTE",
        "price": "",
        "desc": "Fındık ve karamel aromalarıyla zenginleşen espresso ve süt karışımı; yumuşak ve aromatik bir seçenek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "WHITE CHOCOLATE MOCHA",
        "price": "",
        "desc": "Beyaz çikolata aroması, espresso ve süt ile hazırlanır; kremsi dokusu ve tatlı karakteriyle stilize bir tercih sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED BERRY LATTE",
        "price": "",
        "desc": "Çilek aroması, espresso ve süt ile hazırlanan meyveli latte; tatlı ve aromatik bir alternatif arayanlara özel.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED CAFFE AMERICANO",
        "price": "",
        "desc": "Espresso ve soğuk suyun buzla harmanlandığı, sade ve güçlü bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED CAFFE LATTE",
        "price": "",
        "desc": "Espresso ve sütün buzla bir araya geldiği klasik ama vazgeçilmez bir soğuk kahve alternatifi.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED CARAMEL MACCHIATO",
        "price": "",
        "desc": "Vanilya ve karamel aromalarının süt ve espressoyla buluştuğu, klasik bir yaz favorisi.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED FILTER COFFEE",
        "price": "",
        "desc": "Filtre kahvenin buzla buluştuğu sade ve ferahlatıcı bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED MINT MOCHA",
        "price": "",
        "desc": "Çikolata ve nane aromalarının espresso ve sütle birleştiği serinletici ve enerjik bir seçenek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED MOCHA",
        "price": "",
        "desc": "Yoğun çikolata sosunun espressoyla buluştuğu bu klasik tat, buzla serinlerken sütle yumuşar; tatlı ve enerjik bir lezzet arayanların favorisi.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED SALTED CARAMEL LATTE",
        "price": "",
        "desc": "Tuzlu karamel sosu ve espresso ile hazırlanan, tatlı-tuzlu uyumunu sütle dengeleyen özgün bir latte alternatifi.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED SPANISH LATTE",
        "price": "",
        "desc": "Spanish sos, espresso ve sütün buzla birleşimiyle ortaya çıkan tatlı, zengin ve yoğun aromalı bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED TOFFEE NUT LATTE",
        "price": "",
        "desc": "Yumuşak içimli süt, güçlü espresso, karamel ve fındık aromasıyla lezzet uyumu… Soğuk kahvenin sofistike haliyle tanışın.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED WHITE MOCHA",
        "price": "",
        "desc": "Beyaz çikolata sosu ve espresso ile hazırlanan, sütle yumuşatılmış tatlı ve dengeli bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ACAI BERRY REFRESHER",
        "price": "",
        "desc": "Yoğun kırmızı meyve püresi ve sodanın buluştuğu, kuru çileklerle süslenen meyve aromalı serinletici bir alternatif.",
        "category": "Espresso Beverage"
      },
      {
        "name": "LIME REFRESHER",
        "price": "",
        "desc": "Soda ve lime aromasının canlı uyumuyla hazırlanan, lime kurusu ile tamamlanan serinletici bir seçenek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "MANGO REFRESHER",
        "price": "",
        "desc": "Tropikal mango püresi ve sodanın buluştuğu, hafif limonata ile dengelenen ferahlatıcı bir yaz içeceği.",
        "category": "Espresso Beverage"
      },
      {
        "name": "VERY BERRY REFRESHER",
        "price": "",
        "desc": "Böğürtlen ve frambuaz püresinin soda ile birleştiği, kuru meyve taneleriyle zenginleştirilmiş meyve dolu ferahlatıcı bir içecek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CARAMEL WAFFLE CREAM",
        "price": "",
        "desc": "Süt, karamel ve waffle uyumunun damakta bıraktığı zengin tat, yumuşacık kremayla birleşerek her yudumda tatlı bir kaçamağa dönüşüyor.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CHOCOLATE CREAM",
        "price": "",
        "desc": "Yoğun çikolata sosu ve süt ile hazırlanan, üzerinde çikolata sos ve krema ile sunulan serinletici bir lezzet şöleni.",
        "category": "Espresso Beverage"
      },
      {
        "name": "COCONUT CREAM",
        "price": "",
        "desc": "Hindistan cevizi aroması ve sütle hazırlanır, hindistan cevizi tozu ve krema ile tamamlanarak dengeli bir lezzet sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "NUT CREAM",
        "price": "",
        "desc": "Fındık kremasının aromatik yoğunluğu, süt, krema ve fındık parçalarıyla uyum içinde; yeni sezona özel, rafine ve dengeli bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "PISTACHIO CREAM",
        "price": "",
        "desc": "Yüksek aromasıyla öne çıkan yeni lezzet şöleni, Antep fıstığı kreması, süt, krema ve fıstık sosunun dengeli birleşimiyle hazırlanır.",
        "category": "Espresso Beverage"
      },
      {
        "name": "STRAWBERRY CHOCOLATE CREAM",
        "price": "",
        "desc": "Ruby çikolatasının doğal meyvemsi aroması, çilek püresiyle birleşir. Krema ile zenginleşen bu içecek, zarif ve tatlı bir serinlik sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "MANGO FROZEN",
        "price": "",
        "desc": "Yoğun mango püresiyle hazırlanan, meyveli ve serinletici bir yaz klasiği. Hafif tatlı dokusuyla öne çıkar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "MANGO SMOOTHIE",
        "price": "",
        "desc": "Mango püresinden gelen tropikal esintili bu lezzet, yağsız sütün etkisiyle için non-fat olarak öne çıkar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "RED BERRY FROZEN",
        "price": "",
        "desc": "Kırmızı orman meyvelerinden elde edilen püreyle hazırlanan Red Berry Frozen, ekşi-tatlı dengesi ve serinletici yapısıyla yazın favori lezzeti olmaya aday.",
        "category": "Espresso Beverage"
      },
      {
        "name": "RED BERRY SMOOTHIE",
        "price": "",
        "desc": "Kırmızı meyve püresi ve yağsız sütle hazırlanır. Hafif yapısı sayesinde non-fat bir alternatif sunan bu smoothie, meyvenin doğal lezzetini ferahlatıcı bir içimle buluşturur.",
        "category": "Espresso Beverage"
      },
      {
        "name": "STRAWBERRY FROZEN",
        "price": "",
        "desc": "Doğal çilek püresiyle hazırlanan bu içecek, meyvenin ferahlatıcı tatlılığıyla öne çıkar. Hafif yapısının yanında serinletici bir içim sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "STRAWBERRY SMOOTHIE",
        "price": "",
        "desc": "Doğal çilek püresiyle hazırlanan bu smoothie, yağsız süt içeriği sayesinde non-fat bir alternatif. Ferahlatıcı yapısı ve hafif dokusuyla günün her anında keyifle tüketilebilir.",
        "category": "Espresso Beverage"
      },
      {
        "name": "HİBİSKUS",
        "price": "",
        "desc": "Hibiskus çiçeğinin kurutulmuş taç yapraklarından demlenir. Rubin kırmızısı rengi, canlandırıcı ekşiliği ve floral asiditesiyle öne çıkar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "IHLAMUR",
        "price": "",
        "desc": "Çiçekli ıhlamur yaprağının sade ve nostaljik aroması.",
        "category": "Espresso Beverage"
      },
      {
        "name": "KIŞ ÇAYI",
        "price": "",
        "desc": "Doğanın şifalı notalarından oluşan çok katmanlı bir karışım: zencefil, adaçayı, kuşburnu, ıhlamur ve narenciye kabuklarıyla kışa özel derin ve dengeli lezzet şöleni.",
        "category": "Espresso Beverage"
      },
      {
        "name": "NANE-LİMON",
        "price": "",
        "desc": "Taze limon kabuğunun narenciye tonları, yaprak nanenin ferahlatıcı etkisiyle buluşuyor.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ORMAN MEYVELERİ",
        "price": "",
        "desc": "Dağ çileği, böğürtlen, kuşburnu, hibisküs, karadut, limon ve portakal kabuklarıyla hazırlanan meyveli bir senfoni. Tatlı ve ekşi notalar arasında bir lezzet şöleni.",
        "category": "Espresso Beverage"
      },
      {
        "name": "YEŞİL ÇAY",
        "price": "",
        "desc": "Saf yeşil çay yapraklarının nazikçe demlenmesiyle hazırlanır. Yumuşak bitkisel aroması ve açık sarı tonuyla bilinir.",
        "category": "Espresso Beverage"
      },
      {
        "name": "BRAZILIAN LEMONADE",
        "price": "",
        "desc": "Limonata, spanish sos ve hindistan cevizi aromasının özgün uyumuyla hazırlanan bu tropik tat, yaz menümüzün en yeni ve en iddialı lezzetlerinden biri.",
        "category": "Espresso Beverage"
      },
      {
        "name": "LEMONADE (CLASSIC)",
        "price": "",
        "desc": "Limon suyu ile hazırlanan klasik lezzet; ferahlatıcı, dengeli ve doğal bir serinlik sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "MANGO LEMONADE",
        "price": "",
        "desc": "Limonata ve mango püresinin tropik uyumu, yaz aylarında enerji veren canlı ve meyvemsi bir tat sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "STRAWBERRY LEMONADE",
        "price": "",
        "desc": "Çilek püresiyle zenginleştirilmiş limonata, hafif ekşi ve meyvemsi notalarla canlandırıcı bir seçenek.",
        "category": "Espresso Beverage"
      },
      {
        "name": "BLACK TEA",
        "price": "",
        "desc": "Geleneksel yöntemle demlenen, yoğun aromalı ve berrak içimli siyah çay. Her yudumunda dinginlik, her fincanda tanıdık bir sıcaklık.",
        "category": "Espresso Beverage"
      },
      {
        "name": "CHAI TEA LATTE",
        "price": "",
        "desc": "Tarçın, zencefil ve karanfilin öne çıktığı baharatlı siyah çay bazı, sıcak sütle birleşerek yumuşak ama belirgin bir lezzet profili sunar.",
        "category": "Espresso Beverage"
      },
      {
        "name": "HOT CHOCOLATE",
        "price": "",
        "desc": "Yoğun çikolata sosu, sıcak sütle birleşerek zengin bir lezzet sunar. Krema ile de tercih edilebilir.",
        "category": "Espresso Beverage"
      },
      {
        "name": "ICED CHAI TEA LATTE",
        "price": "",
        "desc": "Baharatlı chai tea karışımı ve sütle hazırlanan, serinletici egzotik bir lezzet.",
        "category": "Espresso Beverage"
      },
      {
        "name": "TURKISH COFFEE",
        "price": "",
        "desc": "İnce çekilmiş Türk kahvesi ile geleneksel yöntemle pişirilerek hazırlanır.",
        "category": "Espresso Beverage"
      },
      {
        "name": "COOKIE",
        "price": "",
        "desc": "Klasik cookie hamuruyla hazırlanan bu lezzet, çikolata parçacıklarıyla zenginleşerek her lokmada dengeli bir tatlı keyfi sunuyor.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "DEREOTLU PEYNİRLİ POĞAÇA",
        "price": "",
        "desc": "Dereotu ve beyaz peynirle hazırlanan iç harcı, yumuşak dokulu hamurla birleşir; üzerindeki haşhaş sayesinde aromatik bir dokunuş kazanır.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "KAKAOLU KEK",
        "price": "",
        "desc": "Kakaolu ve sade kek karışımıyla hazırlanan bu nostaljik lezzet, her lokmada ev yapımı hissi uyandırır.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "LİMONLU KEK",
        "price": "",
        "desc": "Ferahlık veren limon aroması ve mavi haşhaşla zenginleştirilmiş, yumuşak dokulu enfes lezzet.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "PATATESLİ ÖRGÜLÜ AÇMA",
        "price": "",
        "desc": "Patates ve beyaz peynirle hazırlanan iç harç, yumuşak açma hamuruyla birleşir; üzerine serpiştirilen haşhaş tohumu ile tat dengesi sağlanır.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "SİYEZ UNLU PEYNİRLİ POĞAÇA",
        "price": "",
        "desc": "Yüksek lif oranına sahip siyez unuyla hazırlanan bu poğaça, beyaz peynir dolgusu sayesinde dengeli bir kahvaltı alternatifidir.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "TEREYAĞLI KRUVASAN",
        "price": "",
        "desc": "Tereyağının verdiği aroma ve kat kat dokusuyla öne çıkan bu kruvasan, sadeliğin en lezzetli hali.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "VİŞNELİ MUFFIN",
        "price": "",
        "desc": "Vişne ile hazırlanan bu muffin, meyveli ve hafif kıtır dokusuyla dengeli bir tatlı alternatifi sunar.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "ZEYTİNLİ AÇMA",
        "price": "",
        "desc": "Zeytin dolgusu ve üzerindeki haşhaş tohumu ile zenginleşen bu klasik poğaça, dışı hafif kıtır, içi ise yumuşak yapısıyla dengeli bir lezzet deneyimi sunar.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "ZEYTİNLİ POĞAÇA",
        "price": "",
        "desc": "Zeytin dolgusu ve üzerindeki haşhaş tohumu ile zenginleşen bu klasik poğaça, dışı hafif kıtır, içi ise yumuşak yapısıyla dengeli bir lezzet deneyimi sunar.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "ÇİKOLATALI COOKIE",
        "price": "",
        "desc": "Dışı kıtır, içi yumuşak çikolata dolgulu bu cookie; bol çikolata parçacıklarıyla tatlı krizlerine enfes bir çözüm sunar.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "ÇİKOLATALI MUFFIN",
        "price": "",
        "desc": "İçindeki çikolata parçacıklarıyla zenginleştirilen bu muffin, yumuşak yapısı ve dolu dolu aromasıyla tatlı molalarının favorisidir.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "AY ÇEKİRDEKLİ BEYAZ PEYNİRLİ SANDVİÇ",
        "price": "",
        "desc": "Ay çekirdekli ciabatta ekmeğinde sunulan bu beyaz peynirli sandviç, zeytin ve biberle zenginleştirilir, pesto sosla lezzeti tamamlanır.",
        "category": "Sandviçler"
      },
      {
        "name": "CHEDDARLI KAŞARLI KRUVASAN",
        "price": "",
        "desc": "Tereyağlı kruvasan arasında eriyen kaşar ve cheddar peyniriyle hazırlanan bu lezzet rafine bir sandviç deneyimi sunar.",
        "category": "Sandviçler"
      },
      {
        "name": "DANA JAMBON ARTİZAN SANDVİÇ",
        "price": "",
        "desc": "Sade artizan sandviç ekmeğiyle hazırlanan bu sandviçte, dana jambon, mozzarella ve cheddar peyniri ile buluşur.",
        "category": "Sandviçler"
      },
      {
        "name": "HAŞHAŞLI DÖRT PEYNİRLİ SANDVİÇ",
        "price": "",
        "desc": "Haşhaşlı ciabatta ekmeği arasında dört çeşit peynirin dengeli birleşimiyle hazırlanan bu sandviç, doyurucu ve yumuşak bir tat profili sunar.",
        "category": "Sandviçler"
      },
      {
        "name": "HİNDİ JAMBONLU SANDVİÇ",
        "price": "",
        "desc": "Hindi jambonun yumuşaklığı, cheddar peyniriyle buluşuyor; sotelenmiş kapya biber ve mantar ile lezzeti zenginleşen bu sandviç, çavdarlı baget ekmeğiyle tamamlanıyor.",
        "category": "Sandviçler"
      },
      {
        "name": "JAMBONLU PEYNİRLİ KRUVASAN",
        "price": "",
        "desc": "Kruvasanın arasına jambon, kaşar ve cheddar peyniri eklenerek hazırlanan bu sandviç; sıcak ve doyurucu bir lezzet alternatifi sunar.",
        "category": "Sandviçler"
      },
      {
        "name": "TAHILLI ÜÇ PEYNİRLİ TOST",
        "price": "",
        "desc": "Tahıllı ekmek arasında beyaz peynir, kaşar ve cheddarın uyumuyla hazırlanan bu tost, lezzetini ceviz ve domates sosun hafif dokunuşuyla tamamlar.",
        "category": "Sandviçler"
      },
      {
        "name": "İTALYAN SANDVİÇ",
        "price": "",
        "desc": "Susamlı ciabatta ekmeği arasında kaşar, cheddar, parmesan peynirleriyle birlikte dana salam ve sucuk; pesto ve İtalyan sosla lezzetini buluyor. Her lokmada damağa dolgun ve dengeli bir tat bırakıyor.",
        "category": "Sandviçler"
      },
      {
        "name": "BEYAZ ÇİKOLATALI BROWNIE",
        "price": "",
        "desc": "Beyaz çikolatanın yoğunluğunu, kakao ve kremanın yumuşak dokusuyla dengeleyen bu tatlı; çikolata tutkunları için unutulmaz bir lezzet sunar.",
        "category": "Tatlılar"
      },
      {
        "name": "ANTEP FISTIKLI PASTA",
        "price": "",
        "desc": "Antep fıstığı kreması, bitter çikolata ve kremanın katmanlı uyumu. Her lokmada yoğun, dokulu ve özel bir lezzet şöleni sunar.",
        "category": "Tatlılar"
      },
      {
        "name": "BELÇİKA ÇİKOLATALI PASTA",
        "price": "",
        "desc": "Yoğun Belçika çikolatası, krema ve kakao ile hazırlanan bu yumuşak dokulu pasta, krem şantiyle tamamlanarak rafine bir tatlı deneyimi sunar.",
        "category": "Tatlılar"
      },
      {
        "name": "FRAMBUAZLI CHEESECAKE",
        "price": "",
        "desc": "Yumuşak peynir dolgusu, frambuaz sosu ve bisküvi tabanıyla hazırlanan bu cheesecake, tatlı ve meyvemsi lezzetleri dengeli şekilde bir araya getirir.",
        "category": "Tatlılar"
      },
      {
        "name": "KREMALI HAVUÇLU PASTA",
        "price": "",
        "desc": "Baharatlarla zenginleştirilmiş cevizli havuçlu kek, yumuşak dokusu ve üzerindeki krema ile dengeli bir lezzet sunar.",
        "category": "Tatlılar"
      },
      {
        "name": "MOZAİK PASTA",
        "price": "",
        "desc": "Bisküvi, süt ve bitter çikolatanın buluştuğu klasik mozaik pasta; yoğun lezzeti ve nostaljik dokusuyla tatlı molalarının vazgeçilmezi.",
        "category": "Tatlılar"
      },
      {
        "name": "SAN SEBASTİAN CHEESECAKE",
        "price": "",
        "desc": "Karamelize üst katmanı ve yoğun iç dokusuyla öne çıkan San Sebastian Cheesecake, yumuşak yapısıyla her lokmada dengeli bir tatlı keyfi sunar.",
        "category": "Tatlılar"
      },
      {
        "name": "TİRAMİSU",
        "price": "",
        "desc": "Krema, kahve ve kakao ile hazırlanan bu klasik lezzet; yumuşak dokusu ve dengeli aromasıyla tatlı molalarına eşlik eder.",
        "category": "Tatlılar"
      }
    ]
  },
  "7203": {
    "name": "Wingo Fried Chicken Akaretler",
    "sourceUrl": "https://qr.finedinemenu.com/wingo-akaretler/menu/62d6a6c953d6320015fde149?sectionId=62d6a6fd44562600158b9af2",
    "sourceName": "FineDine / Wingo Akaretler",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Oregon Burger ve Patates Kızartması(YENİ!!)",
        "price": "₺395.00",
        "desc": "Trüflü Chipotle Mayonez, Roka, Kıtır Soğan, Cheddar peyniri, Marine edilmiş kızarmış tavuk ve Patates kızartması       Extra Cheddar + 30₺    Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "One Love Burger ve Patates Kızartması",
        "price": "₺395.00",
        "desc": "One Love Sos, Soslu Mor Lahana, Alman Turşusu, Cheddar Peyniri, Marine Edilmiş Kızarmış Tavuk ve Patates Kızartması      Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Mango Chutney Burger ve Patates Kızartması",
        "price": "₺395.00",
        "desc": "Mango Chutney sos, Ev yapımı ballı hardal, Soslu mor lahana, Alman turşusu, Cheddar Peyniri, Marine edilmiş kızarmış tavuk ve Patates kızartması       Extra Cheddar +30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Bronco BBQ Burger ve Patates Kızartması",
        "price": "₺440.00",
        "desc": "Çıtır soğan, Sweet BBQ, Füme, Cheddar peyniri, Marine edilmiş kızarmış tavuk ve Patates kızartması         Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Space Burger ve Patates Kızartması",
        "price": "₺395.00",
        "desc": "Space sos, Chipotle mayonez, Iceberg marul, Cheddar peyniri, Marine edilmiş kızarmış tavuk ve Patates kızartması        Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "White Burger ve Patates Kızartması",
        "price": "₺395.00",
        "desc": "White sos, Soslu beyaz lahana, Alman turşusu, Cheddar peyniri,  Marine edilmiş kızarmış tavuk ve Patates kızartması         Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Mexican Burger ve Patates Kızartması",
        "price": "₺395.00",
        "desc": "Guacamole sos, Kuru domatesli cheddar sos, Jalapeno turşu, Sriracha, Cheddar peyniri,  Marine edilmiş kızarmış tavuk ve Patates kızartması        Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Sweet BBQ Et Burger ve Patates Kızartması",
        "price": "₺480.00",
        "desc": "Çıtır soğan, Sweet BBQ, Füme, Cheddar peyniri ve Patates Kızartması     Extra Cheddar + 30₺   Extra Et + 190₺",
        "category": ""
      },
      {
        "name": "Big Burger Menü",
        "price": "₺685.00",
        "desc": "Seçeceğiniz 1 adet burger, 3 adet Tenders, 4 adet Cheddar Bites,  Patates kızartması ile servis edilir      Bronco Burger seçimlerinde + 45₺ ilave edilir    Sweet BBQ Burger seçimlerinde + 85₺ ilave edilir   Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Cosmos Menü",
        "price": "₺460.00",
        "desc": "BBQ, One Love Sos, Coleslaw, Cheddar Peyniri, Alman Turşusu Marine Edilmiş Kızarmış Tavuk + Patates+ İçecek     Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Wonder Menü",
        "price": "₺1,080.00",
        "desc": "Seçeceğiniz 2 adet burger, Cheddar bites, Patates kızartması ile servis edilir     Bronco Burger seçimlerinde + 45₺ ilave edilir    Sweet BBQ Burger seçimlerinde + 85₺ ilave edilir   Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Burger & Wings Menü",
        "price": "₺600.00",
        "desc": "Seçeceğiniz 1 adet burger, 3 adet Basic Wings,  Patates kızartması ile servis edilir.     Bronco Burger seçimlerinde + 45₺ ilave edilir    Sweet BBQ Burger seçimlerinde + 85₺ ilave edilir   Extra Cheddar + 30₺   Extra Tavuk + 135₺",
        "category": ""
      },
      {
        "name": "Tenders & Wings Menü",
        "price": "₺460.00",
        "desc": "3 adet Tenders, 3 adet Basic Wings,  Patates kızartması ile servis edilir.",
        "category": ""
      },
      {
        "name": "Tenders 5'li -  9'lu",
        "price": "₺650.00",
        "desc": "Wingo Chrispy Chicken Tenders, Patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Cheddar ve Garlic Parmesan Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Cheddar Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Garlic Parmesan Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Honey Mustard Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Spicy Garlic Hot Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Mango Chutney Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "BBQ Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Sweet Chili Bites 10'lu",
        "price": "₺430.00",
        "desc": "Soslu tavuk parçaları, Patates kızarması ile servis edilir",
        "category": ""
      },
      {
        "name": "Basic Wings 6'lı - 9'lu",
        "price": "₺625.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Buffalo Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Garlic Parmesan Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Mango Chutney Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Cheddar Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "BBQ Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Honey Mustard Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Spicy Garlic Hot Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Extra Hot Wings  6'lı - 9'lu",
        "price": "₺650.00",
        "desc": "6'lı veya 9'lu olarak, patates kızartması ile servis edilir -",
        "category": ""
      },
      {
        "name": "Cheddar Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Spicy Garlic Hot Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Honey Mustard Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "White Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Buffalo Sos",
        "price": "₺40.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Space Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Mango Chutney Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Sweet Chili Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Chipotle Mayonez Sos",
        "price": "₺20.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Garlic Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Ranch Sos",
        "price": "₺30.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Patates Kızartması",
        "price": "₺165.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Parmesan Sarımsaklı Patates Kızartması",
        "price": "₺195.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Adet Spicy Tender",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Adet Basic Wing",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Coca Cola / Cola Turka",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Sprite",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Niğde Gazozu",
        "price": "₺70.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Özer Hisar Ayran",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Fuse Tea Şeftali / Limon /  Mango ve Ananas",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Fanta",
        "price": "₺80.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Su",
        "price": "₺40.00",
        "desc": "",
        "category": ""
      },
      {
        "name": "Soda",
        "price": "₺50.00",
        "desc": "",
        "category": ""
      }
    ]
  },
  "7194": {
    "name": "Deep Blue Fish & Chips Beşiktaş",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/ifct/deep-blue-fish-and-chips-ifct",
    "sourceName": "Yemeksepeti / Deep Blue Fish & Chips Beşiktaş",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Kalamar Sandviç",
        "price": "460 TL",
        "desc": "Tarator sos, soğan",
        "category": ""
      },
      {
        "name": "Çıtır Mezgit Sandviç",
        "price": "460 TL",
        "desc": "Soğan, yeşillik, özel sos",
        "category": ""
      },
      {
        "name": "Kari̇des Kızartması",
        "price": "570 TL",
        "desc": "Tek kişilik",
        "category": ""
      },
      {
        "name": "Kalamar Tava",
        "price": "460 TL",
        "desc": "Tarator sos ile",
        "category": ""
      },
      {
        "name": "Çıtır Mezgit",
        "price": "595 TL",
        "desc": "Patates kızartması ile",
        "category": ""
      },
      {
        "name": "Çıtır Levrek Fileto",
        "price": "695 TL",
        "desc": "Patates kızartması ile",
        "category": ""
      },
      {
        "name": "Patates Kızartması (150 gr.)",
        "price": "195 TL",
        "desc": "Özel sos ile",
        "category": ""
      },
      {
        "name": "Patates Kızartması (200 gr.)",
        "price": "230 TL",
        "desc": "Özel sos ile",
        "category": ""
      },
      {
        "name": "Fuse Tea Şeftali (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": ""
      },
      {
        "name": "Coca-Cola (33 cl.)",
        "price": "95 TL",
        "desc": "Kutu içecek",
        "category": ""
      },
      {
        "name": "Su (50 cl.)",
        "price": "45 TL",
        "desc": "Pet şişe",
        "category": ""
      },
      {
        "name": "Soda (20 cl.)",
        "price": "60 TL",
        "desc": "Cam şişe",
        "category": ""
      },
      {
        "name": "Ketçap",
        "price": "60 TL",
        "desc": "Paketli ürün",
        "category": ""
      },
      {
        "name": "Bezelye Püresi",
        "price": "70 TL",
        "desc": "Paketli ürün",
        "category": ""
      },
      {
        "name": "Pancar Sos",
        "price": "60 TL",
        "desc": "Paketli ürün",
        "category": ""
      },
      {
        "name": "Tarator Sos",
        "price": "60 TL",
        "desc": "Paketli ürün",
        "category": ""
      },
      {
        "name": "Rokalina",
        "price": "60 TL",
        "desc": "Paketli ürün",
        "category": ""
      },
      {
        "name": "Poşet",
        "price": "1 TL",
        "desc": "It's compulsory to purchase plastic bags for fixed price 1 TL according to the amendments on Environment Law by the Ministry of Environment, Urbanization and Climate Change. If you require a plastic bag, you should add it to your basket. The amount will be charged to you for each plastic bag.",
        "category": ""
      }
    ]
  },
  "7213": {
    "name": "City Burger",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/uja1/city-burger",
    "sourceName": "Yemeksepeti City Burger menüsü (Çelebioğlu Sok. No:15/2, Beşiktaş)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Burger Menü (200 gr.)",
        "price": "669,75 TL",
        "desc": "Seçeceğiniz Burger + Patates Kızartması + Kutu İçecek",
        "category": "Menüler"
      },
      {
        "name": "Burger Menü (130 gr.)",
        "price": "569,75 TL",
        "desc": "Seçeceğiniz Burger + Patates Kızartması + Kutu İçecek",
        "category": "Menüler"
      },
      {
        "name": "Double Chef Quad Cheese Burger (260 gr.) Menü",
        "price": "719,75 TL",
        "desc": "Double Chef Quad Cheese Burger (260 gr.) + Patates Kızartması + Kutu İçecek",
        "category": "Menüler"
      },
      {
        "name": "New York City Menü",
        "price": "599,75 TL",
        "desc": "New York City Bacon + Patates Kızartması + Kutu İçecek",
        "category": "Menüler"
      },
      {
        "name": "City Burger With Cheese (130 gr.)",
        "price": "469,5 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, cheddar peyniri",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "City Chef's Special (130 gr.)",
        "price": "469,5 TL",
        "desc": "City sos, tereyağı, cheddar peyniri, karamelize soğan",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "Jail Burger (130 gr.)",
        "price": "479,5 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, patlıcan, közlenmiş kırmızıbiber, cheddar peyniri",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "London City Blue Cheese (130 gr.)",
        "price": "489,5 TL",
        "desc": "City sos, karamelize soğan, domates, marul, rokfor sos",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "Magic City Mushroom (130 gr.)",
        "price": "479,5 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, fesleğen soslu mantar",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "Mexico City Hot (130 gr.)",
        "price": "479,5 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, jalapeno sos, cheddar peyniri",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "New York City Bacon (130 gr.)",
        "price": "499,5 TL",
        "desc": "Özel barbekü sosu, karamelize soğan, dana füme, cheddar peyniri",
        "category": "Burgerler (130 gr.)"
      },
      {
        "name": "City Burger With Cheese (200 gr.)",
        "price": "549,75 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, cheddar peyniri",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "City Chef's Special (200 gr.)",
        "price": "549,75 TL",
        "desc": "City sos, tereyağı, cheddar peyniri, karamelize soğan",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "Jail Burger (200 gr.)",
        "price": "559,75 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, patlıcan, közlenmiş kırmızıbiber, cheddar peyniri",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "London City Blue Cheese (200 gr.)",
        "price": "569,75 TL",
        "desc": "City sos, karamelize soğan, domates, marul, rokfor sos",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "Magic City Mushroom (200 gr.)",
        "price": "559,75 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, fesleğen soslu mantar",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "Mexico City Hot (200 gr.)",
        "price": "559,75 TL",
        "desc": "City sos, karamelize soğan, domates, marul, turşu, jalapeno sos, cheddar peyniri",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "New York City Bacon (200 gr.)",
        "price": "579,75 TL",
        "desc": "Özel barbekü sosu, karamelize soğan, dana füme, cheddar peyniri",
        "category": "Burgerler (200 gr.)"
      },
      {
        "name": "Double Chef Quad Cheese Burger (260 gr.)",
        "price": "619,75 TL",
        "desc": "2 adet 130 gr. dana eti, 4 kat cheddar peyniri, City sos, karamelize soğan, tereyağı",
        "category": "Double Burgerler"
      },
      {
        "name": "Soğan Halkası (6 Adet)",
        "price": "129,5 TL",
        "desc": "İnce dilimlenmiş soğanların kızartılarak çıtır hale getirildiği bir atıştırmalıktır.",
        "category": "Yan Ürünler"
      },
      {
        "name": "Baharatlı Parmak Patates Kızartması",
        "price": "129,5 TL",
        "desc": "Dilimlenmiş patateslerin kızartılıp baharatlandırılarak servis edildiği bir atıştırmalıktır.",
        "category": "Yan Ürünler"
      },
      {
        "name": "Parmak Patates Kızartması",
        "price": "129,5 TL",
        "desc": "Dilimlenmiş patateslerin kızartılarak servis edildiği bir atıştırmalıktır.",
        "category": "Yan Ürünler"
      },
      {
        "name": "Coca-Cola Zero Sugar (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-Cola (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-Cola Şekersiz (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Lipton Ice Tea (33 cl.)",
        "price": "70 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "El Yapımı Limonata (30 cl.)",
        "price": "69 TL",
        "desc": "Bardak",
        "category": "İçecekler"
      },
      {
        "name": "El Yapımı Otlu Ayran (30 cl.)",
        "price": "65 TL",
        "desc": "Bardak",
        "category": "İçecekler"
      },
      {
        "name": "Su (33 cl.)",
        "price": "19 TL",
        "desc": "İçecek",
        "category": "İçecekler"
      },
      {
        "name": "BBQ Sos",
        "price": "16,5 TL",
        "desc": "50 gr.",
        "category": "Soslar"
      },
      {
        "name": "Hardal Sos (Heinz)",
        "price": "16,5 TL",
        "desc": "50 gr.",
        "category": "Soslar"
      },
      {
        "name": "Acı Sos (Sriracha)",
        "price": "19,5 TL",
        "desc": "50 gr.",
        "category": "Soslar"
      },
      {
        "name": "Plastic Bag",
        "price": "1 TL",
        "desc": "It's compulsory to purchase plastic bags for fixed price 1 TL according to the amendments on Environment Law by the Ministry of Environment, Urbanization and Climate Change. If you require a plastic bag, you should add it to your basket. The amount will be charged to you for each plastic bag.",
        "category": "Poşet"
      }
    ]
  },
  "7214": {
    "name": "Via Dolci",
    "sourceUrl": "https://www.viadolci.com/",
    "sourceName": "Via Dolci resmi menüsü (Samsun Cd. B4 Blok No:14, Beylikdüzü)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Espresso",
        "price": "",
        "desc": "Ustalıkla kavrulmuş çekirdeklerden, her yudumda derinlik sunan imza espressomuz.",
        "category": "Kahve"
      },
      {
        "name": "Americano",
        "price": "",
        "desc": "Özenle demlenmiş sıcak su üzerine eklenen çift shot espresso ile yumuşak içimli ama güçlü bir Americano.",
        "category": "Kahve"
      },
      {
        "name": "Cappuccino",
        "price": "",
        "desc": "Yoğun espresso üzerine buharda ısıtılmış süt ve mikro köpük, üstünde hafif çikolata dokunuşu.",
        "category": "Kahve"
      },
      {
        "name": "Latte",
        "price": "",
        "desc": "Espresso üzerine eklenen buharda ısıtılmış süt ve hafif köpükle yumuşak içimli bir klasik.",
        "category": "Kahve"
      },
      {
        "name": "Cortado",
        "price": "",
        "desc": "İki ölçü espresso, bir ölçü buharda ısıtılmış süt ve ince mikro köpükle.",
        "category": "Kahve"
      },
      {
        "name": "Macchiatto",
        "price": "",
        "desc": "İmza espressomuz, hafif bir süt köpüğü dokunuşuyla.",
        "category": "Kahve"
      },
      {
        "name": "Lungo",
        "price": "",
        "desc": "Yavaş ve uzun çekimle elde edilen, daha açık ama derin karakterli espresso.",
        "category": "Kahve"
      },
      {
        "name": "Flat White",
        "price": "",
        "desc": "Yoğun ristretto, ipeksi tam yağlı sütle buluşur; güçlü ama yumuşak.",
        "category": "Kahve"
      },
      {
        "name": "Mocha",
        "price": "",
        "desc": "İmza espressomuz, ipeksi süt ve çikolata notalarıyla derinleşir.",
        "category": "Kahve"
      },
      {
        "name": "White Chocolate Mocha",
        "price": "",
        "desc": "Yoğun espresso, ipeksi süt ve beyaz çikolata ile hazırlanan yumuşak ve zengin bir lezzet.",
        "category": "Kahve"
      },
      {
        "name": "Espresso Macchiatto",
        "price": "",
        "desc": "Karakterli espresso, küçük bir süt köpüğüyle yumuşatılır.",
        "category": "Kahve"
      }
    ]
  },
  "7204": {
    "name": "Kesbi Döner & Piliç Çevirme",
    "sourceUrl": "https://www.migros.com.tr/yemek/kesbi-doner-beylikduzu-buyuksehir-mah-st-23c40",
    "sourceName": "Migros Yemek Kesbi Döner menüsü (Beylikdüzü Büyükşehir/Atrium Çarşı)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Tavuk Döner Dürüm Menü",
        "price": "330,00 TL",
        "desc": "Tavuk Döner Dürüm + Patates Kızartması + Coca-Cola (25 cl.)",
        "category": "Menüler"
      },
      {
        "name": "Yarım Ekmek Arası Tavuk Döner Menü",
        "price": "325,00 TL",
        "desc": "Yarım Ekmek Arası Tavuk Döner + Patates Kızartması + Coca-Cola (25 cl.)",
        "category": "Menüler"
      },
      {
        "name": "Tombik Ekmek Arası Tavuk Döner Menü",
        "price": "325,00 TL",
        "desc": "Tombik Ekmek Arası Tavuk Döner + Patates Kızartması + Coca-Cola (25 cl.)",
        "category": "Menüler"
      },
      {
        "name": "Karışık Menü (2 Kişilik)",
        "price": "800,00 TL",
        "desc": "Tavuk Çevirme (Yarım) + Kanat (8 Adet) + Pirinç Pilavı + Yeşillik + Lavaş (2 Adet) + İçecek (1 L.)",
        "category": "Menüler"
      },
      {
        "name": "Tavuk Çevirme (2 Kişilik) Menü",
        "price": "700,00 TL",
        "desc": "Tavuk Çevirme (Bütün) + Pirinç Pilavı + Yeşillik + Lavaş (2 Adet) + Ayran (1 L.)",
        "category": "Menüler"
      },
      {
        "name": "Bol Menü (4 Kişilik)",
        "price": "1.200,00 TL",
        "desc": "Tavuk Çevirme (Bütün) + Tavuk Kanat (1 kg.) (Pişirilmiş) + Pirinç Pilavı + Yeşillik + Lavaş (4 Adet) + İçecek (1 L.) + Ayran (1 L.) (Gramaj bilgisi ürünün çiğ halinin gramajıdır.)",
        "category": "Menüler"
      },
      {
        "name": "Patso Sandviç",
        "price": "130,00 TL",
        "desc": "Patates kızartması, turşu, ketçap",
        "category": "Patsolar"
      },
      {
        "name": "Patso Dürüm",
        "price": "150,00 TL",
        "desc": "Patates kızartması, turşu, ketçap",
        "category": "Patsolar"
      },
      {
        "name": "Pilav Üstü Tavuk Döner",
        "price": "400,00 TL",
        "desc": "Pirinç pilavı. Yeşillik, turşu, lavaş ile",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Soslu Tavuk Döner Dürüm",
        "price": "210,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Special Kesbi Dürüm",
        "price": "245,00 TL",
        "desc": "Kaşar peyniri, turşu, yeşillik, patates kızartması, sos, tavuk döner",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Kaşarlı Tavuk Döner Dürüm",
        "price": "255,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Döner Sandviç",
        "price": "140,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Tavuk Döner",
        "price": "140,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Yarım Ekmek Arası Tavuk Döner",
        "price": "140,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tam Ekmek Arası Tavuk Döner",
        "price": "230,00 TL",
        "desc": "Yeşillik, turşu, patates kızartması",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Çevirme (Yarım)",
        "price": "400,00 TL",
        "desc": "Pirinç pilavı, patates kızartması, yeşillik, turşu, lavaş ile",
        "category": "Tavuklar"
      },
      {
        "name": "Tavuk Çevirme (Bütün) (Çiğ 1500 Gr.)",
        "price": "400,00 TL",
        "desc": "Baharatlar ile (Belirtilen gramaj bilgisi ürünlerin çiğ halinin gramajıdır.)",
        "category": "Tavuklar"
      },
      {
        "name": "Tavuk Kanat",
        "price": "400,00 TL",
        "desc": "Pirinç pilavı, yeşillik, patates kızartması, turşu, lavaş ile",
        "category": "Tavuklar"
      },
      {
        "name": "Arnavutciğeri",
        "price": "400,00 TL",
        "desc": "Pirinç pilavı, yeşillik, soğan, turşu, lavaş ile",
        "category": "Ciğerler"
      },
      {
        "name": "Arnavutciğeri Dürüm",
        "price": "185,00 TL",
        "desc": "Arnavutciğeri, soğan",
        "category": "Ciğerler"
      },
      {
        "name": "Yarım Ekmek Arası Arnavutciğeri",
        "price": "160,00 TL",
        "desc": "Arnavutciğeri, soğan",
        "category": "Ciğerler"
      },
      {
        "name": "Ekmek",
        "price": "40,00 TL",
        "desc": "Adet olarak servis edilmektedir.",
        "category": "Yan Ürünler"
      },
      {
        "name": "Lavaş",
        "price": "35,00 TL",
        "desc": "Adet olarak servis edilmektedir.",
        "category": "Yan Ürünler"
      },
      {
        "name": "Coca-cola Zero Sugar (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola Light (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola Şekersiz (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Cappy (33 Cl.)",
        "price": "100,00 TL",
        "desc": "Kutu",
        "category": "İçecekler"
      },
      {
        "name": "Şalgam Suyu (30 Cl.)",
        "price": "80,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Ayran (17 Cl.)",
        "price": "45,00 TL",
        "desc": "Küçük",
        "category": "İçecekler"
      },
      {
        "name": "Meyveli Soda (20 Cl.)",
        "price": "45,00 TL",
        "desc": "Cam şişe",
        "category": "İçecekler"
      },
      {
        "name": "Soda (20 Cl.)",
        "price": "35,00 TL",
        "desc": "Cam şişe",
        "category": "İçecekler"
      },
      {
        "name": "Su (50 Cl.)",
        "price": "30,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola (1 L.)",
        "price": "140,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola Şekersiz (1 L.)",
        "price": "140,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Coca-cola Zero Sugar (1 L.)",
        "price": "140,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (1 L.)",
        "price": "80,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (1 L.)",
        "price": "140,00 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Tavuk Kanat (1 Kg.)",
        "price": "700,00 TL",
        "desc": "Pirinç pilavı, yeşillik ile",
        "category": "Kiloluk Ürünler (Pişirilmiş)"
      }
    ]
  },
  "7216": {
    "name": "Totem Performans",
    "sourceUrl": "https://webmenu.pardonapp.co/en/totem-pub-performans",
    "sourceName": "Pardon AI Totem Pub - Performans Sahne menüsü (Salih Efendi Sk. No:6, Beşiktaş sosyal adres doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Water",
        "price": "50₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Mineral Water",
        "price": "150₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Fruit Juice",
        "price": "220₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Coca Cola",
        "price": "220₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Turnip Juice",
        "price": "100₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Churchill",
        "price": "180₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Energy Drink",
        "price": "270₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Non-Alcoholic Fruit Cocktail",
        "price": "320₺",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Sex On The Beach",
        "price": "450₺",
        "desc": "Vodka, Archers, Tequila, Grenadine, Orange Juice",
        "category": "Cocktails"
      },
      {
        "name": "Margarita",
        "price": "450₺",
        "desc": "Tequila, Cointreau, Fresh Lime, Salt",
        "category": "Cocktails"
      },
      {
        "name": "Long Island Iced Tea",
        "price": "550₺",
        "desc": "Tequila, Gin, Rum, Vodka, Cointreau, Cola, Sweet and Sour",
        "category": "Cocktails"
      },
      {
        "name": "Gin Fizz",
        "price": "450₺",
        "desc": "Gordon's Gin, Soda, Fresh Lime, Powdered Sugar",
        "category": "Cocktails"
      },
      {
        "name": "Mojito",
        "price": "500₺",
        "desc": "Captain Morgan, Lime, Mint, Brown Sugar, Soda Served With Crushed Ice",
        "category": "Cocktails"
      },
      {
        "name": "Lynchburg Lemonade",
        "price": "500₺",
        "desc": "Jack Daniel's Whiskey, Cointreau, Sweet And Sour, Sprite Or Soda",
        "category": "Cocktails"
      },
      {
        "name": "Pina Colada",
        "price": "450₺",
        "desc": "Rum, Malibu, Coconut Syrup, Milk And Pineapple Juice",
        "category": "Cocktails"
      },
      {
        "name": "White Russian",
        "price": "450₺",
        "desc": "Vodka, Coffee Liqueur, Cream",
        "category": "Cocktails"
      },
      {
        "name": "Jagerbomb",
        "price": "500₺",
        "desc": "Jagermeister, Redbull",
        "category": "Cocktails"
      },
      {
        "name": "Tequila Sunrise",
        "price": "450₺",
        "desc": "Tequila, Cointreau, Grenadine, Orange Juice",
        "category": "Cocktails"
      },
      {
        "name": "Black Russian",
        "price": "450₺",
        "desc": "Vodka, Coffee Liqueur",
        "category": "Cocktails"
      },
      {
        "name": "Sorrel",
        "price": "500₺",
        "desc": "Gin, vodka, lemon juice, sugar",
        "category": "Cocktails"
      },
      {
        "name": "Martini",
        "price": "450₺",
        "desc": "Beefeater, vermouth",
        "category": "Cocktails"
      },
      {
        "name": "Apple Mojito",
        "price": "450₺",
        "desc": "Havana Club, brown sugar, lime, mint, green apple",
        "category": "Cocktails"
      },
      {
        "name": "Apple Martini",
        "price": "450₺",
        "desc": "Absolut, green apple, orange juice, apple juice",
        "category": "Cocktails"
      },
      {
        "name": "Strawberry Mojito",
        "price": "450₺",
        "desc": "Havana Club, mint, lime, brown sugar, Sprite, strawberry",
        "category": "Cocktails"
      },
      {
        "name": "Cinbull",
        "price": "450₺",
        "desc": "Beefeater, Red Bull Yellow, lime, mint",
        "category": "Cocktails"
      },
      {
        "name": "Negroni",
        "price": "500₺",
        "desc": "Beefeater, martini rosso, campari",
        "category": "Cocktails"
      },
      {
        "name": "Aperol Spritz",
        "price": "500₺",
        "desc": "Aperol, Prosecco, wine, soda",
        "category": "Cocktails"
      },
      {
        "name": "Whiskey Sour",
        "price": "500₺",
        "desc": "Bourbon whiskey, lemon juice, orange juice, sugar",
        "category": "Cocktails"
      },
      {
        "name": "Cuba Libre",
        "price": "450₺",
        "desc": "Havana Club, lime, Coca-Cola",
        "category": "Cocktails"
      },
      {
        "name": "Efes 50cl",
        "price": "310₺",
        "desc": "",
        "category": "Beers / Draft Beers"
      },
      {
        "name": "Efes 33cl",
        "price": "290₺",
        "desc": "",
        "category": "Beers / Draft Beers"
      },
      {
        "name": "Mexicano 50cl",
        "price": "320₺",
        "desc": "",
        "category": "Beers / Draft Beers"
      },
      {
        "name": "Mexicano 33cl",
        "price": "300₺",
        "desc": "",
        "category": "Beers / Draft Beers"
      },
      {
        "name": "Efes Bottle 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Efes Malt 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Efes Özel Seri 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Bomonti Filtresiz 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Glutensiz Efes 50cl",
        "price": "350₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Beck's 50cl",
        "price": "350₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Bud 50cl",
        "price": "350₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Belfast 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Miller 50cl",
        "price": "350₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Corona 33cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Amsterdam 50cl",
        "price": "430₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Stella Artois 50cl",
        "price": "330₺",
        "desc": "",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Beer Bucket Mix",
        "price": "3100₺",
        "desc": "Beer + Chips + Corn",
        "category": "Beers / Bottled Beers"
      },
      {
        "name": "Vodka",
        "price": "180₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "Gin",
        "price": "180₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "Tequila",
        "price": "220₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "Jägermeister",
        "price": "240₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "5+1 Tequila Shot",
        "price": "1120₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "5+1 Jagermeister",
        "price": "1240₺",
        "desc": "",
        "category": "Shots"
      },
      {
        "name": "Vodka & Juice",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Vodka Redbull",
        "price": "450₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Smirnoff Vodka Single",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Smirnoff Votka Double",
        "price": "600₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Smirnoff Vodka 35 CL",
        "price": "2750₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Smirnoff Vodka 50 CL",
        "price": "3500₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Smirnoff Vodka 70 CL",
        "price": "5000₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Absolut Vodka Glass",
        "price": "450₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Absolut Votka Double",
        "price": "650₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Absolut Vodka 35 CL",
        "price": "2900₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Absolut Vodka 50 CL",
        "price": "3700₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Absolut Vodka 70 CL",
        "price": "5500₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Gordon’s Cin Gin Glass",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Gordon's Gin Double",
        "price": "600₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Gordon’s Cin Gin 35 CL",
        "price": "2750₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Gordon’s Cin Gin 50 CL",
        "price": "3500₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Gordon’s Cin Gin 70 CL",
        "price": "5000₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Jagermeister Redbull Single",
        "price": "550₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Jagermeister Redbull Double",
        "price": "750₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Baileys",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Malibu",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Bacardi",
        "price": "500₺",
        "desc": "",
        "category": "Local & Foreign Drinks"
      },
      {
        "name": "Red Label Single",
        "price": "450₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Red Label Double",
        "price": "650₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Red Label 35 CL",
        "price": "2900₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Red Label 50 CL",
        "price": "3800₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Red Label 70 CL",
        "price": "5250₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Black Label Single",
        "price": "470₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Black Label Double",
        "price": "680₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Black Label 35 CL",
        "price": "3000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Black Label 50 CL",
        "price": "3900₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Black Label 70 CL",
        "price": "5500₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Chivas Regal Single",
        "price": "500₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Chivas Regal Double",
        "price": "700₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Chivas Regal 35 CL",
        "price": "3250₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Chivas Regal 50 CL",
        "price": "4200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Chivas Regal 70 CL",
        "price": "6000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Jack Daniel’s Single",
        "price": "500₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Jack Daniel's Double",
        "price": "700₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Jack Daniel’s 35 CL",
        "price": "3250₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Jack Daniel’s 50 CL",
        "price": "4200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Jack Daniels 70 CL",
        "price": "6000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Whiskey"
      },
      {
        "name": "Yeni Rakı Single",
        "price": "300₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Double",
        "price": "550₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı 35 CL",
        "price": "2200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı 50 CL",
        "price": "3000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı 70 CL",
        "price": "4200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Yeni Seri Single",
        "price": "300₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Yeni Seri Double",
        "price": "550₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Yeni Seri 35cl",
        "price": "2200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Yeni Seri 50cl",
        "price": "3000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Yeni Rakı Yeni Seri 70cl",
        "price": "4200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Tekirdağ Altın Serisi Single",
        "price": "330₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Tekirdağ Altın Serisi Double",
        "price": "600₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Tekirdağ Altın Serisi 35cl",
        "price": "2400₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Tekirdağ Altın Serisi 50cl",
        "price": "3200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Tekirdağ Altın Serisi 70cl",
        "price": "4400₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Rakı"
      },
      {
        "name": "Red Wine Glass",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Red Wine Bottle",
        "price": "2000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "White Wine Glass",
        "price": "420₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "White Wine Bottle",
        "price": "2000₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Rose Wine Glass",
        "price": "450₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Rose Wine Bottle",
        "price": "2200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Blush Wine Glass",
        "price": "450₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Blush Wine Bottle",
        "price": "2200₺",
        "desc": "",
        "category": "Local & Foreign Drinks / Wines"
      },
      {
        "name": "Mixed Nuts",
        "price": "180₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Salted Peanuts",
        "price": "150₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Chips",
        "price": "120₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Popcorn",
        "price": "120₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Chocolate",
        "price": "200₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Pistachio",
        "price": "350₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "White Cheese",
        "price": "250₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Pickles",
        "price": "150₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Cold vegetable platter",
        "price": "150₺",
        "desc": "",
        "category": "Nuts"
      },
      {
        "name": "Fruit Platter",
        "price": "400₺",
        "desc": "",
        "category": "Nuts"
      }
    ]
  },
  "7188": {
    "name": "Peak Belgian Waffle's",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/gsbm/peak-belgian-waffles",
    "sourceName": "Yemeksepeti Peak Belgian Waffles & Croissants (Yandex ile Beylikdüzü Kavaklı şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Special One Cup Waffle",
        "price": "629,99 TL",
        "desc": "Belçika usulü küp mini waffle hamurları, seçeceğiniz çikolata, orman meyveleri",
        "category": "Cup Waffles"
      },
      {
        "name": "Muzlu Çikolatalı Cup Waffle",
        "price": "593,74 TL",
        "desc": "Belçika usülü küp dilimlenmiş mini waffle hamuru, muz, seçeceğiniz çikolata",
        "category": "Cup Waffles"
      },
      {
        "name": "Dubai Chocolate Cup Waffle",
        "price": "629,99 TL",
        "desc": "Belçika usülü dilimlenmiş mini waffle hamuru, Dubai çikolatası, seçeceğiniz çikolata, seçeceğiniz meyve",
        "category": "Cup Waffles"
      },
      {
        "name": "Pistachio Croissant",
        "price": "787,49 TL",
        "desc": "Fransız usulüyle hazırlanmış kruvasan hamuru, Antep fıstıklı cream patisserie, muz, Antep fıstığı sos, file Antep fıstığı",
        "category": "Croissants"
      },
      {
        "name": "Peak Of The Croissant",
        "price": "787,49 TL",
        "desc": "Fransız usulü kruvasan hamuru, sütlü çikolata, muz, çilek, fındık",
        "category": "Croissants"
      },
      {
        "name": "Biscoff Lotus Croissant",
        "price": "849,99 TL",
        "desc": "Fransız usulü kruvasan hamuruna; muz, krema, lotus bisküvisi",
        "category": "Croissants"
      },
      {
        "name": "Tropeak Croissant",
        "price": "787,49 TL",
        "desc": "Fransız usulü kruvasan hamuruna; krema, sütlü çikolata, orman meyveleri, file badem",
        "category": "Croissants"
      },
      {
        "name": "New York Roll Croissant",
        "price": "737,49 TL",
        "desc": "Roll kruvasan hamuru içerisine, sütlü çikolata i̇ç dolgusu, beyaz sütlü çikolata sos, orman meyveleri, Antep fıstığı tozu",
        "category": "Croissants"
      },
      {
        "name": "Dubai Croissant",
        "price": "849,99 TL",
        "desc": "Fransız usulü kruvasan hamuru arasına; Antep fıstığı sos, kadayıf, karamel sos",
        "category": "Croissants"
      },
      {
        "name": "Paris Ekler Crush",
        "price": "687,49 TL",
        "desc": "Fransız usulü Paris ekler hamuru, patisserie, çikolata",
        "category": "Croissants"
      },
      {
        "name": "Exotic Waffle (Orta)",
        "price": "737,49 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, çilek, ormen meyveleri, fındık, Antep fıstığı, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "Exotic Waffle (Büyük)",
        "price": "799,99 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, çilek, orman meyveleri, fındık, Antep fıstığı, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "Choco Dream Waffle (Orta)",
        "price": "737,49 TL",
        "desc": "Özel Belçika hamuru, bitter çikolata, çilek, muz, orman meyveleri, yer fıstığı, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "Choco Dream Waffle (Büyük)",
        "price": "799,99 TL",
        "desc": "Özel Belçika hamuru, bitter çikolata, çilek, muz, orman meyveleri, yer fıstığı, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "White Love Waffle (Orta)",
        "price": "737,49 TL",
        "desc": "Özel Belçika hamuru, beyaz çikolata, çilek, muz, fındık, Antep fıstığı, toz Antep fıstığı, karamel sos",
        "category": "Waffles"
      },
      {
        "name": "White Love Waffle (Büyük)",
        "price": "799,99 TL",
        "desc": "Özel Belçika hamuru, beyaz çikolata, çilek, muz, fındık, Antep fıstığı, toz Antep fıstığı, karamel sos",
        "category": "Waffles"
      },
      {
        "name": "Peak Belgian Special Waffle (Orta)",
        "price": "737,49 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, beyaz çikolata, çilek, muz, orman meyveleri, fındık, Antep fıstığı, toz Antep fıstığı, yer fıstığı, Antep fıstığı sos",
        "category": "Waffles"
      },
      {
        "name": "Peak Belgian Special Waffle (Büyük)",
        "price": "799,99 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, beyaz çikolata, çilek, muz, orman meyveleri, fındık, Antep fıstığı, toz Antep fıstığı, yer fıstığı, Antep fıstığı sosu",
        "category": "Waffles"
      },
      {
        "name": "Double Chocolate Waffle (Orta)",
        "price": "737,49 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, bitter çikolata, muz, orman meyveleri, fındık, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "Double Chocolate Waffle (Büyük)",
        "price": "799,99 TL",
        "desc": "Özel Belçika hamuru, sütlü çikolata, bitter çikolata, muz, orman meyveleri, fındık, file badem, beyaz çikolata sos",
        "category": "Waffles"
      },
      {
        "name": "Kova Waffle Bowl İkili Menü",
        "price": "1.398 TL",
        "desc": "Süt, gül suyunda dinlendirilmiş, arasında ceviz, üzerinde toz Antep fıstığı, frambuaz, böğürtlen",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak Choco Mix (500 ml)",
        "price": "799 TL",
        "desc": "Çikolata severler için 500 ml'lik lezzetli karışım. Belçika waffle parçaları, sütlü ve beyaz çikolata, Kit Kat parçaları ile pirinç fındık. Çıtır waffle dokusuyla kaşık kaşık çikolata keyfi yaşayın.",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak Lotus Berry",
        "price": "799 TL",
        "desc": "Lotus + çilek... Bu ikili gereğinden fazla iyi oldu. Belçika waffle parçaları, beyaz çikolata, taze çilek ve bol Lotus Biscoff parçaları. Meyvemsi, karamelsi ve çıtır tatları aynı kaşıkta buluşturan Peak yorumu.",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak Bueno Duo (500 ml)",
        "price": "799 TL",
        "desc": "Buenonun birini seçemedik, ikisini de koyduk! Belçika waffle parçaları, sütlü ve beyaz çikolata, Kinder Bueno & Kinder Bueno White ve bol muz. Bueno sevenler için 500 mllik tam bir mutluluk kovası.",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak Choco Crunch",
        "price": "799 TL",
        "desc": "Çıtırtısını ilk kaşıkta duyacaksın! Altın renginde waffle parçaları, bol sütlü Belçika çikolatası ve kakaolu Nestlé Crunch gevrekleriyle hazırlanan Peak Choco Crunch, her lokmada yoğun çikolata ve karşı konulmaz bir çıtırlık sunar.",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak Dubai Pistachio Bueno Kova Waffle",
        "price": "849,99 TL",
        "desc": "Belçika waffle parçaları, Antep fıstığı kreması, Kinder Bueno, çıtır kadayıf, Antep fıstığı",
        "category": "Kova Waffles"
      },
      {
        "name": "Peak After Dark (500 ml)",
        "price": "849,99 TL",
        "desc": "Çikolatanın karanlık tarafına geç. Altın renkli çıtır Belçika waffle parçaları, yoğun bitter çikolata, ETİ Karam Gurme gofret, taze çilek, muz ve bol pirinç fındık. Fazla tatlıdan hoşlanmayan, yoğun çikolata karakteri ve çıtırlık arayanlara özel 500 ml-lik Peak deneyimi.",
        "category": "Kova Waffles"
      },
      {
        "name": "İtalyan Gelato Dondurma (6 Paket)",
        "price": "870 TL",
        "desc": "6 adet olarak servis edilir.",
        "category": "İtalyan Gelato Dondurmalar"
      },
      {
        "name": "İtalyan Gelato Dondurma (8 Adet)",
        "price": "1.160 TL",
        "desc": "Seçeceğiniz 8 adet dondurma ile",
        "category": "İtalyan Gelato Dondurmalar"
      },
      {
        "name": "Italian Gelato Dondurma (10 Adet)",
        "price": "1.450 TL",
        "desc": "Seçeceğiniz 10 çeşit dondurma",
        "category": "İtalyan Gelato Dondurmalar"
      },
      {
        "name": "İtalyan Gelato Dondurma (12 Adet)",
        "price": "1.755 TL",
        "desc": "Seçeceğiniz 12 adet dondurma",
        "category": "İtalyan Gelato Dondurmalar"
      },
      {
        "name": "Honey Smoke Croissant Sandwich + Berry Hibiscus Limonata (220 ML)",
        "price": "835 TL",
        "desc": "Fransız usulü hazırlanmış taze kruvasan hamuru içerisinde kıvırcık, dilimlenmiş köy domatesi, cheddar peyniri ve hindi füme dilimleri ballı hardal sos ile sunulur. Ilık servis edilir. Hibiskus ve kırmızı meyve notalarının uyumuyla hazırlanan ferahlatıcı premium limonata 220 ml ile birlikte gelir.",
        "category": "Croissant Sandwich Menus"
      },
      {
        "name": "Italıan Touch Croissant Sandwich + Taze Limonata (220 ML)",
        "price": "835 TL",
        "desc": "Fransız Usülü Hazırlanmış Taze Kruvasan Hamuruna İç katman olarak, Taze Dilimlenmiş Çeçil Peynir parçaları, Dilimlenmiş Köy Domatesi, Taze Ayıklanmış Roka Parçaları arasına Italıan Son Dokunuş olarak Pesto Sos ile Hazırlanır. (Ilık Servis Edilir.) + Günlük sıkım limonlarla hazırlanan, buz gibi ferahlatıcı ve %100 doğal lezzet deneyimi",
        "category": "Croissant Sandwich Menus"
      },
      {
        "name": "Truffle House Croissant Sandwich + Berry Hibiscus Limonata (220 ML)",
        "price": "835 TL",
        "desc": "Fransız usulü hazırlanmış taze kruvasan hamuru, taze ayıklanmış kıvırcık, eski kaşar dilimleri, dana jambon dilimleri, trüf sos ile hazırlanır. (ılık servis edilir.) + hibiskus ve kırmızı meyve notalarının eşsiz uyumuyla hazırlanan, fresh ve ferahlatıcı premium limonata deneyimi",
        "category": "Croissant Sandwich Menus"
      },
      {
        "name": "Fresh Club Croissant Sandwich + Berry Hibiscus Limonata (220 ML)",
        "price": "835 TL",
        "desc": "Fransız usulü hazırlanmış taze kruvasan hamuru, taze ayıklanmış kıvırcık, dilimlenmiş köy domatesi, dilimlenmiş çengelköy salatalık, ezine peyniri dilimleri (ılık servis edilir.) + hibiskus ve kırmızı meyve notalarının eşsiz uyumuyla hazırlanan, fresh ve ferahlatıcı premium limonata deneyimi (220 ml)",
        "category": "Croissant Sandwich Menus"
      },
      {
        "name": "Tuna Verde Croissant Sandwich + Berry Hibiscus Limonata (220 ML)",
        "price": "835 TL",
        "desc": "Fransız usulü hazırlanmış taze kruvasan hamuru, taze kıvırcık dilimleri, ton balığı, taze maydanoz, mayonez ve ceviz karışımıyla hazırlanmış harç ile hazırlanır (Ilık servis edilir.) + Hibiskus ve kırmızı meyve notalarının eşsiz uyumuyla hazırlanan, fresh ve ferahlatıcı premium limonata deneyimi",
        "category": "Croissant Sandwich Menus"
      }
    ]
  },
  "7185": {
    "name": "KEBO BEYLİKDÜZÜ",
    "sourceUrl": "https://www.migros.com.tr/yemek/kebo-beylikduzu-cumhuriyet-mah-st-2d263",
    "sourceName": "Migros Yemek Kebo Beylikdüzü (Cumhuriyet Mah.) canlı menüsü (resmi KEBO/Instagram/Yandex şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Coca Cola&çuros (1 Kişilik) Menü",
        "price": "459,00 TL",
        "desc": "1 adet dilediğiniz 90 gr dürüm (kebo, green, kebabi, patron, atom), 1 adet coca cola ve 2 adet churros",
        "category": "Coca-Cola Lezzetli Menüler"
      },
      {
        "name": "Coca Cola Menü (2 Kişilik)",
        "price": "980,00 TL",
        "desc": "2 adet dilediğiniz 90 gr dürüm (Kebo, Green, Kebabi, Patron, Atom), 2 adet coca cola ve patates kızartması (200 g)",
        "category": "Coca-Cola Lezzetli Menüler"
      },
      {
        "name": "Coca Cola Menü (3 Kişilik)",
        "price": "1.365,00 TL",
        "desc": "3 adet dilediğiniz 90 gr dürüm (Kebo, Green, Kebabi, Patron, Atom), 3 adet coca cola ve patates kızartması (300 g)",
        "category": "Coca-Cola Lezzetli Menüler"
      },
      {
        "name": "Kebo Dürüm (Klasik Efsane) Menü Yap",
        "price": "360,00 TL",
        "desc": "Kebo dürüm (Klasik Efsane) (90 gr) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Avantajlı Menü Oluştur"
      },
      {
        "name": "Green Dürüm (Bol Yeşillik) Menü Yap",
        "price": "350,00 TL",
        "desc": "Green Dürüm (Bol Yeşillik) + Seçeceğiniz Çıtır + Seçeceğiniz Sos + İçecek",
        "category": "Avantajlı Menü Oluştur"
      },
      {
        "name": "Kebabi Dürüm (Soğan Sevenlere) Menü Yap",
        "price": "350,00 TL",
        "desc": "Kebabi Dürüm (Soğan Sevenlere) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Avantajlı Menü Oluştur"
      },
      {
        "name": "Patron Dürüm (Mayonez Sevenlere) Menü Yap",
        "price": "330,00 TL",
        "desc": "Patron Dürüm (Mayonez Sevenlere) + Seçeceğiniz Çıtır + Seçeceğiniz Sos + İçecek",
        "category": "Avantajlı Menü Oluştur"
      },
      {
        "name": "Atom Dürüm (Bol Çeşit) Menü Yap",
        "price": "410,00 TL",
        "desc": "Atom Dürüm (Bol Çeşit) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Avantajlı Menü Oluştur"
      },
      {
        "name": "Combo Menü Xl (2 Kişilik)",
        "price": "890,00 TL",
        "desc": "Seçeceğiniz 2 Adet Dürüm + Patates Kızartması (200 gr.) + 2 Adet Kutu İçecek",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Coca Cola Menü (2 Kişilik)",
        "price": "980,00 TL",
        "desc": "2 adet dilediğiniz 90 gr dürüm (Kebo, Green, Kebabi, Patron, Atom), 2 adet coca cola ve patates kızartması (200 g)",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Trio Menü Xl (3 Kişilik)",
        "price": "1.230,00 TL",
        "desc": "Seçeceğiniz 3 Adet Dürüm + Patates Kızartması (300 gr.) + 3 Adet Kutu İçecek",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Coca Cola Menü (3 Kişilik)",
        "price": "1.365,00 TL",
        "desc": "3 adet dilediğiniz 90 gr dürüm (Kebo, Green, Kebabi, Patron, Atom), 3 adet coca cola ve patates kızartması (300 g)",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Yummy Menü (2 Kişilik)",
        "price": "580,00 TL",
        "desc": "Soslu Çıtır Lavaş Ekmeği İçerisinde 100 Gr Schinitzel, Yummy Sos, Patates Kızartması, Yeşil Salata,Turşu Ve İsteğe Bağlı Acı Biber",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Tenders Dürüm Menü (2 Kişilik)",
        "price": "740,00 TL",
        "desc": "Mayonezli Çıtır Lavaş Ekmeği İçerisinde 120 Gr Tenders, Kebo Mayonez, Yeşil Salata Karışımı, Turşu Ve İsteğe Bağlı Acı Biber",
        "category": "2-3-4 Kişilik Menüler"
      },
      {
        "name": "Yummy Dürüm&içecek",
        "price": "350,00 TL",
        "desc": "Soslu Çıtır Lavaş Ekmeği İçerisinde 100 Gr Schinitzel, Yummy Sos, Patates Kızartması, Yeşil Salata, Turşu Ve İsteğe Bağlı Acı Biber",
        "category": "Ekonomik Menüler"
      },
      {
        "name": "Tenders Dürüm&içecek",
        "price": "410,00 TL",
        "desc": "Mayonezli Çıtır Lavaş Ekmeği İçerisinde 120 Gr Tenders, Kebo Mayonez, Yeşil Salata Karışımı, Turşu Ve İsteğe Bağlı Acı Biber",
        "category": "Ekonomik Menüler"
      },
      {
        "name": "Çuros (3 Adet)",
        "price": "100,00 TL",
        "desc": "Altın renginde kızartılmış, dışı çıtır içi yumuşacık enfes churros, üzerine serpiştirilen tarçın ve şeker ile lezzeti katlanarak yanında özel çikolata sos ile servis edilir.",
        "category": "Çıtırlar"
      },
      {
        "name": "Patates Kızartması (80 Gr)",
        "price": "100,00 TL",
        "desc": "Patates Kızartması (80 Gr)",
        "category": "Çıtırlar"
      },
      {
        "name": "Patates Kızartması (100 Gr)",
        "price": "120,00 TL",
        "desc": "Patates Kızartması (100 Gr)",
        "category": "Çıtırlar"
      },
      {
        "name": "Jumbo Patates K. (140 Gr)",
        "price": "150,00 TL",
        "desc": "Jumbo Patates K. (140 Gr)",
        "category": "Çıtırlar"
      },
      {
        "name": "3'Lü Nugget",
        "price": "80,00 TL",
        "desc": "3 Adet",
        "category": "Çıtırlar"
      },
      {
        "name": "6'Lı Nugget",
        "price": "140,00 TL",
        "desc": "6 Adet",
        "category": "Çıtırlar"
      },
      {
        "name": "9'Lu Nugget",
        "price": "200,00 TL",
        "desc": "9 Adet",
        "category": "Çıtırlar"
      },
      {
        "name": "6'Lı Soğan Halkası",
        "price": "80,00 TL",
        "desc": "6'Lı Soğan Halkası",
        "category": "Çıtırlar"
      },
      {
        "name": "9'Lu Soğan Halkası",
        "price": "110,00 TL",
        "desc": "9'Lu Soğan Halkası",
        "category": "Çıtırlar"
      },
      {
        "name": "12'Li Soğan Halkası",
        "price": "135,00 TL",
        "desc": "12'Li Soğan Halkası",
        "category": "Çıtırlar"
      },
      {
        "name": "6'Lı Tavuk Topu",
        "price": "90,00 TL",
        "desc": "6'Lı Tavuk Topu",
        "category": "Çıtırlar"
      },
      {
        "name": "8'Li Tavuk Topu",
        "price": "120,00 TL",
        "desc": "8'Li Tavuk Topu",
        "category": "Çıtırlar"
      },
      {
        "name": "10'Lu Tavuk Topu",
        "price": "150,00 TL",
        "desc": "10'Lu Tavuk Topu",
        "category": "Çıtırlar"
      },
      {
        "name": "12'Li Tavuk Topu",
        "price": "180,00 TL",
        "desc": "12'Li Tavuk Topu",
        "category": "Çıtırlar"
      },
      {
        "name": "90 Gr Çıtır Bonfile",
        "price": "180,00 TL",
        "desc": "90 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "120 Gr Çıtır Bonfile",
        "price": "240,00 TL",
        "desc": "120 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "150 Gr Çıtır Bonfile",
        "price": "300,00 TL",
        "desc": "150 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "180 Gr Çıtır Bonfile",
        "price": "360,00 TL",
        "desc": "180 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "210 Gr Çıtır Bonfile",
        "price": "420,00 TL",
        "desc": "210 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "300 Gr Çıtır Bonfile",
        "price": "499,00 TL",
        "desc": "300 Gr Çıtır Bonfile",
        "category": "Çıtırlar"
      },
      {
        "name": "Patates K.+2'li Nugget",
        "price": "120,00 TL",
        "desc": "Patates K.+2'Li Nugget",
        "category": "Çıtırlar"
      },
      {
        "name": "Patates K.+4'lü Soğan H.",
        "price": "120,00 TL",
        "desc": "Patates K.+4'Lü Soğan H.",
        "category": "Çıtırlar"
      },
      {
        "name": "Patates K.+4'lü Tavuk T.",
        "price": "120,00 TL",
        "desc": "Patates K.+4'Lü Tavuk T.",
        "category": "Çıtırlar"
      },
      {
        "name": "Ranch Sos",
        "price": "20,00 TL",
        "desc": "Paket olarak servis edilmektedir.",
        "category": "Soslar"
      },
      {
        "name": "Barbekü Sos",
        "price": "20,00 TL",
        "desc": "Paket olarak servis edilmektedir.",
        "category": "Soslar"
      },
      {
        "name": "Acı Sos",
        "price": "20,00 TL",
        "desc": "Paket olarak servis edilmektedir.",
        "category": "Soslar"
      },
      {
        "name": "Ballı Hardal Sos",
        "price": "20,00 TL",
        "desc": "Ballı Hardal Sos",
        "category": "Soslar"
      },
      {
        "name": "Sarımsaklı Mayonez",
        "price": "20,00 TL",
        "desc": "Paket olarak servis edilmektedir.",
        "category": "Soslar"
      },
      {
        "name": "Çuros (3 Adet)",
        "price": "100,00 TL",
        "desc": "Altın renginde kızartılmış, dışı çıtır içi yumuşacık enfes churros, üzerine serpiştirilen tarçın ve şeker ile lezzeti katlanarak yanında özel çikolata sos ile servis edilir.",
        "category": "Tatlılar"
      },
      {
        "name": "Sütaş Tatlım Puding Kakaolu",
        "price": "50,00 TL",
        "desc": "Çikolatalı",
        "category": "Tatlılar"
      },
      {
        "name": "Sütaş Tatlım Puding Muzlu",
        "price": "50,00 TL",
        "desc": "Muzlu",
        "category": "Tatlılar"
      },
      {
        "name": "Sütaş Kutu Ayran 275 Ml.",
        "price": "60,00 TL",
        "desc": "Sütaş Kutu Ayran 275 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola 330 Ml.",
        "price": "110,00 TL",
        "desc": "Coca Cola 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Zero 330 Ml.",
        "price": "110,00 TL",
        "desc": "Coca Cola Zero 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Light 330 Ml",
        "price": "110,00 TL",
        "desc": "Coca Cola Light 330 Ml",
        "category": "İçecekler"
      },
      {
        "name": "Fanta 330 Ml.",
        "price": "110,00 TL",
        "desc": "Fanta 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Sprıte 330 Ml.",
        "price": "110,00 TL",
        "desc": "Sprıte 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Fusetea Şeftali 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fusetea Limon 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fusetea Mango 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fusetea Karpuz 330 Ml.",
        "price": "110,00 TL",
        "desc": "Fusetea Karpuz 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Fusetea Kavun Çilek 330 Ml.",
        "price": "110,00 TL",
        "desc": "Fusetea Karpuz Çilek 330 Ml.",
        "category": "İçecekler"
      },
      {
        "name": "Cappy Şeftali 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Cappy Vişne 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Cappy Karışık 330 Ml.",
        "price": "110,00 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Şalgam Acılı",
        "price": "110,00 TL",
        "desc": "Şalgam Acılı",
        "category": "İçecekler"
      },
      {
        "name": "Şalgam Acısız",
        "price": "110,00 TL",
        "desc": "Şalgam Acısız",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola 1 L.",
        "price": "165,00 TL",
        "desc": "Coca Cola 1 L.",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Zero 1 L.",
        "price": "165,00 TL",
        "desc": "Coca Cola Zero 1 L.",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Light 1 L.",
        "price": "165,00 TL",
        "desc": "Coca Cola Light 1 L.",
        "category": "İçecekler"
      },
      {
        "name": "Fanta 1 L.",
        "price": "165,00 TL",
        "desc": "Fanta 1 L.",
        "category": "İçecekler"
      },
      {
        "name": "Sprıte 1 L.",
        "price": "165,00 TL",
        "desc": "Sprıte 1 L.",
        "category": "İçecekler"
      },
      {
        "name": "Kebo Dürüm (Klasik Efsane)",
        "price": "360,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 90 gr. Kebo tavuk döner, Kebo sos, Kebo mayonezi, patates kızartması, turşu, isteğe bağlı acı biber",
        "category": "Dürümler"
      },
      {
        "name": "Green Dürüm (Bol Yeşillik)",
        "price": "350,00 TL",
        "desc": "Green Dürüm (Bol Yeşillik) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Dürümler"
      },
      {
        "name": "Kebabi Dürüm (Soğan Sevenlere)",
        "price": "350,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 90 gr. Kebo tavuk döneri, Kebo sos, soğan, isteğe bağlı acı biber",
        "category": "Dürümler"
      },
      {
        "name": "Patron Dürüm (Mayonez Sevenlere)",
        "price": "330,00 TL",
        "desc": "Patron Dürüm (Mayonez Sevenlere) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Dürümler"
      },
      {
        "name": "Atom Dürüm (Bol Çeşit)",
        "price": "410,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 90 gr. Kebo tavuk döneri, Kebo sos, Kebo mayonezi, patates kızarması, turşu, yeşil salata, soğan, isteğe bağlı acı biber",
        "category": "Dürümler"
      },
      {
        "name": "Yummy Dürüm (Çıtır Sevenlere)",
        "price": "300,00 TL",
        "desc": "Yummy Dürüm (Çıtır Sevenlere) yanına avantajlı olarak içecek, çıtır veya sos ekleyerek menünü kendi damak zevkine göre tamamla.",
        "category": "Dürümler"
      },
      {
        "name": "Tenders Dürüm (Tenders Sevenlere)",
        "price": "360,00 TL",
        "desc": "Mayonezli çıtır lavaş ekmeği içerisinde; 120 gr. tenders, Kebo mayonez, turşu, yeşil salata, isteğe bağlı acı biber",
        "category": "Dürümler"
      },
      {
        "name": "Kebo Dürüm (Junior)",
        "price": "330,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 60 gr. Kebo tavuk döner, Kebo mayonez, Kebo sos, patates kızartması, turşu, isteğe bağlı acı biber",
        "category": "Junior Dürümler"
      },
      {
        "name": "Green Dürüm (Junior)",
        "price": "320,00 TL",
        "desc": "Mayonezli çıtır lavaş ekmeği içerisinde; 60 gr. Kebo tavuk döner, Kebo mayonez, yeşil salata, isteğe bağlı acı biber",
        "category": "Junior Dürümler"
      },
      {
        "name": "Kebabi Dürüm (Junior)",
        "price": "320,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 60 gr. Kebo tavuk döneri, Kebo sos, soğan, isteğe bağlı acı biber",
        "category": "Junior Dürümler"
      },
      {
        "name": "Patron Dürüm (Junior)",
        "price": "300,00 TL",
        "desc": "Mayonezli çıtır lavaş ekmeği içerisinde; 60 gr. Kebo tavuk döneri, Kebo mayonezi, isteğe bağlı acı biber",
        "category": "Junior Dürümler"
      },
      {
        "name": "Atom Dürüm (Junior)",
        "price": "380,00 TL",
        "desc": "Soslu çıtır lavaş ekmeği içerisinde; 60 gr. Kebo tavuk döneri, Kebo sos, Kebo mayonezi, patates kızarması, turşu, yeşil salata, soğan, isteğe bağlı acı biber",
        "category": "Junior Dürümler"
      }
    ]
  },
  "7193": {
    "name": "Habil Pizza",
    "sourceUrl": "https://www.habilpizza.com/",
    "sourceName": "Habil Pizza resmi sitesi — 22/08/2026 Günün Menüsü",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Süzme Mercimek Çorba",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Çorbalar"
      },
      {
        "name": "Soğuk Ayran Çorba",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Çorbalar"
      },
      {
        "name": "Kıymalı Fırın Patates",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Ana Yemekler"
      },
      {
        "name": "Piliç Pane",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Ana Yemekler"
      },
      {
        "name": "Ispanak Sufle",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Ana Yemekler"
      },
      {
        "name": "Kuru Fasulye",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Ana Yemekler"
      },
      {
        "name": "Pirinç Pilavı",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Yardımcı Yemekler"
      },
      {
        "name": "Salçalı Makarna",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Yardımcı Yemekler"
      },
      {
        "name": "Salata",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Salata / Tatlı / İçecek"
      },
      {
        "name": "Ayran",
        "price": "",
        "desc": "",
        "category": "Günün Menüsü 22/08/2026 / Salata / Tatlı / İçecek"
      },
      {
        "name": "Etli Menü 4'lü",
        "price": "380 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      },
      {
        "name": "Etli Menü 3'lü",
        "price": "360 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      },
      {
        "name": "Etli Menü 2'li",
        "price": "340 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      },
      {
        "name": "Tavuklu Sebzeli Menü 4'lü",
        "price": "360 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      },
      {
        "name": "Tavuklu Sebzeli Menü 3'lü",
        "price": "340 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      },
      {
        "name": "Tavuklu Sebzeli Menü 2'li",
        "price": "320 TL",
        "desc": "Tek menü siparişi yoktur.",
        "category": "Menü Paketleri"
      }
    ]
  },
  "7196": {
    "name": "Efes Döner İstanbul",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/akwt/efes-doner-istanbul",
    "sourceName": "Yemeksepeti Efes Döner İstanbul canlı menüsü (Türkali/Ihlamurdere No:82 şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Et iskenderun dürüm menü",
        "price": "750 TL",
        "desc": "Et dürüm soğan maydonoz ve domatesli yanında patates ve küçük ayran",
        "category": "1 Kişilik Menüler"
      },
      {
        "name": "Et Antakya Dürüm Menü",
        "price": "750 TL",
        "desc": "Et dürüm ve patates küçük ayran",
        "category": "1 Kişilik Menüler"
      },
      {
        "name": "Tavuk Antakya (75 gr.)",
        "price": "220 TL",
        "desc": "Hatay Antakya usulü özel soslu döner; kızarmış ekmek, patates kızartması, turşu, domates, sarımsaklı mayonez",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Efes Özel (150 gr.)",
        "price": "370 TL",
        "desc": "Efes spesiyal usulü özel döner; kızarmış ekmek, özel soslu döner, patates kızartması, sarımsaklı mayo, soğan, maydanoz, domates, turşu ile",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Hatay (100 gr.)",
        "price": "270 TL",
        "desc": "Hatay Antakya usulü özel soslu döner; kızarmış ekmekle, patates, turşu, domates ve sarımsaklı mayonez ile",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Hatay Usulü Tavuk Döner Dürüm (150 gr.)",
        "price": "370 TL",
        "desc": "Hatay Antakya usulü özel soslu tavuk döner, kızarmış ekmek, patates kızartması, turşu, domates, sarımsaklı mayonez",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "İskenderun Usulü Tavuk Döner Dürüm (100 gr.)",
        "price": "270 TL",
        "desc": "İskenderun usulü özel soslu tavuk döner, soğan, maydanoz, domates",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Hatay Usulü Tavuk Döner Dürüm (75 gr.)",
        "price": "220 TL",
        "desc": "Hatay Antakya usulü özel soslu tavuk döner, kızarmış ekmek, patates kızartması, turşu, domates, sarımsaklı mayonez",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Efes Özel Double Tavuk Döner Dürüm",
        "price": "520 TL",
        "desc": "Kızarmış ekmek, özel soslu tavuk döner, patates kızartması, sarımsaklı mayonez, soğan, maydanoz, domates, turşu",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "İskenderun Usulü Tavuk Döner Dürüm (75 gr.)",
        "price": "240 TL",
        "desc": "İskenderun usulü özel soslu tavuk döner, soğan, maydanoz, domates",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "İskenderun Usulü Tavuk Döner Dürüm (150 gr.)",
        "price": "400 TL",
        "desc": "İskenderun usulü özel soslu tavuk döner, soğan, maydanoz, domates",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Double Hatay Usulü Tavuk Döner Dürüm",
        "price": "600 TL",
        "desc": "Hatay Antakya usulü özel soslu tavuk döner, patates kızartması, turşu, domates, sarımsaklı mayonez",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "İskender (Tavuk Dönerden)",
        "price": "450 TL",
        "desc": "Kızarmış ekmek üzerine; özel soslu tavuk döner, tereyağı, yoğurt, domates sos",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Döner Porsiyon",
        "price": "380 TL",
        "desc": "tavuk döner , kızarmış ekmek, turşu, domates ile",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "İskenderun Usulü Double Tavuk Döner Dürüm",
        "price": "520 TL",
        "desc": "İskenderun usulü özel soslu döner, soğan, maydanoz, domates",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Efes Özel Tavuk Döner Dürüm (75 gr.)",
        "price": "220 TL",
        "desc": "Kızarmış ekmeğe; özel soslu tavuk döner, patates kızartması, sarımsaklı mayonez, soğan, maydanoz, domates, turşu",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tavuk Efes Özel (100 gr.)",
        "price": "270 TL",
        "desc": "Efes Spesiyal usulü özel döner; Kızarmış ekmekte özel soslu döner, patates, sarımsaklı mayo, soğan, maydanoz, domates ve turşuyla efsane birleşim",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası İskenderun Usulü Tavuk Döner (100 gr.)",
        "price": "320 TL",
        "desc": "Soğan, maydanoz, domates",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Antakya Usulü Tavuk Döner (100 gr.)",
        "price": "320 TL",
        "desc": "Patates kızartması, turşu, mayonez",
        "category": "Tavuk Dönerler"
      },
      {
        "name": "Double Antakya Et dürüm",
        "price": "999 TL",
        "desc": "Antakya usulü patates , turşu , el yapımı sarımsaklı mayonez ve özel sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "1.5 Kişilik Et dürüm Antakya",
        "price": "749 TL",
        "desc": "Antakya usulü patates , turşu , el yapımı sarımsaklı mayonez ve özel sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "1 Kişilik Et dürüm Antakya",
        "price": "439 TL",
        "desc": "Antakya usulü patates , turşu , el yapımı sarımsaklı mayonez ve özel sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "1.5 Kişilik Et dürüm İskenderun",
        "price": "749 TL",
        "desc": "İskenderun Usulü soğan maydonoz domates ve özel sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "1 Kişilik Et dürüm İskenderun",
        "price": "439 TL",
        "desc": "İskenderun usulü Et dürüm Soğan Maydonoz Domates ve sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "Double İskenderun Et dürüm",
        "price": "999 TL",
        "desc": "İskenderun Usulü soğan maydonoz domates ve özel sos ile servis edilir.",
        "category": "Et Dönerler"
      },
      {
        "name": "Et Beyti",
        "price": "749 TL",
        "desc": "Özel baharatlı döner, lavaşa sarılır; yoğurt ve domates sos ile tereyağ",
        "category": "Et Dönerler"
      },
      {
        "name": "Pilav Üstü Et Döner",
        "price": "849 TL",
        "desc": "Turşu, közlenmiş biber ile",
        "category": "Et Dönerler"
      },
      {
        "name": "İskender (Et Dönerden)",
        "price": "749 TL",
        "desc": "Yoğurt, domates sos ile",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası Antakya Usulü Et Döner (100 gr.)",
        "price": "749 TL",
        "desc": "Patates kızartması, turşu, mayonez",
        "category": "Et Dönerler"
      },
      {
        "name": "Et Döner",
        "price": "699 TL",
        "desc": "Patates kızartması, turşu, domates ile",
        "category": "Et Dönerler"
      },
      {
        "name": "Tombik Ekmek Arası İskenderun Usulü Et Döner (100 gr.)",
        "price": "749 TL",
        "desc": "Soğan, maydanoz, domates",
        "category": "Et Dönerler"
      },
      {
        "name": "Patates Kızartması",
        "price": "100 TL",
        "desc": "Tek kişilik",
        "category": "Ara Sıcaklar"
      },
      {
        "name": "Patates Kızartması (Double)",
        "price": "180 TL",
        "desc": "Büyük boy",
        "category": "Ara Sıcaklar"
      },
      {
        "name": "Ev Yapımı Sarımsaklı Mayonez",
        "price": "30 TL",
        "desc": "Adet olarak servis edilmektedir.",
        "category": "Ara Sıcaklar"
      },
      {
        "name": "Pepsi (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "Eker Ayran (30 cl.)",
        "price": "70 TL",
        "desc": "Büyük boy",
        "category": "içecekler"
      },
      {
        "name": "Pepsi Max (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "7up (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "Yedigün (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "Lipton Ice Tea Şeftali (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "Lipton Ice Tea Limon (33 cl.)",
        "price": "80 TL",
        "desc": "Kutu içecek",
        "category": "içecekler"
      },
      {
        "name": "Doğanay Gurme Acılı Suyu (30 cl.)",
        "price": "75 TL",
        "desc": "Pet şişe",
        "category": "içecekler"
      },
      {
        "name": "Doğanay Gurme Acısız Şalgam Suyu (30 cl.)",
        "price": "75 TL",
        "desc": "Pet şişe",
        "category": "içecekler"
      }
    ]
  },
  "7197": {
    "name": "Burger Yiyelim",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/i4bn/burger-yiyelim-i4bn",
    "sourceName": "Yemeksepeti Burger Yiyelim Ortaköy canlı menüsü (Muallim Naci–Canfener No:8/12 şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Coca-Cola Offer (Offer for Two)",
        "price": "770 TL",
        "desc": "2 Medium Burgers + Large Fries + 4 Onion Rings + 1 Liter Drink + 4 Sauces",
        "category": "Coca-Cola Special Offer Menus"
      },
      {
        "name": "Yemeksepeti Menu for Two",
        "price": "790,00 TL",
        "desc": "Medium Cheese Burger + Legendary Chicken Burger + Large French Fries + 6 Onion Rings + 1 Liter Drink + 4 Sauces",
        "category": "Yemeksepeti Özel"
      },
      {
        "name": "Yemeksepeti Special Double Menu",
        "price": "675,00 TL",
        "desc": "2 Medium Cheeseburgers + 2 Drinks",
        "category": "Yemeksepeti Özel"
      },
      {
        "name": "Smash Burger Menu",
        "price": "510 TL",
        "desc": "Smash Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Dublex Smash Burger Menu",
        "price": "620 TL",
        "desc": "Dublex Smash Burger + French Fries + 2 Sauces + Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Triplex Smash Burger Menu",
        "price": "760 TL",
        "desc": "Triplex Smash Burger + French Fries + 2 Sauces + Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Cherry Smash Burger Menu",
        "price": "520 TL",
        "desc": "Cherry Smash Burger, French Fries, 2 Sauces, Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Duplex Cherry Smash Burger Menu",
        "price": "640 TL",
        "desc": "Dublex Cherry Smash Burger, French Fries, 2 Sauces, Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Triplex Cherry Smash Burger Menu",
        "price": "780 TL",
        "desc": "Triplex Cherry Smash Burger, French Fries, 2 Sauces, Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Truffle Smash Burger Menu",
        "price": "520 TL",
        "desc": "Truff Smash Burger, French Fries, Canned Drink, 2 Sauces",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Dublex Truff Smash Burger Menü",
        "price": "640 TL",
        "desc": "Dublex Truff Smash Burger + French Fries + 2 Sauces + Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Triplex Truff Smash Burger Menü",
        "price": "780 TL",
        "desc": "Triplex Truff Smash Burger + French Fries + 2 Sauces + Canned Drink",
        "category": "Smash Burger Menüleri"
      },
      {
        "name": "Medium Burger Menu",
        "price": "470 TL",
        "desc": "Medium Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Medium Cheese Burger Menu",
        "price": "490 TL",
        "desc": "Medium Cheese Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Medium Butcher Burger Menu",
        "price": "510 TL",
        "desc": "Medium Butcher Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Medium Mexicano Burger Menu",
        "price": "510 TL",
        "desc": "Medium Mexicano Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Gourmet BBQ Burger Menu",
        "price": "560 TL",
        "desc": "Gourmet BBQ Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Cheese Burger Menu",
        "price": "560 TL",
        "desc": "Cheese Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Butcher Burger Menu",
        "price": "580 TL",
        "desc": "Butcher Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Mexicano Burger Menu",
        "price": "580 TL",
        "desc": "Mexicano Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Burger Yiyelim Menü",
        "price": "580 TL",
        "desc": "Burger Yiyelim Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Steak Burger Menu",
        "price": "690 TL",
        "desc": "Steak Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Lokum Burger Menu",
        "price": "695 TL",
        "desc": "Lokum Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Dublex Burger Menu",
        "price": "670 TL",
        "desc": "Dublex Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Triplex Burger Menu",
        "price": "815 TL",
        "desc": "Triplex Burger + French Fries + Boxed Drink + 2 Sauces",
        "category": "Burger Menüleri"
      },
      {
        "name": "Legendary Chicken Burger Menu",
        "price": "470 TL",
        "desc": "Legendary Chicken Burger + French Fries + Canned Drink + 2 Sauces",
        "category": "Tavuk Burger Menüleri"
      },
      {
        "name": "Smash Burger",
        "price": "370 TL",
        "desc": "70 gr. beef, burger cheese, caramelized onions, greens, pickles",
        "category": "Smash Burgerler"
      },
      {
        "name": "Dublex Smash Burger",
        "price": "480 TL",
        "desc": "140 gr. beef, burger cheese, caramelized onions, greens, pickles",
        "category": "Smash Burgerler"
      },
      {
        "name": "Triplex Smash Burger",
        "price": "620 TL",
        "desc": "210 gr. beef, 3 burger cheese slices, caramelized onions, greens, pickles",
        "category": "Smash Burgerler"
      },
      {
        "name": "Cherry Smash Burger",
        "price": "380 TL",
        "desc": "70 gr. Beef (with Burger Cheese, Caramelized Onions, Greens, Pickles, Cherry Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Dublex Cherry Smash Burger",
        "price": "500 TL",
        "desc": "140 gr Beef (Double Burger Cheese, Caramelized Onions, Cherry Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Triplex Truff Smash Burger",
        "price": "640 TL",
        "desc": "210g Beef (3 Layers Burger Cheese, Caramelized Onions, Truffle Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Truff Smash Burger",
        "price": "380 TL",
        "desc": "70 gr. Beef (with Burger Cheese, Caramelized Onions, Greens, Pickles, Truffle Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Dublex Truff Smash Burger",
        "price": "500 TL",
        "desc": "140 gr. Beef (Double Burger Cheese, Caramelized Onions, Truffle Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Triplex Cherry Smash Burger",
        "price": "640 TL",
        "desc": "210 gr. Beef (3 Layers of Burger Cheese, Caramelized Onions, Cherry Sauce)",
        "category": "Smash Burgerler"
      },
      {
        "name": "Medium Burger",
        "price": "330 TL",
        "desc": "90 gr. beef, caramelized onions, pickles, greens",
        "category": "Burgerler"
      },
      {
        "name": "Medium Cheeseburger",
        "price": "350 TL",
        "desc": "90 gr. beef, cheddar cheese, caramelized onions, pickles, greens",
        "category": "Burgerler"
      },
      {
        "name": "Medium Butcher Burger",
        "price": "370 TL",
        "desc": "90 gr. beef, smoked beef, caramelized onion, greens, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Medium Mexicano Burger",
        "price": "370 TL",
        "desc": "90 gr. beef, louisiana sauce, greens, pickles, caramelized onions, jalapeno peppers, roasted peppers, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Gourmet BBQ Burger",
        "price": "420 TL",
        "desc": "130 gr. beef, cheddar cheese, onion rings, pickle barbecue sauce",
        "category": "Burgerler"
      },
      {
        "name": "Cheeseburger",
        "price": "420 TL",
        "desc": "130 gr. beef, cheddar cheese, caramelized onion, pickles, greens",
        "category": "Burgerler"
      },
      {
        "name": "Butcher Burger",
        "price": "440 TL",
        "desc": "130 gr. beef, smoked beef, caramelized onion, greens, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Mexicano Burger",
        "price": "440 TL",
        "desc": "130 gr. beef, louisiana sauce, greens, pickles, caramelized onions, jalapeno peppers, roasted red peppers, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Let&#39;s Eat Burgers",
        "price": "440 TL",
        "desc": "130 gr. beef, greens, caramelized onions, pickles, mushrooms, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Steak Burger",
        "price": "550 TL",
        "desc": "220 gr. beef, double cheddar cheese, caramelized onions",
        "category": "Burgerler"
      },
      {
        "name": "Lokum Burger",
        "price": "555 TL",
        "desc": "120 gr. beef tenderloin, caramelized onion, pickles, greens, cheddar cheese",
        "category": "Burgerler"
      },
      {
        "name": "Dublex Burger",
        "price": "530 TL",
        "desc": "180 gr. beef, double smoked, double cheddar cheese, caramelized onion",
        "category": "Burgerler"
      },
      {
        "name": "Triplex Burger",
        "price": "675 TL",
        "desc": "270 gr. beef, 3 layers of cheddar cheese, caramelized onions",
        "category": "Burgerler"
      },
      {
        "name": "Legendary Chicken Burger",
        "price": "330 TL",
        "desc": "130 gr. chicken meat, mayonnaise, pickles, greens",
        "category": "Tavuk Burgerler"
      },
      {
        "name": "Potato Bomb",
        "price": "160 TL",
        "desc": "French fries, mushrooms, 2 onion rings, caramelized onions, cheddar sauce, barbecue sauce",
        "category": "Bowls"
      },
      {
        "name": "Nugget Bomb",
        "price": "185 TL",
        "desc": "French fries, 4 chicken nuggets, caramelized onions, mushrooms, parsley, cheddar sauce, barbecue sauce",
        "category": "Bowls"
      },
      {
        "name": "Chips",
        "price": "120 TL",
        "desc": "French fries (200 gr.)",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Fried Potatoes",
        "price": "160 TL",
        "desc": "Fried potatoes (300 gr.)",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "6 Onion Rings",
        "price": "115 TL",
        "desc": "6 adet soğan halkası (90 gr.)",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "9 Onion Rings",
        "price": "135 TL",
        "desc": "9 onion rings (135 g)",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "12 Onion Rings",
        "price": "150 TL",
        "desc": "12 onion rings (180 g)",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "4 Pack Crispy Cheese",
        "price": "135 TL",
        "desc": "4 pieces of crispy cheese",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "6 Pack Crispy Cheese",
        "price": "170 TL",
        "desc": "6 pieces of crispy cheese",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "4 Nuggets",
        "price": "120 TL",
        "desc": "4 nuggets",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "6 Nuggets",
        "price": "140 TL",
        "desc": "6 nuggets",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "4'lü Ispanak Topu",
        "price": "130 TL",
        "desc": "(96 gr.) 4 adet olarak servis edilir.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Ortaya Çıtır",
        "price": "290 TL",
        "desc": "2'li çıtır peynir, 2'li soğan halkası, 2'li ispanak topu, 2'li acı patates topu, 2'li Mac'n'cheese topu, 200 gr. patates kızartması",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "4'lü Acı Patates Topu",
        "price": "130 TL",
        "desc": "(80 gr.) 4 adet olarak servis edilir.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "4'lü Mac & Cheese Topu",
        "price": "140 TL",
        "desc": "(96 gr.) 4 adet olarak servis edilir.",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Chocolate Churros",
        "price": "125 TL",
        "desc": "Chocolate",
        "category": "Tatlılar"
      },
      {
        "name": "Pistachio Cups",
        "price": "95 TL",
        "desc": "Pistachio",
        "category": "Tatlılar"
      },
      {
        "name": "Chocolate Cups",
        "price": "95 TL",
        "desc": "Chocolate",
        "category": "Tatlılar"
      },
      {
        "name": "Lotus Cups",
        "price": "95 TL",
        "desc": "Lotus",
        "category": "Tatlılar"
      },
      {
        "name": "Sütaş Ayran (28 cl.)",
        "price": "80 TL",
        "desc": "Pet bottle",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Zero (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Sprite Cool Mint (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Peach (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Mango & Pineapple (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Lemon (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Cappy Mixed (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Cappy Peach (33 cl.)",
        "price": "95 TL",
        "desc": "Canned drinks",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola (1 L.)",
        "price": "140 TL",
        "desc": "PET bottle",
        "category": "İçecekler"
      },
      {
        "name": "Coca Cola Zero (1 L.)",
        "price": "140 TL",
        "desc": "PET bottle",
        "category": "İçecekler"
      },
      {
        "name": "Damla Water (50 cl.)",
        "price": "35 TL",
        "desc": "Pet bottle",
        "category": "İçecekler"
      },
      {
        "name": "Damla Soda (20 cl.)",
        "price": "70 TL",
        "desc": "Glass bottle",
        "category": "İçecekler"
      },
      {
        "name": "Lemon Drop Soda (20 cl.)",
        "price": "70 TL",
        "desc": "Glass bottle",
        "category": "İçecekler"
      },
      {
        "name": "Ketchup",
        "price": "15 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Mayonnaise",
        "price": "15 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "BBQ Sauce",
        "price": "15 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Mustard Sauce",
        "price": "15 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Sriracha Sauce",
        "price": "15 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Ranch Sauce",
        "price": "20 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Sweet Chili Sosu",
        "price": "20 TL",
        "desc": "Paketli ürün",
        "category": "Soslar"
      },
      {
        "name": "Buffalo Sauce",
        "price": "20 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Honey Mustard",
        "price": "20 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Garlic Mayonnaise",
        "price": "20 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Roasted Pepper Mayonnaise",
        "price": "20 TL",
        "desc": "It is served in packaged form.",
        "category": "Soslar"
      },
      {
        "name": "Cheddar Sauce",
        "price": "50 TL",
        "desc": "It is served individually.",
        "category": "Soslar"
      }
    ]
  },
  "7199": {
    "name": "Menemen Beşiktaş",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/f02k/menemen",
    "sourceName": "Yemeksepeti Menemen Beşiktaş canlı menüsü (Sinanpaşa–Şair Veysi No:31/A şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Breakfast Plate (for 2 people)",
        "price": "1.795 TL",
        "desc": "Black olives, green olives, white cheese, Kars kashar cheese, Çamlıdağ string cheese, honey, clotted cream, Nutella, pickled peppers, 2 types of jam of the day, acuka, pastrami or kavurma, scrambled eggs",
        "category": "Breakfast items"
      },
      {
        "name": "Cheese Plate",
        "price": "555 TL",
        "desc": "Special Edirne white cheese, Kars Boğatepe Dairy kashar cheese, Kars Boğatepe Dairy aged kashar cheese, Çamlıdağ string cheese",
        "category": "Breakfast items"
      },
      {
        "name": "Cold Cuts Platter",
        "price": "295 TL",
        "desc": "Tomato, cucumber, green pepper, parsley, olive oil",
        "category": "Breakfast items"
      },
      {
        "name": "Fried Sausage Platter",
        "price": "695 TL",
        "desc": "Tokat bez sucuk. With olives, white cheese, pickles, and bread.",
        "category": "Breakfast items"
      },
      {
        "name": "Dessert Plate",
        "price": "495 TL",
        "desc": "Hazelnut paste with hazelnut pieces, Nutella, honey, clotted cream, 2 types of jam",
        "category": "Breakfast items"
      },
      {
        "name": "Cheese Eggs",
        "price": "595 TL",
        "desc": "Prepared with special Edirne white cheese and parmesan. Served with olives, white cheese, and pickles.",
        "category": "Eggs"
      },
      {
        "name": "Eggs with Sausage",
        "price": "695 TL",
        "desc": "Tokat bez sucuk, olives, white cheese, pickles",
        "category": "Eggs"
      },
      {
        "name": "Fried Eggs",
        "price": "695 TL",
        "desc": "With olives, white cheese, pickles",
        "category": "Eggs"
      },
      {
        "name": "Eggs with Bacon",
        "price": "795 TL",
        "desc": "With pastrami, village eggs, olives, cheese, and pickles",
        "category": "Eggs"
      },
      {
        "name": "Classic Jackal Menemen",
        "price": "595 TL",
        "desc": "Special white cheese, Katırlı village black olives, pickles, milk jam, bread",
        "category": "Menemen"
      },
      {
        "name": "Menemen with Sausage and Cakal",
        "price": "695 TL",
        "desc": "Tokat bez sucuk, Edirne white cheese, black olives, pickles, milk jam, bread",
        "category": "Menemen"
      },
      {
        "name": "Menemen with Kavurma and Cakal",
        "price": "695 TL",
        "desc": "Samsun Kavurma. White cheese, black olives, pickles, milk jam, bread",
        "category": "Menemen"
      },
      {
        "name": "Pastrami and Cakalli Menemen",
        "price": "755 TL",
        "desc": "Prepared with Kastamonu Tabakoğlu pastrami. Served with white cheese, olives, pickles, milk jam, and bread.",
        "category": "Menemen"
      },
      {
        "name": "Cheese Toast",
        "price": "455 TL",
        "desc": "With pickles and olives",
        "category": "Toasts"
      },
      {
        "name": "Sucuk and Cheese Toast",
        "price": "595 TL",
        "desc": "With Tokat sausage, pickles, black olives",
        "category": "Toasts"
      },
      {
        "name": "Roasted Meat and Cheese Toast",
        "price": "595 TL",
        "desc": "With pickles and black olives",
        "category": "Toasts"
      },
      {
        "name": "White Cheese and Tomato Toast",
        "price": "455 TL",
        "desc": "White cheese, tomatoes, pickles, olives",
        "category": "Toasts"
      },
      {
        "name": "Edirne White Cheese",
        "price": "225 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Kars Aged Kashar",
        "price": "225 TL",
        "desc": "It is served in pieces.",
        "category": "By-products"
      },
      {
        "name": "Kars Kashar Cheese",
        "price": "225 TL",
        "desc": "It is served as a package.",
        "category": "By-products"
      },
      {
        "name": "Boğatepe Kars Honey",
        "price": "225 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Butter",
        "price": "195 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Ayvalık Green Olives",
        "price": "195 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Katırlıköyü Black Olives",
        "price": "195 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Milk Jam",
        "price": "175 TL",
        "desc": "It is served in pieces.",
        "category": "By-products"
      },
      {
        "name": "Acuka",
        "price": "155 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Sour Cherry Jam",
        "price": "175 TL",
        "desc": "Single",
        "category": "By-products"
      },
      {
        "name": "Cream",
        "price": "175 TL",
        "desc": "1 person",
        "category": "By-products"
      },
      {
        "name": "Homemade Hazelnut Paste",
        "price": "225 TL",
        "desc": "Homemade",
        "category": "By-products"
      },
      {
        "name": "Arslan Ayran (30 cl.)",
        "price": "95 TL",
        "desc": "Large size",
        "category": "Drinks"
      },
      {
        "name": "Coca-Cola (33 cl.)",
        "price": "120 TL",
        "desc": "Canned drinks",
        "category": "Drinks"
      },
      {
        "name": "Sprite (33 cl.)",
        "price": "120 TL",
        "desc": "Canned drinks",
        "category": "Drinks"
      },
      {
        "name": "Fuse Tea (33 cl.)",
        "price": "120 TL",
        "desc": "Canned drinks",
        "category": "Drinks"
      },
      {
        "name": "Fanta (33 cl.)",
        "price": "120 TL",
        "desc": "Canned drinks",
        "category": "Drinks"
      },
      {
        "name": "Soda (20 cl.)",
        "price": "95 TL",
        "desc": "glass bottle",
        "category": "Drinks"
      },
      {
        "name": "Freshly Squeezed Orange Juice",
        "price": "255 TL",
        "desc": "It is served cold.",
        "category": "Drinks"
      },
      {
        "name": "Water (33 cl.)",
        "price": "75 TL",
        "desc": "glass bottle",
        "category": "Drinks"
      }
    ]
  },
  "7200": {
    "name": "Rome Food & Coffee",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/vgup/rome-food-and-coffee",
    "sourceName": "Yemeksepeti Rome Food & Coffee canlı menüsü (Beylikdüzü Barış Mah. Samsun Cd. 14/5 şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Rome Burger",
        "price": "560 TL",
        "desc": "140 gr. burger köftesi, burger sos, cheddar peyniri, karamelize soğan. Patates kızartması ile",
        "category": "Burgerler"
      },
      {
        "name": "Trüf Burger",
        "price": "590 TL",
        "desc": "140 gr. burger köftesi, trüflü burger sos, cheddar peyniri, karamelize soğan. Patates kızartması ile",
        "category": "Burgerler"
      },
      {
        "name": "Rosario Burger",
        "price": "590 TL",
        "desc": "140 gr. burger köftesi, acılı Meksika sos, karamelize soğan, pastırma, cheddar peyniri. Patates kızartması ile",
        "category": "Burgerler"
      },
      {
        "name": "Chicken Burger",
        "price": "520 TL",
        "desc": "Çıtır tavuk, yeşillik, burger sos, cheddar peyniri, patates kızartması ile",
        "category": "Burgerler"
      },
      {
        "name": "Hot Korean Chicken Burger",
        "price": "520 TL",
        "desc": "Acılı çıtır tavuk, coleslaw, burger sos, cheddar peyniri, patates kızartması ile",
        "category": "Burgerler"
      },
      {
        "name": "BBQ Burger",
        "price": "590 TL",
        "desc": "140 gram lezzetli burger köftesi barbekü soslu karamelize soğan cheddar peyniri dana jambon ve patates ile hazırlanan enfes bir burger",
        "category": "Burgerler"
      },
      {
        "name": "Tavuklu Wrap",
        "price": "480 TL",
        "desc": "Yumuşak tortilla içinde ızgara tavuk eti taze sebzeler ve lezzetli soslarla hazırlanan pratik ve doyurucu bir wrap seçeneği",
        "category": "Wrap"
      },
      {
        "name": "Trüflü Avakadolu Çıtır Wrap",
        "price": "510 TL",
        "desc": "Çıtır wrap içerisinde pane tavuk parçaları taze yeşillik avokado dilimleri trüflü mayonez lezzetli burger peyniri ve yanında kızarmış patates ile hazırlanmıştır",
        "category": "Wrap"
      },
      {
        "name": "Et Wrap",
        "price": "580 TL",
        "desc": "Yumuşak wrap içerisinde dana antrikot renkli biber karamelize soğan taze mantar ve soya sos ile hazırlanan lezzetli bir kombinasyon. Krema ile zenginleştirilmiş ve yanında çıtır patates servis edilir.",
        "category": "Wrap"
      },
      {
        "name": "Fettuccine Alfredo",
        "price": "450 TL",
        "desc": "Yumuşak fettuccine pastaları zengin krema sosu ve taze parmesan peyniri ile kaplanmış tavuk parçaları eşliğinde sunulur Geleneksel İtalyan lezzeti ile hazırlanmış leziz bir makarna yemeği",
        "category": "Makarnalar"
      },
      {
        "name": "Fettuccine Chicken Al Pesto",
        "price": "450 TL",
        "desc": "Yumuşak fettuccine pastaları kremalı pesto sosu ile kaplanmış taze mantar parçaları ve ızgara tavuk göğsü parçaları üzerine taze parmesan peyniri rendelenerek servis edilir",
        "category": "Makarnalar"
      },
      {
        "name": "Chicken Penne",
        "price": "450 TL",
        "desc": "Yumuşak tavuk parçaları ve taze mantarlarla hazırlanan kremalı sos içinde pişirilen penne makarnası. Üzerine bol parmesan peyniri serpilerek servis edilir.",
        "category": "Makarnalar"
      },
      {
        "name": "Arabiata Penne",
        "price": "450 TL",
        "desc": "Penne makarnası, sarımsaklı domates sosunda pişirilmiş, taze parmesan peyniri ile servis edilir. Klasik İtalyan lezzeti ile hazırlanmış bu yemek, basit fakat nefis bir seçimdir.",
        "category": "Makarnalar"
      },
      {
        "name": "Penne Ala Norme",
        "price": "450 TL",
        "desc": "Taze patlıcan ve kekikli domates sosuyla hazırlanan geleneksel Sicilyan makarnası. Üzerine rendelenmiş parmesan peyniri serpilir ve zeytinyağı ile tamamlanır.",
        "category": "Makarnalar"
      },
      {
        "name": "Köri Soslu Penne",
        "price": "450 TL",
        "desc": "Penne makarnası köri sosunda tavuk parçaları ve taze mantar ile hazırlanmış üzeri parmesan peyniri ile servis edilir",
        "category": "Makarnalar"
      },
      {
        "name": "Hellim Salata",
        "price": "450 TL",
        "desc": "Akdeniz yeşilliği, mısır, kuru domates, cherry domates, fındık parçaları, hardal sos",
        "category": "Salatalar"
      },
      {
        "name": "Çıtır Tavuk Salata",
        "price": "480 TL",
        "desc": "Akdeniz yeşilliği, cherry domates, çıtır tavuk, mısır, salatalık, hardal sos",
        "category": "Salatalar"
      },
      {
        "name": "Sezar Salata",
        "price": "480 TL",
        "desc": "Izgara tavuk, göbek marul yaprakları, kruton ekmek, sezar sos, parmesan sos",
        "category": "Salatalar"
      },
      {
        "name": "Izgara Tavuk Salata",
        "price": "490 TL",
        "desc": "Akdeniz yeşilliği, cherry domates, salatalık, siyah zeytin, ızgara tavuk, zeytinyağlı limonlu sos",
        "category": "Salatalar"
      },
      {
        "name": "Akdeniz Salata",
        "price": "450 TL",
        "desc": "Akdeniz yeşilliği, cherry domates, salatalık, mısır, ceviz, zeytinyağlı sos",
        "category": "Salatalar"
      },
      {
        "name": "Chili Marin",
        "price": "620 TL",
        "desc": "Asya sos ile marine edilmiş tavuk, limon soslu yoğurt, patates kızartması",
        "category": "Ana Yemekler"
      },
      {
        "name": "Köri Soslu Tavuk",
        "price": "600 TL",
        "desc": "Tavuk, mantar, körili krema sos, patates kızartması",
        "category": "Ana Yemekler"
      },
      {
        "name": "Milano Usulü Şinitzel",
        "price": "500 TL",
        "desc": "Kremalı mantar sos, eritilmiş kaşar peyniri, patates kızartması, yeşillik ile",
        "category": "Ana Yemekler"
      },
      {
        "name": "Et Sote",
        "price": "800 TL",
        "desc": "Yumuşak dana antrikot parçaları soğan biber domates ile sotelenip ve pilav ile servis edilir",
        "category": "Ana Yemekler"
      },
      {
        "name": "Kekikli Tavuk Izgara",
        "price": "620 TL",
        "desc": "Marine edilmiş ızgara tavuk, yeşillik, sebze sote ile",
        "category": "Ana Yemekler"
      },
      {
        "name": "Mantar Soslu Tavuk Izgara",
        "price": "620 TL",
        "desc": "Izgara tavuk, kremalı mantar sos, sotelenmiş sebze, pilav ile",
        "category": "Ana Yemekler"
      },
      {
        "name": "Arizona Chicken",
        "price": "620 TL",
        "desc": "Sweet chili sos ile marine edilmiş tavuk, patates kızartması ile",
        "category": "Ana Yemekler"
      },
      {
        "name": "Asya Usulü Et",
        "price": "800 TL",
        "desc": "Dana antrikot parçaları, renkli biber, soğan, asya sos, patates kızartması, ile",
        "category": "Ana Yemekler"
      },
      {
        "name": "Fesleğenli Tavuk",
        "price": "620 TL",
        "desc": "Fesleğenli tavuk parçaları pesto soslu krema ve parmesan peyniri ile hazırlanmış yanında patates",
        "category": "Ana Yemekler"
      },
      {
        "name": "Kaşar Peynirli Tost",
        "price": "350 TL",
        "desc": "Kaşar peyniri",
        "category": "Tostlar"
      },
      {
        "name": "Karışık Tost",
        "price": "375 TL",
        "desc": "Sucuk, kaşar peyniri",
        "category": "Tostlar"
      },
      {
        "name": "Rome Tost",
        "price": "375 TL",
        "desc": "Kaşar peyniri, cheddar peyniri, domates, pesto sosu",
        "category": "Tostlar"
      },
      {
        "name": "Yengen",
        "price": "380 TL",
        "desc": "Lezzetli kaşar peyniri sucuk domates turşu ketçap ve mayonez ile hazırlanan enfes bir tost. Taze malzemelerle yapılan bu tost tam bir tat şöleni sunmaktadır.",
        "category": "Tostlar"
      },
      {
        "name": "Pesto Sandviç",
        "price": "430 TL",
        "desc": "Taze domates dilimler, yumuşak beyaz peynir ve aromalı pesto sosuyla hazırlanan lezzetli sandviç. Çıtır ekmek üzerine servis edilir.",
        "category": "Sandviçler"
      },
      {
        "name": "Kaşar Peynirli Tavuklu Sandviç",
        "price": "460 TL",
        "desc": "Izgara tavuk, kaşar peyniri, domates, göbek marul ve pesto rosso sos ile hazırlanan lezzetli sandviç",
        "category": "Sandviçler"
      },
      {
        "name": "Sezar Sandviç",
        "price": "460 TL",
        "desc": "Çıtır tavuk, taze göbek marul, lezzetli sezar sosu ve parmesan peyniri ile hazırlanan nefis sandviç",
        "category": "Sandviçler"
      },
      {
        "name": "Sigara Böreği",
        "price": "350 TL",
        "desc": "Salatalık, domates ile",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Sosis Tabağı",
        "price": "350 TL",
        "desc": "Patates kızartması, sos",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Combo Tabağı",
        "price": "550 TL",
        "desc": "Sigara böreği, sosis, soğan halkası, çıtır tavuk, peynir çubukları, patates kızartması",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Patates Tabağı",
        "price": "350 TL",
        "desc": "Ketçap, mayonez ile",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Çıtır Tavuk",
        "price": "400 TL",
        "desc": "Patates kızartması, sos ile",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Trüflü Parmesanlı Patates",
        "price": "420 TL",
        "desc": "Taze parmesan, trüf yağı, patates",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Soğan Halkası",
        "price": "350 TL",
        "desc": "Patates kızartması, sos ile",
        "category": "Atıştırmalıklar"
      },
      {
        "name": "Frambuazlı Cheesecake",
        "price": "450 TL",
        "desc": "Dilim olarak servis edilir.",
        "category": "Tatlılar"
      },
      {
        "name": "Rome Roll",
        "price": "600 TL",
        "desc": "Krep, çilek, muz, Belçika çikolatası, muhallebi, toz Antep fıstığı",
        "category": "Tatlılar"
      },
      {
        "name": "Limonlu Cheesecake",
        "price": "450 TL",
        "desc": "Dilim olarak servis edilir.",
        "category": "Tatlılar"
      },
      {
        "name": "Beyaz Çikolatalı Brownie",
        "price": "480 TL",
        "desc": "(Dilim olarak servis edilmektedir.)",
        "category": "Tatlılar"
      },
      {
        "name": "Lotuslu Cheesecake",
        "price": "450 TL",
        "desc": "Dilim olarak servis edilir.",
        "category": "Tatlılar"
      },
      {
        "name": "Çikolatalı Cheesecake",
        "price": "450 TL",
        "desc": "Dilim olarak servis edilir.",
        "category": "Tatlılar"
      },
      {
        "name": "Çikolatalı Mag",
        "price": "520 TL",
        "desc": "Çilek, muz, krep kırığı, Belçika çikolatası",
        "category": "Kupa Tatlılar"
      },
      {
        "name": "Brownie Mug",
        "price": "520 TL",
        "desc": "Yumuşak kek tabakası üzerine kremsi muhallebi ve zengin Belçika çikolatası ile hazırlanan lezzetli bir kupa tatlısı",
        "category": "Kupa Tatlılar"
      },
      {
        "name": "Çilekli Kremalı Mag",
        "price": "450 TL",
        "desc": "Çilek, muhallebi, bisküvi",
        "category": "Kupa Tatlılar"
      },
      {
        "name": "Muzlu Kremalı Mag",
        "price": "450 TL",
        "desc": "Rome muhallebisi, muz, bisküvi",
        "category": "Kupa Tatlılar"
      },
      {
        "name": "Çikolatalı Dondurmalı Mag",
        "price": "470 TL",
        "desc": "Vanilyalı dondurma, Belçika çikolatası, bisküvi, muz, çilek",
        "category": "Kupa Tatlılar"
      },
      {
        "name": "Coca-Cola Zero Sugar (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Coca-Cola (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fanta (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Sprite (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Cappy (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Şeftali (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Limon (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Fuse Tea Mango (33 cl.)",
        "price": "120 TL",
        "desc": "Kutu içecek",
        "category": "İçecekler"
      },
      {
        "name": "Ayran (27 cl.)",
        "price": "90 TL",
        "desc": "Büyük boy",
        "category": "İçecekler"
      },
      {
        "name": "Soda (20 cl.)",
        "price": "70 TL",
        "desc": "Cam şişe",
        "category": "İçecekler"
      },
      {
        "name": "Su (50 cl.)",
        "price": "70 TL",
        "desc": "Cam şişe",
        "category": "İçecekler"
      },
      {
        "name": "Iced Filtre Kahve",
        "price": "180 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Iced Cappuccino",
        "price": "220 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Iced Americano",
        "price": "190 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Iced Latte",
        "price": "220 TL",
        "desc": "Soğuk kahve",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Iced White Mocha",
        "price": "230 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Iced Dark Mocha",
        "price": "230 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Soğuk Kahveler"
      },
      {
        "name": "Berry Hibiscus",
        "price": "220 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Böğürtlenli Limonata",
        "price": "220 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Çilekli Limonata",
        "price": "220 TL",
        "desc": "Soğuk servis edilmektedir.",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Karpuzlu Naneli Limonata",
        "price": "220 TL",
        "desc": "Soğuk servis edilmektedir.",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Cool Lime",
        "price": "220 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Limonata",
        "price": "200 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Orange Mango",
        "price": "220 TL",
        "desc": "Soğuk servis edilmektedir.",
        "category": "Soğuk İçecekler"
      },
      {
        "name": "Muzlu Milkshake",
        "price": "260 TL",
        "desc": "Soğuk servis edilmektedir.",
        "category": "Milkshakes"
      },
      {
        "name": "Vanilyalı Milkshake",
        "price": "260 TL",
        "desc": "Soğuk servis edilir.",
        "category": "Milkshakes"
      },
      {
        "name": "Çikolatalı Milkshake",
        "price": "260 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Milkshakes"
      },
      {
        "name": "Çilekli Milkshake",
        "price": "260 TL",
        "desc": "(Soğuk servis edilir.)",
        "category": "Milkshakes"
      }
    ]
  },
  "7209": {
    "name": "Beşiktaş Dondurmacısı",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/imis/besiktas-dondurmacisi-imis",
    "sourceName": "Yemeksepeti Beşiktaş Dondurmacısı canlı menüsü (Sinanpaşa–Hattat Tahsin No:39/A şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Muzlu Çilekli Çikolatalı Bowl Waffle",
        "price": "445 TL",
        "desc": "Çıtır Belçika waffle üzerine; günlük taze çilek, muz, sütlü & bitter çikolata",
        "category": "Belçika Waffles"
      },
      {
        "name": "Kremalı Belçika Waffle",
        "price": "195 TL",
        "desc": "Orjinal Belçika waffle üzerine; eser kıvamda pudra şekeri, krem şanti",
        "category": "Belçika Waffles"
      },
      {
        "name": "Dondurmalı Karamel Soslu Waffle",
        "price": "325 TL",
        "desc": "Çıtır Belçika waffle üzerine; 1 top dondurma, sos",
        "category": "Belçika Waffles"
      },
      {
        "name": "Çilekli Çikolatalı Waffle",
        "price": "355 TL",
        "desc": "Belçika waffle üzerine; sütlü çikolata veya bitter çikolata, çilek",
        "category": "Belçika Waffles"
      },
      {
        "name": "Mualla (Muzlu Çikolatalı Waffle)",
        "price": "455 TL",
        "desc": "Çıtır Belçika waffle, muz, sütlü çikolata veya bitter çikolata üzerine; beyaz çikolata, fıstıklı çikolata sosu, kızartılmış kırık fıstık parçaları",
        "category": "Belçika Waffles"
      },
      {
        "name": "Muzlu Çilekli Çikolatalı Waffle",
        "price": "445 TL",
        "desc": "Çıtır Belçika waffle üzerine; isteğe göre sütlü veya bitter çikolata, muz, çilek",
        "category": "Belçika Waffles"
      },
      {
        "name": "Çikolatalı Belçika Waffle",
        "price": "250 TL",
        "desc": "Çıtır Belçika waffle üzerine; sütlü veya bitter çikolata",
        "category": "Belçika Waffles"
      },
      {
        "name": "Meyveli & Dondurmalı Waffle",
        "price": "575 TL",
        "desc": "Çıtır Belçika waffle üzerine; sütlü veya bitter çikolata, çilek, muz, seçeceğiniz 1 top dondurma, seçeceğiniz çikolata sosu",
        "category": "Belçika Waffles"
      },
      {
        "name": "2 Top Dondurmalı Meyveli Waffle",
        "price": "655 TL",
        "desc": "Çıtır Belçika waffle üzerine; sütlü veya bitter çikolata, çilek, muz, seçeceğiniz 2 top dondurma, isteğe göre çikolata sosu ile",
        "category": "Belçika Waffles"
      },
      {
        "name": "Bardakta Dondurmalı Meyveli Waffle",
        "price": "495 TL",
        "desc": "Waffle, sütlü veya bitter çikolata, muz, çilek, seçeceğiniz 1 top dondurma",
        "category": "Belçika Waffles"
      },
      {
        "name": "Bardakta Çikolatalı Meyve",
        "price": "475 TL",
        "desc": "Günlük taze çilek, muz, sütlü veya bitter çikolata, Lotus bisküvisi",
        "category": "Belçika Waffles"
      },
      {
        "name": "Bardakta Meyveli Waffle",
        "price": "425 TL",
        "desc": "Waffle, muz, çilek, sütlü veya bitter çikolata",
        "category": "Belçika Waffles"
      },
      {
        "name": "Meyveli & 2 Çikolatalı Bowl Waffle",
        "price": "455 TL",
        "desc": "Çıtır Belçika waffle üzerine; günlük taze çilek, muz, seçeceğiniz 2 çikolata sosu",
        "category": "Belçika Waffles"
      },
      {
        "name": "Meyveli & Dondurmalı Bowl Waffle",
        "price": "525 TL",
        "desc": "Çıtır Belçika waffle üzerine; günlük taze çilek, muz, seçeceğiniz çikolatalar, 1 top dondurma",
        "category": "Belçika Waffles"
      },
      {
        "name": "Meyveli & 3 Çikolatalı Bowl Waffle",
        "price": "465 TL",
        "desc": "Çilek, muz, 3 çikolata seçeneği ile",
        "category": "Belçika Waffles"
      },
      {
        "name": "Tiramisulu Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Bisküvi, kakao, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Mangolu Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Mango meyvesi, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Naneli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Nane, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Karamelli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Karamel, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Limonlu Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "1 top olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Sade Sütlü Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Süt, sahlep. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Antep Fıstıklı Dondurma (1 Top)",
        "price": "195 TL",
        "desc": "Antep Fıstığı, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Muzlu Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Muz, çikolata, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Çilekli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Çilek, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Çikolatalı Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Belçika çikolatası, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Ekşi Böğürtlenli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Ekşi böğürtlen, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Dubai Çikolatalı Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Antep fıstığı, kakao, çikolata, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Oreolu Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Oreo bisküvisi, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Ejder Meyveli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Ejder meyvesi, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Tahinli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Tahin, süt. (Eser miktarda susam içerir.) Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Cheesecakeli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Frambuaz, bisküvi, süt. Kase olarak servis edilir.",
        "category": "Dondurmalar"
      },
      {
        "name": "Tutti Frutti (1 Top)",
        "price": "185 TL",
        "desc": "Karışık meyveler",
        "category": "Dondurmalar"
      },
      {
        "name": "İtalyan Karameli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "İtalyan karameli",
        "category": "Dondurmalar"
      },
      {
        "name": "Hindistan Cevizli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Hindistan cevizi, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Lotus Bisküvili Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Lotus bisküvisi, karamel, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Snickers Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Yer fıstığı, karamel, çikolata parçacıklı",
        "category": "Dondurmalar"
      },
      {
        "name": "Tatlı Böğürtlenli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Tatlı böğürtlen, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Damla Sakızlı Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Damla sakızı, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Nutellalı Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Nutella çikolatası, kakao, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Vişneli Dondurma (1 Top)",
        "price": "185 TL",
        "desc": "Vişne, süt",
        "category": "Dondurmalar"
      },
      {
        "name": "Şeftalili Dondurma (Top)",
        "price": "185 TL",
        "desc": "Şeftalili sorbe",
        "category": "Dondurmalar"
      },
      {
        "name": "Super Crunchy Belçika Patates (Külah)",
        "price": "225 TL",
        "desc": "Parmak dilim",
        "category": "Belçika usülü Patates Kızartması"
      },
      {
        "name": "Super Crunchy Belçika Patatesi (Kutu)",
        "price": "255 TL",
        "desc": "İsteğe göre sos ile",
        "category": "Belçika usülü Patates Kızartması"
      },
      {
        "name": "Karışık Dondurma (500 gr.)",
        "price": "995 TL",
        "desc": "Seçeceğiniz 6 çeşit dondurma ile",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Çikolatalı Dondurma (1 kg.)",
        "price": "1.850 TL",
        "desc": "1 kg. olarak servis edilir.",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Çikolatalı Dondurma (500 gr.)",
        "price": "995 TL",
        "desc": "500 gr. olarak servis edilir.",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Sade Sütlü Dondurma (1 kg.)",
        "price": "1.850 TL",
        "desc": "1 kg. olarak servis edilir.",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Sütlü Sade Dondurma (500 gr.)",
        "price": "995 TL",
        "desc": "500 gr. olarak servis edilir.",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Efsane 6'lı Karışık Dondurma (500 gr.)",
        "price": "1.850 TL",
        "desc": "500 gr. olarak servis edilir.",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Karışık Dondurma (1 kg.)",
        "price": "1.850 TL",
        "desc": "Seçeceğiniz 8 çeşit dondurma",
        "category": "Günlük Dondurmalar"
      },
      {
        "name": "Ev Yapımı Limonata (25 cl.)",
        "price": "80 TL",
        "desc": "Soğuk servis edilir.",
        "category": "İçecekler"
      },
      {
        "name": "Su ( 40 cl.)",
        "price": "45 TL",
        "desc": "Pet şişe",
        "category": "İçecekler"
      },
      {
        "name": "Karışık Taze Sıkma Meyve Suyu (20 cl.)",
        "price": "225 TL",
        "desc": "Portakal, nar, yeşil elma, havuç",
        "category": "İçecekler"
      },
      {
        "name": "Taze Sıkma Portakal Suyu (20 cl.)",
        "price": "200 TL",
        "desc": "Bardak",
        "category": "İçecekler"
      },
      {
        "name": "Taze Sıkma Nar Suyu (20 cl.)",
        "price": "275 TL",
        "desc": "Bardak",
        "category": "İçecekler"
      },
      {
        "name": "Kornet",
        "price": "12 TL",
        "desc": "Adet olarak servis edilir.",
        "category": "Yan ürünler"
      },
      {
        "name": "Kağıt Helva (Küçük)",
        "price": "40 TL",
        "desc": "Adet olarak servis edilir.",
        "category": "Yan ürünler"
      },
      {
        "name": "Kağıt Helva (Orta)",
        "price": "50 TL",
        "desc": "Adet olarak servis edilir.",
        "category": "Yan ürünler"
      },
      {
        "name": "Çikolata Sos (15 gr.)",
        "price": "25 TL",
        "desc": "(Sıcak servis edilir.)",
        "category": "Yan ürünler"
      },
      {
        "name": "Kavrulmuş Yer Fıstığı (15 gr.)",
        "price": "20 TL",
        "desc": "Kavrulmuş kırık yer fıstığı",
        "category": "Yan ürünler"
      }
    ]
  },
  "7212": {
    "name": "Pixie Waffle",
    "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/e9xf/pixie-waffle",
    "sourceName": "Yemeksepeti Pixie Waffle canlı menüsü (Bayrampaşa Vatan Mah. Emek Sok. No:21/A şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Pixie Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, muz, çilek, fındık ve fıstık. Size özel ve taze hazırlanır.",
        "category": "Waffles"
      },
      {
        "name": "Süper Pixie Waffle (Double)",
        "price": "407,91 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, muz, çilek, Frambuaz, Böğürtlen, Yaban Mersini, fındık ve fıstık.",
        "category": "Waffles"
      },
      {
        "name": "Fıstık Rüyası Waffle (Double)",
        "price": "365,49 TL",
        "desc": "Antep fıstığı çikolatası, sütlü & beyaz çikolata, muz, çilek, fındık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Özel Karamel Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Karamel çikolata, sütlü çikolata, muz, çilek, fındık",
        "category": "Waffles"
      },
      {
        "name": "Beyaz Çikolatalı Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Özel Belçika hamuru, özel beyaz çikolata, muz, çilek, fındık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Bitter Çikolatalı Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Özel Belçika hamuru, bitter çikolata, muz, çilek, fındık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Special Waffle (Double)",
        "price": "407,91 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, Antep fıstığı çikolatası, muz, çilek, frambuaz, böğürtlen, yaban mersini, fındık, fıstık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Muzlu Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Özel Belçika waffle hamuru, sütlü çikolata sosu, beyaz çikolata sosu, muz, fındık, fıstık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Çilekli Waffle (Double)",
        "price": "339,91 TL",
        "desc": "Özel Belçika waffle hamuru, sütlü çikolata sosu, beyaz çikolata sosu, çilek, fındık, fıstık",
        "category": "Waffles"
      },
      {
        "name": "Pixie Waffle Bowl (Double)",
        "price": "320,88 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, muz, çilek, fındık, fıstık",
        "category": "Waffle Bowl's"
      },
      {
        "name": "Pixie Special Waffle Bowl (Double)",
        "price": "424,91 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, Antep fıstığı çikolatası, muz, çilek, frambuaz, böğürtlen, yaban mersini, fındık, fıstık",
        "category": "Waffle Bowl's"
      },
      {
        "name": "Pixie Super Waffle Bowl (Double)",
        "price": "416,41 TL",
        "desc": "Beyaz çikolata, sütlü çikolata, muz, çilek, frambuaz, böğürtlen, yaban mersini, fındık, fıstık",
        "category": "Waffle Bowl's"
      }
    ]
  },
  "7223": {
    "name": "GALAKTION",
    "sourceUrl": "https://www.cafegalaktion.com/",
    "sourceName": "GALAKTION resmi canlı menüsü (Asmalı Mescit–Şehbender Sok. şube doğrulaması)",
    "verifiedAt": "2026-08-23",
    "items": [
      {
        "name": "Supkharcho · Beef Soup",
        "price": "410",
        "desc": "Seçenekler mevcut",
        "category": "Soups"
      },
      {
        "name": "Vegetable Soup",
        "price": "320",
        "desc": "Seçenekler mevcut",
        "category": "Soups"
      },
      {
        "name": "Salad Assortment",
        "price": "830",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Pkhali Assortment · Georgian Vegan Appetizers",
        "price": "480",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Eggplant with Walnuts",
        "price": "420",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Glekhuri · Georgian Walnut Salad",
        "price": "430",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Special Salad \"Mary\"",
        "price": "450",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Chicken Salad",
        "price": "400",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Beets with Plum Sauce",
        "price": "375",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Beans Salad",
        "price": "375",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Mushroom Salad",
        "price": "375",
        "desc": "",
        "category": "Salads"
      },
      {
        "name": "Imeruli Khachapuri",
        "price": "725",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Megruli Khachapuri",
        "price": "745",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Lobiani · Georgian Bean-Stuffed Bread",
        "price": "675",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Acharuli Khachapuri",
        "price": "745",
        "desc": "Seçenekler mevcut",
        "category": "Bakery"
      },
      {
        "name": "Penovani · Layered Cheese Bread",
        "price": "520",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Mchadi · Georgian Cornbread",
        "price": "350",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Chvishtari · Cornbread with Cheese",
        "price": "400",
        "desc": "",
        "category": "Bakery"
      },
      {
        "name": "Pancakes · Meat or Cheese",
        "price": "425",
        "desc": "Seçenekler mevcut",
        "category": "Bakery"
      },
      {
        "name": "Khinkali · Beef",
        "price": "150 /pcs",
        "desc": "MIN. 4 PCS",
        "category": "Main Dishes"
      },
      {
        "name": "Khinkali · Cheese",
        "price": "145 /pcs",
        "desc": "MIN. 4 PCS",
        "category": "Main Dishes"
      },
      {
        "name": "Khinkali · Mushroom",
        "price": "145 /pcs",
        "desc": "MIN. 4 PCS",
        "category": "Main Dishes"
      },
      {
        "name": "Fried Khinkali · Beef",
        "price": "155 /pcs",
        "desc": "MIN. 4 PCS",
        "category": "Main Dishes"
      },
      {
        "name": "Fried Khinkali · Cheese",
        "price": "150 /pcs",
        "desc": "MIN. 4 PCS",
        "category": "Main Dishes"
      },
      {
        "name": "Small Khinkali · Beef · 16 Pieces",
        "price": "680",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Small Khinkali · Cheese · 16 Pieces",
        "price": "680",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Small Khinkali · Mixed · 16 Pieces",
        "price": "680",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Lobio · Bean Stew",
        "price": "485",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Lobio with Meat",
        "price": "750",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Ajapsandali · Eggplant Stew",
        "price": "485",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Ajapsandali With Meat",
        "price": "750",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chicken in Plum Sauce",
        "price": "750",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Shkmeruli · Chicken in Garlic Cream Sauce",
        "price": "730",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Baje · Chicken in Walnut Sauce",
        "price": "750",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chakhokhbili · Chicken Stew",
        "price": "730",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chicken with Pomegranate",
        "price": "730",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chicken Livers with Pomegranate",
        "price": "550",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chashushuli · Beef Stew",
        "price": "825",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Kharcho · Beef Stew with Walnuts",
        "price": "825",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Chef's Special \"Galaktion\"",
        "price": "850",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Fish in Walnut Sauce",
        "price": "800",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Fish in Plum Sauce",
        "price": "800",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Fish in Vinegar and Coriander Sauce",
        "price": "800",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Borano · Melted Cheese",
        "price": "475",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Georgian Kebab",
        "price": "800",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Stuffed Mushrooms with Cheese",
        "price": "475",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Ojakhuri with Beef · Georgian-style potatoes and onions",
        "price": "800",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Ojakhuri with Mushrooms · Georgian-style potatoes and onions",
        "price": "650",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "Ojakhuri with Chicken · Georgian-style potatoes and onions",
        "price": "730",
        "desc": "",
        "category": "Main Dishes"
      },
      {
        "name": "French Fries",
        "price": "400",
        "desc": "",
        "category": "Appetizer"
      },
      {
        "name": "Pickles",
        "price": "385",
        "desc": "",
        "category": "Appetizer"
      },
      {
        "name": "Georgian Cheese Assortment",
        "price": "625",
        "desc": "",
        "category": "Appetizer"
      },
      {
        "name": "Ajika",
        "price": "95",
        "desc": "",
        "category": "Sauces"
      },
      {
        "name": "Satsebeli · Georgian Tomato Sauce",
        "price": "95",
        "desc": "",
        "category": "Sauces"
      },
      {
        "name": "Tkemali",
        "price": "95",
        "desc": "",
        "category": "Sauces"
      },
      {
        "name": "Sour Cream",
        "price": "85",
        "desc": "",
        "category": "Sauces"
      },
      {
        "name": "Sour Cream with Garlic",
        "price": "95",
        "desc": "",
        "category": "Sauces"
      },
      {
        "name": "Turkish Coffee",
        "price": "195",
        "desc": "",
        "category": "Hot Drinks"
      },
      {
        "name": "Coffee from Batumi",
        "price": "195",
        "desc": "",
        "category": "Hot Drinks"
      },
      {
        "name": "Espresso",
        "price": "200",
        "desc": "",
        "category": "Hot Drinks"
      },
      {
        "name": "Americano",
        "price": "220",
        "desc": "",
        "category": "Hot Drinks"
      },
      {
        "name": "Tea",
        "price": "75",
        "desc": "",
        "category": "Hot Drinks"
      },
      {
        "name": "Georgian Lemonade · 330 ml",
        "price": "220",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Nabeghlavi · Georgian Mineral Water · 500 ml",
        "price": "240",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Fruit Juice",
        "price": "180",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Coca-Cola",
        "price": "140",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Ayran",
        "price": "140",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Water · 330 ml",
        "price": "95",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Water · 750 ml",
        "price": "170",
        "desc": "",
        "category": "Cold Drinks"
      },
      {
        "name": "Brandy",
        "price": "3.250",
        "desc": "Seçenekler mevcut",
        "category": "Cognac & Vodka"
      },
      {
        "name": "Georgian Vodka",
        "price": "1.250",
        "desc": "Seçenekler mevcut",
        "category": "Cognac & Vodka"
      },
      {
        "name": "Khvanchkara · Semi-sweet",
        "price": "3.550",
        "desc": "",
        "category": "Red Wines"
      },
      {
        "name": "Kindzmarauli · Semi-sweet",
        "price": "3.000",
        "desc": "",
        "category": "Red Wines"
      },
      {
        "name": "Alazani Valley · Semi-sweet",
        "price": "2.750",
        "desc": "Seçenekler mevcut",
        "category": "Red Wines"
      },
      {
        "name": "Saperavi · Dry",
        "price": "2.800",
        "desc": "Seçenekler mevcut",
        "category": "Red Wines"
      },
      {
        "name": "Mukuzani · Dry",
        "price": "3.000",
        "desc": "",
        "category": "Red Wines"
      },
      {
        "name": "House Selection · Dry",
        "price": "1.800",
        "desc": "Seçenekler mevcut",
        "category": "Red Wines"
      },
      {
        "name": "House Selection · Semi-sweet",
        "price": "1.800",
        "desc": "Seçenekler mevcut",
        "category": "Red Wines"
      },
      {
        "name": "Kisi Qvevri · Dry",
        "price": "3.250",
        "desc": "",
        "category": "White Wines"
      },
      {
        "name": "Kakhuri · Dry",
        "price": "2.750",
        "desc": "Seçenekler mevcut",
        "category": "White Wines"
      },
      {
        "name": "Tsinandali · Dry",
        "price": "3.000",
        "desc": "",
        "category": "White Wines"
      },
      {
        "name": "Rkatsiteli · Dry",
        "price": "2.750",
        "desc": "Seçenekler mevcut",
        "category": "White Wines"
      },
      {
        "name": "Alazani Valley · Semi-sweet",
        "price": "2.750",
        "desc": "Seçenekler mevcut",
        "category": "White Wines"
      },
      {
        "name": "Ranina Rose · Semi-sweet",
        "price": "2.750",
        "desc": "Seçenekler mevcut",
        "category": "White Wines"
      },
      {
        "name": "House Selection · Dry",
        "price": "1.800",
        "desc": "Seçenekler mevcut",
        "category": "White Wines"
      },
      {
        "name": "Amsterdam · 500 ml",
        "price": "400",
        "desc": "",
        "category": "Beers"
      },
      {
        "name": "Beck's · 500 ml",
        "price": "375",
        "desc": "",
        "category": "Beers"
      },
      {
        "name": "Bomonti · 500 ml",
        "price": "375",
        "desc": "",
        "category": "Beers"
      },
      {
        "name": "Efes · 500 ml",
        "price": "350",
        "desc": "",
        "category": "Beers"
      },
      {
        "name": "Napoleon",
        "price": "420",
        "desc": "",
        "category": "Desserts"
      },
      {
        "name": "Frida",
        "price": "385",
        "desc": "",
        "category": "Desserts"
      },
      {
        "name": "Medovik",
        "price": "380",
        "desc": "",
        "category": "Desserts"
      },
      {
        "name": "Ponchik",
        "price": "300",
        "desc": "",
        "category": "Desserts"
      }
    ]
  },
  "7224": {
  "name": "Olta Balık Evi",
  "sourceUrl": "https://oltabalik.co/",
  "sourceName": "Olta Balık Restaurant resmi menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Izgara halili",
      "price": "1.600,00 TL",
      "desc": "Akdeniz sularının en lezzetli balıklarından biri olan Halili'nin, hafif zeytinyağı ve yöresel otlarla marine edilip ızgara ateşinde dışı çıtır, içi sulu kalacak şekilde \r\npişirildiği spesiyalimiz.\r\nYaklaşık 1000-1300  kalori içerir",
      "category": "Balıklar"
    },
    {
      "name": "Karavida",
      "price": "3.000,00 TL",
      "desc": "",
      "category": "Spesiyaller"
    },
    {
      "name": "Deniz ürünlü spagetti",
      "price": "800,00 TL",
      "desc": "Taze karides, kalamar ve midye gibi deniz ürünlerinin şefin özel domates sosu ve taze baharatlarla spagettiyle buluştuğu, deniz kokulu bir İtalyan klasiği.",
      "category": "Deniz Ürünleri Tabakları"
    },
    {
      "name": "Ahtapot + Somon Şiş",
      "price": "1.200,00 TL",
      "desc": "Izgarada tütsülenerek yumuşacık kıvama getirilmiş enfes ahtapot kolu ile lokum gibi somon şişin tek tabakta buluştuğu, deniz ürünleri tutkunlarına özel premium bir ziyafet.",
      "category": "Deniz Ürünleri Tabakları"
    },
    {
      "name": "Somon Şiş + Izgara Mantar",
      "price": "600,00 TL",
      "desc": "Özel sosla marine edilip şişte kızartılmış ağızda dağılan yağlı somon küplerinin, suyunu içine hapsetmiş taze ızgara mantarlarla harmanlandığı oldukça sağlıklı ve doyurucu bir ikili.",
      "category": "Deniz Ürünleri Tabakları"
    },
    {
      "name": "Seafood tabağı",
      "price": "1.500,00 TL",
      "desc": "Ahtapot bacağı , karides şiş , baby kalamar , levrek simit",
      "category": "Deniz Ürünleri Tabakları"
    },
    {
      "name": "Lakerda",
      "price": "500,00 TL",
      "desc": "Torik balığından yapılmaktadır 3 gün boyunca buzlu suda bekletip kanı iyice akıtılıp sonrasında 14 gün tuzda bekletilip sonrasında tekrar 3 gün boyunca buzlu suda hergün değişirerek fazla tuzu akıtılır ve servise hazırdır. Sunum olarak mor soğan üzerine dilimlenerek zeytinyağ ve limon suyu gezdirilerek yemeye hazır hale getirilir. Afiyet olsun",
      "category": "Mezeler"
    },
    {
      "name": "Levrek",
      "price": "650,00 TL",
      "desc": "Denizlerin en sevilen lezzetlerinden biri olan levrek, az kılçıklı yapısı ve lokum gibi dağılan hafif beyaz etiyle hem ızgarada hem de fırında eşsiz bir tat sunar.\r\nYaklaşık 300-350  Kalori içerir",
      "category": "Balıklar"
    },
    {
      "name": "Ahtapot Kol",
      "price": "200,00 TL",
      "desc": "Fiyat Aralığı: 200 - 800 TL",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Roka salata",
      "price": "200,00 TL",
      "desc": "Taze roka yaprakları, sızma zeytinyağı ve limon sosuyla harmanlanmış, balıkların yanına çok yakışan hafif bir lezzet.",
      "category": "Salatalar"
    },
    {
      "name": "Tahin teratör",
      "price": "200,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Sarı Zeybek Üçmeşe 20 cl",
      "price": "1.350,00 TL",
      "desc": "Üç farklı meşe fıçıda dinlendirilmiş, yumuşak içimli premium Türk rakısı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Çipura",
      "price": "600,00 TL",
      "desc": "Kendine has aroması, sulu ve sıkı et yapısıyla deniz ürünleri sevenlerin vazgeçilmezi olan çipura, ızgara ateşinde piştiğinde lezzetini zirveye taşır.\r\nYaklaşık 290-390 kalori içerir",
      "category": "Balıklar"
    },
    {
      "name": "Mütebbel",
      "price": "200,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Peynirli Roka salata",
      "price": "250,00 TL",
      "desc": "Taze roka yapraklarının üzerine serpiştirilmiş lezzetli beyaz peynir parçaları ve özel zeytinyağlı sos ile zenginleştirilmiş bir başlangıç.",
      "category": "Salatalar"
    },
    {
      "name": "Sarı Zeybek Üçmeşe 35 cl",
      "price": "1.950,00 TL",
      "desc": "Üç farklı meşe fıçıda dinlendirilmiş, yumuşak içimli premium Türk rakısı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Çıtır Balık",
      "price": "500,00 TL",
      "desc": "Özenle fileto edilmiş taze balık parçalarının özel bir harçla kaplanarak altın sarısı olana dek kızartıldığı, dışı çıtır çıtır, içi ise yumuşacık ve pratik bir lezzet.",
      "category": "Balıklar"
    },
    {
      "name": "Ahtapot Güveç",
      "price": "1.000,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Köz patlıcan",
      "price": "200,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Çoban salata",
      "price": "0,00 TL",
      "desc": "İnce doğranmış domates, salatalık, biber, soğan ve maydanozun zeytinyağı ve taze sıkılmış limonla buluştuğu geleneksel bir klasik.",
      "category": "Salatalar"
    },
    {
      "name": "Sarı Zeybek Üçmeşe 50 cl",
      "price": "2.500,00 TL",
      "desc": "Üç farklı meşe fıçıda dinlendirilmiş, yumuşak içimli premium Türk rakısı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Barbun",
      "price": "900,00 TL",
      "desc": "Denizlerin kırmızı incisi olarak bilinen barbun, hafif tatlımsı ve kendine has yoğun aromasıyla özellikle tavada çıtır çıtır pişirildiğinde damak çatlatır. (Fiyat belirtilmemiş)",
      "category": "Balıklar"
    },
    {
      "name": "Kuşkonmaz",
      "price": "300,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Ege karması",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Balık salata",
      "price": "200,00 TL",
      "desc": "Mevsim yeşillikleri üzerine eklenmiş taze haşlanmış veya ızgara balık parçalarıyla hazırlanan, hem hafif hem de oldukça doyurucu bir alternatif.",
      "category": "Salatalar"
    },
    {
      "name": "Sarı Zeybek Üçmeşe 70 cl",
      "price": "3.000,00 TL",
      "desc": "Üç farklı meşe fıçıda dinlendirilmiş, yumuşak içimli premium Türk rakısı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Çinekop",
      "price": "550,00 TL",
      "desc": "Lüfer ailesinin en lezzetli üyelerinden biri olan çinekop, yağlı yapısı ve karakteristik deniz kokusuyla ızgara ateşinde veya tavada mükemmel bir ziyafet sunar. (Fiyat belirtilmemiş)",
      "category": "Balıklar"
    },
    {
      "name": "Karides Güveç",
      "price": "750,00 TL",
      "desc": "330-550 kalori içerir.\r\nİçerisinde tereyağ  sarımsak mantar kuru domates ve toz biber tuz içerir.",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Meyhani",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Mevsim salata",
      "price": "200,00 TL",
      "desc": "Mevsimin en taze yeşillikleri, havuç, kırmızı lahana ve zeytinyağlı özel sosuyla hazırlanan renkli ve vitamin deposu bir salata.",
      "category": "Salatalar"
    },
    {
      "name": "Beylerbeyi Göbek 20 cl",
      "price": "1.300,00 TL",
      "desc": "Sadece anasonun göbek kısmından üç kez damıtılarak üretilen, şeker ilavesiz premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Sardalya",
      "price": "400,00 TL",
      "desc": "Besin değeri oldukça yüksek, tam bir Omega-3 deposu olan sardalya; kendine has doyurucu yağı ve eşsiz lezzetiyle özellikle mevsiminde ızgaranın yıldızıdır.",
      "category": "Balıklar"
    },
    {
      "name": "Köylü Patatesi",
      "price": "200,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Avakado mezesi",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Yeşil salata",
      "price": "200,00 TL",
      "desc": "Çeşitli taze yeşilliklerin sadece sızma zeytinyağı ve limonla tatlandırıldığı, ana yemekleri dengeleyen en doğal ve sade seçenek.",
      "category": "Salatalar"
    },
    {
      "name": "Beylerbeyi Göbek 35 cl",
      "price": "1.900,00 TL",
      "desc": "Sadece anasonun göbek kısmından üç kez damıtılarak üretilen, şeker ilavesiz premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Dil Balığı",
      "price": "650,00 TL",
      "desc": "Kılçıksız ve yassı yapısıyla yemesi en kolay balıklardan biri olan dil balığı, tereyağlı tavada hafifçe pişirildiğinde ortaya çıkan ipeksi dokusuyla öne çıkar. (Fiyat belirtilmemiş)",
      "category": "Balıklar"
    },
    {
      "name": "Karides Şiş",
      "price": "200,00 TL",
      "desc": "Fiyat Aralığı: 180 - 200 TL",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Pancar",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Gavurdağı salata",
      "price": "250,00 TL",
      "desc": "İnce kıyım domates, soğan ve bol cevizin nar ekşisiyle harmanlandığı, kaşıkla yenen zengin aromalı nefis bir yöresel lezzet.",
      "category": "Salatalar"
    },
    {
      "name": "Beylerbeyi Göbek 50 cl",
      "price": "2.400,00 TL",
      "desc": "Sadece anasonun göbek kısmından üç kez damıtılarak üretilen, şeker ilavesiz premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Mezgit",
      "price": "650,00 TL",
      "desc": "Pamuk gibi yumuşak beyaz eti ve son derece hafif tadıyla deniz ürünlerine yeni başlayanların bile severek tükettiği, mısır unuyla tavası meşhur narin bir lezzet.",
      "category": "Balıklar"
    },
    {
      "name": "Baby Kalamar",
      "price": "150,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Deniz börülcesi",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Kaşık salata",
      "price": "200,00 TL",
      "desc": "Domates, salatalık, biber ve soğanın suyu içinde kalacak şekilde çok ince doğranarak nar ekşisi ve zeytinyağı ile servis edildiği ferahlatıcı bir tat.",
      "category": "Salatalar"
    },
    {
      "name": "Beylerbeyi Göbek 70 cl",
      "price": "2.900,00 TL",
      "desc": "Sadece anasonun göbek kısmından üç kez damıtılarak üretilen, şeker ilavesiz premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "KG Levrek",
      "price": "1.600,00 TL",
      "desc": "Kalabalık masalar ve aile yemekleri için ideal olan, bütün olarak özenle pişirilen ve kiloyla servis edilen gösterişli, doyurucu ve büyük boy deniz levreği.",
      "category": "Balıklar"
    },
    {
      "name": "Kalamar Tava",
      "price": "700,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Kaya koruğu",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Rokalı çoban salata",
      "price": "0,00 TL",
      "desc": "Klasik çoban salatası malzemelerinin, ince kıyılmış taze roka yapraklarıyla zenginleştirilmiş çok daha aromatik ve iştah açıcı hali.",
      "category": "Salatalar"
    },
    {
      "name": "Efe Gold 20 cl",
      "price": "1.250,00 TL",
      "desc": "Meşe fıçılarda dinlendirilmiş, altın sarısı rengi ve özgün aromasıyla premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "KG Halili",
      "price": "1.600,00 TL",
      "desc": "Yöresel suların en doyurucu lezzetlerinden biri olan Halili balığı, bereketli porsiyonuyla kalabalık sofralara hitap eden, kiloyla sunulan özel bir seçenektir.",
      "category": "Balıklar"
    },
    {
      "name": "Kalamar Dolma",
      "price": "100,00 TL",
      "desc": "Fiyat Aralığı: 100 - 150 TL",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Kabak şayan",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Rokalı mevsim salata",
      "price": "250,00 TL",
      "desc": "Taze mevsim sebzelerinin karakteristik roka tadıyla harmanlanarak daha keskin bir lezzet profiline ulaştığı ferah bir tabak.",
      "category": "Salatalar"
    },
    {
      "name": "Efe Gold 35 cl",
      "price": "1.750,00 TL",
      "desc": "Meşe fıçılarda dinlendirilmiş, altın sarısı rengi ve özgün aromasıyla premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Lagos",
      "price": "2.000,00 TL",
      "desc": "Denizlerin en değerli ve prestijli balıklarından biri kabul edilen Lagos, iri yapısı, kılçıksız beyaz eti ve ister şiş ister ızgara olsun sunduğu muazzam lezzet şöleniyle başroldedir. (Fiyat Aralığı: 2000 - 2200 TL)",
      "category": "Balıklar"
    },
    {
      "name": "Kalamar Izgara",
      "price": "200,00 TL",
      "desc": "Fiyat Aralığı: 200 - 800 TL",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Semizotlu kuru cacık",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Mozarella peynirli Domates  söğüş",
      "price": "250,00 TL",
      "desc": "İri doğranmış, kabukları soyulmuş taze taze domates ve salatalıkların en yalın haliyle, yanında biraz tuz ve zeytinyağı ile sunumu.",
      "category": "Salatalar"
    },
    {
      "name": "Efe Gold 50 cl",
      "price": "2.250,00 TL",
      "desc": "Meşe fıçılarda dinlendirilmiş, altın sarısı rengi ve özgün aromasıyla premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Izgara Mantar",
      "price": "400,00 TL",
      "desc": "",
      "category": "Ara sıcaklar"
    },
    {
      "name": "Ahtapot carpaccıo",
      "price": "400,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Marul salata",
      "price": "200,00 TL",
      "desc": "Çıtır marul yapraklarının zeytinyağı, limon ve ince kıyım yeşil soğanla buluştuğu çıtır çıtır ve hafif bir klasik.",
      "category": "Salatalar"
    },
    {
      "name": "Efe Gold 70 cl",
      "price": "2.750,00 TL",
      "desc": "Meşe fıçılarda dinlendirilmiş, altın sarısı rengi ve özgün aromasıyla premium rakı.",
      "category": "Alkollü İçecekler"
    },
    {
      "name": "Levrek marin",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Karides söğüş",
      "price": "500,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Mantarlı adalı",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "4 peynirli Girit mezesi",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Acılı atom",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Yoğurtlu kereviz",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Fava",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Zeytinyağlı enginar",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Köpoğlu",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Brokoli karnıbahar",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Ezine peyniri",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "Tulum peyniri",
      "price": "250,00 TL",
      "desc": "",
      "category": "Mezeler"
    }
  ]
}
,
  "7225": {
  "name": "Söz Berlin Döner",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/svol/soz-berlin-doner",
  "sourceName": "Yemeksepeti canlı Söz Berlin Döner menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Alman Usulü Tavuk Döner (100 gr.)",
      "price": "300 TL",
      "desc": "Ekmek ya da lavaş arasına; tavuk döner, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Dönerler"
    },
    {
      "name": "Alman Usulü Tavuk Döner (120 gr.)",
      "price": "328 TL",
      "desc": "Ekmek ya da lavaş arasına; tavuk döner, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Dönerler"
    },
    {
      "name": "Alman Usulü Tavuk Döner (150 gr.)",
      "price": "372 TL",
      "desc": "Ekmek ya da lavaş arasına; tavuk döner, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Dönerler"
    },
    {
      "name": "Tavuk Döner Box (100 gr.)",
      "price": "328 TL",
      "desc": "Tavuk döner, patates kızartması, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Döner Boxes"
    },
    {
      "name": "Tavuk Döner Box (120 gr.)",
      "price": "348 TL",
      "desc": "Tavuk döner, patates kızartması, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Döner Boxes"
    },
    {
      "name": "Tavuk Döner Box (150 gr.)",
      "price": "388 TL",
      "desc": "Tavuk döner, patates kızartması, isteğe göre salata, garnitür, sos",
      "category": "Tavuk Döner Boxes"
    },
    {
      "name": "Patates Kızartması",
      "price": "104 TL",
      "desc": "Parmak dilim",
      "category": "Yan Ürünler"
    },
    {
      "name": "Coca-Cola (33 cl.)",
      "price": "84 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 cl.)",
      "price": "84 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Lipton Ice Tea Şeftali (33 cl.)",
      "price": "84 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Lipton Ice Tea Limon (33 cl.)",
      "price": "84 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sarıyer Kola (33 cl.)",
      "price": "68 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sarıyer Portakal (33 cl.)",
      "price": "68 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Ayran (27 cl.)",
      "price": "56 TL",
      "desc": "Büyük boy",
      "category": "İçecekler"
    },
    {
      "name": "Su (50 cl.)",
      "price": "16 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Cola Turka (33 cl.)",
      "price": "64 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Uludağ Gazoz (33 cl.)",
      "price": "64 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    }
  ]
}
,
  "7226": {
  "name": "Gaziantep’li Baklavaci Bey Kavacik",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/o792/gaziantepli-baklavaci-bey-o792",
  "sourceName": "Yemeksepeti canlı Gaziantepli Baklavacı Bey menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Fıstıklı Şöbiyet (500 gr.)",
      "price": "1.200 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, kaymak, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Ankara (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Midye (500 gr.)",
      "price": "1.200 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, kaymak, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Soğuk Baklava (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, süt, özel çikolata, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Sütlü Nuriye (500 gr.)",
      "price": "890 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, tuz, süt, fındık",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Kare Klasik Baklava (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Havuç Dilim Baklava (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Tel Kadayıf (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Özel Baklava (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Cevizli Özel Baklava (500 gr.)",
      "price": "890 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, ceviz",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Sarma Dürüm (500 gr.)",
      "price": "1.500 TL",
      "desc": "500 gr. olarak servis edilmektedir.",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Kuru Baklava (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Burma (500 gr.)",
      "price": "1.050 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Cevizli Ev Baklavası (500 gr.)",
      "price": "890 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, ceviz",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fındıklı Güllaç (500 gr.)",
      "price": "700 TL",
      "desc": "500 gr.",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Fıstıklı Güllaç (500 gr.)",
      "price": "800 TL",
      "desc": "500 gr.",
      "category": "Tatlılar (500 gr.)"
    },
    {
      "name": "Kare Klasik Baklava (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Şöbiyet (1 kg.)",
      "price": "2.300 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, kaymak, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Kuru Baklava (1 kg.)",
      "price": "2.050 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Tel Kadayıf (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Cevizli Ev Baklavası (1 kg.)",
      "price": "1.750 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, ceviz",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Sütlü Nuriye (1 kg.)",
      "price": "1.750 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, tuz, süt, fındık",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Soğuk Baklava (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, süt, özel çikolata, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Sarma Dürüm (1 kg.)",
      "price": "2.990 TL",
      "desc": "1 kg. olarak servis edilmektedir.",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Burma (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), pancar şekeri (toz şeker), içme suyu, buğday unu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Midye (1 kg.)",
      "price": "2.300 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, kaymak, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Özel Baklava (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Havuç Dilim Baklava (1 kg.)",
      "price": "2.050 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Cevizli Özel Baklava (1 kg.)",
      "price": "1.750 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, ceviz",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Ramazan Menüsü (Fındıklı Güllaç (1 kg.))",
      "price": "1.200 TL",
      "desc": "1 kg. olarak servis edilir.",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Güllaç (1 kg.)",
      "price": "1.300 TL",
      "desc": "Sütlü tatlı",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Baklava (3.7 kg.) (Tepsi)",
      "price": "7.000 TL",
      "desc": "Tepsi fiyatı depozitoya dahildir",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Fıstıklı Ankara (1 kg.)",
      "price": "1.990 TL",
      "desc": "Özel tereyağ (sade yağ), ince hamur, pancar şekeri (toz şeker), içme suyu, buğday unu, buğday nişastası, yumurta, sofra tuzu, Antep fıstık içi",
      "category": "Tatlılar (1 kg.)"
    },
    {
      "name": "Çilekli Dondurma (500 gr.)",
      "price": "500 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Limonlu Dondurma (500 gr.)",
      "price": "500 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Kakaolu Dondurma (500 gr.)",
      "price": "500 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Maraş Usulü Kesme Dondurma (500 gr.)",
      "price": "500 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Çilekli Dondurma (1 kg.)",
      "price": "1.000 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Limonlu Dondurma (1 kg.)",
      "price": "1.000 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Kakaolu Dondurma (1 kg.)",
      "price": "1.000 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    },
    {
      "name": "Maraş Usulü Kesme Dondurma (1 kg.)",
      "price": "1.000 TL",
      "desc": "Paketli ürün",
      "category": "Dondurmalar"
    }
  ]
}
,
  "7227": {
  "name": "Erdem Kebap",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/gaut/erdem-kebap",
  "sourceName": "Yemeksepeti canlı Erdem Kebap menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Menemen",
      "price": "320 TL",
      "desc": "Yumurtalı",
      "category": "Kahvaltılıklar"
    },
    {
      "name": "Sucuklu Yumurta",
      "price": "350 TL",
      "desc": "Yumurta, sucuk",
      "category": "Kahvaltılıklar"
    },
    {
      "name": "Beyaz Peynirli Sandviç",
      "price": "230 TL",
      "desc": "Beyaz peynir, salatalık, yeşillik",
      "category": "Soğuk Sandviçler"
    },
    {
      "name": "Kaşarlı Sandviç",
      "price": "230 TL",
      "desc": "Kaşar peyniri, salatalık, yeşillik",
      "category": "Soğuk Sandviçler"
    },
    {
      "name": "Salamlı Sandviç",
      "price": "230 TL",
      "desc": "Salam, salatalık, yeşillik",
      "category": "Soğuk Sandviçler"
    },
    {
      "name": "Karışık Sandviç",
      "price": "270 TL",
      "desc": "Kavurma, kaşar peyniri, domates, salatalık",
      "category": "Soğuk Sandviçler"
    },
    {
      "name": "Ton Balıklı Sandviç",
      "price": "270 TL",
      "desc": "Ton balığı, yeşillik, mısır",
      "category": "Soğuk Sandviçler"
    },
    {
      "name": "Günün Çorbası",
      "price": "110 TL",
      "desc": "Ekmek ile",
      "category": "Başlangıçlar"
    },
    {
      "name": "Patates Kızartması",
      "price": "210 TL",
      "desc": "Parmak dilim",
      "category": "Başlangıçlar"
    },
    {
      "name": "Adana Kebap (120 gr.)",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Urfa Kebap",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Yoğurtlu Kebap",
      "price": "550 TL",
      "desc": "Kıvırcık marul, közde domates, biber ile",
      "category": "Kebaplar"
    },
    {
      "name": "Domatesli Kebap",
      "price": "630 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Patlıcanlı Kebap",
      "price": "630 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Sarma Beyti",
      "price": "570 TL",
      "desc": "Yoğurtlu, soslu, lavaşa sarılı. Kıvırcık marul, közde domates, biber, bulgur pilavı, yoğurt",
      "category": "Kebaplar"
    },
    {
      "name": "Alinazik Kebap (Kuzu Şişten)",
      "price": "650 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Ezmeli Kebap (Kuzu Şişten)",
      "price": "650 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Kebaplar"
    },
    {
      "name": "Erdem Kebap",
      "price": "1.150 TL",
      "desc": "Tavuk şiş, kuzu şiş, ızgara köfte, kanat ızgara, Adana kebap, Fındık lahmacun, fındık pide. Lavaş, pilav, yeşillik, domates, biber ile",
      "category": "Kebaplar"
    },
    {
      "name": "Tavuk Şiş",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Kanat Şiş",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Tavuk Izgara",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Izgara Köfte",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Çöp Şiş",
      "price": "620 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Kuzu Şiş",
      "price": "620 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Tavuk Pirzola",
      "price": "420 TL",
      "desc": "Kıvırcık marul, közde domates, biber, bulgur pilavı ile",
      "category": "Izgaralar"
    },
    {
      "name": "Fındık Lahmacun",
      "price": "100 TL",
      "desc": "Baharatlı kıyma harcının ince hamur üzerine yayılarak hazırlandığı küçük bir lahmacun çeşididir.",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Lahmacun",
      "price": "165 TL",
      "desc": "Baharatlı kıyma harcının ince hamur üzerine yayılarak hazırlandığı bir yemektir.",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kaşarlı Lahmacun",
      "price": "240 TL",
      "desc": "Kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kaşarlı Pide",
      "price": "360 TL",
      "desc": "Kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kıymalı Pide (Açık)",
      "price": "390 TL",
      "desc": "Kıyma",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Tavuklu Kaşarlı Pide",
      "price": "390 TL",
      "desc": "Tavuk, kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Sebzeli Pide",
      "price": "400 TL",
      "desc": "Domates, kaşar peyniri, biber, zeytin, mısır, mantar",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Beyaz Peynirli Pide",
      "price": "410 TL",
      "desc": "Beyaz peynir",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kıymalı Kaşarlı Pide (Açık)",
      "price": "410 TL",
      "desc": "Kıyma, kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Sucuklu Kaşarlı Pide",
      "price": "410 TL",
      "desc": "Sucuk, kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Sucuklu Pide",
      "price": "410 TL",
      "desc": "Sucuk",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kuşbaşılı Pide (Açık)",
      "price": "410 TL",
      "desc": "Kuşbaşı et",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kavurmalı Kaşarlı Pide",
      "price": "420 TL",
      "desc": "Kavurma, kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Pastırmalı Pide",
      "price": "420 TL",
      "desc": "Pastırma",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Pastırmalı Kaşarlı Pide",
      "price": "420 TL",
      "desc": "Pastırma, kaşar peyniri",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kavurmalı Pide",
      "price": "420 TL",
      "desc": "Kavurma",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Karışık Pide",
      "price": "420 TL",
      "desc": "Kavurma, sucuk, salam, kaşar peyniri, mantar, domates, biber, zeytin",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Karışık Özel Pide",
      "price": "420 TL",
      "desc": "Kavurma, kaşar peyniri, sucuk",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Karışık Pizza",
      "price": "460 TL",
      "desc": "Sucuk, salam, kavurma, kaşar peyniri, domates, biber, zeytin, mantar",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Yarım Ekmek Arası Köfte",
      "price": "250 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "3/4 Ekmek Arası Izgara Köfte",
      "price": "400 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Köfte Dürüm",
      "price": "375 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Tavuk Şiş Dürüm",
      "price": "375 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Adana Dürüm",
      "price": "375 TL",
      "desc": "120 gr. Adana kebap, kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Urfa Dürüm",
      "price": "375 TL",
      "desc": "120 gr. Urfa kebap, kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Çöp Şiş Dürüm",
      "price": "480 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Kuzu Şiş Dürüm",
      "price": "480 TL",
      "desc": "Kıvırcık marul, domates, isteğe göre soğan",
      "category": "Dürümler & Ekmek Arası Ürünler"
    },
    {
      "name": "Yoğurt",
      "price": "150 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Yan Ürünler"
    },
    {
      "name": "Cacık",
      "price": "150 TL",
      "desc": "Yoğurdun içerisine doğranmış salatalık, nane, sarımsak ve tuz eklenerek yapılan meze çeşididir.",
      "category": "Yan Ürünler"
    },
    {
      "name": "Turşu",
      "price": "150 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Yan Ürünler"
    },
    {
      "name": "Salatalık & Biber Turşusu",
      "price": "150 TL",
      "desc": "Salatalık, biber",
      "category": "Yan Ürünler"
    },
    {
      "name": "Mevsim Salata",
      "price": "230 TL",
      "desc": "Mevsim yeşillikleri",
      "category": "Salatalar"
    },
    {
      "name": "Çoban Salata",
      "price": "230 TL",
      "desc": "Domates, salatalık, biber, isteğe göre soğan",
      "category": "Salatalar"
    },
    {
      "name": "Göbek Salata",
      "price": "230 TL",
      "desc": "Göbek marul ile hazırlanan bir salata çeşididir.",
      "category": "Salatalar"
    },
    {
      "name": "Ton Balıklı Salata",
      "price": "350 TL",
      "desc": "Ton balığı, kırmızılahana, havuç, kıvırcık marul, salatalık, domates, mısır, zeytinyağı, limon",
      "category": "Salatalar"
    },
    {
      "name": "Tavuklu Salata",
      "price": "350 TL",
      "desc": "Terbiyeli tavuk, kırmızılahana, havuç, kıvırcık marul, salatalık, domates, mısır, sos, zeytinyağı, limon",
      "category": "Salatalar"
    },
    {
      "name": "Tavuklu Diyet Salata",
      "price": "350 TL",
      "desc": "Tavuk, kırmızılahana, havuç, kıvırcık marul, salatalık, domates, mısır",
      "category": "Salatalar"
    },
    {
      "name": "Peynirli Salata",
      "price": "350 TL",
      "desc": "Beyaz peynir, kırmızılahana, havuç, kıvırcık marul, salatalık, domates, mısır, zeytinyağı, limon",
      "category": "Salatalar"
    },
    {
      "name": "Peynirli Diyet Salata",
      "price": "350 TL",
      "desc": "Beyaz peynir, kırmızılahana, havuç, kıvırcık marul, salatalık, mısır, domates",
      "category": "Salatalar"
    },
    {
      "name": "Fırında Sütlaç",
      "price": "140 TL",
      "desc": "Pirinç, süt, şeker gibi malzemelerin birleşimiyle yapılan hafif puding kıvamında bir tatlıdır.",
      "category": "Tatlılar"
    },
    {
      "name": "Künefe",
      "price": "230 TL",
      "desc": "1 kişilik",
      "category": "Tatlılar"
    },
    {
      "name": "Algida Maraş Usulü Cup Dondurma (100 ml.)",
      "price": "55 TL",
      "desc": "Paket dondurma",
      "category": "Dondurmalar"
    },
    {
      "name": "Cartedor Meyve Rüyası (100 ml.)",
      "price": "60 TL",
      "desc": "Paket dondurma",
      "category": "Dondurmalar"
    },
    {
      "name": "Carte d'Or Çikolata Rüyası (110 ml.)",
      "price": "60 TL",
      "desc": "Paket dondurma",
      "category": "Dondurmalar"
    },
    {
      "name": "Coca-Cola (33 cl.)",
      "price": "85 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Light (33 cl.)",
      "price": "85 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (33 cl.)",
      "price": "85 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 cl.)",
      "price": "85 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Cappy (33 cl.)",
      "price": "85 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sütaş Ayran (30 cl.)",
      "price": "60 TL",
      "desc": "Büyük",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Suyu (25 cl.) (Acılı)",
      "price": "70 TL",
      "desc": "İçecek",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 cl.)",
      "price": "60 TL",
      "desc": "Cam şişe",
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
      "price": "180 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (1 L.)",
      "price": "180 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Zero Sugar (1 L.)",
      "price": "180 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (1 L.)",
      "price": "180 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Sütaş Ayran (1 L.)",
      "price": "180 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (2,5 L.)",
      "price": "220 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    }
  ]
}
,
  "7231": {
  "name": "Chick & Go",
  "sourceUrl": "https://chickgo.menudgtl.com/",
  "sourceName": "Chick & Go resmi dijital menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "MUHTEŞEM ÜÇLÜ MENÜ",
      "price": "420 TL",
      "desc": "1 çıtır tavuk but, 2 çıtır tavuk kanat, 2 kemiksiz çıtır tavuk, 1 küçük boy patates",
      "category": "TEK KİŞİLİK MENÜLER"
    },
    {
      "name": "KEMİKSİZ ÇITIR MENÜ",
      "price": "330 TL",
      "desc": "(4 kemiksiz çıtır, 1 küçük boy patates)",
      "category": "TEK KİŞİLİK MENÜLER"
    },
    {
      "name": "SÜPER İKİLİ MENÜ",
      "price": "350 TL",
      "desc": "(2 Kanat, 2 Kemiksiz Çıtır, 1 Küçük Boy Patates)",
      "category": "TEK KİŞİLİK MENÜLER"
    },
    {
      "name": "10'LU KEMİKSİZ ÇITIR MENÜ",
      "price": "635 TL",
      "desc": "10 Kemiksiz Çıtır, Patates Kızartması",
      "category": "ADETLİ TAVUKLAR"
    },
    {
      "name": "BUT MENÜ",
      "price": "375 TL",
      "desc": "(4 But, 1 Küçük Boy Patates)",
      "category": "TEK KİŞİLİK MENÜLER"
    },
    {
      "name": "NAGGET MENÜ",
      "price": "265 TL",
      "desc": "(10 Nugget, 1 Küçük Boy Patates)",
      "category": "TEK KİŞİLİK MENÜLER"
    },
    {
      "name": "4'LÜ ÇITIR KANAT MENÜ",
      "price": "380 TL",
      "desc": "(4 Çıtır Kanat, 1 Küçük Boy Patates)",
      "category": "KANAT MENÜLER"
    },
    {
      "name": "8'Lİ ÇITIR KANAT MENÜ",
      "price": "650 TL",
      "desc": "(8 Çıtır Kanat, 1 Küçük Boy Patates)",
      "category": "KANAT MENÜLER"
    },
    {
      "name": "16'LI ÇITIR KANAT MENÜ",
      "price": "1260 TL",
      "desc": "(16 Çıtır Kanat, 1 Büyük Boy Patates)",
      "category": "KANAT MENÜLER"
    },
    {
      "name": "MIX TWISTER MENÜ",
      "price": "420 TL",
      "desc": "Twister Dürüm + 2 Çıtır Kanat + Küçük Patates",
      "category": "MİX MENÜLER"
    },
    {
      "name": "MIX BURGER MENÜ",
      "price": "470 TL",
      "desc": "Zinger Burger + 2 Çıtır Kanat + Küçük Patates",
      "category": "MİX MENÜLER"
    },
    {
      "name": "ZINGER BURGER MENÜ",
      "price": "350 TL",
      "desc": "Zinger Burger + Küçük Patates",
      "category": "BURGER VE SANDVİÇ MENÜLER"
    },
    {
      "name": "İKİLİ BURGER MENÜ",
      "price": "620 TL",
      "desc": "(2 Yuvarlak Zinger, 1 Küçük Boy Patates)",
      "category": "BURGER VE SANDVİÇ MENÜLER"
    },
    {
      "name": "UZUN ZİNGER MENÜ",
      "price": "350 TL",
      "desc": "(Uzun sandviç ekmeğine; 2 Kemiksiz Çıtır, Füme hindi, Kaşar, Jalapeno, Marul, Spesiyal mayonez ve 1 Küçük Boy Patates)",
      "category": "BURGER VE SANDVİÇ MENÜLER"
    },
    {
      "name": "ÇOCUK BURGER MENÜ",
      "price": "210 TL",
      "desc": "(Yuvarlak sandviç ekmeğine; 2 Baby parmak çıtır, marul, spesiyal mayonez, 1 çocuk patates, 1 meyve suyu 200 ml)",
      "category": "ÇOCUK MENÜLER"
    },
    {
      "name": "ÇOCUK KEMİKSİZ ÇITIR MENÜ",
      "price": "315 TL",
      "desc": "(3 Baby parmak çıtır, 1 çocuk patates, 1 Meyve suyu (200 ml)",
      "category": "ÇOCUK MENÜLER"
    },
    {
      "name": "ÇOCUK NUGGET MENÜ",
      "price": "230 TL",
      "desc": "(6 Nugget 1 çocuk patates, 1 Meyve suyu 200 ml)",
      "category": "ÇOCUK MENÜLER"
    },
    {
      "name": "ARKADAŞ MENÜSÜ",
      "price": "990 TL",
      "desc": "(6 Kemiksiz Çıtır, 6 Çıtır Kanat, 1 Büyük Boy Patates, 1L. İçecek)",
      "category": "AİLE MENÜLERİ"
    },
    {
      "name": "MAÇ MENÜSÜ",
      "price": "990 TL",
      "desc": "(8 Kemiksiz Çıtır, 2 Twister Dürüm, 1 Büyük Boy Patates, 1L. İçecek)",
      "category": "AİLE MENÜLERİ"
    },
    {
      "name": "AKŞAM MENÜSÜ",
      "price": "1090 TL",
      "desc": "4 Kemiksiz Çıtır, 4 Çıtır Kanat, 2 Twister Dürüm, 1 Büyük Boy Patates, 1L. İçecek)",
      "category": "AİLE MENÜLERİ"
    },
    {
      "name": "EKONOMİK MENÜ",
      "price": "1235 TL",
      "desc": "(8 Kemiksiz Çıtır, 8 Çıtır Kanat, 1 Büyük Boy Patates, 1L. İçecek)",
      "category": "AİLE MENÜLERİ"
    },
    {
      "name": "PARTİ MENÜ",
      "price": "1290 TL",
      "desc": "(4 But, 6 Kemiksiz Çıtır, 6 Çıtır Kanat, 1 Büyük Boy Patates, 1L. İçecek )",
      "category": "AİLE MENÜLERİ"
    },
    {
      "name": "ZİNGER BURGER",
      "price": "285 TL",
      "desc": "(Yuvarlak burger ekmeğine; 1 Kemiksiz Göğüs, Marul, Speciyal mayonez)",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "UZUN ZİNGER",
      "price": "290 TL",
      "desc": "(Uzun sandviç ekmeğine; 2 Kemiksiz Çıtır, Füme hindi, Kaşar peyniri, Jalapeno, Marul, Spesiyal mayonez)",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "GO ZİNGER BURGER",
      "price": "300 TL",
      "desc": "(Yuvarlak burger ekmeğine; 1 Kemiksiz Göğüs, Cheddar, Marul, Speciyal mayonez)",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "DOUBLE GO ZINGER BURGER",
      "price": "520 TL",
      "desc": "(Yuvarlak burger ekmeğine; 2 Kemiksiz Bonfile, 2 Cheddar, Marul, Specsiyal mayonez)",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "TRUFFLE & CHEESE SUPREME",
      "price": "365 TL",
      "desc": "Yuvarlak burger ekmeğine; Kemiksiz Bonfile (140gr), Üç Peynirli Sos, Marul, Trüf Aioli Sos, Balzamik glaze",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "SWEET & SMOKY BLAZE",
      "price": "330 TL",
      "desc": "Yuvarlak burger ekmeğine; Chili Honey BBQ Soslu Kemiksiz Bonfile (140 gr), Marul, Sweet Mayo",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "GOLD & SLAW BITE",
      "price": "330 TL",
      "desc": "Yuvarlak burger ekmeğine; Kemiksiz Bonfile (140gr), Garlic Sos, Mor Lahana, Ballı Hardal Sos, Chili Honey BBQ",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "NASHVİLLE BURGER",
      "price": "330 TL",
      "desc": "Yuvarlak burger ekmeğine; Nashville Baharatlı Kemiksiz Bonfile (140 gr), Marul, Garlic Sos, Acı Ballı Sos",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "DYNAMITE BURGER",
      "price": "330 TL",
      "desc": "Yuvarlak burger ekmeğine; Kemiksiz Bonfile (140 gr), Marul, Sweet Mayo, Dynamite Sos",
      "category": "BURGER VE SANDVİÇLER"
    },
    {
      "name": "TWİSTER DÜRÜM",
      "price": "240 TL",
      "desc": "(Tortilla lavaşına; 2 Kemiksiz Çıtır, Domates, Marul, Spesiyal mayonez )",
      "category": "DÜRÜMLER"
    },
    {
      "name": "TWİSTER DÜRÜM MENÜ",
      "price": "295 TL",
      "desc": "(Tortilla lavaşına; 2 Kemiksiz Çıtır, Domates, Marul, Spesiyal mayonez ve 1 Küçük Boy Patates)",
      "category": "DÜRÜM MENÜLER"
    },
    {
      "name": "İKİLİ TWİSTER MENÜ",
      "price": "530 TL",
      "desc": "(İkili Twister Dürüm, 1 Küçük Boy Patates)",
      "category": "DÜRÜM MENÜLER"
    },
    {
      "name": "8'Lİ BUT",
      "price": "665 TL",
      "desc": "8'li but",
      "category": "ADETLİ TAVUKLAR"
    },
    {
      "name": "15'Lİ KEMİKSİZ ÇITIR",
      "price": "835 TL",
      "desc": "15 Kemiksiz Çıtır",
      "category": "ADETLİ TAVUKLAR"
    },
    {
      "name": "20'Lİ ÇITIR KANAT",
      "price": "1510 TL",
      "desc": "20'li çıtır kanat",
      "category": "ADETLİ TAVUKLAR"
    },
    {
      "name": "KÜÇÜK BOY PATATES KIZARTMASI",
      "price": "100 TL",
      "desc": "Küçük Boy Patates Kızartması",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "BÜYÜK BOY PATATES KIZARTMASI",
      "price": "160 TL",
      "desc": "Büyük boy patates kızartması",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "8'Lİ SOĞAN HALKASI",
      "price": "120 TL",
      "desc": "8'Li Soğan halkası",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "16'LI SOĞAN HALKASI",
      "price": "190 TL",
      "desc": "16'Lı Soğan halkası",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "ÇITIR SEPETİ",
      "price": "395 TL",
      "desc": "(2 Mozzarella sticks, 2 Nugget, 2 Kemiksiz çıtır, 2 Soğan halkası, 4 Çıtır shots, 1 büyük patates kızartması)",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "COLESLAW KÜÇÜK",
      "price": "60 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "COLESLAW BÜYÜK",
      "price": "90 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "BÜYÜK BOY PATATES KIZARTMASI (BAHARATLI)",
      "price": "170 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "ORTA BOY PATATES KIZARTMASI (BAHARATLI)",
      "price": "130 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "ORTA BOY PATATES KIZARTMASI",
      "price": "120 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "KÜÇÜK BOY PATATES KIZARTMASI  (BAHARATLI)",
      "price": "110 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "PATATES PÜRESİ 230 GR",
      "price": "130 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "LOADED FRIES",
      "price": "375 TL",
      "desc": "Çıtır Lokum, Jalapeno, Special Mayonez, Ranch sos, Büyük Patates Kızartması, Susam",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "4'LÜ ÇITIR LOKUM",
      "price": "85 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "8'Lİ ÇITIR LOKUM",
      "price": "160 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "12'Lİ ÇITIR LOKUM",
      "price": "210 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "20'Lİ ÇITIR LOKUM",
      "price": "385 TL",
      "desc": "",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "DİNAMİT SOSLU ÇITIR LOKUM",
      "price": "335 TL",
      "desc": "250 GR",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "CHILI HONEY BBQ SOSLU ÇITIR LOKUM",
      "price": "350 TL",
      "desc": "250 GR",
      "category": "YAN ÜRÜNLER"
    },
    {
      "name": "BUT (ADET)",
      "price": "110 TL",
      "desc": "But (Adet)",
      "category": "İLAVELER"
    },
    {
      "name": "ÇITIR KANAT (ADET)",
      "price": "115 TL",
      "desc": "Çıtır Kanat (Adet)",
      "category": "İLAVELER"
    },
    {
      "name": "KEMİKSİZ ÇITIR (ADET)",
      "price": "100 TL",
      "desc": "Kemiksiz Çıtır (Adet)",
      "category": "İLAVELER"
    },
    {
      "name": "NUGGET (ADET)",
      "price": "35 TL",
      "desc": "Nugget (Adet)",
      "category": "İLAVELER"
    },
    {
      "name": "KEMİKLİ GÖĞÜS",
      "price": "105 TL",
      "desc": "",
      "category": "İLAVELER"
    },
    {
      "name": "KEMİKLİ BACAK",
      "price": "105 TL",
      "desc": "",
      "category": "İLAVELER"
    },
    {
      "name": "BÜTÜN KANAT",
      "price": "105 TL",
      "desc": "",
      "category": "İLAVELER"
    },
    {
      "name": "BARBEKÜ SOS",
      "price": "25 TL",
      "desc": "Barbekü Sos",
      "category": "SOSLAR"
    },
    {
      "name": "RANCH SOS",
      "price": "25 TL",
      "desc": "Ranch Sos",
      "category": "SOSLAR"
    },
    {
      "name": "SARIMSAKLI SOS",
      "price": "25 TL",
      "desc": "Sarımsaklı Sos",
      "category": "SOSLAR"
    },
    {
      "name": "BALLI HARDAL SOS",
      "price": "25 TL",
      "desc": "Ballı Hardal Sos",
      "category": "SOSLAR"
    },
    {
      "name": "ACILI SPESİYAL MAYONEZ",
      "price": "35 TL",
      "desc": "Acılı Spesiyal Mayonez",
      "category": "SOSLAR"
    },
    {
      "name": "SPESİYAL MAYONEZ",
      "price": "35 TL",
      "desc": "Spesiyal Mayonez",
      "category": "SOSLAR"
    },
    {
      "name": "ACI SOS",
      "price": "20 TL",
      "desc": "Acı Sos",
      "category": "SOSLAR"
    },
    {
      "name": "KETÇAP",
      "price": "10 TL",
      "desc": "Ketçap",
      "category": "SOSLAR"
    },
    {
      "name": "MAYONEZ",
      "price": "10 TL",
      "desc": "Mayonez",
      "category": "SOSLAR"
    },
    {
      "name": "GUACAMOLE SOS",
      "price": "38 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "TRÜF MAYO SOS",
      "price": "45 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "SRİRACHA SOS",
      "price": "35 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "BALLI BARBEKÜ SOS",
      "price": "35 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "SWEET CHİLİ SOS",
      "price": "35 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "CHEDDAR SOS",
      "price": "45 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "PERİ PERİ SOS",
      "price": "35 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "DİNAMİT SOS",
      "price": "35 TL",
      "desc": "",
      "category": "SOSLAR"
    },
    {
      "name": "COCA COLA (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "COCA COLA ŞEKERSİZ (330 ML)",
      "price": "80 TL",
      "desc": "Coca Cola Şekersiz (330 ml)",
      "category": "İÇECEKLER"
    },
    {
      "name": "FANTA (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SPRİTE (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "FUSE TEA ŞEFTALİ (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "FUSE TEA LİMON (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "COCA COLA (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "COCA COLA ŞEKERSİZ (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "FANTA (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SPRİTE (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "FUSE TEA ŞEFTALİ (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "FUSE TEA LİMON (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "MEYVE SUYU (200 ML)",
      "price": "45 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "MADEN SUYU",
      "price": "50 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SU",
      "price": "30 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "AYRAN",
      "price": "45 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "PEPSİ (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER KOLA (1 LT)",
      "price": "100 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER GAZOZ (1 LT)",
      "price": "100 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER PORTAKAL (1 LT)",
      "price": "100 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "ÇAMLICA GAZOZ (1 LT)",
      "price": "100 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER KOLA (330 ML)",
      "price": "75 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER GAZOZ (330 ML)",
      "price": "75 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER PORTAKAL (330 ML)",
      "price": "75 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "PEPSİ (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "COCA COLA (250 ML.)",
      "price": "70 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "SARIYER LİMONATA (1 LT)",
      "price": "100 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "PEPSİ MAX ZERO (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "LIPTON ICE TEA MANGO (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "LIPTON ICE TEA ŞEFTALİ (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "LIPTON ICE TEA LİMON (330 ML)",
      "price": "80 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "PEPSİ MAX ZERO (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "ULUDAĞ LİMONATA ŞEKERSİZ (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "ULUDAĞ LİMONATA (1 LT)",
      "price": "110 TL",
      "desc": "",
      "category": "İÇECEKLER"
    },
    {
      "name": "6'LI CHILI HONEY BBQ SOSLU ÇİFT KEMİKLİ KANAT",
      "price": "540 TL",
      "desc": "",
      "category": "SOSLU KANATLAR"
    },
    {
      "name": "12'Lİ CHILI HONEY BBQ SOSLU ÇİFT KEMİKLİ KANAT",
      "price": "1050 TL",
      "desc": "",
      "category": "SOSLU KANATLAR"
    },
    {
      "name": "CHILI HONEY BBQ SOSLU ÇİFT KEMİKLİ KANAT (ADET)",
      "price": "125 TL",
      "desc": "",
      "category": "SOSLU KANATLAR"
    },
    {
      "name": "4 PARÇA KEMİKLİ TAVUK",
      "price": "319 TL",
      "desc": "3 Parça Tavuk (1 Göğüs, 1 Kanat, 1 But), 1 Küçük Boy Patates Kızartması",
      "category": "KEMİKLİ TAVUK MENÜLER"
    },
    {
      "name": "5 PARÇA KEMİKLİ TAVUK",
      "price": "379 TL",
      "desc": "5 Parça Tavuk (2 Göğüs, 1 Kanat, 1 Kalça, 1 But), 1 Küçük Boy Patates Kızartması",
      "category": "KEMİKLİ TAVUK MENÜLER"
    },
    {
      "name": "8 PARÇA KEMİKLİ TAVUK MENÜ",
      "price": "729 TL",
      "desc": "8 Parça Tavuk (2 Göğüs, 2 Kalça, 2 But, 2 Kanat), 1 Büyük Boy Patates, 1 lt İçecek",
      "category": "KEMİKLİ TAVUK MENÜLER"
    },
    {
      "name": "10 PARÇA KEMİKLİ TAVUK MENÜ",
      "price": "819 TL",
      "desc": "10 Parça Tavuk (3 Göğüs, 2 Kalça, 3 But, 2 Kanat), 1 Büyük Boy Patates, 1 lt İçecek",
      "category": "KEMİKLİ TAVUK MENÜLER"
    },
    {
      "name": "EKOMIX MENÜ",
      "price": "410 TL",
      "desc": "Zinger Burger + 4 Çıtır Lokum + 2 Soğan Halkası + Küçük Boy Patates Kızartması + Seçeceğin 1 Sos + Pepsi Kola 330 ml",
      "category": "AVANTAJLI MENÜLER"
    },
    {
      "name": "COMBO MIX MENÜ",
      "price": "970 TL",
      "desc": "Zinger Burger + Twister Dürüm + 4 Çıtır Lokum + 2 Kemiksiz Çıtır Tavuk + 2 Soslu Çıtır Kanat + 4 Soğan Halkası + 2 Küçük Coleslaw + Büyük Patates + 2 Sos + 1 Lt İçecek",
      "category": "AVANTAJLI MENÜLER"
    }
  ]
}
,
  "7232": {
  "name": "Mon Bakehouse",
  "sourceUrl": "https://www.migros.com.tr/yemek/mon-bakehouse-besiktas-nisbetiye-mah-st-1e110",
  "sourceName": "Migros Yemek canlı Mon Bakehouse menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Dinkelberger Ekmeği",
      "price": "730,00 TL",
      "desc": "",
      "category": "Ekmekler"
    },
    {
      "name": "Glultensiz Ispanaklı Kiş (Adet)",
      "price": "670,00 TL",
      "desc": "Karabuğday unlu",
      "category": "Simitler & Poğaçalar & Kişler"
    },
    {
      "name": "Glutensiz Kabaklı Kiş (Adet)",
      "price": "670,00 TL",
      "desc": "Karabuğday unlu",
      "category": "Simitler & Poğaçalar & Kişler"
    },
    {
      "name": "Çatal (Siyez Unlu)",
      "price": "140,00 TL",
      "desc": "50 gr",
      "category": "Simitler & Poğaçalar & Kişler"
    },
    {
      "name": "Vegan Hurmalı Cevizli (250 Gr.)",
      "price": "650,00 TL",
      "desc": "Şekersiz, glutensiz, vegan",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Çörekotlu Karabuğday Plaka (250 Gr.)",
      "price": "500,00 TL",
      "desc": "(Gluten içermez, karabuğday unu ile hazırlanır.)",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Haşhaşlı Karabuğday Plaka (250 Gr.)",
      "price": "500,00 TL",
      "desc": "(Gluten içermez, karabuğday unu ile hazırlanır.)",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Susamlı Karabuğday Plaka (250 Gr.)",
      "price": "500,00 TL",
      "desc": "Glutensiz,  karabuğday unu ile hazırlanır.",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Siyez Unlu Ay Çekirdekli Çubuk (250 Gr.)",
      "price": "450,00 TL",
      "desc": "Siyez unu, ay çekirdeği",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Siyez Unlu Susamlı Çubuk (250 Gr.)",
      "price": "450,00 TL",
      "desc": "Siyez unu, susam",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Peynirli Karabuğday Plaka",
      "price": "500,00 TL",
      "desc": "",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Ayçekirdekli Karabuğday Plaka ( 250 Gr.)",
      "price": "500,00 TL",
      "desc": "",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Kavulca Çubuk",
      "price": "500,00 TL",
      "desc": "Günlük hazırlanır.",
      "category": "Kiloluk Ürünler"
    },
    {
      "name": "Mini Tahinli Çörek",
      "price": "150,00 TL",
      "desc": "Tahin",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Acı Badem Kurabiyesi",
      "price": "480,00 TL",
      "desc": "Glutensiz",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Chocolate Chip Kurabiye",
      "price": "190,00 TL",
      "desc": "Çikolata",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Badem Unlu Hurmalı Kurabiye (250 Gr.)",
      "price": "650,00 TL",
      "desc": "Glutensiz, rafine şekersiz",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Portakallı Belçika Çikolatalı Kurabiye (250 Gr.)",
      "price": "750,00 TL",
      "desc": "Glutensizdir.",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Fındıklı & Çikolatalı Kurabiye (250 Gr.) (Glütensiz )",
      "price": "750,00 TL",
      "desc": "Fındık unu, fındık parçacıkları ve çikolatalı pralin ile glütensiz olarak hazırlanır.",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Meyve Püreli Kurabiye (250 Gr.) (Glütensizdir)",
      "price": "750,00 TL",
      "desc": "Meyve püresi",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Büyük Tahinli Çörek",
      "price": "520,00 TL",
      "desc": "",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Orman Meyveli Mini Tart",
      "price": "750,00 TL",
      "desc": "glutensiz badem kremalı tart",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Glutensiz Selanik Gevreği (250 Gr.)",
      "price": "750,00 TL",
      "desc": "",
      "category": "Kurabiyeler & Çörekler"
    },
    {
      "name": "Beyaz Çikolatalı Brownie",
      "price": "640,00 TL",
      "desc": "Beyaz çikolata",
      "category": "Tatlılar"
    },
    {
      "name": "Mozaik Pasta",
      "price": "640,00 TL",
      "desc": "Dilim",
      "category": "Tatlılar"
    },
    {
      "name": "Unsuz Çikolatalı Kek (Dilim)",
      "price": "780,00 TL",
      "desc": "Çikolata",
      "category": "Tatlılar"
    },
    {
      "name": "Glütensiz Unsuz Çikolatalı Kek (4-6 Kişilik)",
      "price": "3.200,00 TL",
      "desc": "Badem unlu",
      "category": "Tatlılar"
    },
    {
      "name": "Limonlu Cheesecake",
      "price": "700,00 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Yaban Mersinli Tart (4-6 Kişilik)",
      "price": "3.900,00 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Granola (300 Gr.)",
      "price": "385,00 TL",
      "desc": "300 gr.",
      "category": "Kavanoz & Paket Ürünler"
    },
    {
      "name": "Karabuğdaylı Granola (300 Gr.)",
      "price": "440,00 TL",
      "desc": "300 gr.",
      "category": "Kavanoz & Paket Ürünler"
    },
    {
      "name": "Julius Meinl Filtre (1 Kg.)",
      "price": "2.600,00 TL",
      "desc": "1 kg.",
      "category": "Kavanoz & Paket Ürünler"
    },
    {
      "name": "Fethiye Çam Balı",
      "price": "720,00 TL",
      "desc": "",
      "category": "Kavanoz & Paket Ürünler"
    },
    {
      "name": "Julius Meinl Çekirdek ( 1Kg)",
      "price": "3.150,00 TL",
      "desc": "",
      "category": "Kavanoz & Paket Ürünler"
    },
    {
      "name": "Dondurma (500 Gr.)",
      "price": "1.000,00 TL",
      "desc": "Karışık",
      "category": "Dondurma"
    },
    {
      "name": "Dondurma (1 Kg.)",
      "price": "2.000,00 TL",
      "desc": "",
      "category": "Dondurma"
    },
    {
      "name": "Espresso",
      "price": "140,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Double Espresso",
      "price": "170,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Macchiato",
      "price": "200,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Cappuccino",
      "price": "225,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Latte",
      "price": "225,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Mocha",
      "price": "260,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Flat White",
      "price": "260,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Cortado",
      "price": "250,00 TL",
      "desc": "Sıcak servis edilir.",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Ice Matcha Latte",
      "price": "280,00 TL",
      "desc": "",
      "category": "Soğuk İçecekler"
    }
  ]
}
,
  "7233": {
  "name": "KÜNEFEDEYİZ BEYLİKDÜZÜ",
  "sourceUrl": "https://kunefedeyiz.com/urunler/",
  "sourceName": "KÜNEFEDEYİZ resmi ürünler sayfası (fiyat yayınlanmıyor)",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "SADE KÜNEFE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "KAYMAKLI KÜNEFE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "MUZLU KÜNEFE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "DONDURMALI KÜNEFE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "FISTIKLI KÜNEFE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "CENNET ÇAMURU",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "ANTEP KADAYIFI",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "BİLLURİYE TATLISI",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "DÖRDÜ BİR ARADA",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "FISTIKZADE",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    },
    {
      "name": "HASIR KADAYIF",
      "price": "",
      "desc": "",
      "category": "Künefe ve Tatlılar"
    }
  ]
}
,
  "7234": {
  "name": "Soriso Pizza and Pasta",
  "sourceUrl": "https://www.migros.com.tr/yemek/soriso-pizza-and-pasta-beylikduzu-baris-mah-st-19b82",
  "sourceName": "Migros Yemek canlı Soriso Pizza and Pasta menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Antipasti Pizza (30 Cm.)",
      "price": "187,00 TL",
      "desc": "Domates sosu, mozarella peyniri, İtalyan usulü zeytinyağında terbiyelenmiş patlıcan, kabak, kırmızı soğan, istiridye mantarı, küf mantarı, renkli biberler, çeri domates, pesto sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Mostarda Pizza (Küçük) (30 Cm.)",
      "price": "179,00 TL",
      "desc": "Domates sos, mozzarella peyniri, hardallı barbekü soslu sosis dilimleri, mantar, mısır",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Arrosto Di Manzo Pizza (30 Cm.)",
      "price": "250,00 TL",
      "desc": "Domates sosu, mozarella peyniri ev yapımı roast beef dilimleri, mantar çeşitleri, pesto sos, soğan, renkli biberler",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Bascaiola Pizza (30 Cm.)",
      "price": "175,00 TL",
      "desc": "Domates sosu, mozarella peyniri, hindi jambon, pesto ile sotelenmiş istiridye, kültür mantarı, renkli biberler",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Bufalina Pizza (30 Cm.)",
      "price": "195,00 TL",
      "desc": "Domates sosu, suda taze mozarella peyniri, çeri domates, pesto sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Con Pollo Barbeque Pizza (30 Cm.)",
      "price": "180,00 TL",
      "desc": "Domates sosu, mozarella peyniri, kızarmış tavuk dilimleri, ev yapımı barbekü sos, mantar, mısır, renkli biberler",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Della Casa Pizza (30 Cm.)",
      "price": "195,00 TL",
      "desc": "Domates sosu, mozarella peyniri, bolognese kıyma sosu, sucuk, mısır, acılı sarımsaklı sos, parmesan peyniri",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Diavolo Pizza (30 Cm.)",
      "price": "195,00 TL",
      "desc": "Domates sosu, mozarella peyniri, ev yapımı acılı sarımsak sosunda yoğurulmuş kangal sucuk dilimleri, mantar çeşitleri, kırmızı soğan",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "El Tocino Pizza (30 Cm.)",
      "price": "210,00 TL",
      "desc": "Domates sosu, mozarella peyniri, pastırma, sucuk, hindi jambon, sosis, mantar çeşitleri, pesto sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Frutti Di Mare Pizza (30 Cm.)",
      "price": "225,00 TL",
      "desc": "Domates sosu, mozarella peyniri, tavada sotelenmiş deniz ürünleri, kırmızı soğan, mısır, sarımsaklı pesto sos, dereotu",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Quattro Formaggi Pizza (30 Cm.)",
      "price": "195,00 TL",
      "desc": "Domates sosu, mozarella peyniri, beyaz peynir, parmesan peyniri, zeytin dilimleri, pasto sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Margaritha Pizza (30 Cm.)",
      "price": "165,00 TL",
      "desc": "Domates sosu, mozarella peyniri, çeri domates",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Ortalana Pizza (30 Cm.)",
      "price": "290,00 TL",
      "desc": "Domates sosu, mozarella peyniri, pastırma dilimleri, mantar çeşitleri, kırmızı soğan, acılı sarımsaklı sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Panne All Aglio Pizza (30 Cm.)",
      "price": "95,00 TL",
      "desc": "Domates sosu, mozarella peyniri, sarımsak, pesto soslu pizza ekmeği",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Salsiccia Pizza (30 Cm.)",
      "price": "189,00 TL",
      "desc": "Domates sosu, mozzarella peyniri, sucuk, sosis, mısır",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Soriso Speciale Pizza (30 Cm.)",
      "price": "300,00 TL",
      "desc": "Domates sosu, mozarella peyniri, kızarmış dana bonfile dilimleri, pesto sosunda yoğurulmuş, istiridye mantarı, küf mantarı, kırmızı soğan, renkli biberler, roka, parmesan peyniri",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Spinaci Pizza (30 Cm.)",
      "price": "182,00 TL",
      "desc": "Domates sosu, mozarella peyniri, tavada ıspanak, kırmızı soğan, sarımsak, beyaz peynir, mısır",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Tonna E'cipolla Pizza (30 Cm.)",
      "price": "195,00 TL",
      "desc": "Domates sosu, mozarella peyniri, ton balığı, kırmızı soğan, mısır, renkli biberler, sarımsaklı pesto sos, dereotu",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Costola Pizza (30 Cm.)",
      "price": "255,00 TL",
      "desc": "Domates sosu, mozzarella peyniri, dana kaburga eti, soğan, mantar",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Funghi Pizza (30 Cm.)",
      "price": "185,00 TL",
      "desc": "Domates sos, mozzarella peyniri, mantar, pesto sos",
      "category": "Orta Boy Pizzalar (30 Cm.)"
    },
    {
      "name": "Antipasti Pizza (35 Cm.)",
      "price": "285,00 TL",
      "desc": "Domates sosu, mozarella peyniri, İtalyan usulü zeytinyağında terbiyelenmiş patlıcan, kabak, kırmızı soğan, istiridye mantarı, küf mantarı, renkli biberler, çeri domates, pesto sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Mostarda Pizza (35 Cm.)",
      "price": "280,00 TL",
      "desc": "Domates sos, mozzarella peyniri, hardallı ve barbekü soslu sosis dilimleri, mantar, mısır",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Arrosto Di Manzo Pizza (35 Cm.)",
      "price": "385,00 TL",
      "desc": "Domates sosu, mozarella peyniri ev yapımı roast beef dilimleri, mantar çeşitleri, pesto sos, soğan, renkli biberler",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Bascaiola Pizza (35 Cm.)",
      "price": "270,00 TL",
      "desc": "Domates sosu, mozarella peyniri, hindi jambon, pesto ile sotelenmiş istiridye, kültür mantarı, renkli biberler",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Bufalina Pizza (35 Cm.)",
      "price": "300,00 TL",
      "desc": "Domates sosu, suda taze mozarella peyniri, çeri domates, pesto sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Con Pollo Barbeque Pizza (35 Cm.)",
      "price": "280,00 TL",
      "desc": "Domates sosu, mozarella peyniri, kızarmış tavuk dilimleri, ev yapımı barbekü sos, mantar, mısır, renkli biberler",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Della Casa Pizza (35 Cm.)",
      "price": "304,00 TL",
      "desc": "Domates sosu, mozarella peyniri, bolognese kıyma sosu, sucuk, mısır, acılı sarımsaklı sos, parmesan peyniri",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Diavolo Pizza (35 Cm.)",
      "price": "304,00 TL",
      "desc": "Domates sosu, mozarella peyniri, ev yapımı acılı sarımsak sosunda yoğurulmuş kangal sucuk dilimleri, mantar çeşitleri, kırmızı soğan",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "El Tocino Pizza (35 Cm.)",
      "price": "325,00 TL",
      "desc": "Domates sosu, mozarella peyniri, pastırma, sucuk, hindi jambon, sosis, mantar çeşitleri, pesto sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Frutti Di Mare Pizza (35 Cm.)",
      "price": "348,00 TL",
      "desc": "Domates sosu, mozarella peyniri, tavada sotelenmiş deniz ürünleri, kırmızı soğan, mısır, sarımsaklı pesto sos, dereotu",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Quattro Formaggi Pizza (35 Cm.)",
      "price": "300,00 TL",
      "desc": "Domates sosu, mozarella peyniri, beyaz peynir, parmesan peyniri, zeytin dilimleri, pasto sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Margaritha Pizza (35 Cm.)",
      "price": "253,00 TL",
      "desc": "Domates sosu, mozarella peyniri, çeri domates",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Ortalana Pizza (35 Cm.)",
      "price": "450,00 TL",
      "desc": "Domates sosu, mozarella peyniri, pastırma dilimleri, mantar çeşitleri, kırmızı soğan, acılı sarımsaklı sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Salsiccia Pizza (35 Cm.)",
      "price": "290,00 TL",
      "desc": "Domates sosu, mozzarella peyniri, sucuk, sosis, mısır",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Soriso Speciale Pizza (35 Cm.)",
      "price": "460,00 TL",
      "desc": "Domates sosu, mozarella peyniri, kızarmış dana bonfile dilimleri, pesto sosunda yoğurulmuş, istiridye mantarı, küf mantarı, kırmızı soğan, renkli biberler, roka, parmesan peyniri",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Spinaci Pizza (35 Cm.)",
      "price": "280,00 TL",
      "desc": "Domates sosu, mozarella peyniri, tavada ıspanak, kırmızı soğan, sarımsak, beyaz peynir, mısır",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Tonna E'cipolla Pizza (35 Cm.)",
      "price": "300,00 TL",
      "desc": "Domates sosu, mozarella peyniri, ton balığı, kırmızı soğan, mısır, renkli biberler, sarımsaklı pesto sos, dereotu",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Costola Pizza (36 Cm.)",
      "price": "395,00 TL",
      "desc": "Domates sosu, mozzarella peyniri, dana kaburga eti, soğan, mantar",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "Funghi Pizza (35 Cm.)",
      "price": "273,00 TL",
      "desc": "Domates sos, mozzarella peyniri, mantar, pesto sos",
      "category": "Büyük Boy Pizzalar (35 Cm.)"
    },
    {
      "name": "All Arrabbiata",
      "price": "145,00 TL",
      "desc": "Chili domates sosu, renkli biberler, kırmızı soğan, siyah zeytin, dilimleri, çeri domates, sarımsak, parmesan peyniri, taze fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Bolognese",
      "price": "167,00 TL",
      "desc": "",
      "category": "Makarnalar"
    },
    {
      "name": "Con Pollo Efunghi",
      "price": "161,00 TL",
      "desc": "Kremalı mantar sosu, tavuk dilimleri, renkli biberler, parmesan peyniri, taze fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Fileto Di Manzo",
      "price": "195,00 TL",
      "desc": "Kremalı ıspanaklı istiridye, mantar sosu, kızarmış dana bonfile dilimleri, parmesan peyniri, taze fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Frutti Di Mare",
      "price": "180,00 TL",
      "desc": "Dereotlu sarımsaklı domates sosunda karışık deniz ürünleri, çeri domates, parmesan peyniri, taze fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Lasagne Al Forno",
      "price": "220,00 TL",
      "desc": "",
      "category": "Makarnalar"
    },
    {
      "name": "Napolitana",
      "price": "141,00 TL",
      "desc": "",
      "category": "Makarnalar"
    },
    {
      "name": "Tonno E'cipolla",
      "price": "161,00 TL",
      "desc": "Sarımsaklı kırmızı soğanlı siyah zeytin, dilimli domates sosu, ton balığı, parmesan peyniri, taze fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Lasagne Spinaci",
      "price": "165,00 TL",
      "desc": "Ev yapımı ıspanaklı kremalı lazanya, mozzarella peyniri, parmesan peyniri, fesleğen",
      "category": "Makarnalar"
    },
    {
      "name": "Tortelini Quatro",
      "price": "161,00 TL",
      "desc": "Parmesan peyniri, rokfor peyniri, ricotta peyniri, emmantel peyniri",
      "category": "Makarnalar"
    },
    {
      "name": "Ravioli",
      "price": "161,00 TL",
      "desc": "Közlenmiş patlıcan, mozzarella peyniri",
      "category": "Makarnalar"
    },
    {
      "name": "Minestrone Çorbası",
      "price": "55,00 TL",
      "desc": "Karışık sebze",
      "category": "Çorbalar"
    },
    {
      "name": "Köz Domates Çorbası",
      "price": "55,00 TL",
      "desc": "Közlenmiş domates, mozzarella peyniri",
      "category": "Çorbalar"
    },
    {
      "name": "Caprese",
      "price": "126,00 TL",
      "desc": "Pesto sosu ile harmanlanmış suda taze mozarella peyniri, çeri domates dilimleri, roka, taze fesleğen",
      "category": "Salatalar"
    },
    {
      "name": "Ton Balıklı Salata",
      "price": "130,00 TL",
      "desc": "Ton balığı, taze yeşillikler, çeri domates, salatalık, mısır, zetin dilimleri, kırmızı soğan",
      "category": "Salatalar"
    },
    {
      "name": "Akdeniz Salatası",
      "price": "113,00 TL",
      "desc": "Mevsimlik taze yeşillikler, roka, çeri domates, salatalık",
      "category": "Salatalar"
    },
    {
      "name": "Con Pollo Salata",
      "price": "105,00 TL",
      "desc": "Tavuk, badem, taze yeşillikler, domates, salatalık, soğan",
      "category": "Salatalar"
    },
    {
      "name": "Roka Salatası",
      "price": "123,00 TL",
      "desc": "Taze roka, çeri domates, parmesan peyniri, pestolu balzamik sos",
      "category": "Salatalar"
    },
    {
      "name": "Tiramisu",
      "price": "100,00 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Coca-cola Zero Sugar (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-cola (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-cola Şekersiz (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fuse Tea (33 Cl.)",
      "price": "35,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Ayran (30 Cl.)",
      "price": "24,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 Cl.)",
      "price": "25,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Su (50 Cl.)",
      "price": "15,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Pesto Sos (190 Cc.)",
      "price": "85,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Acı Sos (190 Cc.)",
      "price": "85,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Ballı Hardal Sos (190 Cc.)",
      "price": "65,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Barbekü Sos (190 Cc.)",
      "price": "65,00 TL",
      "desc": "",
      "category": "Soslar"
    }
  ]
}
,
  "7235": {
  "name": "Tatlı Cafe Ekler & Profiterol",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/w8a5/tatli-cafe-ekler-and-profiterol",
  "sourceName": "Yemeksepeti canlı Tatlı Cafe Ekler & Profiterol menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Aşure",
      "price": "318,75 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Çikolata Soslu Bask Cheesecake (Dilim)",
      "price": "333,75 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Frambuaz Soslu Bask Cheesecake (Dilim)",
      "price": "333,75 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Hayrabolu Peynir Tatlısı (3 Adet)",
      "price": "405 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "İrmikli Şam Tatlısı (4 Adet)",
      "price": "206,25 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Kaymaklı Fıstıklı Şambali (2 Dilim)",
      "price": "165 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Hayrabolu Peynir Tatlısı (6 Adet)",
      "price": "742,50 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Kaymaklı Hayrabolu Tatlısı (3 Adet)",
      "price": "487,50 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Hayrabolu Peynir Tatlısı (Adet)",
      "price": "135 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Ev Yapımı Revani (Dilim)",
      "price": "210 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Vişneli Ev Yapımı Revani dilim",
      "price": "285 TL",
      "desc": "",
      "category": "Tatlı Cafe Special Tatlılar"
    },
    {
      "name": "Biscoff Spoonful cup",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Nutella Cream Puff Paris Ekler (6 Adet)",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Sütlaç",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Tavukgöğsü Tatlısı",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Bademli Keşkül",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Çilekli Tiramisu Cup",
      "price": "318,75 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Oreolu Tiramisu Cup",
      "price": "318,75 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Yaban Mersinli Çilekli Tiramisu Cup",
      "price": "318,75 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Klasik Tiramisu Cup",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Kazandibi",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Muzlu Mini Rulo Pasta (3 Adet)",
      "price": "262,50 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Çömlekte Fındıklı Fırın Sütlaç",
      "price": "296,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Çikolatalı Çiçekli Mini Rulo Pasta (3 Adet)",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "6'lı Makaron",
      "price": "224,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Karamelli Trileçe",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Frambuazlı Trileçe",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Çikolatalı Supangle",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Çikolatalı Profiterol (Cam Kavanoz)",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Spoonful Cup",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Meyveli Spoonful",
      "price": "330 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Ruby Çikolatalı Spoonful",
      "price": "300 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Kitkat Sarma Rulo Pasta (3 Adet)",
      "price": "311,25 TL",
      "desc": "",
      "category": "Sütlü Çikolatalı Tatlılar"
    },
    {
      "name": "Karışık Ekler (8 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Orman Meyveli Mini Ekler Pasta (8 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Belçika Çikolatalı Mini Ekler Pasta (7 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Lotuslu Ekler (7 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Beyaz Çikolata Dolgulu Belçika Çikolatalı Ekler (7 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Cream Puff Paris Ekler (6 Adet)",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Limonlu Ekler 7 adet",
      "price": "307,50 TL",
      "desc": "",
      "category": "Eklerler"
    },
    {
      "name": "Kakaolu Klasik Şirin",
      "price": "90 TL",
      "desc": "",
      "category": "İzmir Bombalar"
    },
    {
      "name": "Çilekli Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Muzlu Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Oreolu Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Oreolu Muzlu Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Oreolu Çilekli Cup",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Kadayıflı Muhallebi",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Oreolu & Meyveli Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Krep Kırıklı Çilekli Mag",
      "price": "300 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Lotuslu Çilekli Mag",
      "price": "318,75 TL",
      "desc": "",
      "category": "Mags"
    },
    {
      "name": "Antep Fıstıklı Soğuk Kadayıf",
      "price": "285 TL",
      "desc": "",
      "category": "Baklavalar"
    },
    {
      "name": "Soğuk Baklava 4 Dilim",
      "price": "300 TL",
      "desc": "",
      "category": "Baklavalar"
    },
    {
      "name": "Alpedo Süt Damlası Sade Dondurma (500 gr.)",
      "price": "367,50 TL",
      "desc": "",
      "category": "Dondurmalar"
    },
    {
      "name": "Kesme Dondurma (70 gr.)",
      "price": "90 TL",
      "desc": "",
      "category": "Dondurmalar"
    },
    {
      "name": "Alpedo Kol Dondurma 900 gr",
      "price": "637,50 TL",
      "desc": "",
      "category": "Dondurmalar"
    },
    {
      "name": "Niğde Gazozu (25 cl.)",
      "price": "90 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Limonlu Soda (20 cl.)",
      "price": "60 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Su (33 cl.)",
      "price": "30 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Lipton Ice Tea Şeftali (25 cl.)",
      "price": "90 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (25 cl.)",
      "price": "90 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 cl.)",
      "price": "60 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Sütlü Çikolatalı Antep Fıstıklı Soğuk Baklava (16 Dilim)",
      "price": "1.143,75 TL",
      "desc": "",
      "category": "Şerbetli Tatlılar & Soğuk Baklavalar & Kadayıflar"
    },
    {
      "name": "Sütlü Çikolatalı Antep Fıstıklı Soğuk Baklava (8 Dilim)",
      "price": "592,50 TL",
      "desc": "",
      "category": "Şerbetli Tatlılar & Soğuk Baklavalar & Kadayıflar"
    },
    {
      "name": "Antep Fıstıklı Sütlü Soğuk Kadayıf (2,5 Dilim)",
      "price": "592,50 TL",
      "desc": "",
      "category": "Şerbetli Tatlılar & Soğuk Baklavalar & Kadayıflar"
    },
    {
      "name": "İrmikli Şambali Tatlısı (500 gr.)",
      "price": "431,25 TL",
      "desc": "",
      "category": "Şerbetli Tatlılar & Soğuk Baklavalar & Kadayıflar"
    },
    {
      "name": "Revani Ev Yapımı 500 gr",
      "price": "442,50 TL",
      "desc": "",
      "category": "Şerbetli Tatlılar & Soğuk Baklavalar & Kadayıflar"
    },
    {
      "name": "Nutella Kremalı Paris Ekler (12 Adet)",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Ekstra Profiterol (500 gr.)",
      "price": "577,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Belçika Çikolatalı Mini Ekler Pasta (13 Adet)",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Beyaz Çikolata Dolgulu Belçika Çikolatalı Mini Ekler Pasta (1 kg.)",
      "price": "937,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Profiterol (1 kg.)",
      "price": "937,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Beyaz Çikolata Dolgulu Belçika Çikolatalı Ekler (13 Adet",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Karışık Ekler (13 Adet)",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Karışık Mini Ekler Pasta (1 kg.)",
      "price": "937,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Mini Ekler Pasta (1 kg.)",
      "price": "937,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Karışık Ekler & Mini Rulo Pasta (7 Ekler 3 Rulo pasta)",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Çikolatalı & Çilekli Mini Rulo Pasta (500 gr.)",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Kokteyl Kazandibi (500 gr.)",
      "price": "592,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    },
    {
      "name": "Kitkat Sarma Mini Rulo 500 gr",
      "price": "562,50 TL",
      "desc": "",
      "category": "Kiloluk Ekler & Profiteroller"
    }
  ]
}
,
  "7236": {
  "name": "Rakun B. Burger Cafe",
  "sourceUrl": "https://www.migros.com.tr/yemek/rakun-b-burger-cafe-besiktas-turkali-mah-st-2fc91",
  "sourceName": "Migros Yemek canlı Rakun B. Burger Cafe menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "2'Li Cheesburger Menü",
      "price": "990,00 TL",
      "desc": "2 Adet Cheeseburger + 2 Adet Patates Kızartması + Coca-Cola (1 L.)",
      "category": "Menüler"
    },
    {
      "name": "2'Li Tavuk Burger Menü",
      "price": "860,00 TL",
      "desc": "2 Adet Chicken Burger + 2 Adet Patates Kızartması + Coca-Cola (1 L.)",
      "category": "Menüler"
    },
    {
      "name": "Tavuk Burger & Cheeseburger Menü",
      "price": "925,00 TL",
      "desc": "Chips Chicken + Cheeseburger + 2 Adet Patates Kızartması + Coca-Cola (1 L.)",
      "category": "Menüler"
    },
    {
      "name": "Orijinal Cheeseburger",
      "price": "495,00 TL",
      "desc": "150 gr. dana burger köftesi, karamelize soğan, double cheddar peyniri. Rakun B. sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Barbekü Burger",
      "price": "505,00 TL",
      "desc": "150 gr. dana burger köftesi, cheddar peyniri, ev yapımı mor lahana turşusu, karamelize soğan, barbekü sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Şitaki Burger",
      "price": "580,00 TL",
      "desc": "150 gr. dana burger köftesi, parmesan frico, şitaki mantarı, kurutulmuş domates, karamelize soğan. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Mantar Burger",
      "price": "555,00 TL",
      "desc": "150 gr. dana burger köftesi, edam peyniri, dana jambon, trüflü B sos, tereyağlı mantar. Ev yapımı patates kızartması",
      "category": "Burgerler"
    },
    {
      "name": "Saint Jean Burger",
      "price": "560,00 TL",
      "desc": "150 gr. dana burger köftesi, kolot peyniri, kızarmış yumurta, tereyağlı mantar, ev yapımı mor lahana turşusu, jean sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Rakun Burger",
      "price": "770,00 TL",
      "desc": "300 gr. double dana burger köftesi, cheddar peyniri, füme peyniri, füme dana kaburga, dana jambon, pastırma, karamelize soğan, közlenmiş kapya biber, B. sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Kızgın Rakun Burger",
      "price": "505,00 TL",
      "desc": "150 gr. dana burger köftesi, cheddar peyniri, jalapeno biberi, karamelize soğan, kızgın Rakun sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Rokfor Burger",
      "price": "560,00 TL",
      "desc": "150 gr. dana burger köftesi, rokfor peyniri, füme dana kaburga, Rakun B. sos. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Smash Rakun Burger",
      "price": "560,00 TL",
      "desc": "130 gr. dana smash köftesi, double cheddar peyniri, çemensiz pastırma. Patates kızartması ile",
      "category": "Burgerler"
    },
    {
      "name": "Orjinal Smash",
      "price": "510,00 TL",
      "desc": "130 gr. smash burger köftesi, double cheddar peyniri, Alman turşusu, Alman turşusu, hardal, ketçap, patates kızartması",
      "category": "Burgerler"
    },
    {
      "name": "Chips Chicken Burger",
      "price": "430,00 TL",
      "desc": "Panelenmiş tavuk but, cheddar peyniri, Alman turşusu, rakun sos. Patates kızartması ile servis edilir.",
      "category": "Tavuk Burgerler"
    },
    {
      "name": "Hot Chicken Burger",
      "price": "440,00 TL",
      "desc": "Panelenmiş tavuk but ızgara, cheddar peyniri, jalapeno biber turşusu, acı sos. Patates kızartması ile",
      "category": "Tavuk Burgerler"
    },
    {
      "name": "Barbekü Tavuk Burger",
      "price": "440,00 TL",
      "desc": "Panelenmiş çıtır but ızgara, cheddar peyniri, mor lahana turşusu, barbekü sos. Patates kızartması ile servis edilir.",
      "category": "Tavuk Burgerler"
    },
    {
      "name": "Jungle Vegan Burger",
      "price": "525,00 TL",
      "desc": "(Klasik burger şeklinde sunulmamaktadır.) Vegan burger köftesi, vegan tortilla ekmeği, marul, domates, humus, ev yapımı mor lahana turşusu, ızgara havuç, ev yapımı patates kızartması",
      "category": "Vegan Burgerler"
    },
    {
      "name": "Loris Vegan Burger",
      "price": "540,00 TL",
      "desc": "(Klasik burger şeklinde sunulmamaktadır.) Vegan schnitzel, vegan tortilla ekmeği, marul, salatalık turşusu, humus, kibrit patates, ızgara havuç, ev yapımı patates kızartması",
      "category": "Vegan Burgerler"
    },
    {
      "name": "Çıtır Vejiburger",
      "price": "515,00 TL",
      "desc": "Vejeteryan schinitzel, kızarmış kaşar peyniri, kibrit patates kızartması, salatalık turşusu, mayonez, marul. Patates kızartması ile",
      "category": "Vejetaryen Burgerler"
    },
    {
      "name": "Vejiburger",
      "price": "505,00 TL",
      "desc": "Vejeteryan burger köftesi, cheddar peyniri, karamelize soğan, sotelenmiş mantar, marul. Patates kızartması ile",
      "category": "Vejetaryen Burgerler"
    },
    {
      "name": "Patates Kızartması",
      "price": "180,00 TL",
      "desc": "",
      "category": "Yan Ürünler"
    },
    {
      "name": "Baharatlı Patates Kızartması",
      "price": "185,00 TL",
      "desc": "",
      "category": "Yan Ürünler"
    },
    {
      "name": "Parmesanlı Patates Kızartması",
      "price": "220,00 TL",
      "desc": "",
      "category": "Yan Ürünler"
    },
    {
      "name": "Soğan Halkası (6 Adet)",
      "price": "280,00 TL",
      "desc": "Çıtır soğan halkası",
      "category": "Yan Ürünler"
    },
    {
      "name": "Mozzarella Sticks (6 Adet)",
      "price": "300,00 TL",
      "desc": "",
      "category": "Yan Ürünler"
    },
    {
      "name": "Ortaya Karışık",
      "price": "300,00 TL",
      "desc": "Patates kızartması, 6 adet soğan halkası, 4 adet mozzarella sticks",
      "category": "Yan Ürünler"
    },
    {
      "name": "Coca-Cola Zero Sugar (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Lipton IceTea (33 cl.)",
      "price": "90,00 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Arslan Ayran (25 Cl.)",
      "price": "80,00 TL",
      "desc": "Cam şişe",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 Cl.)",
      "price": "55,00 TL",
      "desc": "Cam şişe",
      "category": "İçecekler"
    },
    {
      "name": "Su (33 cl.)",
      "price": "45,00 TL",
      "desc": "Cam şişe",
      "category": "İçecekler"
    },
    {
      "name": "Hardal",
      "price": "20,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Acı Sos",
      "price": "20,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Rakun B. Sos",
      "price": "20,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Mayonez",
      "price": "15,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Meat Sos",
      "price": "20,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Barbekü Sos",
      "price": "20,00 TL",
      "desc": "",
      "category": "Soslar"
    },
    {
      "name": "Ketçap",
      "price": "15,00 TL",
      "desc": "",
      "category": "Soslar"
    }
  ]
}
,
  "7238": {
  "name": "Waffle Check",
  "sourceUrl": "https://www.migros.com.tr/yemek/waffle-check-besiktas-sinanpasa-mah-st-20eb3",
  "sourceName": "Migros Yemek canlı Waffle Check menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Açık Waffle",
      "price": "350,00 TL",
      "desc": "Muz, çilek, kivi, çikolata",
      "category": "WAFFLE'S"
    },
    {
      "name": "Waffle Bowl | Çilek&browni",
      "price": "350,00 TL",
      "desc": "Özel Waffle Hamuru parçaları Üzerine : Çilek ,Sütlü Çikolata , Beyaz Çikolata , Çilek Çikolata Sosu , Antep Fıstığı Toz , Pirinç Patlakları, Browni ve Gofret Parçacıkları.",
      "category": "WAFFLE'S"
    },
    {
      "name": "Waffle Bowl | Beyaz Kriz",
      "price": "350,00 TL",
      "desc": "Özel Waffle Hamuru parçaları Üzerine : Muz , Çilek , Beyaz Çikolata , Pirinç Fındık , Pirinç Patlakları , Gofret Parçacıkları.",
      "category": "WAFFLE'S"
    },
    {
      "name": "Muz&çilek Atomix Waffle",
      "price": "350,00 TL",
      "desc": "Özel Waffle Hamuru Üzerine : Muz , Çilek , Sütlü Çikolata , Beyaz Çikolata , Antep Fıstığı Toz, Lotus Bisküvi Parçaları , Pirinç Fındık , Pirinç Patlakları.",
      "category": "WAFFLE'S"
    },
    {
      "name": "Waffle Check Special Large",
      "price": "599,00 TL",
      "desc": "Belçika waffle hamuru üzerine: muz, çilek, sütlü çikolata, beyaz çikolata, antep fıstığı tozu, fındık, sütlü ve beyaz damla çikolataları, gofret parçacıkları, rulokat, çilek krep kırığı parçaları.",
      "category": "WAFFLE'S"
    },
    {
      "name": "2 Waffle Ve 2 Limonata Menü",
      "price": "800,00 TL",
      "desc": "2 adet klasik Waffle ve 2 adet Limonata",
      "category": "Menüler"
    },
    {
      "name": "Waffle & Filtre Kahve Menü",
      "price": "400,00 TL",
      "desc": "Klasik Waffle + Filtre Kahve",
      "category": "Menüler"
    },
    {
      "name": "4'Lü Ice Latte Fırsat Menü",
      "price": "600,00 TL",
      "desc": "4 adet Ice Latte",
      "category": "Menüler"
    },
    {
      "name": "Muzlu Waffle & Latte Menü",
      "price": "450,00 TL",
      "desc": "Muzlu Waffle + Latte",
      "category": "Menüler"
    },
    {
      "name": "2 Klasik Waffle 2 Ice Latte Menü",
      "price": "1.000,00 TL",
      "desc": "2 adet waffle ve 2 adet buz gibi soğuk Latte",
      "category": "Menüler"
    },
    {
      "name": "Waffle Bowl | Mix",
      "price": "350,00 TL",
      "desc": "Özel Waffle Hamuru parçaları Üzerine : Muz , Çilek , Kivi ,Sütlü Çikolata , Beyaz Çikolata , Bitter Çikolata , Antep Fıstığı Toz, Pirinç Fındık , Pirinç Patlakları , Rulo kat , Browni .",
      "category": "Menüler"
    },
    {
      "name": "Muz Mix Waffle",
      "price": "350,00 TL",
      "desc": "Özel Waffle Hamuru Üzerine : Muz , Sütlü Çikolata , Beyaz Çikolata , Bitter Çikolata , Antep Fıstığı Toz, Pirinç Fındık , Pirinç Patlakları , Rulo kat , Browni . Gofret Parçacıkları.",
      "category": "Menüler"
    },
    {
      "name": "Iced Filtre Kahve",
      "price": "250,00 TL",
      "desc": "Soğuk servis edilir.",
      "category": "Soğuk Kahveler"
    },
    {
      "name": "Iced Americano",
      "price": "250,00 TL",
      "desc": "Soğuk servis edilir.",
      "category": "Soğuk Kahveler"
    },
    {
      "name": "Iced Latte",
      "price": "250,00 TL",
      "desc": "Soğuk servis edilir.",
      "category": "Soğuk Kahveler"
    },
    {
      "name": "Iced Mocha",
      "price": "250,00 TL",
      "desc": "Soğuk servis edilir.",
      "category": "Soğuk Kahveler"
    },
    {
      "name": "Buzlu Türk Kahvesi",
      "price": "250,00 TL",
      "desc": "Soğuk servis edilir.",
      "category": "Soğuk Kahveler"
    },
    {
      "name": "Chocobomba",
      "price": "200,00 TL",
      "desc": "Bardak",
      "category": "Chocoffee Specials"
    },
    {
      "name": "Choco Peanut Milkshake",
      "price": "250,00 TL",
      "desc": "Yer fıstığı, dondurma (Kafeinsiz)",
      "category": "Milkshakes"
    },
    {
      "name": "Chocolate Milkshake",
      "price": "250,00 TL",
      "desc": "Çikolata, dondurma",
      "category": "Milkshakes"
    },
    {
      "name": "Strawberry Milkshake",
      "price": "250,00 TL",
      "desc": "Çilek, dondurma",
      "category": "Milkshakes"
    },
    {
      "name": "Espresso Milkshake",
      "price": "250,00 TL",
      "desc": "Espresso, dondurma",
      "category": "Milkshakes"
    },
    {
      "name": "Banana Milkshake",
      "price": "250,00 TL",
      "desc": "Muz, dondurma",
      "category": "Milkshakes"
    },
    {
      "name": "Limonata",
      "price": "150,00 TL",
      "desc": "Bardak",
      "category": "Soğuk İçecekler"
    },
    {
      "name": "Churchill",
      "price": "150,00 TL",
      "desc": "Soda, tuz, limon karışımı (Soğuk servis edilir.)",
      "category": "Soğuk İçecekler"
    },
    {
      "name": "Su (50 Cl.)",
      "price": "50,00 TL",
      "desc": "Pet şişe",
      "category": "Soğuk İçecekler"
    }
  ]
}
,
  "7239": {
  "name": "Luglio Italian",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/ab7k/luglio-italian-makarna-ab7k",
  "sourceName": "Yemeksepeti canlı Luglio Italian Makarna menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Pesto Soslu Penne",
      "price": "324 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "4 Peynirli Penne",
      "price": "336 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Kıymalı Mac And Cheese",
      "price": "352 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Mac And Cheese",
      "price": "324 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Spagetti Bolonez",
      "price": "352 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Tavuklu Mantarlı Penne",
      "price": "344 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Domates Soslu Penne",
      "price": "324 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Salçalı Spaghetti",
      "price": "324 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "Paris Soslu Tavuklu Penne",
      "price": "336 TL",
      "desc": "",
      "category": "Soslu Makarnalar"
    },
    {
      "name": "El Yapımı Fettuccine Alfredo (550 gr.)",
      "price": "368 TL",
      "desc": "",
      "category": "El Yapımı Fettuccine Makarnalar"
    },
    {
      "name": "El yapımı Fettuccine Bolonez (450 gr.)",
      "price": "380 TL",
      "desc": "",
      "category": "El Yapımı Fettuccine Makarnalar"
    },
    {
      "name": "El Yapımı Fettuccine Pomodoro (330 gr.)",
      "price": "352 TL",
      "desc": "",
      "category": "El Yapımı Fettuccine Makarnalar"
    },
    {
      "name": "El Yapımı Fettuccine Pesto (330 gr.)",
      "price": "352 TL",
      "desc": "",
      "category": "El Yapımı Fettuccine Makarnalar"
    },
    {
      "name": "Luglio Dağ Kekikli Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Sweet Chili Soslu Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Köri Soslu Mantarlı Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "BBQ Soslu Mantarlı Biberli Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Soya Soslu Mantarlı Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Mantar Soslu Izgara Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Cafe de Paris Soslu Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Cheddar Soslu Tavuk",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    },
    {
      "name": "Meksika Soslu Tavuk(Acılı)",
      "price": "408 TL",
      "desc": "",
      "category": "Tavuklar"
    }
  ]
}
,
  "7240": {
  "name": "Kasap Lahmacun Kebap Plus",
  "sourceUrl": "https://www.yemeksepeti.com/en/restaurant/p41d/kasap-lahmacun",
  "sourceName": "Yemeksepeti canlı Kasap Lahmacun menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Mercimek Çorbası",
      "price": "157,50 TL",
      "desc": "",
      "category": "Çorbalar"
    },
    {
      "name": "Kuzu Lokum (Yağlı Kara)",
      "price": "630 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Patlıcanlı Kebap",
      "price": "630 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Kuzu Pirzola",
      "price": "900 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Alinazik",
      "price": "675 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Özel Yaprak Kanat",
      "price": "495 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Ciğer Şiş (Kuzu)",
      "price": "585 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Mardin Zırh Kebap",
      "price": "540 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Beyti",
      "price": "540 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Urfa Zırh Kebap",
      "price": "495 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Kuzu Şiş",
      "price": "630 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Çöp Şiş",
      "price": "585 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Adana Zırh Kebap",
      "price": "495 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Tavuk Şiş",
      "price": "405 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Kasap Köfte",
      "price": "450 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Karışık Izgara (Tek Kişilik)",
      "price": "990 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Kasap Karışık (Tek Kişilik)",
      "price": "1.575 TL",
      "desc": "",
      "category": "IZGARALAR"
    },
    {
      "name": "Tavuk Şiş Dürüm",
      "price": "315 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Urfa Dürüm",
      "price": "360 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Lahmacun Arası Kebap",
      "price": "450 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Kuzu Ciğer Dürüm",
      "price": "405 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Çöp Şiş Dürüm",
      "price": "405 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Adana Dürüm",
      "price": "360 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Kuzu Şiş Dürüm",
      "price": "405 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Fındık Lahmacun",
      "price": "144 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Lahmacun",
      "price": "180 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Nar Ekşili Kasap Lahmacun",
      "price": "189 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Patlıcanlı Lahmacun",
      "price": "202,50 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Sarımsaklı Lahmacun",
      "price": "202,50 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Yumurtalı Kasap Lahmacun",
      "price": "198 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Kaşarlı Lahmacun",
      "price": "207 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Cevizli Lahmacun",
      "price": "207 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Mantarlı Kaşarlı Kasap Lahmacun",
      "price": "216 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Karışık Lahmacun",
      "price": "216 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Sembusek (Kapalı Mardin Lahmacunu)",
      "price": "180 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Cevizli Nar Ekşili Lahmacun",
      "price": "207 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Pastırmalı Kaşarlı Pide",
      "price": "427,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Tavuklu Pide",
      "price": "337,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Tavuklu Kaşarlı Pide",
      "price": "360 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Pizza Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Köfteli Pide",
      "price": "427,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kaşar Peynirli Pide",
      "price": "297 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Karışık Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kuşbaşılı Pide",
      "price": "405 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kıymalı Kaşarlı Pide",
      "price": "337,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kavurmalı Kaşarlı Pide",
      "price": "427,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Sebzeli Pide",
      "price": "360 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kaşarlı Sucuklu Pide",
      "price": "387 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kaşarlı Mantarlı Pide",
      "price": "360 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kuşbaşılı Kaşarlı Pide",
      "price": "427,50 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Pastırmalı Cheddar Peynirli Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kuşbaşılı Kaşarlı Cheddar Peynirli Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kıymalı Pide",
      "price": "315 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Kavurmalı Cheddar Peynirli Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Pideler"
    },
    {
      "name": "Tavuk Sote Güveç",
      "price": "405 TL",
      "desc": "",
      "category": "Tava Ürünleri"
    },
    {
      "name": "Güveçte Sucuk",
      "price": "405 TL",
      "desc": "",
      "category": "Tava Ürünleri"
    },
    {
      "name": "Güveçte Kaşarlı Köfte",
      "price": "405 TL",
      "desc": "",
      "category": "Tava Ürünleri"
    },
    {
      "name": "Kuzu Güveç",
      "price": "630 TL",
      "desc": "",
      "category": "Tava Ürünleri"
    },
    {
      "name": "Dana Güveç",
      "price": "630 TL",
      "desc": "",
      "category": "Tava Ürünleri"
    },
    {
      "name": "Sütlü Soğuk Kadayıf",
      "price": "211,50 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Nutellalı Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Simit Katmer (2-3 Kişilik)",
      "price": "585 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Özel Fırın Sütlaç",
      "price": "180 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Supangele",
      "price": "211,50 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Özel Kazandibi",
      "price": "180 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "El Yapımı Profiterol",
      "price": "211,50 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Özel Yaprak Katmer",
      "price": "585 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Coca-Cola (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Light (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Cappy (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fuse Tea (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Lipton Ice Tea (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Özerhisar Ayran (33 cl.)",
      "price": "76,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Limonlu Soda (20 cl.)",
      "price": "54 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 cl.)",
      "price": "45 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Su (33 cl.)",
      "price": "36 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (1 L.)",
      "price": "108 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (1 L.)",
      "price": "85,50 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Zero Sugar (1 L.)",
      "price": "108 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (1 L.)",
      "price": "108 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Suyu (1 L.)",
      "price": "108 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Özerhisar Ayran (1 L.)",
      "price": "153 TL",
      "desc": "",
      "category": "İçecekler"
    }
  ]
}
,
  "7241": {
  "name": "WAMA’S",
  "sourceUrl": "https://qr.finedinemenu.com/wama-s-beyoglu/menu/668931c8090c66ed86d3882c",
  "sourceName": "FineDine resmi WAMA’S Beyoğlu QR menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Sharing Breakfast (FOR 2 PEOPLE)",
      "price": "1480 TL",
      "desc": "“Ezine” White Cheese, Trakya  Aged Kashkaval Cheese, Knitted  Cheese, Curd Cheese, Gemlik Black Olives, Edremit  Green Olives, Black Mullberry  Jam, Ajvar, Muhammara, Honey, Butter, Tomatoes, Cucumber,  Nutella, Tahini-Grape Molasses,  Green Pepper, Pan-fried Eggs, Grilled Soujouk, Grilled Sausage,  Grilled Halloumi Cheese, Spring  Roll, Baby Potatoes, Turkish Sesam Bagel, with Unlimited Tea",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Village Breakfast",
      "price": "795 TL",
      "desc": "Pan-fried Soujouk, Beef Sausage,  Spring Roll, Grilled Halloumi Cheese, Cherry Tomatoes, Fried Egg On Sourdough Bread, Roasted Baby Potatoes, a Glass of Turkish Tea",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Simit Breakfast",
      "price": "415 TL",
      "desc": "“Simit” with Melted Cheese,  Fried Egg, Gemlik Black  Olives, Cherry Tomatoes,  Cucumber, a Glass of  Turkish Tea",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Pancakes",
      "price": "495 TL",
      "desc": "3 Pieces Pancake, Honey,  Nutella, Seasonal Fruits, a Glass of Turkish Tea",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "\"Menemen\" Scrambled Eggs",
      "price": "375 TL",
      "desc": "Tomato, Egg, Green Pepper",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Omelette with Cheese",
      "price": "365 TL",
      "desc": "Feta Cheese, Cherry  Tomatoes, Cucumber and Mix Greens",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Omelette with Vegetables",
      "price": "365 TL",
      "desc": "Broccoli, Colorful Peppers,  Mushrooms, Cherry Tomatoes, Cucumbers,  Carrots and Mixed Greens",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Omelette with Mushrooms",
      "price": "365 TL",
      "desc": "Cultivated Mushrooms, Cherry Tomatoes, Cucumbers  and Mixed Greens",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Eggs and Soujouk Toast in Village Bread",
      "price": "575 TL",
      "desc": "Ajvar, French Fries  and Pickles",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Mixed Toast",
      "price": "395 TL",
      "desc": "Kashkaval Cheese, Soujouk, Tomatoes,  Cucumber and Mix Greens",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Toast with Cheese",
      "price": "375 TL",
      "desc": "Kashkaval Cheese,  Tomatoes,  Cucumber and Mix  Greens",
      "category": "BREAKFAST & EGGS & TOASTS"
    },
    {
      "name": "Traditional \"Lebeniye Soup\"",
      "price": "395 TL",
      "desc": "Traditional Soup with Mini Meatballs, Fresh Mint and Yoghurt",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "Soup of the Day",
      "price": "255 TL",
      "desc": "Please ask to the waiter",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "French Fries",
      "price": "345 TL",
      "desc": "Hot Coctail Sauce  and Yoghurt Dip",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "French Fries with Melted Cheese",
      "price": "375 TL",
      "desc": "French Fries with Mozzarella, Cheddar Cheese",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "Crispy Chicken",
      "price": "545 TL",
      "desc": "Fried Crispy Chicken with Spicy French Fries, Yoghurt Dip and Sweet Chili Sauce",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "Mezze Tray (For 2 People)",
      "price": "775 TL",
      "desc": "Hummus, Babaganoush, Muhammara, Haydari, Olive Oil  Braised Grape Vine Leaves, Ajvar, Fried Tortilla",
      "category": "SOUP & STARTERS"
    },
    {
      "name": "Mediterranean Salad",
      "price": "485 TL",
      "desc": "Mix Greens, Rocket Leaves, Sweet Corn, Black Olives, White Cheese, Cherry Tomatoes, Cucumber,  Dried Tomatoes, Walnut, Beet, with Olive Oil and Lemon Dressing",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Caesar's Salad (with chicken)",
      "price": "605 TL",
      "desc": "Lettuce, Caesar Sauce, Parmesan Cheese, Cherry Tomatoes, Croutons",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Caesar's Salad (Plain)",
      "price": "425 TL",
      "desc": "Lettuce, Caesar Sauce,  Parmesan Cheese, Cherry  Tomatoes, Croutons",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Falafel Salad",
      "price": "645 TL",
      "desc": "Mediterranean Greens, Falafel,  Cucumber, Cherry Tomatoes,  Olive Oil Lemon Sauce Akdeniz Yeşillikleri, Falafel, Salatalık, Çeri Domates, Zeytinyağlı Limon Sos ile",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Halloumi Salad",
      "price": "580 TL",
      "desc": "Mediterranean Greens, Cyprus  Halloumi Cheese, Fried Tortilla,  Capia Pepper, Green Pepper,  Orange, Cherry Tomatoes, Beet with  Olive Oil Lemon Sauce",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Crispy Chicken Salad",
      "price": "610 TL",
      "desc": "Mediterranean Greens, Crispy Chicken, Green Apple,  Beet, Cherry Tomatoes, Olive Oil Lemon Sauce and with Honey Mustard e",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Siyez Bulghur and Mung Beans Salad with Tulum Cheese",
      "price": "595 TL",
      "desc": "Mix Greens, “Siyez” Bulghur, Mung Beans, Walnut, Dried  Tomatoes, Parsley, Beet, Cherry  Tomatoes, Olive Oil & Lemon  Dressing and “Tulum” Cheese Brule",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Chia&Quinoa Salad with Gravlax Salmon",
      "price": "795 TL",
      "desc": "Mix Greens, Quinoa, Chia, Fresh  Mint, Green Onion, Dill, Cherry Tomatoes, Fried Tortilla, Sour Pomegranate, Capers with Olive Oil Lemon Sauce",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Tandoori Chicken Salad",
      "price": "635 TL",
      "desc": "Mix Greens, Tandoori Sauce Marinated Chicken  Skewers, Baby Potatoes, Cherry Tomatoes,  Mushrooms, Roasted Red Peppers, Beet with  Pomegranate Sauce",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Beef Bowl",
      "price": "945 TL",
      "desc": "Grilled Tender Beef, “Siyez” Couscous,  Greens, Broccoli, Hummus, Bell  Peppers, Mushroom, Sesame and  Olive Oil & Lemon Dressing",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Chicken Bowl",
      "price": "785 TL",
      "desc": "Grilled Chicken Cutlet, “Siyez” Couscous, Greens, Avocado,  Bell Peppers, Tomatoes, Mung  Beans, Cucumber with Olive  Oil and Lemon Dressing",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Grilled Seabass Bowl",
      "price": "925 TL",
      "desc": "Grilled Sea Bass Fillet, “Siyez” Couscous, Greens, Broccoli,  Brussel Sprouts, Avocado, Mung Beans, Edamame,  Artichoke, Cherry Tomatoes, Parsley, Basil Dressing",
      "category": "SALADS & BOWLS"
    },
    {
      "name": "Braised Beef Taco",
      "price": "995 TL",
      "desc": "Taco with Braised Beef, Tomatoes, Onion, Green Peppers and Cheddar Cheese, Served With Sour  Cream, Avocado Dip, Salsa Dip and French Fries",
      "category": "TACO & QUESADILLA"
    },
    {
      "name": "Chicken Quesadilla",
      "price": "875 TL",
      "desc": "Chicken and Sauted Vegetables  Quesadilla, Served with Jalapeno Pepper, Mozzarella  Cheese, Caramelized Onion,  Yogurt Dip, Avocado Dip, Salsa Dip, French Fries and Mix Greens",
      "category": "TACO & QUESADILLA"
    },
    {
      "name": "Beef Quesadilla",
      "price": "975 TL",
      "desc": "Taco with Braised Meat, Jalapeno  Pepper, Sauted Vegetables,  Mexican Beans, Mozzarella  Cheese, Caramelized Onion,  Yogurt Dip, Avocado Dip, Salsa  Dip French Fries and Mix Greens",
      "category": "TACO & QUESADILLA"
    },
    {
      "name": "Fettuccine con Pollo",
      "price": "595 TL",
      "desc": "Fettucine with Chicken Slices, Mushroom, Bell Peppers, Parmesan Cheese and Creamy Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Penne all'Arrabbiata",
      "price": "485 TL",
      "desc": "Penne with Spicy Tomato Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Spaghetti Bolognese",
      "price": "615 TL",
      "desc": "Spaghetti with Bolognese Sauce,  Parmesan Cheese",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Seafood Linguine",
      "price": "825 TL",
      "desc": "Linguine with Shrimp, Mussels,  Vongole, Dill, Garlic and Light Tomatos Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Fettuccine al Salmone",
      "price": "770 TL",
      "desc": "Fettucine with Salmon Pieces, Capers, Garlic, Dill, Rocket  Leaves and Light Cream Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Beef Penne",
      "price": "840 TL",
      "desc": "Penne with Beef Pieces,  Tomatos Sauce, Creamy  Sauce, Pesto Sauce And  Parmesan Cheese",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Rigatoni con Pollo",
      "price": "745 TL",
      "desc": "Chicken Slices, Cheddar Cheese, Mozzarella Cheese,  Parmesan Cheese and Baked Rigatoni with Pesto Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Lasagna",
      "price": "685 TL",
      "desc": "Lasagna with Bolognese Sauce,  Béchamel, Mozzarella Cheese,  Parmesan Cheese with Pesto Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Ravioli Mamma",
      "price": "675 TL",
      "desc": "3 Cheese Ravioli, Tomato Sauce, Cream,  Pesto, Parmesan with Cherry  Tomatoes and Basil",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Mantı",
      "price": "695 TL",
      "desc": "“Manti” with  Yoghurt and Light  Tomato Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Tortellini Funghi",
      "price": "585 TL",
      "desc": "Cream, Mushroom, Garlic,  Olive Oil, Parmesan Cheese  with Green Leaves",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Fusulli (Gluten Free)",
      "price": "470 TL",
      "desc": "Capia Pepper, Cherry Tomatoes, Sliced Olives with Tomato Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Mushroom Risotto",
      "price": "665 TL",
      "desc": "Risotto, Cultivated Mushrooms, Parmesan Cheese, Cherry Tomatoes, with Garlic Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Seafood Risotto",
      "price": "825 TL",
      "desc": "Risotto, Saffron, Calamari, Shrimp,  Stuffed Mussel, Vongole, Cherry  Tomatoes with Garlic Sauce",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Vegetables Noodle",
      "price": "550 TL",
      "desc": "Julienne Vegetables, Soy  Sprout, Green Onion, Sesame, Soy Sauce, Oyster  Sauce, Sweet Chili Dip",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Chicken Noodle",
      "price": "655 TL",
      "desc": "Chicken Slices, Julienne  Vegetables, Soy Sprout,  Green Onion, Sesame, Soy Sauce, Oyster Sauce,  Sweet Chili Dip",
      "category": "PASTA & RISOTTO & NOODLE"
    },
    {
      "name": "Margherita Pizza",
      "price": "525 TL",
      "desc": "Tomato Sauce, Mozzarella Cheese, Cherry Tomatoes, Rocket Leaves, Parmesan Cheese, Pesto Sauce",
      "category": "PIZZA"
    },
    {
      "name": "Chicken Pizza",
      "price": "695 TL",
      "desc": "Tomato Sauce, Mozzarella,  Caramelised Onion, Chicken  Slices, Sweet Corn, Green  Olives, Roasted Peppers,  Fresh Thyme, Parmesan  Cheese, Rocket Leaves with BBQ Sauce",
      "category": "PIZZA"
    },
    {
      "name": "Pepperoni Pizza",
      "price": "755 TL",
      "desc": "Tomato Sauce, Mozzarella Cheese, Beef Pepperoni, Roasted  Peppers, Olive, Tomatoes,  Fresh Thyme, Rocket  Leaves, Parmesan Cheese",
      "category": "PIZZA"
    },
    {
      "name": "4 Cheese Pizza",
      "price": "745 TL",
      "desc": "Mozzarella Cheese, Rokfor Cheese,  Chedar Cheese, Mini Mozzarella,  Dryed Tomatoes, Rocket Leaves,  Parmesan Cheese",
      "category": "PIZZA"
    },
    {
      "name": "Alla Turca Pizza",
      "price": "775 TL",
      "desc": "Tomato Sauce, Mozzarella Cheese, Soujouk,  Salami, Sausage, Mushroom, Sweet Corn, Sliced Olives, Roasted Capia Pepper, Fresh Tyhme, Rocket Leaves, Parmesan Cheese",
      "category": "PIZZA"
    },
    {
      "name": "Cheeseburger",
      "price": "755 TL",
      "desc": "165 gr Burger Meat, Cheddar Cheese, Lettuce, Tomatoes, Cornichons, Caramelised Onion, Coleslaw, Salsa Sauce and French Fries",
      "category": "BURGERS"
    },
    {
      "name": "Double Wama's Burger",
      "price": "1180 TL",
      "desc": "330 gr Burger Meat,  Cheddar Cheese, Lettuce, Tomatoes,  Cornichons, Caramelised Onions, Coleslaw, Salsa Sauce and French Fries",
      "category": "BURGERS"
    },
    {
      "name": "Hamburger",
      "price": "705 TL",
      "desc": "165 gr Burger Meat,  Lettuce, Tomatoes,  Cornichons, Grilled Onion,  Coleslaw, Salsa Sauce and French Fries",
      "category": "BURGERS"
    },
    {
      "name": "Chicken Caesar's Burger",
      "price": "695 TL",
      "desc": "200 gr Grilled Chicken Breast,  Caesar’s Salad, Coleslaw,  Parmesan Cheese Burger with  Salsa Sauce and French Fries",
      "category": "BURGERS"
    },
    {
      "name": "Delux Burger",
      "price": "845 TL",
      "desc": "165 gr Burger Meat, Cheddar Chesee, Beef  Bacon, Lettuce, Tomatoes, Cornichon,  Caramelised Onion, Crispy Potato,  Coleslaw, Salsa Sauce and French Fries",
      "category": "BURGERS"
    },
    {
      "name": "Chicken in Curry Sauce",
      "price": "545 TL",
      "desc": "Chicken Slices 180 gr with Julienne Vegetables, Broccoli and Creamy Curry Sauce Served with Saffron Rice",
      "category": "WHITE MEAT"
    },
    {
      "name": "Sweet & Sour Chicken",
      "price": "655 TL",
      "desc": "Chicken Slices 200 gr with Julienne Vegetables, Sesame and Sweet & Sour Sauce, Served with Saffron Rice",
      "category": "WHITE MEAT"
    },
    {
      "name": "Chicken Schnitzel",
      "price": "715 TL",
      "desc": "Chicken Schnitzel 220. gr with French Fries, Rocket Leaves",
      "category": "WHITE MEAT"
    },
    {
      "name": "Chicken Cutlet",
      "price": "725 TL",
      "desc": "Grilled Chicken Breast Cutlets 200 gr with Grilled Vegetables and Saffron Rice",
      "category": "WHITE MEAT"
    },
    {
      "name": "Grilled Chicken Chops",
      "price": "735 TL",
      "desc": "Grilled Chicken Thigh Chops 350 gr with Saffron Rice, Grilled Tomatoes, Green Pepper, Grilled Onion with Sourdough Village Bread",
      "category": "WHITE MEAT"
    },
    {
      "name": "Lamb Chops with Eggplant Purée (260 gr)",
      "price": "1360 TL",
      "desc": "260 gr Grilled Lamb Chops with Saffron Rice, Eggplant Purée, Grilled Tomatoes and Green Pepper",
      "category": "RED MEAT"
    },
    {
      "name": "Grilled Koftah (200 gr)",
      "price": "785 TL",
      "desc": "Grilled Meatballs 200 gr with French Fries, Yoghurt, Muhammara, Hummus, Grilled Tomatoes and Green Pepper",
      "category": "RED MEAT"
    },
    {
      "name": "Koftah with Yoghurt & Tomato Sauce (200 gr)",
      "price": "825 TL",
      "desc": "Grilled Meatballs on Buttered Pita with Tomato Sauce, Yoghurt, Grilled Tomatoes, Green Peppers and Crispy Potatoes",
      "category": "RED MEAT"
    },
    {
      "name": "Mix Grill Plate (2 people)",
      "price": "1980 TL",
      "desc": "Chicken Chops 350 gr, Tandoori Chicken Skewers 140 gr, Meatballs,80 gr Beef Medallions100 gr, Lamb Chops 130 gr, Saffron Rice, Spicy Lavash, Tomatoes, Green Pepper, Grilled Onion, Roasted Potatoes",
      "category": "RED MEAT"
    },
    {
      "name": "Kebab with Yoghurt (250 gr)",
      "price": "1280 TL",
      "desc": "Tenderloin, Meatballs, Green Pepper, Tomatoes,  Butter, Pita, Yogurt and İskender Sauce",
      "category": "RED MEAT"
    },
    {
      "name": "Beef with Teriyaki Sauce",
      "price": "1055 TL",
      "desc": "Sauted Beef Slices 200 gr, Julienne Vegetables, Sesame and Teriyaki Sauce, Served with Saffron Rice",
      "category": "RED MEAT"
    },
    {
      "name": "Grilled Beef Madalions (200 gr)",
      "price": "1190 TL",
      "desc": "Grilled Beef Medallions, Tomatoes, Rocket Leaves, Parmesan Cheese, Dryed  Tomatos with Balsamic  Glaze Sauce",
      "category": "RED MEAT"
    },
    {
      "name": "Beef Tenderloin with Mushroom Sauce",
      "price": "1180 TL",
      "desc": "Grilled Beef Tenderloin 200 gr with Roasted Potatoes, Grillled Cultivated Mushroom, Sauted Vegetables with Demi Glace and Mushroom Sauce",
      "category": "RED MEAT"
    },
    {
      "name": "Buttered Shrimps",
      "price": "1150 TL",
      "desc": "Sauted Shrimps 200 gr with Mushroom, Garlic, Green Pepper, Shallot and Butter",
      "category": "SEAFOOD"
    },
    {
      "name": "Grilled Seabass (240 gr)",
      "price": "1045 TL",
      "desc": "Grilled Sea Bass 240 gr Fillets with Roasted Potatoes, Sauted Vegetables, Rocket Leaves and Yogurt Dip Sauce",
      "category": "SEAFOOD"
    },
    {
      "name": "Grilled Salmon (200 gr)",
      "price": "1055 TL",
      "desc": "Grilled Salmon Fillet 200 gr with Vegetables “Siyez” Couscous, Sauted Spinach, Rocket Leaves, Potatoes, and Grilled Lemon",
      "category": "SEAFOOD"
    },
    {
      "name": "Hot Chocolate Baklava",
      "price": "455 TL",
      "desc": "Warm Chocolate in Baklava with Vanilla Ice Cream",
      "category": "DESSERTS"
    },
    {
      "name": "Carrot Shaped Baklava with Pistacchio (Plain or Icecream)",
      "price": "525 TL Dondurmalı",
      "desc": "",
      "category": "DESSERTS"
    },
    {
      "name": "Kunafah",
      "price": "505 TL",
      "desc": "",
      "category": "DESSERTS"
    },
    {
      "name": "Ice-cream(3 scoops)",
      "price": "390 TL",
      "desc": "Strawberry, Vanilla, Chocolate",
      "category": "DESSERTS"
    },
    {
      "name": "Apple Crumble",
      "price": "425 TL",
      "desc": "",
      "category": "DESSERTS"
    },
    {
      "name": "San Sebastian Cheesecake",
      "price": "435 TL",
      "desc": "",
      "category": "DESSERTS"
    },
    {
      "name": "Espresso 80cc",
      "price": "155 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Duble Espresso 200 cc",
      "price": "220 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Turkish Coffee 80 cc",
      "price": "170 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Ottoman Coffee 80 cc",
      "price": "170 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Menengic Coffee 80 cc",
      "price": "170 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Americano 280 cc",
      "price": "235 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Macchiato 280 cc",
      "price": "235 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Cappuccino 280 cc",
      "price": "235 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Mocha 280 cc",
      "price": "235 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Latte 280 cc",
      "price": "235 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Ice Latte 280 cc",
      "price": "240 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Ice Americano 280 cc",
      "price": "240 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Ice Mocha 280 cc",
      "price": "240 TL",
      "desc": "",
      "category": "COFFEE"
    },
    {
      "name": "Fresh Apple Juice 350 cc",
      "price": "265 TL",
      "desc": "",
      "category": "COLD DRINKS"
    },
    {
      "name": "Fresh Carrot Juice",
      "price": "265 TL",
      "desc": "",
      "category": "COLD DRINKS"
    },
    {
      "name": "Fresh Orange Juice 350 cc",
      "price": "265 TL",
      "desc": "",
      "category": "COLD DRINKS"
    },
    {
      "name": "Fresh Pomegranate Juice 350 cc",
      "price": "265 TL",
      "desc": "",
      "category": "COLD DRINKS"
    },
    {
      "name": "Detox 350 cc",
      "price": "275 TL",
      "desc": "Ginger, Cucumber, Parsley, Apple",
      "category": "COLD DRINKS"
    },
    {
      "name": "Fresh Energy 350 cc",
      "price": "275 TL",
      "desc": "Orange, Strawberry, Banana",
      "category": "COLD DRINKS"
    },
    {
      "name": "Vitamin C 350 cc",
      "price": "275 TL",
      "desc": "Orange, Lemon, Mint",
      "category": "COLD DRINKS"
    },
    {
      "name": "Milkshake 460 cc",
      "price": "285 TL",
      "desc": "Çikolatalı/Vanilyalı/Çilekli",
      "category": "COLD DRINKS"
    },
    {
      "name": "Frozen 460 cc",
      "price": "290 TL",
      "desc": "Limon/Çilek/Karpuz/Kavun/Şeftali/Orman Meyvesi/Hindistan Cevizi/Mango",
      "category": "COLD DRINKS"
    },
    {
      "name": "Lemonade 350 cc",
      "price": "235 TL",
      "desc": "Lemon/ Strawberry/ Mint/ Ginger/ Berries/ Green Apple",
      "category": "COLD DRINKS"
    },
    {
      "name": "Glass of Turkish Tea 160 cc",
      "price": "89 TL",
      "desc": "",
      "category": "TEA"
    },
    {
      "name": "Cup of Turkish Tea 200 cc",
      "price": "145 TL",
      "desc": "",
      "category": "TEA"
    },
    {
      "name": "Earl Grey 400 cc",
      "price": "210 TL",
      "desc": "",
      "category": "TEA"
    },
    {
      "name": "Fruit & Herbal Tea 400 cc",
      "price": "210 TL",
      "desc": "Apple/ Rosehip/ Sage/ Rose/ Green Tea/ Jasmine/ Linden",
      "category": "TEA"
    },
    {
      "name": "Water 330 mL",
      "price": "98 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Water 750 mL",
      "price": "155 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Ayran 200 cc",
      "price": "145 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Mineral Water 330 cc",
      "price": "155 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Mineral Water with Fruit 200cc",
      "price": "155 TL",
      "desc": "Lemon / Apple",
      "category": "BEVERAGES"
    },
    {
      "name": "Ayran with Basil 200cc",
      "price": "145 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Ayran with Mint 200 cc",
      "price": "145 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Cappy 250 cc",
      "price": "155 TL",
      "desc": "Portakal / Vişne / Kayısı / Şeftali",
      "category": "BEVERAGES"
    },
    {
      "name": "Coca Cola 300 cc",
      "price": "155 TL",
      "desc": "Portakal / Vişne / Kayısı / Şeftali",
      "category": "BEVERAGES"
    },
    {
      "name": "Fanta 300 cc",
      "price": "155 TL",
      "desc": "Portakal / Vişne / Kayısı / Şeftali",
      "category": "BEVERAGES"
    },
    {
      "name": "Sprite 300 cc",
      "price": "155 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "Schweppes 250 cc",
      "price": "155 TL",
      "desc": "Mandalina / Limon",
      "category": "BEVERAGES"
    },
    {
      "name": "Fuse Tea 250 cc",
      "price": "155 TL",
      "desc": "Şeftali / Limon",
      "category": "BEVERAGES"
    },
    {
      "name": "San Pellegrino 250 mL",
      "price": "285 TL",
      "desc": "",
      "category": "BEVERAGES"
    },
    {
      "name": "San Pellegrino 750 mL",
      "price": "395 TL",
      "desc": "",
      "category": "BEVERAGES"
    }
  ]
}
,
  "7244": {
  "name": "Namlı Kebap",
  "sourceUrl": "https://siparis.namlikebap.com.tr/Product",
  "sourceName": "Namlı Kebap resmi sipariş menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Bonfile İskender",
      "price": "1630 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Bulgur Pilav Üstü Döner",
      "price": "820 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Döner 120gr",
      "price": "790 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Döner 150Gr",
      "price": "980 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "İskender",
      "price": "860 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Karışık İskender",
      "price": "1420 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Pirinç Pilav Üstü Döner",
      "price": "820 TL",
      "desc": "",
      "category": "Dönerler"
    },
    {
      "name": "Fırın Sütlaç",
      "price": "310 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "İrmik Helvası",
      "price": "340 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "KREM KRAMEL",
      "price": "330 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Adana Dürüm",
      "price": "760 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Çöp Şiş Dürüm",
      "price": "1010 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Döner Dürüm",
      "price": "730 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Şiş Dürüm",
      "price": "1010 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Tavuk Şiş Dürüm",
      "price": "690 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Urfa Dürüm",
      "price": "760 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Biftek",
      "price": "1240 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Bonfile",
      "price": "1580 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Çöp Şiş",
      "price": "1130 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Külbastı",
      "price": "1150 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Izgara Köfte",
      "price": "820 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "KABURGA",
      "price": "1050 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Karışık Et Özel",
      "price": "1750 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Karışık Izgara",
      "price": "1850 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Küşleme",
      "price": "1680 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "LOKUM",
      "price": "1550 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Pirzola",
      "price": "1570 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Şiş Kebap",
      "price": "1130 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "TAVUK IZGARA BUT",
      "price": "760 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "TAVUK IZGARA GOGUS",
      "price": "760 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "TAVUK KANAT",
      "price": "790 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Tavuk Şiş",
      "price": "760 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "Terbiyeli Şiş",
      "price": "1130 TL",
      "desc": "",
      "category": "Izgaralar"
    },
    {
      "name": "LAHMACUN",
      "price": "250 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "ACILI LAHMACUN",
      "price": "250 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "5 Çayı Lahmacun",
      "price": "170 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "FINDIK LAHMACUN",
      "price": "90 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "5 Çayı Antep Lahmacun",
      "price": "180 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "ANTEP LAHMACUN",
      "price": "280 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "FINDIK ANTEP LAHMACUN",
      "price": "100 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "ADANA KEBAP",
      "price": "810 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Alinazik",
      "price": "1100 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Beğendili Kebap",
      "price": "1220 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Beyti Kebap Acılı",
      "price": "1010 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Beyti Kebap Acısız",
      "price": "1010 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Beyti Sarma Acılı",
      "price": "1010 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Beyti Sarma Acısız",
      "price": "1010 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Bolu Abant Yayla Kebap",
      "price": "1420 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Domatesli Kebap",
      "price": "900 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "FISTIKLI KEBAP",
      "price": "1160 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "NAMLI KEBAP",
      "price": "1550 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "PATLICANLI KEBAP",
      "price": "1200 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "URFA KEBAP",
      "price": "810 TL",
      "desc": "",
      "category": "Lahmacunlar"
    },
    {
      "name": "Biber Dolma",
      "price": "380 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "Bom Fasulye Piyaz",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "Çerkez Tavuğu",
      "price": "400 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "FAVA",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "Kabak Nurani",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "KURUTMA PATLICAN DOLMA",
      "price": "380 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "PATLICAN    SALATA",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "PATLICAN  SOSLU",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "Şakşuka",
      "price": "360 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "YAPRAK   SARMA",
      "price": "390 TL",
      "desc": "",
      "category": "Zeytin Yağlılar"
    },
    {
      "name": "Acı Biber Turşusu",
      "price": "210 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Akdeniz Salata",
      "price": "450 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Çoban Salata",
      "price": "420 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "EZME SALATA",
      "price": "380 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Bahçıvan Salata",
      "price": "480 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Göbek Salata",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Havuç Salata",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Mevsim Salata",
      "price": "440 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "NAMLI SALATA",
      "price": "480 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "ROKA SALATA",
      "price": "380 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Salatalık Turşu",
      "price": "200 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Söğüş Salata",
      "price": "380 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Süzme Yoğurt",
      "price": "220 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "TAVUK SALATA",
      "price": "750 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Bulgur Pilavı",
      "price": "230 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "Ezo Gelin",
      "price": "200 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "İçli Köfte",
      "price": "240 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "Közde Domates",
      "price": "210 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "Közde Yeşil Biber",
      "price": "210 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "PATATES TAVA",
      "price": "230 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "Pirinç Pilavı",
      "price": "230 TL",
      "desc": "",
      "category": "Sıcaklar"
    },
    {
      "name": "CACIK",
      "price": "250 TL",
      "desc": "",
      "category": "Soğuklar"
    },
    {
      "name": "ÇİĞ KÖFTE    15:00 - 19:00 ARASI MEVCUT",
      "price": "520 TL",
      "desc": "",
      "category": "Soğuklar"
    },
    {
      "name": "Haydari",
      "price": "340 TL",
      "desc": "",
      "category": "Soğuklar"
    },
    {
      "name": "Yoğurt",
      "price": "210 TL",
      "desc": "",
      "category": "Soğuklar"
    },
    {
      "name": "AYRAN",
      "price": "90 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "COLA",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Cola Diet",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "FANTA",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fuse Tea Limon",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fuse Tea Şeftali",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "KAYISI SUYU",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Litrelik Ayran",
      "price": "180 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Acılı",
      "price": "100 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Acısız",
      "price": "100 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Şeftali Suyu",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "SODA",
      "price": "60 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Vişne Suyu",
      "price": "110 TL",
      "desc": "",
      "category": "İçecekler"
    }
  ]
}
,
  "7245": {
  "name": "Balkon Cafe Etiler Marina",
  "sourceUrl": "https://balkoncafe.dslink.co/yemek-menu",
  "sourceName": "Balkon Cafe resmi QR menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Balkon Kahvaltı",
      "price": "700 TL",
      "desc": "",
      "category": "KAHVALTI"
    },
    {
      "name": "GÜNÜN ÇORBASI",
      "price": "220 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "PARMAK PATATES",
      "price": "405 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "ELMA DİLİM PATATES",
      "price": "420 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "SOĞAN HALKASI",
      "price": "420 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "SİGARA BÖREĞİ",
      "price": "420 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "MOZZARELLA STICKS",
      "price": "420 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "PAÇANGA BÖREĞİ",
      "price": "470 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "ÇILGIN SOSİS TABAĞİ",
      "price": "470 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "CAJUN CHİCKEN FİNGERS",
      "price": "510 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "ATIŞTIRMA TABAĞI",
      "price": "560 TL",
      "desc": "",
      "category": "BAŞLANGIÇLAR"
    },
    {
      "name": "KAŞARLI TOST",
      "price": "405 TL",
      "desc": "",
      "category": "TOSTLAR"
    },
    {
      "name": "EGE TOST",
      "price": "415 TL",
      "desc": "",
      "category": "TOSTLAR"
    },
    {
      "name": "KAVURMALI TOST",
      "price": "525 TL",
      "desc": "",
      "category": "TOSTLAR"
    },
    {
      "name": "SUCUKLU KAŞARLI TOST",
      "price": "470 TL",
      "desc": "",
      "category": "TOSTLAR"
    },
    {
      "name": "SPECIAL TOST",
      "price": "490 TL",
      "desc": "",
      "category": "TOSTLAR"
    },
    {
      "name": "BEYAZ PEYNİRLİ OMLET",
      "price": "405 TL",
      "desc": "",
      "category": "OMLET ÇEŞITLERI"
    },
    {
      "name": "OTTOMON OMLET",
      "price": "530 TL",
      "desc": "",
      "category": "OMLET ÇEŞITLERI"
    },
    {
      "name": "SEBZELİ OMLET",
      "price": "405 TL",
      "desc": "",
      "category": "OMLET ÇEŞITLERI"
    },
    {
      "name": "MANTARLI OMLET",
      "price": "440 TL",
      "desc": "",
      "category": "OMLET ÇEŞITLERI"
    },
    {
      "name": "SADE OMLET",
      "price": "350 TL",
      "desc": "",
      "category": "OMLET ÇEŞITLERI"
    },
    {
      "name": "TEREYAĞLI GÖZ YUMURTA",
      "price": "350 TL",
      "desc": "",
      "category": "SAHANDA ÜRÜNLER"
    },
    {
      "name": "SUCUKLU GÖZ YUMURTA",
      "price": "420 TL",
      "desc": "",
      "category": "SAHANDA ÜRÜNLER"
    },
    {
      "name": "KAVURMALI GÖZ YUMURTA",
      "price": "490 TL",
      "desc": "",
      "category": "SAHANDA ÜRÜNLER"
    },
    {
      "name": "PASTIRMALI GÖZ YUMURTA",
      "price": "490 TL",
      "desc": "",
      "category": "SAHANDA ÜRÜNLER"
    },
    {
      "name": "MENEMEN",
      "price": "405 TL",
      "desc": "",
      "category": "SAHANDA ÜRÜNLER"
    },
    {
      "name": "IZGARA KÖFTE",
      "price": "830 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "BALKON KÖFTE",
      "price": "875 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "LOKUM BONFİLE",
      "price": "1380 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "MUSHROOM STEAK",
      "price": "1410 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "ÇOBAN KAVURMA",
      "price": "1335 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "MEXICAN BONFİLE",
      "price": "1410 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "IZGARA ANTRİKOT",
      "price": "1310 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "ÇÖKERTME KEBABI",
      "price": "1365 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "SAÇ KAVURMA",
      "price": "1335 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "SULU KAVURMA",
      "price": "1335 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "KUZU PİRZOLA",
      "price": "1510 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "BALKON IZGARA",
      "price": "1845 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "QUASADILLA ETLİ",
      "price": "865 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "T BONE STEAK",
      "price": "1590 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "DANA DALLAS",
      "price": "1590 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "ETLİ FAJİTA",
      "price": "1310 TL",
      "desc": "",
      "category": "KIRMIZI ET YEMEKLERİ"
    },
    {
      "name": "BALKON ŞATO TAVUK",
      "price": "760 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "TAVUK ŞİŞ",
      "price": "740 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "IZGARA TAVUK GÖĞSÜ",
      "price": "670 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "QUASADILLA TAVUKLU",
      "price": "650 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "TAVUK PİRZOLA",
      "price": "715 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "KÖRİ SOSLU TAVUK",
      "price": "695 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "MANTAR SOSLU TAVUK",
      "price": "715 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "BBQ SOSLU TAVUK",
      "price": "695 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "MEXICAN TAVUK",
      "price": "715 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "TAVUK GÜVEÇ",
      "price": "715 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "TAVUK SCHNITZEL",
      "price": "695 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "TAVUKLU FAJİTA",
      "price": "795 TL",
      "desc": "",
      "category": "BEYAZ ET YEMEKLERİ"
    },
    {
      "name": "ÇUPRA",
      "price": "1280 TL",
      "desc": "",
      "category": "BALIKLAR"
    },
    {
      "name": "SOMON",
      "price": "1290 TL",
      "desc": "",
      "category": "BALIKLAR"
    },
    {
      "name": "LEVREK",
      "price": "1280 TL",
      "desc": "",
      "category": "BALIKLAR"
    },
    {
      "name": "HELLİM SALATA",
      "price": "505 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "TON BALIKLI SALATA",
      "price": "550 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "TAVUKLU SEZAR SALATA",
      "price": "520 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "BEEF SALATA",
      "price": "730 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "ÇITIR TAVUK SALATA",
      "price": "520 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "ROKA SALATASI",
      "price": "505 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "ÇOBAN SALATA",
      "price": "440 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "EGE SALATA",
      "price": "480 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "BUHARDA HAŞLANMIŞ SEBZE",
      "price": "460 TL",
      "desc": "",
      "category": "SALATALAR"
    },
    {
      "name": "EGE SANDVİÇ",
      "price": "470 TL",
      "desc": "",
      "category": "SANDVICLER"
    },
    {
      "name": "TON BALIKLI SANDVİÇ",
      "price": "560 TL",
      "desc": "",
      "category": "SANDVICLER"
    },
    {
      "name": "BEEF SANDVİÇ",
      "price": "660 TL",
      "desc": "",
      "category": "SANDVICLER"
    },
    {
      "name": "TAVUKLU SANDVİÇ",
      "price": "510 TL",
      "desc": "",
      "category": "SANDVICLER"
    },
    {
      "name": "HAMBURGER",
      "price": "660 TL",
      "desc": "",
      "category": "BURGERLER"
    },
    {
      "name": "CHEESEBURGER",
      "price": "700 TL",
      "desc": "",
      "category": "BURGERLER"
    },
    {
      "name": "MEXICAN BURGER",
      "price": "700 TL",
      "desc": "",
      "category": "BURGERLER"
    },
    {
      "name": "LOKUM BURGER",
      "price": "770 TL",
      "desc": "",
      "category": "BURGERLER"
    },
    {
      "name": "CHICKEN BURGER",
      "price": "525 TL",
      "desc": "",
      "category": "BURGERLER"
    },
    {
      "name": "FETTUCINI ALFREDO",
      "price": "600 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "PENNE ALL ARABIATTA",
      "price": "585 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "BOLONEZ SOSLU SPAGETTI",
      "price": "600 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "BEEF PENNE",
      "price": "740 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "MANTI",
      "price": "645 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "ÇITIR MANTI",
      "price": "645 TL",
      "desc": "",
      "category": "MAKARNALAR VE RİSOTTALAR"
    },
    {
      "name": "MARGARİTTA PİZZA",
      "price": "600 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "KARNAVAL PİZZA",
      "price": "700 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "BONFİLE DİLİMLİ PİZZA",
      "price": "910 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "TONBALIKLI PİZZA",
      "price": "755 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "BALKON MİX PİZZA",
      "price": "730 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "VEGETERIAN PİZZA",
      "price": "685 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "KAVURMALI PİZZA",
      "price": "910 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "FUNGİ PİZZA",
      "price": "645 TL",
      "desc": "",
      "category": "PİZZALAR"
    },
    {
      "name": "ET DÜRÜM",
      "price": "805 TL",
      "desc": "",
      "category": "DÜRÜMLER"
    },
    {
      "name": "TAVUK DÜRÜM",
      "price": "605 TL",
      "desc": "",
      "category": "DÜRÜMLER"
    },
    {
      "name": "MEXİCAN DÜRÜM",
      "price": "830 TL",
      "desc": "",
      "category": "DÜRÜMLER"
    },
    {
      "name": "KÖFTE DÜRÜM",
      "price": "750 TL",
      "desc": "",
      "category": "DÜRÜMLER"
    },
    {
      "name": "KAŞARLI PİDE",
      "price": "650 TL",
      "desc": "",
      "category": "PİDELER"
    },
    {
      "name": "KUŞBAŞILI PİDE",
      "price": "950 TL",
      "desc": "",
      "category": "PİDELER"
    },
    {
      "name": "KIYMALI PİDE",
      "price": "830 TL",
      "desc": "",
      "category": "PİDELER"
    },
    {
      "name": "SU",
      "price": "75 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "COCA COLA",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "COCA COLA ZERO",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "COCA COLA LIGHT",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "FANTA",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "SPRİTE",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "ICE TEA (LIMON / ŞEFTALİ/ MANGO)",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "CAPPY (ŞEFTALİ / KAYISI/ VİŞNE/ MIX)",
      "price": "240 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "REDBULL",
      "price": "360 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "SODA",
      "price": "195 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "MEYVELİ SODA",
      "price": "215 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "CHURCHILL",
      "price": "225 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "SCHWEPPES",
      "price": "245 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "AYRAN",
      "price": "185 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "NANELİ AYRAN",
      "price": "185 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "FESLEĞENLİ AYRAN",
      "price": "185 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "REDBULL SUGARFREE",
      "price": "360 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "REDBULL YELLOW EDITION",
      "price": "360 TL",
      "desc": "",
      "category": "SOFT İÇECEKLER"
    },
    {
      "name": "ÇAY",
      "price": "70 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "FİNCAN ÇAY",
      "price": "110 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "ADA ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "IHLAMUR ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "KUŞBURNU ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "PAPATYA ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "KIŞ ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "AŞK ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "YEŞİL ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "LİMONLU YEŞİL ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "NANE LİMON ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "PORTAKAL ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "NAR ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "ELMA ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "REZENE ÇAYI",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "EARL GREY",
      "price": "300 TL",
      "desc": "",
      "category": "ORGANİK ÇAYLAR"
    },
    {
      "name": "MACCHIATO",
      "price": "260 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "ESPRESSO SINGLE",
      "price": "240 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "ESPRESSO DOUBLE",
      "price": "255 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "AMERICANO",
      "price": "270 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "COFFEE LATTE",
      "price": "295 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "COFFEE MOCHA",
      "price": "290 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "COFFEE WHITE MOCHA",
      "price": "295 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "NESCAFE",
      "price": "260 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "SÜTLÜ NESCAFE",
      "price": "270 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "CREAM DE LATTE OREO",
      "price": "295 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "CAPPUCCİNO",
      "price": "290 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "CAPPUCCİNO AROMALI",
      "price": "295 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "LATTE MACCHİATO",
      "price": "290 TL",
      "desc": "",
      "category": "SPECIAL KAHVELER"
    },
    {
      "name": "SADE FİLTRE",
      "price": "290 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "COLOMBİA",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "ETHİOPİA",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "BRASİLİAN SANTOS",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "COSTARİCA",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "GUATEMALA",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "KENYA A.A.",
      "price": "300 TL",
      "desc": "",
      "category": "YÖRESEL FİLTRE KAHVELER"
    },
    {
      "name": "TÜRK KAHVESİ",
      "price": "255 TL",
      "desc": "",
      "category": "TÜRK KAHVELERİ"
    },
    {
      "name": "DAMLA",
      "price": "260 TL",
      "desc": "",
      "category": "TÜRK KAHVELERİ"
    },
    {
      "name": "MENENGİÇ",
      "price": "255 TL",
      "desc": "",
      "category": "TÜRK KAHVELERİ"
    },
    {
      "name": "DİBEK",
      "price": "260 TL",
      "desc": "",
      "category": "TÜRK KAHVELERİ"
    },
    {
      "name": "SÜTLÜ",
      "price": "260 TL",
      "desc": "",
      "category": "TÜRK KAHVELERİ"
    },
    {
      "name": "SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "BEYAZ SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "ÇİLEK SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "FINDIK SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "MUZ SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "KARAMEL SICAK ÇİKOLATA",
      "price": "300 TL",
      "desc": "",
      "category": "SICAK ÇİKOLATA"
    },
    {
      "name": "SAHLEP SADE",
      "price": "290 TL",
      "desc": "",
      "category": "SAHLEPLER"
    },
    {
      "name": "DAMLA SAKIZLI SAHLEP",
      "price": "300 TL",
      "desc": "",
      "category": "SAHLEPLER"
    },
    {
      "name": "ÇİLEKLİ SAHLEP",
      "price": "300 TL",
      "desc": "",
      "category": "SAHLEPLER"
    },
    {
      "name": "FINDIKLI SAHLEP",
      "price": "300 TL",
      "desc": "",
      "category": "SAHLEPLER"
    },
    {
      "name": "KAHVELİ SAHLEP",
      "price": "300 TL",
      "desc": "",
      "category": "SAHLEPLER"
    },
    {
      "name": "ICE MOCHA FRAPPE",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE LATTE FRAPPE",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE LATTE",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE AMERİCANO",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE MOCHA",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE WHİTE MOCHA",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE IRİSH NUT CREAM",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE CHAİ LATTE",
      "price": "310 TL",
      "desc": "",
      "category": "SOĞUK KAHVELER"
    },
    {
      "name": "ICE CHOCOLATE MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "ICE WHİTE CHOCOLATE MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "ÇİLEK MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "VANİLYA MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "MUZ MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "KARAMEL MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "KARPUZ MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "HİNDİSTAN CEVİZLİ",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "KİVİ MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "KIRMIZI ORMAN MEYVELERİ MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "KAVUN MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "MANGO MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "ŞEFTALİ MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "BÖĞÜRTLEN MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "MUZLU MILKSHAKE",
      "price": "310 TL",
      "desc": "",
      "category": "MILKSHAKE"
    },
    {
      "name": "ÇİLEK FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "YEŞİL ELMA FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "BLACKBERRY FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "PİNE APPLE FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "MUZ FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "MANGO FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "NANE LİMON FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "PASSİON FRUİT FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "KARPUZ FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "WILD BERRIES FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "RASPERRY FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "KAVUN FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "LEMON FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "BLACK MULBERRY FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "KİVİ FROZEN",
      "price": "320 TL",
      "desc": "",
      "category": "FROZEN"
    },
    {
      "name": "LUVIA",
      "price": "370 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "KIZIL ATEŞ",
      "price": "370 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "BRONZ",
      "price": "360 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "RED LİNE",
      "price": "345 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "BALKON MİX",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "OREO",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "MOJİTO",
      "price": "310 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "MOJİTA STRAWBERRY",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "MOJİTO MİNT",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "HULK",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "BLUE WORLD",
      "price": "345 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "GOLDEN ISLAND",
      "price": "320 TL",
      "desc": "",
      "category": "ALKOLSÜZ KOKTEYL"
    },
    {
      "name": "KLASİK",
      "price": "250 TL",
      "desc": "",
      "category": "LİMONATA"
    },
    {
      "name": "NANE",
      "price": "255 TL",
      "desc": "",
      "category": "LİMONATA"
    },
    {
      "name": "ÇİLEK",
      "price": "255 TL",
      "desc": "",
      "category": "LİMONATA"
    },
    {
      "name": "KARADUT",
      "price": "255 TL",
      "desc": "",
      "category": "LİMONATA"
    },
    {
      "name": "BÖĞÜRTLEN",
      "price": "255 TL",
      "desc": "",
      "category": "LİMONATA"
    },
    {
      "name": "PORTAKAL SUYU",
      "price": "320 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "NAR / PORTAKAL",
      "price": "390 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "ELMA",
      "price": "300 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "HAVUÇ",
      "price": "300 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "FINDIKLI NAR",
      "price": "350 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "FINDIKLI PORTAKAL",
      "price": "350 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "NAR SUYU",
      "price": "340 TL",
      "desc": "",
      "category": "VİTAMİN BAR"
    },
    {
      "name": "TIRAMISU",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "FRAMBUAZLI CHEESECAKE",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "LİMONLU CHEESECAKE",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MOZAİK PASTA",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "SUFLE",
      "price": "570 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "BROWNIE",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "KIZARMIŞ DONDURMA",
      "price": "565 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "TRİLEÇE",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "FONDÜ",
      "price": "570 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "WAFFLE",
      "price": "570 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "DONDURMA",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "FISTIK RÜYASI",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MARLENKA",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MAGNOLIA MUZLU",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MAGNOLIA ÇİLEKLİ",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MAGNOLIA OREOLU",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "SAN SEBASTIAN CHEESECAKE",
      "price": "565 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "Baklava Porsiyon",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "Kadayıf Porsiyon",
      "price": "470 TL",
      "desc": "",
      "category": "TATLILAR"
    },
    {
      "name": "MEYVE TABAĞI",
      "price": "720 TL",
      "desc": "",
      "category": "MEYVELER"
    },
    {
      "name": "DOUBLE MEYVE TABAĞI",
      "price": "1295 TL",
      "desc": "",
      "category": "MEYVELER"
    },
    {
      "name": "MEYVE ŞÖLENİ",
      "price": "2205 TL",
      "desc": "",
      "category": "MEYVELER"
    },
    {
      "name": "ÇEREZ TABAĞI",
      "price": "445 TL",
      "desc": "",
      "category": "ÇEREZLER"
    },
    {
      "name": "ANANAS",
      "price": "1110 TL",
      "desc": "",
      "category": "NATUREL GRUBU ÇEŞİTLERİ"
    },
    {
      "name": "ANASON ÇİFT ELMA",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "ÜZÜM",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "DAMLA SAKIZI",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "VİVİDENT",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "YABAN MERSİNİ",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "CAPPUCCINO",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "OKYANUS",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "KARPUZ",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "LİMON NANE",
      "price": "635 TL",
      "desc": "",
      "category": "Balkon Special"
    },
    {
      "name": "RICHY RICH",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "OREON",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "PİŞMİŞ ŞEFTALİ",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "MOSCOW ICE CREAM",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "MAAGNUM",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "LEMON CHILL",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "LADY FINGER",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "GUM",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "CREAM ORANGE",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "KİRAZ",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "MAVİ MUFFIN",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "LOVE",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "LADY KILLER",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "ICE COOKIE",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "BERRY CHERRY LIME",
      "price": "635 TL",
      "desc": "",
      "category": "NARGİLE KARIŞIMLARI"
    },
    {
      "name": "ICE BERRY",
      "price": "635 TL",
      "desc": "",
      "category": "ŞERBETLİ"
    },
    {
      "name": "BODRUM MANDALİNA",
      "price": "635 TL",
      "desc": "",
      "category": "ŞERBETLİ"
    },
    {
      "name": "CHEESECAKE LİMON",
      "price": "635 TL",
      "desc": "",
      "category": "ŞERBETLİ"
    },
    {
      "name": "ICE BOOM BOOM",
      "price": "635 TL",
      "desc": "",
      "category": "ŞERBETLİ"
    },
    {
      "name": "LAV 66",
      "price": "635 TL",
      "desc": "",
      "category": "ADALYA"
    },
    {
      "name": "ICE BOOM",
      "price": "635 TL",
      "desc": "",
      "category": "ADALYA"
    },
    {
      "name": "ANASON NAKLA ELMA",
      "price": "635 TL",
      "desc": "",
      "category": "NAKHLA"
    },
    {
      "name": "NAKLA ŞEFTALİ",
      "price": "635 TL",
      "desc": "",
      "category": "NAKHLA"
    },
    {
      "name": "STARBUZZ ÇEŞİTLERİ",
      "price": "635 TL",
      "desc": "",
      "category": "STARBUZZ ÇEŞİTLERİ"
    },
    {
      "name": "Akbar Cuce",
      "price": "1000 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Khorme sebzi",
      "price": "750 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Gheyme",
      "price": "750 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Fesençun",
      "price": "1000 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Zereşk polo morgh",
      "price": "750 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Mirza ghasemi",
      "price": "500 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    },
    {
      "name": "Ghabali polo",
      "price": "1200 TL",
      "desc": "",
      "category": "İRAN MUTFAĞI"
    }
  ]
}
,
  "7246": {
  "name": "Grand Vadi Kebap Pide Lahmacun",
  "sourceUrl": "https://www.yemeksepeti.com/restaurant/ron3/grand-vadi-kebap-pide-and-lahmacun",
  "sourceName": "Grand Vadi resmi site + Yemeksepeti canlı menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Günün Çorbası",
      "price": "140 TL",
      "desc": "",
      "category": "Çorbalar"
    },
    {
      "name": "10'lu Fındık Lahmacun 1Lt içecek",
      "price": "1050 TL",
      "desc": "",
      "category": "Menüler"
    },
    {
      "name": "10'lu Lahmacun 1Lt içecek",
      "price": "1800 TL",
      "desc": "",
      "category": "Menüler"
    },
    {
      "name": "6'lı Lahmacun 1Lt içecek",
      "price": "1080 TL",
      "desc": "",
      "category": "Menüler"
    },
    {
      "name": "Yaprak Tavuk Kanat (1 kg.)",
      "price": "1500 TL",
      "desc": "",
      "category": "Kiloluk Ürünler (Pişirilmiş)"
    },
    {
      "name": "Izgara Köfte (1 kg.)",
      "price": "1900 TL",
      "desc": "",
      "category": "Kiloluk Ürünler (Pişirilmiş)"
    },
    {
      "name": "Kuzu Şiş",
      "price": "800 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Adana Kebap",
      "price": "730 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Patlıcan Kebap",
      "price": "880 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Urfa Kebap",
      "price": "730 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Karışık Kebap",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Izgara Köfte",
      "price": "640 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Yağlı Kara",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Küşleme",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Kuzu Kaburga",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Tavuk Şiş",
      "price": "580 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Kuzu Pirzola",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Beyti Kebap",
      "price": "880 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Dana Lokum",
      "price": "1350 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Yaprak Tavuk Kanat",
      "price": "580 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Çöp Şiş",
      "price": "800 TL",
      "desc": "",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Tavuk Şiş Dürüm",
      "price": "330 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Urfa Dürüm",
      "price": "350 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Kuzu Şiş Dürüm",
      "price": "380 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Adana Dürüm",
      "price": "350 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Çöp Şiş Dürüm",
      "price": "380 TL",
      "desc": "",
      "category": "Dürümler"
    },
    {
      "name": "Kuşbaşılı Pide",
      "price": "580 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kavurma Kaşarlı Pide",
      "price": "580 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Sucuklu Kaşarlı Pide",
      "price": "480 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kaşarlı Pide",
      "price": "430 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Fındık Lahmacun",
      "price": "105 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kıymalı Kaşarlı Pide",
      "price": "450 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Özel Lahmacun",
      "price": "230 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Lahmacun",
      "price": "180 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Karışık Pide",
      "price": "550 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kıymalı Pide",
      "price": "430 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kuşbaşı Kaşarlı Pide",
      "price": "600 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "Kaşarlı Lahmacun",
      "price": "230 TL",
      "desc": "",
      "category": "Fırın Ürünleri"
    },
    {
      "name": "gavurdağ salata",
      "price": "230 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "çiğ köfte",
      "price": "150 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "çoban salata",
      "price": "180 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Hasır Künefe",
      "price": "330 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "künefe",
      "price": "260 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Fırında Sütlaç",
      "price": "180 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Katmer",
      "price": "330 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Gazoz",
      "price": "105 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Kola",
      "price": "105 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Limonlu Soda",
      "price": "70 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Ayran",
      "price": "80 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Suyu",
      "price": "105 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Su",
      "price": "45 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Soda",
      "price": "55 TL",
      "desc": "",
      "category": "İçecekler"
    }
  ]
}
,
  "7247": {
  "name": "Kanlıca Paysage Restaurant",
  "sourceUrl": "https://kanlicapaysage.menudgtl.com/",
  "sourceName": "Paysage resmi Instagram bağlantılı QR menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Beyaz Peynir",
      "price": "230 TL",
      "desc": "Ezine",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Girit Ezmesi",
      "price": "410 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Karpuz",
      "price": "300 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Kavun",
      "price": "300 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Köz Biber",
      "price": "400 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Köpoğlu",
      "price": "400 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Levrek Marin",
      "price": "510 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "MARGARİTA",
      "price": "800 TL",
      "desc": "Tekila , Portakaal likörü , limon suyu , özel sos",
      "category": "Koktyl"
    },
    {
      "name": "Ordövr Tabağı",
      "price": "1450 TL",
      "desc": "9 Çeşit Soğuk Meze",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "STRAWBERY MARGARİTA",
      "price": "800 TL",
      "desc": "Tekila , portakal likörü , çilek püresi , limon suyu , özel sos",
      "category": "Koktyl"
    },
    {
      "name": "Acılı Ezme",
      "price": "400 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "PASIHON MARTİNİ",
      "price": "800 TL",
      "desc": "Proseco şampanya, vodka, vanilya likörü, çarkıfelek püresi",
      "category": "Koktyl"
    },
    {
      "name": "Atom Biberi",
      "price": "380 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "LYN",
      "price": "850 TL",
      "desc": "Jack danel, portakal likörü, özel sos, sprite",
      "category": "Koktyl"
    },
    {
      "name": "Fava",
      "price": "400 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "COSMOPOLİTAN",
      "price": "800 TL",
      "desc": "Limonlu vodka, portakal likörü, kızılcık şurubu, limon suyu",
      "category": "Koktyl"
    },
    {
      "name": "Antibiyotik",
      "price": "430 TL",
      "desc": "Soğan Sarmısak Susamlı",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Gordon gin",
      "price": "700 TL",
      "desc": "",
      "category": "Koktyl"
    },
    {
      "name": "Humus",
      "price": "500 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "GİNN FİZZ",
      "price": "700 TL",
      "desc": "",
      "category": "Koktyl"
    },
    {
      "name": "Karışık Deniz Mahsülleri",
      "price": "1650 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Avakado cacık",
      "price": "450 TL",
      "desc": "",
      "category": "Soğuk Mezeler"
    },
    {
      "name": "Ahtapot Izgara",
      "price": "1350 TL",
      "desc": "Adet",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Ahtapot Kavurma",
      "price": "1350 TL",
      "desc": "Porsiyon",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Kalamar Izgara",
      "price": "950 TL",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Kalamar Tava",
      "price": "950 TL",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Karides Güveç",
      "price": "1000 TL",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Patates Tava",
      "price": "400 TL",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Tereyağında Karides",
      "price": "900 TL",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "Jumbo karides",
      "price": "1500 TL",
      "desc": "",
      "category": "Specialler"
    },
    {
      "name": "Avakodolu Karides",
      "price": "950 TL",
      "desc": "",
      "category": "Specialler"
    },
    {
      "name": "Roka Salatası Cevizli",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "İnce Kıyım Salata",
      "price": "300 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Paysage Özel Salata",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Roka Salatası",
      "price": "300 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Sezar Salata",
      "price": "580 TL",
      "desc": "Tavuklu",
      "category": "Salatalar"
    },
    {
      "name": "Söğüş Tabağı",
      "price": "350 TL",
      "desc": "Roka Domates Maydanoz Domates Salatalık Havuç",
      "category": "Salatalar"
    },
    {
      "name": "Çoban Salata",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Mevsim Salata",
      "price": "400 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Jülyen Salata",
      "price": "450 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Roka Domates Peynirli Salata",
      "price": "450 TL",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "Serpme Kahvaltı",
      "price": "1500 TL",
      "desc": "Zengin İçerik Sınırsız Çay",
      "category": "Kahvaltı"
    },
    {
      "name": "Suçuklu menemen",
      "price": "500 TL",
      "desc": "",
      "category": "Kahvaltı"
    },
    {
      "name": "Menemen",
      "price": "400 TL",
      "desc": "sade",
      "category": "Kahvaltı"
    },
    {
      "name": "Barbun",
      "price": "4100 TL",
      "desc": "Porsiyon",
      "category": "Balık"
    },
    {
      "name": "Deniz Çipurası",
      "price": "1800 TL",
      "desc": "KG",
      "category": "Balık"
    },
    {
      "name": "İspendek Levrek",
      "price": "1000 TL",
      "desc": "",
      "category": "Balık"
    },
    {
      "name": "Kalkan Balığı",
      "price": "1500 TL",
      "desc": "Porsiyon",
      "category": "Balık"
    },
    {
      "name": "Kalkan Balığı",
      "price": "3000 TL",
      "desc": "KG",
      "category": "Balık"
    },
    {
      "name": "Deniz Levreği",
      "price": "2500 TL",
      "desc": "",
      "category": "Balık"
    },
    {
      "name": "Köfte",
      "price": "950 TL",
      "desc": "Porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Antrikot şiş",
      "price": "1100 TL",
      "desc": "Porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Tavuk Pirzola",
      "price": "750 TL",
      "desc": "Porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Dana kaburga",
      "price": "1300 TL",
      "desc": "porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Oğlak tandır",
      "price": "1250 TL",
      "desc": "porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Sakız kabağında sarılı levrek",
      "price": "1200 TL",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "Deniz Mahsülleri Orzo",
      "price": "1600 TL",
      "desc": "porsiyon",
      "category": "Ana Yemekler"
    },
    {
      "name": "Dondurmalı İrmik",
      "price": "450 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Karışık Tatlı Tabağı",
      "price": "1000 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Küp Dondurma",
      "price": "400 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Meyve Tabağı",
      "price": "800 TL",
      "desc": "Mevsim Meyveleri",
      "category": "Tatlılar"
    },
    {
      "name": "Çerez Karışık",
      "price": "600 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Peynir Tabağı",
      "price": "2200 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Volkanik Sufle",
      "price": "600 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Serpme Mevsim Meyveleri",
      "price": "800 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Fine sütlaç",
      "price": "550 TL",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "Şalgam",
      "price": "220 TL",
      "desc": "Bardak",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Cola",
      "price": "220 TL",
      "desc": "",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Fanta",
      "price": "220 TL",
      "desc": "",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "I Tea (Soğuk Çay)",
      "price": "220 TL",
      "desc": "",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Meyve Suyu Çeşitleri",
      "price": "220 TL",
      "desc": "Bardak",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Soda",
      "price": "160 TL",
      "desc": "",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Şalgam",
      "price": "300 TL",
      "desc": "1 kg",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Portakal Suyu",
      "price": "450 TL",
      "desc": "Taze Sıkılmış",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Nar Suyu",
      "price": "450 TL",
      "desc": "Taze Sıkılmış",
      "category": "Soft Soğuk İçecek"
    },
    {
      "name": "Çay",
      "price": "180 TL",
      "desc": "Fincan",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Nescafe",
      "price": "200 TL",
      "desc": "Fincan",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Türk Kahvesi",
      "price": "200 TL",
      "desc": "Fincan",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Türk Kahvesi",
      "price": "260 TL",
      "desc": "DOUBLE",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "Çay",
      "price": "150 TL",
      "desc": "Küçük",
      "category": "Sıcak İçecekler"
    },
    {
      "name": "YENİ RAKI",
      "price": "3900 TL",
      "desc": "Adet 70 LİK",
      "category": "Rakılar"
    },
    {
      "name": "Yeni Rakı 50 CL",
      "price": "",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Yeni Rakı 35 CL",
      "price": "2900 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Beylerbeyi Göbek 70 CL",
      "price": "4500 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Beylerbeyi Göbek 50 CL",
      "price": "3800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Beylerbeyi Göbek 35 CL",
      "price": "3000 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Altın Seri 70 CL",
      "price": "4800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Altın Seri 50 CL",
      "price": "3800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Altın Seri 35 CL",
      "price": "3200 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Beylerbeyi Göbek 20 CL",
      "price": "1650 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Yeni Rakı 20 CL",
      "price": "1400 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Altın Seri 20 CL",
      "price": "1650 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Yeni Rakı",
      "price": "700 TL",
      "desc": "Kadeh",
      "category": "Rakılar"
    },
    {
      "name": "Beylerbeyi Göbek",
      "price": "800 TL",
      "desc": "Kadeh",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Altın Seri",
      "price": "800 TL",
      "desc": "Kadeh",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Gold 70 CL",
      "price": "4800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Gold 50 CL",
      "price": "3800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Gold 35 CL",
      "price": "3200 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "Tekirdağ Gold",
      "price": "800 TL",
      "desc": "Kadeh",
      "category": "Rakılar"
    },
    {
      "name": "KULUP RAKI 70 LİK",
      "price": "3800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "YENİ SERİ 20 CL",
      "price": "1500 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "YENİ SERİ 35 LİK",
      "price": "3300 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "YENİ SERİ 70 LİK RAKI",
      "price": "4000 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "TEKİRDAĞ 50 LİK",
      "price": "3800 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "TEKİRDAĞ GOLD 20 LİK",
      "price": "1600 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "RAKI USTALARIN KARIŞIMI DUBLE",
      "price": "",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "RAKI USTALARIN KARIŞIMI 70 LİK",
      "price": "4100 TL",
      "desc": "",
      "category": "Rakılar"
    },
    {
      "name": "SARAFİN SEVİNYON 75 LİK",
      "price": "4500 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "BUZBAĞ 70 LİK",
      "price": "3000 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "SARAFİN FÜME BLANC BEYAZ 75 LİK",
      "price": "4500 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "SARAFİN S BLANC 75 LİK",
      "price": "4500 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "SARAFİN CHARDONAY 75 LİK",
      "price": "4500 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "İSA BEY",
      "price": "3200 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "ŞARAP KADEH",
      "price": "800 TL",
      "desc": "",
      "category": "Şarap"
    },
    {
      "name": "ABSOLUT KADEH",
      "price": "800 TL",
      "desc": "",
      "category": "Votka"
    },
    {
      "name": "BELVEDERE ŞİŞE",
      "price": "8000 TL",
      "desc": "",
      "category": "Votka"
    },
    {
      "name": "ABSOLUT ŞİŞE 70 LİK",
      "price": "3800 TL",
      "desc": "",
      "category": "Votka"
    },
    {
      "name": "BAİLEYS KADEH",
      "price": "300 TL",
      "desc": "",
      "category": "Votka"
    },
    {
      "name": "SMİRNOF VOTKA 70 LİK",
      "price": "3800 TL",
      "desc": "",
      "category": "Votka"
    },
    {
      "name": "CHİVAS REGAL ŞİŞE",
      "price": "6500 TL",
      "desc": "",
      "category": "Viski"
    },
    {
      "name": "BLACK LABEL KADEH",
      "price": "750 TL",
      "desc": "",
      "category": "Viski"
    },
    {
      "name": "JACK DANİELS KADEH",
      "price": "750 TL",
      "desc": "",
      "category": "Viski"
    },
    {
      "name": "CİHİVAS REGAL KADEH",
      "price": "750 TL",
      "desc": "",
      "category": "Viski"
    },
    {
      "name": "JB KADEH",
      "price": "750 TL",
      "desc": "",
      "category": "Viski"
    },
    {
      "name": "MARTİNİ KADEH",
      "price": "700 TL",
      "desc": "",
      "category": "Gin"
    },
    {
      "name": "Gordon gin 70 cl",
      "price": "4000 TL",
      "desc": "",
      "category": "Gin"
    },
    {
      "name": "BİRA EFES 50 LİK",
      "price": "600 TL",
      "desc": "",
      "category": "Bira"
    },
    {
      "name": "EFES DARK 33 LÜK",
      "price": "450 TL",
      "desc": "",
      "category": "Bira"
    },
    {
      "name": "EFES LİGHT 33 LUK",
      "price": "450 TL",
      "desc": "",
      "category": "Bira"
    },
    {
      "name": "EFES ŞİŞE 33 LUK",
      "price": "450 TL",
      "desc": "",
      "category": "Bira"
    },
    {
      "name": "Sangria",
      "price": "800 TL",
      "desc": "Kırmızı şarap,meyve likörü,elma suyu,sprite,meyve parçaları",
      "category": "Koktyl"
    },
    {
      "name": "paysage sour",
      "price": "850 TL",
      "desc": "whiskey,sweet sour,kırmızı şarap",
      "category": "Koktyl"
    },
    {
      "name": "BMW",
      "price": "800 TL",
      "desc": "Bailes,Malibu,Whiskey,Kahve likörü",
      "category": "Koktyl"
    },
    {
      "name": "Aperol Spritz",
      "price": "700 TL",
      "desc": "Aperol.Proseco,Soda",
      "category": "Koktyl"
    },
    {
      "name": "Negroni",
      "price": "700 TL",
      "desc": "Campari,Gordon gin,Martini",
      "category": "Koktyl"
    },
    {
      "name": "White Russian",
      "price": "700 TL",
      "desc": "Vodka,Kahlua,süt",
      "category": "Koktyl"
    },
    {
      "name": "Whiski sour",
      "price": "750 TL",
      "desc": "",
      "category": "Koktyl"
    },
    {
      "name": "Kuzu kulağı",
      "price": "800 TL",
      "desc": "",
      "category": "Koktyl"
    }
  ]
}
,
  "7248": {
  "name": "Araki İstanbul",
  "sourceUrl": "https://www.arakiistanbulocakbasi.com/menu",
  "sourceName": "Araki İstanbul resmi menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Çiğ Köfte",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Şakşuka",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Köpeoğlu",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Albiber",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Atom",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Fava",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Pancar Turşusu",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Haydari",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Semiz Otu",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Girit Ezme",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Pilaki",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Acılı Ezme",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Pazı",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Narlı Maydonoz Salatası",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Enginar",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Zeytinyağlı Yaprak Sarma",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Havuç Tarator",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Süzme Yoğurt",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Beyaz Peynir",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Kavun & Karpuz",
      "price": "",
      "desc": "",
      "category": "Soğuk Meze Çeşitleri"
    },
    {
      "name": "Adana Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Urfa Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Araki Beyti",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Zırh Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Domatesli Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Patlıcanlı Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Fıstıklı Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Cevizli Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Altı Ezme Kuzu Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Çökertme Kebap",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Beyti Sarma",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Ali Nazik",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Kuzu Şiş",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Çöp Şiş",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Kuzu Pirzola",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Yağlı Kara",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Kuzu Lokum",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Saç Kavurma",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Çoban Kavurma",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Ciğer Şiş",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Tavuk Şiş",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Özel Soslu Kanat",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "Araki Köfte",
      "price": "",
      "desc": "",
      "category": "Kebap & Et"
    },
    {
      "name": "İçli Köfte",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Kremalı İstiridye Mantarı",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Fırın Mantar",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Yaprak Ciğer",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Karides Güveç",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Tereyağlı Karides",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Patlıcanlı Söğürme",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Pastırmalı Humus",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    },
    {
      "name": "Süzme Yoğurtlu Pazı Kavurması",
      "price": "",
      "desc": "",
      "category": "Ara Sıcak Çeşitleri"
    }
  ]
}
,
  "7249": {
  "name": "Beşiktaş Çıtır Pide & Lahmacun",
  "sourceUrl": "https://www.yemeksepeti.com/restaurant/fga4/besiktas-citir-pide-and-lahmacun-fga4",
  "sourceName": "Beşiktaş Çıtır Yemeksepeti canlı menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Mercimek Çorbası",
      "price": "176 TL",
      "desc": "Ekmek ile",
      "category": "Çorbalar"
    },
    {
      "name": "Soğansız Antep Lahmacun",
      "price": "176 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Lahmacunlar"
    },
    {
      "name": "Soğanlı Antep Lahmacun",
      "price": "176 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Lahmacunlar"
    },
    {
      "name": "Kaşarlı Antep Lahmacun",
      "price": "200 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Lahmacunlar"
    },
    {
      "name": "Kaşarlı Malatya Lahmacun (Uzun)",
      "price": "344 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Lahmacunlar"
    },
    {
      "name": "Malatya Lahmacun (Uzun)",
      "price": "320 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Lahmacunlar"
    },
    {
      "name": "Kaşarlı Pide (Açık)",
      "price": "360 TL",
      "desc": "Kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Kıymalı Pide (Açık)",
      "price": "400 TL",
      "desc": "Kıyma",
      "category": "Pideler"
    },
    {
      "name": "Kıymalı Kaşarlı Pide (Açık)",
      "price": "464 TL",
      "desc": "Kıyma, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Etli Ekmek",
      "price": "480 TL",
      "desc": "Dana kıyma, domates, biber",
      "category": "Pideler"
    },
    {
      "name": "Kuşbaşılı Pide (Açık)",
      "price": "480 TL",
      "desc": "Kuşbaşı",
      "category": "Pideler"
    },
    {
      "name": "Kuşbaşılı Kaşarlı Pide (Açık)",
      "price": "480 TL",
      "desc": "Dana bonfile, domates, biber, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Kavurmalı Kaşarlı Pide (Açık)",
      "price": "480 TL",
      "desc": "Kavurma, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Sucuklu Kaşarlı Pide (Açık)",
      "price": "480 TL",
      "desc": "Sucuk, kaşar",
      "category": "Pideler"
    },
    {
      "name": "Çıtır Karışık Pide (Açık)",
      "price": "520 TL",
      "desc": "Çıtır hamur üzerine kuşbaşı et sucuk kavurma ve kaşar peyniri ile hazırlanan lezzetli pide. Sıcak servis edilir.",
      "category": "Pideler"
    },
    {
      "name": "Alaturka Pide (Açık)",
      "price": "520 TL",
      "desc": "Geleneksel Alaturka pidesi kavurma sucuk pastırma ve kaşar peyniri ile hazırlanmış açık pide olarak servis edilir. Lezzetli malzemelerin mükemmel uyumu ile hazırlanmıştır.",
      "category": "Pideler"
    },
    {
      "name": "Bafra Pidesi",
      "price": "440 TL",
      "desc": "Dana kıyma, soğan",
      "category": "Pideler"
    },
    {
      "name": "Ispanaklı Kaşarlı Pide (Açık)",
      "price": "360 TL",
      "desc": "Ispanak, baharat, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Ispanaklı Pide (Kapalı)",
      "price": "296 TL",
      "desc": "Ispanak, baharat",
      "category": "Pideler"
    },
    {
      "name": "Karışık Pide (Açık)",
      "price": "480 TL",
      "desc": "Sucuk, kavurma, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Kavurmalı Pide (Kapalı)",
      "price": "520 TL",
      "desc": "Kavurma",
      "category": "Pideler"
    },
    {
      "name": "Mantarlı Pide (Açık)",
      "price": "440 TL",
      "desc": "Mantar, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Pastırmalı Kaşarlı Pide (Açık)",
      "price": "520 TL",
      "desc": "Pastırma, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Pastırmalı Pide (Kapalı)",
      "price": "560 TL",
      "desc": "Pastırma",
      "category": "Pideler"
    },
    {
      "name": "Patatesli Kaşarlı Pide (Açık)",
      "price": "384 TL",
      "desc": "Patates, baharat, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Sucuklu Pide (Kapalı)",
      "price": "496 TL",
      "desc": "Sucuk",
      "category": "Pideler"
    },
    {
      "name": "Patatesli Pide (Kapalı)",
      "price": "296 TL",
      "desc": "Patates, baharat",
      "category": "Pideler"
    },
    {
      "name": "Sebzeli Pide (Açık)",
      "price": "384 TL",
      "desc": "Domates, biber, mantar, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Tavuklu Pide (Açık)",
      "price": "400 TL",
      "desc": "Tavuk göğüs, domates, biber, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Bıçak Arası Pide",
      "price": "520 TL",
      "desc": "Zırhta çekilmiş kuşbaşı et, domates biber, kaşar peyniri",
      "category": "Pideler"
    },
    {
      "name": "Beyti Kebabı",
      "price": "600 TL",
      "desc": "Lavaşa sarılı; kıyma. Közlenmiş domates, közlenmiş biber, közlenmiş soğan ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Adana Kebap",
      "price": "560 TL",
      "desc": "(200 gr.) Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Urfa Kebap",
      "price": "560 TL",
      "desc": "(200 gr.) Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Et Şiş",
      "price": "600 TL",
      "desc": "(200 gr.) Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Tavuk Şiş",
      "price": "520 TL",
      "desc": "(250 gr.) Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Yaprak Kanat",
      "price": "560 TL",
      "desc": "(250 gr.) Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Patlıcanlı Kebap",
      "price": "600 TL",
      "desc": "Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Domatesli Kebap",
      "price": "600 TL",
      "desc": "Bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Karışık Kebap",
      "price": "1.120 TL",
      "desc": "Adana kebap, tavuk şiş, tavuk kanat, et şiş. Lahmacun, bulgur pilavı, közlenmiş domates, közlenmiş biber, çoban salata ile",
      "category": "Kebaplar & Izgaralar"
    },
    {
      "name": "Adana Dürüm",
      "price": "360 TL",
      "desc": "Domates, maydanoz, soğan",
      "category": "Dürümler"
    },
    {
      "name": "Urfa Dürüm",
      "price": "360 TL",
      "desc": "Domates, maydanoz, soğan",
      "category": "Dürümler"
    },
    {
      "name": "Tavuk Şiş Dürüm",
      "price": "344 TL",
      "desc": "Domates, maydanoz, soğan",
      "category": "Dürümler"
    },
    {
      "name": "Et Şiş Dürüm",
      "price": "400 TL",
      "desc": "Domates, maydanoz, soğan",
      "category": "Dürümler"
    },
    {
      "name": "Çıtır Dürüm",
      "price": "440 TL",
      "desc": "Lahmacun arasına; Adana kebap, soğan, domates, maydanoz",
      "category": "Dürümler"
    },
    {
      "name": "Yağlı Karışık Katmer",
      "price": "208 TL",
      "desc": "Kavurma, kaşar peyniri",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Kaşarlı Katmer",
      "price": "192 TL",
      "desc": "Kaşar peyniri",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Kavurmalı Kaşarlı Katmer",
      "price": "208 TL",
      "desc": "Kavurma, kaşar peyniri",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Kavurmalı Katmer",
      "price": "200 TL",
      "desc": "Kavurma",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Pastırmalı Kaşarlı Katmer",
      "price": "216 TL",
      "desc": "Pastırma, kaşar peyniri",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Pastırmalı Katmer",
      "price": "216 TL",
      "desc": "Pastırma",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Patatesli Katmer",
      "price": "192 TL",
      "desc": "Patates",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Sucuklu Kaşarlı Katmer",
      "price": "192 TL",
      "desc": "Sucuk, kaşar peyniri",
      "category": "Katmerler"
    },
    {
      "name": "Yağlı Sucuklu Katmer",
      "price": "192 TL",
      "desc": "Sucuk",
      "category": "Katmerler"
    },
    {
      "name": "Çiğ Köfte (10 Sıkım)",
      "price": "160 TL",
      "desc": "Domates, limon, kıvırcık marul, lavaş ile",
      "category": "Çiğ Köfteler"
    },
    {
      "name": "Çiğ Köfte (20 Sıkım)",
      "price": "240 TL",
      "desc": "Domates, limon, kıvırcık marul, lavaş ile",
      "category": "Çiğ Köfteler"
    },
    {
      "name": "Çiğ köfte (30 Sıkım)",
      "price": "320 TL",
      "desc": "Domates, limon, kıvırcık marul, lavaş ile",
      "category": "Çiğ Köfteler"
    },
    {
      "name": "Domates Söğüş",
      "price": "40 TL",
      "desc": "Tek kişilik",
      "category": "Yan Ürünler"
    },
    {
      "name": "Lavaş Ekmeği",
      "price": "32 TL",
      "desc": "Adet olarak servis edilmektedir.",
      "category": "Yan Ürünler"
    },
    {
      "name": "Soğan Söğüş",
      "price": "40 TL",
      "desc": "Tek kişilik",
      "category": "Yan Ürünler"
    },
    {
      "name": "Tırnak Pide",
      "price": "48 TL",
      "desc": "Mayalı hamura şekil verilerek hazırlanan sade bir pide çeşididir.",
      "category": "Yan Ürünler"
    },
    {
      "name": "Ezme",
      "price": "88 TL",
      "desc": "Tek kişilik",
      "category": "Yan Ürünler"
    },
    {
      "name": "Katmer Tatlısı",
      "price": "240 TL",
      "desc": "Tek kişilik",
      "category": "Tatlılar"
    },
    {
      "name": "Antep Fıstıklı Dolama",
      "price": "240 TL",
      "desc": "Tek kişilik",
      "category": "Tatlılar"
    },
    {
      "name": "Kiremitte Sütlaç",
      "price": "120 TL",
      "desc": "Tek kişilik",
      "category": "Tatlılar"
    },
    {
      "name": "Künefe",
      "price": "224 TL",
      "desc": "Tek kişilik",
      "category": "Tatlılar"
    },
    {
      "name": "Coca-Cola (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sprite (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Cappy (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Fuse Tea Şeftali (33 cl.)",
      "price": "96 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Şalgam Suyu (33 cl.)",
      "price": "64 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Ayran (30 cl.)",
      "price": "64 TL",
      "desc": "Büyük boy",
      "category": "İçecekler"
    },
    {
      "name": "Soda (20 cl.)",
      "price": "48 TL",
      "desc": "Cam şişe",
      "category": "İçecekler"
    },
    {
      "name": "Su (50 cl.)",
      "price": "40 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (1 L.)",
      "price": "176 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola Şekersiz (1 L.)",
      "price": "176 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (1 L.)",
      "price": "176 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Ayran (1 L.)",
      "price": "152 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Coca-Cola (2,5 L.)",
      "price": "240 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Fanta (2,5 L.)",
      "price": "240 TL",
      "desc": "Pet şişe",
      "category": "İçecekler"
    },
    {
      "name": "Sarıyer Portakal (33 cl.)",
      "price": "64 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    },
    {
      "name": "Sarıyer Kola (33 cl.)",
      "price": "64 TL",
      "desc": "Kutu içecek",
      "category": "İçecekler"
    }
  ]
}
,
  "7250": {
  "name": "Mart Coffee Co.",
  "sourceUrl": "https://www.instagram.com/martcoffeeco/",
  "sourceName": "Mart Coffee Co. resmi Instagram içerikleri (fiyat yayınlanmamış)",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Americano",
      "price": "",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Latte",
      "price": "",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Matcha",
      "price": "",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Fettucine",
      "price": "",
      "desc": "",
      "category": "Yemekler"
    },
    {
      "name": "El Yapımı Magnolya",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    }
  ]
}
,
  "7251": {
  "name": "Ransserie Cafe House",
  "sourceUrl": "https://ransserie.wixsite.com/cafe/menu",
  "sourceName": "Ransserie resmi Wix menüsü",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Lime Mint",
      "price": "70 TL",
      "desc": "Cooler Lime + Naneli patlayan boba!",
      "category": "İçecekler"
    },
    {
      "name": "Pink Pitaya",
      "price": "70 TL",
      "desc": "Pink Pitaya + Yaban Mersinli patlayan boba!",
      "category": "İçecekler"
    },
    {
      "name": "Mango Yo",
      "price": "80 TL",
      "desc": "Mangolu yoğurt + Limonlu Patlayan Boba!",
      "category": "İçecekler"
    },
    {
      "name": "Red Berries Yo",
      "price": "80 TL",
      "desc": "Orman Meyveli yoğurt + Yaban Mersinli Patlayan Boba!",
      "category": "İçecekler"
    },
    {
      "name": "Melon Yo",
      "price": "80 TL",
      "desc": "Kavunlu yoğurt + Kavunlu Patlayan Boba!",
      "category": "İçecekler"
    },
    {
      "name": "Hazelnut Choco",
      "price": "85 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Chocolate",
      "price": "76 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Banana Caramel",
      "price": "76 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Milk Tea",
      "price": "65 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Hazelnut Milk Tea",
      "price": "76 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Caffee Latte",
      "price": "81 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Green Tea",
      "price": "76 TL",
      "desc": "",
      "category": "İçecekler"
    },
    {
      "name": "Caffe Latte",
      "price": "59 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Cappuccino",
      "price": "59 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Americano",
      "price": "54 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Filtre Kahve",
      "price": "54 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Espresso",
      "price": "37 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Macchiato",
      "price": "40 TL",
      "desc": "",
      "category": "HOT COFFEE"
    },
    {
      "name": "Ice Caffe Latte",
      "price": "65 TL",
      "desc": "",
      "category": "ICE COFFEE"
    },
    {
      "name": "Ice Cappuccino",
      "price": "65 TL",
      "desc": "",
      "category": "ICE COFFEE"
    },
    {
      "name": "Ice Americano",
      "price": "59 TL",
      "desc": "",
      "category": "ICE COFFEE"
    },
    {
      "name": "Extra Boba",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    },
    {
      "name": "Extra Shot",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    },
    {
      "name": "Caramel",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    },
    {
      "name": "White Choco",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    },
    {
      "name": "Chocolate",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    },
    {
      "name": "Hazelnut",
      "price": "15 TL",
      "desc": "",
      "category": "EXTRA"
    }
  ]
}
,
  "7252": {
  "name": "Hisar Buselik",
  "sourceUrl": "https://buselikmeyhane.com/",
  "sourceName": "Buselik resmi marka menüsü (Hisar Buselik şubesi)",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "EZİNE BEYAZ PEYNİR",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "KAVUN",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "DOMATES & SALATALIK SÖĞÜŞ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "ANKARA ÇUBUK TURŞUSU, ERİK TURŞUSU, BAMYA TURŞUSU VE BİBER TURŞUSU",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "KÖZ PATLICANLI ATOM",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "REYHANLI HAYDARİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "BADEMLİ KURU CACIK",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "AVOKADOLU BALLI HARDALLI KARİDES",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "KÖZ PATLICAN; SARIMSAKLI KONFİT DOMATES",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "FAVA",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "VİŞNELİ PANCAR, CEVİZ VE KAYMAK",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "FİRİKLİ ANTAKYA KIRMA ZEYTİN SALATASI, KURU DOMATES, KÖZ BİBER, NAR EKŞİSİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "MUHAMMARA",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "MARİNE LEVREK",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "BADEM VE FISTIKLI GİRİT EZMESİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "KÖZ SARIMSAK VE ARPACIK SOĞAN",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "TAZE DOMATES VE SARIMSAKLI DENİZ BÖRÜLCESİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "VİŞNELİ YAPRAK SARMA",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "FASULYE PİLAKİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "MUTABBEL",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "MARİKA",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "FESLEĞENLİ VE KIRMIZI SOĞANLI LEVREK MARİN",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "NARENCİYE SOSLU IZGARA ENGİNAR KALBİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "SEMİZOTLU MASTABE",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "SEMİZOTU MASTABE SÜZME YOĞURT VE BADEM İLE",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "ZEYTİNYAĞLI ENGİNAR",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "HAVUÇ TARATOR, ÇITIR HAVUÇ VE KAVRULMUŞ CEVİZ İLE",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "KÖPOĞLU, KİBRİT PATATES, AY ÇEKİRDEĞİ İLE",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "FÜME EKŞİLİ SOYA SOSLU USKUMRU",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "ARNAVUT CİĞERİ",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "BİBER BORANİ, KAVRULMUŞ FISTIK",
      "price": "",
      "desc": "",
      "category": "Mezeler"
    },
    {
      "name": "İNCE KIYIM ROKA SALATASI",
      "price": "",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "GAVURDAĞI SALATASI",
      "price": "",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "DOMATES SALATASI, KIRMIZI SOĞAN VE İZMİR TULUMU İLE",
      "price": "",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "VİŞNELİ YEŞİLLİK SALATASI",
      "price": "",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "TAHİN TARATORLU İNCE KIYIM YEŞİL SALATA, NAR, CEVİZ İLE",
      "price": "",
      "desc": "",
      "category": "Salatalar"
    },
    {
      "name": "BAKLAVA HAMURUNA SARILI SAGANAKİ, SUSAMLI VE BALLI",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "ÇITIR KABAK KIZARTMA",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "SUCUKLU KAŞARLI SICAK HUMUS",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "PAÇANGA BÖREĞİ",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "PASTIRMALI SICAK HUMUS",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "GÜVEÇTE YAPRAK CİĞER",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "KALAMAR TAVA",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "TEREYAĞLI VE SARIMSAKLI KARİDES",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "GÜVEÇTE KOKOREÇ",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "DANA DİL",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "MÜCVER, OTLU YOĞURT SOS",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "IZGARA İSTİRİDYE MANTARI, SARIMSAKLI ACILI TEREYAĞI",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "MEVSİM OTU KAVURMASI VE YOĞURT",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "EV USULÜ KIZARMIŞ PATATES YOĞURT, DOMATES SOS",
      "price": "",
      "desc": "",
      "category": "Ara Sıcaklar"
    },
    {
      "name": "FIRINDA TAHİN HELVASI VE VANİLYALI DONDURMA",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "PEYNİR HELVASI",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "MEVSİM MEYVELERİ",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "FISTIKLI ÇITIR BAKLAVA",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "ÇITIR KABAK TATLISI",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "SOĞUK SÜTLÜ ILIK İRMİK HELVASI",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "ÇITIR BAKLAVA YUFKASINDA ÇİKOLATALI SUFLE",
      "price": "",
      "desc": "",
      "category": "Tatlılar"
    },
    {
      "name": "MEVSİM BALIĞI KIZARTMA YA DA IZGARA",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "SACDA TANTUNİ",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "OTLU IZGARA LEVREK",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "KUZU SAÇ KAVURMA, KIZARMIŞ BAZLAMA İLE",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "MAYDANOZLU KÖFTE",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "IZGARA LOKUM BONFİLE",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    },
    {
      "name": "KAĞITTA LEVREK",
      "price": "",
      "desc": "",
      "category": "Ana Yemekler"
    }
  ]
}
,
  "7253": {
  "name": "Çıtır Ocakbaşı",
  "sourceUrl": "https://www.instagram.com/citirocakbasii/",
  "sourceName": "Çıtır Ocakbaşı resmi Instagram içeriği (fiyat yayınlanmamış)",
  "verifiedAt": "2026-08-23",
  "items": [
    {
      "name": "Pastırmalı Humus",
      "price": "",
      "desc": "Yumuşacık humus, köz aromasının sıcaklığı ve pastırma.",
      "category": "Mezeler"
    }
  ]
}
};
