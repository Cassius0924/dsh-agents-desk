# AGENTS.md 插件调研（2026-10-22，宿主 0.2.1-rc.2）

目标：做一个比现有插件更强的「AGENTS.md 控制台」。本文只记录**可核实的事实**与**职责边界**，不写实现。

## 1. 现有插件：谁做了什么

| 插件 | 机制 | 功能 | 缺口 |
|---|---|---|---|
| `badai147/dsh-global-rules` 0.2.2（13★，npm，10/17） | `connection.fetch.register` + settings 槽位 | 全局 `$DSH_HOME/AGENTS.md` 的 textarea、保存、zh/en、401 提示 | 只有全局；无预览/历史/冲突/预算；项目层不可见 |
| `@gxx-labs/edit-agents-md-dsh` 0.2.4（npm，10/19） | `fs.writeText` + 自建 loopback 路由 | 全局编辑器、Markdown 预览、版本冲突 409、自动备份、预算、`立即刷新`（真实 read 触发 touch）、loopback+同源+JSON+4MiB 限制 | 只有全局；刷新依赖活跃 agent 与沙箱放行；无项目层/历史/组合 |
| `Ytibu/dsh-agents-md` 1.0.0（GitHub only，1★，自述只测 0.2.0-rc.2） | `connection.fetch.register` 5 条路由 | 全局 + 项目根编辑、工作区列表、模型列表、生成项目规则（LLM 合并全局 / 直接覆盖）、预览后写入、`.bak-时间戳` | 未适配 0.2.1 的验证；无子目录/共享根；无历史/回滚/组合 |
| `kingzhz/dsh-global-rules`（GitHub） | **system-prompt section 注入**（order 100） | `$DSH_HOME/rules/*.md` 多文件、GUI 增删改、`.disabled` 开关、front matter 优先级、预算显示；下一步生效 | 不是编辑 AGENTS.md，而是另开一套注入；与官方指令链的权威层级/预算互不知情 |
| `ciskonc/dsh-context-imports` | `agent/pre-step` 注入 | 展开 AGENTS.md 里的 `@path` 引用（递归、去重、深度 3、64KB/文件、128KB 总量）、压缩后重注、六语言设置卡 | 不做编辑；与「编辑」正交 |
| `Zhenyu98/dsh-context-doctor` 0.7.2 | 只读审计 + 工具 | 指令链/技能目录/工具 schema/MCP 的 token 估算、重复段落、技能遮蔽、`context_audit` 工具 | 只读、不做编辑，也不保存历史 |
| `dsh-init-command` | slash command + 两段模型调用 | `/init` 生成项目 AGENTS.md | 一次性生成，不管理 |
| `dsh-claude-move` | 迁移向导 | 从 Claude Code / Codex / Hermes 等迁入 instructions | 独立职责，不做日常编辑 |

## 2. 宿主能力边界（决定哪些功能现实）

能做：
- 任意读/写指令文件（`ctx.fs`，带版本令牌与原子性），目录可枚举、可 stat。
- 加设置页 section（React + `MarkdownText` 预览原语）。
- 每个 step 前钩子、工具结果钩子、session 事件订阅（可读「模型实际看到的指令消息」）。
- 注册工具与 slash command（`ctx.tools` / `ctx.commands`）。
- 通过 `ctx.systemPrompt.section` 往系统提示注入（但这是**另一种权威层级**，见决策题）。

难/不能：
- 不能给宿主自己的指令加载器加「监听/立即刷新」；只能靠宿主每 step 的版本比对（源码如此，需实测确认时延）。
- 不能扩展全局层的候选文件名（`instructionFileCandidates` 只作用于项目层；全局写死 `AGENTS.md`）。
- 不能在 AGENTS.md 里做真正的 `include`（官方明确不做；`@path` 需另一个插件展开）。
- 不能安全地把任意路径写进指令文件——写入必须白名单，否则等于把任意文件写暴露给浏览器半边。
- 不能绕过 64 KiB 渲染预算与 1 MiB 单文件上限。

## 3. 覆盖结论（对上述仓库）

| 对象 | 结论 | 说明 |
|---|---|---|
| badai147 | **完全覆盖** | 作用域树里的全局节点就是它的全部功能 |
| gxx | **完全覆盖** | 预览、冲突、备份、预算、写入安全都进 v1；刷新改为「下一个请求生效」的**真实状态展示**（不假装成功） |
| Ytibu | **完全覆盖** | 项目根编辑 + 生成（合并/覆盖）+ 预览后写入 = 本插件 L4 |
| kingzhz 多文件 | **功能可覆盖，机制不照搬** | 用「片段库 + 编译区」得到多文件管理/开关/顺序，但唯一真实来源仍是 AGENTS.md；不建议再开一套 system-prompt 注入 |
| context-imports | **不覆盖（职责外）** | 只做检测与提示；`@path` 展开交给它 |
| context-doctor | **部分覆盖** | 只覆盖「指令链」的 token/重复检测；技能/工具/MCP 审计不做 |
| init-command / claude-move | **生成覆盖 / 迁移不做** | 生成并入 L4；迁移是另一件事 |

## 4. 候选功能清单（按层）

### L1 编辑（核心，必须有）
1. 作用域树：`$DSH_HOME/AGENTS.md`、`$DSH_AGENTS_HOME/AGENTS.md`、项目根 `AGENTS.md`/`CLAUDE.md`、`.local` 覆盖层、子目录 `AGENTS.md`；存在性/大小/是否被预算忽略。
2. 编辑器 + Markdown 预览 + 未保存标记。
3. 安全写入：白名单路径、版本令牌 409、原子备份、1 MiB 上限、loopback+同源。
4. 新建/删除/重命名；工作区选择器。
5. 外部修改检测（保存时冲突 + 「磁盘已变」提示）。

### L2 解释（差异化，强烈建议）
6. 生效链视图：按当前 cwd 算出真正会加载的文件、顺序、去重结果、预算占用/截断。
7. 会话实况：当前会话已注入的版本 vs 磁盘版本 →「本会话看到的是旧版 / 下一条消息生效 / 需新会话」。
8. token 估算（粗估 + 标注方法），按文件与合计。
9. 冲突/重复检测：跨文件相同段落、互相矛盾的短句（启发式，标注为提示而非裁决）。
10. 忽略原因解释：>1 MiB、非 UTF-8、候选被同内容去重、预算裁掉。

### L3 变更管理（防丢，建议）
11. 保存历史：扫描 `.bak-*` + 插件索引，列表/时间/大小。
12. diff（与上一版/与另一作用域）与一键回滚。
13. 导出/下载、导入（粘贴或文件）。

### L4 组合与生成（「强大」的来源）
14. 片段库：命名片段、插入到任意指令文件；仅本地存储，不参与注入。
15. 编译区：片段 → 写进目标文件的 `<!-- BEGIN/END -->` 区块，标记外不动；保存时检测漂移。
16. 模板生成项目规则：扫描仓库（语言/包管理器/测试命令/目录）产出草稿，预览后写入。
17. LLM 合并：把全局规则与项目要点语义融合（显式点击、可选模型、预览后写）。
18. `/init` slash command 复用同一生成逻辑。

### L5 Agent 面向（可选）
19. 工具 `agents_md`（list/read/write），让 agent 自己维护规则；默认只读或需审批。
20. 导出「当前生效指令」为单个 Markdown（喂给别的 harness）。

### 明确不做
- 技能目录 / 工具 schema / MCP 的上下文审计（context-doctor 职责）。
- 子 agent 定义（`dingyi222666/dsh-agents-md` 职责）。
- 会话/记忆迁移（claude-move 职责）。
- 云同步、多人协作、权限体系。
- 默认往系统提示注入规则（改变权威层级，见 ADR）。

## 5. 风险

- **宿主契约**：`connection.fetch.register` / `fs.writeText` / `settings.section` 都可能换代；需要 feature-detect + 启动自检，不能锁死版本。
- **写入权限**：`danger-full-access` 写全局文件是必要的，但必须把「谁能调这个路由」限制到本机 + 同源 + JSON，且路径来自服务端白名单而非请求体。
- **预算误导**：UI 显示的「生效」必须和宿主真实渲染一致（去重、1 MiB 忽略、64 KiB 截断），否则比没有更糟。
- **刷新承诺**：不能把「文件写成功」说成「当前会话已生效」；要展示真实状态（下一步/新会话）。
- **发布成本**：npm 发布意味着 i18n、兼容矩阵、CI、issue 模板；自用则只需 web profile。

## 6. 建议切分

- **MVP（能用）**：L1 全量 + L2 的 6/7/8 + L3 的 11/12。
- **v1（强大）**：+ L4 的 14/15/16/17 + L2 的 9/10。
- **v2（生态）**：+ L5、导入导出、模板市场（若真需要）。
