# Personas

Three personas matter. The first two are users; the third is the operator.

---

## 1. Driti — the average 12th grader

- **Age**: 17.
- **Track (drejtimi)**: Pergjithshem.
- **Where**: Pristina, lives at home, decent Wi-Fi but mostly uses 4G on his phone.
- **Device**: Mid-range Android, browser is Chrome.
- **When he studies**: 30–60 minutes after dinner, sometimes on the bus.
- **What he uses today**: a Telegram group for past papers, occasional YouTube, his school notes.
- **Pain points**:
  - Doesn't know which topics he is actually weak on.
  - PDFs are clunky on his phone.
  - When he gets a question wrong, the answer key gives only a number — no explanation.
  - Has 47 days until Matura, no plan.
- **What he wants**: "Tell me what to practice tonight, and tell me when I'm ready."
- **What he doesn't want**: another app that feels like school. Anything that looks gamified-childish.

Driti is the bullseye. Every design decision should be checkable against "would Driti use this on the bus tomorrow?"

---

## 2. Teuta — the high-achiever

- **Age**: 18.
- **Track**: Natyror. Aiming at medicine in Prishtina or Tirana.
- **Where**: Gjilan, parents' house.
- **Device**: iPhone, also a laptop.
- **When she studies**: hours daily, methodical.
- **What she uses today**: private kurs, all the past papers, hand-solved notebooks.
- **Pain points**:
  - Wants more *hard* questions in derivate, integrale, kombinatorikë.
  - Wants to simulate full timed papers under exam conditions.
  - Wants to see how she ranks against other students (peer signal).
- **What she wants**: more volume, harder content, mock exam mode, leaderboards.
- **Risk**: she'll bounce if our content is too easy or our explanations are babyish.

Teuta is not the MVP target — but her usage validates that our content is good enough for the top of the market.

---

## 3. Andi — the operator (and his three students)

- **Role**: founder/teacher of AkademiaAS, plus three of his best students who help build and author content.
- **Skills**: Professional with NestJS + Next.js + Postgres + Prisma at his day job. Three students are advanced learners.
- **What they need from the system**:
  - Author and publish a question in under 2 minutes.
  - See basic counts: how many users, how many active this week, how many questions per topic.
  - Bulk import their existing PDF + JSON content.
  - Monitor for content errors (wrong answer keys, broken LaTeX).
- **What they don't need yet**: complex CMS workflows, multi-stage review, scheduled publishing, analytics dashboards.

The four `OWNER` accounts are co-equal. There is no separate `admin` vs `teacher` role at MVP.
