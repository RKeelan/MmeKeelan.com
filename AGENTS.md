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

## Adding a New Page

Add the HTML file in `src/`, its JS module in `src/js/`, and register the HTML entry point in `vite.config.ts` under `build.rollupOptions.input`.

## Git Conventions

- Run `bun run check-all` before committing.
- Ideal commit is small enough for a single subject line (no body needed). When a body is needed, use `-` bullet points.
- Never manually add PR numbers like `(#9)` to commit subjects — GitHub adds these automatically on squash merge.
- Merge PRs with: `gh pr merge --squash --delete-branch && git fetch --prune`
- Never use `git -C <repo>` for the repo you're working in.
