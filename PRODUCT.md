# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: a first-year university accounting student who built Study OS for their own courses. They use it mostly on an iPad (Safari and as a home-screen app), sometimes on a desktop PC. They read Thai; the interface is English, study content (cards, summaries) is partly Thai.

Their main jobs, in order of frequency:
1. Plan today: see classes, the day's plan, upcoming exams and own tasks, then pick what to study.
2. Review flashcards and take quizzes, often in short sessions before class or an exam.
3. Practise exam-style questions (course quizzes, accounting textbook exercises).

## Product Purpose

A personal study cockpit that turns a semester (courses, chapters, exams, timetable, grades) into one clear answer to "what should I study next?", and holds every study tool (cards, quizzes, summaries, notes, timer) in one place. Success: the owner opens it, knows within seconds what matters today, and gets into a study session without hunting.

## Positioning

Built around one student's real semester: their exam dates and syllabus scope drive the plan engine, weak chapters come from their own quiz answers, and SRS cards come from their own course material. A generic note or flashcard app cannot know what is due, what is weak and what is next.

## Operating Context

- Daily ritual: open Today, check classes and countdowns, tick plan items, start a Pomodoro, jump into cards or a quiz.
- Short review bursts on an iPad held in hand or on a desk; touch is the main input.
- Static site on GitHub Pages; all personal data stays in the browser (localStorage). Backup/restore moves data between devices.
- Course pages (`acc/eco/math/eng/zh.html`) and WordNest (`vocabloom/`) are separate surfaces with their own engines.

## Capabilities and Constraints

- Pages in scope for the current redesign: Today (`index.html`), Flashcards, Practice, Lessons (`hub.html`), Calendar, Grades, and the shared navigation (`scripts/study-nav.js`).
- Static HTML/CSS/vanilla JS; no build step. Shared scripts: `study-nav.js`, `study-theme.js` (auto/dark/light), `study-today.js`, `study-grades.js`.
- Must keep every function, data key and storage behaviour (see AGENTS.md). Never lose study progress.
- Must work at iPad landscape (1180×820), portrait (820×1180) and phone (390×844), in dark and light themes, with no horizontal overflow.
- UI copy stays English.
- No personal data (timetable, grades, IDs) in the repo; it lives only in localStorage.

## Brand Commitments

- Name: "Study OS". "WordNest" is the language-learning destination.
- Personalisation the owner chose and must keep: the Today cover image and page icon (local images, animated GIFs, https or Google Drive links), per-subject card images, and the Pomodoro timer.

## Evidence on Hand

Real course content: accounting chapters 1–9, 403 indexed textbook exercises, course flashcards and quizzes for Accounting, Economics and Math, English/Chinese vocabulary. No testimonials or external users exist; do not invent any.

## Product Principles

1. Answer "what next?" first: every main screen leads with the most useful next action, not a grid of equal tiles.
2. One product, one system: every page should feel like the same tool made by the same hand.
3. Fast in, fast out: a review session starts in one or two taps.
4. The owner's own material leads: their cover, subjects and progress are the content; chrome stays out of the way.
5. Data is sacred: redesigns never touch stored progress.

## Accessibility & Inclusion

Touch-first on iPad: comfortable tap targets, readable text sizes, WCAG AA contrast in both themes.
