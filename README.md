# Claude Conversation Explorer

A terminal UI for browsing and searching your [Claude Code](https://claude.ai/code) conversation history. Navigate sessions across all your projects, search by keyword, and read full conversation transcripts — all without leaving your terminal.

![Terminal UI](https://img.shields.io/badge/interface-terminal-brightgreen) ![TypeScript](https://img.shields.io/badge/language-TypeScript-blue) ![License](https://img.shields.io/badge/license-MIT-yellow)

## Features

- **Browse all sessions** across every project Claude Code has been used in
- **Search** by project name, prompt content, summary, branch name, or path
- **Read full conversations** with user prompts, assistant responses, and tool usage
- **Vim-style navigation** — `j`/`k` to move, `Enter` to select, `/` to search, `Tab` to switch panes
- **Project grouping** — sessions are organized by project with the most recent at the top
- **Filter by project** — pass `--project` to scope to a single project path

## How It Works

Claude Conversation Explorer reads directly from the local Claude Code data stored in `~/.claude/`. It pulls from two sources:

1. **Project session files** — `~/.claude/projects/<project>/sessions-index.json` and individual `.jsonl` session logs
2. **Global history** — `~/.claude/history.jsonl`, where entries without a session ID are grouped into synthetic sessions using 2-hour time gaps

Everything is read-only. Claude Conversation Explorer never writes to or modifies your Claude Code data.

## Requirements

- **Node.js** >= 18
- **Claude Code** must have been used at least once (so `~/.claude/` exists with session data)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/octonary/claude-conversation-explorer.git
cd claude-conversation-explorer

# Install dependencies
npm install

# Run
npm start
```

## Usage

```
$ claude-conversation-explorer

Options
  --project, -p  Filter to a specific project path
  --search, -s   Initial search query

Examples
  $ claude-conversation-explorer
  $ claude-conversation-explorer --project /Users/me/my-project
  $ claude-conversation-explorer --search "auth bug"
```

### Keyboard Controls

| Key | Action |
|---|---|
| `j` / `k` or `↓` / `↑` | Navigate up/down |
| `Enter` | Open selected session |
| `Tab` | Switch between sidebar and detail pane |
| `h` / `l` | Switch to sidebar / detail pane |
| `g` / `G` | Jump to top / bottom |
| `/` | Open search |
| `Esc` | Close search or return to sidebar |
| `q` | Quit |

## Development

### Setup

```bash
git clone https://github.com/octonary/claude-conversation-explorer.git
cd claude-conversation-explorer
npm install
```

### Running in Dev Mode

```bash
npm run dev
```

This uses `tsx watch` to re-run the app whenever source files change.

### Type Checking

```bash
npx tsc --noEmit
```

There is no separate build step for development — `tsx` executes TypeScript directly.

### Project Structure

```
source/
├── cli.tsx                  # Entry point — CLI flag parsing, renders <App>
├── app.tsx                  # Root component — state management (useReducer), keyboard input
├── components/
│   ├── Layout.tsx           # Two-pane layout orchestration
│   ├── SessionList.tsx      # Sidebar session list with project grouping and virtual scroll
│   ├── SessionListItem.tsx  # Individual session row in the sidebar
│   ├── ConversationView.tsx # Detail pane — conversation messages with virtual scroll
│   ├── MessageBubble.tsx    # Single message (user or assistant) with tool use display
│   ├── SearchBar.tsx        # Search input using @inkjs/ui TextInput
│   └── StatusBar.tsx        # Bottom bar with keybinding hints and session count
├── data/
│   ├── types.ts             # All TypeScript interfaces
│   ├── loader.ts            # Merges project + history data sources, deduplicates
│   ├── project-scanner.ts   # Reads ~/.claude/projects/ session metadata
│   ├── history-parser.ts    # Parses ~/.claude/history.jsonl into grouped sessions
│   └── session-parser.ts    # Streams a .jsonl session file into full conversation detail
├── hooks/
│   ├── useClaudeData.ts     # Async loader hook for session list
│   ├── useSessionDetail.ts  # Async loader hook for a single conversation
│   └── useSearch.ts         # Client-side multi-term search filter
└── utils/
    ├── paths.ts             # ~/.claude/ path helpers and project path encoding/decoding
    └── format.ts            # Date and string formatting utilities
```

### Tech Stack

- **[Ink](https://github.com/vadimdemedes/ink)** — React renderer for the terminal (v5)
- **[React](https://react.dev)** — UI component model (v18)
- **[@inkjs/ui](https://github.com/vadimdemedes/ink-ui)** — Text input components for Ink
- **[meow](https://github.com/sindresorhus/meow)** — CLI argument parsing
- **[tsx](https://github.com/privatenumber/tsx)** — TypeScript execution without a build step
- **TypeScript** with ESM modules (`"type": "module"`)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.