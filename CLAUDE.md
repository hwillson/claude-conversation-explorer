# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Conversation Explorer is a terminal UI (TUI) application for browsing and searching Claude Code conversation sessions. It reads data from `~/.claude/` (history and per-project session files) and renders a two-pane interface in the terminal using Ink (React for CLI).

## Commands

- `npm start` — Run the app (`tsx source/cli.tsx`)
- `npm run dev` — Run with file watching (`tsx watch source/cli.tsx`)
- `npx tsc --noEmit` — Type-check without emitting

There are no tests or linter configured.

## Architecture

**Runtime:** TypeScript + ESM (`"type": "module"`), executed via `tsx` (no build step needed for development). Uses `.js` extensions in imports per Node ESM resolution.

**UI framework:** [Ink v5](https://github.com/vadimdemedes/ink) — renders React components to the terminal. Components use `<Box>` and `<Text>` from Ink for layout. Text input uses `@inkjs/ui`.

### Data flow

1. **CLI entry** (`source/cli.tsx`) — Parses `--project` / `--search` flags via `meow`, renders `<App>`.
2. **Data loading** (`source/data/loader.ts`) — Merges two data sources in parallel, deduplicates (project sessions take priority over history), sorts by modified date.
3. **App state** (`source/app.tsx`) — `useReducer` manages all UI state (cursor position, active pane, search, scroll). Keyboard input handled via Ink's `useInput` with a ref-based handler pattern to avoid re-registration.

### Data sources (all under `~/.claude/`)

- **Project scanner** (`source/data/project-scanner.ts`) — Reads `~/.claude/projects/<encoded-path>/`. Prefers `sessions-index.json` for session metadata; falls back to reading first 20 lines of each `.jsonl` file header.
- **History parser** (`source/data/history-parser.ts`) — Reads `~/.claude/history.jsonl`. Groups entries without a `sessionId` into synthetic sessions using 2-hour time gaps per project.
- **Session parser** (`source/data/session-parser.ts`) — Streams a full `.jsonl` session file line-by-line to build `ConversationDetail`. Skips sidechain messages and `file-history-snapshot`/`progress`/`thinking` line types. Extracts text content and tool use names from assistant messages.

### Path encoding (`source/utils/paths.ts`)

Project directories in `~/.claude/projects/` use encoded names where `/` becomes `-` (e.g., `-Users-me-project` → `/Users/me/project`). The `decodeProjectPath`/`encodeProjectPath` functions handle this.

### UI components (`source/components/`)

Two-pane layout: sidebar (session list grouped by project with virtual scrolling) and detail pane (conversation messages with virtual scrolling). The `Layout` component orchestrates both panes plus `SearchBar` and `StatusBar`. Navigation is vim-style (j/k/g/G/h/l, Tab, Enter, /, Esc, q).
