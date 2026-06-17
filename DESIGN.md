---
name: Burst
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#46464c'
  surface-tint: '#c0c6de'
  primary: '#c0c6de'
  on-primary: '#2a3043'
  primary-container: '#020617'
  on-primary-container: '#72778d'
  inverse-primary: '#585e73'
  secondary: '#ffb3ad'
  on-secondary: '#68000a'
  secondary-container: '#a40217'
  on-secondary-container: '#ffaea8'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#0e0500'
  on-tertiary-container: '#a86a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1fb'
  primary-fixed-dim: '#c0c6de'
  on-primary-fixed: '#151b2d'
  on-primary-fixed-variant: '#40465a'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930013'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#131315'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-xl:
    fontFamily: Anybody
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Anybody
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered for a high-stakes, competitive environment. The brand personality is aggressive yet sophisticated, blending the prestige of high-end poker with the energy of modern tactical gaming. The target audience consists of strategic thinkers who value precision, speed, and status.

The visual style utilizes **Modern Glassmorphism** and **High-Contrast Digital Accents**. Surfaces are deep and obsidian-like, creating a sense of infinite depth. Interactive elements pulse with electric energy, while high-value actions are highlighted in gold to evoke a premium, "winner-takes-all" atmosphere. The emotional response should be one of intense focus, urgency, and the thrill of a calculated risk.

## Colors

The palette is designed for deep immersion and clear visual hierarchy in low-light environments.

- **Background & Base:** The foundation uses `#020617` (Obsidian) for the deep background and `#0F172A` (Charcoal) for secondary containers.
- **Vibrant Crimson (#EF4444):** Reserved for Hearts, Trump suits, "Burst" states, and critical warnings. It signals danger and high value.
- **Electric Blue (#3B82F6):** The primary interaction color. Used for bidding buttons, player turn indicators, and active UI states.
- **Winner’s Gold (#F59E0B):** A prestigious accent for leaderboards, high scores, and currency. It represents the reward for successful strategy.
- **Glass Overlays:** Backgrounds for modals and panels use semi-transparent variants of the base colors with a `20px` backdrop blur.

## Typography

The typography system strikes a balance between cinematic impact and technical clarity.

- **Headlines (Anybody):** A heavy, variable grotesque that provides an aggressive, modern game feel. It is used for score reveals, big announcements, and section headers.
- **Body (Geist):** A clean, technical sans-serif used for game rules, tooltips, and general interface text to ensure maximum readability during fast-paced play.
- **Data (JetBrains Mono):** Used for numerical values, player counts, and "Burst" point visualizations to lean into the technical, strategic nature of the game.

All headings should use uppercase styling for added authority and a competitive edge.

## Layout & Spacing

The layout uses a **Fluid Grid** with fixed-width central gameplay zones. 

- **Desktop:** 12-column grid. The central card table is a 16:9 fixed-aspect container, while UI sidebars (Leaderboards, Chat) are docked or floating panels.
- **Mobile:** Single column. Card fans are pinned to the bottom of the screen with a 15% overlap.
- **Spacing Rhythm:** Based on a 4px scale. Components should prioritize tight, high-density spacing to keep all strategic data visible at once. Larger 32px gaps are used only to separate distinct functional zones (e.g., Table vs. Player Stats).

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Luminescence** rather than traditional shadows.

- **Level 0 (Background):** Deep Obsidian (`#020617`).
- **Level 1 (Card Slots/Inactive Panels):** Charcoal (`#0F172A`) with a subtle 1px inner stroke.
- **Level 2 (Active Cards/Modals):** Glassmorphic surfaces with 15% opacity and a white 1px border at 10% opacity. 
- **Luminous Borders:** Active player turns or "Hot" cards use a `box-shadow: 0 0 15px` using the `interactive_color` (Blue) or `secondary_color` (Crimson) to signify importance.
- **Z-Index:** High-priority modals (Bidding/Burst) use a dark backdrop blur (`24px`) to completely isolate the game state.

## Shapes

The shape language is "Soft-Angular." While most card-based games use heavy rounding, this design system uses a precise `0.25rem` radius to maintain a sharp, competitive look. 

- **Cards:** Use `rounded-lg` (0.5rem) to differentiate them from the UI frame.
- **Player Avatars:** Circular (100% radius) to contrast with the rectangular card and panel shapes.
- **Action Buttons:** Use `rounded-xl` (0.75rem) or pill shapes for high-speed ergonomics.

## Components

- **Cards:** High-fidelity textures with a subtle metallic sheen gradient. Hovering a card triggers a `translateY(-20px)` and a glow effect. Crimson cards (Hearts/Trumps) have a faint red inner-glow.
- **Bidding Panels:** Segmented control styles using `JetBrains Mono` for numbers. The selected bid glows with `Electric Blue`.
- **Player Status Rings:** A circular progress ring around player avatars indicating remaining turn time. The ring turns from `Blue` to `Crimson` as time expires.
- **Live Leaderboard:** A compact list with `Gold` typography for top-3 ranks. "Burst" points are visualized as a small vertical bar chart next to player names.
- **Buttons:**
    - **Primary:** Gradient from `#3B82F6` to `#1D4ED8`, bold uppercase text.
    - **Burst/Bet:** Solid `#EF4444` with a subtle pulse animation.
- **Input Fields:** Dark charcoal background, `1px` border that illuminates to `Electric Blue` on focus.