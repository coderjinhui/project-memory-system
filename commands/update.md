# /project-memory-system:update

更新项目分层记忆。

> 这是 skill 识别的指令式提示，不保证安装 skill 后会出现在宿主 CLI 的 slash command 列表中。Codex 中可先使用 `/use project-memory-system` 加载 skill，再输入该提示。

## 触发方式

```text
/project-memory-system:update [文件/模块/all]
```

也适用于用户表达“更新记忆”“这个模块需要更新 memory 吗”“同步项目记忆”等同义请求。

## 参数

| 参数 | 含义 |
|------|------|
| `<文件>` | 根据文件路径定位最近的记忆链，例如 `src/workflow/nodes/rule.ts` |
| `<模块>` | 根据模块目录定位最近的记忆链，例如 `src/workflow/nodes` |
| `all` | 全量审计所有 `memory.md` 和 `technology.md`，用于大重构或项目记忆失真时 |

如果用户没有提供参数，先询问要更新的文件、模块或是否执行 `all`。

## 局部更新流程

适用于：

```text
/project-memory-system:update src/workflow/nodes/rule.ts
/project-memory-system:update src/workflow
```

1. **定位记忆链**

   ```bash
   node <skill-dir>/scripts/find-memory.js <文件或模块> --root <project-root>
   ```

2. **只读取链上相关记忆**
   - 根 `memory.md`
   - 目标模块路径上的父级 `memory.md`
   - 最近层级的 `memory.md`

3. **判断更新目标**
   - 代码职责、入口、约定变化：更新最近层级 `memory.md`
   - 新增复杂子模块：创建子层 `memory.md`，更新父级索引
   - 跨模块协议变化：先更新子层，再更新共同父层或根 `memory.md`
   - 新技术或可复用工具变化：更新对应 `technology.md`

4. **保持分层隔离**
   - 父层只写当前层信息和下一层索引
   - 不把子层实现细节写入父层
   - 不写函数内部逻辑、会话摘要、临时 TODO

5. **验证**
   - 引用路径存在
   - 新增/删除模块与父级索引一致
   - 如果重命名路径，搜索所有 `memory.md` 并同步旧路径

## 全量更新流程

适用于：

```text
/project-memory-system:update all
```

1. **列出所有记忆文件**

   ```bash
   node <skill-dir>/scripts/list-memory.js --root <project-root>
   ```

2. **逐个审计**
   - 路径是否存在
   - 子模块索引是否仍有效
   - 父层是否重复了子层细节
   - 是否超过容量上限

3. **重新判断 memory tree**
   - 新增复杂目录时创建新的 `memory.md`
   - 目录变简单或被删除时移除对应索引
   - 需要下沉的内容移动到更贴近的子层

4. **更新 agent 配置文件**
   - 保持入口索引准确
   - 保留 command 指令说明
   - 不把 agent 专属规则写入 `memory.md`

5. **输出审计摘要**

   ```markdown
   ## 记忆更新完成

   更新：
   - `.../memory.md`

   新增：
   - `.../memory.md`

   移除/修正：
   - `...`

   未处理风险：
   - 无 / 列出需要用户确认的项
   ```
