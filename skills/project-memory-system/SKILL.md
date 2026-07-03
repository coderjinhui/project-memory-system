---
name: project-memory-system
description: Create and maintain a layered memory structure for projects (memory.md + technology.md). Trigger when users type command-style prompts like /project-memory-system:init or /project-memory-system:update [file/module/all], when a project has no memory system, when users say "set up memory structure", "initialize project memory", or when they ask to update memory, add module memory, or organize project documentation.
---

# 分层记忆系统

为项目建立分层的知识管理体系，让 AI 能够高效理解和维护项目上下文。

## Agent 配置文件映射

不同 agent 使用不同的项目级配置文件，本文档中统一称为 **"agent 配置文件"**。请根据当前运行环境选择对应文件：

| Agent | 配置文件 |
|-------|----------|
| Claude Code | `CLAUDE.md` |
| Codex / OpenCode | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/*.mdc` |
| 其他 Agent | 该 agent 的项目级指令文件 |

> 下文中所有提到 **"agent 配置文件"** 的地方，请替换为上表中对应的实际文件名。

### 兼容策略

- **不要默认创建 `CLAUDE.md`**。只有当前运行环境是 Claude Code，或用户明确要求 Claude Code 支持时，才创建/更新 `CLAUDE.md`。
- **Codex / OpenCode 使用 `AGENTS.md`**。在这些环境下，把记忆入口、更新策略和技术复用提醒写入 `AGENTS.md`。
- **Gemini CLI 使用 `GEMINI.md`**。不要把 Gemini 项目的入口写进 `CLAUDE.md` 或 `AGENTS.md`，除非项目已经同时维护多 agent 配置。
- **Cursor 使用 `.cursor/rules/*.mdc`**。优先创建或更新 `.cursor/rules/project-memory.mdc`；如果已有合适的规则文件，则更新现有文件。
- **多 agent 项目**：如果项目已经同时存在多个 agent 配置文件，只更新当前 agent 对应文件；只有用户要求跨 agent 同步时，才同时更新多个配置文件。
- **未知 agent**：如果无法判断当前 agent 的项目级指令文件，先询问用户目标 agent，不要猜测文件名。
- **记忆文件保持 agent 中立**：`memory.md`、`technology.md` 和子层记忆文件不写某个 agent 的专属行为；agent 专属说明只放在对应 agent 配置文件中。

## 核心理念

```
agent 配置文件 (入口索引)
    ↓
memory.md (分层记忆)
    ↓
technology.md (技术复用索引)
```

- **agent 配置文件**: 项目偏好 + 记忆入口索引
- **memory.md**: 分层存储架构、功能、模块信息
- **technology.md**: 记录可复用技术，避免重复造轮子

## 指令式调用入口

本 skill 定义两个面向用户的指令式提示。它们是给 agent 识别并执行的文本入口，不保证会被宿主 CLI 自动注册为可补全的 slash command。用户使用这些文本入口时，优先按 `commands/` 目录中的流程执行；不要临时发明另一套初始化或更新流程。

> 在 Codex 中，skill 安装不会自动创建自定义 slash command；用户可以通过 `/use project-memory-system` 显式加载 skill，然后输入下面的指令式提示，或直接用自然语言表达同样意图。

| Command | 说明 | 流程文件 |
|---------|------|----------|
| `/project-memory-system:init` | 初始化项目分层记忆 | `commands/init.md` |
| `/project-memory-system:update [文件/模块/all]` | 更新局部或全部项目记忆 | `commands/update.md` |

### 指令路由

- 用户输入 `/project-memory-system:init`：读取并执行 `commands/init.md`。
- 用户输入 `/project-memory-system:update <文件或模块>`：读取并执行 `commands/update.md` 的“局部更新流程”。
- 用户输入 `/project-memory-system:update all`：读取并执行 `commands/update.md` 的“全量更新流程”。
- 用户只说“初始化项目记忆”“建立记忆结构”：等同 `/project-memory-system:init`。
- 用户只说“更新记忆”“同步这个模块的 memory”：等同 `/project-memory-system:update <用户提到的路径或模块>`；如果没有路径或模块，先问一个简短问题确认范围。

### 写入项目的指令说明

初始化或更新 agent 配置文件时，加入以下指令说明，帮助后续 agent 使用同一套入口：

```markdown
## 项目记忆指令式提示

- 输入 `/project-memory-system:init`：初始化项目分层记忆。仅在项目还没有记忆体系时使用。
- 输入 `/project-memory-system:update <文件或模块>`：根据变更路径更新最贴近的 `memory.md`，必要时更新父级索引。
- 输入 `/project-memory-system:update all`：全量审计并更新所有项目记忆。

这些是 agent 识别的提示文本，不要求宿主 CLI 提供同名 slash command。

执行前优先使用 skill 查询脚本定位记忆文档：
- `node <skill-dir>/scripts/list-memory.js --root <project-root>`
- `node <skill-dir>/scripts/find-memory.js <文件或模块> --root <project-root>`
- `node <skill-dir>/scripts/get-memory.js <memory路径或模块> --root <project-root>`
```

## 查询脚本优先

为避免 AI 通过反复遍历目录或读取大量文档来猜测记忆位置，读取或更新已有记忆前，优先使用本 skill 自带的 Node.js 查询脚本。脚本只返回精确路径或目标文件内容，减少 token 浪费。

> 下方命令中的 `<skill-dir>` 是本 skill 所在目录；`<project-root>` 是目标项目根目录。`--root <project-root>` 必须显式传入，不要依赖当前工作目录，避免全局安装的 skill 扫描到项目之外的记忆文件。

### 列出记忆文档

```bash
node <skill-dir>/scripts/list-memory.js --root <project-root>
node <skill-dir>/scripts/list-memory.js workflow --root <project-root>
```

用途：
- 列出项目中所有 `memory.md`
- 按模块名、目录名、标题过滤记忆文档
- 在回答“有哪些记忆文档”或“某模块有没有记忆”时使用

### 查找某路径对应的记忆链

```bash
node <skill-dir>/scripts/find-memory.js src/workflow/nodes/conditions --root <project-root>
node <skill-dir>/scripts/find-memory.js src/auth/policies/rbac.ts --root <project-root>
```

用途：
- 找到某个模块/文件从根到最近层级的 `memory.md` 链
- 在修改代码前确定应该读取哪些层级的记忆
- 在更新记忆时确定最贴近变更的目标 `memory.md`

### 读取单个记忆文档

```bash
node <skill-dir>/scripts/get-memory.js src/workflow --root <project-root>
node <skill-dir>/scripts/get-memory.js src/workflow/memory.md --root <project-root>
```

用途：
- 精确读取某个 `memory.md`
- 如果查询匹配多个文件，脚本会提示候选项，避免误读大量文档

### 使用规则

1. **已有记忆体系时**：先运行 `list-memory.js` 或 `find-memory.js`，再读取精确文件。
2. **针对某模块开发时**：先用 `find-memory.js <模块路径>` 获取记忆链，只读取链上的相关文件。
3. **更新记忆时**：先用 `find-memory.js <变更路径>` 找到最近层级，优先更新最近的 `memory.md`，必要时再更新父级索引。
4. **初始化新项目时**：如果 `list-memory.js` 找不到任何 `memory.md`，再进入递归建树流程。
5. **脚本不可用时**：才回退到手动目录扫描和文件查找。

## 工作流程

### 1. 检测是否需要记忆体系

检查项目根目录是否存在以下文件：
- agent 配置文件中是否有记忆索引
- 根目录是否有 `memory.md`

优先运行：

```bash
node <skill-dir>/scripts/list-memory.js --root <project-root>
```

如果没有，主动提议："检测到项目还没有建立记忆体系，是否需要我帮你初始化？"

### 2. 识别项目结构类型

不同项目结构的记忆体系布局不同。先识别类型，再决定 memory.md 的分布。

#### 项目结构类型与记忆布局

**类型 A：Monorepo（多包/前后端分离）**

典型特征：`packages/`、`apps/`、多个 `package.json` / `pyproject.toml`

```
<agent 配置文件>
memory.md                    # 跨模块协议、整体架构
packages/web/memory.md       # 前端模块
packages/web/technology.md
packages/server/memory.md    # 后端模块
packages/server/technology.md
docs/memory.md               # 设计文档索引（可选）
```

**类型 B：单体应用（单一语言/框架）**

典型特征：单个 `src/` 目录，一个入口

```
<agent 配置文件>
memory.md                    # 项目架构 + 模块索引
technology.md                # 技术栈（与 memory.md 同级）
src/modules/auth/memory.md   # 复杂子模块（按需）
```

> 单体应用中 technology.md 放在根目录即可，不需要按包拆分。

**类型 C：Library / SDK**

典型特征：对外发布、有 API surface、多版本

```
<agent 配置文件>
memory.md                    # 公共 API 索引、设计原则
technology.md                # 构建工具、测试框架
src/core/memory.md           # 核心模块（按需）
```

> Library 的 memory.md 重点记录公共 API 和设计约束，而非内部实现。

**类型 D：微服务**

典型特征：多个独立部署的服务

```
<agent 配置文件>
memory.md                    # 服务拓扑、跨服务协议
services/user/memory.md      # 各服务独立记忆
services/user/technology.md
services/order/memory.md
services/order/technology.md
```

> 微服务的根 memory.md 重点记录服务间通信协议（gRPC、消息队列等）。

**识别方法**：扫描根目录的配置文件和目录结构，匹配上述特征。如果不确定，询问用户确认。

### 3. 递归分析目录结构

扫描项目目录，生成一棵按需展开的 memory tree。层级数量不固定：从项目根目录开始，对每个目录递归判断是否需要建立 `memory.md`，直到子目录不再具备独立记忆价值为止。

#### 递归建树算法

对每个目录执行以下流程：

1. **只观察当前层**：分析当前目录的直接子目录、直接关键文件、配置文件和入口文件。不要把孙层细节提前写入当前层。
2. **判断当前目录是否需要 memory.md**：根据复杂度信号决定，并记录一句理由。
3. **如果需要 memory.md**：当前层只记录当前层的职责、直接子项索引、关键入口、当前层协议/约定，以及下一层 `memory.md` 链接。
4. **继续下钻直接子目录**：对每个直接子目录重复本流程。只要子目录本身足够复杂，就可以继续创建更深层的 `memory.md`。
5. **停止条件**：如果目录同质化、自动生成、命名已自解释、没有独立设计约定、没有复杂调用/业务边界，或继续拆分不会降低理解成本，则停止下钻。
6. **父子隔离**：父层不得记录子层内部实现细节；孙层信息只能出现在孙层 `memory.md`。父层最多保留下一层索引和一句职责说明。

> 不要假设只有三层。三层只是示例，真实项目中应根据复杂度递归到合适深度。

#### 判断规则：需要 memory.md 的目录

| 特征 | 需要 | 不需要 |
|------|------|--------|
| 内容性质 | 异质化（子项有不同功能/职责） | 同质化（子项遵循相同模式） |
| 理解成本 | 需要导航地图才能理解 | 命名即文档，自解释 |
| 架构价值 | 有设计决策、技术选型、协作约定 | 只是文件存放位置 |
| 修改风险 | 修改前需要理解调用链、状态流、协议或业务边界 | 局部文件可直接阅读和修改 |
| 复用价值 | 有可复用入口、约定、工具或抽象 | 没有独立复用价值 |

#### 复杂度信号

满足以下任意多项时，倾向于创建 `memory.md`：

- 直接子目录职责不同，不能用统一模式解释
- 存在多个入口、协议、状态流、数据模型或扩展点
- 代码跨文件协作明显，修改前需要理解调用关系
- 包含核心业务规则、框架适配层、插件系统、工作流、权限、调度、缓存、持久化等复杂领域
- 目录内存在独立开发约定、测试策略、迁移约定或部署约定
- 当前层 `memory.md` 如果继续展开会接近容量上限，需要把细节下沉到子层

**需要 memory.md 的典型目录**：
- 功能模块目录：`workflow/`, `auth/`, `llm/`
- 包含异质化子模块：`workflow/nodes/`（不同 node 不同功能）
- 有架构设计的目录：`api/`, `models/`, `components/`

**不需要 memory.md 的典型目录**：
- 同质化容器：`migrations/`, `versions/`, `providers/`
- 纯实现细节：`__pycache__/`, `node_modules/`, `.git/`
- 自动生成目录：`dist/`, `build/`, `.next/`

#### Memory tree 提案格式

在创建文件前，先给出目录决策表并让用户确认：

```markdown
| 层级 | 目录 | 是否创建 memory.md | 判断理由 | 父级索引位置 |
|------|------|--------------------|----------|--------------|
| 0 | `/` | 是 | 项目入口，需要总览和一级索引 | agent 配置文件 |
| 1 | `src/workflow/` | 是 | 工作流有多个职责不同的子模块 | `memory.md` |
| 2 | `src/workflow/nodes/` | 是 | 节点类型异质化，需要二级导航 | `src/workflow/memory.md` |
| 3 | `src/workflow/nodes/conditions/` | 按需 | 条件节点规则复杂时创建 | `src/workflow/nodes/memory.md` |
| 2 | `src/workflow/tests/` | 否 | 测试目录同质化，命名自解释 | - |
```

### 4. 创建记忆文件

#### 4.1 根目录 memory.md

```markdown
# 项目名称

## 项目概述

简述项目目标和核心功能。

## 架构总览

描述整体架构，如 monorepo 结构、前后端分离等。

## 子模块索引

| 直接子模块 | 记忆文件 | 技术索引 | 本层说明 |
|------------|----------|----------|----------|
| 前端 | [packages/web/memory.md](packages/web/memory.md) | [technology.md](packages/web/technology.md) | Web 应用入口 |
| 后端 | [packages/server/memory.md](packages/server/memory.md) | [technology.md](packages/server/technology.md) | API 服务入口 |

## 跨模块协议

记录模块间的通信协议、共享约定等。

## 环境变量

列出项目需要的环境变量。
```

#### 4.2 子模块 memory.md

```markdown
# 模块名称

## 模块职责

简述此模块的核心职责。

## 当前层索引

| 目录/文件 | 说明 |
|-----------|------|
| `index.ts` | 模块入口 |
| `runtime/` | 当前层运行时实现 |

> 只列出当前目录的直接子项。不要列出命名自解释、同质化或无导航价值的目录。

## 子模块索引

| 子模块 | 记忆文件 | 说明 |
|--------|----------|------|
| nodes | [nodes/memory.md](nodes/memory.md) | 节点系统入口 |

## 关键文件

列出入口文件、配置文件等关键文件路径。

## 开发指南

此模块特有的开发注意事项。
```

#### 4.3 technology.md

放在前端/后端等主要模块目录下，记录可复用技术：

```markdown
# 技术栈索引

开发前请先查阅此文件，优先复用已有技术方案。

## UI 组件库

| 组件 | 库 | 版本 | 使用示例 |
|------|-----|------|----------|
| 按钮、表单 | shadcn/ui | latest | `components/ui/` |
| 拖拽 | dnd-kit | ^6.0 | `components/kanban.tsx` |

## 工具函数

| 功能 | 位置 | 依赖 | 说明 |
|------|------|------|------|
| 日期格式化 | `lib/date.ts` | date-fns ^3.0 | 统一日期处理 |

## 状态管理

描述状态管理方案和使用方式。

## API 调用

描述 API 调用的封装和使用方式。
```

> **版本记录规则**：记录主版本号或语义化范围（如 `^6.0`），不记录精确补丁版本。精确版本以 lock 文件为准。

### 5. 更新 agent 配置文件

在 agent 配置文件中添加记忆入口索引：

```markdown
## 项目记忆入口

项目详细信息按模块分层存储在各目录的 `memory.md` 中：

| 记忆文件 | 技术索引 | 内容 |
|----------|----------|------|
| [memory.md](memory.md) | - | 项目整体架构、跨模块协议 |
| [packages/web/memory.md](packages/web/memory.md) | [technology.md](packages/web/technology.md) | 前端架构 |
| [packages/server/memory.md](packages/server/memory.md) | [technology.md](packages/server/technology.md) | 后端架构 |

**开发前请先阅读相关模块的 memory.md 了解上下文，查阅 technology.md 确认可复用技术。**
```

### 6. 添加记忆更新策略

在 agent 配置文件中添加更新策略：

```markdown
## 记忆更新策略

完成功能开发后，需要同步更新对应层级的记忆文件。

### 更新原则

| 变更类型 | 更新文件 | 示例 |
|----------|----------|------|
| 前端组件/页面 | `packages/web/memory.md` | 新增组件、修改路由 |
| 后端 API/模块 | `packages/server/memory.md` | 新增端点、修改逻辑 |
| 跨模块协议 | `memory.md` (根目录) | WebSocket 协议、新增环境变量 |
| 新增技术方案 | 对应的 `technology.md` | 引入新库、封装新工具 |

### 更新时机

1. **功能完成后**: 新增/修改功能时，更新对应模块的 memory.md
2. **引入新技术**: 在 technology.md 添加索引
3. **架构变更**: 涉及多模块时，从底层向上逐层更新

### 注意事项

- 只更新受影响的记忆文件，不要全量更新
- 保持记忆文件简洁，使用表格格式便于快速查阅
- 删除功能时，同步移除相关记忆条目
```

### 7. 添加技术复用提醒

在 agent 配置文件中添加：

```markdown
## 技术复用优先

在编写代码前，**必须**先检查是否有可复用的技术方案：

1. 查阅对应模块的 `technology.md`
2. 搜索现有代码中是否有类似实现
3. 优先复用 > 扩展现有 > 新建实现

引入新技术后，及时更新 `technology.md`。
```

## 执行检查清单

初始化记忆体系时，执行 `/project-memory-system:init`，详细流程见 `commands/init.md`。摘要顺序如下：

- [ ] 询问用户项目的语言偏好（中文/英文）
- [ ] 识别项目结构类型（Monorepo / 单体应用 / Library / 微服务）
- [ ] 从根目录开始递归扫描，生成 memory tree 提案
- [ ] 对每个候选目录写明是否创建 `memory.md` 及判断理由
- [ ] 与用户确认 memory tree，不要默认固定层数
- [ ] **深入阅读关键文件**（入口文件、配置文件、核心模块代码），确保记忆内容准确
- [ ] 创建根目录 memory.md
- [ ] 按确认后的 memory tree 创建各层 memory.md
- [ ] 创建 technology.md（主要模块）
- [ ] 更新 agent 配置文件添加索引和策略
- [ ] 检查父子层边界：父层只保留当前层信息和下一层索引，不重复子层细节
- [ ] **验证记忆准确性**：对 memory.md 中记录的路径和模块描述进行文件搜索抽查
- [ ] 向用户展示创建的文件结构

更新记忆体系时，执行 `/project-memory-system:update [文件/模块/all]`，详细流程见 `commands/update.md`。不要用初始化流程处理更新请求。

## 维护指南

### 何时更新记忆

| 场景 | 动作 |
|------|------|
| 新增功能模块 | 创建对应 memory.md，更新父级索引 |
| 修改现有模块 | 更新最贴近变更目录的 memory.md；必要时向上更新父级索引 |
| 引入新技术/库 | 更新 technology.md |
| 删除模块 | 删除 memory.md，更新父级索引 |
| 跨模块变更 | 先更新受影响子层，再更新共同父层或根目录协议 |

### 记忆文件原则

1. **简洁优先**: 使用表格，避免冗长描述
2. **索引导向**: 记录"在哪里"和"为什么重要"，避免展开"怎么实现"
3. **及时更新**: 功能完成后立即更新
4. **分层隔离**: 只记录本层信息和下一层索引，子层信息由子层记忆负责
5. **按需递归**: 层级深度由代码复杂度决定，不由模板层数决定

### 记忆反模式（不该记什么）

以下内容**不应**出现在记忆文件中：

| 反模式 | 说明 | 正确做法 |
|--------|------|----------|
| 实现细节 | 函数内部逻辑、算法步骤、具体业务规则 | 看代码。记忆只记"在哪里"和"做什么"，不记"怎么做" |
| 临时调试信息 | "XX 接口有 bug"、"待优化"、TODO 备忘 | 用 issue tracker 管理，不污染记忆文件 |
| 会话摘要 | "本次对话完成了 XX 功能" | 记忆是项目状态的快照，不是变更日志 |
| 显而易见的事实 | "`tests/` 目录存放测试文件" | 命名自解释的条目不需要记录 |
| 大段代码示例 | 超过 5 行的代码块 | 记录文件路径，让读者直接看源码 |
| 主观评价 | "这个模块写得很好/很烂" | 只记录客观事实和技术决策 |
| 重复信息 | 子模块已记录的内容在父级重复 | 遵循分层隔离，父级只放索引链接 |

### 容量控制

记忆文件会随项目迭代膨胀，必须主动控制体积。

#### 硬性约束

| 文件类型 | 行数上限 | 超限处理 |
|----------|----------|----------|
| 根 memory.md | 150 行 | 将详细内容下沉到子模块 memory.md |
| 子模块 memory.md | 120 行 | 精简描述，或拆分出更细粒度的子 memory.md |
| technology.md | 100 行 | 按类别拆分（如 `technology-ui.md`、`technology-infra.md`） |
| agent 配置文件中的记忆相关部分 | 50 行 | 只保留索引表，策略细节移到根 memory.md |

#### 精简策略

当接近行数上限时：

1. **合并同类项**：多个相似条目合并为一行，用逗号分隔
2. **删除显而易见的条目**：如果目录名已经自解释（如 `tests/`），不需要在表格中列出
3. **归档历史决策**：已废弃但有参考价值的内容移到 `docs/` 目录
4. **移除已删除功能的条目**：代码中已删除的模块，记忆中也应同步清除

#### 定期审计

建议在以下时机触发审计：

- 会话开始时，如果 memory.md 超过上限的 80%，提示用户精简
- 大规模重构后，主动检查记忆文件是否仍然准确

### 准确性验证

记忆的价值取决于准确性。错误的记忆比没有记忆更有害。

#### 创建时验证

创建或更新 memory.md 时，**必须**对以下内容进行验证：

| 验证项 | 验证方法 | 说明 |
|--------|----------|------|
| 文件路径 | 搜索确认文件存在 | memory.md 中引用的每个路径都必须真实存在 |
| 模块职责描述 | 阅读关键文件的代码 | 不能仅凭目录名推测功能，要读代码确认 |
| 技术栈版本 | 阅读 package.json / pyproject.toml | technology.md 中记录的库必须在依赖列表中 |
| 子模块索引链接 | 搜索确认目标 memory.md 存在 | 避免出现死链接 |

#### 更新时验证

每次更新记忆文件时，额外检查：

1. **受影响的关联条目**：如果修改了模块 A，检查引用了模块 A 的其他 memory.md 是否需要同步更新
2. **路径一致性**：如果重命名了目录或文件，搜索所有 memory.md 中的旧路径并替换

#### 一致性抽查

在会话开始读取 memory.md 时，快速抽查 2-3 个路径是否仍然有效。如果发现失效路径，在执行主要任务前先修复记忆。

```
抽查流程：
1. 从 memory.md 中随机选取 2-3 个文件路径
2. 搜索确认路径存在
3. 如有失效 → 修复记忆 → 继续主要任务
4. 全部有效 → 直接继续
```
