---
name: Study OS
description: A personal study cockpit drawn as a black-and-white manga page, re-inked by the owner's cover image.
colors:
  cover-accent: "#e02c1f"
  cover-accent-night: "#eb786f"
  ink: "#111111"
  paper: "#ffffff"
  page-ground: "#f4f4f2"
  paper-recess: "#f0f0ee"
  graphite: "#505050"
  soft-rule: "#dcdcda"
  halftone-grey: "#b9b9b9"
  night-ground: "#0e0e0f"
  night-panel: "#171718"
  night-recess: "#1f1f21"
  night-ink: "#f0f0ee"
  night-graphite: "#a9a9a6"
  night-halftone: "#4a4a4c"
  tone-accounting: "#8fb2f4"
  tone-economics: "#f4ad7f"
  tone-math: "#b49bf0"
  tone-english: "#f2909f"
  tone-chinese: "#f2cf55"
  signal-red: "#c21f2f"
  signal-orange: "#a8500c"
  signal-green: "#1f7448"
  alert-tint: "#ffdcdc"
  alert-tint-ink: "#8a1622"
  caution-tint: "#fff0b3"
  caution-tint-ink: "#5c4500"
  calm-tint: "#d9efe0"
  calm-tint-ink: "#1b5131"
typography:
  display:
    fontFamily: "Kaisei Decol, Zen Maru Gothic, Mali, serif"
    fontSize: "clamp(36px, 5vw, 50px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  numeral:
    fontFamily: "Kaisei Decol, Zen Maru Gothic, Mali, serif"
    fontSize: "clamp(46px, 6vw, 62px)"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "tnum"
  headline:
    fontFamily: "Kaisei Decol, Zen Maru Gothic, Mali, serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  bubble:
    fontFamily: "Kaisei Decol, Zen Maru Gothic, Mali, serif"
    fontSize: "clamp(20px, 2.6vw, 26px)"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Zen Maru Gothic, Mali, Sukhumvit Set, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.6
  title:
    fontFamily: "Zen Maru Gothic, Mali, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.4
  label:
    fontFamily: "Zen Maru Gothic, Mali, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 900
  label-caps:
    fontFamily: "Zen Maru Gothic, Mali, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 900
    letterSpacing: "0.04em"
  tag:
    fontFamily: "Zen Maru Gothic, Mali, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 900
    lineHeight: 1.6
rounded:
  frame: "2px"
  tag: "4px"
  control: "6px"
  bubble: "50%"
spacing:
  gutter: "12px"
  panel-y: "16px"
  panel-x: "18px"
  lead-gap: "18px"
  section: "40px"
  page-bottom: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
    height: "42px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.cover-accent}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
    height: "42px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.paper-recess}"
  button-go:
    backgroundColor: "{colors.cover-accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
    height: "46px"
    padding: "0 22px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "16px 18px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 10px"
  course-tag:
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    typography: "{typography.tag}"
    padding: "0 8px"
  speech-bubble:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "18px 34px 20px"
  nav-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: Study OS

Scope: the six core pages (Today `index.html`, `flashcards.html`, `practice.html`, Lessons `hub.html`, `calendar.html`, `grades.html`) and the shared navigation (`scripts/study-nav.js`). The system lives in `assets/study-world.css`, with the cover-driven accent in `scripts/study-accent.js`; each page adds a small page-specific `<style>` after the shared link. Course pages (`acc/eco/math/eng/zh.html`) and WordNest (`vocabloom/`) are out of scope and keep their own styles via `assets/study-unify.css`.

## Overview

**Creative North Star: "The Ink Manga Page"**

Every core page reads as a page of black-and-white seinen line art. Content sits in heavy ink panel frames on white paper; what is "now" (the urgent exam, today's calendar cell, the current class, the wide panel) is toned with diagonal pen hatching; secondary tone is grey hatching and halftone dots. The next action on each page is spoken from a speech bubble with a solid ink tail, and every other panel follows it.

One colour is allowed on the page, and it is not chosen by the designer: it is sampled from the owner's Today cover image, so the whole site re-inks itself when the cover changes. With no cover, the default is an ink red. The dark theme is the same page inverted: near-black paper, off-white ink. Course tones (five pale categorical colours) mark which subject a tag, class block or subject cover belongs to, always with black text on them.

Density is a study tool, not a dashboard: one wide panel per row of narrower ones (manga page rhythm, not an equal tile grid), large Kaisei Decol numerals first, short UI labels in Zen Maru Gothic. The old Notion-pastel look (emoji tiles, pastel gradients, sparkle headings, equal grids) is the confirmed anti-reference.

**Key Characteristics:**
- 3px ink panel frames with near-square 2px corners; no soft shadows on panels.
- Pen hatching in the cover accent marks "now"; grey hatching and halftone dots are secondary tone.
- A speech-bubble lead panel opens every core page with the next step.
- One accent colour, derived from the owner's cover, with contrast computed at runtime.
- Kaisei Decol for display and numerals; Zen Maru Gothic (Mali for Thai) for UI.
- Dark theme is an inverted page, not a separate palette.

## Colors

An ink-on-paper monochrome with one runtime-derived accent and a pale categorical set for courses.

### Primary
- **Cover Accent Ink** (default light `#e02c1f`, from `hsl(var(--ah) var(--as) var(--al))` with defaults `4 76% 50%`): the only chromatic voice. Used for accent hatching on "now" panels, the lead action (`Start`, `.go`), the brand "OS", urgent exam numerals, the grade letter, calendar exam dots, links and the active bottom-bar icon. `scripts/study-accent.js` replaces `--ah`/`--as` with the dominant saturated hue of the owner's cover and solves `--al` so white text on the accent clears 4.5:1; for warm or light hues it keeps the accent bright and switches its ink to near-black (`--acc-ink-l: #111`). `--acc-text` is a darker variant (3:1 on white minimum) for accent used as text.
- **Cover Accent, Night** (default `#eb786f`, `hsl(var(--ah) var(--as) var(--ad))`): the same hue lifted (`--ad`, solved for 6.5:1 against near-black) so near-black text sits on it in dark mode.

### Secondary
- **Course tones** (Accounting periwinkle `#8fb2f4`, Economics apricot `#f4ad7f`, Math lilac `#b49bf0`, English rose `#f2909f`, Chinese mustard `#f2cf55`; slightly deeper in dark mode): categorical only. They fill course tags, jerseys, timetable class blocks and hatched subject covers, always with `#111` text and an ink outline in both themes.

### Neutral
- **Ink** (`#111111`): text, every frame and rule, primary buttons, active nav pill, focus outline.
- **Paper** (`#ffffff`): panels, bubbles, controls, and the knockout behind text that sits on hatching.
- **Page Ground** (`#f4f4f2`): the page behind panels.
- **Paper Recess** (`#f0f0ee`): hover fill on outline controls, secondary surface.
- **Graphite** (`#505050`): muted text (dates, captions, sub-labels).
- **Soft Rule** (`#dcdcda`): row dividers inside panels (2px).
- **Halftone Grey** (`#b9b9b9`): grey hatching and halftone dots.
- **Night set** (ground `#0e0e0f`, panel `#171718`, recess `#1f1f21`, ink `#f0f0ee`, graphite `#a9a9a6`, halftone `#4a4a4c`): the inverted page.
- **Status tints** (alert `#ffdcdc` on `#8a1622`, caution `#fff0b3` on `#5c4500`, calm `#d9efe0` on `#1b5131`; signal text red `#c21f2f`, orange `#a8500c`, green `#1f7448`): task priority and days-left pills, due counts, danger buttons.

### Named Rules
**The Borrowed Ink Rule.** The accent is never hard-coded. Every accent shade is built from `--ah`/`--as`/`--al`/`--ad`; a new surface reads `var(--acc)`, `var(--acc-ink)`, `var(--acc-soft)`, `var(--acc-t)` and nothing else, so it re-inks with the cover.

**The One Colour Rule.** Black is the primary colour (primary buttons, active nav). The accent is reserved for urgency, "now" hatching and the single lead action on a page.

**The Black-On-Tone Rule.** Text on a course tone is always `#111`, in dark mode too.

## Typography

**Display Font:** Kaisei Decol (with Zen Maru Gothic, Mali, serif)
**Body Font:** Zen Maru Gothic (with Mali for Thai, Sukhumvit Set, system-ui)

**Character:** A brushed, slightly calligraphic serif for titles and every number, against a soft rounded gothic for labels. The pairing reads like manga lettering: dramatic captions over clean speech text. The owner asked to keep these fonts.

### Hierarchy
- **Display** (700, `clamp(36px,5vw,50px)`, 1.1): page titles ("Study", "Practice").
- **Numeral** (700, `clamp(46px,6vw,62px)`, 1.05, tabular): scoreboard counts; also exam countdowns (38px), chip values (28px), the Pomodoro clock (`clamp(58px,7.6vw,80px)`). Numbers lead; the label follows below.
- **Bubble** (700, `clamp(20px,2.6vw,26px)`, 1.25): the line spoken in the lead bubble.
- **Headline** (700, 20px, 1.3): section headings, followed by a 3px ink rule that runs to the right edge.
- **Title** (900, 16-17px): panel and plan-item titles in Zen Maru Gothic.
- **Body** (500, 16px, 1.6): running text; captions 13-15px in Graphite.
- **Label** (900, 14px): buttons, section links, scoreboard labels.
- **Label caps** (900, 12px, 0.04em, uppercase): only for structural column labels: calendar weekday headers and grade-table headers.
- **Tag** (900, 11px): course tags and kind badges.

### Named Rules
**The Numbers In Kaisei Rule.** Every count, countdown, score, grade and clock is set in Kaisei Decol; UI words never are.

**The No Eyebrow Rule.** Uppercase small caps label table columns and weekdays only; they never sit above a heading as a kicker.

## Layout

Content column max 1080px beside a 224px left rail on screens 900px and wider; below 900px the rail becomes a fixed bottom bar and pages keep 96px bottom padding to clear it. Panel grids use 4 columns with a 12px gutter: one **wide** panel spans 2 columns (text held to the left 56%, hatching fills the right part behind a 3px ink seam), strips span 2, the rest 1. Grids drop to 2 columns at 700px and 1 column at 480px. Today uses a scoreboard of three panels (`1fr 1fr 1.7fr`), plan beside timer (`1.4fr / 1fr` above 700px), exams in 2 columns (4 above 1000px), subjects in a 6-track grid (3+2 arrangement, 5 across above 1100px, 1 column below 560px). Sections start 40px apart; panels pad 16px 18px. Safe-area insets are respected on the cover, rail and bottom bar.

## Elevation & Depth

Flat. Depth is drawn, not lit: frame weight, hatching and halftone tone separate planes. Panels carry `box-shadow: none` (the legacy `--shadow` token resolves to `none`).

### Shadow Vocabulary
- **Focus halo** (`0 0 0 6px var(--acc-soft)`): paired with a 3px ink outline at 3px offset on every focusable control.
- **Icon ring** (`0 0 0 4px var(--bg)`): lifts the Today icon off the cover edge.
- **Overflow menu** (`0 12px 30px -8px rgba(0,0,0,.3)`): the bottom-bar "More" popover only, the one floating layer.

### Named Rules
**The Drawn Depth Rule.** "Now" is shown by hatching, never by a shadow or glow. Text placed on hatching sits on a paper knockout (`.ko`, or `background: var(--panel)` with 0 4px padding).

## Shapes

Near-square frames and line weight carry the form language. Panels: 2px corners. Controls and the nav pill: 6px. Tags, jerseys, pills, class blocks: 4px. The speech bubble is a full ellipse (`border-radius: 50%`) with a tail built from two clipped wedges, ink behind and paper on top, so the outline runs into the tail. Stroke weights currently in use: 3px frames, section rules and lead controls; 2.5px controls and jerseys; 2px inputs, rows, calendar cells and tags; 1.5px small pills. The default cover is ink speed lines (a repeating conic gradient) radiating over halftone dots.

## Components

### Buttons
Ink-outlined, flat, heavy-weighted labels.
- **Shape:** gently squared (6px), 2.5px ink border, min height 42px (40px inside plans, 44px in calendar headers).
- **Primary:** ink fill, paper text. Hover swaps the fill to the cover accent.
- **Outline:** paper fill, ink text; hover fills Paper Recess.
- **Go (lead action):** cover-accent fill, accent ink text, 3px ink border, 46px high. One per page: the lead-panel action, Pomodoro Start.
- **Danger:** outline with signal-red text.
- **Focus:** 3px ink outline, 3px offset, plus the accent-soft halo.

### Chips and Tags
- **Course tag / jersey:** course-tone fill, `#111` text, ink border (2px tag, 2.5px jersey), 4px corners; jersey uses Kaisei numerals.
- **Status pills** (days-left, priority, badges): 1.5px ink border, 4px corners, status tint with its paired ink.
- **Segmented control** (Pomodoro modes): one 2.5px ink capsule (6px), segments split by 2px ink rules; the pressed segment inverts to ink.

### Cards / Containers
- **Corner Style:** 2px.
- **Background:** Paper; "now" panels add accent hatching (`--hatch`), secondary panels grey hatching (`--hatch-ink`) or halftone dots.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 3px ink.
- **Internal Padding:** 16px 18px.

### Inputs / Fields
- **Style:** paper fill, 2px ink border, 6px corners, 44px high, Graphite placeholder, accent caret; checkboxes take the accent.
- **Focus:** shared ink outline plus accent halo.

### Navigation
White rail (224px) with a 3px ink right edge; brand "Study OS" in Kaisei Decol 25px with "OS" in the accent. Tabs are 44px rows, 15px/700 Graphite; hover fills a light grey (`#efefed`, night `#232325`); the current page is a black pill with paper text, weight 900. Footer (theme, Grades, Back up, Restore) sits under a 2px ink rule. Below 900px: a bottom bar with a 3px ink top edge, icon-over-label tabs 56px tall, the current tab's icon in the accent, and footer items in a "More" popover framed in 3px ink. Icons are inline SVG line icons.

### Speech-Bubble Lead Panel (signature)
The first panel of every core page: a hatched panel (3px ink frame) holding an elliptical bubble that speaks the next step (bubble line in Kaisei, muted sub-line), with the Go button to the right (stacked below at 560px). On Today the same bubble lives inside the wide scoreboard panel as the next-exam countdown.

### Hatched Timer (Today)
Grey-hatched framed panel; the time sits in a paper box with a 3px ink frame in Kaisei numerals; Start is the Go button; reset is an outline icon button.

## Do's and Don'ts

### Do:
- **Do** frame every panel in 3px ink with 2px corners on paper.
- **Do** build accent colours only from `--ah`/`--as`/`--al`/`--ad` (via `--acc`, `--acc-ink`, `--acc-soft`, `--acc-t`) so the page follows the cover.
- **Do** open each core page with the speech-bubble lead panel and one Go action.
- **Do** mark "now" with accent hatching and put text on hatching over a paper knockout.
- **Do** set counts, countdowns, scores and the clock in Kaisei Decol; UI words in Zen Maru Gothic.
- **Do** keep black for primary buttons and the active nav pill; reserve the accent for urgency and the lead action.
- **Do** print `#111` on course tones in both themes.

### Don't:
- **Don't** use soft drop shadows or glows on panels; depth is drawn.
- **Don't** hard-code an accent hex or hue in page CSS.
- **Don't** return to the Notion-pastel look: emoji icons or emoji tiles, pastel gradients, sparkle headings, equal tile grids.
- **Don't** put an uppercase eyebrow or kicker above a heading.
- **Don't** set the accent as small body text on paper; use `--acc-t` (large or bold text only).
- **Don't** round panels beyond 2px or controls beyond 6px.

## Open items

Recorded from the final review (disposition: ship); these are open, not decisions:
- **Authored motion moment:** the system has no authored motion yet; only the `prefers-reduced-motion` kill switch exists. No motion tokens are recorded.
- **Line-weight hierarchy:** four stroke weights (3 / 2.5 / 2 / 1.5px) are in use without a settled rule for which weight belongs to which level.
