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
const theTempestSocialHouse = require("../../assets/places/the-tempest-social-house.jpg") as ImageSourcePropType;
const kilitBarBesiktas = require("../../assets/places/kilit-bar-besiktas.jpg") as ImageSourcePropType;
const jokerNo19Besiktas = require("../../assets/places/joker-no19-besiktas.jpg") as ImageSourcePropType;
const missisipiPubBesiktas = require("../../assets/places/missisipi-pub-besiktas.jpg") as ImageSourcePropType;
const citirPubBesiktas = require("../../assets/places/citir-pub-besiktas.jpg") as ImageSourcePropType;
const chopsCafePubBesiktas = require("../../assets/places/chops-cafe-pub-besiktas.jpg") as ImageSourcePropType;
const kiezPubBesiktas = require("../../assets/places/kiez-pub-besiktas.jpg") as ImageSourcePropType;
const oneNumaraPubBesiktas = require("../../assets/places/1-numara-pub-besiktas.jpg") as ImageSourcePropType;
const kosmosBesiktas = require("../../assets/places/kosmos-besiktas.jpg") as ImageSourcePropType;
const ritimRoofBeyoglu = require("../../assets/places/ritim-roof-beyoglu.jpg") as ImageSourcePropType;
const swissotelTheBosphorus = require("../../assets/places/swissotel-the-bosphorus.jpg") as ImageSourcePropType;
const mostHookahOrtakoy = require("../../assets/places/most-hookah-ortakoy.jpg") as ImageSourcePropType;
const dolmabahceSarayi = require("../../assets/places/dolmabahce-sarayi.jpg") as ImageSourcePropType;
const yildizHasbahce = require("../../assets/places/yildiz-hasbahce.jpg") as ImageSourcePropType;
const akaretSiraevler = require("../../assets/places/akaret-siraevler.jpg") as ImageSourcePropType;
const besiktasMeydan = require("../../assets/places/besiktas-meydan.jpg") as ImageSourcePropType;
const dolmabahceSaatKulesi = require("../../assets/places/dolmabahce-saat-kulesi.jpg") as ImageSourcePropType;
const arnavutkoyColorfulHouses = require("../../assets/places/arnavutkoy-colorful-houses.jpg") as ImageSourcePropType;
const istanbulDenizMuzesi = require("../../assets/places/istanbul-deniz-muzesi.jpg") as ImageSourcePropType;
const yildizSarayiSaleKosku = require("../../assets/places/yildiz-sarayi-sale-kosku.jpg") as ImageSourcePropType;
const istanbulResimHeykelMuzesi = require("../../assets/places/istanbul-resim-heykel-muzesi.jpg") as ImageSourcePropType;
const ibbItfaiyeMuzesi = require("../../assets/places/ibb-itfaiye-muzesi.jpg") as ImageSourcePropType;
const ihlamurKasri = require("../../assets/places/ihlamur-kasri.jpg") as ImageSourcePropType;
const arnavutkoyArtGallery = require("../../assets/places/arnavutkoy-art-gallery.jpg") as ImageSourcePropType;
const museContemporary = require("../../assets/places/muse-contemporary.jpg") as ImageSourcePropType;
const visionArtPlatform = require("../../assets/places/vision-art-platform.jpg") as ImageSourcePropType;
const girginPiyanoSanatGalerisi = require("../../assets/places/girgin-piyano-sanat-galerisi.jpg") as ImageSourcePropType;
const galeriKambur = require("../../assets/places/galeri-kambur.jpg") as ImageSourcePropType;
const galeri310 = require("../../assets/places/galeri-310.jpg") as ImageSourcePropType;
const limosKahvalti = require("../../assets/places/limos-kahvalti.jpg") as ImageSourcePropType;
const fourSeasonsCafeBistro = require("../../assets/places/four-seasons-cafe-bistro.jpg") as ImageSourcePropType;
const carmentaKahvalti = require("../../assets/places/carmenta-kahvalti.jpg") as ImageSourcePropType;
const cafeFigu = require("../../assets/places/cafe-figu.jpg") as ImageSourcePropType;
const balkonCafeKahvalti = require("../../assets/places/balkon-cafe-kahvalti.jpg") as ImageSourcePropType;
const hungry = require("../../assets/places/hungry.jpg") as ImageSourcePropType;
const canCafeKahvalti = require("../../assets/places/can-cafe-kahvalti.jpg") as ImageSourcePropType;
const ortakoyCafeKahvalti = require("../../assets/places/ortakoy-cafe-kahvalti.jpg") as ImageSourcePropType;
const veganMasaBesiktas = require("../../assets/places/vegan-masa.jpg") as ImageSourcePropType;
const biNeviDeli = require("../../assets/places/bi-nevi-deli.jpg") as ImageSourcePropType;
const veganIstanbul = require("../../assets/places/vegan-istanbul.jpg") as ImageSourcePropType;
const mamamanti = require("../../assets/places/mamamanti.jpg") as ImageSourcePropType;
const veganDukkanLokanta = require("../../assets/places/vegan-dukkan-lokanta.jpg") as ImageSourcePropType;
const nutcase = require("../../assets/places/nutcase.jpg") as ImageSourcePropType;
const vacilando = require("../../assets/places/vacilando.jpg") as ImageSourcePropType;
const govindaIstanbul = require("../../assets/places/govinda-istanbul.jpg") as ImageSourcePropType;
const abuGoshFilistinKunefesi = require("../../assets/places/abu-gosh-filistin-kunefesi.jpg") as ImageSourcePropType;
const gunBakery = require("../../assets/places/gun-bakery.jpg") as ImageSourcePropType;
const bblokBakeryAkaretler = require("../../assets/places/bblok-bakery-akaretler.jpg") as ImageSourcePropType;
const bblokBakery35a = require("../../assets/places/bblok-bakery-35a.jpg") as ImageSourcePropType;
const monBakehouse = require("../../assets/places/mon-bakehouse.jpg") as ImageSourcePropType;
const yediSekizHasanpasaFirini = require("../../assets/places/yedi-sekiz-hasanpasa-firini.jpg") as ImageSourcePropType;
const biDostCoffeeChocolate = require("../../assets/places/bi-dost-coffee-chocolate.jpg") as ImageSourcePropType;
const seasonArtisanBakery = require("../../assets/places/season-artisan-bakery.jpg") as ImageSourcePropType;
const supperBakery = require("../../assets/places/supper-bakery.jpg") as ImageSourcePropType;
const latteConceptCafe = require("../../assets/places/latte-concept-cafe.jpg") as ImageSourcePropType;
const worldHouseCoffee = require("../../assets/places/world-house-coffee.jpg") as ImageSourcePropType;
const artsCoffeeKarakoy = require("../../assets/places/arts-coffee-karakoy.jpg") as ImageSourcePropType;
const vaaCoffeeGalata = require("../../assets/places/vaa-coffee-galata.jpg") as ImageSourcePropType;
const bravoCoffeeRoastery = require("../../assets/places/bravo-coffee-roastery.jpg") as ImageSourcePropType;
const cafeDaGiovanni = require("../../assets/places/cafe-da-giovanni.jpg") as ImageSourcePropType;
const gramajCoffee = require("../../assets/places/gramaj-coffee.jpg") as ImageSourcePropType;
const xyzCihangir = require("../../assets/places/xyz-cihangir.jpg") as ImageSourcePropType;
const mundoNovoCoffeePatisserie = require("../../assets/places/mundo-novo-coffee-patisserie.jpg") as ImageSourcePropType;
const booksCoffeeKarakoy = require("../../assets/places/books-coffee-karakoy.jpg") as ImageSourcePropType;
const saelCoffee = require("../../assets/places/sael-coffee.jpg") as ImageSourcePropType;
const roastoryCoffee = require("../../assets/places/roastory-coffee.jpg") as ImageSourcePropType;
const muusCoffee = require("../../assets/places/muus-coffee.jpg") as ImageSourcePropType;
const coffeeSapiens = require("../../assets/places/coffee-sapiens.jpg") as ImageSourcePropType;
const cozyCupCoffee = require("../../assets/places/cozy-cup-coffee.jpg") as ImageSourcePropType;
const cozyGardenFishMeat = require("../../assets/places/cozy-garden-fish-meat.jpg") as ImageSourcePropType;
const beyogluCafe = require("../../assets/places/beyoglu-cafe.jpg") as ImageSourcePropType;
const beyogluOcakbasi = require("../../assets/places/beyoglu-ocakbasi.jpg") as ImageSourcePropType;
const taksimBahcivan = require("../../assets/places/taksim-bahcivan.jpg") as ImageSourcePropType;
const guneyRestaurant1964 = require("../../assets/places/guney-restaurant-1964.jpg") as ImageSourcePropType;
const peraIstanbulRestaurant = require("../../assets/places/pera-istanbul-restaurant.jpg") as ImageSourcePropType;
const novasHagiasophiaRestaurant = require("../../assets/places/novas-hagiasophia-restaurant.jpg") as ImageSourcePropType;
const anatoliaSeafoodSteakKebap = require("../../assets/places/anatolia-seafood-steak-kebap.jpg") as ImageSourcePropType;
const nomadsTaksim = require("../../assets/places/nomads-taksim.jpg") as ImageSourcePropType;
const fbCulture = require("../../assets/places/fb-culture.jpg") as ImageSourcePropType;
const antakyaKebapAsmali = require("../../assets/places/antakya-kebap-asmali.jpg") as ImageSourcePropType;
const tarihiDegustasyonOcakbasi = require("../../assets/places/tarihi-degustasyon-ocakbasi.jpg") as ImageSourcePropType;
const sifirBirAdanaKebapTaksim = require("../../assets/places/sifir-bir-adana-kebap-taksim.jpg") as ImageSourcePropType;
const ottomanKitchen = require("../../assets/places/ottoman-kitchen.jpg") as ImageSourcePropType;
const durumcuMehmetUsta = require("../../assets/places/durumcu-mehmet-usta.jpg") as ImageSourcePropType;
const haciUstaKebap = require("../../assets/places/haci-usta-kebap.jpg") as ImageSourcePropType;
const dilmanKebap = require("../../assets/places/dilman-kebap.jpg") as ImageSourcePropType;
const sanliKebap = require("../../assets/places/sanli-kebap.jpg") as ImageSourcePropType;
const meleklerOcakbasi = require("../../assets/places/melekler-ocakbasi.jpg") as ImageSourcePropType;
const sultanKebapFish = require("../../assets/places/sultan-kebap-fish.jpg") as ImageSourcePropType;
const biliceKebap = require("../../assets/places/bilice-kebap.jpg") as ImageSourcePropType;
const kervanKebabGrill = require("../../assets/places/kervan-kebab-grill.jpg") as ImageSourcePropType;
const beyogluEsnafLokantasi = require("../../assets/places/beyoglu-esnaf-lokantasi.jpg") as ImageSourcePropType;
const simsek = require("../../assets/places/simsek.jpg") as ImageSourcePropType;
const ladesMenemen = require("../../assets/places/lades-menemen.jpg") as ImageSourcePropType;
const casiusAntiochKitchen = require("../../assets/places/casius-antioch-kitchen.jpg") as ImageSourcePropType;
const haciAbdullahLokantasi = require("../../assets/places/haci-abdullah-lokantasi.jpg") as ImageSourcePropType;
const cafeItaliano = require("../../assets/places/cafe-italiano.jpg") as ImageSourcePropType;
const oleaOsteriaItaliana = require("../../assets/places/olea-osteria-italiana.jpg") as ImageSourcePropType;
const cecconisRestaurant = require("../../assets/places/cecconis-restaurant.jpg") as ImageSourcePropType;
const farosKarakoy = require("../../assets/places/faros-karakoy.jpg") as ImageSourcePropType;
const moltoBeneGalata = require("../../assets/places/molto-bene-galata.jpg") as ImageSourcePropType;
const farosIstanbul = require("../../assets/places/faros-istanbul.jpg") as ImageSourcePropType;
const hrItalyEminonu = require("../../assets/places/hr-italy-eminonu.jpg") as ImageSourcePropType;
const esmerCafe = require("../../assets/places/esmer-cafe.jpg") as ImageSourcePropType;
const nappoTrattoria = require("../../assets/places/nappo-trattoria.jpg") as ImageSourcePropType;
const hrItalyKarakoy = require("../../assets/places/hr-italy-karakoy.jpg") as ImageSourcePropType;
const pizzeriaPera = require("../../assets/places/pizzeria-pera.jpg") as ImageSourcePropType;
const wamasBeyoglu = require("../../assets/places/wamas-beyoglu.jpg") as ImageSourcePropType;
const kumikoSushiMore = require("../../assets/places/kumiko-sushi-more.jpg") as ImageSourcePropType;
const rokaIstanbul = require("../../assets/places/roka-istanbul.jpg") as ImageSourcePropType;
const shanghaiRestaurant = require("../../assets/places/shanghai-restaurant.jpg") as ImageSourcePropType;
const toganooTeaHouse = require("../../assets/places/toganoo-tea-house.jpg") as ImageSourcePropType;
const chineseSushiExpress = require("../../assets/places/chinese-sushi-express.jpg") as ImageSourcePropType;
const asakaSushiChinese = require("../../assets/places/asaka-sushi-chinese.jpg") as ImageSourcePropType;
const gyutoSushiChinese = require("../../assets/places/gyuto-sushi-chinese.jpg") as ImageSourcePropType;
const astralFishHouse = require("../../assets/places/astral-fish-house.jpg") as ImageSourcePropType;
const askorozBalikci = require("../../assets/places/askoroz-balikci.jpg") as ImageSourcePropType;
const popinaRestaurant = require("../../assets/places/popina-restaurant.jpg") as ImageSourcePropType;
const sarmarineKarakoy = require("../../assets/places/sarmarine-karakoy.jpg") as ImageSourcePropType;
const baracudaKarakoyTerrace = require("../../assets/places/baracuda-karakoy-terrace.jpg") as ImageSourcePropType;
const galataSunset = require("../../assets/places/galata-sunset.jpg") as ImageSourcePropType;
const rotaDurumBalik = require("../../assets/places/rota-durum-balik.jpg") as ImageSourcePropType;
const badBurger = require("../../assets/places/bad-burger.jpg") as ImageSourcePropType;
const betroBurgerTaksim = require("../../assets/places/betro-burger-taksim.jpg") as ImageSourcePropType;
const bnfBurgerFries = require("../../assets/places/bnf-burger-fries.jpg") as ImageSourcePropType;
const routeBurgerHouseKarakoy = require("../../assets/places/route-burger-house-karakoy.jpg") as ImageSourcePropType;
const chuckBurger = require("../../assets/places/chuck-burger.jpg") as ImageSourcePropType;
const burgerlabKarakoy = require("../../assets/places/burgerlab-karakoy.jpg") as ImageSourcePropType;
const taksimDonerBurger = require("../../assets/places/taksim-doner-burger.jpg") as ImageSourcePropType;
const monoBurger = require("../../assets/places/mono-burger.jpg") as ImageSourcePropType;
const momSteakBurger = require("../../assets/places/mom-steak-burger.jpg") as ImageSourcePropType;
const justeFriedChicken = require("../../assets/places/juste-fried-chicken.jpg") as ImageSourcePropType;
const grabsStreetFood = require("../../assets/places/grabs-street-food.jpg") as ImageSourcePropType;
const raskolIstanbul = require("../../assets/places/raskol-istanbul.jpg") as ImageSourcePropType;
const moretendersCocktailCrib = require("../../assets/places/moretenders-cocktail-crib.jpg") as ImageSourcePropType;
const perriKarakoy = require("../../assets/places/perri-karakoy.jpg") as ImageSourcePropType;
const thePubBeyoglu = require("../../assets/places/the-pub-beyoglu.jpg") as ImageSourcePropType;
const dublinIrishPub = require("../../assets/places/dublin-irish-pub.jpg") as ImageSourcePropType;
const edinburghPub = require("../../assets/places/edinburgh-pub.jpg") as ImageSourcePropType;
const cornerIrishPub = require("../../assets/places/corner-irish-pub.jpg") as ImageSourcePropType;
const celticIrishPub = require("../../assets/places/celtic-irish-pub.jpg") as ImageSourcePropType;
const jamesJoyceIrishPub = require("../../assets/places/james-joyce-irish-pub.jpg") as ImageSourcePropType;
const dabPubPera = require("../../assets/places/dab-pub-pera.jpg") as ImageSourcePropType;
const streetPub = require("../../assets/places/street-pub.jpg") as ImageSourcePropType;
const u2IstanbulIrishPub = require("../../assets/places/u2-istanbul-irish-pub.jpg") as ImageSourcePropType;
const redfoxPub = require("../../assets/places/redfox-pub.jpg") as ImageSourcePropType;
const finnegansIrishPub = require("../../assets/places/finnegans-irish-pub.jpg") as ImageSourcePropType;
const kebapciAskerUstaUmraniye = require("../../assets/places/kebapci-asker-usta-umraniye.jpg") as ImageSourcePropType;
const laLunePatisserieUmraniye = require("../../assets/places/la-lune-patisserie-umraniye.jpg") as ImageSourcePropType;
const bagdatOcakbasiUmraniye = require("../../assets/places/bagdat-ocakbasi-umraniye.jpg") as ImageSourcePropType;
const ibbUmraniyeKentLokantasi = require("../../assets/places/ibb-umraniye-kent-lokantasi.jpg") as ImageSourcePropType;
const meceBalikUmraniye = require("../../assets/places/mece-balik-umraniye.jpg") as ImageSourcePropType;
const mentaCafeUmraniye = require("../../assets/places/menta-cafe-umraniye.jpg") as ImageSourcePropType;
const ardenCafeEsenevler = require("../../assets/places/arden-cafe-esenevler.jpg") as ImageSourcePropType;
const byCopsis = require("../../assets/places/by-copsis.jpg") as ImageSourcePropType;
const antebimUmraniye = require("../../assets/places/antebim-umraniye.jpg") as ImageSourcePropType;
const coffyUmraniyeMerkez = require("../../assets/places/coffy-umraniye-merkez.jpg") as ImageSourcePropType;
const kaforaCoffeeUmraniye = require("../../assets/places/kafora-coffee-umraniye.jpg") as ImageSourcePropType;
const yaliKanatKebapSteak = require("../../assets/places/yali-kanat-kebap-steak.jpg") as ImageSourcePropType;
const cemilustaAkcaabatKofte = require("../../assets/places/cemilusta-akcaabat-kofte.jpg") as ImageSourcePropType;
const umusIstanbul = require("../../assets/places/umus-istanbul.jpg") as ImageSourcePropType;
const hmbrgrMaltepePark = require("../../assets/places/hmbrgr-maltepe-park.jpg") as ImageSourcePropType;
const kosorMaltepeCagKebap = require("../../assets/places/kosor-maltepe-cag-kebap.jpg") as ImageSourcePropType;
const farikaRestaurantMaltepe = require("../../assets/places/farika-restaurant-maltepe.jpg") as ImageSourcePropType;
const mardinMutfagiMaltepe = require("../../assets/places/mardin-mutfagi-maltepe.jpg") as ImageSourcePropType;
const mezzeEtKebapMaltepe = require("../../assets/places/mezze-et-kebap-maltepe.jpg") as ImageSourcePropType;
const bistBahceIstanbul = require("../../assets/places/bist-bahce-istanbul.jpg") as ImageSourcePropType;
const birBakanMeyhanesi = require("../../assets/places/bir-bakan-meyhanesi.jpg") as ImageSourcePropType;
const focaBalikKucukyali = require("../../assets/places/foca-balik-kucukyali.jpg") as ImageSourcePropType;
const calipsoFish = require("../../assets/places/calipso-fish.jpg") as ImageSourcePropType;
const lunchillBeylikduzu = require("../../assets/places/lunchill-beylikduzu.jpg") as ImageSourcePropType;
const mossLoungeBahcelievler = require("../../assets/places/moss-lounge-bahcelievler.jpg") as ImageSourcePropType;
const ashgabatRestaurantBahcelievler = require("../../assets/places/ashgabat-restaurant-bahcelievler.jpg") as ImageSourcePropType;
const aliHaydarUstaBahcelievler = require("../../assets/places/ali-haydar-usta-bahcelievler.jpg") as ImageSourcePropType;
const karsIgdirLokantasi = require("../../assets/places/kars-igdir-lokantasi.jpg") as ImageSourcePropType;
const hayelaBahcelievler = require("../../assets/places/hayela-bahcelievler.jpg") as ImageSourcePropType;
const niyoBahcelievler = require("../../assets/places/niyo-bahcelievler.jpg") as ImageSourcePropType;
const sostaMangalbasi = require("../../assets/places/sosta-mangalbasi.jpg") as ImageSourcePropType;
const gurmeMardin = require("../../assets/places/gurme-mardin.jpg") as ImageSourcePropType;
const gurmeBafraPidesi = require("../../assets/places/gurme-bafra-pidesi.jpg") as ImageSourcePropType;
const etciMehmetBakirkoy = require("../../assets/places/etci-mehmet-bakirkoy.jpg") as ImageSourcePropType;
const spadaDiNapoliBakirkoy = require("../../assets/places/spada-di-napoli-bakirkoy.jpg") as ImageSourcePropType;
const abdulkadirRestaurantBakirkoy = require("../../assets/places/abdulkadir-restaurant-bakirkoy.jpg") as ImageSourcePropType;
const casnigirLezzetcibasiBakirkoy = require("../../assets/places/casnigir-lezzetcibasi-bakirkoy.jpg") as ImageSourcePropType;
const tarihiIstanbulSofrasi = require("../../assets/places/tarihi-istanbul-sofrasi.jpg") as ImageSourcePropType;
const bakirkoyAileOcakbasi = require("../../assets/places/bakirkoy-aile-ocakbasi.jpg") as ImageSourcePropType;
const bakirkoyMeyhanesi = require("../../assets/places/bakirkoy-meyhanesi.jpg") as ImageSourcePropType;
const osmanIzmirKokorec = require("../../assets/places/osman-izmir-kokorec.jpg") as ImageSourcePropType;
const sirnazOcakbasi = require("../../assets/places/sirnaz-ocakbasi.jpg") as ImageSourcePropType;
const mykRestoranWow = require("../../assets/places/myk-restoran-wow.jpg") as ImageSourcePropType;
const kudusHanUskudar = require("../../assets/places/kudus-han-uskudar.jpg") as ImageSourcePropType;
const katibimUskudar = require("../../assets/places/katibim-uskudar.jpg") as ImageSourcePropType;
const emiceninYeri = require("../../assets/places/emicenin-yeri.jpg") as ImageSourcePropType;
const ozBoluLokantasi = require("../../assets/places/oz-bolu-lokantasi.jpg") as ImageSourcePropType;
const gulfemHatunKonagi = require("../../assets/places/gulfem-hatun-konagi.jpg") as ImageSourcePropType;
const adileSultanUskudar = require("../../assets/places/adile-sultan-uskudar.jpg") as ImageSourcePropType;
const ismetBabaUskudar = require("../../assets/places/ismet-baba-uskudar.jpg") as ImageSourcePropType;
const payedarKahve = require("../../assets/places/payedar-kahve.jpg") as ImageSourcePropType;
const sanatOcakbasi = require("../../assets/places/sanat-ocakbasi.jpg") as ImageSourcePropType;
const lolivettoAtasehir = require("../../assets/places/lolivetto-atasehir.jpg") as ImageSourcePropType;
const molaAtasehir = require("../../assets/places/mola-atasehir.jpg") as ImageSourcePropType;
const sacaOcakbasiAtasehir = require("../../assets/places/saca-ocakbasi-atasehir.jpg") as ImageSourcePropType;
const hatayGurmeAtasehir = require("../../assets/places/hatay-gurme-atasehir.jpg") as ImageSourcePropType;
const theHungerMetropol = require("../../assets/places/the-hunger-metropol.jpg") as ImageSourcePropType;
const develi1912Atasehir = require("../../assets/places/develi1912-atasehir.jpg") as ImageSourcePropType;
const ustadlarOcakbasi = require("../../assets/places/ustadlar-ocakbasi.jpg") as ImageSourcePropType;
const grillPrimePalladium = require("../../assets/places/grill-prime-palladium.jpg") as ImageSourcePropType;
const theHungerBulvar216 = require("../../assets/places/the-hunger-bulvar-216.jpg") as ImageSourcePropType;
const lipaKofteCevapi = require("../../assets/places/lipa-kofte-cevapi.jpg") as ImageSourcePropType;
const kumlukRestaurantKartal = require("../../assets/places/kumluk-restaurant-kartal.jpg") as ImageSourcePropType;
const unluerGurmeKartal = require("../../assets/places/unluer-gurme-kartal.jpg") as ImageSourcePropType;
const kozKanatKartal = require("../../assets/places/koz-kanat-kartal.jpg") as ImageSourcePropType;
const sefErdalSularoglu = require("../../assets/places/sef-erdal-sularoglu.jpg") as ImageSourcePropType;
const kartalSahilBalik = require("../../assets/places/kartal-sahil-balik.jpg") as ImageSourcePropType;
const korogluKofteciKartal = require("../../assets/places/koroglu-kofteci-kartal.jpg") as ImageSourcePropType;
const cappelloCaffeKartal = require("../../assets/places/cappello-caffe-kartal.jpg") as ImageSourcePropType;
const tasKavurmaKartal = require("../../assets/places/tas-kavurma-kartal.jpg") as ImageSourcePropType;
const monicaKitchenPendik = require("../../assets/places/monica-kitchen-pendik.jpg") as ImageSourcePropType;
const balkanikaPendik = require("../../assets/places/balkanika-pendik.jpg") as ImageSourcePropType;
const cantineDelFrida = require("../../assets/places/cantine-del-frida.jpg") as ImageSourcePropType;
const sandzakBalkanPendik = require("../../assets/places/sandzak-balkan-pendik.jpg") as ImageSourcePropType;
const tarihiErzurumKebapcisi = require("../../assets/places/tarihi-erzurum-kebapcisi.jpg") as ImageSourcePropType;
const nebrasPendik = require("../../assets/places/nebras-pendik.jpg") as ImageSourcePropType;
const meselaNostaljiKafe = require("../../assets/places/mesela-nostalji-kafe.jpg") as ImageSourcePropType;
const iremLokantasiPendik = require("../../assets/places/irem-lokantasi-pendik.jpg") as ImageSourcePropType;
const jujiLounge = require("../../assets/places/juji-lounge.jpg") as ImageSourcePropType;
const cookingHousePendik = require("../../assets/places/cooking-house-pendik.jpg") as ImageSourcePropType;
const kazan1971Sariyer = require("../../assets/places/kazan-1971-sariyer.jpg") as ImageSourcePropType;
const setBalikSariyer = require("../../assets/places/set-balik-sariyer.jpg") as ImageSourcePropType;

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
  "1114": theTempestSocialHouse,
  "1117": kilitBarBesiktas,
  "1129": jokerNo19Besiktas,
  "1132": missisipiPubBesiktas,
  "1133": citirPubBesiktas,
  "1138": chopsCafePubBesiktas,
  "1139": kiezPubBesiktas,
  "1146": oneNumaraPubBesiktas,
  "1147": kosmosBesiktas,
  "1157": ritimRoofBeyoglu,
  "1158": swissotelTheBosphorus,
  "1161": mostHookahOrtakoy,
  "1166": dolmabahceSarayi,
  "1168": yildizHasbahce,
  "1170": akaretSiraevler,
  "1172": besiktasMeydan,
  "1173": dolmabahceSaatKulesi,
  "1178": arnavutkoyColorfulHouses,
  "1183": istanbulDenizMuzesi,
  "1184": yildizSarayiSaleKosku,
  "1189": istanbulResimHeykelMuzesi,
  "1190": ibbItfaiyeMuzesi,
  "1191": ihlamurKasri,
  "1197": arnavutkoyArtGallery,
  "1205": museContemporary,
  "1206": visionArtPlatform,
  "1209": girginPiyanoSanatGalerisi,
  "1210": galeriKambur,
  "1211": galeri310,
  "1213": limosKahvalti,
  "1215": fourSeasonsCafeBistro,
  "1217": carmentaKahvalti,
  "1218": cafeFigu,
  "1222": balkonCafeKahvalti,
  "1224": hungry,
  "1226": canCafeKahvalti,
  "1228": ortakoyCafeKahvalti,
  "1230": veganMasaBesiktas,
  "1232": biNeviDeli,
  "1233": veganIstanbul,
  "1234": mamamanti,
  "1235": veganDukkanLokanta,
  "1237": nutcase,
  "1238": vacilando,
  "1239": govindaIstanbul,
  "1241": abuGoshFilistinKunefesi,
  "1243": gunBakery,
  "1244": bblokBakeryAkaretler,
  "1245": bblokBakery35a,
  "1253": monBakehouse,
  "1257": yediSekizHasanpasaFirini,
  "1258": biDostCoffeeChocolate,
  "1260": seasonArtisanBakery,
  "1261": supperBakery,
  "1270": latteConceptCafe,
  "1271": worldHouseCoffee,
  "1272": artsCoffeeKarakoy,
  "1273": vaaCoffeeGalata,
  "1274": bravoCoffeeRoastery,
  "1275": cafeDaGiovanni,
  "1278": gramajCoffee,
  "1280": xyzCihangir,
  "1287": mundoNovoCoffeePatisserie,
  "1288": booksCoffeeKarakoy,
  "1290": saelCoffee,
  "1291": roastoryCoffee,
  "1292": muusCoffee,
  "1293": coffeeSapiens,
  "1296": cozyCupCoffee,
  "1299": cozyGardenFishMeat,
  "1300": beyogluCafe,
  "1303": beyogluOcakbasi,
  "1304": taksimBahcivan,
  "1307": guneyRestaurant1964,
  "1311": peraIstanbulRestaurant,
  "1312": novasHagiasophiaRestaurant,
  "1313": anatoliaSeafoodSteakKebap,
  "1315": nomadsTaksim,
  "1318": fbCulture,
  "1319": antakyaKebapAsmali,
  "1321": tarihiDegustasyonOcakbasi,
  "1323": sifirBirAdanaKebapTaksim,
  "1325": ottomanKitchen,
  "1327": durumcuMehmetUsta,
  "1328": haciUstaKebap,
  "1329": dilmanKebap,
  "1330": sanliKebap,
  "1331": meleklerOcakbasi,
  "1332": sultanKebapFish,
  "1334": biliceKebap,
  "1335": kervanKebabGrill,
  "1337": beyogluEsnafLokantasi,
  "1340": simsek,
  "1341": ladesMenemen,
  "1342": casiusAntiochKitchen,
  "1343": haciAbdullahLokantasi,
  "1346": cafeItaliano,
  "1348": oleaOsteriaItaliana,
  "1349": cecconisRestaurant,
  "1350": farosKarakoy,
  "1351": moltoBeneGalata,
  "1353": farosIstanbul,
  "1354": hrItalyEminonu,
  "1356": esmerCafe,
  "1357": nappoTrattoria,
  "1358": hrItalyKarakoy,
  "1360": pizzeriaPera,
  "1361": wamasBeyoglu,
  "1363": kumikoSushiMore,
  "1368": rokaIstanbul,
  "1370": shanghaiRestaurant,
  "1371": toganooTeaHouse,
  "1375": chineseSushiExpress,
  "1376": asakaSushiChinese,
  "1377": gyutoSushiChinese,
  "1379": astralFishHouse,
  "1380": askorozBalikci,
  "1381": popinaRestaurant,
  "1382": sarmarineKarakoy,
  "1384": baracudaKarakoyTerrace,
  "1386": galataSunset,
  "1391": rotaDurumBalik,
  "1394": badBurger,
  "1395": betroBurgerTaksim,
  "1396": bnfBurgerFries,
  "1398": routeBurgerHouseKarakoy,
  "1399": chuckBurger,
  "1400": burgerlabKarakoy,
  "1402": taksimDonerBurger,
  "1403": monoBurger,
  "1404": momSteakBurger,
  "1405": justeFriedChicken,
  "1408": grabsStreetFood,
  "1414": raskolIstanbul,
  "1418": moretendersCocktailCrib,
  "1427": perriKarakoy,
  "1430": thePubBeyoglu,
  "1431": dublinIrishPub,
  "1432": edinburghPub,
  "1433": cornerIrishPub,
  "1434": celticIrishPub,
  "1437": jamesJoyceIrishPub,
  "1440": dabPubPera,
  "1443": streetPub,
  "1445": u2IstanbulIrishPub,
  "1446": redfoxPub,
  "1447": finnegansIrishPub,
  "2261": kebapciAskerUstaUmraniye,
  "2263": laLunePatisserieUmraniye,
  "2265": bagdatOcakbasiUmraniye,
  "2266": ibbUmraniyeKentLokantasi,
  "2267": meceBalikUmraniye,
  "2270": mentaCafeUmraniye,
  "2271": ardenCafeEsenevler,
  "2272": byCopsis,
  "2273": antebimUmraniye,
  "2274": coffyUmraniyeMerkez,
  "2275": kaforaCoffeeUmraniye,
  "2276": yaliKanatKebapSteak,
  "2277": cemilustaAkcaabatKofte,
  "2279": umusIstanbul,
  "2280": hmbrgrMaltepePark,
  "2281": kosorMaltepeCagKebap,
  "2282": farikaRestaurantMaltepe,
  "2283": mardinMutfagiMaltepe,
  "2285": mezzeEtKebapMaltepe,
  "2286": bistBahceIstanbul,
  "2287": calipsoFish,
  "2288": focaBalikKucukyali,
  "2289": birBakanMeyhanesi,
  "2304": lunchillBeylikduzu,
  "2306": mossLoungeBahcelievler,
  "2307": ashgabatRestaurantBahcelievler,
  "2308": aliHaydarUstaBahcelievler,
  "2309": karsIgdirLokantasi,
  "2312": hayelaBahcelievler,
  "2314": niyoBahcelievler,
  "2315": sostaMangalbasi,
  "2316": gurmeMardin,
  "2317": gurmeBafraPidesi,
  "2321": etciMehmetBakirkoy,
  "2322": spadaDiNapoliBakirkoy,
  "2323": abdulkadirRestaurantBakirkoy,
  "2325": casnigirLezzetcibasiBakirkoy,
  "2327": tarihiIstanbulSofrasi,
  "2329": bakirkoyAileOcakbasi,
  "2330": bakirkoyMeyhanesi,
  "2331": osmanIzmirKokorec,
  "2332": sirnazOcakbasi,
  "2335": mykRestoranWow,
  "2336": kudusHanUskudar,
  "2338": katibimUskudar,
  "2341": emiceninYeri,
  "2344": ozBoluLokantasi,
  "2345": gulfemHatunKonagi,
  "2347": adileSultanUskudar,
  "2349": ismetBabaUskudar,
  "2350": payedarKahve,
  "2351": sanatOcakbasi,
  "2352": lolivettoAtasehir,
  "2354": molaAtasehir,
  "2355": sacaOcakbasiAtasehir,
  "2356": hatayGurmeAtasehir,
  "2359": theHungerMetropol,
  "2361": develi1912Atasehir,
  "2362": ustadlarOcakbasi,
  "2364": grillPrimePalladium,
  "2365": theHungerBulvar216,
  "2367": lipaKofteCevapi,
  "2368": kumlukRestaurantKartal,
  "2369": unluerGurmeKartal,
  "2370": kozKanatKartal,
  "2371": sefErdalSularoglu,
  "2373": kartalSahilBalik,
  "2374": korogluKofteciKartal,
  "2375": cappelloCaffeKartal,
  "2377": tasKavurmaKartal,
  "2381": monicaKitchenPendik,
  "2382": balkanikaPendik,
  "2383": cantineDelFrida,
  "2385": sandzakBalkanPendik,
  "2386": tarihiErzurumKebapcisi,
  "2389": nebrasPendik,
  "2390": meselaNostaljiKafe,
  "2392": iremLokantasiPendik,
  "2393": jujiLounge,
  "2394": cookingHousePendik,
  "2396": kazan1971Sariyer,
  "2399": setBalikSariyer,
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
