# TaskFlow Landing Page - Visual Component Map

```
┌──────────────────────────────────────────────────────────────┐
│                    LANDING PAGE STRUCTURE                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Landing.jsx (Main Container)                                 │
│  ├─ Background Gradient (fixed)                               │
│  ├─ Noise Texture Overlay (fixed)                             │
│  └─ Main Content                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ├──────────────────────────────┐
                            │                              │
            ┌───────────────┴─────────────┐    ┌──────────┴────────────┐
            │  LandingNav.jsx             │    │  Sections (scroll)    │
            │  (Reveals on scroll > 100px)│    └──────────┬────────────┘
            │  ├─ Logo                    │               │
            │  ├─ Sign In button          │               │
            │  └─ Get Started button      │               │
            └─────────────────────────────┘               │
                                                           │
    ┌──────────────────────────────────────────────────────┴─────┐
    │                                                              │
    ▼                                                              ▼
┌─────────────────────────────────────────┐    ┌──────────────────────────────────┐
│  1. HeroSection.jsx                     │    │  Background Elements             │
│                                         │    │  ├─ Animated gradient orbs       │
│  ┌────────────────────────────────┐    │    │  ├─ Floating UI shards:          │
│  │  Badge: "Production-ready..."  │    │    │  │  ├─ Kanban card hint          │
│  └────────────────────────────────┘    │    │  │  ├─ Chart hint                │
│  ┌────────────────────────────────┐    │    │  │  └─ Analytics card hint       │
│  │  Headline:                     │    │    │  └─ Parallax on mouse move       │
│  │  "The Operating System"        │    │    └──────────────────────────────────┘
│  │  "For Team Momentum"           │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │  Subtext: Multi-workspace...   │    │
│  └────────────────────────────────┘    │
│  ┌─────────────────┬──────────────┐    │
│  │  [Create Free]  │  [Explore]   │    │
│  │  CTA Primary    │  CTA 2nd     │    │
│  └─────────────────┴──────────────┘    │
│  ┌────────────────────────────────┐    │
│  │  Trust indicators (3 items)    │    │
│  └────────────────────────────────┘    │
│                                         │
│  Scroll indicator ↓                    │
└─────────────────────────────────────────┘

    │
    ▼
┌─────────────────────────────────────────┐
│  2. TrustArchitecture.jsx               │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Headline: "Built for Scale"   │    │
│  └────────────────────────────────┘    │
│                                         │
│  Grid (3 columns desktop)              │
│  ┌─────────┬─────────┬─────────┐      │
│  │ Card 1  │ Card 2  │ Card 3  │      │
│  │ Multi-  │ Role-   │ Real-   │      │
│  │ Workspace│Based   │Time     │      │
│  │         │         │         │      │
│  │ [Icon]  │ [Icon]  │ [Icon]  │      │
│  │ Details │ Details │ Details │      │
│  │ (hover) │ (hover) │ (hover) │      │
│  └─────────┴─────────┴─────────┘      │
│  ┌─────────┬─────────┬─────────┐      │
│  │ Card 4  │ Card 5  │ Card 6  │      │
│  │ Analyt- │ Audit & │ Auto-   │      │
│  │ ics     │ Compli- │ mated   │      │
│  │         │ ance    │ Work-   │      │
│  │ [Icon]  │ [Icon]  │ flows   │      │
│  │ Details │ Details │ [Icon]  │      │
│  │ (hover) │ (hover) │ Details │      │
│  └─────────┴─────────┴─────────┘      │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Architecture Diagram          │    │
│  │  ├─ 6 Role Levels              │    │
│  │  ├─ ∞ Workspaces               │    │
│  │  └─ 11 Analytics Graphs        │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘

    │
    ▼
┌─────────────────────────────────────────┐
│  3. ProductExperience.jsx               │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Headline: "Interface Clarity" │    │
│  └────────────────────────────────┘    │
│                                         │
│  Preview 1: Dashboard Intelligence     │
│  ┌─────────────────────────────────┐   │
│  │ [Icon] Title    │  Animated UI  │   │
│  │ Description     │  - Stats cards│   │
│  │                 │  - Charts     │   │
│  │                 │  - Search bar │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Preview 2: Kanban Flow (reversed)     │
│  ┌─────────────────────────────────┐   │
│  │  Animated UI  │ [Icon] Title    │   │
│  │  - 3 columns  │ Description     │   │
│  │  - Cards      │                 │   │
│  │  (slide in)   │                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Preview 3: Calendar Context           │
│  ┌─────────────────────────────────┐   │
│  │ [Icon] Title    │  Animated UI  │   │
│  │ Description     │  - Calendar   │   │
│  │                 │  - Task dots  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

    │
    ▼
┌─────────────────────────────────────────┐
│  4. PricingComparison.jsx               │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Headline: "Start Free, Scale" │    │
│  └────────────────────────────────┘    │
│                                         │
│  Grid (2 columns)                      │
│  ┌──────────────────┬────────────────┐ │
│  │  COMMUNITY       │  CORE          │ │
│  │  (Green accent)  │  (Purple)      │ │
│  │                  │                │ │
│  │  FREE FOREVER    │  ENTERPRISE    │ │
│  │  $0              │  Custom        │ │
│  │                  │                │ │
│  │  Features:       │  Features:     │ │
│  │  ✓ Up to 10...  │  ✓ Unlimited...│ │
│  │  ✓ Up to 100... │  ✓ Unlimited...│ │
│  │  ✓ Up to 3...   │  ✓ Unlimited...│ │
│  │  ✓ Full task... │  ✓ Everything..│ │
│  │  ✗ No bulk...   │  ✓ Bulk import │ │
│  │  ✗ No audit...  │  ✓ Audit logs  │ │
│  │                  │                │ │
│  │  [Create Free]   │  [Contact]     │ │
│  │  CTA Button      │  Sales         │ │
│  └──────────────────┴────────────────┘ │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Note: Both include real-time  │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘

    │
    ▼
┌─────────────────────────────────────────┐
│  5. Philosophy.jsx                      │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Headline: "Why TaskFlow"      │    │
│  └────────────────────────────────┘    │
│                                         │
│  Paragraphs (4):                       │
│  - Work breaks when...                 │
│  - Most task tools...                  │
│  - TaskFlow was built...               │
│  - This is for teams...                │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Blockquote: "A task mgmt..."  │    │
│  └────────────────────────────────┘    │
│                                         │
│  Principles (3 columns):               │
│  ┌─────────┬─────────┬─────────┐      │
│  │   01    │   02    │   03    │      │
│  │ Arch-   │ Clarity │ Scale   │      │
│  │ itecture│ Over    │ Without │      │
│  │ First   │ Cuteness│ Friction│      │
│  └─────────┴─────────┴─────────┘      │
└─────────────────────────────────────────┘

    │
    ▼
┌─────────────────────────────────────────┐
│  6. ConversionFooter.jsx                │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Final CTA:                    │    │
│  │  "Ready to Build With          │    │
│  │   Structure?"                  │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌─────────────────┬──────────────┐    │
│  │  [Get Started]  │  [Sign In]   │    │
│  │  Primary CTA    │  Secondary   │    │
│  └─────────────────┴──────────────┘    │
│                                         │
│  Trust indicators (3 items)            │
│                                         │
│  ──────────────────────────────────    │
│                                         │
│  Footer Links (4 columns):             │
│  ┌─────┬──────┬─────────┬────────┐    │
│  │Logo │Prod- │Resource │Company │    │
│  │&    │uct   │         │        │    │
│  │Desc │      │         │        │    │
│  └─────┴──────┴─────────┴────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  © 2025 | Socials | Legal      │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘


═══════════════════════════════════════════
  ANIMATION SYSTEM
═══════════════════════════════════════════

Scroll Position    │  Element Behavior
───────────────────┼───────────────────────
0px (page load)    │  Hero: Fade in up
                   │  Floating shards: Appear
                   │  Nav: Hidden
───────────────────┼───────────────────────
100px              │  Nav: Fade in, slide down
───────────────────┼───────────────────────
20% in viewport    │  Trust cards: Reveal staggered
                   │  (delay: 0, 100, 200, 300, 400, 500ms)
───────────────────┼───────────────────────
20% in viewport    │  Product previews: Fade in
                   │  Charts: Animate (grow bars, draw circles)
───────────────────┼───────────────────────
20% in viewport    │  Pricing panels: Slide in from sides
                   │  (Community: left, CORE: right)
───────────────────┼───────────────────────
30% in viewport    │  Philosophy: Fade in
───────────────────┼───────────────────────
Scroll to footer   │  Conversion CTA visible


═══════════════════════════════════════════
  INTERACTION STATES
═══════════════════════════════════════════

Element            │  Idle            │  Hover
───────────────────┼──────────────────┼──────────────────
Nav Buttons        │  bg-white/5      │  bg-white/10
Trust Cards        │  bg-white/5      │  translate-y(-4px)
                   │  border-white/10 │  + glow effect
                   │                  │  + reveal details
CTA Buttons        │  Scale 1         │  Scale 1.05
(Primary)          │  Shadow normal   │  Shadow intense
                   │                  │  + glow effect
Pricing Panels     │  bg-white/5      │  Enhanced glow


═══════════════════════════════════════════
  RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════

Mobile (< 640px)   │  Tablet (640-1024) │  Desktop (> 1024)
───────────────────┼────────────────────┼──────────────────
Single column      │  2 columns         │  3 columns
Stacked CTAs       │  Side-by-side CTAs │  Side-by-side
Text 4xl           │  Text 5xl          │  Text 7xl
Hidden parallax    │  Subtle parallax   │  Full parallax
Touch targets 44px │  Mixed sizes       │  Smaller sizes


═══════════════════════════════════════════
  COLOR SYSTEM
═══════════════════════════════════════════

Purpose            │  Color               │  Usage
───────────────────┼──────────────────────┼──────────────
Primary Gradient   │  Purple → Violet     │  CTAs, badges
Secondary Gradient │  Green → Emerald     │  Community tier
Background         │  Slate-950, 900      │  Page bg
Glass BG           │  White/5, White/10   │  Cards
Glass Border       │  White/10, White/20  │  Card borders
Text Primary       │  White               │  Headlines
Text Secondary     │  Slate-400           │  Body text
Text Tertiary      │  Slate-500           │  Captions
Accent Success     │  Green-500           │  Checkmarks


═══════════════════════════════════════════
  PERFORMANCE BUDGET
═══════════════════════════════════════════

Metric             │  Target    │  Strategy
───────────────────┼────────────┼──────────────────────
First Paint        │  < 1s      │  Minimal CSS, no images
Largest Paint      │  < 2.5s    │  CSS gradients, inline SVG
Time to Interactive│  < 3.5s    │  Lazy load via Intersection
Cumulative Layout  │  < 0.1     │  Fixed dimensions
First Input Delay  │  < 100ms   │  Minimal JS, RAF
JavaScript Size    │  < 50KB    │  No animation libraries
CSS Size           │  < 30KB    │  Tailwind purge


═══════════════════════════════════════════
  FILE DEPENDENCIES
═══════════════════════════════════════════

Landing.jsx
  ├─ LandingNav.jsx
  │   └─ lucide-react (ArrowRight)
  │   └─ react-router-dom (useNavigate)
  │
  ├─ HeroSection.jsx
  │   └─ lucide-react (ArrowRight, Sparkles)
  │   └─ react-router-dom (useNavigate)
  │
  ├─ TrustArchitecture.jsx
  │   └─ lucide-react (6 icons)
  │
  ├─ ProductExperience.jsx
  │   └─ lucide-react (3 icons)
  │
  ├─ PricingComparison.jsx
  │   └─ lucide-react (Check, X, ArrowRight)
  │   └─ react-router-dom (useNavigate)
  │
  ├─ Philosophy.jsx
  │   └─ (no external deps)
  │
  └─ ConversionFooter.jsx
      └─ lucide-react (ArrowRight, Github, Twitter, Linkedin)
      └─ react-router-dom (useNavigate)

All components use:
  - React hooks (useState, useEffect, useRef)
  - Intersection Observer API
  - Tailwind utility classes


═══════════════════════════════════════════
  CONVERSION FUNNEL
═══════════════════════════════════════════

Entry Point: Landing (/)
    │
    ├─ Hero CTA → /register (Primary)
    │
    ├─ Hero CTA → Scroll to #pricing (Secondary)
    │
    ├─ Nav "Get Started" → /register
    │
    ├─ Nav "Sign In" → /login
    │
    ├─ Community Panel CTA → /register
    │
    ├─ CORE Panel CTA → Scroll to #contact
    │
    └─ Footer CTA → /register or /login

Success: User creates account (/register)
```

**Legend:**
- `┌─┐` Box outlines
- `│` Vertical flow
- `▼` Scroll direction
- `[Button]` Interactive element
- `✓/✗` Feature included/excluded
- `(hover)` Interaction state
