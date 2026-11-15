---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["flashcards.html","practice.html","hub.html","calendar.html","grades.html"]
---

# Study OS core app (Today, Flashcards, Practice, Lessons, Calendar, Grades)

Scope: the six core pages plus the shared navigation. Mode: Operate.
Audience and job: the owner (see PRODUCT.md) plans today, reviews cards, takes quizzes and practises exam questions, mostly on an iPad.
Constraints: keep every function, id, storage key and the owner's personalisation (Today cover + icon, subject card images, Pomodoro). English UI. iPad landscape/portrait and phone, dark and light.
Redesign: the old Notion-pastel look (emoji icons, sparkle headings, pastel gradients, equal tile grids) is evidence only.

## Direction contract

THESIS: Study OS is a shoujo manga page. Each screen is laid out as ink-framed panels, the next exam speaks from a speech bubble, and pink screentone marks what is "now". Refuses the category default of a pastel Notion dashboard of equal emoji tiles. Chosen by the owner from four rendered anime directions (retro 90s, shoujo, shounen, slice-of-life).

OWN-WORLD: White paper and near-black ink (3px panel frames, square-ish 4px corners), pill buttons with ink outlines, black pill for the primary action and the active nav tab, hot pink (#d63369) for urgency and Start. Screentone dots (pink for focus/today, grey for secondary). Display and numerals in Kaisei Decol; UI in Zen Maru Gothic with Mali for Thai. Each course keeps one pastel tone (Accounting blue, Economics peach, Math lilac, English pink, Chinese lemon) on tags, pill tiles and subject covers. Dark theme = inverted page: ink-black paper, light ink lines, maroon tone. No drop shadows, no gradients except the cover's focus lines.

STORY: Open Today, read three panels (cards due, tasks, the next exam in a bubble), tick the first plan item, start the timer, then go to cards or practice. Every page uses the same frames, pills and course tones.

FIRST VIEWPORT: White rail with an ink edge (bottom bar on narrow screens). Owner's cover image (default: pink screentone with white focus lines) with round icon, "Study" in Kaisei Decol and the date. Below, a row of three manga panels: Cards due, Tasks (grey tone), and a wide pink panel holding a speech bubble "Next exam / title / N days!". Then Today: plan panel (left) beside the pink-toned timer panel with the time in a framed box (right).

FORM: Shoujo manga page; re-roll 1 with the owner's anime steer, owner picked from four rendered options (not the dealt index). seed:64d6548c4fa5ee25

SIGNATURE: The next exam spoken from a speech bubble, plus screentone marking "today/now" across pages (cover, timer, calendar today cell, today column).
