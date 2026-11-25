Write practice questions for my {SUBJECT} course, chapter "{CHAPTER}". Make {N} new multiple-choice questions in English.

Output ONLY a Markdown file in exactly this layout, with nothing before or after it:

Subject: {SUBJECT}
Chapter: {CHAPTER}

---
Question: <the question, one paragraph; put any numbers it needs inside it>
A) <option>
B) <option>
C) <option>
D) <option>
Answer: <one letter, A to D>
Explanation: <say why the right answer is right only; never explain the wrong options>

---
Question: ...

Rules:
- Exactly 4 options per question, exactly one right. Spread the right answer over A, B, C and D.
- Subject must be one of: Accounting, Economics, Math for Life.
- Chapter must be copied exactly from this list. Accounting: 01 Business, 02 Recording, 03 Adjusting, 04 Cycle, 05 Merchandising, 06 Inventory, 07 AIS, 08 Cash, 09 Receivables. Economics: Micro · 002 Economic Way of Thinking, Micro · 003 Demand & Supply, Macro · GDP, Macro · Inflation & CPI, Macro · Business Cycle, Macro · AD–AS, Macro · Growth & Development, Macro · Money & Banking, Macro · Fiscal Policy, Macro · Monetary Policy. Math for Life: 05 Financial Math, 06 Sets & Venn, 07 Prob & Stats.
- A new Chapter line may appear before any question to change the chapter for the questions after it.
- Do not repeat a question from earlier days; change the situation and the numbers, not just the wording.
- No tables inside a question or option. Write amounts as plain numbers (for example 12,500).
- Save the file as {SUBJECT}-{YYYY-MM-DD}.md.
