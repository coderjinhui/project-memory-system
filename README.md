# Project Memory System

[中文文档](README_zh.md)

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill that creates a layered memory structure for your projects, enabling AI to efficiently understand and maintain project context.

## What It Does

When you start working on a project, this skill automatically:

1. **Detects** whether the project has a memory structure
2. **Identifies** the project type (Monorepo, Monolith, Library, Microservices)
3. **Creates** a layered memory system:
   - `CLAUDE.md` — Project preferences + memory index
   - `memory.md` — Layered storage of architecture, modules, and cross-module protocols
   - `technology.md` — Reusable tech index to avoid reinventing the wheel

## Why

Without structured memory, AI assistants lose context between sessions. You end up re-explaining the same architecture, tech stack, and conventions every time. This skill solves that by creating persistent, structured documentation that AI reads automatically.

## Install

```bash
claude install-skill https://github.com/coderjinhui/project-memory-system
```

## How It Works

### Memory Hierarchy

```
CLAUDE.md (entry index)
    ↓
memory.md (layered memory)
    ↓
technology.md (reusable tech index)
```

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

### Built-in Maintenance

- Capacity limits per file type (root: 150 lines, sub-module: 120 lines, technology: 100 lines)
- Accuracy verification — validates paths, dependencies, and links
- Update strategy — knows when and what to update after code changes

## Triggers

The skill activates when:

- A project has no memory structure (proactive detection)
- You say "initialize memory", "set up memory structure", or similar
- You ask to update memory or add module documentation
- You start a new project

## License

[MIT](LICENSE)
