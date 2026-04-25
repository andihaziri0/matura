# ADR-0008: KaTeX for math rendering

- **Status**: Accepted
- **Date**: 2026-04-25
- **Deciders**: Andi

## Context

Matematikë questions and explanations contain LaTeX (fractions, integrals, matrices, piecewise functions, systems). We need crisp, fast, SSR-friendly math rendering on the web.

## Decision

Use **KaTeX** (`katex` + `react-katex`) plus the **`remark-math` / `rehype-katex`** Markdown pipeline. A single shared `<Markdown />` component in `@matura/ui` renders everything.

LaTeX delimiters: `$...$` for inline, `$$...$$` for block.

## Consequences

### Positive
- Faster than MathJax; no layout shift.
- MIT license, no tracking, small bundle.
- Server-rendered output works without JS — content is indexable and accessible.
- Covers every notation Kosovo Matura math requires.

### Negative
- KaTeX supports a subset of LaTeX (no `\newcommand` definitions in arbitrary places). Acceptable for our content.
- Markdown + LaTeX coexistence requires careful escaping in places (e.g., `_` inside math vs Markdown emphasis). The pipeline handles standard cases correctly.

## Alternatives considered

- **MathJax**: fuller LaTeX support, slower, heavier bundle.
- **Image-based math**: ugly on retina, bad accessibility.
- **MathML directly**: poor cross-browser story.

## Operational notes

- KaTeX CSS is loaded once at the root layout in `apps/web`.
- The shared `<Markdown />` component is the only place we configure the math pipeline. All question/explanation rendering goes through it.
- Authors writing content should preview in the admin editor (live KaTeX preview is part of phase 9).
