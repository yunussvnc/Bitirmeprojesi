# UX & UI Quality Pass – Summary

## 1. UX problems fixed (bullet points)

**A) Filter UX**
- Filter container max height set to **45% of screen** (Explore bottom sheet and Home accordion panel) so primary content is not pushed down; internal ScrollView already present.
- **Apply / Uygula** made **secondary** (outline button) in both Explore and Home so filters don’t feel dominant; **Clear / Temizle** uses secondary text color so it’s not a primary action.
- Explore: filter row made **compact** (smaller padding, neutral filter icon, result count as small text instead of green pill).
- Explore: bottom sheet header and footer tightened; sheet max height capped at 360px when 45% is larger.

**B) Place cards**
- **Image max height** reduced from 140px to **120px** (16:9 kept) so images don’t overpower text and cards are scannable in &lt; 1s.
- **Card content** tightened: less padding (xs/md), title 16px with 2px margin, subtitle 13px/18px line-height, tags gap 4px.
- **Location badge** made **subtle**: smaller icon (11px), smaller text (11px), background `rgba(0,0,0,0.4)`, reduced padding and size so it doesn’t steal attention.
- Card radius set to **radius.md** for consistency with the rest of the system.

**C) Top & bottom spacing**
- **Screen** component: **top padding** applied for tab screens (8px) so content doesn’t sit under the status bar; **bottom padding** increased to **24px** when `withTabBar` so content has a clear gap above the tab bar and snaps to a consistent grid.

**D) Explore screen**
- **Hero** made compact: less padding and margin, smaller title (22px), smaller badge (neutral surface, not green), so the header doesn’t dominate.
- **Search** area: shorter hint line, reduced margins so the block is compact.
- **AI explanation** card: smaller margins and typography; AI badge uses neutral surface so green is reserved for the main CTA.
- **Öneri Getir** button set to **medium** size so it’s the single clear CTA without being oversized.

**E) Home feed**
- Filter panel **max height 45%** (cap 360px); **Uygula** is secondary.
- Section title row spacing reduced; section title 18px for a tighter header.

**F) Profile**
- **Profile header** spacing reduced (padding and margins) so the block doesn’t create an awkward gap; level row and sections use a tighter vertical rhythm.
- **Sign out** container margins reduced.

**G) Saved**
- Header **marginBottom** set to `base` for consistent rhythm with other screens.

**H) Design system**
- **surface.elevated** added to the color theme (type + dark/light tokens) so cards, filter bars, and raised UI use a single token and the linter is satisfied.

---

## 2. `git diff --stat`

Run from repo root:

```bash
git diff --stat
```

Or only mobile:

```bash
git diff --stat -- apps/mobile/
```

---

## 3. Files intentionally NOT touched

- **Place detail** (`app/place/[id].tsx`): Only spacing audit; already uses design spacing and `Screen` without tab bar. No layout or structural changes so as not to risk the immersive detail experience.
- **Login / Register**: Not in the screen-by-screen order for this pass; left as-is.
- **Tab bar** (`(tabs)/_layout.tsx`): Height and styling already consistent; no change.
- **API, services, state, utils**: No changes; quality pass was visual/UX only.
- **Backend, ai-llm, frontend (non-mobile)**: Not in scope.

---

## 4. Alignment with modern consumer apps

- **Filters**: Act as a compact control (single row + chips when closed, sheet/panel max 45%) and no longer dominate; Apply/Clear are secondary.
- **Cards**: 16:9 image with 120px max height, tighter text and padding, subtle location badge; feed feels scannable and balanced.
- **Spacing**: Consistent top (tab screens) and bottom (24px above tab bar) so content aligns to a grid and doesn’t float.
- **Hierarchy**: Green used for primary CTA (Öneri Getir) and key active states; neutrals (surface.elevated, secondary text) carry the rest so the app feels calm and confident.

The app should now feel closer to a premium, modern consumer product (Instagram/Spotify/Airbnb level) in density, rhythm, and use of accent color.
