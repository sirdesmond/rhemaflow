# RhemaFlow: Divine Declarations - Mobile App Design

**Date:** 2026-02-14
**Status:** Approved
**Approach:** Expo + Firebase + Cloud Functions (Approach A)

## Overview

Convert the RhemaFlow web prototype into a production React Native mobile app (iOS & Android). The prototype is a single-page React app that generates AI-powered biblical declarations with TTS audio and background images. The mobile MVP adds user accounts, saved declarations, a redesigned cinematic audio engine, local notifications, and a professional design system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52+ (dev builds) |
| Language | TypeScript |
| Navigation | Expo Router v4 |
| Styling | NativeWind (Tailwind) |
| Animations | react-native-reanimated |
| Audio | expo-av |
| Auth | Firebase Auth + Google Sign-In + Apple Auth |
| Database | Firestore |
| API Proxy | Firebase Cloud Functions (Node.js) |
| AI | Google Gemini (text, TTS, image) |
| Storage | Firebase Storage (images, extra tracks) |
| Notifications | expo-notifications (local) |
| Sharing | react-native-view-shot + expo-sharing |
| Haptics | expo-haptics |
| Blur effects | expo-blur |
| Gradients | expo-linear-gradient |
| Fonts | expo-font |
| Builds | EAS Build (iOS + Android) |

## Architecture

### Project Structure

```
rhemaflow/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (auth gate, providers)
│   ├── (auth)/                   # Auth screens (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx           # Onboarding/welcome screen
│   │   └── sign-in.tsx           # Google/Apple sign-in
│   └── (tabs)/                   # Main app (authenticated)
│       ├── _layout.tsx           # Tab navigator
│       ├── index.tsx             # Home - generate declarations
│       ├── saved.tsx             # Saved/favorite declarations
│       └── settings.tsx          # Settings & notification prefs
├── components/
│   ├── ui/                       # Reusable design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── GradientBackground.tsx
│   │   └── Typography.tsx
│   ├── CategoryNav.tsx
│   ├── MoodInput.tsx
│   ├── DeclarationCard.tsx
│   ├── AtmosphereSelector.tsx
│   └── AudioPlayer.tsx
├── services/
│   ├── firebase.ts               # Firebase init & config
│   ├── auth.ts                   # Auth helpers (sign-in/out)
│   ├── declarations.ts           # Cloud Function calls (generate text/speech/image)
│   ├── favorites.ts              # Firestore CRUD for saved declarations
│   └── audioEngine.ts            # Audio playback engine (expo-av)
├── assets/
│   ├── tracks/                   # Bundled cinematic loops
│   │   ├── glory.mp3
│   │   ├── warfare.mp3
│   │   ├── peace.mp3
│   │   ├── rise.mp3
│   │   └── selah.mp3
│   ├── fonts/
│   └── images/
├── hooks/
│   ├── useAuth.ts
│   ├── useDeclarations.ts
│   ├── useAudio.ts
│   └── useNotifications.ts
├── constants/
│   ├── theme.ts                  # Colors, typography, spacing
│   ├── categories.ts             # Declaration categories & moods
│   └── tracks.ts                 # Track metadata & mappings
├── types/
│   └── index.ts
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts              # Function exports
│   │   ├── generateDeclaration.ts
│   │   ├── generateSpeech.ts
│   │   └── generateImage.ts
│   ├── package.json
│   └── tsconfig.json
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── package.json
└── tsconfig.json
```

### Data Flow

```
User Input (Mood Preset or Custom Text)
    │
    ├── App calls Firebase Cloud Function: generateDeclaration()
    │   └── Cloud Function calls Gemini text model
    │       └── Returns { text, reference, scriptureText }
    │
    ├── App calls Cloud Functions in parallel:
    │   ├── generateSpeech(text)
    │   │   └── Gemini TTS → PCM → WAV conversion server-side
    │   │       └── Returns { audioBase64 }
    │   └── generateImage(category, text)
    │       └── Gemini image model → PNG uploaded to Firebase Storage
    │           └── Returns { imageUrl }
    │
    ├── State update → DeclarationCard renders
    │
    └── User taps "Speak Life"
        └── AudioEngine plays speech WAV + atmosphere track
```

## Audio Engine

### Architecture

```
┌─────────────────────────────────────┐
│           AudioEngine               │
│  (singleton via useAudio hook)      │
├─────────────────────────────────────┤
│  Speech Channel (expo-av Sound)     │
│  ├── Gemini TTS WAV (from base64)   │
│  ├── Volume: 1.0                    │
│  └── onPlaybackStatusUpdate → done  │
├─────────────────────────────────────┤
│  Music Channel (expo-av Sound)      │
│  ├── Bundled or streamed MP3        │
│  ├── Volume: 0.0 → 0.3 (fade in)   │
│  ├── Looping: true                  │
│  └── Fade out when speech ends      │
├─────────────────────────────────────┤
│  Crossfade Controller               │
│  ├── Fade in: 2s ease-in            │
│  ├── Music vol during speech: 0.3   │
│  ├── Music swells to 0.5 post-speech│
│  └── Fade out: 3s ease-out          │
└─────────────────────────────────────┘
```

### Cinematic Track Themes

| Atmosphere | Vibe | Instruments | Use Case |
|-----------|------|-------------|----------|
| **Glory** | Triumphant, heavenly | Orchestral swells, choir pads, harp arpeggios, warm strings | Worship, praise, gratitude |
| **Warfare** | Intense, powerful | Epic drums, brass hits, cinematic percussion, low strings | Protection, breakthrough, authority |
| **Peace** | Gentle, restorative | Piano, ambient pads, soft strings, nature textures | Healing, identity, wisdom |
| **Rise** | Building, motivational | Driving piano, crescendo strings, uplifting synths | Success, wealth, overcoming |
| **Selah** | Meditative, still | Minimal ambient, reverb-heavy keys, breathing space | Reflection, custom/general |

### Track Sourcing

- 5 bundled tracks: ~30-45 second loops, MP3 128kbps, ~1-2MB each (~8MB total)
- Source: Royalty-free cinematic libraries (Pixabay, Uppbeat, or commissioned)
- Firebase Storage: Additional track packs downloadable on-demand (post-MVP)
- Downloaded tracks cached locally with expo-file-system

### Playback Flow

1. User taps "Speak Life"
2. Load speech audio (WAV written to temp file from base64)
3. Load music track (bundled asset or cached download)
4. Start speech at full volume
5. Fade music in over 2s to volume 0.3
6. Speech finishes (onPlaybackStatusUpdate callback)
7. Music swells to 0.5 over 1s, holds for 3s
8. Fade music out over 3s, cleanup both Sound objects

### TTS Handling

- Cloud Function receives raw PCM from Gemini TTS API
- Converts PCM to WAV (adds 44-byte header) server-side
- Returns WAV as base64 string
- App writes base64 to temp file via expo-file-system
- expo-av plays the WAV file from disk

## Firebase Integration

### Services

| Service | Purpose |
|---------|---------|
| Auth | Google & Apple sign-in, anonymous fallback |
| Firestore | Saved declarations, user preferences |
| Cloud Functions | Gemini API proxy (text, TTS, image) |
| Storage | Generated images, extra track packs (post-MVP) |

### Firestore Schema

```
users/{uid}
├── displayName: string
├── email: string
├── photoURL: string
├── createdAt: timestamp
├── settings: {
│     notificationsEnabled: boolean
│     notificationTime: "08:00"
│     defaultAtmosphere: "glory"
│     defaultCategory: "GENERAL"
│   }

users/{uid}/declarations/{declarationId}
├── text: string
├── reference: string
├── scriptureText: string
├── category: string
├── atmosphere: string
├── imageUrl: string | null
├── createdAt: timestamp
├── isFavorite: boolean
```

### Cloud Functions

```
generateDeclaration(category, mood, customText)
  → Verifies context.auth
  → Calls gemini-2.5-flash with system prompt
  → Returns { text, reference, scriptureText }

generateSpeech(text)
  → Verifies context.auth
  → Calls gemini-2.5-flash-preview-tts
  → Converts PCM → WAV server-side
  → Returns { audioBase64 }

generateImage(category, declarationText)
  → Verifies context.auth
  → Calls gemini-2.5-flash-image
  → Uploads PNG to Firebase Storage
  → Returns { imageUrl }
```

- All functions require authenticated user
- Rate limiting: 10 generations per minute per user
- Images stored persistently in Firebase Storage (reusable URL)
- Speech audio returned as ephemeral base64 (not stored)

### Auth Flow

1. App opens → check for existing Firebase auth token
2. No token → Welcome screen → Sign in (Google / Apple / Anonymous)
3. Firebase Auth creates user → Cloud Function trigger creates Firestore user doc
4. Has valid token → straight to Home screen
5. Expired token → silent refresh, fallback to sign-in
6. Anonymous users can upgrade to full account later (link credentials)

## Navigation & Screens

### Screen Map

```
Root (_layout.tsx)
├── Auth Gate (checks Firebase auth state)
│
├── (auth)/ — Unauthenticated
│   ├── welcome.tsx      Swipeable onboarding (2-3 cards)
│   └── sign-in.tsx      Google / Apple / Try Anonymous
│
└── (tabs)/ — Authenticated
    ├── index.tsx         Home (generate declarations)
    ├── saved.tsx         Saved declarations list
    └── settings.tsx      Preferences & account
```

### Welcome Screen

- 2-3 swipeable onboarding cards
- Card 1: "Speak life over your situation" (app purpose)
- Card 2: "Powered by scripture" (AI + Bible)
- Card 3: "Your daily declaration habit" (notification pitch)
- CTA: "Get Started" → Sign In

### Home Screen

Two states:

**Input state (no active declaration):**
- Header with logo and user avatar
- Horizontal scrollable category bar (7 categories)
- 2x3 mood preset grid (emoji + label)
- Divider
- Custom text input with submit button

**Declaration state (after generation):**
- Back button, image regenerate button, atmosphere selector
- Full declaration card with background image/gradient
- Category label with divider
- Declaration text (large, quoted)
- Scripture card (glass-morphism, italic text, reference badge)
- "Speak Life" play/pause button (full-width, prominent)
- "Fresh Fire" (new declaration) and Share buttons

### Saved Screen

- Vertical list of compact declaration cards
- Each card: category badge, declaration preview (2 lines), scripture ref, date
- Tap to expand to full DeclarationCard with playback
- Swipe left to delete with confirmation
- Empty state illustration + message

### Settings Screen

- Account section: profile info, sign out, delete account
- Declarations section: default category picker, default atmosphere picker
- Notifications section: daily reminders toggle, time picker
- About section: version, terms/privacy, rate the app

### Transitions

- Home → Declaration Card: slide up (modal feel)
- Tab switches: cross-fade
- Auth → Main: fade

## Design System

### Colors

```
Primary
  electric-purple   #7C3AED
  deep-purple       #4C1D95

Secondary
  divine-gold       #FBBF24
  fire-orange       #F59E0B

Neutrals
  void-black        #0F172A
  slate-900         #1E293B
  slate-700         #334155
  slate-400         #94A3B8
  white             #FFFFFF

Category Gradients
  Health:      #059669 → #10B981
  Wealth:      #D97706 → #FBBF24
  Identity:    #7C3AED → #A78BFA
  Success:     #DC2626 → #F59E0B
  Protection:  #2563EB → #7C3AED
  Wisdom:      #0891B2 → #06B6D4
  General:     #4C1D95 → #7C3AED
```

### Typography

| Style | Font | Size | Usage |
|-------|------|------|-------|
| Display | Cinzel | 28-32sp | Declaration text, logo |
| Heading | Playfair Display | 20-24sp | Section headers, category labels |
| Body | Lato | 16sp | General UI, descriptions |
| Caption | Lato | 13sp | Timestamps, secondary info |
| Button | Lato Bold | 16sp | All buttons |
| Scripture | Playfair Display Italic | 15sp | Scripture text |

### Styling Approach

- NativeWind (Tailwind for React Native), compiles to StyleSheet at build
- Theme tokens in tailwind.config.js
- Dark mode default (matches spiritual/cinematic aesthetic)

### Visual Patterns

- Glass-morphism cards: semi-transparent + expo-blur
- Gradient overlays: expo-linear-gradient on declaration cards
- Glow effects: shadows with category color on active elements
- Haptic feedback: expo-haptics on button presses

### Loading State

- Animated gradient pulse (react-native-reanimated) instead of spinner
- Rotating messages: "Preparing your declaration...", "Searching the scriptures...", "The Spirit is moving..."

### Animations

react-native-reanimated for:
- Card slide-up transition
- Music volume fade indicators
- Loading pulse animation
- Button press scales
- List item enter/exit

## Local Notifications

### Configuration

- Enabled: boolean (default true after onboarding prompt)
- Time: HH:mm (default "08:00")
- Days: every day (MVP default)

### Content

15-20 pre-written messages in rotation:
- "Your declaration is ready. Speak life today."
- "Rise and declare — the Word is alive."
- "What will you speak over your day?"
- "Your words carry power. Come declare."
- "Time to align your words with heaven."

### Implementation

- expo-notifications for local scheduling
- Reschedule on preference change
- Preferences synced to Firestore (cross-device)
- Permission requested during onboarding

## MVP Scope

### Included

- Generate declarations (text + scripture) via Gemini
- TTS speech playback via Gemini
- 5 cinematic atmosphere tracks (bundled)
- AI-generated background images via Gemini
- 7 declaration categories
- 6 mood presets + custom input
- Firebase Auth (Google + Apple + Anonymous)
- Save/favorite declarations to Firestore
- Settings (defaults, account management)
- Local notification reminders
- Onboarding flow (2-3 cards)
- Share declaration as image (react-native-view-shot + expo-sharing)

### Deferred (Post-MVP)

- Extra track packs from Firebase Storage
- Declaration streaks / gamification
- Community shared declarations
- Offline mode (cached declarations)
- Multiple TTS voices
- Home screen widgets (iOS/Android)
- In-app purchases (premium tracks)
- Push notifications (server-triggered)
