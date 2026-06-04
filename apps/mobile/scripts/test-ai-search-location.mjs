/**
 * AI arama konum önceliği — Node ile çalıştır:
 *   node apps/mobile/scripts/test-ai-search-location.mjs
 *
 * TypeScript kaynağı ile aynı mantık (bakım: aiSearchLocation.ts ile senkron tutun).
 */
import assert from 'node:assert/strict';

const ISTANBUL = { id: 'istanbul', apiLocation: 'Istanbul', lat: 41.0082, lng: 28.9784 };
const KADIKOY = { id: 'kadikoy', apiLocation: 'Kadıköy', lat: 40.982, lng: 29.027, aliases: ['kadıköy', 'kadikoy'] };
const BESIKTAS = { id: 'besiktas', apiLocation: 'Beşiktaş', lat: 41.042, lng: 29.007, aliases: ['beşiktaş', 'besiktas'] };

const DISTRICT_ENTRIES = [KADIKOY, BESIKTAS].flatMap((d) =>
  d.aliases.map((alias) => ({ alias, district: d })),
).sort((a, b) => b.alias.length - a.alias.length);

function normalizeForMatch(text) {
  return text.toLocaleLowerCase('tr-TR').normalize('NFC');
}

function containsToken(haystack, needle) {
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const re = new RegExp(`(?:^|[\\s,.;:!?'"()\\[\\]{}])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s,.;:!?'"()\\[\\]{}])`, 'u');
  return re.test(` ${haystack} `);
}

function detectLocationInQuery(query) {
  const q = normalizeForMatch(query.trim());
  let district = null;
  for (const { alias, district: d } of DISTRICT_ENTRIES) {
    if (containsToken(q, normalizeForMatch(alias))) {
      district = d;
      break;
    }
  }
  return { district, city: null };
}

function resolve(query, districtId) {
  const fromQuery = detectLocationInQuery(query);
  if (fromQuery.district) {
    const d = fromQuery.district;
    return { location: d.apiLocation, fromQuery: true, lat: d.lat, lng: d.lng };
  }
  const ui = districtId === 'kadikoy' ? KADIKOY : null;
  if (ui) {
    return { location: ui.apiLocation, fromQuery: false, lat: ui.lat, lng: ui.lng };
  }
  return { location: ISTANBUL.apiLocation, fromQuery: false, lat: ISTANBUL.lat, lng: ISTANBUL.lng };
}

// UI: İstanbul + Kadıköy, sorgu konumsuz
let r = resolve('hamburgerci', 'kadikoy');
assert.equal(r.location, 'Kadıköy');
assert.equal(r.fromQuery, false);

// UI: Kadıköy, sorguda Beşiktaş → prompt kazanır
r = resolve('beşiktaş hamburger', 'kadikoy');
assert.equal(r.location, 'Beşiktaş');
assert.equal(r.fromQuery, true);

// UI: ilçe yok → şehir
r = resolve('kafe', null);
assert.equal(r.location, 'Istanbul');
assert.equal(r.fromQuery, false);

console.log('OK: ai search location priority (3 cases)');
