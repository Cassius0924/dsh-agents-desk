# CONTEXT — 共享语言(术语表)

> 本文件只定义「我们说的词是什么意思」和「已核实的宿主事实」，不写实现细节、不作为 spec。
> 决策记录见 `docs/adr/`。宿主版本基线：DSH **0.2.1-rc.2**（2026-10-20）。

## 术语

- **指令文件（instruction file）**：DSH 会自动读进上下文的 Markdown 文件。目前只有 `AGENTS.md` / `CLAUDE.md` 及其 `.local` 覆盖层。
- **作用域（scope）**：一个指令文件所在的逻辑层。本设计里分 `user-global`（`$DSH_HOME`）、`agents-global`（`$DSH_AGENTS_HOME`，默认 `~/.agents`）、项目目录（`.`、`src/`…）。
- **指令链 / 生效链（instruction chain）**：一次会话按优先级叠加后的全部指令文件，宽泛的在前、具体的在后。
- **基线（baseline）**：`user-global` + `agents-global` + 项目根到 cwd 的祖先链，在会话开始时整体渲染成一条消息。
- **动态指令（dynamic instructions）**：子目录 `AGENTS.md`，在工具触碰（read/write/edit）到该路径后增量注入。
- **候选（candidate）**：同一目录下按顺序尝试的文件名。项目层 = `AGENTS.md` → `CLAUDE.md` → `AGENTS.local.md` → `CLAUDE.local.md`；全局层只有 `AGENTS.md`。
- **覆盖层（local overlay）**：`AGENTS.local.md` / `CLAUDE.local.md`，同目录、后加载、内容不重复时与基础文件一起生效。
- **渲染预算（render budget）**：全部指令合计 `maxBytes = 65536`；单文件源上限 `maxSourceBytes = 1 MiB`，超过整份忽略（不是截断）。
- **版本令牌（version token）**：宿主 `fs` 服务的不透明版本，用于「打开后磁盘被改过」的冲突检测（`replaceIfVersion` → `FS_STALE_VERSION`）。
- **片段（snippet）**：可复用的 Markdown 规则块，存放在插件自己的目录，不直接参与注入。
- **编译区（compiled region）**：由片段生成、写进某个指令文件的一段带标记文本；标记外的手写内容不动。
- **控制台（desk）**：本插件形态——不是单个文本框，而是「作用域树 + 生效链 + 变更历史 + 组合」四件事。

## 已核实事实（读 0.2.1-rc.2 源码）

- 加载顺序：`user-global` → `agents-global` → 项目根 → … → cwd（`ancestorChain`）；项目根由向上找 `.git` 决定（`projectRootMarkers` 可配）。
- 两个用户全局根各自只有一个文件名 `AGENTS.md`；内容去重按 trimmed digest，`$DSH_HOME` 优先。`instructionFileCandidates` 只作用于项目层。
- 预算：preset（standard/ptc/cordis）显式 `maxBytes: 65536`；`maxSourceBytes` 默认 1 MiB。
- 生效时机：宿主**不监听**文件；每个 step 的 reconcile 会按 fs 版本重新探测基线作用域，版本变了就发增量更新。工具触碰只影响子目录作用域。（「下一步即生效」待实测确认，见 research 文档。）
- 写入接口：`ctx.fs.writeText(target, content, intent, signal, sandboxPolicy)`；`replaceIfVersion` 提供乐观并发；`danger-full-access` 可绕过会话沙箱（插件自担权限判断）。
- UI 接入：客户端 `settings.section` 槽位（`@deepseek-ai/dsh-client-ui-settings`）+ `MarkdownText` 预览原语（`@deepseek-ai/dsh-client-ui-primitives`）。
- 宿主自身没有「指令管理」UI；也没有监听/通知指令文件变化的接口。

## 待实测（研究阶段不写死结论）

- 改 `$DSH_HOME/AGENTS.md` 后，既有会话在**下一条消息**是否真的收到增量更新（源码暗示会；需一次真实会话验证）。
- 64 KiB 预算下多文件的省略/截断顺序（哪些文件优先被裁）。
- 经 nginx 反代时 `fs` 版本令牌与 loopback 判定是否与直连一致。

## 已决事项（2026-10-22，详见 `docs/adr/`）

- **形态**：编辑全作用域 + 生效链 + 历史；不做片段/多文件（ADR-0001）。
- **边界**：只编辑宿主真正加载的指令文件，不做 system-prompt 注入（ADR-0001）。
- **写入**：服务端白名单 + `replaceIfVersion` 409 + 原子 `.bak` + loopback/同源/JSON/1 MiB（ADR-0002）。
- **生成**：v1 设置页按钮，插件采集仓库事实 + 一次模型调用；已存在文件出「改进提案」diff，逐块接受；v1.1 再评估 `/init`（ADR-0003）。
- **生效链**：静态计算为主 + 当前会话实况 best effort；只说宿主真实行为，不假装「已生效」（ADR-0004）。
- **历史**：扫 `.bak-*` + 轻索引，diff 与回滚；回滚本身可撤销（ADR-0005）。
- **发布**：`dsh-agents-desk`，MIT，开源 + npm，zh/en，目标宿主 0.2.1-rc.2，启动自检（ADR-0006）。
- **命名**：工作名即正式名 `dsh-agents-desk`；GitHub `Cassius0924/dsh-agents-desk`。

## 实施状态（2026-10-22）

- v1 已在本机 web profile 跑通：作用域树（两个全局根 + 项目链 + 子目录扫描）、编辑器、版本冲突 409、原子备份、历史列表/diff/回滚、静态生效链（去重/1 MiB/64 KiB）、生成草稿与逐块提案、zh/en。
- 验收方式：`node --test`（作用域/去重/预算/白名单/diff）；host 路由用 cookie 直调；设置页用 `dsh-ui-probe.mjs` 的 `DSH_PROBE_SETTINGS` 模式实测。
- 未做（v1.1）：当前会话已注入 digest 的实况对比（`sessionPersistence` 句柄读取）、`/init` 命令、npm 发布。

