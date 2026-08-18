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
