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

THESIS: Study OS is a black-and-white manga page in ink line art. Heavy ink panel frames, pen hatching and halftone mark what is "now", and the next action on each page is spoken from a speech bubble. One accent colour is taken from the owner's own cover image, so the whole site re-inks itself when the cover changes. Refuses the pastel Notion dashboard of equal emoji tiles. The owner moved from shoujo to a more masculine line-art manga and asked for cover-driven colour.

OWN-WORLD: White paper (#fff panels on #f4f4f2), near-black ink, 3px square panel frames (2px corners), 6px-radius ink-outlined buttons, black for primary and active nav, the cover accent for urgency, Start and the lead action. Textures: diagonal pen hatching in the accent, grey hatching and halftone dots as secondary tone, ink speed lines on the default cover. Display and numerals in Dela Gothic One; UI in Zen Kaku Gothic New with Kanit for Thai. Course tones (Accounting blue, Economics orange, Math violet, English rose, Chinese yellow) on tags, tiles and hatched subject covers. Dark theme = inverted page. scripts/study-accent.js derives hue/saturation from the cover and picks lightness so text on the accent stays at AA in both themes.

STORY: Each page opens with the next step in a bubble (Today: next exam; Flashcards: most cards due; Practice: weakest chapter before the next exam; Lessons: exam scope), then the working panels.

FIRST VIEWPORT: White rail with ink edge (bottom bar on narrow screens). Owner cover (default: ink speed lines on halftone) with square icon, "Study" in Dela Gothic One and the date. Three panels: number-first Cards due, hatched Tasks, and a wide accent-hatched panel with a bubble "Accounting quiz in / 1 day!". Then plan (actions right-aligned) beside the hatched timer with the time in a framed box.

FORM: Ink manga (seinen line art); owner steer after the shoujo pick, not the dealt index. seed:64d6548c4fa5ee25

SIGNATURE: Cover-driven accent ink plus the speech-bubble lead panel on every core page.
