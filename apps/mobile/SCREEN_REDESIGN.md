# Screen-by-Screen Redesign
## Complete UI/UX Redesign Specification

**Version:** 1.0  
**Date:** January 2025  
**Reference:** Spotify Design Principles

---

## 📱 Screen Overview

### Navigation Structure
- **Bottom Tab Navigation** (3-4 tabs)
  - Home (Discover)
  - Explore (AI Recommendations)
  - Saved (Favorites)
  - Profile (Settings) - Optional

### Screen List
1. Onboarding / Welcome
2. Login & Register
3. Home (Discover)
4. Explore (AI Recommendations)
5. Place Detail
6. Reviews
7. Saved / Favorites
8. Profile & Settings

---

## 1. 🎬 Onboarding / Welcome Screen

### Purpose
First impression, explain value proposition, guide users to sign up/login.

### Layout

```
┌─────────────────────────────────┐
│                                 │
│         [Hero Image]            │
│      (Gradient overlay)         │
│                                 │
│                                 │
│    Welcome to [App Name]        │
│                                 │
│  Discover perfect places        │
│  with AI-powered                │
│  recommendations                │
│                                 │
│  [Primary Button: Get Started] │
│                                 │
│  [Text Button: Sign In]        │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Hero image with gradient overlay (dark to transparent)
- Large, bold title (display type, 32px)
- Clear value proposition (body, 16px, text.secondary)
- Single primary action (Get Started)
- Secondary action (Sign In) as text button

**Spacing:**
- Screen padding: 20px horizontal
- Title margin: 24px top, 12px bottom
- Description margin: 8px bottom
- Button margin: 24px top
- Button gap: 16px

**Colors:**
- Background: background.primary (#121212)
- Hero image: Full width, aspect ratio 16:9
- Overlay: gradient (transparent → rgba(0,0,0,0.6))
- Title: text.primary (white)
- Description: text.secondary (#B3B3B3)
- Primary button: accent.primary (#1DB954)
- Text button: accent.primary (no background)

**Typography:**
- Title: display (32px, bold, -0.5 letter spacing)
- Description: body (16px, regular)
- Button: label (14px, semibold)

**Animations:**
- Fade in on mount (250ms)
- Button press: Scale 0.95 (150ms)
- Image: Subtle parallax on scroll (if scrollable)

### Component Structure

```typescript
<OnboardingScreen>
  <ImageBackground source={heroImage} style={styles.hero}>
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} />
    <View style={styles.content}>
      <Text style={styles.title}>Welcome to PlaceFinder</Text>
      <Text style={styles.description}>
        Discover perfect places with AI-powered recommendations
      </Text>
      <PrimaryButton onPress={handleGetStarted}>
        Get Started
      </PrimaryButton>
      <TextButton onPress={handleSignIn}>
        Already have an account? Sign In
      </TextButton>
    </View>
  </ImageBackground>
</OnboardingScreen>
```

### Implementation Notes
- Skip button (top right) for returning users
- Swipeable carousel if multiple onboarding screens
- Smooth transitions between screens

---

## 2. 🔐 Login & Register Screens

### Purpose
Authenticate users, create accounts.

### Layout (Login)

```
┌─────────────────────────────────┐
│  [Back]          [Logo/Title]   │
│                                 │
│                                 │
│     Welcome Back                │
│     Sign in to continue         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email                    │   │
│  │ [Text Input]            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password                 │   │
│  │ [Text Input]            │   │
│  └─────────────────────────┘   │
│                                 │
│  [Text Button: Forgot Password?]│
│                                 │
│  [Primary Button: Sign In]      │
│                                 │
│  ─────────── or ───────────     │
│                                 │
│  [Secondary Button: Sign Up]    │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Clean, minimal form
- Clear labels above inputs
- Primary action (Sign In) prominent
- Secondary action (Sign Up) less prominent
- Forgot password as subtle text link

**Spacing:**
- Screen padding: 20px horizontal
- Title margin: 40px top, 32px bottom
- Input gap: 20px
- Button margin: 32px top
- Divider margin: 24px vertical

**Colors:**
- Background: background.primary
- Input background: surface.default
- Input border: surface.border (1px)
- Input focus: accent.primary border
- Primary button: accent.primary
- Text link: accent.primary

**Typography:**
- Title: title (24px, bold)
- Subtitle: body (16px, text.secondary)
- Label: caption (12px, text.secondary, uppercase)
- Input: body (16px, text.primary)
- Button: label (14px, semibold)

**Interactions:**
- Input focus: Border color changes to accent.primary
- Input error: Border color changes to semantic.error
- Button disabled: Opacity 0.5, no interaction
- Loading state: Button shows spinner, text changes

### Component Structure

```typescript
<LoginScreen>
  <Header title="Sign In" showBack />
  <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Welcome Back</Text>
    <Text style={styles.subtitle}>Sign in to continue</Text>
    
    <TextInput
      label="Email"
      placeholder="Enter your email"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
    />
    
    <TextInput
      label="Password"
      placeholder="Enter your password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
    
    <TextButton onPress={handleForgotPassword}>
      Forgot Password?
    </TextButton>
    
    <PrimaryButton
      onPress={handleSignIn}
      loading={loading}
      disabled={!email || !password}
    >
      Sign In
    </PrimaryButton>
    
    <Divider text="or" />
    
    <SecondaryButton onPress={handleSignUp}>
      Create Account
    </SecondaryButton>
  </ScrollView>
</LoginScreen>
```

### Register Screen
- Similar layout to login
- Additional fields: Name, Confirm Password
- Terms & conditions checkbox
- "Already have an account? Sign In" link

---

## 3. 🏠 Home (Discover) Screen

### Purpose
Main entry point, show featured places, quick access to recommendations.

### Layout

```
┌─────────────────────────────────┐
│  Home              [Search Icon] │
│                                 │
│  Good morning, [Name] 👋        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🔍 Search places...      │   │
│  └─────────────────────────┘   │
│                                 │
│  Quick Filters                  │
│  [Chip] [Chip] [Chip]           │
│                                 │
│  Featured Places                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ Card │ │ Card │ │ Card │   │
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  Recent Recommendations         │
│  ┌─────────────────────────┐   │
│  │ [Large Place Card]       │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Large Place Card]       │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Personalized greeting (time-based)
- Search bar prominent (quick access)
- Quick filter chips (horizontal scroll)
- Featured places (horizontal scroll, compact cards)
- Recent recommendations (vertical list, large cards)

**Spacing:**
- Screen padding: 20px horizontal
- Section gap: 32px
- Card gap: 12px
- Chip gap: 8px

**Colors:**
- Background: background.primary
- Search bar: surface.default
- Chips (active): accent.primary
- Chips (inactive): surface.default
- Cards: surface.default with subtle border

**Typography:**
- Greeting: heading (18px, semibold)
- Section headers: heading (18px, semibold)
- Card title: heading (18px, semibold)
- Card subtitle: bodySmall (14px, text.secondary)

**Interactions:**
- Search bar: Navigate to Explore screen
- Chips: Filter by category (Café, Restaurant, etc.)
- Cards: Navigate to Place Detail
- Horizontal scrolls: Smooth, with fade edges

### Component Structure

```typescript
<HomeScreen>
  <ScrollView>
    {/* Greeting */}
    <View style={styles.header}>
      <Text style={styles.greeting}>
        {getGreeting()}, {userName} 👋
      </Text>
    </View>
    
    {/* Search Bar */}
    <TouchableOpacity onPress={handleSearch}>
      <SearchInput placeholder="Search places..." editable={false} />
    </TouchableOpacity>
    
    {/* Quick Filters */}
    <Section title="Quick Filters">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map(category => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
          />
        ))}
      </ScrollView>
    </Section>
    
    {/* Featured Places */}
    <Section title="Featured Places">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {featuredPlaces.map(place => (
          <PlaceCardCompact
            key={place.id}
            place={place}
            onPress={() => navigateToPlace(place.id)}
          />
        ))}
      </ScrollView>
    </Section>
    
    {/* Recent Recommendations */}
    <Section title="Recent Recommendations">
      {recentPlaces.map(place => (
        <PlaceCard
          key={place.id}
          place={place}
          onPress={() => navigateToPlace(place.id)}
        />
      ))}
    </Section>
  </ScrollView>
</HomeScreen>
```

### Empty States
- No featured places: Show "Discover new places" CTA
- No recent recommendations: Show "Get recommendations" button

---

## 4. 🔍 Explore (AI Recommendations) Screen

### Purpose
Main AI recommendation interface, natural language search, filters.

### Layout

```
┌─────────────────────────────────┐
│  Explore                         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🔍 What are you         │   │
│  │    looking for?         │   │
│  └─────────────────────────┘   │
│                                 │
│  Active Filters                  │
│  [Chip: Quiet] [Chip: Work]     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Filters                 │   │
│  │                         │   │
│  │ Vibe                    │   │
│  │ [Quiet] [Lively]        │   │
│  │                         │   │
│  │ Purpose                 │   │
│  │ [Work] [Friends] [Date] │   │
│  │                         │   │
│  │ Budget                  │   │
│  │ [Low] [Mid] [High]      │   │
│  │                         │   │
│  │ [Clear Filters]         │   │
│  └─────────────────────────┘   │
│                                 │
│  [Primary Button: Get Recommendations]│
│                                 │
│  ┌─────────────────────────┐   │
│  │ Why these recommendations?│  │
│  │                         │   │
│  │ [AI Explanation Text]   │   │
│  └─────────────────────────┘   │
│                                 │
│  Results (3)                    │
│  ┌─────────────────────────┐   │
│  │ [Place Card #1]         │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Place Card #2]         │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Search input prominent (natural language)
- Active filters visible (chips)
- Filter card collapsible (saves space)
- AI explanation card (builds trust)
- Results clearly separated

**Spacing:**
- Screen padding: 20px horizontal
- Input margin: 16px bottom
- Filter card margin: 16px bottom
- Button margin: 16px bottom
- Results gap: 12px

**Colors:**
- Search input: surface.default
- Filter card: surface.default (subtle background)
- Active chips: accent.primary
- Inactive chips: surface.default
- AI explanation: surface.default (subtle highlight)
- Results: Standard place cards

**Typography:**
- Screen title: title (24px, bold)
- Section headers: heading (18px, semibold)
- Input placeholder: body (16px, text.tertiary)
- Filter labels: bodySmall (14px, semibold)
- AI explanation: body (16px, text.secondary)

**Interactions:**
- Search input: Focus triggers keyboard
- Filter chips: Toggle state, immediate visual feedback
- Filter card: Collapsible (optional)
- Get Recommendations: Loading state with spinner
- Results: Navigate to Place Detail

### Component Structure

```typescript
<ExploreScreen>
  <ScrollView>
    {/* Search Input */}
    <SearchInput
      placeholder="What are you looking for?"
      value={query}
      onChangeText={setQuery}
      onSubmitEditing={handleSearch}
    />
    
    {/* Active Filters */}
    {activeFilters.length > 0 && (
      <View style={styles.activeFilters}>
        <Text style={styles.sectionLabel}>Active Filters</Text>
        <ScrollView horizontal>
          {activeFilters.map(filter => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              active
              onPress={() => removeFilter(filter.id)}
            />
          ))}
        </ScrollView>
      </View>
    )}
    
    {/* Filter Card */}
    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>Filters</Text>
      
      <FilterSection label="Vibe">
        <FilterChip
          label="Quiet"
          active={prefs.vibe === 'quiet'}
          onPress={() => setPrefs({ ...prefs, vibe: 'quiet' })}
        />
        <FilterChip
          label="Lively"
          active={prefs.vibe === 'lively'}
          onPress={() => setPrefs({ ...prefs, vibe: 'lively' })}
        />
      </FilterSection>
      
      {/* Purpose, Budget sections... */}
      
      <TextButton onPress={handleClearFilters}>
        Clear Filters
      </TextButton>
    </View>
    
    {/* Get Recommendations Button */}
    <PrimaryButton
      onPress={handleGetRecommendations}
      loading={loading}
    >
      Get Recommendations
    </PrimaryButton>
    
    {/* AI Explanation */}
    {explanation && (
      <View style={styles.explanationCard}>
        <View style={styles.explanationHeader}>
          <Text style={styles.explanationTitle}>
            Why these recommendations?
          </Text>
          <TagChip label="AI" />
        </View>
        <Text style={styles.explanationText}>{explanation}</Text>
      </View>
    )}
    
    {/* Results */}
    {results.length > 0 && (
      <View style={styles.results}>
        <Text style={styles.sectionHeader}>
          Results ({results.length})
        </Text>
        {results.map((place, index) => (
          <PlaceCard
            key={place.id}
            place={place}
            rank={index + 1}
            onPress={() => navigateToPlace(place.id)}
          />
        ))}
      </View>
    )}
    
    {/* Empty State */}
    {!loading && results.length === 0 && (
      <EmptyState
        icon="search"
        title="No results yet"
        description="Enter a query and get recommendations"
      />
    )}
  </ScrollView>
</ExploreScreen>
```

### Loading States
- Skeleton loaders for place cards
- Button shows spinner + "Getting recommendations..."
- AI explanation shows skeleton text

### Error States
- Error message in explanation card
- Retry button
- Calm, helpful tone

---

## 5. 📍 Place Detail Screen

### Purpose
Comprehensive place information, reviews, actions (save, share, navigate).

### Layout

```
┌─────────────────────────────────┐
│  [Back]              [Save Icon]  │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [Hero Image]          │   │
│  │   (Full width)          │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  Café Luna                      │
│  ⭐ 4.5 (120 reviews)           │
│  📍 1.2 km away                 │
│                                 │
│  [Tag] [Tag] [Tag]              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Why recommended?         │   │
│  │                         │   │
│  │ [AI Explanation]        │   │
│  └─────────────────────────┘   │
│                                 │
│  About                          │
│  [Description text...]          │
│                                 │
│  [Primary Button: Get Directions]│
│  [Secondary Button: Call]       │
│                                 │
│  Reviews (120)                  │
│  ┌─────────────────────────┐   │
│  │ [Review Card]           │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Review Card]           │   │
│  └─────────────────────────┘   │
│                                 │
│  [Text Button: View All Reviews]│
│                                 │
│  Similar Places                 │
│  [Horizontal scroll cards]      │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Hero image (full width, aspect ratio 16:9)
- Place name + rating prominent
- AI explanation card (trust signal)
- About section (description)
- Action buttons (directions, call)
- Reviews section (social proof)
- Similar places (discovery)

**Spacing:**
- Hero image: Full width, no padding
- Content padding: 20px horizontal
- Section gap: 24px
- Review gap: 12px

**Colors:**
- Hero image: Full width with gradient overlay
- Rating stars: accent.primary (or semantic.warning)
- Tags: surface.default
- AI explanation: surface.default (subtle highlight)
- Action buttons: Primary (directions), Secondary (call)

**Typography:**
- Place name: title (24px, bold)
- Rating: bodySmall (14px, text.secondary)
- Section headers: heading (18px, semibold)
- Description: body (16px, text.secondary, line-height 24px)
- Review text: body (16px, text.secondary)

**Interactions:**
- Hero image: Tap to view gallery (if multiple images)
- Save button: Toggle state, haptic feedback
- Action buttons: Open maps, call
- Reviews: Tap to expand, navigate to full reviews screen
- Similar places: Navigate to place detail

### Component Structure

```typescript
<PlaceDetailScreen>
  <ScrollView>
    {/* Hero Image */}
    <ImageBackground source={place.image} style={styles.hero}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.heroOverlay}
      />
      <View style={styles.heroHeader}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <IconButton
          icon={saved ? "heart-fill" : "heart"}
          onPress={handleSave}
        />
      </View>
    </ImageBackground>
    
    {/* Place Info */}
    <View style={styles.content}>
      <Text style={styles.placeName}>{place.name}</Text>
      <View style={styles.metadata}>
        <RatingStars rating={place.rating} />
        <Text style={styles.reviewCount}>
          ({place.reviewCount} reviews)
        </Text>
        <Text style={styles.distance}>
          📍 {place.distance} km away
        </Text>
      </View>
      
      {/* Tags */}
      <View style={styles.tags}>
        {place.tags.map(tag => (
          <TagChip key={tag} label={tag} />
        ))}
      </View>
      
      {/* AI Explanation */}
      {place.aiExplanation && (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>
            Why recommended?
          </Text>
          <Text style={styles.explanationText}>
            {place.aiExplanation}
          </Text>
        </View>
      )}
      
      {/* About */}
      <Section title="About">
        <Text style={styles.description}>{place.description}</Text>
      </Section>
      
      {/* Actions */}
      <View style={styles.actions}>
        <PrimaryButton onPress={handleDirections}>
          Get Directions
        </PrimaryButton>
        <SecondaryButton onPress={handleCall}>
          Call
        </SecondaryButton>
      </View>
      
      {/* Reviews */}
      <Section title={`Reviews (${place.reviewCount})`}>
        {place.reviews.slice(0, 3).map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
        <TextButton onPress={handleViewAllReviews}>
          View All Reviews
        </TextButton>
      </Section>
      
      {/* Similar Places */}
      <Section title="Similar Places">
        <ScrollView horizontal>
          {similarPlaces.map(place => (
            <PlaceCardCompact
              key={place.id}
              place={place}
              onPress={() => navigateToPlace(place.id)}
            />
          ))}
        </ScrollView>
      </Section>
    </View>
  </ScrollView>
</PlaceDetailScreen>
```

### Sticky Header
- Hero image collapses on scroll
- Place name becomes header title
- Save button moves to header

---

## 6. 💬 Reviews Screen

### Purpose
Display all reviews for a place, allow filtering, show review breakdown.

### Layout

```
┌─────────────────────────────────┐
│  [Back]  Reviews                 │
│                                 │
│  Café Luna                       │
│  ⭐ 4.5 (120 reviews)           │
│                                 │
│  Rating Breakdown                │
│  ⭐⭐⭐⭐⭐ 80%                   │
│  ⭐⭐⭐⭐   15%                   │
│  ⭐⭐⭐     3%                    │
│  ⭐⭐       1%                    │
│  ⭐         1%                    │
│                                 │
│  Filters                         │
│  [All] [Verified] [Recent]      │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Review Card]           │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Review Card]           │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Review Card]           │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Place name + overall rating
- Rating breakdown (visual bars)
- Filter chips
- Review list (chronological, verified first)

**Spacing:**
- Screen padding: 20px horizontal
- Section gap: 24px
- Review gap: 12px

**Colors:**
- Rating bars: accent.primary
- Verified badge: accent.primary
- Filter chips: Standard chip styling

**Typography:**
- Place name: title (24px, bold)
- Rating: bodySmall (14px, text.secondary)
- Review text: body (16px, text.secondary)

### Component Structure

```typescript
<ReviewsScreen>
  <ScrollView>
    {/* Place Header */}
    <View style={styles.header}>
      <Text style={styles.placeName}>{place.name}</Text>
      <RatingDisplay rating={place.rating} count={place.reviewCount} />
    </View>
    
    {/* Rating Breakdown */}
    <View style={styles.breakdown}>
      <Text style={styles.sectionTitle}>Rating Breakdown</Text>
      {[5, 4, 3, 2, 1].map(rating => (
        <RatingBar
          key={rating}
          rating={rating}
          percentage={place.ratingBreakdown[rating]}
        />
      ))}
    </View>
    
    {/* Filters */}
    <View style={styles.filters}>
      <FilterChip
        label="All"
        active={filter === 'all'}
        onPress={() => setFilter('all')}
      />
      <FilterChip
        label="Verified"
        active={filter === 'verified'}
        onPress={() => setFilter('verified')}
      />
      <FilterChip
        label="Recent"
        active={filter === 'recent'}
        onPress={() => setFilter('recent')}
      />
    </View>
    
    {/* Reviews */}
    {filteredReviews.map(review => (
      <ReviewCard key={review.id} review={review} />
    ))}
  </ScrollView>
</ReviewsScreen>
```

### Review Card Design

```typescript
<ReviewCard>
  <View style={styles.reviewHeader}>
    <Avatar source={review.avatar} size={40} />
    <View style={styles.reviewInfo}>
      <View style={styles.reviewNameRow}>
        <Text style={styles.reviewName}>{review.name}</Text>
        {review.verified && (
          <VerifiedBadge />
        )}
      </View>
      <View style={styles.reviewMeta}>
        <RatingStars rating={review.rating} size={14} />
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>
    </View>
  </View>
  <Text style={styles.reviewText}>{review.text}</Text>
</ReviewCard>
```

---

## 7. ⭐ Saved / Favorites Screen

### Purpose
Display saved places, allow management (remove, organize).

### Layout

```
┌─────────────────────────────────┐
│  Saved                          │
│                                 │
│  Your Saved Places (12)         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Place Card]            │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Place Card]            │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Place Card]            │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Count of saved places
- List of saved places (compact cards)
- Remove action (swipe or button)

**Spacing:**
- Screen padding: 20px horizontal
- Card gap: 12px
- Section header margin: 16px bottom

**Colors:**
- Standard place card styling
- Remove button: semantic.error (subtle)

### Component Structure

```typescript
<SavedScreen>
  <ScrollView>
    <View style={styles.header}>
      <Text style={styles.title}>Your Saved Places</Text>
      <Text style={styles.count}>({savedPlaces.length})</Text>
    </View>
    
    {savedPlaces.length === 0 ? (
      <EmptyState
        icon="bookmark"
        title="No saved places"
        description="Start saving places you like"
        actionLabel="Explore"
        onAction={handleExplore}
      />
    ) : (
      savedPlaces.map(place => (
        <PlaceCardCompact
          key={place.id}
          place={place}
          onPress={() => navigateToPlace(place.id)}
          onRemove={() => removePlace(place.id)}
        />
      ))
    )}
  </ScrollView>
</SavedScreen>
```

### Empty State
- Icon: Bookmark (64px, text.tertiary)
- Title: "No saved places"
- Description: "Start saving places you like"
- Action: Primary button "Explore"

---

## 8. 👤 Profile & Settings Screen

### Purpose
User profile, settings, preferences, logout.

### Layout

```
┌─────────────────────────────────┐
│  Profile                         │
│                                 │
│  ┌─────────────────────────┐   │
│  │    [Avatar]              │   │
│  │    [Name]                │   │
│  │    [Email]               │   │
│  └─────────────────────────┘   │
│                                 │
│  Preferences                     │
│  ┌─────────────────────────┐   │
│  │ [Row: Notifications]    │   │
│  │ [Row: Location]          │   │
│  │ [Row: Language]          │   │
│  └─────────────────────────┘   │
│                                 │
│  About                          │
│  ┌─────────────────────────┐   │
│  │ [Row: Help & Support]    │   │
│  │ [Row: Terms]             │   │
│  │ [Row: Privacy]           │   │
│  │ [Row: Version]            │   │
│  └─────────────────────────┘   │
│                                 │
│  [Secondary Button: Sign Out]   │
│                                 │
└─────────────────────────────────┘
```

### Design Decisions

**Visual Hierarchy:**
- Profile section (avatar, name, email)
- Settings grouped by category
- Sign out button (destructive action)

**Spacing:**
- Screen padding: 20px horizontal
- Section gap: 32px
- Row padding: 16px vertical

**Colors:**
- Profile card: surface.default
- Settings rows: surface.default (subtle)
- Sign out button: semantic.error (subtle)

**Typography:**
- Profile name: heading (18px, semibold)
- Profile email: bodySmall (14px, text.secondary)
- Row labels: body (16px, text.primary)
- Row values: bodySmall (14px, text.secondary)

### Component Structure

```typescript
<ProfileScreen>
  <ScrollView>
    {/* Profile Section */}
    <View style={styles.profileCard}>
      <Avatar source={user.avatar} size={80} />
      <Text style={styles.profileName}>{user.name}</Text>
      <Text style={styles.profileEmail}>{user.email}</Text>
    </View>
    
    {/* Preferences */}
    <Section title="Preferences">
      <SettingsRow
        label="Notifications"
        value={notificationsEnabled ? "On" : "Off"}
        onPress={handleNotifications}
        showArrow
      />
      <SettingsRow
        label="Location Services"
        value={locationEnabled ? "On" : "Off"}
        onPress={handleLocation}
        showArrow
      />
      <SettingsRow
        label="Language"
        value="English"
        onPress={handleLanguage}
        showArrow
      />
    </Section>
    
    {/* About */}
    <Section title="About">
      <SettingsRow
        label="Help & Support"
        onPress={handleHelp}
        showArrow
      />
      <SettingsRow
        label="Terms of Service"
        onPress={handleTerms}
        showArrow
      />
      <SettingsRow
        label="Privacy Policy"
        onPress={handlePrivacy}
        showArrow
      />
      <SettingsRow
        label="Version"
        value="1.0.0"
        showArrow={false}
      />
    </Section>
    
    {/* Sign Out */}
    <SecondaryButton
      onPress={handleSignOut}
      style={styles.signOutButton}
    >
      Sign Out
    </SecondaryButton>
  </ScrollView>
</ProfileScreen>
```

### Settings Row Component

```typescript
<SettingsRow>
  <Text style={styles.rowLabel}>{label}</Text>
  <View style={styles.rowRight}>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {showArrow && <Icon name="chevron-right" size={20} />}
  </View>
</SettingsRow>
```

---

## 🎯 Implementation Priority

### Phase 1: Core Design System
1. Color system
2. Typography system
3. Spacing system
4. Basic components (Button, Card, Chip)

### Phase 2: Main Screens
1. Home Screen
2. Explore Screen
3. Place Detail Screen
4. Saved Screen

### Phase 3: Supporting Screens
1. Login/Register
2. Reviews Screen
3. Profile Screen
4. Onboarding

### Phase 4: Polish
1. Animations
2. Loading states
3. Error states
4. Empty states
5. Accessibility

---

## 📝 Notes

- All screens use dark theme as primary
- Light theme is optional, can be added later
- All components should be reusable
- Follow the design system strictly
- Test on both iOS and Android
- Ensure accessibility from the start

---

**End of Screen Redesign Specification**
