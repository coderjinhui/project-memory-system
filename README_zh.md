# Project Memory System

[English](README.md)

一个 [Agent Skill](https://github.com/vercel-labs/skills)，为项目建立分层记忆结构，让 AI 能够高效理解和维护项目上下文。

支持 Claude Code、Cursor、Codex、OpenCode 等 [40+ 个 AI 编程助手](https://github.com/vercel-labs/skills#supported-agents)。

## 它做什么

当你开始处理一个项目时，这个 skill 会自动：

1. **检测** 项目是否已有记忆体系
2. **识别** 项目类型（Monorepo / 单体应用 / Library / 微服务）
3. **创建** 分层记忆系统：
   - agent 配置文件 — 项目偏好 + 记忆入口索引
   - `memory.md` — 分层存储架构、功能、模块信息
   - `technology.md` — 记录可复用技术，避免重复造轮子
4. **递归判断** 哪些目录复杂到需要自己的 `memory.md`

## 为什么需要

没有结构化记忆，AI 助手在每次对话中都会丢失上下文。你不得不反复解释相同的架构、技术栈和开发约定。这个 skill 通过创建持久化的结构化文档来解决这个问题，AI 会自动读取这些文档。

## 安装

```bash
npx skills add coderjinhui/project-memory-system
```

## 工作原理

### 指令式提示

```text
/project-memory-system:init
/project-memory-system:update <文件或模块>
/project-memory-system:update all
```

这些是 skill 识别的提示文本，不保证安装后会自动出现在宿主 CLI 的 slash command 列表中。Codex 中可以先用 `/use project-memory-system` 加载 skill，再输入这些提示；也可以直接用自然语言说“初始化项目记忆”或“更新某模块记忆”。

- `init`：初始化项目分层记忆，仅在项目还没有记忆体系时使用
- `update <文件或模块>`：根据变更路径更新最贴近的 `memory.md`，必要时更新父级索引
- `update all`：全量审计并更新所有项目记忆

### 记忆层级

```
agent 配置文件 (入口索引)
    ↓
memory.md (分层记忆)
    ↓
technology.md (技术复用索引)
```

不同 agent 使用不同入口文件：

| Agent | 配置文件 |
|---|---|
| Claude Code | `CLAUDE.md` |
| Codex / OpenCode | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/project-memory.mdc` |

skill 不会默认创建 `CLAUDE.md`。它会根据当前 agent 或用户指定的目标 agent 更新对应配置文件；`memory.md` 和 `technology.md` 保持 agent 中立，可被多个 agent 共享。

`memory.md` 不是固定三层模板。skill 会从项目根目录开始递归判断：项目根目录、模块目录、模块内复杂业务目录，甚至更深层目录，只要理解成本足够高，都可以拥有自己的 `memory.md`。

### 适配不同项目结构

| 项目类型 | 根 memory.md 重点 | 子模块 |
|---|---|---|
| Monorepo | 跨包协议 | 每个包独立 memory.md + technology.md |
| 单体应用 | 架构 + 模块索引 | 按需为复杂模块创建 memory.md |
| Library/SDK | 公共 API + 设计原则 | 核心模块按需创建 |
| 微服务 | 服务拓扑 + 跨服务协议 | 每个服务独立 memory.md + technology.md |

### 智能放置规则

skill 根据以下标准判断哪些目录需要 `memory.md`：

- **需要记忆**: 内容异质化、理解成本高、有架构设计决策的目录
- **跳过**: 同质化容器（`migrations/`）、自动生成目录（`dist/`）、命名自解释的目录

每一层 memory 只保存当前层信息和下一层索引，不重复子层实现细节。这样 AI 可以按树结构逐层加载上下文，而不是一次性读取整个项目记忆。

### 查询脚本

为了减少 token 消耗，skill 提供 Node.js 脚本来精确定位记忆文档：

`--root` 是必填参数，必须显式指定目标项目根目录。

```bash
node scripts/list-memory.js --root /path/to/project
node scripts/list-memory.js workflow --root /path/to/project
node scripts/find-memory.js src/workflow/nodes --root /path/to/project
node scripts/get-memory.js src/workflow/memory.md --root /path/to/project
```

- `list-memory.js`：列出全部或按关键字过滤 `memory.md`
- `find-memory.js`：根据模块/文件路径返回从根到最近层级的记忆链
- `get-memory.js`：读取单个精确记忆文档，匹配多个时只给候选项

### 内置维护机制

- 容量控制（根目录: 150 行，子模块: 120 行，technology: 100 行）
- 准确性验证 — 校验路径、依赖和链接
- 更新策略 — 知道代码变更后何时更新、更新什么

## 触发条件

以下场景会激活此 skill：

- 项目没有记忆体系（主动检测）
- 用户说"建立记忆结构"、"初始化项目记忆"等
- 用户输入 `/project-memory-system:init`
- 用户输入 `/project-memory-system:update [文件/模块/all]`
- 用户要求更新记忆或添加模块文档
- 开始一个新项目

## 许可证

[MIT](LICENSE)
