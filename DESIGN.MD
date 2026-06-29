---
name: BlockTrace
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#171c25'
  surface-container: '#1b2029'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2f0'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#dfe2f0'
  inverse-on-surface: '#2c303b'
  outline: '#849588'
  outline-variant: '#3b4a40'
  surface-tint: '#00e293'
  primary: '#cdffde'
  on-primary: '#003921'
  primary-container: '#00f5a0'
  on-primary-container: '#006b43'
  inverse-primary: '#006c44'
  secondary: '#96edff'
  on-secondary: '#00363e'
  secondary-container: '#00d7f3'
  on-secondary-container: '#005966'
  tertiary: '#fff1e4'
  on-tertiary: '#472a00'
  tertiary-container: '#ffce95'
  on-tertiary-container: '#835200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#50ffaf'
  primary-fixed-dim: '#00e293'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#a1efff'
  secondary-fixed-dim: '#05daf6'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131d'
  on-background: '#dfe2f0'
  surface-variant: '#31353f'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 18px
  address-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 16px
---

## Brand & Style
The design system is engineered for high-density data visualization and technical exploration within the CROO blockchain ecosystem. It targets developers and power users who require precision, speed, and deep technical transparency.

The style is **Technical Minimalism with a Cyber-Grid influence**. It prioritizes a flat, structured hierarchy over skeuomorphic depth. The interface utilizes a rigorous hexagonal and orthogonal geometry, reinforced by a low-opacity background grid to ground UI elements in a "system" environment. The emotional response is one of high-performance utility, digital sovereignty, and forensic clarity. 

Key brand motifs include:
- **The Hex-Mark**: Visual elements and icons should favor hexagonal framing where possible.
- **The Data-Stream**: Code and addresses are treated as first-class citizens, never truncated unless necessary.
- **The Accent Line**: A 1px top-border gradient is used sparingly to denote active states or high-priority containers.

## Colors
This design system utilizes a deep, multi-layered dark palette to reduce eye strain during long sessions of code review and transaction monitoring.

- **Foundational Neutral**: The primary background is a deep obsidian `#070B14`. Secondary surfaces use `#0A1020` to create subtle separation without high-contrast jumps.
- **Accents**: A vibrant "Neon Mint" to "Cyan" gradient is reserved for primary actions, branding, and successful states.
- **Technical Borders**: All structural separation is handled by 1px solid strokes of `#1A2540`.
- **Feedback**: Amber `#F59E0B` is used for pending transactions or network warnings; Red `#EF4444` is strictly for execution failures and critical security alerts.
- **Background Pattern**: Apply a dot-grid or hex-grid pattern in `#1A2540` at 15% opacity across the primary background layer.

## Typography
The typography strategy is bifurcated between high-readability UI labels and high-precision technical data.

- **UI & Navigation**: Space Grotesk provides a geometric, modern feel for all headings and interface labels. It remains legible even at the small, dense scales required for complex dashboards.
- **Data & Code**: JetBrains Mono is used for all blockchain-specific data: wallet addresses, transaction hashes, smart contract code, and CLI outputs. 
- **Scale**: The system uses a condensed type scale. Standard body text is 14px, while technical labels drop to 12px or 11px to maximize information density on single-page views.

## Layout & Spacing
This design system utilizes a **rigid 4px baseline grid** to ensure mathematical alignment across complex data tables and terminal windows.

- **Grid Strategy**: A 12-column fluid grid is used for dashboard layouts. On desktop, sidebars are fixed at 240px to maintain consistent navigation while the main content area expands.
- **Information Density**: Padding within components (cards, list items) should be tight—typically 12px or 16px—to allow for the simultaneous display of multiple data streams.
- **Responsive Behavior**: 
  - **Desktop**: 24px margins, 16px gutters.
  - **Tablet**: 16px margins, 12px gutters.
  - **Mobile**: 12px margins, 8px gutters; data tables transition to stacked "card" views to maintain readability of long hashes.

## Elevation & Depth
Depth is communicated through **tonal layering and structural strokes** rather than shadows. In a dark technical environment, shadows are often lost or create unnecessary visual noise.

- **Stacking Logic**: 
  - Level 0 (Base): `#070B14` with grid pattern.
  - Level 1 (Cards/Panels): `#0A1020` with a 1px solid border of `#1A2540`.
  - Level 2 (Modals/Popovers): `#0D152A` with a 1px border of `#2D3A5E`.
- **Top-Edge Accents**: Cards can feature a 1px height top-border using the Primary-to-Secondary gradient. This is used to indicate "active" or "primary" status for a specific module.
- **Zero-Shadow Policy**: Do not use ambient shadows. Rely entirely on color shifts and 1px borders to define hierarchy.

## Shapes
The design system adopts a **Sharp (0px)** roundedness philosophy.

- **Corners**: All buttons, inputs, and card containers must have 90-degree sharp corners. This reinforces the technical, "engineered" nature of the product.
- **Exceptions**: Only specific status indicators (like "Success" or "Error" pips) may use circular geometry. Hexagonal shapes are encouraged for profile avatars or specialized node-type icons to align with the brand mark.

## Components

### Buttons
- **Primary**: Sharp corners, gradient background (`#00F5A0` to `#00D9F5`), text in `#070B14` (Bold Space Grotesk).
- **Secondary**: Sharp corners, transparent background, 1px border of `#00F5A0`, text in `#00F5A0`.
- **Ghost/Tertiary**: Sharp corners, no border, text in `#1A2540`, transition to white text on hover.

### Cards & Modules
- Background: `#0A1020`.
- Border: 1px solid `#1A2540`.
- Optional: 1px top-accent gradient line for "Active" states.

### Inputs & Terminal
- Background: `#070B14` (inset look).
- Border: 1px solid `#1A2540`.
- Focus State: Border color shifts to `#00F5A0`. 
- Typography: Use **JetBrains Mono** for all input text to ensure character alignment.

### Data Tables (The "Ledger" View)
- Header: Space Grotesk, All-Caps, 11px, color `#4B5563`.
- Row Border: 1px bottom-border only in `#1A2540`.
- Cell Text: JetBrains Mono for hashes and values; Space Grotesk for timestamps and labels.

### Chips & Tags
- Used for "Transaction Status" or "Block Height".
- Rectangle with 0px radius. 
- Subtle background tint (e.g., Green at 10% opacity) with a solid 1px border of the same color.