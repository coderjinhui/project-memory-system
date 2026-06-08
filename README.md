# Project Memory System

[中文文档](README_zh.md)

An [Agent Skill](https://github.com/vercel-labs/skills) that creates a layered memory structure for your projects, enabling AI to efficiently understand and maintain project context.

Supports Claude Code, Cursor, Codex, OpenCode, and [37 more agents](https://github.com/vercel-labs/skills#supported-agents).

## What It Does

When you start working on a project, this skill automatically:

1. **Detects** whether the project has a memory structure
2. **Identifies** the project type (Monorepo, Monolith, Library, Microservices)
3. **Creates** a layered memory system:
   - agent config file — Project preferences + memory index
   - `memory.md` — Layered storage of architecture, modules, and cross-module protocols
   - `technology.md` — Reusable tech index to avoid reinventing the wheel
4. **Recursively decides** which directories are complex enough to need their own `memory.md`

## Why

Without structured memory, AI assistants lose context between sessions. You end up re-explaining the same architecture, tech stack, and conventions every time. This skill solves that by creating persistent, structured documentation that AI reads automatically.

## Install

```bash
npx skills add coderjinhui/project-memory-system
```

## How It Works

### Command-Style Prompts

```text
/project-memory-system:init
/project-memory-system:update <file-or-module>
/project-memory-system:update all
```

These are prompt texts recognized by the skill. Installing the skill does not guarantee that the host CLI will register them as autocomplete slash commands. In Codex, use `/use project-memory-system` first if you want to force-load the skill, then type one of these prompts; natural-language requests work too.

- `init`: initialize the layered project memory, only when the project has no memory system yet
- `update <file-or-module>`: update the nearest relevant `memory.md` for a changed path, then update parent indexes if needed
- `update all`: audit and update all project memory files

### Memory Hierarchy

```
agent config file (entry index)
    ↓
memory.md (layered memory)
    ↓
technology.md (reusable tech index)
```

Different agents use different entry files:

| Agent | Config file |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex / OpenCode | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/project-memory.mdc` |

The skill does not create `CLAUDE.md` by default. It updates the config file for the current agent or the user-specified target agent; `memory.md` and `technology.md` stay agent-neutral and can be shared by multiple agents.

`memory.md` is not a fixed three-level template. The skill starts at the project root and recursively evaluates project roots, module directories, complex business subdirectories, and deeper directories when the code complexity justifies local memory.

### Adapts to Project Structure

| Project Type | Root memory.md Focus | Sub-modules |
|---|---|---|
| Monorepo | Cross-package protocols | Per-package memory.md + technology.md |
| Monolith | Architecture + module index | Per-module memory.md as needed |
| Library/SDK | Public API + design principles | Core module memory as needed |
| Microservices | Service topology + inter-service protocols | Per-service memory.md + technology.md |

### Smart Placement Rules

The skill decides where `memory.md` files are needed based on:

- **Needs memory**: Directories with heterogeneous content, high understanding cost, architectural decisions
- **Skips**: Homogeneous containers (`migrations/`), auto-generated dirs (`dist/`), self-documenting directories

Each memory file stores only the current layer plus indexes to the next layer. It does not duplicate child implementation details, so agents can load project context one branch at a time instead of reading the full project memory.

### Query Scripts

To reduce token usage, the skill includes Node.js scripts that locate memory files precisely:

`--root` is required and must explicitly point to the target project root.

```bash
node scripts/list-memory.js --root /path/to/project
node scripts/list-memory.js workflow --root /path/to/project
node scripts/find-memory.js src/workflow/nodes --root /path/to/project
node scripts/get-memory.js src/workflow/memory.md --root /path/to/project
```

- `list-memory.js`: list all `memory.md` files or filter by keyword
- `find-memory.js`: return the memory chain from root to the nearest layer for a module/file path
- `get-memory.js`: read one exact memory file; if a query is ambiguous, it returns candidates only

### Built-in Maintenance

- Capacity limits per file type (root: 150 lines, sub-module: 120 lines, technology: 100 lines)
- Accuracy verification — validates paths, dependencies, and links
- Update strategy — knows when and what to update after code changes

## Triggers

The skill activates when:

- A project has no memory structure (proactive detection)
- You say "initialize memory", "set up memory structure", or similar
- You type `/project-memory-system:init`
- You type `/project-memory-system:update [file/module/all]`
- You ask to update memory or add module documentation
- You start a new project

## License

[MIT](LICENSE)
