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

THESIS: The semester is a Sports Day season (กีฬาสี). Each course is a team with its own colour, exams are fixtures, and today's numbers are posted on a scoreboard. Refuses the category default of a pastel Notion dashboard of equal emoji tiles.

OWN-WORLD: Scoreboard green (#0f3b2c family) owns the navigation rail and every "board" (scoreboard, game clock); numerals in a condensed sign face (Big Shoulders Display) in scoreboard yellow on the board. Cool chalk-white ground, white panels, near-black ink; dark theme is a night stadium (deep green-black ground). Team colours: Accounting blue, Economics orange, Math purple, English red, Chinese yellow, used as solid stripes, bands and tags. UI text in Bai Jamjuree (Thai-designed Latin+Thai family). Line icons, no emoji chrome, no gradients.

STORY: Open Today, read the scoreboard (cards due, tasks, next fixture) in one glance, take the first plan item, start the game clock, then go to cards or practice. Every page shows the same teams in the same colours.

FIRST VIEWPORT: Green rail left (bottom bar on narrow screens). Owner's cover image (default: team-colour lane stripes) with icon and "Study" + date. Directly below, a full-width scoreboard board: three cells, label above, large yellow numerals, the next fixture cell widest and red-flagged when 3 days or fewer. Below it, Today: plan list (left, team tags, primary action per item) beside the game clock board (right).

FORM: Scoreboard / colour sports day; own grounded candidate 7 of 7. seed:64d6548c4fa5ee25

SIGNATURE: The scoreboard strip, with the same board treatment reused for the Pomodoro game clock and team-colour stripes on every subject row across pages.
