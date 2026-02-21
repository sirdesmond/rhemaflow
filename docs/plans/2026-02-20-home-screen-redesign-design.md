# Home Screen Redesign: "Speak It" — Input-First Agentic Layout

## Problem
Testers report the home screen feels boring and traditional. The 2-column mood preset grid takes up most of the screen and buries the custom input below a divider.

## Design Direction
Perplexity/ChatGPT-style input-first layout. The text input becomes the hero element, vertically centered with a golden glow. Category presets move to a compact horizontal pill row near the bottom.

## Layout (top to bottom)

1. **Header** — unchanged (logo, Pro badge, settings icon, gold accent line)
2. **Centered content area** (flex: 1, vertically centered):
   - Greeting: "What are you believing God for?" — Cinzel, 26px, white, centered
   - Subtext: "Type, speak, or pick a topic below" — Lato, 14px, slate400
   - Input field with golden glow border, mic icon (left), send button (right)
3. **Category pills** — horizontal ScrollView near bottom, single row
4. **Usage counter** — free users only, same as current

## Input Field Details
- Glass background with divineGold border and outer glow (shadowColor: divineGold, shadowRadius: 12)
- Left: mic icon (Mic lucide icon, divineGold color). Tapping starts expo-speech-recognition, live transcription fills input. While recording: icon pulses, border glow intensifies.
- Center: TextInput, placeholder "Declare healing, breakthrough, favor..."
- Right: send button (44x44 gold circle when text present, slate700 when empty)

## Category Pills
- Horizontal ScrollView, single row, pinned above usage counter
- Each pill: glass background, rounded-full, emoji + label inline (e.g. "Health")
- ~40px height, gap 10
- Tapping fires onMoodSelect immediately (same behavior as current grid)

## Voice Input
- New dependency: expo-speech-recognition
- Tap mic -> start listening -> live transcription in input -> user edits/sends
- While recording: mic icon animates (scale pulse), border glow intensifies
- Stop recording: tap mic again or speech stops naturally

## What's Removed
- "UNLEASH YOUR VOICE" hero text block
- 2-column mood preset grid
- "Or describe your situation" divider
- Current MoodInput component (replaced)

## What's Unchanged
- Header bar, gold accent line
- Loading overlay
- Declaration card view (post-generation)
- Free user usage counter
- All generation/audio logic
