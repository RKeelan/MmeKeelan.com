# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

Educational web app for French Immersion teachers (Ontario curriculum). Multiple interactive tools — roulette wheel, bingo card generator, verb conjugation wheel, sentence generator, schedule tool — built as a multi-page site, bundled with Bun and deployed to GitHub Pages.

## Commands

```bash
bun run dev            # Start dev server with hot reload (http://localhost:3000)
bun run build          # Production build into dist/
bun run preview        # Serve dist/ under the base path
bun run test           # Run all tests (bun test)
bun run test:watch     # Watch mode
bun run test:coverage  # Coverage report
bun run lint           # Biome lint
bun run format         # Biome format
bun run typecheck      # Type checking with bun check (strict, checks JS via JSDoc)
bun run check-all      # Lint + typecheck + test (run before committing)
bun test src/js/utils.test.js # Run a single test file
```

## Architecture

- **Source root**: `src/`. The build bundles every `src/*.html` page, and the dev server (`scripts/dev.ts`) serves each one at its file name, as the live site does.
- **Multi-page app**: Each tool has its own HTML entry point in `src/` and corresponding JS module in `src/js/`. The build and the dev server find the entry points by glob, so there is no list of them to maintain.
- **Language**: JavaScript with full JSDoc type annotations (no `.ts` source files). TypeScript is used only for type checking (`checkJs: true`) and config files.
- **Reusable component**: `StringReel` (`src/js/string-reel.js`) is a slot-machine animation class used by both verb-wheel and sentence-reel.
- **Shared utilities**: `src/js/utils.js` — word list parsing, rainbow color generation, HSL-to-hex conversion.
- **PDF generation**: Bingo uses jsPDF to generate printable bingo cards client-side.
- **Tests**: Co-located as `*.test.js` files in `src/js/`. Use `bun test`, importing test functions from `bun:test`; the `happydom.ts` preload (set in `bunfig.toml`) provides the DOM. Every test file runs in one global scope, so a test that replaces a global must restore it (`src/js/test-globals.js`), and a `mock.module` mock reaches the files that run after it.
- **Base path**: `/MmeKeelan.com/` (for GitHub Pages deployment), set by `--public-path` in the `build` script. `bun run preview` serves the build under it.

## Ontario Curriculum

`curriculum/` holds a git-ignored local copy of the Ontario curriculum for Kindergarten to Grade 8: each document as the Ministry's PDF with a Markdown conversion beside it. Consult it when matching a tool to curriculum expectations; `curriculum/README.md` lists the documents and where they came from. It does not exist in a fresh clone.

## Adding a New Page

Add the HTML file in `src/` and its JS module in `src/js/`. The build and the dev server pick up every `src/*.html` file, so there is nothing to register.

Import the page's stylesheets from its JS module (`import '../css/styles.css';`) and don't also link them from the HTML. When a stylesheet referenced both ways is briefly replaced, as `git checkout` does, Bun's dev server stops running the page's script until it is restarted.

## UX Conventions

- **Disabled-button tooltips**: When a button is disabled, set its `title` attribute to explain why (e.g. `button.title = 'Add more words (need at least 25, currently 10)'`). Clear the title when the button becomes enabled. See `bingo.js` and `connect-4.js` for examples.

## Dependency Management

Always pin dependencies to exact versions — no `^`, `~`, or bare package names. `bunfig.toml` sets `exact = true` under `[install]` so `bun add` pins automatically. `bun.lock` must be committed.

## Git Conventions

- Run `bun run check-all` before committing.
- Ideal commit is small enough for a single subject line (no body needed). When a body is needed, use `-` bullet points.
- Never manually add PR numbers like `(#9)` to commit subjects — GitHub adds these automatically on squash merge.
- Merge PRs with: `gh pr merge --squash --delete-branch && git fetch --prune`
- Never use `git -C <repo>` for the repo you're working in.
