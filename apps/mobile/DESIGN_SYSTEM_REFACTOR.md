# Design System Refactor – Deliverables

## 1) Changed file list (this session)

- `constants/design/tokens.ts` (new) – s(n), r(n), font(), PLACE_CARD_ASPECT, SEARCH_INPUT_HEIGHT, etc.
- `constants/design/index.ts` – export tokens helpers
- `components/layout/AppHeader.tsx` (new) – reusable screen header (title, subtitle, right)
- `components/layout/index.ts` – export AppHeader
- `components/layout/Section.tsx` – style type ViewStyle
- `components/ui/ErrorState.tsx` – colors.error → colors.semantic.error
- `components/ui/Input.tsx` – search input height 48–52px
- `components/ui/AnimatedPlaceCard.tsx` – React.memo for list performance
- `components/ui/SettingsRow.tsx` – minHeight 52 comment (≥44pt touch target)
- `components/place/PlaceCard.tsx` – React.memo, PLACE_CARD_ASPECT / PLACE_CARD_IMAGE_MAX_HEIGHT from design, export as memo
- `app/(tabs)/index.tsx` – design tokens (s()), filter panel maxHeight 50% cap, list content padding, compact accordion height 52
- `app/(tabs)/explore.tsx` – bottom sheet maxHeight 50% cap
- `app/(tabs)/saved.tsx` – design spacing constants, 44pt touch targets for buttons

## 2) Git diff – stat (repo-wide)

Run in repo root:

```bash
git diff --stat
```

(Result includes pre-existing changes; design refactor touches the mobile files above.)

## 3) 12-point QA checklist

| # | Check | Notes |
|---|--------|------|
| 1 | **Small screen** | Test on 375×667 or similar; safe area, padding, no overflow. |
| 2 | **Large screen** | Test on 414×896; filter panel maxHeight cap (400–420px) avoids oversized block. |
| 3 | **Loading** | Home/Explore/Saved show LoadingState; spinner and message centered. |
| 4 | **Empty** | Home (no results), Saved (no items), Explore (no results) show EmptyState with icon, title, description, optional action. |
| 5 | **Error** | Home/Explore use ErrorState with onRetry; ErrorState uses colors.semantic.error. |
| 6 | **Long text** | PlaceCard title/subtitle numberOfLines={2}; SettingsRow value numberOfLines={1}; section titles truncate. |
| 7 | **Scrolling** | Screen is ScrollView; Home list is FlatList with scrollEnabled={false} inside ScrollView; Explore/Saved scroll with content. |
| 8 | **List performance** | FlatList: keyExtractor, initialNumToRender=6, windowSize=7, removeClippedSubviews; PlaceCard and AnimatedPlaceCard memoized. |
| 9 | **Filter open/close** | Home: accordion row 52px, panel maxHeight ~50% with internal ScrollView; Explore: modal bottom sheet ~50% with handle; minimal layout jump. |
| 10 | **Image fallbacks** | getPlaceImageSource: API photo_url → brand map → category placeholder → default; PlaceCard imagePlaceholder shows “Görsel eklenmedi”. |
| 11 | **Safe area** | Screen uses SafeAreaView edges={['left','right']}; tab bar has platform paddingBottom. |
| 12 | **Tab bar spacing** | withTabBar adds bottom padding (16px); tab bar height 58/52 + bottom padding in _layout; no overlap. |

---

## Repo map (Step A summary)

**Screens (app/):**  
`(tabs)/index.tsx` (Home), `(tabs)/explore.tsx` (Explore), `(tabs)/saved.tsx`, `(tabs)/profile.tsx`, `place/[id].tsx`, `login.tsx`, `register.tsx`, `scan.tsx`, `places.tsx`, `modal.tsx`, `debug-api.tsx`, `p/[placeId].tsx`, `index.tsx`.

**Layout:**  
`Screen` (SafeArea + ScrollView/View + padding, withTabBar), `Section` (title + children), `AppHeader` (title, subtitle, right).

**Theme/tokens:**  
`constants/design/` (colors, typography, spacing, radius, shadows, imageOverlay, animations, types), `tokens.ts` (s, r, font, PLACE_CARD_ASPECT, etc.), `useTheme()` from ThemeContext.

**Place cards:**  
`PlaceCard` (16:9, maxHeight 140, gradient overlay, memoized), `AnimatedPlaceCard` (memoized).

**Filters:**  
`FilterCard`, `Chip`; Home = accordion + scrollable panel; Explore = modal bottom sheet.

**States:**  
`EmptyState`, `LoadingState`, `ErrorState`.

**Image strategy:**  
`getPlaceImageSource(place)` in `placeImages.ts`: API → brand keyword map → category fallback → default URI.
