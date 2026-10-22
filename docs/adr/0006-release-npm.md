# ADR-0006 发布形态：开源 + npm，名字 `dsh-agents-desk`

- 状态：已决（2026-10-22）

## 背景

用户明确要开源并发布 npm。DSH 生态仍处 developer preview，宿主 API 会破坏性换代；发布意味着要承担兼容矩阵、文档与 issue 成本。

## 决策

1. 包名 **`dsh-agents-desk`**（npm 未占用，2026-10-22 查）；GitHub 仓库 `Cassius0924/dsh-agents-desk`；许可证 MIT。
2. 目标宿主：**0.2.1-rc.2**（本机实测基线）。不承诺向后兼容旧 rc；在 `package.json` 的 `dsh.compat` 与 README 写明测试版本。
3. 兼容策略：对 `connection.fetch.register`、`fs.writeText`、`settings.section` 做启动自检（fail loud，进设置页显示「不兼容」而不是静默坏掉）。
4. i18n：zh + en 两份（跟随宿主语言设置）；文案集中在一个字典，不散落在组件里。
5. CI：GitHub Actions 跑 `typecheck` + `build` + 单测（含服务端路由的权限/冲突用例）。npm 发布用 GitHub Release + trusted publishing；首发手动，跑通后再自动化。
6. 仓库结构：`src/`（host + client）→ `lib/`（构建产物，gitignore）；`cordis.patch.yml`（bundle 挂载）；`dist/client.js`（客户端 bundle）。参考已有插件的 `dsh.bundle.patch` + `dsh.client` 双声明。

## 后果

- 好处：生态里目前没有「全作用域 + 生效链 + 历史」的插件，定位清晰；npm 安装是 DSH 的主流路径。
- 代价：每个宿主 rc 都可能要跟一次；i18n、兼容自检、CI 都是额外工作；发布后 issue 要维护。
- 风险：若上游将来自己做「指令管理」UI，本插件的编辑部分会被覆盖；差异化的「生效链/历史/生成」仍有价值。

## 备选方案

- **只自用（link 装）**：最省事，但用户已明确要开源发布。不再考虑。
- **scoped 包名**：`@cassius/dsh-agents-desk` 可避免抢名，但生态里同类插件都用无 scope 名（`dsh-context`、`dsh-global-rules`）。选择无 scope，先占名。
