# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

Educational web app for French Immersion teachers (Ontario curriculum). Multiple interactive tools — roulette wheel, bingo card generator, verb conjugation wheel, sentence generator, schedule tool — built as a multi-page Vite app deployed to GitHub Pages.

## Commands

```bash
bun run dev            # Start dev server
bun run build          # Production build
bun run test           # Run all tests (Vitest)
bun run test:watch     # Watch mode
bun run test:coverage  # Coverage report
bun run lint           # Biome lint
bun run format         # Biome format
bun run typecheck      # TypeScript type checking (strict, checks JS via JSDoc)
bun run check-all      # Lint + typecheck + test (run before committing)
bunx vitest run src/js/utils.test.js # Run a single test file
```

## Architecture

- **Source root**: `src/` — Vite is configured with `root: 'src/'`
- **Multi-page app**: Each tool has its own HTML entry point in `src/` and corresponding JS module in `src/js/`. Entry points are explicitly listed in `vite.config.ts` rollupOptions.
- **Language**: JavaScript with full JSDoc type annotations (no `.ts` source files). TypeScript is used only for type checking (`checkJs: true`) and config files.
- **Reusable component**: `StringReel` (`src/js/string-reel.js`) is a slot-machine animation class used by both verb-wheel and sentence-reel.
- **Shared utilities**: `src/js/utils.js` — word list parsing, rainbow color generation, HSL-to-hex conversion.
- **PDF generation**: Bingo uses jsPDF to generate printable bingo cards client-side.
- **Tests**: Co-located as `*.test.js` files in `src/js/`. Use Vitest with jsdom environment and global test utilities.
- **Base path**: `/MmeKeelan.com/` (for GitHub Pages deployment).

## Ontario Curriculum

`curriculum/` holds a git-ignored local copy of the Ontario curriculum for Kindergarten to Grade 8: each document as the Ministry's PDF with a Markdown conversion beside it. Consult it when matching a tool to curriculum expectations; `curriculum/README.md` lists the documents and where they came from. It does not exist in a fresh clone.

## Adding a New Page

Add the HTML file in `src/`, its JS module in `src/js/`, and register the HTML entry point in `vite.config.ts` under `build.rollupOptions.input`.

## UX Conventions

- **Disabled-button tooltips**: When a button is disabled, set its `title` attribute to explain why (e.g. `button.title = 'Add more words (need at least 25, currently 10)'`). Clear the title when the button becomes enabled. See `bingo.js` and `connect-4.js` for examples.

## Dependency Management

Always pin dependencies to exact versions — no `^`, `~`, or bare package names. `.bunfmt` sets `save-exact=true` so `bun add` pins automatically. `bun.lock` must be committed.

## Git Conventions

- Run `bun run check-all` before committing.
- Ideal commit is small enough for a single subject line (no body needed). When a body is needed, use `-` bullet points.
- Never manually add PR numbers like `(#9)` to commit subjects — GitHub adds these automatically on squash merge.
- Merge PRs with: `gh pr merge --squash --delete-branch && git fetch --prune`
- Never use `git -C <repo>` for the repo you're working in.
