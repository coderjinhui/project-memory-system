# Project Memory System

[English](README.md)

一个 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) Skill，为项目建立分层记忆结构，让 AI 能够高效理解和维护项目上下文。

## 它做什么

当你开始处理一个项目时，这个 skill 会自动：

1. **检测** 项目是否已有记忆体系
2. **识别** 项目类型（Monorepo / 单体应用 / Library / 微服务）
3. **创建** 分层记忆系统：
   - `CLAUDE.md` — 项目偏好 + 记忆入口索引
   - `memory.md` — 分层存储架构、功能、模块信息
   - `technology.md` — 记录可复用技术，避免重复造轮子

## 为什么需要

没有结构化记忆，AI 助手在每次对话中都会丢失上下文。你不得不反复解释相同的架构、技术栈和开发约定。这个 skill 通过创建持久化的结构化文档来解决这个问题，AI 会自动读取这些文档。

## 安装

```bash
claude install-skill https://github.com/coderjinhui/project-memory-system
```

## 工作原理

### 记忆层级

```
CLAUDE.md (入口索引)
    ↓
memory.md (分层记忆)
    ↓
technology.md (技术复用索引)
```

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

### 内置维护机制

- 容量控制（根目录: 150 行，子模块: 120 行，technology: 100 行）
- 准确性验证 — 校验路径、依赖和链接
- 更新策略 — 知道代码变更后何时更新、更新什么

## 触发条件

以下场景会激活此 skill：

- 项目没有记忆体系（主动检测）
- 用户说"建立记忆结构"、"初始化项目记忆"等
- 用户要求更新记忆或添加模块文档
- 开始一个新项目

## 许可证

[MIT](LICENSE)
