import type { ImageSourcePropType } from "react-native";
import type { Place } from "@/src/services/mekanService";
import { API_BASE_URL } from "@/src/constants/api";
const nezahatNurettinEgeKosku = require("../../assets/places/nezahat-nurettin-ege-kosku.jpg") as ImageSourcePropType;
const sushicoZorluCenter = require("../../assets/places/sushico-zorlu-center.jpg") as ImageSourcePropType;
const limonluBahce = require("../../assets/places/limonlu-bahce.jpg") as ImageSourcePropType;
const geceDonercisiKavacik = require("../../assets/places/gece-donercisi-kavacik.jpg") as ImageSourcePropType;
const uweCoffeeRoasters = require("../../assets/places/uwe-coffee-roasters.jpg") as ImageSourcePropType;
const merciBaku = require("../../assets/places/merci-baku.jpg") as ImageSourcePropType;
const pizzalazzaBesiktas = require("../../assets/places/pizzalazza-besiktas.jpg") as ImageSourcePropType;
const masterartBurger = require("../../assets/places/masterart-burger.jpg") as ImageSourcePropType;
const besBicakSteak = require("../../assets/places/bes-bicak-steak.jpg") as ImageSourcePropType;
const sarmasikCoffeeCo = require("../../assets/places/sarmasik-coffee-co.jpg") as ImageSourcePropType;
const pizzaWichBesiktas = require("../../assets/places/pizza-wich-besiktas.jpg") as ImageSourcePropType;
const isokyoZorluCenter = require("../../assets/places/isokyo-zorlu-center.webp") as ImageSourcePropType;
const durumcuEsnafPasabahce = require("../../assets/places/durumcu-esnaf-pasabahce.jpg") as ImageSourcePropType;
const coffeeBreakCocoBambu = require("../../assets/places/coffee-break-coco-bambu.jpg") as ImageSourcePropType;
const koskaBeylikduzu = require("../../assets/places/koska-beylikduzu.jpg") as ImageSourcePropType;
const kebabimBeylikduzu = require("../../assets/places/kebabim-beylikduzu.jpg") as ImageSourcePropType;
const besiktastaBirMeyhane = require("../../assets/places/besiktasta-bir-meyhane.jpg") as ImageSourcePropType;
const yuceFirin = require("../../assets/places/yuce-firin.jpg") as ImageSourcePropType;
const pizzalazzaMigros = require("../../assets/places/pizzalazza-migros.jpg") as ImageSourcePropType;
const haciUstaKebapHouse = require("../../assets/places/haci-usta-kebap-house.jpg") as ImageSourcePropType;
const pidemideBeylikduzu = require("../../assets/places/pidemide-beylikduzu.jpg") as ImageSourcePropType;
const pizzaKremaAkaretler = require("../../assets/places/pizza-krema-akaretler.jpeg") as ImageSourcePropType;
const babelOcakbasiNevizade = require("../../assets/places/babel-ocakbasi-nevizade.jpg") as ImageSourcePropType;
const senfoniRestoranCafe = require("../../assets/places/senfoni-restoran-cafe.jpg") as ImageSourcePropType;
const ativaCoffee = require("../../assets/places/ativa-coffee.jpg") as ImageSourcePropType;
const simirnaSogus = require("../../assets/places/simirna-sogus.jpg") as ImageSourcePropType;
const pasamRomaDondurma = require("../../assets/places/pasam-roma-dondurma.jpg") as ImageSourcePropType;
const alaRasiRestaurant = require("../../assets/places/ala-rasi-restaurant.jpg") as ImageSourcePropType;
const anzorMeatDoner = require("../../assets/places/anzor-meat-doner.jpg") as ImageSourcePropType;
const citirOcakbasi = require("../../assets/places/citir-ocakbasi.jpg") as ImageSourcePropType;
const hisarBuselik = require("../../assets/places/hisar-buselik.jpg") as ImageSourcePropType;
const ransserieCafeHouse = require("../../assets/places/ransserie-cafe-house.jpg") as ImageSourcePropType;
const besiktasCitirPide = require("../../assets/places/besiktas-citir-pide.jpeg") as ImageSourcePropType;
const waltersCoffeeRoastery = require("../../assets/places/walters-coffee-roastery.jpg") as ImageSourcePropType;
const booksCoffeeYeldegirmeni = require("../../assets/places/books-coffee-yeldegirmeni.jpg") as ImageSourcePropType;
const meetLabCoffee = require("../../assets/places/meet-lab-coffee.jpg") as ImageSourcePropType;
const tilkiCoffee = require("../../assets/places/tilki-coffee.jpg") as ImageSourcePropType;
const elaneCoffeeShop = require("../../assets/places/elane-coffee-shop.jpg") as ImageSourcePropType;
const lesCalinsCompagnieDeCafe = require("../../assets/places/les-calins-compagnie-de-cafe.jpg") as ImageSourcePropType;
const sevenSpecialtyCoffee = require("../../assets/places/seven-specialty-coffee.jpg") as ImageSourcePropType;
const vCoffeeKadikoy = require("../../assets/places/v-coffee-kadikoy.webp") as ImageSourcePropType;
const theCoffeeFactoryKadikoy = require("../../assets/places/the-coffee-factory-kadikoy.jpg") as ImageSourcePropType;
const storyCoffeeRoastery = require("../../assets/places/story-coffee-roastery.jpg") as ImageSourcePropType;
const torrefactoCoffeeRoastery = require("../../assets/places/torrefacto-coffee-roastery.jpg") as ImageSourcePropType;
const caffeSemplice = require("../../assets/places/caffe-semplice.jpg") as ImageSourcePropType;
const ciyaSofrasi = require("../../assets/places/ciya-sofrasi.jpg") as ImageSourcePropType;
const yanyaliFehmiLokantasi = require("../../assets/places/yanyali-fehmi-lokantasi.jpg") as ImageSourcePropType;
const mudavimLokantasi = require("../../assets/places/mudavim-lokantasi.jpg") as ImageSourcePropType;
const kadikoyMidyecisi = require("../../assets/places/kadikoy-midyecisi.jpg") as ImageSourcePropType;
const adanaliUmitUsta = require("../../assets/places/adanali-umit-usta.jpg") as ImageSourcePropType;
const theTownhouse = require("../../assets/places/the-townhouse.jpg") as ImageSourcePropType;
const nohutFalafelHumus = require("../../assets/places/nohut-falafel-humus.jpg") as ImageSourcePropType;
const kadikoyCigerci = require("../../assets/places/kadikoy-cigerci.jpg") as ImageSourcePropType;
const canakKebapKatmer = require("../../assets/places/canak-kebap-katmer.jpg") as ImageSourcePropType;
const mantiHouseKadikoy = require("../../assets/places/manti-house-kadikoy.jpg") as ImageSourcePropType;
const semolinaItalianRestaurant = require("../../assets/places/semolina-italian-restaurant.jpg") as ImageSourcePropType;
const aidaVinoECucina = require("../../assets/places/aida-vino-e-cucina.jpg") as ImageSourcePropType;
const laPastaMamma = require("../../assets/places/la-pasta-mamma.jpg") as ImageSourcePropType;
const nellosItalianRestaurantErenkoy = require("../../assets/places/nellos-italian-restaurant-erenkoy.jpg") as ImageSourcePropType;
const ilBoccalino34 = require("../../assets/places/il-boccalino-34.jpg") as ImageSourcePropType;
const yamoSushiCaddebostan = require("../../assets/places/yamo-sushi-caddebostan.jpg") as ImageSourcePropType;
const misoRamenModa = require("../../assets/places/miso-ramen-moda.jpg") as ImageSourcePropType;
const ororoSushiBarModa = require("../../assets/places/ororo-sushi-bar-moda.jpg") as ImageSourcePropType;
const saltator = require("../../assets/places/saltator.jpg") as ImageSourcePropType;
const cundaBalik = require("../../assets/places/cunda-balik.jpg") as ImageSourcePropType;
const suadiyeBalik = require("../../assets/places/suadiye-balik.jpg") as ImageSourcePropType;
const nisanBalik = require("../../assets/places/nisan-balik.jpg") as ImageSourcePropType;
const saskinBalikEfkan = require("../../assets/places/saskin-balik-efkan.jpg") as ImageSourcePropType;
const mezzeHouse = require("../../assets/places/mezze-house.jpg") as ImageSourcePropType;
const kayipLimanBalikcisi = require("../../assets/places/kayip-liman-balikcisi.jpg") as ImageSourcePropType;
const kocoRestaurant = require("../../assets/places/koco-restaurant.jpg") as ImageSourcePropType;
const misinaBalikRestaurant = require("../../assets/places/misina-balik-restaurant.jpg") as ImageSourcePropType;
const bastaStreetFoodBar = require("../../assets/places/basta-street-food-bar.jpg") as ImageSourcePropType;
const threeBurgerKadikoy = require("../../assets/places/three-burger-kadikoy.jpg") as ImageSourcePropType;
const threeMonkeysBurger = require("../../assets/places/three-monkeys-burger.jpg") as ImageSourcePropType;
const gettoBurger = require("../../assets/places/getto-burger.jpg") as ImageSourcePropType;
const rockPub = require("../../assets/places/rock-pub.jpg") as ImageSourcePropType;
const belfastIrishPub = require("../../assets/places/belfast-irish-pub.jpg") as ImageSourcePropType;
const londonPub = require("../../assets/places/london-pub.jpg") as ImageSourcePropType;
const hicPub = require("../../assets/places/hic-pub.jpg") as ImageSourcePropType;
const berlinPlatzPub = require("../../assets/places/berlin-platz-pub.jpg") as ImageSourcePropType;
const oldEnglishPub = require("../../assets/places/old-english-pub.jpg") as ImageSourcePropType;
const zurichPub = require("../../assets/places/zurich-pub.jpg") as ImageSourcePropType;
const baykusPub = require("../../assets/places/baykus-pub.jpg") as ImageSourcePropType;
const revoltePub = require("../../assets/places/revolte-pub.jpg") as ImageSourcePropType;
const mirrorRestaurantBar = require("../../assets/places/mirror-restaurant-bar.jpg") as ImageSourcePropType;
const theWallBar = require("../../assets/places/the-wall-bar.jpg") as ImageSourcePropType;
const tarihiSakizAgaci = require("../../assets/places/tarihi-sakiz-agaci.jpg") as ImageSourcePropType;
const inciburnuFeneri = require("../../assets/places/inciburnu-feneri.jpg") as ImageSourcePropType;
const bostanciTarihiCesme = require("../../assets/places/bostanci-tarihi-cesme.jpg") as ImageSourcePropType;
const ayrilikCesmesi = require("../../assets/places/ayrilik-cesmesi.jpg") as ImageSourcePropType;
const haydarpasaMendiregi = require("../../assets/places/haydarpasa-mendiregi.jpg") as ImageSourcePropType;
const tarihiYeldegirmeniSokak = require("../../assets/places/tarihi-yeldegirmeni-sokak.jpg") as ImageSourcePropType;
const kadikoyBogaHeykeli = require("../../assets/places/kadikoy-boga-heykeli.jpg") as ImageSourcePropType;
const filiziKosk = require("../../assets/places/filizi-kosk.jpg") as ImageSourcePropType;
const arifHikmetPasaKosk = require("../../assets/places/arif-hikmet-pasa-kosku.jpg") as ImageSourcePropType;
const sadunOdaBoroHeykeli = require("../../assets/places/sadun-oda-boro-heykeli.jpg") as ImageSourcePropType;
const tevhideHanimKosk = require("../../assets/places/tevhide-hanim-kosku.jpg") as ImageSourcePropType;
const istanbulOyuncakMuzesi = require("../../assets/places/istanbul-oyuncak-muzesi.jpg") as ImageSourcePropType;
const barisMancoEvi = require("../../assets/places/baris-manco-evi.jpg") as ImageSourcePropType;
const muzeGazhane = require("../../assets/places/muze-gazhane.jpg") as ImageSourcePropType;
const kazimKarabekirPasaMuzesi = require("../../assets/places/kazim-karabekir-pasa-muzesi.webp") as ImageSourcePropType;
const iklimMuzesi = require("../../assets/places/iklim-muzesi.jpg") as ImageSourcePropType;
const haldunTanerMuzeEvi = require("../../assets/places/haldun-taner-muze-evi.jpg") as ImageSourcePropType;
const osmanHamdiBeyHeykeli = require("../../assets/places/osman-hamdi-bey-heykeli.jpg") as ImageSourcePropType;
const cadde160ArtGallery = require("../../assets/places/cadde160-art-gallery.jpg") as ImageSourcePropType;
const redArtIstanbul = require("../../assets/places/red-art-istanbul.jpg") as ImageSourcePropType;
const duendeKalamis = require("../../assets/places/duende-kalamis.jpg") as ImageSourcePropType;
const chiArtGallery = require("../../assets/places/chi-art-gallery.jpg") as ImageSourcePropType;
const venusSanatGalerisi = require("../../assets/places/venus-sanat-galerisi.jpg") as ImageSourcePropType;
const decollageArtSpace = require("../../assets/places/decollage-art-space.jpg") as ImageSourcePropType;
const artSanatsalKadikoy = require("../../assets/places/art-sanatsal-kadikoy.jpeg") as ImageSourcePropType;
const brekkieBreakfastClub = require("../../assets/places/brekkie-breakfast-club.jpg") as ImageSourcePropType;
const mixBreakfastYeldegirmeni = require("../../assets/places/mix-breakfast-yeldegirmeni.jpg") as ImageSourcePropType;
const fabescoRestaurantCafe = require("../../assets/places/fabesco-restaurant-cafe.jpg") as ImageSourcePropType;
const rucioBreakfastYeldegirmeni = require("../../assets/places/rucio-breakfast-yeldegirmeni.jpg") as ImageSourcePropType;
const lilBakeModa = require("../../assets/places/lil-bake-moda.jpg") as ImageSourcePropType;
const turpVegan = require("../../assets/places/turp-vegan.jpg") as ImageSourcePropType;
const veganMasa = require("../../assets/places/vegan-masa.jpg") as ImageSourcePropType;
const millBakery = require("../../assets/places/mill-bakery.jpg") as ImageSourcePropType;
const bbsKadikoy = require("../../assets/places/bbs-kadikoy.jpg") as ImageSourcePropType;
const fernMediterraneanEatery = require("../../assets/places/fern-mediterranean-eatery.jpg") as ImageSourcePropType;
const gringoVeganStreetFood = require("../../assets/places/gringo-vegan-street-food.jpeg") as ImageSourcePropType;
const ruloEzberbozanLezzetler = require("../../assets/places/rulo-ezberbozan-lezzetler.jpg") as ImageSourcePropType;
const fitMill = require("../../assets/places/fit-mill.jpg") as ImageSourcePropType;
const fitHouse = require("../../assets/places/fit-house.jpg") as ImageSourcePropType;
const veganBakkalModa = require("../../assets/places/vegan-bakkal-moda.jpg") as ImageSourcePropType;
const breadHouseHomeBaked = require("../../assets/places/bread-house-home-baked.jpg") as ImageSourcePropType;
const piktaBakery = require("../../assets/places/pikta-bakery.jpg") as ImageSourcePropType;
const iraBakeryErenkoy = require("../../assets/places/ira-bakery-erenkoy.webp") as ImageSourcePropType;
const kukumavBakeryErenkoy = require("../../assets/places/kukumav-bakery-erenkoy.jpg") as ImageSourcePropType;
const moaCoffeeBakery = require("../../assets/places/moa-coffee-bakery.jpg") as ImageSourcePropType;
const bellaBakeryCoffee = require("../../assets/places/bella-bakery-coffee.jpg") as ImageSourcePropType;
const sourSweetArtisanBakery = require("../../assets/places/sour-sweet-artisan-bakery.jpg") as ImageSourcePropType;
const tahanBakery = require("../../assets/places/tahan-bakery.jpg") as ImageSourcePropType;
const nanAbPatisserie = require("../../assets/places/nan-ab-patisserie.jpg") as ImageSourcePropType;
const baylanKadikoy = require("../../assets/places/baylan-kadikoy.jpg") as ImageSourcePropType;
const lovellsPatisserie = require("../../assets/places/lovells-patisserie.jpg") as ImageSourcePropType;
const beyazFirinKadikoy = require("../../assets/places/beyaz-firin-kadikoy.jpg") as ImageSourcePropType;
const oCoffeeBesiktas = require("../../assets/places/o-coffee-besiktas.jpg") as ImageSourcePropType;
const endCoffeeChocolate = require("../../assets/places/end-coffee-chocolate.jpg") as ImageSourcePropType;
const sourSweetSuadiye = require("../../assets/places/sour-sweet-suadiye.jpg") as ImageSourcePropType;
const dealCoffee = require("../../assets/places/deal-coffee.jpg") as ImageSourcePropType;
const perNoiCoffeeOrtakoy = require("../../assets/places/per-noi-coffee-ortakoy.webp") as ImageSourcePropType;
const bexCoffee = require("../../assets/places/bex-coffee.jpg") as ImageSourcePropType;
const sabbaCoffee = require("../../assets/places/sabba-coffee.jpg") as ImageSourcePropType;
const laCafferiaBesiktas = require("../../assets/places/la-cafferia-besiktas.jpg") as ImageSourcePropType;
const uWeCoffeeRoasters = require("../../assets/places/u-we-coffee-roasters.jpg") as ImageSourcePropType;
const espressolabBesiktasMeydan = require("../../assets/places/espressolab-besiktas-meydan.jpg") as ImageSourcePropType;
const pogeloCoffeeMore = require("../../assets/places/pogelo-coffee-more.jpg") as ImageSourcePropType;
const glaneCoffee = require("../../assets/places/glane-coffee.jpg") as ImageSourcePropType;
const jojoOcakbasiMeze = require("../../assets/places/jojo-ocakbasi-meze.jpg") as ImageSourcePropType;
const kebapciMemet = require("../../assets/places/kebapci-memet.jpg") as ImageSourcePropType;
const semtOcakbasi = require("../../assets/places/semt-ocakbasi.jpg") as ImageSourcePropType;
const kardesPayiKahvalti = require("../../assets/places/kardes-payi-kahvalti.jpg") as ImageSourcePropType;
const eliseKaradenizPide = require("../../assets/places/elise-karadeniz-pide.jpg") as ImageSourcePropType;
const durumceOrtakoy = require("../../assets/places/durumce-ortakoy.jpg") as ImageSourcePropType;
const theMarketAtBosphorus = require("../../assets/places/the-market-at-bosphorus.jpg") as ImageSourcePropType;
const theBestCafe = require("../../assets/places/the-best-cafe.jpg") as ImageSourcePropType;
const biKahvalti = require("../../assets/places/bi-kahvalti.jpg") as ImageSourcePropType;
const mercanKebapBesiktas = require("../../assets/places/mercan-kebap-besiktas.jpg") as ImageSourcePropType;
const adanaliKebapPideLahmacun = require("../../assets/places/adanali-kebap-pide-lahmacun.jpg") as ImageSourcePropType;
const fistikKebapLahmacun = require("../../assets/places/fistik-kebap-lahmacun.jpg") as ImageSourcePropType;
const adanaTiryakiOcakbasi = require("../../assets/places/adana-tiryaki-ocakbasi.jpg") as ImageSourcePropType;
const citirOcakbasiGayrettepe = require("../../assets/places/citir-ocakbasi-gayrettepe.jpg") as ImageSourcePropType;
const durumcuEniste = require("../../assets/places/durumcu-eniste.jpg") as ImageSourcePropType;
const eldeBorek = require("../../assets/places/elde-borek.jpg") as ImageSourcePropType;
const yallaFalafel = require("../../assets/places/yalla-falafel.jpg") as ImageSourcePropType;
const renkliLimon = require("../../assets/places/renkli-limon.jpg") as ImageSourcePropType;
const cakmakKahvaltiSalonu = require("../../assets/places/cakmak-kahvalti-salonu.jpg") as ImageSourcePropType;
const trattoriaCarbonara = require("../../assets/places/trattoria-carbonara.jpg") as ImageSourcePropType;
const daMarioRistorante = require("../../assets/places/da-mario-ristorante.jpg") as ImageSourcePropType;
const emporioRistoranteAkaretler = require("../../assets/places/emporio-ristorante-akaretler.jpg") as ImageSourcePropType;
const pastaToGoAkaretler = require("../../assets/places/pasta-to-go-akaretler.jpg") as ImageSourcePropType;
const pastaVeraBesiktas = require("../../assets/places/pasta-vera-besiktas.jpg") as ImageSourcePropType;
const anticaLocanda = require("../../assets/places/antica-locanda.jpg") as ImageSourcePropType;
const scarpettaEtiler = require("../../assets/places/scarpetta-etiler.jpg") as ImageSourcePropType;
const antiquePizzeriaBeyoglu = require("../../assets/places/antique-pizzeria-beyoglu.jpg") as ImageSourcePropType;
const sushiLabBesiktas = require("../../assets/places/sushi-lab-besiktas.jpg") as ImageSourcePropType;
const miyabiSushiAkat = require("../../assets/places/miyabi-sushi-akat.jpg") as ImageSourcePropType;
const wingsMatchaOrtakoy = require("../../assets/places/wings-matcha-ortakoy.jpg") as ImageSourcePropType;
const sushiSpiceAkaretler = require("../../assets/places/sushi-spice-akaretler.jpg") as ImageSourcePropType;
const inariOmakaseKurucesme = require("../../assets/places/inari-omakase-kurucesme.webp") as ImageSourcePropType;
const iokiNauKarakoy = require("../../assets/places/ioki-nau-karakoy.jpg") as ImageSourcePropType;
const noodleHouseBesiktas = require("../../assets/places/noodle-house-besiktas.jpg") as ImageSourcePropType;
const sushicoBebek = require("../../assets/places/sushico-bebek.jpg") as ImageSourcePropType;
const maderiaSushiBar = require("../../assets/places/maderia-sushi-bar.jpg") as ImageSourcePropType;
const ademBabaArnavutkoy = require("../../assets/places/adem-baba-arnavutkoy.jpg") as ImageSourcePropType;
const midyeciAhmetBesiktas = require("../../assets/places/midyeci-ahmet-besiktas.jpg") as ImageSourcePropType;
const maviBalikBesiktas = require("../../assets/places/mavi-balik-besiktas.jpg") as ImageSourcePropType;
const carsiBalikBesiktas = require("../../assets/places/carsi-balik-besiktas.jpg") as ImageSourcePropType;
const istakoziSeaFastFood = require("../../assets/places/istakozi-sea-fast-food.jpg") as ImageSourcePropType;
const barbarosBalikcisiBesiktas = require("../../assets/places/barbaros-balikcisi-besiktas.jpg") as ImageSourcePropType;
const surBalikArnavutkoy = require("../../assets/places/sur-balik-arnavutkoy.jpg") as ImageSourcePropType;
const arnavutkoyBalikcisi = require("../../assets/places/arnavutkoy-balikcisi.jpg") as ImageSourcePropType;
const galataSanatRestaurant = require("../../assets/places/galata-sanat-restaurant.jpg") as ImageSourcePropType;
const kurucesmeBalik = require("../../assets/places/kurucesme-balik.jpg") as ImageSourcePropType;
const theSmashyBesiktas = require("../../assets/places/the-smashy-besiktas.jpg") as ImageSourcePropType;
const biberBurgerBesiktas = require("../../assets/places/biber-burger-besiktas.jpg") as ImageSourcePropType;
const betroBurgerBesiktas = require("../../assets/places/betro-burger-besiktas.jpg") as ImageSourcePropType;
const blackDropBesiktas = require("../../assets/places/black-drop-besiktas.jpg") as ImageSourcePropType;
const beltasBurgerBesiktas = require("../../assets/places/beltas-burger-besiktas.jpg") as ImageSourcePropType;
const ilPolloDelCapoBesiktas = require("../../assets/places/il-pollo-del-capo-besiktas.jpg") as ImageSourcePropType;
const whiteBurgerBesiktas = require("../../assets/places/white-burger-besiktas.png") as ImageSourcePropType;
const bcanteBesiktas = require("../../assets/places/bcante-besiktas.jpg") as ImageSourcePropType;
const missionStreetFood = require("../../assets/places/mission-street-food.jpg") as ImageSourcePropType;

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  kafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  restoran: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  "gece kulübü": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "fast food": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800",
  meyhane: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
  "nargile cafe": "https://images.unsplash.com/photo-1527661929436-1e546b1e5b3e?w=800",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

const PLACE_IMAGE_OVERRIDES: Record<string, ImageSourcePropType> = {
  "7289": sushicoZorluCenter,
  "7288": limonluBahce,
  "7287": geceDonercisiKavacik,
  "7285": uweCoffeeRoasters,
  "7284": merciBaku,
  "7282": pizzalazzaBesiktas,
  "7281": masterartBurger,
  "7280": besBicakSteak,
  "7279": sarmasikCoffeeCo,
  "7278": pizzaWichBesiktas,
  "7277": isokyoZorluCenter,
  "7276": durumcuEsnafPasabahce,
  "7275": coffeeBreakCocoBambu,
  "7274": koskaBeylikduzu,
  "7273": kebabimBeylikduzu,
  "7272": besiktastaBirMeyhane,
  "7270": yuceFirin,
  "7269": pizzalazzaMigros,
  "7268": haciUstaKebapHouse,
  "7267": pidemideBeylikduzu,
  "7266": pizzaKremaAkaretler,
  "7265": babelOcakbasiNevizade,
  "7264": senfoniRestoranCafe,
  "7262": ativaCoffee,
  "7261": simirnaSogus,
  "7260": pasamRomaDondurma,
  "7256": alaRasiRestaurant,
  "7255": anzorMeatDoner,
  "7253": citirOcakbasi,
  "7252": hisarBuselik,
  "7251": ransserieCafeHouse,
  "7249": besiktasCitirPide,
  "854": nezahatNurettinEgeKosku,
  "639": booksCoffeeYeldegirmeni,
  "638": waltersCoffeeRoastery,
  "644": meetLabCoffee,
  "648": tilkiCoffee,
  "652": elaneCoffeeShop,
  "653": lesCalinsCompagnieDeCafe,
  "657": sevenSpecialtyCoffee,
  "658": vCoffeeKadikoy,
  "659": theCoffeeFactoryKadikoy,
  "660": storyCoffeeRoastery,
  "661": torrefactoCoffeeRoastery,
  "665": caffeSemplice,
  "687": ciyaSofrasi,
  "691": yanyaliFehmiLokantasi,
  "695": mudavimLokantasi,
  "697": kadikoyMidyecisi,
  "698": adanaliUmitUsta,
  "702": theTownhouse,
  "706": nohutFalafelHumus,
  "718": kadikoyCigerci,
  "721": canakKebapKatmer,
  "726": mantiHouseKadikoy,
  "731": semolinaItalianRestaurant,
  "734": aidaVinoECucina,
  "735": laPastaMamma,
  "737": nellosItalianRestaurantErenkoy,
  "743": ilBoccalino34,
  "756": yamoSushiCaddebostan,
  "761": misoRamenModa,
  "764": ororoSushiBarModa,
  "771": saltator,
  "772": cundaBalik,
  "774": suadiyeBalik,
  "775": nisanBalik,
  "777": saskinBalikEfkan,
  "779": mezzeHouse,
  "783": kayipLimanBalikcisi,
  "782": kocoRestaurant,
  "780": misinaBalikRestaurant,
  "797": bastaStreetFoodBar,
  "798": threeBurgerKadikoy,
  "800": threeMonkeysBurger,
  "802": gettoBurger,
  "828": rockPub,
  "829": belfastIrishPub,
  "831": londonPub,
  "832": hicPub,
  "835": berlinPlatzPub,
  "833": oldEnglishPub,
  "841": zurichPub,
  "837": baykusPub,
  "847": revoltePub,
  "849": mirrorRestaurantBar,
  "850": theWallBar,
  "855": tarihiSakizAgaci,
  "856": inciburnuFeneri,
  "857": bostanciTarihiCesme,
  "859": ayrilikCesmesi,
  "860": haydarpasaMendiregi,
  "861": tarihiYeldegirmeniSokak,
  "862": kadikoyBogaHeykeli,
  "864": filiziKosk,
  "869": arifHikmetPasaKosk,
  "870": sadunOdaBoroHeykeli,
  "871": tevhideHanimKosk,
  "873": istanbulOyuncakMuzesi,
  "874": barisMancoEvi,
  "875": muzeGazhane,
  "876": kazimKarabekirPasaMuzesi,
  "877": iklimMuzesi,
  "878": haldunTanerMuzeEvi,
  "879": osmanHamdiBeyHeykeli,
  "881": cadde160ArtGallery,
  "885": redArtIstanbul,
  "886": duendeKalamis,
  "888": chiArtGallery,
  "891": venusSanatGalerisi,
  "892": decollageArtSpace,
  "894": artSanatsalKadikoy,
  "901": brekkieBreakfastClub,
  "902": mixBreakfastYeldegirmeni,
  "903": fabescoRestaurantCafe,
  "905": rucioBreakfastYeldegirmeni,
  "907": lilBakeModa,
  "913": millBakery,
  "914": bbsKadikoy,
  "915": fernMediterraneanEatery,
  "920": turpVegan,
  "921": veganMasa,
  "923": gringoVeganStreetFood,
  "928": ruloEzberbozanLezzetler,
  "932": fitMill,
  "934": fitHouse,
  "935": veganBakkalModa,
  "939": breadHouseHomeBaked,
  "940": piktaBakery,
  "943": iraBakeryErenkoy,
  "944": kukumavBakeryErenkoy,
  "946": moaCoffeeBakery,
  "949": bellaBakeryCoffee,
  "950": sourSweetArtisanBakery,
  "953": tahanBakery,
  "954": nanAbPatisserie,
  "957": baylanKadikoy,
  "959": lovellsPatisserie,
  "961": beyazFirinKadikoy,
  "963": sourSweetSuadiye,
  "964": oCoffeeBesiktas,
  "965": endCoffeeChocolate,
  "966": dealCoffee,
  "968": perNoiCoffeeOrtakoy,
  "971": bexCoffee,
  "978": sabbaCoffee,
  "981": laCafferiaBesiktas,
  "982": uWeCoffeeRoasters,
  "983": espressolabBesiktasMeydan,
  "986": pogeloCoffeeMore,
  "987": glaneCoffee,
  "994": jojoOcakbasiMeze,
  "997": kebapciMemet,
  "998": semtOcakbasi,
  "1000": kardesPayiKahvalti,
  "1003": eliseKaradenizPide,
  "1005": durumceOrtakoy,
  "1006": theMarketAtBosphorus,
  "1007": theBestCafe,
  "1009": biKahvalti,
  "1015": mercanKebapBesiktas,
  "1020": adanaliKebapPideLahmacun,
  "1022": fistikKebapLahmacun,
  "1024": adanaTiryakiOcakbasi,
  "1025": citirOcakbasiGayrettepe,
  "1029": durumcuEniste,
  "1031": eldeBorek,
  "1032": yallaFalafel,
  "1033": renkliLimon,
  "1035": cakmakKahvaltiSalonu,
  "1036": trattoriaCarbonara,
  "1041": daMarioRistorante,
  "1042": emporioRistoranteAkaretler,
  "1044": pastaToGoAkaretler,
  "1045": pastaVeraBesiktas,
  "1048": anticaLocanda,
  "1051": scarpettaEtiler,
  "1054": antiquePizzeriaBeyoglu,
  "1057": sushiLabBesiktas,
  "1060": miyabiSushiAkat,
  "1062": wingsMatchaOrtakoy,
  "1064": sushiSpiceAkaretler,
  "1066": inariOmakaseKurucesme,
  "1069": iokiNauKarakoy,
  "1071": noodleHouseBesiktas,
  "1072": sushicoBebek,
  "1073": maderiaSushiBar,
  "1075": ademBabaArnavutkoy,
  "1077": midyeciAhmetBesiktas,
  "1079": maviBalikBesiktas,
  "1082": carsiBalikBesiktas,
  "1083": istakoziSeaFastFood,
  "1084": barbarosBalikcisiBesiktas,
  "1085": surBalikArnavutkoy,
  "1086": arnavutkoyBalikcisi,
  "1088": galataSanatRestaurant,
  "1089": kurucesmeBalik,
  "1095": theSmashyBesiktas,
  "1098": betroBurgerBesiktas,
  "1099": biberBurgerBesiktas,
  "1101": blackDropBesiktas,
  "1103": beltasBurgerBesiktas,
  "1106": ilPolloDelCapoBesiktas,
  "1107": whiteBurgerBesiktas,
  "1108": bcanteBesiktas,
  "1110": missionStreetFood,
};

type PlaceLike = Place | { id?: string | number; name?: string; photo_url?: string; category?: string };

function getPlaceOverride(place: PlaceLike): ImageSourcePropType | null {
  const id = "id" in place && place.id != null ? String(place.id) : "";
  return PLACE_IMAGE_OVERRIDES[id] ?? null;
}

export function getPlaceImageSource(
  place: PlaceLike | string | number
): ImageSourcePropType {
  if (typeof place === "object" && place !== null) {
    const override = getPlaceOverride(place);
    if (override) return override;

    if ("photo_url" in place && place.photo_url) {
      const url = place.photo_url.startsWith('/') ? `${API_BASE_URL}${place.photo_url}` : place.photo_url;
      return { uri: url };
    }
    if ("category" in place && place.category) {
      const key = place.category.toLowerCase().trim();
      const url = CATEGORY_PLACEHOLDERS[key];
      if (url) return { uri: url };
    }
  }
  return { uri: DEFAULT_IMAGE };
}

export function hasPlaceImage(
  place: PlaceLike | null | undefined
): boolean {
  if (!place || typeof place !== "object") return false;
  if (getPlaceOverride(place)) return true;
  if ("photo_url" in place && place.photo_url) return true;
  if ("category" in place && place.category) {
    const key = place.category.toLowerCase().trim();
    return key in CATEGORY_PLACEHOLDERS;
  }
  return false;
}
