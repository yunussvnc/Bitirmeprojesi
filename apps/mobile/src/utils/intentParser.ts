export type ParsedIntent = {
  category: 'cafe' | 'restaurant' | null;
  keywords: string[];
  intentScore: number;
};

// Specific beverage/food items that will be extracted as keywords
const SPECIFIC_CAFE_ITEMS = [
  'americano',
  'latte',
  'cappuccino',
  'espresso',
  'macchiato',
  'mocha',
  'coffee',
  'tea',
  'kahve',
  'cay',
  'croissant',
  'kruvasan'
];

const SPECIFIC_RESTAURANT_ITEMS = [
  'pizza',
  'burger',
  'hamburger',
  'cheeseburger',
  'kebap',
  'kebab',
  'doner',
  'lahmacun',
  'pide',
  'sushi',
  'makarna',
  'pasta',
  'steak',
  'et',
  'tavuk',
  'chicken',
  'salata',
  'salad',
  'corba',
  'soup'
];

// General category signifiers
const CATEGORY_CAFE = [
  'kafe',
  'cafe',
  'kahveci',
  'pastane',
  'firin',
  'tatli',
  'kek',
  'cake',
  'dessert'
];

const CATEGORY_RESTAURANT = [
  'restoran',
  'restaurant',
  'lokanta',
  'mutfak',
  'pizzaci',
  'burgerci',
  'kebapci'
];

const GREETINGS = [
  'naber',
  'selam',
  'merhaba',
  'hey',
  'nasisin',
  'nasilsin',
  'hello',
  'hi',
  'whats up',
  'neler var'
];

const GENERAL_VENUE_KEYWORDS = [
  'mekan',
  'yer',
  'sakin',
  'sessiz',
  'manzara',
  'bahce',
  'teras',
  'calismak',
  'ders',
  'kitap',
  'bulusma',
  'sohbet',
  'konum',
  'gitmek',
  'istiyorum',
  'oner',
  'oneri',
  'gidilecek',
  'aksam',
  'ogle',
  'kahvalti',
  'bira',
  'alkol',
  'bar',
  'pub',
  'dans',
  'eglence',
  'gece',
  'muzik',
  'yemek' // 'yemek' is a general intent word
];

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

/**
 * Parses search query to extract category intent and keywords.
 * Checks for known food/drink keywords, general activity keywords and greetings.
 */
export function parseIntent(query: string): ParsedIntent {
  const normalized = normalizeText(query);
  
  // Clean up punctuation and split into words
  const words = normalized
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const matchedCafeItems: string[] = [];
  const matchedRestaurantItems: string[] = [];
  const matchedCafeCategory: string[] = [];
  const matchedRestaurantCategory: string[] = [];
  const matchedGreetings: string[] = [];
  const matchedGeneral: string[] = [];

  // Match words against our intent categories
  for (const word of words) {
    if (SPECIFIC_CAFE_ITEMS.includes(word)) {
      matchedCafeItems.push(word);
    }
    if (SPECIFIC_RESTAURANT_ITEMS.includes(word)) {
      matchedRestaurantItems.push(word);
    }
    if (CATEGORY_CAFE.includes(word)) {
      matchedCafeCategory.push(word);
    }
    if (CATEGORY_RESTAURANT.includes(word)) {
      matchedRestaurantCategory.push(word);
    }
    if (GREETINGS.includes(word)) {
      matchedGreetings.push(word);
    }
    if (GENERAL_VENUE_KEYWORDS.includes(word)) {
      matchedGeneral.push(word);
    }
  }

  let category: 'cafe' | 'restaurant' | null = null;
  let keywords: string[] = [];

  // Determine category and keywords list based on specific matches
  const hasCafeSpecific = matchedCafeItems.length > 0;
  const hasRestSpecific = matchedRestaurantItems.length > 0;
  const hasCafeCat = matchedCafeCategory.length > 0;
  const hasRestCat = matchedRestaurantCategory.length > 0;

  if ((hasCafeSpecific || hasCafeCat) && !(hasRestSpecific || hasRestCat)) {
    category = 'cafe';
    keywords = matchedCafeItems;
  } else if ((hasRestSpecific || hasRestCat) && !(hasCafeSpecific || hasCafeCat)) {
    category = 'restaurant';
    keywords = matchedRestaurantItems;
  } else if ((hasCafeSpecific || hasCafeCat) && (hasRestSpecific || hasRestCat)) {
    // If both cafe and restaurant are indicated, prioritize based on specific items
    if (hasCafeSpecific && !hasRestSpecific) {
      category = 'cafe';
      keywords = matchedCafeItems;
    } else if (hasRestSpecific && !hasCafeSpecific) {
      category = 'restaurant';
      keywords = matchedRestaurantItems;
    } else {
      // Prioritize by first occurrence of any category keyword
      const firstCafeIdx = words.findIndex(w => SPECIFIC_CAFE_ITEMS.includes(w) || CATEGORY_CAFE.includes(w));
      const firstRestIdx = words.findIndex(w => SPECIFIC_RESTAURANT_ITEMS.includes(w) || CATEGORY_RESTAURANT.includes(w));
      if (firstCafeIdx < firstRestIdx) {
        category = 'cafe';
        keywords = matchedCafeItems;
      } else {
        category = 'restaurant';
        keywords = matchedRestaurantItems;
      }
    }
  }

  // Calculate overall intent score
  let intentScore = 0.0;
  const isGreetingOnly = matchedGreetings.length > 0 && 
                         matchedCafeItems.length === 0 && 
                         matchedRestaurantItems.length === 0 && 
                         matchedCafeCategory.length === 0 &&
                         matchedRestaurantCategory.length === 0 &&
                         matchedGeneral.length === 0;

  if (category !== null) {
    intentScore = 1.0;
  } else if (matchedGeneral.length > 0 && !isGreetingOnly) {
    intentScore = 1.0;
    // Map to a default category so we satisfy category constraint
    const isDrinkOrBar = words.some(w => ['bira', 'alkol', 'bar', 'pub', 'dans', 'eglence', 'gece', 'muzik'].includes(w));
    category = isDrinkOrBar ? 'restaurant' : 'cafe';
  }

  return {
    category,
    keywords,
    intentScore,
  };
}

/**
 * Detects whether the query has a venue/activity intent and returns the confidence.
 */
export function detectVenueIntent(query: string): { hasIntent: boolean; confidence: number } {
  const parsed = parseIntent(query);
  return {
    hasIntent: parsed.intentScore >= 0.5,
    confidence: parsed.intentScore,
  };
}

