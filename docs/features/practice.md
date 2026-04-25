# Feature: Practice (first MVP slice)

The first end-to-end student-facing flow. A logged-in student opens
`/practice/matematike`, answers a randomised set of `PUBLISHED` questions, and
reaches a summary screen with per-topic accuracy.

## End-to-end pipeline

```
sign-in (Firebase) → /practice/matematike
   POST /api/sessions/practice  (body: { subjectSlug: 'matematike', count: 10 })
       → { session, questions[] }   (questions sanitised: no answer/explanation)
   per question:
       POST /api/attempts        (body: { questionId, sessionId, answer, timeMs })
           → { isCorrect, correctAnswer, explanationMd }
   POST /api/sessions/:id/end
       → { total, correct, durationMs, perTopic[] }
   render summary screen
```

## API endpoints

| Method | Path | Module | Notes |
|---|---|---|---|
| POST | `/api/sessions/practice` | `SessionsModule` | Random N `PUBLISHED` questions (`ORDER BY random()` then materialised). Strips `correctAnswer`, `explanationMd`, and `option.isCorrect`. |
| POST | `/api/attempts` | `AttemptsModule` | Records the attempt, evaluates correctness server-side, returns canonical answer + explanation. |
| POST | `/api/sessions/:id/end` | `SessionsModule` | Stamps `endedAt`, returns score + per-topic breakdown. Forbidden if the caller is not the session owner. |

All three require a Firebase Bearer token. The session is owned by the
authenticated user; cross-user access is rejected by `SessionsService.end`.

## Why server-side evaluation

We never trust the browser to know which option is correct. The session
endpoint redacts:

- `Question.correctAnswer`
- `Question.explanationMd`
- every `QuestionOption.isCorrect`

The client sends the raw `answer` (option id for MCQ, free text for
SHORT/LONG); `AttemptsService.evaluate` does the comparison and returns the
explanation only after recording the attempt.

## Web UI (`apps/web/src/app/(app)/practice/matematike`)

- `page.tsx` — server entry point, renders `<PracticeRunner />`.
- `practice-runner.tsx` — single client component implementing a small state
  machine: `loading → answering → feedback → answering → … → summary`. Uses
  the shared `<Markdown />` component for KaTeX-aware rendering of prompts,
  options, correct answers, and explanations.

The runner attaches the Firebase ID token to every request via
`useAuth().getIdToken()`. (After the next `pnpm openapi:generate` run, this
should be migrated to `getApiClient()` from `@/lib/api/client.ts`.)

## Manual smoke test

1. `pnpm dev:infra` (Postgres + Redis + MinIO).
2. `pnpm db:migrate && pnpm db:seed && pnpm seed:questions` — loads the 50 sample questions.
3. `pnpm dev` (turbo: API + web).
4. Sign in at `/sign-in` (set the user's `role` to `OWNER` once if needed).
5. Visit `/practice/matematike`.
6. Answer 10 questions. The header shows progress; each answer reveals
   immediate feedback with the explanation. The final screen shows score,
   duration, and per-topic accuracy.

## Constraints

- Only `PUBLISHED` questions are eligible. Drafts never appear.
- The seed file's MCQs all have one correct option (validator-enforced).
- The placeholder image base URL (`NEXT_PUBLIC_R2_PUBLIC_URL`) defaults to
  `http://localhost:9000/matura-content` for MinIO; update via env in
  staging/production.
- `count` is capped at 50 server-side (Zod schema).

## Known follow-ups (future plans, not this MVP)

- Adaptive question selection based on prior `Attempt` history (SRS / IRT-lite).
- Hint reveal flow with per-hint penalty.
- Timer / time-pressure mode.
- "Save & resume" — currently a refresh restarts the session.
