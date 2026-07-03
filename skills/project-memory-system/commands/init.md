# /project-memory-system:init

初始化项目分层记忆系统。

> 这是 skill 识别的指令式提示，不保证安装 skill 后会出现在宿主 CLI 的 slash command 列表中。Codex 中可先使用 `/use project-memory-system` 加载 skill，再输入该提示。

## 触发方式

```text
/project-memory-system:init
```

也适用于用户表达“初始化项目记忆”“建立记忆结构”“set up memory structure”等同义请求。

## 参数

可选参数由用户自然语言指定即可，不要求严格 CLI 解析：

| 参数 | 含义 |
|------|------|
| `--agent <name>` | 指定目标 agent，如 `codex`、`opencode`、`claude`、`gemini`、`cursor` |
| `--language <zh|en>` | 指定记忆文档语言 |
| `--yes` | 用户已同意按提案创建文件 |

## 执行流程

1. **确定 agent 配置文件**
   - Claude Code: `CLAUDE.md`
   - Codex / OpenCode: `AGENTS.md`
   - Gemini CLI: `GEMINI.md`
   - Cursor: `.cursor/rules/project-memory.mdc`
   - 未知 agent: 先询问用户目标配置文件，不要猜测。

2. **检测已有记忆**

   ```bash
   node <skill-dir>/scripts/list-memory.js --root <project-root>
   ```

   如果已有 `memory.md`，不要重复初始化；改为说明已存在，并建议使用 `/project-memory-system:update [文件/模块/all]`。

3. **识别项目类型**
   - Monorepo
   - 单体应用
   - Library / SDK
   - 微服务

4. **递归生成 memory tree 提案**

   只分析当前层直接子项，按复杂度递归下钻。输出：

   ```markdown
   | 层级 | 目录 | 是否创建 memory.md | 判断理由 | 父级索引位置 |
   |------|------|--------------------|----------|--------------|
   ```

   不要默认固定三层。是否继续下钻由目录复杂度决定。

5. **读取关键文件验证职责**
   - 配置文件：`package.json`、`pyproject.toml`、`Cargo.toml`、`go.mod` 等
   - 入口文件：框架入口、服务入口、库导出入口
   - 核心模块：memory tree 提案中需要创建记忆的目录

6. **创建记忆文件**
   - 根 `memory.md`
   - 确认后的各层子 `memory.md`
   - 需要技术复用索引的 `technology.md`

7. **更新 agent 配置文件**

   写入以下内容：
   - 项目记忆入口索引
   - `/project-memory-system:init` 和 `/project-memory-system:update` 指令说明
   - 记忆读取规则：开发前用查询脚本定位，只读相关记忆链
   - 记忆更新规则：更新最贴近变更目录的 `memory.md`

8. **验证**
   - 所有链接路径真实存在
   - 父层只保存当前层信息和下一层索引
   - 子层细节没有被重复写入父层
   - `technology.md` 中的依赖来自真实配置文件

## 输出格式

初始化完成后，输出：

```markdown
## 初始化完成

已创建/更新：
- `memory.md`
- `.../memory.md`
- `technology.md`
- `<agent 配置文件>`

后续使用：
- `/project-memory-system:update <文件或模块>` 更新局部记忆
- `/project-memory-system:update all` 全量审计并更新记忆
```
