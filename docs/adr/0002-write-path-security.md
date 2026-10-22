# ADR-0002 写入路径与安全边界

- 状态：已决（2026-10-22）
- 相关：ADR-0001

## 背景

插件的浏览器半边要能改 `~/.dsh/AGENTS.md` 这类**工作区之外**的文件。宿主提供 `ctx.fs.writeText(target, content, expected, signal, sandboxPolicy)`：

- `expected: { kind: 'replaceIfVersion', version }` 提供乐观并发（过期报 `FS_STALE_VERSION`）；
- 原子性由 fs 服务保证；
- `sandboxPolicy: { mode: 'danger-full-access' }` 可绕过会话沙箱（保存不应依赖当前会话权限模式）。

同时，dsh 实例经 nginx 暴露在 `dsh.cassdev.com`，写入端点必须有独立的信任边界，不能只靠宿主 cookie。

## 决策

1. **路径白名单在服务端生成**：每次请求都重新规划候选（`$DSH_HOME`、`$DSH_AGENTS_HOME`、当前工作区根及其祖先/子目录的候选名），只接受解析后落在白名单内的路径；不信任请求体里的路径。
2. **写入走 `ctx.fs`**，带 `replaceIfVersion`；保存前读一次拿版本令牌，冲突返回 409 并附磁盘当前内容，不覆盖。
3. **端点边界**：只接受 loopback 来源（nginx 反代后 `remoteAddress` 是 127.0.0.1）；Host 必须是回环字面量或宿主 `webServer` 公布的 host（`dsh.cassdev.com`）；写请求必须是 `application/json` 且 `Origin` 与 Host 同源；请求体上限 1 MiB（与 `maxSourceBytes` 对齐）。
4. **每次写入先备份**为目标同目录 `AGENTS.md.bak-<时间戳>`，备份名用 `COPYFILE_EXCL` 占位防并发碰撞。
5. 前端只显示服务端返回的候选与错误码，不自己拼路径。

## 后果

- 好处：即使浏览器会话被 CSRF/DNS-rebinding 利用，也无法写任意文件；冲突检测与备份把「改坏规则」变成可恢复事件。
- 代价：多一层路由与校验代码；`danger-full-access` 写入是插件自担的风险，必须在 README 明说「只在本机/可信反代后使用」。
- 已知限制：宿主若换代 `fs` 接口，需 feature-detect 并给出明确降级提示（不能静默失败）。

## 备选方案

- 直接 `node:fs`：没有版本令牌与原子性，且绕过宿主沙箱语义。拒绝。
- 依赖会话权限模式：用户在 `read-only` 会话里打开设置页就保存失败，体验不可接受。拒绝。
