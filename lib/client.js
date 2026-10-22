// dsh-agents-desk client bundle: settings section for editing instruction files.
// Hand-written __ModuleLoader__ factory (no build step). Only `react` is required
// from the host module table; all chrome is React elements styled with the
// scoped OpenDesign styles, with host theme variables for light/dark surfaces.
window.__ModuleLoader__.load({
  id: 'dsh-agents-desk',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const react = require('react')
    const h = react.createElement
    const { useState, useEffect, useCallback, useMemo, useRef } = react

    const NS = 'agents-desk'
    // Document-relative: the Web UI may be mounted under a path prefix, and a
    // leading slash would escape it.
    const API = 'api/agents-desk'
    const inject = ['slots', 'locale']

    // Mirrors the host's static recompute defaults; used only to label the
    // budget panel when the chain response omits `assumptions` (older host).
    const DEFAULT_MAX_BYTES = 65536
    const DEFAULT_MAX_SOURCE_BYTES = 1048576
    const DEFAULT_CANDIDATES = ['AGENTS.md', 'CLAUDE.md', 'AGENTS.local.md', 'CLAUDE.local.md']

    const DICTS = {
      zh: {
        designIntro: "为 Agent 定义规则，让协作有章可循。",
        editorTab: "编辑器",
        views: "指令管理视图",
        files: "个文件",
        filterFiles: "筛选文件",
        filterPlaceholder: "输入文件名或路径",
        filePath: "文件路径",
        globalDescription: "作用于所有项目的通用规则",
        projectDescription: "作用于当前项目及其子目录",
        nestedDescription: "工具触碰目录后按需加载",
        synced: "已与磁盘版本同步",
        lines: "行",
        allSaved: "所有更改已保存",
        versionProtection: "磁盘版本保护",
        whenLoaded: "这些指令何时被读取？",
        loadingExplanation: "DSH 按全局、项目根到当前目录的顺序读取指令。保存后的真实加载情况由宿主决定，可在生效链查看默认规则下的静态复算。",
        hostStorage: "更改保存到宿主指令文件",
        hostControlsLoading: "实际加载由 DSH 决定",
        repository: "项目仓库",
        help: "使用说明",
        helpContent: "先选工作区，再选择全局、项目或子目录指令。草稿仅在编辑器中提出修改，保存才写入宿主。全局草稿不采集项目事实。生效链为默认规则下的静态复算，不代表当前会话实况。保存和回滚使用磁盘版本校验，覆盖成功后保留可撤销备份。",
        staticRecompute: "静态复算",
        chainLimitations: "复算依据与限制",
        historyExplanation: "每次覆盖写入成功后，尽可能备份原内容。历史独立按文件记录，回滚本身也可撤销。",
        backHistory: "返回历史",
        backEditor: "返回编辑",
        label: '指令文件',
        intro: '编辑 DSH 真正加载的指令文件，并查看生效链与历史。',
        workspace: '工作区',
        noWorkspace: '没有可用工作区，请先在 DSH 中打开一个目录',
        loadingWorkspaces: '正在读取工作区…',
        loading: '加载中…',
        refresh: '刷新',
        retry: '重试',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        savedNoBackup: '已保存，但备份失败：',
        unsaved: '未保存',
        dirtyHint: '有未保存的修改',
        shortcutSave: '保存快捷键',
        discard: '放弃修改',
        reload: '重新读取',
        confirmDiscardTitle: '有未保存的修改',
        confirmSwitchFile: '切换文件会丢失当前编辑。是否放弃修改并切换？',
        confirmSwitchWorkspace: '切换工作区会丢失当前编辑。是否放弃修改并切换？',
        confirmReload: '重新读取会丢弃当前编辑。是否继续？',
        confirmRollback: '回滚会用备份内容覆盖当前文件，并丢弃编辑器中的修改。是否继续？',
        confirmApplyStale: '生成之后编辑器内容已改变。应用整份草稿会覆盖当前编辑，是否继续？',
        discardAndContinue: '放弃修改并继续',
        cancel: '取消',
        close: '关闭',
        generate: '生成草稿',
        generating: '生成中…',
        generateNeedsClean: '请先保存或放弃修改，再生成草稿（草稿基于磁盘内容）',
        generateHint: '基于仓库事实与磁盘上的当前内容生成草稿',
        generateGlobal: '生成全局草稿',
        generateGlobalHint: '对所有项目生效。仅整理已有全局规则；空文件生成待填写的 TODO 模板。不使用当前工作区的项目事实。',
        applySelected: '应用选中',
        applyDraft: '应用整份草稿',
        applied: '已合并选中的修改，保存后写入',
        draftReady: '草稿已载入编辑器，确认后保存',
        regenerate: '重新生成',
        discardProposal: '放弃草稿',
        genFacts: '依据的事实',
        genModel: '模型',
        genHunks: '修改项',
        genNoSelection: '至少选择一个修改项',
        genStaleHunks: '编辑器内容已在生成后改变，无法按原偏移应用修改。请重新生成或放弃草稿。',
        genStaleDraft: '编辑器内容已在生成后改变；整份草稿仍可覆盖应用。',
        genStaleBlocked: '已阻止应用：编辑器内容与生成基线不一致',
        editor: '编辑',
        preview: '预览',
        previewEmpty: '预览区为空',
        empty: '选择一个指令文件',
        emptyHint: '左侧列表会显示全局、项目根与子目录中的指令文件。',
        noScopes: '未发现指令文件',
        selectFile: '选择文件',
        notExist: '不存在（保存时创建）',
        fileMissing: '文件不存在，输入内容并保存即可创建',
        groupGlobal: '全局',
        groupProject: '项目',
        groupSubdir: '子目录',
        chainTitle: '生效链',
        chainIntro: '按 DSH 加载规则静态复算的基线注入。',
        chainLoading: '正在计算生效链…',
        chainEmpty: '还没有生效链数据',
        chainRefresh: '刷新生效链',
        chainAssumptions: '静态复算自 DSH 默认加载规则：',
        assumptionRenderBudget: '渲染预算',
        assumptionSourceCap: '单文件上限',
        assumptionCandidates: '候选名',
        assumptionCaveat: '若会话预设改写了这些规则，实际注入可能不同。',
        assumptionSourceDefaults: '默认规则',
        assumptionSourceCustom: '自定义规则',
        chainScanned: '计算于',
        chainDirs: '已扫描目录',
        chainBaseline: '基线（计入预算）',
        chainDynamic: '动态（工具触碰目录后注入）',
        chainDynamicEmpty: '没有子目录指令文件',
        chainTokensNote: 'token 为粗估（字节/4）',
        budget: '预算',
        budgetUsed: '已用',
        budgetRemaining: '剩余',
        budgetMeter: '渲染预算使用率',
        included: '纳入',
        includedColumn: '纳入 / 原文',
        tokensColumn: 'tokens',
        statusColumn: '状态',
        fileColumn: '文件',
        statusLoaded: '已载入',
        statusDuplicate: '去重',
        statusIgnored: '忽略',
        statusTruncated: '截断',
        statusOmitted: '省略',
        statusAbsent: '不存在',
        statusUnreadable: '不可读',
        statusDynamic: '动态',
        reasonDuplicate: '同目录更早的候选内容相同，被宿主去重',
        reasonIgnored: '超过单文件上限，宿主整份忽略',
        reasonTruncated: '渲染预算只纳入前一部分',
        reasonOmitted: '渲染预算不足，未纳入',
        reasonAbsent: '文件不存在',
        reasonUnreadable: '读取失败（可能无权限、非 UTF-8 或读取期间被移动）',
        reasonDynamic: '工具触碰到该目录后按动态批次注入，未计入基线预算',
        reasonOther: '其他',
        historyTitle: '保存历史',
        historyLoading: '正在读取历史…',
        historyEmpty: '还没有备份',
        historyRefresh: '刷新历史',
        historySourceSave: '保存',
        historySourceRollback: '回滚',
        viewDiff: '查看差异',
        rollback: '回滚',
        rollingBack: '回滚中…',
        diffTitle: '与备份的差异',
        diffEmpty: '与当前内容没有差异',
        diffLoading: '正在计算差异…',
        rollbackDone: '已回滚到所选备份',
        rollbackDoneNoBackup: '已回滚，但备份失败：',
        loadFailed: '加载失败',
        saveFailed: '保存失败',
        generateFailed: '生成失败',
        backupLoadFailed: '历史读取失败',
        rollbackFailed: '回滚失败',
        diffLoadFailed: '差异读取失败',
        conflict: '磁盘上的文件已被修改，请重新读取',
        healthVersion: '版本',
        healthLlmUnavailable: '未检测到可用的模型服务，生成草稿不可用',
        errAborted: '请求已取消',
        errNetwork: '无法连接宿主',
        errUnknown: '未知错误',
        err_body_too_large: '请求体过大',
        err_body_invalid_json: '请求体不是合法的 JSON',
        err_request_missing_field: '缺少必填字段',
        err_request_invalid_cwd: '工作区路径无效',
        err_fs_unavailable: '宿主文件系统服务不可用',
        err_path_forbidden: '该路径不在允许的指令文件范围内',
        err_path_not_file: '目标不是普通文件',
        err_path_symlink: '目标是符号链接，拒绝写入',
        err_path_exists: '文件已存在，请先读取版本',
        err_path_absent: '文件不存在',
        err_version_missing: '覆盖写入缺少版本令牌',
        err_version_stale: '文件已被外部修改，请重新读取后再保存',
        err_backup_invalid: '备份路径不合法',
        err_backup_not_found: '备份不存在',
        err_content_too_large: '内容超过 1 MiB，DSH 不会加载它',
        err_llm_unavailable: '宿主未提供模型服务',
        err_llm_no_selection: '宿主未配置默认模型，无法生成草稿',
        err_llm_failed: '模型生成失败',
        err_fs_denied: '写入被宿主文件系统拒绝',
        err_internal_error: '宿主内部错误',
      },
      en: {
        designIntro: "Define rules for your agent. Keep collaboration clear.",
        editorTab: "Editor",
        views: "Instruction views",
        files: "files",
        filterFiles: "Filter files",
        filterPlaceholder: "Search by name or path",
        filePath: "File path",
        globalDescription: "Shared guidance across all projects",
        projectDescription: "Applies to this project and its subdirectories",
        nestedDescription: "Loaded when a tool touches this directory",
        synced: "Synced with the on-disk version",
        lines: "lines",
        allSaved: "All changes saved",
        versionProtection: "On-disk version protection",
        whenLoaded: "When are these instructions read?",
        loadingExplanation: "DSH reads global rules, then the project-root-to-cwd chain. The host determines actual loading after a save; the chain tab statically recomputes the default rules.",
        hostStorage: "Changes saved to host instruction files",
        hostControlsLoading: "DSH controls actual loading",
        repository: "Repository",
        help: "Help",
        helpContent: "Choose a workspace, then a global, project or nested instruction file. Model drafts propose edits; only Save writes them to the host. Global drafts do not scan project facts. The effective chain is a static default-rule recompute, not a live session report. Saves and rollbacks check the on-disk version and back up replaced content after a successful write when possible.",
        staticRecompute: "Static recompute",
        chainLimitations: "Recompute assumptions and limits",
        historyExplanation: "After an overwrite succeeds, the prior content is backed up when possible. History is isolated per file; rollbacks can also be undone.",
        backHistory: "Back to history",
        backEditor: "Back to editor",
        label: 'Instruction files',
        intro: 'Edit the instruction files DSH actually loads, and inspect the effective chain and history.',
        workspace: 'Workspace',
        noWorkspace: 'No workspace yet. Open a directory in DSH first.',
        loadingWorkspaces: 'Loading workspaces…',
        loading: 'Loading…',
        refresh: 'Refresh',
        retry: 'Retry',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        savedNoBackup: 'Saved, but the backup failed: ',
        unsaved: 'Unsaved',
        dirtyHint: 'You have unsaved changes',
        shortcutSave: 'Save shortcut',
        discard: 'Discard changes',
        reload: 'Reload',
        confirmDiscardTitle: 'You have unsaved changes',
        confirmSwitchFile: 'Switching files discards the current edit. Discard the changes and switch?',
        confirmSwitchWorkspace: 'Switching workspaces discards the current edit. Discard the changes and switch?',
        confirmReload: 'Reloading discards the current edit. Continue?',
        confirmRollback: 'Rolling back overwrites the file with the backup and discards editor changes. Continue?',
        confirmApplyStale: 'The editor changed after generation. Applying the whole draft overwrites the current edit. Continue?',
        discardAndContinue: 'Discard and continue',
        cancel: 'Cancel',
        close: 'Close',
        generate: 'Draft with model',
        generating: 'Generating…',
        generateNeedsClean: 'Save or discard the current edit before generating (the draft is based on disk content)',
        generateHint: 'Drafts from repository facts and the current on-disk content',
        generateGlobal: 'Draft global rules',
        generateGlobalHint: 'Applies across projects. Uses only existing global rules; an empty file gets a TODO template. No workspace facts are used.',
        applySelected: 'Apply selected',
        applyDraft: 'Apply whole draft',
        applied: 'Selected changes merged; save to write',
        draftReady: 'Draft loaded into the editor; review then save',
        regenerate: 'Regenerate',
        discardProposal: 'Discard proposal',
        genFacts: 'Facts used',
        genModel: 'Model',
        genHunks: 'Proposed edits',
        genNoSelection: 'Select at least one proposed edit',
        genStaleHunks: 'The editor changed after generation, so the original offsets cannot be applied. Regenerate or discard the proposal.',
        genStaleDraft: 'The editor changed after generation; the whole draft can still replace it.',
        genStaleBlocked: 'Apply blocked: the editor no longer matches the generation baseline',
        editor: 'Edit',
        preview: 'Preview',
        previewEmpty: 'Nothing to preview',
        empty: 'Select an instruction file',
        emptyHint: 'The list on the left shows instruction files from the user-global roots, the project root, and subdirectories.',
        noScopes: 'No instruction files found',
        selectFile: 'Select a file',
        notExist: 'Missing (created on save)',
        fileMissing: 'The file does not exist; type content and save to create it',
        groupGlobal: 'Global',
        groupProject: 'Project',
        groupSubdir: 'Subdirectories',
        chainTitle: 'Effective chain',
        chainIntro: 'Baseline injection recomputed statically from the DSH load rules.',
        chainLoading: 'Recomputing the effective chain…',
        chainEmpty: 'No effective-chain data yet',
        chainRefresh: 'Refresh effective chain',
        chainAssumptions: 'Static recompute from the DSH defaults: ',
        assumptionRenderBudget: 'render budget',
        assumptionSourceCap: 'per-file cap',
        assumptionCandidates: 'candidate names',
        assumptionCaveat: 'If a session preset overrides these rules, the actual injection may differ.',
        assumptionSourceDefaults: 'default rules',
        assumptionSourceCustom: 'custom rules',
        chainScanned: 'Computed at',
        chainDirs: 'Directories scanned',
        chainBaseline: 'Baseline (counted in the budget)',
        chainDynamic: 'Dynamic (injected after a tool touches the directory)',
        chainDynamicEmpty: 'No subdirectory instruction files',
        chainTokensNote: 'tokens are rough (bytes/4)',
        budget: 'Budget',
        budgetUsed: 'used',
        budgetRemaining: 'remaining',
        budgetMeter: 'Rendered budget usage',
        included: 'included',
        includedColumn: 'Included / source',
        tokensColumn: 'tokens',
        statusColumn: 'Status',
        fileColumn: 'File',
        statusLoaded: 'Loaded',
        statusDuplicate: 'Duplicate',
        statusIgnored: 'Ignored',
        statusTruncated: 'Truncated',
        statusOmitted: 'Omitted',
        statusAbsent: 'Absent',
        statusUnreadable: 'Unreadable',
        statusDynamic: 'Dynamic',
        reasonDuplicate: 'An earlier candidate in the same directory has the same content; the host deduplicated it',
        reasonIgnored: 'Exceeds the per-file cap, so the host ignores the whole file',
        reasonTruncated: 'The render budget only included the beginning of this file',
        reasonOmitted: 'Skipped because the render budget is exhausted',
        reasonAbsent: 'The file does not exist',
        reasonUnreadable: 'Read failed (no permission, not UTF-8, or moved during the read)',
        reasonDynamic: 'Injected as a dynamic batch after a tool touches this directory; not part of the baseline budget',
        reasonOther: 'Other',
        historyTitle: 'Save history',
        historyLoading: 'Loading history…',
        historyEmpty: 'No backups yet',
        historyRefresh: 'Refresh history',
        historySourceSave: 'save',
        historySourceRollback: 'rollback',
        viewDiff: 'View diff',
        rollback: 'Roll back',
        rollingBack: 'Rolling back…',
        diffTitle: 'Diff against backup',
        diffEmpty: 'No difference from the current content',
        diffLoading: 'Computing the diff…',
        rollbackDone: 'Rolled back to the selected backup',
        rollbackDoneNoBackup: 'Rolled back, but the backup failed: ',
        loadFailed: 'Failed to load',
        saveFailed: 'Save failed',
        generateFailed: 'Generation failed',
        backupLoadFailed: 'Failed to load history',
        rollbackFailed: 'Rollback failed',
        diffLoadFailed: 'Failed to load the diff',
        conflict: 'The file changed on disk. Reload before saving.',
        healthVersion: 'version',
        healthLlmUnavailable: 'No usable model service detected; draft generation is unavailable',
        errAborted: 'Request cancelled',
        errNetwork: 'Cannot reach the host',
        errUnknown: 'Unknown error',
        err_body_too_large: 'Request body too large',
        err_body_invalid_json: 'Request body is not valid JSON',
        err_request_missing_field: 'Missing required field',
        err_request_invalid_cwd: 'Invalid workspace path',
        err_fs_unavailable: 'Host file system service unavailable',
        err_path_forbidden: 'Path is outside the editable instruction files',
        err_path_not_file: 'Target is not a regular file',
        err_path_symlink: 'Target is a symlink; the write was refused',
        err_path_exists: 'File already exists; reload before saving',
        err_path_absent: 'File does not exist',
        err_version_missing: 'Overwrite is missing its version token',
        err_version_stale: 'File changed on disk; reload before saving',
        err_backup_invalid: 'Invalid backup path',
        err_backup_not_found: 'Backup not found',
        err_content_too_large: 'Content exceeds 1 MiB; DSH will not load it',
        err_llm_unavailable: 'The host does not provide a model service',
        err_llm_no_selection: 'No default model configured; cannot generate a draft',
        err_llm_failed: 'Model generation failed',
        err_fs_denied: 'The host file system denied the write',
        err_internal_error: 'Host internal error',
      },
    }

    // OpenDesign visual contract, scoped to this settings section.
    const CSS = `@layer agents-desk-layout{[data-agents-desk] :where(.od-stack,.od-row,.od-row-top,.od-cluster,.od-grid,.od-field,.od-stat,.od-cell,.od-tile)>:where(*){min-width:0}
[data-agents-desk] .od-stack{display:flex;flex-direction:column;gap:var(--od-gap,8px)}
[data-agents-desk] .od-row{display:flex;align-items:center;gap:var(--od-gap,8px)}
[data-agents-desk] .od-row-top{display:flex;align-items:flex-start;gap:var(--od-gap,8px)}
[data-agents-desk] .od-cluster{display:flex;flex-wrap:wrap;align-items:center;gap:var(--od-gap,8px)}
[data-agents-desk] .od-fill{flex:1 1 0;min-width:0}
[data-agents-desk] .od-fixed{flex:none}
[data-agents-desk] .od-grid{display:grid;gap:var(--od-gap,12px);grid-template-columns:repeat(var(--od-cols,3),minmax(0,1fr))}
[data-agents-desk] .od-stat,[data-agents-desk] .od-field,[data-agents-desk] .od-cell{display:grid;gap:var(--od-gap,2px)}
[data-agents-desk] :where(.od-stat,.od-field,.od-cell)>:where(*){display:block}
[data-agents-desk] .od-tile{display:grid;grid-template-rows:auto 1fr}
[data-agents-desk] :where(.od-tile)>:where(*){display:block}
[data-agents-desk] .od-media{display:block;width:100%;height:auto;aspect-ratio:var(--od-ratio,auto)}
[data-agents-desk] .od-media-cover{object-fit:cover}
[data-agents-desk] .od-truncate{display:block;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
[data-agents-desk] .od-clamp-2,[data-agents-desk] .od-clamp-3{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
[data-agents-desk] .od-clamp-2{-webkit-line-clamp:2}
[data-agents-desk] .od-clamp-3{-webkit-line-clamp:3}
[data-agents-desk] .od-lines-2{min-height:calc(2 * 1.4em)}
[data-agents-desk] .od-nowrap{white-space:nowrap}
[data-agents-desk] .od-keep{word-break:keep-all;overflow-wrap:anywhere}
[data-agents-desk] .od-screen{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100%}
[data-agents-desk] .od-scroll{overflow-y:auto;overscroll-behavior:contain;min-height:0}
[data-agents-desk] .od-rail{display:flex;gap:var(--od-gap,8px);overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding-inline:var(--od-rail-pad,16px);scroll-padding-inline:var(--od-rail-pad,16px)}
[data-agents-desk] .od-rail::-webkit-scrollbar{display:none}
[data-agents-desk] :where(.od-rail)>:where(*){flex:none;scroll-snap-align:start}
[data-agents-desk] :where(.od-rail)>:where(:last-child){margin-inline-end:var(--od-rail-pad,16px)}
[data-agents-desk] .od-spacer{flex:none;visibility:hidden;pointer-events:none}
[data-agents-desk] .od-touch{min-width:44px;min-height:44px}}
[data-agents-desk]{

      --bg:var(--dsw-alias-bg-base,#ffffff);--surface:var(--dsw-alias-bg-layer-2,#f7f8fa);--surface-warm:var(--surface);
      --fg:var(--dsw-alias-label-primary,#111111);--fg-2:var(--fg);--muted:var(--dsw-alias-label-secondary,#6b7280);--meta:var(--muted);
      --border:var(--dsw-alias-border-l3,#d9dee7);--border-soft:var(--border);
      --accent:#1677ff;--accent-on:var(--bg);--accent-hover:var(--accent);--accent-active:var(--accent);
      --success:var(--fg);--warn:var(--fg);--danger:var(--fg);
      --font-display:"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif;
      --font-body:var(--font-display);--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      --weight-body:400;--weight-strong:700;
      --text-xs:12px;--text-sm:14px;--text-base:16px;--text-lg:20px;--text-xl:24px;--text-2xl:32px;--text-3xl:48px;--text-4xl:64px;
      --leading-body:1.6;--leading-tight:1.25;--tracking-display:-.01em;
      --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;--space-6:24px;--space-8:32px;--space-12:48px;
      --section-y-desktop:80px;--section-y-tablet:48px;--section-y-phone:32px;
      --radius-sm:8px;--radius-md:8px;--radius-lg:8px;--radius-pill:9999px;
      --elev-flat:none;--elev-ring:0 0 0 1px var(--border);--elev-raised:0 8px 24px color-mix(in srgb,var(--fg) 10%,transparent);
      --focus-ring:0 0 0 2px var(--accent-hover);--motion-fast:150ms;--motion-base:200ms;--ease-standard:cubic-bezier(.2,0,0,1);
      --container-max:1200px;--container-gutter-desktop:24px;--container-gutter-tablet:16px;--container-gutter-phone:12px;
      --panel:var(--bg);--editor:var(--surface);--hover:var(--surface);--selected:var(--surface);
      --readable-muted:var(--muted);--success-text:var(--fg);--danger-text:var(--fg);--warn-text:var(--fg);
      --overlay:color-mix(in srgb,var(--fg) 32%,transparent);--diff-add:var(--surface);--diff-remove:var(--bg);
      --motion-exit:120ms;
      color-scheme:inherit;
    }
[data-agents-desk] *{box-sizing:border-box}
[data-agents-desk]{background:transparent;scrollbar-gutter:stable}
[data-agents-desk]{margin:0;color:var(--fg-2);font:400 var(--text-base)/1.6 var(--font-body);font-feature-settings:"cv01","ss03";-webkit-font-smoothing:antialiased}
[data-agents-desk] button,[data-agents-desk] input,[data-agents-desk] textarea{font:inherit;font-feature-settings:inherit}
[data-agents-desk] button,[data-agents-desk] a,[data-agents-desk] input,[data-agents-desk] textarea{-webkit-tap-highlight-color:transparent}
[data-agents-desk] button{color:inherit;cursor:pointer}
[data-agents-desk] button:disabled{cursor:not-allowed;opacity:.42}
[data-agents-desk] button{border:0;background:none}
[data-agents-desk] button:focus-visible,[data-agents-desk] a:focus-visible,[data-agents-desk] summary:focus-visible{outline:2px solid var(--accent-hover);outline-offset:4px}
[data-agents-desk] input:focus-visible,[data-agents-desk] textarea:focus-visible{outline:2px solid var(--accent-hover);outline-offset:-2px}
[data-agents-desk] button:disabled:focus-visible{outline-offset:2px}
[data-agents-desk] a{color:var(--accent-hover)}
[data-agents-desk] svg{display:block;flex:none}
[data-agents-desk] h1,[data-agents-desk] h2,[data-agents-desk] h3,[data-agents-desk] p{margin:0}
[data-agents-desk] h1,[data-agents-desk] h2,[data-agents-desk] h3{color:var(--fg);font-weight:510}
[data-agents-desk] h1{font-size:var(--text-2xl);line-height:1.25;letter-spacing:var(--tracking-display)}
[data-agents-desk] h2{font-size:var(--text-lg);line-height:1.5}
[data-agents-desk] h3{font-size:var(--text-base)}
[data-agents-desk] small{font-size:var(--text-sm)}
[data-agents-desk] [hidden]{display:none!important}
[data-agents-desk] ::selection{background:var(--accent);color:var(--accent-on)}

[data-agents-desk] .brandbar{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-5) 0 var(--space-5);border-bottom:1px solid var(--border-soft)}
[data-agents-desk] .brand{display:flex;align-items:center;gap:var(--space-3);font-size:var(--text-sm);font-weight:590;color:var(--fg);letter-spacing:-.012em}
[data-agents-desk] .brandmark{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--hover)}
[data-agents-desk] .version{font:400 var(--text-xs)/1.5 var(--font-mono);color:var(--readable-muted)}
[data-agents-desk] .icon-btn{display:inline-flex;justify-content:center;align-items:center;min-width:44px;min-height:44px;border-radius:var(--radius-sm);color:var(--muted);transition:background var(--motion-fast)}
[data-agents-desk] .intro{padding:var(--space-8) 0 var(--space-6)}
[data-agents-desk] .intro p{margin-top:var(--space-2);color:var(--readable-muted);font-size:var(--text-base)}
[data-agents-desk] .eyebrow{color:var(--muted);font-size:var(--text-xs);letter-spacing:.08em;font-weight:510}
[data-agents-desk] .intro .eyebrow{margin-bottom:var(--space-2)}
[data-agents-desk] .context{padding:0 0 var(--space-6)}
[data-agents-desk] .workspace-control{display:flex;width:100%;text-align:left;align-items:center;gap:var(--space-3);padding:var(--space-3);border:1px solid var(--border);border-radius:var(--radius-md);background:var(--hover);min-height:68px}
[data-agents-desk] .workspace-icon{color:var(--readable-muted);display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--border);border-radius:var(--radius-sm);flex:none}
[data-agents-desk] .workspace-name{font-size:var(--text-sm);font-weight:510;color:var(--fg)}
[data-agents-desk] .workspace-path{font-size:var(--text-xs);font-family:var(--font-mono);color:var(--muted)}
[data-agents-desk] .chevron{color:var(--muted);transition:transform var(--motion-base)}
[data-agents-desk] [aria-expanded=true]>.chevron{transform:rotate(180deg)}
[data-agents-desk] .picker{margin-top:var(--space-2);padding:var(--space-2);border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);animation:agentsDeskArrive var(--motion-base) ease-out}
[data-agents-desk] .pick-option{display:flex;align-items:center;gap:var(--space-3);width:100%;text-align:left;padding:var(--space-3);border-radius:var(--radius-sm);min-height:48px}
[data-agents-desk] .pick-option[aria-current=true]{background:var(--selected)}
[data-agents-desk] .pick-option .check{margin-left:auto;color:var(--accent-hover)}
[data-agents-desk] .file-selector{margin-top:var(--space-3)}
[data-agents-desk] .file-toggle{display:flex;align-items:center;gap:var(--space-2);width:100%;min-height:44px;padding:var(--space-2) 0;text-align:left;color:var(--readable-muted);font-size:var(--text-sm)}
[data-agents-desk] .file-toggle .file-label{color:var(--fg-2);font-family:var(--font-mono)}
[data-agents-desk] .file-total{font-size:var(--text-xs);color:var(--muted)}
[data-agents-desk] .picker-search{display:block;width:100%;min-height:44px;padding:var(--space-2) var(--space-3);border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--panel);color:var(--fg);font-size:var(--text-sm)}
[data-agents-desk] .search-label{display:block;font-size:var(--text-xs);color:var(--readable-muted);margin:var(--space-1) var(--space-1) var(--space-2)}
[data-agents-desk] .group-title{padding:var(--space-4) var(--space-3) var(--space-1);font-size:var(--text-xs);font-weight:510;color:var(--readable-muted)}
[data-agents-desk] .file-option-name{font:510 var(--text-sm)/1.5 var(--font-mono);color:var(--fg-2)}
[data-agents-desk] .file-option-path{color:var(--muted);font-size:var(--text-xs);overflow-wrap:anywhere}
[data-agents-desk] .scope-badge{display:inline-flex;align-items:center;gap:var(--space-1);padding:0 var(--space-2);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:var(--text-xs);font-weight:400;color:var(--readable-muted);line-height:1.8;white-space:nowrap}
[data-agents-desk] .scope-badge.active{color:var(--accent-hover);background:var(--selected);border-color:transparent}
[data-agents-desk] .uncreated{color:var(--muted);font-size:var(--text-xs)}
[data-agents-desk] .tabs{display:flex;gap:var(--space-6);padding:0 0 0;border-bottom:1px solid var(--border);position:relative;top:auto;z-index:3;background:transparent}
[data-agents-desk] .tab{display:flex;align-items:center;gap:var(--space-2);min-height:52px;padding:var(--space-2) 0;border-bottom:2px solid transparent;margin-bottom:-1px;color:var(--readable-muted);font-size:var(--text-sm);white-space:nowrap}
[data-agents-desk] .tab[aria-selected=true]{color:var(--fg);border-bottom-color:var(--accent-hover)}
[data-agents-desk] .tab-count{display:block;min-width:20px;padding:0 var(--space-1);border-radius:4px;background:var(--hover);font:400 var(--text-xs)/1.7 var(--font-mono);text-align:center;color:var(--muted)}
[data-agents-desk] #agents-desk-view{padding:var(--space-6) 0 var(--space-6);min-height:480px;outline:none}
[data-agents-desk] .view-enter{animation:agentsDeskArrive var(--motion-base) ease-out}
[data-agents-desk] .file-head{display:flex;align-items:flex-start;gap:var(--space-3);margin-bottom:var(--space-5)}
[data-agents-desk] .file-symbol{display:grid;place-items:center;width:40px;height:44px;background:var(--hover);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--readable-muted);flex:none}
[data-agents-desk] .file-name{font:510 var(--text-lg)/1.5 var(--font-mono);color:var(--fg);overflow-wrap:anywhere}
[data-agents-desk] .file-description{font-size:var(--text-sm);color:var(--readable-muted);margin-top:var(--space-1)}
[data-agents-desk] .filepath-detail{margin-bottom:var(--space-4);font-size:var(--text-xs);color:var(--muted)}
[data-agents-desk] .filepath-detail summary{cursor:pointer;min-height:28px}
[data-agents-desk] .filepath-detail p{margin-top:var(--space-2);font-family:var(--font-mono);overflow-wrap:anywhere;color:var(--fg-2)}
[data-agents-desk] .editor-card{border:1px solid var(--border);border-radius:var(--radius-md);background:var(--editor)}
[data-agents-desk] .editor-toolbar{display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-bottom:1px solid var(--border);background:var(--hover);border-radius:var(--radius-md) var(--radius-md) 0 0}
[data-agents-desk] .segmented{display:flex;gap:var(--space-1)}
[data-agents-desk] .segment{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);min-height:36px;padding:var(--space-2) var(--space-3);font-size:var(--text-sm);color:var(--readable-muted);border-radius:var(--radius-sm)}
[data-agents-desk] .segment[aria-pressed=true]{background:var(--surface);color:var(--fg);box-shadow:var(--elev-ring)}
[data-agents-desk] .text-action{display:inline-flex;align-items:center;gap:var(--space-2);min-height:40px;padding:var(--space-2);color:var(--fg-2);font-size:var(--text-sm);border-radius:var(--radius-sm)}
[data-agents-desk] .text-action.accent{color:var(--accent-hover)}
[data-agents-desk] .editor-input{display:block;width:100%;min-height:448px;resize:vertical;border:0;background:transparent;color:var(--fg-2);padding:var(--space-6) var(--space-5);font:400 var(--text-base)/1.75 var(--font-mono);tab-size:2;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;overflow-y:hidden;border-radius:0}
[data-agents-desk] .editor-input::placeholder{color:var(--muted)}
[data-agents-desk] .editor-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--space-2);padding:var(--space-3) var(--space-4);border-top:1px solid var(--border-soft);font-size:var(--text-xs);color:var(--muted)}
[data-agents-desk] .editor-meta .od-row{gap:var(--space-2)}
[data-agents-desk] .status-dot{display:block;width:6px;height:6px;border-radius:50%;background:var(--muted);flex:none}
[data-agents-desk] .status-dot.dirty{background:var(--warn-text)}
[data-agents-desk] .saved-icon{color:var(--muted)}
[data-agents-desk] .savebar{display:flex;justify-content:space-between;align-items:center;gap:var(--space-4);padding-block:var(--space-5)}
[data-agents-desk] .save-state{color:var(--readable-muted);font-size:var(--text-sm)}
[data-agents-desk] .save-help{color:var(--muted);font-size:var(--text-xs);margin-top:var(--space-1)}
[data-agents-desk] kbd{font:400 11px/1.5 var(--font-mono);padding:1px var(--space-1);border:1px solid var(--border);border-radius:4px;color:var(--readable-muted)}
[data-agents-desk] .btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);min-height:44px;padding:var(--space-2) var(--space-4);border-radius:var(--radius-sm);border:1px solid var(--border);color:var(--fg-2);font-size:var(--text-sm);font-weight:510;white-space:nowrap;transition:background var(--motion-fast) ease-out}
[data-agents-desk] .btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-on)}
[data-agents-desk] .btn-danger{color:var(--danger-text)}
[data-agents-desk] .button-row{display:flex;align-items:center;justify-content:flex-end;gap:var(--space-2);flex-wrap:wrap}
[data-agents-desk] .discard-action{padding-inline:var(--space-2)}
[data-agents-desk] .scope-note{padding:var(--space-5) 0 0;border-top:1px solid var(--border);color:var(--readable-muted);font-size:var(--text-sm)}
[data-agents-desk] .scope-note summary{display:flex;align-items:center;gap:var(--space-2);cursor:pointer;min-height:44px;list-style:none}
[data-agents-desk] .scope-note summary::-webkit-details-marker{display:none}
[data-agents-desk] .scope-note summary .chevron{margin-left:auto}
[data-agents-desk] .scope-note[open] .chevron{transform:rotate(180deg)}
[data-agents-desk] .scope-note p{padding:var(--space-2) 0 var(--space-3);line-height:1.7}
[data-agents-desk] .inline-code{font-family:var(--font-mono);font-size:.9em;color:var(--fg-2)}
[data-agents-desk] .markdown{padding:var(--space-6) var(--space-5);min-height:448px;font-size:var(--text-base);overflow-wrap:anywhere}
[data-agents-desk] .markdown h1{font-size:var(--text-xl);margin-bottom:var(--space-6)}
[data-agents-desk] .markdown h2{font-size:var(--text-lg);margin-top:var(--space-6);margin-bottom:var(--space-3)}
[data-agents-desk] .markdown h3{margin-top:var(--space-5);margin-bottom:var(--space-2)}
[data-agents-desk] .markdown p{margin-bottom:var(--space-3)}
[data-agents-desk] .markdown ul{padding-left:var(--space-5);margin-block:var(--space-2) var(--space-4)}
[data-agents-desk] .markdown li{margin-block:var(--space-1)}
[data-agents-desk] .markdown code{font-family:var(--font-mono);font-size:.875em;background:var(--hover);border:1px solid var(--border-soft);padding:var(--space-1);border-radius:4px;white-space:pre-wrap;overflow-wrap:anywhere}
[data-agents-desk] .markdown pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:var(--space-3);background:var(--hover);border-radius:var(--radius-sm);font-size:var(--text-sm)}
[data-agents-desk] .markdown pre code{border:0;padding:0;background:none}
[data-agents-desk] .notice{display:flex;align-items:flex-start;gap:var(--space-2);padding:var(--space-3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:var(--text-sm);color:var(--readable-muted);margin-bottom:var(--space-4);overflow-wrap:anywhere}
[data-agents-desk] .notice>svg{margin-top:var(--space-1)}
[data-agents-desk] .notice.error{color:var(--danger-text)}
[data-agents-desk] .notice.warning{color:var(--warn-text)}
[data-agents-desk] .notice p{flex:1;min-width:0}
[data-agents-desk] .notice .text-action{padding:0;min-height:28px}
[data-agents-desk] .error-text{font-size:var(--text-sm);color:var(--danger-text);margin-top:var(--space-2)}
[data-agents-desk] .section-heading{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-4)}
[data-agents-desk] .section-subtitle{font-size:var(--text-sm);color:var(--readable-muted);margin-top:var(--space-1)}
[data-agents-desk] .proposal{margin-top:var(--space-4);padding-top:var(--space-6);border-top:1px solid var(--border)}
[data-agents-desk] .proposal .section-heading{align-items:flex-start}
[data-agents-desk] .proposal-count{font:400 var(--text-xs)/1.5 var(--font-mono);color:var(--muted)}
[data-agents-desk] .hunk{margin-block:var(--space-3);border:1px solid var(--border);border-radius:var(--radius-md)}
[data-agents-desk] .hunk-heading{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);min-height:48px;font-size:var(--text-sm);cursor:pointer}
[data-agents-desk] .hunk-heading input{width:16px;height:16px;accent-color:var(--accent);flex:none}
[data-agents-desk] .hunk-title{display:block;color:var(--fg-2)}
[data-agents-desk] .hunk-index{color:var(--muted);font:400 var(--text-xs)/1.5 var(--font-mono);margin-left:auto}
[data-agents-desk] .diff-code{font:400 var(--text-sm)/1.7 var(--font-mono);padding-block:var(--space-2);border-top:1px solid var(--border-soft);overflow-wrap:anywhere;white-space:pre-wrap}
[data-agents-desk] .diff-line{display:grid;grid-template-columns:16px minmax(0,1fr);gap:var(--space-2);padding:var(--space-1) var(--space-3)}
[data-agents-desk] .diff-line.add{background:var(--diff-add);color:var(--success-text)}
[data-agents-desk] .diff-line.remove{background:var(--diff-remove);color:var(--danger-text)}
[data-agents-desk] .diff-line.context{color:var(--muted)}
[data-agents-desk] .proposal-facts{font-size:var(--text-sm);color:var(--readable-muted);margin-block:var(--space-3)}
[data-agents-desk] .proposal-facts summary{cursor:pointer;min-height:36px}
[data-agents-desk] .proposal-facts ul{padding-left:var(--space-5);margin-block:var(--space-2);font-size:var(--text-xs);font-family:var(--font-mono);overflow-wrap:anywhere}
[data-agents-desk] .skeleton{display:grid;gap:var(--space-3);padding:var(--space-6) 0}
[data-agents-desk] .skeleton span{display:block;min-height:12px;border-radius:4px;background:var(--hover)}
[data-agents-desk] .skeleton span:nth-child(2){width:72%}
[data-agents-desk] .skeleton span:nth-child(3){width:88%}
[data-agents-desk] .budget{border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);background:var(--hover);margin-block:var(--space-5) var(--space-6)}
[data-agents-desk] .budget-title{font-size:var(--text-sm);color:var(--readable-muted)}
[data-agents-desk] .budget-number{display:flex;align-items:baseline;gap:var(--space-2);margin-top:var(--space-2);font:510 clamp(28px,7vw,36px)/1.3 var(--font-display);letter-spacing:var(--tracking-display);color:var(--fg);white-space:nowrap}
[data-agents-desk] .budget-number small{font-size:var(--text-sm);color:var(--muted);font-weight:400;letter-spacing:normal}
[data-agents-desk] .budget-percent{color:var(--readable-muted);font:400 var(--text-xs)/1.5 var(--font-mono)}
[data-agents-desk] .meter{display:block;appearance:none;width:100%;height:4px;margin-block:var(--space-5) var(--space-3);border:0;background:var(--border);border-radius:var(--radius-pill);overflow:hidden}
[data-agents-desk] .meter::-webkit-progress-bar{background:var(--border)}
[data-agents-desk] .meter::-webkit-progress-value{background:var(--accent-hover);border-radius:var(--radius-pill)}
[data-agents-desk] .meter::-moz-progress-bar{background:var(--accent-hover)}
[data-agents-desk] .budget-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--space-2);font-size:var(--text-xs);color:var(--readable-muted)}
[data-agents-desk] .chain-list{list-style:none;padding:0;margin:var(--space-3) 0 var(--space-6)}
[data-agents-desk] .chain-row{display:flex;align-items:flex-start;gap:var(--space-3);padding-block:var(--space-4);border-bottom:1px solid var(--border-soft)}
[data-agents-desk] .chain-number{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--border);border-radius:50%;color:var(--readable-muted);font:400 var(--text-xs)/1.5 var(--font-mono);flex:none}
[data-agents-desk] .chain-name{font:510 var(--text-sm)/1.6 var(--font-mono);color:var(--fg-2);overflow-wrap:anywhere}
[data-agents-desk] .chain-path{font:400 var(--text-xs)/1.7 var(--font-mono);color:var(--muted);overflow-wrap:anywhere}
[data-agents-desk] .chain-reason{font-size:var(--text-sm);color:var(--readable-muted);margin-top:var(--space-2)}
[data-agents-desk] .chain-status{font-size:var(--text-xs);color:var(--readable-muted);white-space:nowrap;display:flex;align-items:center;gap:var(--space-1);margin-top:var(--space-1)}
[data-agents-desk] .chain-status.loaded{color:var(--success-text)}
[data-agents-desk] .chain-status.problem{color:var(--warn-text)}
[data-agents-desk] .section-label{font-size:var(--text-sm);color:var(--fg-2);font-weight:510}
[data-agents-desk] .rule-details{padding:var(--space-4);border:1px solid var(--border);border-radius:var(--radius-md);font-size:var(--text-sm);color:var(--readable-muted)}
[data-agents-desk] .rule-details summary{cursor:pointer;min-height:28px;color:var(--fg-2)}
[data-agents-desk] .rule-details ul{padding-left:var(--space-5);margin-bottom:0}
[data-agents-desk] .rule-details li{margin-block:var(--space-2)}
[data-agents-desk] .rule-details p{margin-top:var(--space-3)}
[data-agents-desk] .history-list{list-style:none;padding:0;margin:var(--space-5) 0}
[data-agents-desk] .history-item{display:flex;gap:var(--space-3);align-items:flex-start;padding-block:var(--space-5);border-top:1px solid var(--border-soft)}
[data-agents-desk] .history-symbol{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--border);border-radius:var(--radius-md);color:var(--muted);flex:none}
[data-agents-desk] .history-title{font-size:var(--text-sm);color:var(--fg-2)}
[data-agents-desk] .history-time{color:var(--muted);font-size:var(--text-xs);margin-top:var(--space-1)}
[data-agents-desk] .history-item .text-action{min-height:32px;font-size:var(--text-xs);padding-inline:0}
[data-agents-desk] .history-item .button-row{justify-content:flex-start;gap:var(--space-5);margin-top:var(--space-2)}
[data-agents-desk] .history-size{font:400 var(--text-xs)/1.5 var(--font-mono);color:var(--muted);white-space:nowrap}
[data-agents-desk] .empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:var(--space-12) var(--space-4);gap:var(--space-3);color:var(--readable-muted)}
[data-agents-desk] .empty>svg{color:var(--muted);margin-bottom:var(--space-2)}
[data-agents-desk] .empty p{font-size:var(--text-sm);max-width:36ch}
[data-agents-desk] .empty h3{font-size:var(--text-base)}
[data-agents-desk] .back-action{margin-bottom:var(--space-4);padding-left:0}
[data-agents-desk] .diff-legend{font-size:var(--text-xs);color:var(--readable-muted);display:flex;gap:var(--space-4);margin-block:var(--space-4)}
[data-agents-desk] .footer{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin:0 0 0;padding:var(--space-5) 0 var(--space-6);border-top:1px solid var(--border-soft);font-size:var(--text-xs);color:var(--muted)}
[data-agents-desk] .footer .od-row{align-items:flex-start}
[data-agents-desk] .footer svg{margin-top:2px}
[data-agents-desk] .footer a{display:inline-flex;align-items:center;gap:var(--space-1);color:var(--readable-muted);text-decoration:none;white-space:nowrap;min-height:24px}
[data-agents-desk] .feedback{position:fixed;bottom:var(--space-6);left:50%;transform:translateX(-50%);z-index:20;width:calc(100% - 48px);max-width:464px;padding:var(--space-3) var(--space-4);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--elev-raised);font-size:var(--text-sm);color:var(--fg-2);display:flex;align-items:center;gap:var(--space-3)}
[data-agents-desk] .feedback .toast-icon{color:var(--success-text)}
[data-agents-desk] .feedback .toast-close{margin-left:auto;min-height:32px;min-width:32px}
[data-agents-desk] .toast-message{flex:1;min-width:0;overflow-wrap:anywhere}
[data-agents-desk] .feedback[hidden]{display:none}
[data-agents-desk] .sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
[data-agents-desk] dialog{width:calc(100% - 32px);max-width:440px;max-height:calc(100dvh - 48px);overflow-y:auto;padding:var(--space-6);border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);color:var(--fg-2);box-shadow:var(--elev-raised);font:400 var(--text-base)/1.6 var(--font-body)}
[data-agents-desk] dialog[open]{animation:agentsDeskArrive var(--motion-base) ease-out}
[data-agents-desk] dialog::backdrop{background:var(--overlay)}
[data-agents-desk] .dialog-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3)}
[data-agents-desk] .dialog-header h2{padding-top:var(--space-2)}
[data-agents-desk] .dialog-copy{color:var(--readable-muted);font-size:var(--text-sm);margin-block:var(--space-4) var(--space-6);overflow-wrap:anywhere}
[data-agents-desk] .dialog-copy p+p{margin-top:var(--space-3)}
[data-agents-desk] .dialog-copy code{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--fg-2)}
[data-agents-desk]{font-weight:var(--weight-body);font-feature-settings:normal;line-height:var(--leading-body)}
[data-agents-desk] h1,[data-agents-desk] h2,[data-agents-desk] h3{font-family:var(--font-display);font-weight:var(--weight-strong);line-height:var(--leading-tight)}
[data-agents-desk] .brand,[data-agents-desk] .workspace-name,[data-agents-desk] .eyebrow,[data-agents-desk] .group-title,[data-agents-desk] .file-name,[data-agents-desk] .file-option-name,[data-agents-desk] .btn,[data-agents-desk] .budget-number,[data-agents-desk] .chain-name,[data-agents-desk] .section-label{font-weight:var(--weight-strong)}
[data-agents-desk] a{color:var(--fg);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:4px}
[data-agents-desk] ::selection{background:var(--border);color:var(--fg)}
[data-agents-desk] button,[data-agents-desk] .icon-btn,[data-agents-desk] .btn,[data-agents-desk] .chevron{transition:transform var(--motion-fast) ease-out,opacity var(--motion-fast) ease-out}
[data-agents-desk] button:focus-visible,[data-agents-desk] a:focus-visible,[data-agents-desk] summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
[data-agents-desk] input:focus-visible,[data-agents-desk] textarea:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}

[data-agents-desk] .brandbar{padding-block:var(--space-3);background:transparent}
[data-agents-desk] .brand{gap:var(--space-2);font-size:var(--text-base);letter-spacing:normal}
[data-agents-desk] .brandmark{width:32px;height:32px;background:var(--fg);border-color:var(--fg);color:var(--bg)}
[data-agents-desk] .version{padding:var(--space-1) var(--space-2);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)}
[data-agents-desk] .intro{padding-block:var(--space-6)}
[data-agents-desk] .intro .eyebrow{margin-top:0;font-size:var(--text-xs);font-weight:var(--weight-body)}
[data-agents-desk] .intro h1{letter-spacing:var(--tracking-display)}
[data-agents-desk] .intro p{line-height:var(--leading-body)}
[data-agents-desk] .context{padding-bottom:var(--space-4)}
[data-agents-desk] .workspace-control{padding:var(--space-4);gap:var(--space-3);min-height:80px;background:var(--surface)}
[data-agents-desk] .workspace-icon{width:40px;height:40px;background:var(--bg);color:var(--fg)}
[data-agents-desk] .workspace-name{font-size:var(--text-base)}
[data-agents-desk] .workspace-path{margin-top:var(--space-1)}
[data-agents-desk] .workspace-control .od-truncate{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere}
[data-agents-desk] .picker{background:var(--bg);padding:var(--space-2);box-shadow:var(--elev-raised)}
[data-agents-desk] .pick-option{min-height:56px;padding:var(--space-3);border:1px solid transparent;gap:var(--space-3)}
[data-agents-desk] .pick-option[aria-current=true]{border-color:var(--border);background:var(--surface)}
[data-agents-desk] .pick-option .check{color:var(--accent)}
[data-agents-desk] .file-selector{margin-top:var(--space-2)}
[data-agents-desk] .file-toggle{padding-inline:var(--space-2);border-radius:var(--radius-sm)}
[data-agents-desk] .picker-search{font-size:var(--text-base);background:var(--bg)}
[data-agents-desk] .group-title{padding-block:var(--space-4) var(--space-2)}
[data-agents-desk] .scope-badge{padding:var(--space-1) var(--space-2);line-height:1.5;background:var(--surface);border-color:var(--border)}
[data-agents-desk] .scope-badge.active{color:var(--fg);background:var(--surface);border-color:var(--border)}
[data-agents-desk] .tabs{gap:var(--space-8);background:transparent}
[data-agents-desk] .tab{min-height:56px;gap:var(--space-2);margin-bottom:0;border-bottom-width:2px}
[data-agents-desk] .tab[aria-selected=true]{font-weight:var(--weight-strong);border-bottom-color:var(--accent)}
[data-agents-desk] .tab-count{border-radius:var(--radius-sm);padding-inline:var(--space-2);background:var(--surface)}
[data-agents-desk] .tab[aria-selected=true] .tab-count{color:var(--fg)}
[data-agents-desk] #agents-desk-view{padding-block:var(--space-6)}
[data-agents-desk] .file-head{align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)}
[data-agents-desk] .file-symbol{width:48px;height:48px;background:var(--surface);color:var(--fg)}
[data-agents-desk] .file-name{font-size:var(--text-lg)}
[data-agents-desk] .file-description{font-weight:var(--weight-body);line-height:1.6}
[data-agents-desk] .filepath-detail summary{min-height:32px;overflow-wrap:anywhere}
[data-agents-desk] .editor-card{background:var(--editor);box-shadow:var(--elev-flat)}
[data-agents-desk] .editor-toolbar{padding:var(--space-2);background:var(--bg)}
[data-agents-desk] .segmented{gap:var(--space-2)}
[data-agents-desk] .segment{min-height:44px;padding-inline:var(--space-3);border:1px solid transparent}
[data-agents-desk] .segment[aria-pressed=true]{background:var(--surface);border-color:var(--border);box-shadow:none;font-weight:var(--weight-strong)}
[data-agents-desk] .text-action{min-height:44px}
[data-agents-desk] .text-action.accent{color:var(--fg)}
[data-agents-desk] .text-action.accent>svg{color:var(--accent)}
[data-agents-desk] .editor-input{padding:var(--space-6);line-height:1.75;font-size:var(--text-base);background:var(--surface)}
[data-agents-desk] .editor-input:focus-visible{outline-offset:-2px}
[data-agents-desk] .editor-meta{padding:var(--space-3) var(--space-4);background:var(--bg);border-radius:0 0 var(--radius-md) var(--radius-md)}
[data-agents-desk] .status-dot.dirty{background:var(--fg);border-radius:0}
[data-agents-desk] .savebar{padding-block:var(--space-6);gap:var(--space-3)}
[data-agents-desk] .save-state{font-size:var(--text-sm);color:var(--fg)}
[data-agents-desk] .save-help{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-1);font-size:var(--text-xs)}
[data-agents-desk] kbd{background:var(--surface);border-radius:var(--radius-sm)}
[data-agents-desk] .btn{min-height:48px;padding:var(--space-2) var(--space-4);background:var(--bg);font-size:var(--text-base);line-height:1.5}
[data-agents-desk] .btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-on);font-size:var(--text-lg);font-weight:var(--weight-strong);line-height:1.5}
[data-agents-desk] .btn-primary:disabled{opacity:1;background:var(--surface);border-color:var(--border);color:var(--muted)}
[data-agents-desk] .btn-danger{border-color:var(--fg);color:var(--fg)}
[data-agents-desk] .button-row{gap:var(--space-2)}
[data-agents-desk] .scope-note{padding-top:var(--space-4)}
[data-agents-desk] .scope-note summary{color:var(--fg)}
[data-agents-desk] .markdown{padding:var(--space-6);background:var(--surface);line-height:1.75}
[data-agents-desk] .markdown code{background:var(--bg);border-radius:var(--radius-sm)}
[data-agents-desk] .markdown pre{background:var(--bg);padding:var(--space-4);border:1px solid var(--border)}
[data-agents-desk] .notice{background:var(--surface);padding:var(--space-4);gap:var(--space-2)}
[data-agents-desk] .notice.error{color:var(--fg);border-color:var(--fg)}
[data-agents-desk] .notice.warning{color:var(--fg);background:var(--surface)}
[data-agents-desk] .notice .text-action{min-height:44px}
[data-agents-desk] .error-text{color:var(--fg);font-weight:var(--weight-strong)}
[data-agents-desk] .section-heading{align-items:flex-start;margin-bottom:var(--space-4)}
[data-agents-desk] .section-heading h2{font-size:var(--text-lg)}
[data-agents-desk] .section-subtitle{line-height:1.6}
[data-agents-desk] .proposal{padding-top:var(--space-6);margin-top:var(--space-2)}
[data-agents-desk] .hunk{margin-block:var(--space-4);background:var(--bg)}
[data-agents-desk] .hunk-heading{padding:var(--space-4);gap:var(--space-3);font-weight:var(--weight-strong)}
[data-agents-desk] .hunk-heading input{accent-color:var(--fg)}
[data-agents-desk] .hunk-index{font-weight:var(--weight-body)}
[data-agents-desk] .diff-code{background:var(--bg);border-radius:0 0 var(--radius-md) var(--radius-md)}
[data-agents-desk] .diff-line{padding:var(--space-2) var(--space-4)}
[data-agents-desk] .diff-line.add{background:var(--surface);color:var(--fg)}
[data-agents-desk] .diff-line.remove{background:var(--bg);color:var(--muted)}
[data-agents-desk] .diff-line.add>span:first-child,[data-agents-desk] .diff-line.remove>span:first-child{font-weight:var(--weight-strong);color:var(--fg)}
[data-agents-desk] .diff-line.remove>span:last-child{text-decoration:line-through;text-decoration-color:var(--muted)}
[data-agents-desk] .skeleton span{background:var(--border)}
[data-agents-desk] .budget{background:var(--surface);padding:var(--space-6);margin-block:var(--space-6)}
[data-agents-desk] .budget-number{font-size:clamp(28px,7vw,36px);font-weight:var(--weight-strong)}
[data-agents-desk] .meter{height:4px;background:var(--border)}
[data-agents-desk] .meter::-webkit-progress-value{background:var(--accent)}
[data-agents-desk] .meter::-moz-progress-bar{background:var(--accent)}
[data-agents-desk] .chain-row{padding-block:var(--space-4);gap:var(--space-3)}
[data-agents-desk] .chain-number{background:var(--surface);border-radius:var(--radius-sm);width:32px;height:32px}
[data-agents-desk] .chain-status.loaded,[data-agents-desk] .chain-status.problem{color:var(--fg)}
[data-agents-desk] .chain-status.problem{font-weight:var(--weight-strong)}
[data-agents-desk] .rule-details{background:var(--surface);padding:var(--space-4)}
[data-agents-desk] .rule-details summary{min-height:32px;color:var(--fg)}
[data-agents-desk] .history-item{padding-block:var(--space-6)}
[data-agents-desk] .history-symbol{width:40px;height:40px;background:var(--surface);color:var(--fg)}
[data-agents-desk] .history-title{font-size:var(--text-base);font-weight:var(--weight-strong)}
[data-agents-desk] .history-item .text-action{min-height:44px;font-size:var(--text-sm)}
[data-agents-desk] .history-item .button-row{gap:var(--space-4)}
[data-agents-desk] .empty{padding-block:var(--space-12)}
[data-agents-desk] .footer{padding-block:var(--space-4) var(--space-2)}
[data-agents-desk] .footer a{color:var(--fg);text-decoration:underline;text-decoration-color:var(--border);text-underline-offset:4px}
[data-agents-desk] .feedback{background:var(--bg);padding:var(--space-4);box-shadow:var(--elev-raised)}
[data-agents-desk] .feedback .toast-icon{color:var(--fg)}
[data-agents-desk] dialog{background:var(--bg);border-radius:var(--radius-lg)}
[data-agents-desk] .dialog-copy{font-size:var(--text-base);line-height:1.75}
[data-agents-desk] .dialog-header h2{font-size:var(--text-lg)}
@keyframes agentsDeskArrive{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@media(hover:hover){[data-agents-desk] .icon-btn:hover,[data-agents-desk] .pick-option:hover,[data-agents-desk] .segment:hover,[data-agents-desk] .text-action:hover{background:var(--hover)}
[data-agents-desk] .workspace-control:hover{background:var(--surface);border-color:var(--muted)}
[data-agents-desk] .btn:hover{background:var(--hover);border-color:var(--muted)}
[data-agents-desk] .btn-primary:not(:disabled):hover{background:var(--accent);border-color:var(--accent);box-shadow:var(--focus-ring)}
[data-agents-desk] .btn-danger:hover{background:var(--surface);border-color:var(--fg)}
[data-agents-desk] .file-toggle:hover{background:var(--hover)}
[data-agents-desk] .tab:hover{background:var(--hover)}
[data-agents-desk] .footer a:hover{text-decoration-color:var(--accent)}}
@media(min-width:768px){
[data-agents-desk] .brandbar{border-radius:var(--radius-lg) var(--radius-lg) 0 0}
[data-agents-desk] .tabs{top:auto}}
@media(min-width:1024px){}
@media(min-width:1440px){}
@media(max-width:420px){[data-agents-desk] .brandbar{padding:var(--space-2) 0 var(--space-2)}
[data-agents-desk] .intro{padding:var(--space-6) 0 var(--space-6)}
[data-agents-desk] .intro p{font-size:var(--text-base)}
[data-agents-desk] .context{padding:0 0 var(--space-4)}
[data-agents-desk] .workspace-control{padding:var(--space-3)}
[data-agents-desk] .workspace-name{font-size:var(--text-sm)}
[data-agents-desk] .tabs{padding-inline:0;gap:var(--space-6)}
[data-agents-desk] #agents-desk-view{padding:var(--space-6) 0 var(--space-6)}
[data-agents-desk] .editor-toolbar{padding-inline:var(--space-2);gap:var(--space-1)}
[data-agents-desk] .segment{padding-inline:var(--space-2)}
[data-agents-desk] .segmented{gap:var(--space-1)}
[data-agents-desk] .text-action{gap:var(--space-1)}
[data-agents-desk] .editor-input,[data-agents-desk] .markdown{padding:var(--space-4)}
[data-agents-desk] .editor-input{min-height:392px;font-size:var(--text-base)}
[data-agents-desk] .editor-meta{padding-inline:var(--space-3)}
[data-agents-desk] .footer{margin-inline:0}
[data-agents-desk] .savebar{gap:var(--space-2)}
[data-agents-desk] .savebar .button-row{gap:var(--space-2)}
[data-agents-desk] .savebar .btn{padding-inline:var(--space-3)}
[data-agents-desk] .save-help kbd{display:none}
[data-agents-desk] .budget{padding:var(--space-4)}
[data-agents-desk] .file-head{gap:var(--space-2)}
[data-agents-desk] .file-symbol{width:40px;height:44px}
[data-agents-desk] .file-name{font-size:var(--text-base)}
[data-agents-desk] .file-description{font-size:var(--text-sm)}
[data-agents-desk] .chain-row{gap:var(--space-2)}
[data-agents-desk] .chain-number{width:28px;height:28px}
[data-agents-desk] .notice{padding:var(--space-3)}
[data-agents-desk] .notice.warning{flex-wrap:wrap}
[data-agents-desk] .history-item{gap:var(--space-2)}
[data-agents-desk] .history-symbol{width:32px;height:32px}
[data-agents-desk] .history-item .button-row{gap:var(--space-3)}
[data-agents-desk] .diff-line{padding-inline:var(--space-3)}}
@media(prefers-reduced-motion:reduce){[data-agents-desk] *,[data-agents-desk] *::before,[data-agents-desk] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
[data-agents-desk]{container:agents-desk / inline-size;max-width:100%;color:var(--fg);font-family:var(--font-body)}
[data-agents-desk] .context-row{display:flex;align-items:center;gap:8px;position:relative}
[data-agents-desk] .workspace-control{min-width:0;flex:1;padding-right:44px}
[data-agents-desk] .workspace-refresh{position:absolute;right:8px;min-width:32px;min-height:32px}
[data-agents-desk] .pick-options{max-height:360px;overflow-y:auto}
[data-agents-desk] .editor-toolbar{flex-wrap:wrap}
[data-agents-desk] .editor-input{height:448px;overflow-y:auto;white-space:pre;overflow-wrap:normal;word-break:normal}
[data-agents-desk] .budget-values{align-items:baseline}
[data-agents-desk] .diff-range{padding:8px 16px;color:var(--muted);font-size:12px}
[data-agents-desk] .dynamic-empty{margin-block:16px 24px}
[data-agents-desk] .proposal-facts{margin-block:16px}
[data-agents-desk] #agents-desk-view{overflow-wrap:anywhere}
@container agents-desk (max-width:420px){
[data-agents-desk] .intro,[data-agents-desk] #agents-desk-view{padding:24px 0 24px}
[data-agents-desk] .context{padding:0 0 16px}
[data-agents-desk] .tabs{padding-inline:0;gap:20px}
[data-agents-desk] .editor-input{padding:16px;height:392px}
[data-agents-desk] .editor-toolbar{padding-inline:8px;gap:4px}
[data-agents-desk] .segment{padding-inline:8px}
[data-agents-desk] .savebar .btn{padding-inline:12px}
[data-agents-desk] .savebar{gap:8px}
[data-agents-desk] .file-name{font-size:16px}
}

/* The settings options column owns the surface width and outer gutters. */
[data-agents-desk].app{width:100%;max-width:none;min-width:0;min-height:0;margin:0;padding:0;border:0;box-sizing:border-box;background:transparent}
`
    const ICONS = {"layers": [["path", {"d": "m12 3 9 5-9 5-9-5 9-5Z"}], ["path", {"d": "m3 12 9 5 9-5M3 16l9 5 9-5"}]], "help": [["circle", {"cx": "12", "cy": "12", "r": "9"}], ["path", {"d": "M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.6-2.3 1.8-2.3 3.5M12 17h.01"}]], "folder": [["path", {"d": "M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"}]], "down": [["path", {"d": "m8 10 4 4 4-4"}]], "file": [["path", {"d": "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"}], ["path", {"d": "M14 3v6h6M8 13h8M8 17h5"}]], "globe": [["circle", {"cx": "12", "cy": "12", "r": "9"}], ["ellipse", {"cx": "12", "cy": "12", "rx": "4", "ry": "9"}], ["path", {"d": "M3 12h18"}]], "check": [["path", {"d": "m5 12 4 4L19 6"}]], "refresh": [["path", {"d": "M20 7v5h-5M4 17v-5h5"}], ["path", {"d": "M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"}]], "code": [["path", {"d": "m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"}]], "eye": [["path", {"d": "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}], ["circle", {"cx": "12", "cy": "12", "r": "3"}]], "spark": [["path", {"d": "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"}]], "save": [["path", {"d": "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"}], ["path", {"d": "M7 3v6h9V3M7 21v-8h10v8"}]], "info": [["circle", {"cx": "12", "cy": "12", "r": "9"}], ["path", {"d": "M12 11v6M12 7h.01"}]], "arrow": [["path", {"d": "M7 17 17 7M7 7h10v10"}]], "clock": [["circle", {"cx": "12", "cy": "12", "r": "9"}], ["path", {"d": "M12 7v5l3 2"}]], "history": [["path", {"d": "M3 11a9 9 0 1 1 2 7M3 4v7h7"}], ["path", {"d": "M12 7v5l3 2"}]], "close": [["path", {"d": "m6 6 12 12M18 6 6 18"}]], "back": [["path", {"d": "m10 5-7 7 7 7M3 12h17"}]], "diff": [["path", {"d": "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 3v18M6 8h3M16 13v6M13 16h6"}]], "shield": [["path", {"d": "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"}], ["path", {"d": "m8 12 3 3 5-6"}]], "minus": [["path", {"d": "M5 12h14"}]], "alert": [["path", {"d": "m12 3 10 18H2L12 3Z"}], ["path", {"d": "M12 9v5M12 17h.01"}]], "branch": [["circle", {"cx": "6", "cy": "5", "r": "2"}], ["circle", {"cx": "6", "cy": "19", "r": "2"}], ["circle", {"cx": "18", "cy": "6", "r": "2"}], ["path", {"d": "M6 7v10M18 8c0 5-12 2-12 7"}]]}

    // ---------- pure helpers (kept free of React state so they stay testable) ----------

    function isAbort(error) {
      return Boolean(error) && (error.name === 'AbortError' || error.aborted === true)
    }

    /** Dictionary key for a server error code: `version/stale` -> `err_version_stale`. */
    function errorKey(code) {
      if (typeof code !== 'string' || code.trim() === '') return ''
      const slug = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      return slug === '' ? '' : `err_${slug}`
    }

    /** Localized error text with the server message as the last resort. */
    function errorText(error, t) {
      const translateText = typeof t === 'function' ? t : (key) => key
      if (error === undefined || error === null) return translateText('errUnknown')
      if (isAbort(error)) return translateText('errAborted')
      const key = errorKey(error.code)
      if (key !== '') {
        const localized = translateText(key)
        if (typeof localized === 'string' && localized !== '' && localized !== key) return localized
      }
      if (typeof error.status !== 'number') return translateText('errNetwork')
      const message = typeof error.message === 'string' ? error.message.trim() : ''
      return message !== '' ? message : translateText('errUnknown')
    }

    /** The host may publish capabilities as `services` or the older `capabilities`. */
    function serviceFlag(health, name) {
      if (health === undefined || health === null) return undefined
      const caps = health.services !== undefined && health.services !== null ? health.services : health.capabilities
      if (caps === undefined || caps === null) return undefined
      if (Array.isArray(caps)) return caps.includes(name)
      if (typeof caps === 'object' && typeof caps[name] === 'boolean') return caps[name]
      return undefined
    }

    function formatBytes(value) {
      const bytes = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) {
        const kib = bytes / 1024
        return `${kib < 10 ? kib.toFixed(1) : Math.round(kib)} KiB`
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    }

    function formatTime(value) {
      if (typeof value !== 'string' || value === '') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      const pad = (part) => String(part).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function budgetPercent(used, limit) {
      const safeLimit = typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? limit : 0
      const safeUsed = typeof used === 'number' && Number.isFinite(used) ? Math.max(0, used) : 0
      if (safeLimit === 0) return 0
      return Math.max(0, Math.min(100, Math.round((safeUsed / safeLimit) * 100)))
    }

    /** Rebuild a file from the original lines and the hunks the user accepted. */
    function applyHunks(oldText, hunks, accepted) {
      const lines = String(oldText ?? '').split('\n')
      const list = Array.isArray(hunks) ? hunks : []
      const out = []
      let cursor = 0
      for (let index = 0; index < list.length; index += 1) {
        const hunk = list[index]
        const start = Math.min(lines.length, Math.max(cursor, (Number(hunk?.oldStart) || 1) - 1))
        for (let line = cursor; line < start; line += 1) out.push(lines[line])
        const take = accepted === undefined
          ? true
          : Array.isArray(accepted) ? accepted[index] === true : accepted.has(index)
        const replacement = take && Array.isArray(hunk?.newText)
          ? hunk.newText
          : lines.slice(start, start + (Number(hunk?.oldLines) || 0))
        for (const line of replacement) out.push(line)
        cursor = start + (Number(hunk?.oldLines) || 0)
      }
      for (let line = cursor; line < lines.length; line += 1) out.push(lines[line])
      return out.join('\n')
    }

    /** Indices of hunks whose old range no longer matches the editor text. */
    function hunkConflicts(text, hunks) {
      const lines = String(text ?? '').split('\n')
      const list = Array.isArray(hunks) ? hunks : []
      const conflicts = []
      for (let index = 0; index < list.length; index += 1) {
        const hunk = list[index]
        const start = Number(hunk?.oldStart)
        const count = Number(hunk?.oldLines)
        if (!Number.isInteger(start) || !Number.isInteger(count) || start < 1 || count < 0) {
          conflicts.push(index)
          continue
        }
        if (start - 1 + count > lines.length) {
          conflicts.push(index)
          continue
        }
        if (Array.isArray(hunk.oldText)) {
          const slice = lines.slice(start - 1, start - 1 + count)
          if (slice.length !== hunk.oldText.length || slice.some((line, i) => line !== hunk.oldText[i])) {
            conflicts.push(index)
          }
        }
      }
      return conflicts
    }

    function tokenEstimateOf(row) {
      if (typeof row?.tokens === 'number' && Number.isFinite(row.tokens)) return row.tokens
      const included = typeof row?.included === 'number' && Number.isFinite(row.included)
        ? row.included
        : typeof row?.bytes === 'number' && Number.isFinite(row.bytes) ? row.bytes : 0
      return Math.ceil(included / 4)
    }

    const STATUS_KEYS = {
      loaded: 'statusLoaded',
      duplicate: 'statusDuplicate',
      ignored: 'statusIgnored',
      truncated: 'statusTruncated',
      omitted: 'statusOmitted',
      absent: 'statusAbsent',
      unreadable: 'statusUnreadable',
      dynamic: 'statusDynamic',
    }

    function statusKey(status) {
      return typeof status === 'string' && STATUS_KEYS[status] !== undefined ? STATUS_KEYS[status] : ''
    }

    function statusLabel(status, t) {
      const key = statusKey(status)
      if (key !== '') return t(key)
      return typeof status === 'string' && status !== '' ? status : t('reasonOther')
    }

    /** Localized explanation for a chain row; server `reason` remains on the title attribute. */
    function chainReason(row, maxSourceBytes, t) {
      switch (row?.status) {
        case 'duplicate': return t('reasonDuplicate')
        case 'ignored': return `${t('reasonIgnored')} (${formatBytes(maxSourceBytes)})`
        case 'truncated': return `${t('reasonTruncated')} (${formatBytes(row.included)} / ${formatBytes(row.bytes)})`
        case 'omitted': return t('reasonOmitted')
        case 'absent': return t('reasonAbsent')
        case 'unreadable': return t('reasonUnreadable')
        case 'dynamic': return t('reasonDynamic')
        default: return typeof row?.reason === 'string' ? row.reason : ''
      }
    }

    const INLINE_PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\([^)\n]*\))/g

    /** Tokenize one line of inline Markdown: code, bold, italic, links (as text). */
    function inlineParts(text) {
      const source = String(text ?? '')
      const parts = []
      let last = 0
      INLINE_PATTERN.lastIndex = 0
      let match = INLINE_PATTERN.exec(source)
      while (match !== null) {
        if (match.index > last) parts.push({ kind: 'text', text: source.slice(last, match.index) })
        const token = match[0]
        if (token.startsWith('`')) parts.push({ kind: 'code', text: token.slice(1, -1) })
        else if (token.startsWith('**')) parts.push({ kind: 'bold', text: token.slice(2, -2) })
        else if (token.startsWith('__')) parts.push({ kind: 'bold', text: token.slice(2, -2) })
        else if (token.startsWith('*')) parts.push({ kind: 'italic', text: token.slice(1, -1) })
        else if (token.startsWith('_')) parts.push({ kind: 'italic', text: token.slice(1, -1) })
        else {
          const link = token.match(/^\[([^\]]+)\]\(([^)]*)\)$/)
          parts.push({ kind: 'link', text: link ? link[1] : token, href: link ? link[2] : '' })
        }
        last = match.index + token.length
        match = INLINE_PATTERN.exec(source)
      }
      if (last < source.length) parts.push({ kind: 'text', text: source.slice(last) })
      return parts
    }

    function markdownBlockStart(line) {
      const text = String(line ?? '')
      if (/^\s*$/.test(text)) return true
      if (/^\s*(```|~~~)/.test(text)) return true
      if (/^#{1,6}\s+/.test(text)) return true
      if (/^\s*>/.test(text)) return true
      if (/^\s*([-*+])\s+/.test(text)) return true
      if (/^\s*\d+[.)]\s+/.test(text)) return true
      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(text)) return true
      return false
    }

    /** Dependency-free Markdown block parser: headings, fences, lists, quotes, rules, paragraphs. */
    function parseMarkdown(source) {
      const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let index = 0
      while (index < lines.length) {
        const line = lines[index]
        if (line.trim() === '') { index += 1; continue }

        const fence = line.match(/^\s*(```|~~~)(.*)$/)
        if (fence !== null) {
          const marker = fence[1]
          const lang = fence[2].trim()
          const code = []
          index += 1
          while (index < lines.length && !lines[index].trim().startsWith(marker)) {
            code.push(lines[index])
            index += 1
          }
          if (index < lines.length) index += 1
          blocks.push({ type: 'code', lang, text: code.join('\n') })
          continue
        }

        const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/)
        if (heading !== null) {
          blocks.push({ type: 'heading', depth: heading[1].length, text: heading[2] })
          index += 1
          continue
        }

        if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
          blocks.push({ type: 'hr' })
          index += 1
          continue
        }

        if (/^\s*>/.test(line)) {
          const quote = []
          while (index < lines.length && /^\s*>/.test(lines[index])) {
            quote.push(lines[index].replace(/^\s*>\s?/, ''))
            index += 1
          }
          blocks.push({ type: 'quote', text: quote.join('\n') })
          continue
        }

        if (/^\s*[-*+]\s+/.test(line)) {
          const items = []
          while (index < lines.length) {
            const item = lines[index].match(/^\s*[-*+]\s+(.*)$/)
            if (item === null) break
            items.push(item[1])
            index += 1
          }
          blocks.push({ type: 'list', ordered: false, items })
          continue
        }

        if (/^\s*\d+[.)]\s+/.test(line)) {
          const items = []
          while (index < lines.length) {
            const item = lines[index].match(/^\s*\d+[.)]\s+(.*)$/)
            if (item === null) break
            items.push(item[1])
            index += 1
          }
          blocks.push({ type: 'list', ordered: true, items })
          continue
        }

        const paragraph = [line.trim()]
        index += 1
        while (index < lines.length && !markdownBlockStart(lines[index])) {
          paragraph.push(lines[index].trim())
          index += 1
        }
        blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      }
      return blocks
    }

    function historySourceLabel(source, t) {
      if (source === 'save') return t('historySourceSave')
      if (source === 'rollback') return t('historySourceRollback')
      return typeof source === 'string' && source !== '' ? source : ''
    }

    // ---------- transport ----------

    function apiUrl(path) {
      const target = API + path
      if (typeof document !== 'undefined' && typeof document.baseURI === 'string' && document.baseURI !== '') {
        try { return new URL(target, document.baseURI).toString() } catch { /* fall back to the relative URL */ }
      }
      return target
    }

    async function call(path, init) {
      const response = await fetch(apiUrl(path), { cache: 'no-store', credentials: 'same-origin', ...init })
      let data = null
      try { data = await response.json() } catch { data = null }
      if (!response.ok) {
        const error = new Error(data !== null && typeof data.error === 'string' ? data.error : `HTTP ${response.status}`)
        error.status = response.status
        error.code = data !== null && typeof data.code === 'string' ? data.code : undefined
        throw error
      }
      return data !== null && typeof data === 'object' ? data : {}
    }

    function postJson(path, body, init) {
      return call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), ...init })
    }

    // ---------- small UI primitives ----------

    function Icon({ name, size = 18, className = '' }) {
      return h('svg', { className, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        (ICONS[name] ?? ICONS.file).map(([tag, attrs], index) => h(tag, { ...attrs, key: index })))
    }

    function Btn({ children, onClick, disabled, title, ariaLabel, tone, icon, className = '', ...rest }) {
      return h('button', { type: 'button', className: `${className || 'btn'}${tone === 'primary' ? ' btn-primary' : tone === 'danger' ? ' btn-danger' : ''}`, onClick, disabled, title, 'aria-label': ariaLabel, ...rest },
        icon ? h(Icon, { name: icon, size: 16 }) : null, children)
    }

    function Loader({ label }) {
      return h('div', { className: 'notice', role: 'status' }, h(Icon, { name: 'clock' }), label)
    }

    function ErrorLine({ text, onRetry, retryLabel }) {
      return h('div', { className: 'notice error', role: 'alert' }, h(Icon, { name: 'alert' }), h('p', null, text),
        onRetry ? h(Btn, { className: 'text-action', onClick: onRetry }, retryLabel || translate('retry')) : null)
    }

    function NoticeBar({ notice, onDismiss }) {
      if (!notice) return null
      return h('div', { className: notice.kind === 'ok' ? 'feedback' : `notice ${notice.kind === 'err' ? 'error' : 'warning'}`, role: notice.kind === 'err' ? 'alert' : 'status' },
        h(Icon, { name: notice.kind === 'ok' ? 'check' : 'alert' }), h('span', { className: 'toast-message' }, notice.text),
        h(Btn, { className: 'icon-btn toast-close', ariaLabel: translate('close'), onClick: onDismiss, icon: 'close' }))
    }

    function ConfirmBar({ pending, onCancel, onConfirm }) {
      const ref = useRef(null)
      useEffect(() => {
        const dialog = ref.current
        if (pending && !dialog.open) dialog.showModal()
        else if (!pending && dialog.open) dialog.close()
      }, [pending])
      const help = pending?.kind === 'help'
      return h('dialog', { ref, role: help ? 'dialog' : 'alertdialog', 'aria-labelledby': 'agents-desk-dialog-title', 'aria-describedby': 'agents-desk-dialog-copy', onCancel: event => { event.preventDefault(); onCancel() }, onClose: onCancel },
        h('div', { className: 'dialog-header' }, h('h2', { id: 'agents-desk-dialog-title' }, translate(help ? 'help' : 'confirmDiscardTitle')),
          h(Btn, { className: 'icon-btn', icon: 'close', ariaLabel: translate('close'), onClick: onCancel })),
        h('div', { className: 'dialog-copy', id: 'agents-desk-dialog-copy' }, pending?.message),
        h('div', { className: 'button-row' },
          !help ? h(Btn, { onClick: onCancel, autoFocus: true }, translate('cancel')) : null,
          h(Btn, { tone: 'primary', onClick: onConfirm }, pending?.confirmLabel || translate('close'))))
    }

    function renderInline(text, key) {
      return inlineParts(text).map((part, index) => {
        const props = { key: `${key}:${index}` }
        if (part.kind === 'code') return h('code', props, part.text)
        if (part.kind === 'bold') return h('strong', props, part.text)
        if (part.kind === 'italic') return h('em', props, part.text)
        if (part.kind === 'link') return h('span', { ...props, title: part.href }, `${part.text}${part.href ? ` (${part.href})` : ''}`)
        return h('span', props, part.text)
      })
    }

    function Preview({ source }) {
      const blocks = useMemo(() => parseMarkdown(source), [source])
      return h('article', { className: 'markdown', 'aria-label': translate('preview') }, blocks.length === 0 ? translate('previewEmpty') : blocks.map((block, index) => {
        const props = { key: index }
        if (block.type === 'heading') return h(`h${block.depth}`, props, renderInline(block.text, index))
        if (block.type === 'code') return h('pre', props, h('code', null, block.text))
        if (block.type === 'quote') return h('blockquote', props, renderInline(block.text, index))
        if (block.type === 'list') return h(block.ordered ? 'ol' : 'ul', props, block.items.map((item, j) => h('li', { key: j }, renderInline(item, `${index}:${j}`))))
        if (block.type === 'hr') return h('hr', props)
        return h('p', props, renderInline(block.text, index))
      }))
    }

    function DiffLines({ hunks }) {
      return h('div', { className: 'diff-code' }, hunks.map((hunk, index) => h('div', { key: index },
        h('div', { className: 'diff-range' }, `@@ ${hunk.oldStart},${hunk.oldLines} → ${hunk.newStart},${hunk.newLines} @@`),
        hunk.lines.map((line, j) => h('div', { key: j, className: `diff-line ${line.t === '+' ? 'add' : line.t === '-' ? 'remove' : 'context'}` },
          h('span', { 'aria-hidden': true }, line.t), h('span', null, line.text || ' '))))))
    }

    function GeneratePanel({ gen, generating, error, stale, scope, onToggleHunk, onApply, onDiscard, onRegenerate }) {
      const t = translate
      const global = ['user-global', 'agents-global'].includes(gen?.scope ?? scope)
      const hunks = gen?.hunks ?? []
      return h('section', { id: 'agents-desk-gen', className: 'proposal', 'aria-busy': generating },
        h('div', { className: 'section-heading' },
          h('div', null, h('h2', null, t(global ? 'generateGlobal' : 'generate')),
            gen?.model ? h('p', { className: 'section-subtitle' }, `${t('genModel')}: ${gen.model.provider}/${gen.model.model}`) : null),
          h(Btn, { className: 'icon-btn', icon: 'close', ariaLabel: t('discardProposal'), onClick: onDiscard, disabled: generating })),
        generating ? h(Loader, { label: t('generating') }) : null,
        error ? h(ErrorLine, { text: `${t('generateFailed')}: ${errorText(error, t)}`, onRetry: onRegenerate }) : null,
        stale ? h('div', { className: 'notice warning', role: 'alert' }, h(Icon, { name: 'alert' }), h('p', null, t(hunks.length ? 'genStaleHunks' : 'genStaleDraft'))) : null,
        gen ? h(react.Fragment, null,
          hunks.length ? hunks.map((hunk, index) => h('div', { className: 'hunk', key: index },
            h('label', { className: 'hunk-heading' }, h('input', { type: 'checkbox', checked: gen.accepted[index], disabled: stale, onChange: e => onToggleHunk(index, e.target.checked), 'aria-label': `${t('genHunks')} #${index + 1}` }),
              h('span', { className: 'hunk-title' }, `${t('genHunks')} ${index + 1}`), h('span', { className: 'hunk-index' }, `${hunk.oldStart}–${hunk.oldStart + hunk.oldLines - 1}`)),
            h(DiffLines, { hunks: [hunk] })))
            : h('div', { className: 'hunk' }, h(Preview, { source: gen.draft })),
          gen.facts.length ? h('details', { className: 'rule-details proposal-facts' }, h('summary', null, `${t('genFacts')} · ${gen.facts.length}`),
            h('ul', null, gen.facts.map((fact, index) => h('li', { key: index }, fact)))) : null,
          h('div', { className: 'button-row' },
            h(Btn, { className: 'text-action', icon: 'refresh', onClick: onRegenerate, disabled: stale || generating }, t('regenerate')),
            h(Btn, { tone: 'primary', icon: 'check', onClick: onApply, disabled: generating || (hunks.length > 0 && (stale || !gen.accepted.some(Boolean))) }, t(hunks.length ? 'applySelected' : 'applyDraft')))) : null)
    }

    function ChainPanel({ chain, loading, error, onRefresh, onSelect }) {
      const t = translate
      const budget = chain?.budget
      const assumptions = chain?.assumptions ?? {}
      const rows = chain?.rows ?? []
      const dynamic = chain?.dynamic ?? []
      const limit = budget?.limit ?? DEFAULT_MAX_BYTES
      const used = budget?.used ?? 0
      function rowView(row, index, dynamic = false) {
        const loaded = ['loaded', 'truncated'].includes(row.status)
        return h('li', { className: 'chain-row', key: row.path },
          h('span', { className: 'chain-number' }, dynamic ? h(Icon, { name: 'branch', size: 14 }) : String(index + 1).padStart(2, '0')),
          h('div', { className: 'od-field od-fill' }, h('span', { className: 'chain-name' }, row.display || row.path),
            h('span', { className: 'chain-path' }, row.path),
            loaded ? h('span', { className: 'chain-path' }, `${t('included')} ${formatBytes(row.included)} / ${formatBytes(row.bytes)} · ~${tokenEstimateOf(row)} tok`) : null,
            chainReason(row, assumptions.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES, t) ? h('p', { className: 'chain-reason' }, chainReason(row, assumptions.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES, t)) : null),
          dynamic ? h(Btn, { className: 'text-action', onClick: () => onSelect(row) }, t('editor'))
            : h('span', { className: `chain-status ${loaded ? 'loaded' : 'problem'}` }, h(Icon, { name: loaded ? 'check' : row.status === 'absent' ? 'minus' : 'info', size: 12 }), statusLabel(row.status, t)))
      }
      return h(react.Fragment, null,
        h('div', { className: 'section-heading' }, h('div', null, h('h2', null, t('chainTitle')), h('p', { className: 'section-subtitle' }, t('chainIntro'))),
          h(Btn, { className: 'icon-btn', icon: 'refresh', ariaLabel: t('chainRefresh'), onClick: onRefresh, disabled: loading })),
        loading && !chain ? h(Loader, { label: t('chainLoading') }) : null,
        error ? h(ErrorLine, { text: errorText(error, t), onRetry: onRefresh }) : null,
        budget ? h('div', { className: 'budget' },
          h('div', { className: 'od-row' }, h('span', { className: 'budget-title od-fill' }, t('budget')), h('span', { className: 'scope-badge' }, t('staticRecompute'))),
          h('div', { className: 'od-row budget-values' }, h('div', { className: 'budget-number od-fill' }, formatBytes(used), h('small', null, ` / ${formatBytes(limit)}`)), h('span', { className: 'budget-percent' }, `${budgetPercent(used, limit)}%`)),
          h('progress', { className: 'meter', value: used, max: limit, 'aria-label': t('budgetMeter') }),
          h('div', { className: 'budget-meta' }, h('span', null, `${t('budgetRemaining')} ${formatBytes(budget.remaining ?? limit - used)}`), h('span', null, `~${budget.renderedTokens ?? Math.ceil(used / 4)} tokens`))) : null,
        chain ? h(react.Fragment, null,
          h('h3', { className: 'section-label' }, t('chainBaseline')),
          h('ol', { className: 'chain-list' }, rows.map((row, i) => rowView(row, i))),
          h('h3', { className: 'section-label' }, t('chainDynamic')),
          dynamic.length ? h('ol', { className: 'chain-list' }, dynamic.map((row, i) => rowView(row, i, true))) : h('p', { className: 'section-subtitle dynamic-empty' }, t('chainDynamicEmpty')),
          h('details', { className: 'rule-details' }, h('summary', null, t('chainLimitations')),
            h('p', null, t('chainAssumptions'), `${t('assumptionRenderBudget')} ${formatBytes(limit)} · ${t('assumptionSourceCap')} ${formatBytes(assumptions.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES)}`),
            h('p', null, (assumptions.instructionFileCandidates ?? DEFAULT_CANDIDATES).join(' → ')),
            h('p', null, t('assumptionCaveat')), h('p', null, t('chainTokensNote')),
            chain.scannedAt ? h('p', null, `${t('chainScanned')} ${formatTime(chain.scannedAt)} · ${t('chainDirs')} ${chain.scannedDirs ?? '—'}`) : null))
          : !loading && !error ? h('div', { className: 'empty' }, t('chainEmpty')) : null)
    }

    function HistoryPanel({ history, loading, error, onRefresh, busy, rollingBack, diff, diffLoading, diffError, onViewDiff, onRetryDiff, onCloseDiff, onRollback, onEditor }) {
      const t = translate
      const rows = history ?? []
      if (diff || diffLoading || diffError) return h(react.Fragment, null,
        h(Btn, { className: 'text-action back-action', icon: 'back', ariaLabel: t('close'), onClick: onCloseDiff }, t('backHistory')),
        h('div', { className: 'section-heading' }, h('h2', null, t('diffTitle'))),
        diffLoading ? h(Loader, { label: t('diffLoading') }) : diffError ? h(ErrorLine, { text: errorText(diffError, t), onRetry: onRetryDiff }) :
          diff.hunks.length ? h('div', { className: 'editor-card' }, h(DiffLines, { hunks: diff.hunks })) : h('div', { className: 'empty' }, t('diffEmpty')))
      return h(react.Fragment, null,
        h('div', { className: 'section-heading' }, h('div', null, h('h2', null, t('historyTitle')), h('p', { className: 'section-subtitle' }, t('historyExplanation'))),
          h(Btn, { className: 'icon-btn', icon: 'refresh', ariaLabel: t('historyRefresh'), onClick: onRefresh, disabled: loading || busy })),
        loading ? h(Loader, { label: t('historyLoading') }) : null,
        rollingBack ? h(Loader, { label: t('rollingBack') }) : null,
        error ? h(ErrorLine, { text: errorText(error, t), onRetry: onRefresh }) : null,
        h('ol', { className: 'history-list' }, rows.map(row => h('li', { className: 'history-item', key: row.backup },
          h('span', { className: 'history-symbol' }, h(Icon, { name: row.source === 'rollback' ? 'history' : 'clock', size: 16 })),
          h('div', { className: 'od-field od-fill' }, h('span', { className: 'history-title', title: row.backup }, historySourceLabel(row.source, t) || row.name),
            h('span', { className: 'history-time' }, formatTime(row.at)), h('span', { className: 'file-option-path' }, row.name),
            h('div', { className: 'button-row' },
              h(Btn, { className: 'text-action', icon: 'diff', onClick: () => onViewDiff(row), disabled: busy }, t('viewDiff')),
              h(Btn, { className: 'text-action', icon: 'history', onClick: () => onRollback(row), disabled: busy }, t('rollback')))),
          h('span', { className: 'history-size' }, formatBytes(row.bytes))))),
        !loading && !error && !rows.length ? h('div', { className: 'empty' }, h(Icon, { name: 'history', size: 32 }), h('h3', null, t('historyEmpty')),
          h('p', null, t('historyExplanation')), h(Btn, { onClick: onEditor }, t('backEditor'))) : null)
    }

    // ---------- settings section ----------

    function DeskSection() {
      const t = translate
      const [tab, setTab] = useState('editor')
      const [workspaceOpen, setWorkspaceOpen] = useState(false)
      const [filesOpen, setFilesOpen] = useState(false)
      const [fileFilter, setFileFilter] = useState('')

      const [workspaces, setWorkspaces] = useState([])
      const [health, setHealth] = useState(null)
      const [bootState, setBootState] = useState('loading')
      const [bootError, setBootError] = useState(null)
      const [cwd, setCwd] = useState('')

      const [scopes, setScopes] = useState(null)
      const [scopesLoading, setScopesLoading] = useState(false)
      const [scopesError, setScopesError] = useState(null)

      const [selectedPath, setSelectedPath] = useState(null)
      const [file, setFile] = useState(null)
      const [fileLoading, setFileLoading] = useState(false)
      const [fileError, setFileError] = useState(null)
      const [draft, setDraft] = useState('')
      const [mode, setMode] = useState('edit')

      const [notice, setNotice] = useState(null)
      const [pending, setPending] = useState(null)
      const [saving, setSaving] = useState(false)
      const [generating, setGenerating] = useState(false)
      const [gen, setGen] = useState(null)
      const [genError, setGenError] = useState(null)
      const [rollingBack, setRollingBack] = useState(false)

      const [chain, setChain] = useState(null)
      const [chainLoading, setChainLoading] = useState(false)
      const [chainError, setChainError] = useState(null)

      const [history, setHistory] = useState(null)
      const [historyLoading, setHistoryLoading] = useState(false)
      const [historyError, setHistoryError] = useState(null)
      const [diff, setDiff] = useState(null)
      const [diffLoading, setDiffLoading] = useState(false)
      const [diffError, setDiffError] = useState(null)

      // Request bookkeeping: every fetch gets a token, and a newer request for
      // the same resource (or a switch that cancels it) makes the old response
      // a no-op. AbortController additionally stops the network work.
      const requests = useRef({})
      const requestSerial = useRef(0)
      const mutationLock = useRef(false)
      const live = useRef({})
      live.current = {
        cwd, file, draft, selectedPath, gen, scopes,
        saving, generating, rollingBack, fileLoading,
      }

      const dirty = file !== null && draft !== (typeof file.content === 'string' ? file.content : '')
      const busy = saving || generating || rollingBack
      const llmUnavailable = serviceFlag(health, 'llm') === false || serviceFlag(health, 'agentDefaultModel') === false

      const begin = useCallback((key) => {
        const prior = requests.current[key]
        if (prior !== undefined && prior !== null && prior.controller !== undefined) {
          try { prior.controller.abort() } catch { /* the request already settled */ }
        }
        const controller = typeof AbortController === 'function' ? new AbortController() : undefined
        requestSerial.current += 1
        const entry = { id: requestSerial.current, controller }
        requests.current[key] = entry
        return {
          signal: controller === undefined ? undefined : controller.signal,
          isCurrent: () => requests.current[key] === entry,
        }
      }, [])

      const cancel = useCallback((key) => {
        const prior = requests.current[key]
        if (prior !== undefined && prior !== null && prior.controller !== undefined) {
          try { prior.controller.abort() } catch { /* the request already settled */ }
        }
        requestSerial.current += 1
        requests.current[key] = { id: requestSerial.current, controller: undefined }
      }, [])

      useEffect(() => () => {
        Object.keys(requests.current).forEach((key) => {
          const entry = requests.current[key]
          if (entry !== undefined && entry !== null && entry.controller !== undefined) {
            try { entry.controller.abort() } catch { /* nothing left to cancel */ }
          }
        })
      }, [])

      const loadWorkspaces = useCallback(() => {
        const request = begin('workspaces')
        setBootState('loading')
        setBootError(null)
        call('/workspaces', { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : [])
            setBootState('ready')
            const preferred = typeof data.defaultCwd === 'string' && data.defaultCwd !== ''
              ? data.defaultCwd
              : typeof data.homes?.home === 'string' && data.homes.home !== ''
                ? data.homes.home
                : typeof data.homes?.dsh === 'string' ? data.homes.dsh : ''
            setCwd((current) => (current !== '' ? current : preferred))
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setBootError(error)
            setBootState('error')
          })
      }, [begin])

      useEffect(() => {
        loadWorkspaces()
        const request = begin('health')
        call('/health', { signal: request.signal })
          .then((data) => { if (request.isCurrent()) setHealth(data) })
          .catch(() => { /* optional capability probe: the panel still works without it */ })
      }, [loadWorkspaces, begin])

      const loadScopes = useCallback((target) => {
        if (typeof target !== 'string' || target === '') {
          setScopes([])
          setScopesError(null)
          return
        }
        const request = begin('scopes')
        setScopesLoading(true)
        setScopesError(null)
        call(`/scopes?cwd=${encodeURIComponent(target)}`, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setScopes(Array.isArray(data.scopes) ? data.scopes : [])
            setScopesLoading(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setScopesError(error)
            setScopesLoading(false)
          })
      }, [begin])

      const loadChain = useCallback((target) => {
        if (typeof target !== 'string' || target === '') return
        const request = begin('chain')
        setChainLoading(true)
        setChainError(null)
        call(`/chain?cwd=${encodeURIComponent(target)}`, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setChain(data)
            setChainLoading(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setChainError(error)
            setChainLoading(false)
          })
      }, [begin])

      useEffect(() => {
        if (cwd === '') return
        loadScopes(cwd)
        loadChain(cwd)
      }, [cwd, loadScopes, loadChain])

      const loadHistory = useCallback((pathOverride, cwdOverride) => {
        const current = live.current
        const targetPath = typeof pathOverride === 'string' ? pathOverride : current.file !== null ? current.file.path : ''
        const targetCwd = typeof cwdOverride === 'string' ? cwdOverride : current.cwd
        if (targetPath === '' || targetCwd === '') return
        const request = begin('history')
        setHistoryLoading(true)
        setHistoryError(null)
        call(`/history?cwd=${encodeURIComponent(targetCwd)}&path=${encodeURIComponent(targetPath)}`, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setHistory(Array.isArray(data.backups) ? data.backups : [])
            setHistoryLoading(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setHistoryError(error)
            setHistoryLoading(false)
          })
      }, [begin])

      const lastDiffBackup = useRef(null)

      const loadDiff = useCallback((backup) => {
        const current = live.current
        if (current.file === null || backup === null || backup === undefined || typeof backup.backup !== 'string') return
        lastDiffBackup.current = backup
        const targetCwd = current.cwd
        const targetPath = current.file.path
        const request = begin('diff')
        setDiffLoading(true)
        setDiffError(null)
        setDiff(null)
        call(`/history/diff?cwd=${encodeURIComponent(targetCwd)}&path=${encodeURIComponent(targetPath)}&backup=${encodeURIComponent(backup.backup)}`, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setDiff({ ...data, backup: typeof data.backup === 'string' ? data.backup : backup.backup })
            setDiffLoading(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setDiffError(error)
            setDiffLoading(false)
          })
      }, [begin])

      const loadFile = useCallback((scope) => {
        const targetCwd = live.current.cwd
        if (scope === null || scope === undefined || typeof scope.path !== 'string' || targetCwd === '') return
        const request = begin('file')
        cancel('history')
        cancel('diff')
        cancel('generate')
        setSelectedPath(scope.path)
        setTab('editor')
        setHistoryLoading(false)
        setDiffLoading(false)
        setFile(null)
        setFileError(null)
        setFileLoading(true)
        setDraft('')
        setMode('edit')
        setGen(null)
        setGenError(null)
        setDiff(null)
        setDiffError(null)
        setHistory(null)
        setHistoryError(null)
        setNotice(null)
        call(`/file?cwd=${encodeURIComponent(targetCwd)}&path=${encodeURIComponent(scope.path)}`, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            const content = typeof data.content === 'string' ? data.content : ''
            const loaded = {
              path: typeof data.path === 'string' ? data.path : scope.path,
              exists: data.exists === true,
              content,
              version: data.version !== undefined ? data.version : null,
              bytes: typeof data.bytes === 'number' ? data.bytes : content.length,
            }
            setFile(loaded)
            setDraft(loaded.content)
            setFileLoading(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setFileError(error)
            setFileLoading(false)
          })
      }, [begin, cancel])

      const applyWorkspace = useCallback((nextCwd) => {
        cancel('file')
        cancel('history')
        cancel('diff')
        cancel('generate')
        cancel('scopes')
        cancel('chain')
        setCwd(nextCwd)
        setTab('editor')
        setFilesOpen(false)
        setWorkspaceOpen(false)
        setFileFilter('')
        setHistoryLoading(false)
        setDiffLoading(false)
        setSelectedPath(null)
        setFile(null)
        setDraft('')
        setFileLoading(false)
        setFileError(null)
        setMode('edit')
        setGen(null)
        setGenError(null)
        setDiff(null)
        setDiffError(null)
        setHistory(null)
        setHistoryError(null)
        setChain(null)
        setChainError(null)
        setScopes(null)
        setScopesError(null)
        setNotice(null)
        setPending(null)
      }, [cancel])

      const selectScope = useCallback((scope) => {
        const current = live.current
        if (scope === null || scope === undefined) return
        if (current.saving || current.generating || current.rollingBack || current.fileLoading) return
        if (scope.path === current.selectedPath) return
        const currentDirty = current.file !== null && current.draft !== (typeof current.file.content === 'string' ? current.file.content : '')
        if (currentDirty) {
          setPending({
            kind: 'switch-file',
            scope,
            message: `${t('confirmSwitchFile')} (${scope.display || scope.path})`,
            confirmLabel: t('discardAndContinue'),
          })
          return
        }
        loadFile(scope)
      }, [loadFile])

      const requestWorkspace = useCallback((nextCwd) => {
        const current = live.current
        if (typeof nextCwd !== 'string' || nextCwd === '' || nextCwd === current.cwd) return
        if (current.saving || current.generating || current.rollingBack) return
        const currentDirty = current.file !== null && current.draft !== (typeof current.file.content === 'string' ? current.file.content : '')
        if (currentDirty) {
          setPending({ kind: 'switch-workspace', cwd: nextCwd, message: t('confirmSwitchWorkspace'), confirmLabel: t('discardAndContinue') })
          return
        }
        applyWorkspace(nextCwd)
      }, [applyWorkspace])

      const reloadSelected = useCallback(() => {
        const current = live.current
        if (current.file !== null) {
          loadFile({ path: current.file.path, display: current.file.path })
          return
        }
        if (typeof current.selectedPath === 'string' && current.selectedPath !== '') {
          loadFile({ path: current.selectedPath, display: current.selectedPath })
        }
      }, [loadFile])

      const requestReload = useCallback(() => {
        const current = live.current
        if (current.file === null || current.saving || current.generating || current.rollingBack) return
        const currentDirty = current.draft !== (typeof current.file.content === 'string' ? current.file.content : '')
        if (currentDirty) {
          setPending({ kind: 'reload', message: t('confirmReload'), confirmLabel: t('discardAndContinue') })
          return
        }
        reloadSelected()
      }, [reloadSelected])

      const discardDraft = useCallback(() => {
        const current = live.current
        if (current.file === null) return
        setDraft(typeof current.file.content === 'string' ? current.file.content : '')
        setNotice(null)
      }, [])

      const save = useCallback(() => {
        const current = live.current
        const fileNow = current.file
        if (fileNow === null || current.saving || current.generating || current.rollingBack) return
        const content = current.draft
        if (content === (typeof fileNow.content === 'string' ? fileNow.content : '')) return
        if (mutationLock.current === true) return
        mutationLock.current = true
        const targetCwd = current.cwd
        const targetPath = fileNow.path
        const request = begin('save')
        setSaving(true)
        setNotice(null)
        postJson('/file', {
          cwd: targetCwd,
          path: targetPath,
          content,
          version: fileNow.exists === true && fileNow.version !== null && fileNow.version !== undefined ? fileNow.version : undefined,
          create: fileNow.exists !== true,
        }, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            const version = data.version !== undefined ? data.version : undefined
            const bytes = typeof data.bytes === 'number' ? data.bytes : undefined
            setFile((prev) => prev !== null && prev.path === targetPath
              ? { ...prev, exists: true, content, version: version !== undefined ? version : prev.version, bytes: bytes !== undefined ? bytes : prev.bytes }
              : prev)
            if (typeof data.backupError === 'string' && data.backupError !== '') {
              setNotice({ kind: 'warn', text: `${t('savedNoBackup')}${data.backupError}` })
            } else {
              setNotice({ kind: 'ok', text: t('saved') })
            }
            loadScopes(targetCwd)
            loadChain(targetCwd)
            loadHistory(targetPath, targetCwd)
            setSaving(false)
            if (version === undefined) {
              // The host did not return a version (older host): re-read so the
              // next overwrite still carries a valid token.
              call(`/file?cwd=${encodeURIComponent(targetCwd)}&path=${encodeURIComponent(targetPath)}`, { signal: request.signal })
                .then((fresh) => {
                  if (!request.isCurrent()) return
                  setFile((prev) => prev !== null && prev.path === targetPath
                    ? {
                      ...prev,
                      version: fresh.version !== undefined ? fresh.version : prev.version,
                      bytes: typeof fresh.bytes === 'number' ? fresh.bytes : prev.bytes,
                    }
                    : prev)
                })
                .catch(() => { /* the saved content is still valid; the next reload fills the token */ })
            }
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setSaving(false)
            const conflict = error?.code === 'version/stale' || error?.status === 409
            setNotice({ kind: 'err', text: conflict ? t('conflict') : `${t('saveFailed')}: ${errorText(error, t)}` })
          })
          .finally(() => { mutationLock.current = false })
      }, [begin, loadScopes, loadChain, loadHistory])

      const rollback = useCallback((backup) => {
        const current = live.current
        if (current.file === null || current.rollingBack || current.saving || current.generating) return
        if (backup === null || backup === undefined || typeof backup.backup !== 'string') return
        if (mutationLock.current === true) return
        mutationLock.current = true
        const targetCwd = current.cwd
        const targetPath = current.file.path
        const request = begin('rollback')
        setRollingBack(true)
        setNotice(null)
        setPending(null)
        postJson('/rollback', {
          cwd: targetCwd, path: targetPath, backup: backup.backup,
          version: current.file.exists === true ? current.file.version : undefined,
        }, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            setDiff(null)
            if (typeof data.backupError === 'string' && data.backupError !== '') {
              setNotice({ kind: 'warn', text: `${t('rollbackDoneNoBackup')}${data.backupError}` })
            } else {
              setNotice({ kind: 'ok', text: t('rollbackDone') })
            }
            return call(`/file?cwd=${encodeURIComponent(targetCwd)}&path=${encodeURIComponent(targetPath)}`, { signal: request.signal })
              .then((loaded) => {
                if (!request.isCurrent()) return
                const content = typeof loaded.content === 'string' ? loaded.content : ''
                setFile({
                  path: typeof loaded.path === 'string' ? loaded.path : targetPath,
                  exists: loaded.exists === true,
                  content,
                  version: loaded.version !== undefined ? loaded.version : null,
                  bytes: typeof loaded.bytes === 'number' ? loaded.bytes : content.length,
                })
                setDraft(content)
                setGen(null)
                setGenError(null)
              })
          })
          .then(() => {
            if (!request.isCurrent()) return
            loadScopes(targetCwd)
            loadChain(targetCwd)
            loadHistory(targetPath, targetCwd)
            setRollingBack(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setRollingBack(false)
            setNotice({ kind: 'err', text: `${t('rollbackFailed')}: ${errorText(error, t)}` })
          })
          .finally(() => { mutationLock.current = false })
      }, [begin, loadScopes, loadChain, loadHistory])

      const requestRollback = useCallback((backup) => {
        setPending({
          kind: 'rollback',
          backup,
          message: `${t('confirmRollback')} (${backup?.name || backup?.backup || ''})`,
          confirmLabel: t('rollback'),
        })
      }, [])

      const generate = useCallback(() => {
        const current = live.current
        const fileNow = current.file
        if (fileNow === null || current.generating || current.saving || current.rollingBack) return
        const diskContent = typeof fileNow.content === 'string' ? fileNow.content : ''
        if (current.draft !== diskContent) {
          setNotice({ kind: 'warn', text: t('generateNeedsClean') })
          return
        }
        if (llmUnavailable === true) {
          setNotice({ kind: 'err', text: t('healthLlmUnavailable') })
          return
        }
        if (mutationLock.current === true) return
        mutationLock.current = true
        const targetCwd = current.cwd
        const targetPath = fileNow.path
        const request = begin('generate')
        setGenerating(true)
        setGenError(null)
        setGen(null)
        postJson('/generate', { cwd: targetCwd, path: targetPath }, { signal: request.signal })
          .then((data) => {
            if (!request.isCurrent()) return
            const target = data.target !== null && typeof data.target === 'object' ? data.target : {}
            const baseText = typeof target.content === 'string'
              ? target.content
              : typeof data.baseContent === 'string' ? data.baseContent : diskContent
            const baseVersion = target.version !== undefined
              ? target.version
              : data.baseVersion !== undefined ? data.baseVersion : fileNow.version
            const hunks = Array.isArray(data.hunks) ? data.hunks : []
            setGen({
              path: targetPath,
              cwd: targetCwd,
              scope: data.scope,
              baseText,
              baseVersion: baseVersion !== undefined ? baseVersion : null,
              draft: typeof data.draft === 'string' ? data.draft : '',
              facts: Array.isArray(data.facts) ? data.facts : [],
              hunks,
              accepted: hunks.map(() => true),
              model: data.model !== undefined ? data.model : null,
            })
            setGenerating(false)
          })
          .catch((error) => {
            if (isAbort(error) || !request.isCurrent()) return
            setGenerating(false)
            setGenError(error)
          })
          .finally(() => { mutationLock.current = false })
      }, [begin, llmUnavailable])

      const toggleHunk = useCallback((index, checked) => {
        setGen((prev) => prev === null
          ? prev
          : { ...prev, accepted: prev.accepted.map((value, i) => (i === index ? checked === true : value)) })
      }, [])

      const applyWholeDraft = useCallback(() => {
        const proposal = live.current.gen
        if (proposal !== null && proposal !== undefined) {
          setDraft(proposal.draft)
          setNotice({ kind: 'ok', text: t('draftReady') })
          setGen(null)
        }
        setPending(null)
      }, [])

      const applyGen = useCallback(() => {
        const current = live.current
        const proposal = current.gen
        if (proposal === null || proposal === undefined) return
        const stale = current.draft !== proposal.baseText
        if (stale === true && proposal.hunks.length > 0) {
          setNotice({ kind: 'err', text: t('genStaleBlocked') })
          return
        }
        if (stale === true) {
          setPending({ kind: 'apply-stale-draft', message: t('confirmApplyStale'), confirmLabel: t('applyDraft') })
          return
        }
        if (proposal.hunks.length > 0) {
          if (hunkConflicts(current.draft, proposal.hunks).length > 0) {
            setNotice({ kind: 'err', text: t('genStaleBlocked') })
            return
          }
          setDraft(applyHunks(current.draft, proposal.hunks, proposal.accepted))
          setNotice({ kind: 'ok', text: t('applied') })
        } else {
          setDraft(proposal.draft)
          setNotice({ kind: 'ok', text: t('draftReady') })
        }
        setGen(null)
      }, [])

      const confirmPending = useCallback(() => {
        const action = pending
        if (action === null || action === undefined) return
        setPending(null)
        if (action.kind === 'switch-file') loadFile(action.scope)
        else if (action.kind === 'switch-workspace') applyWorkspace(action.cwd)
        else if (action.kind === 'reload') reloadSelected()
        else if (action.kind === 'rollback') rollback(action.backup)
        else if (action.kind === 'apply-stale-draft') applyWholeDraft()
      }, [pending, loadFile, applyWorkspace, reloadSelected, rollback, applyWholeDraft])

      // Ctrl/Cmd+S saves; Escape dismisses a pending confirmation.
      const saveRef = useRef(save)
      saveRef.current = save
      const pendingRef = useRef(pending)
      pendingRef.current = pending
      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.defaultPrevented === true) return
          if ((event.ctrlKey === true || event.metaKey === true) && event.altKey !== true && (event.key === 's' || event.key === 'S')) {
            event.preventDefault()
            if (pendingRef.current !== null) return
            saveRef.current()
            return
          }
          if (event.key === 'Escape') {
            setFilesOpen(false)
            setWorkspaceOpen(false)
          }
          if (event.key === 'Escape' && pendingRef.current !== null) {
            event.preventDefault()
            setPending(null)
          }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [])

      useEffect(() => {
        if (dirty !== true) return undefined
        const onBeforeUnload = (event) => {
          event.preventDefault()
          event.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
      }, [dirty])

      const genVisible = gen !== null
      useEffect(() => {
        if (genVisible !== true) return
        const node = document.getElementById('agents-desk-gen')
        if (node !== null && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' })
      }, [genVisible])

      const selectedScope = useMemo(() => {
        if (!Array.isArray(scopes) || selectedPath === null) return null
        return scopes.find((scope) => scope.path === selectedPath) || null
      }, [scopes, selectedPath])
      const isGlobal = selectedScope?.kind === 'user-global' || selectedScope?.kind === 'agents-global'
      const genStale = gen !== null && draft !== gen.baseText
      const canSave = dirty === true && busy !== true && fileLoading !== true
      const canGenerate = file !== null && busy !== true && dirty !== true && llmUnavailable !== true

      const groups = useMemo(() => {
        const visible = (Array.isArray(scopes) ? scopes : []).filter((scope) => scope.exists === true || scope.name === 'AGENTS.md')
        return {
          global: visible.filter((scope) => scope.kind === 'user-global' || scope.kind === 'agents-global'),
          project: visible.filter((scope) => scope.kind === 'project'),
          subdir: visible.filter((scope) => scope.kind === 'subdir'),
        }
      }, [scopes])

      useEffect(() => {
        if (selectedPath !== null || !scopes?.length || fileLoading) return
        const preferred = scopes.find(scope => scope.kind === 'project' && scope.name === 'AGENTS.md') || scopes[0]
        loadFile(preferred)
      }, [scopes, selectedPath, fileLoading, loadFile])

      useEffect(() => {
        if (tab === 'history' && file?.path && cwd) loadHistory(file.path, cwd)
      }, [tab, file?.path, cwd, loadHistory])

      function renderWorkspaceBar() {
        const current = workspaces.find(w => w.path === cwd)
        const title = current?.title || cwd.split(/[\\/]/).filter(Boolean).pop() || t('workspace')
        return h('section', { className: 'context', 'aria-label': t('workspace') },
          h('div', { className: 'context-row' },
            h('button', { type: 'button', className: 'workspace-control', disabled: busy || bootState === 'loading', 'aria-expanded': workspaceOpen, 'aria-controls': 'agents-desk-workspace-picker', 'aria-label': t('workspace'), onClick: () => { setWorkspaceOpen(!workspaceOpen); setFilesOpen(false) } },
              h('span', { className: 'workspace-icon' }, h(Icon, { name: 'folder', size: 20 })),
              h('span', { className: 'od-field od-fill' }, h('span', { className: 'workspace-name od-truncate' }, title), h('span', { className: 'workspace-path od-truncate', title: cwd }, cwd || t('noWorkspace'))),
              h(Icon, { name: 'down', className: 'chevron' })),
            h(Btn, { className: 'icon-btn workspace-refresh', icon: 'refresh', ariaLabel: t('refresh'), disabled: busy, onClick: () => { loadWorkspaces(); loadScopes(cwd); loadChain(cwd) } })),
          workspaceOpen ? h('div', { id: 'agents-desk-workspace-picker', className: 'picker' }, workspaces.length ? workspaces.map(w =>
            h('button', { type: 'button', className: 'pick-option', key: w.id || w.path, 'aria-current': w.path === cwd ? 'true' : undefined, onClick: () => { requestWorkspace(w.path); setWorkspaceOpen(false) } },
              h('span', { className: 'od-field od-fill' }, h('span', { className: 'workspace-name' }, w.title || w.path.split(/[\\/]/).pop()), h('span', { className: 'file-option-path' }, w.path)),
              w.path === cwd ? h(Icon, { name: 'check', className: 'check', size: 16 }) : null)) : h('p', { className: 'section-subtitle' }, t('noWorkspace'))) : null,
          h('div', { className: 'file-selector' },
            h('button', { type: 'button', className: 'file-toggle', 'aria-label': t('selectFile'), 'aria-expanded': filesOpen, 'aria-controls': 'agents-desk-file-picker', disabled: busy || fileLoading, onClick: () => { setFilesOpen(!filesOpen); setWorkspaceOpen(false) } },
              h(Icon, { name: 'file', size: 16 }), h('span', { className: 'file-label od-truncate od-fill' }, selectedScope?.display || t('selectFile')),
              h('span', { className: 'file-total' }, `${Object.values(groups).flat().length} ${t('files')}`), h(Icon, { name: 'down', size: 16, className: 'chevron' })),
            filesOpen ? h('div', { id: 'agents-desk-file-picker', className: 'picker' },
              h('label', { className: 'search-label', htmlFor: 'agents-desk-file-search' }, t('filterFiles')),
              h('input', { id: 'agents-desk-file-search', className: 'picker-search', type: 'search', autoComplete: 'off', autoFocus: true, placeholder: t('filterPlaceholder'), value: fileFilter, onChange: e => setFileFilter(e.target.value) }),
              renderScopeList()) : null),
          scopesError ? h(ErrorLine, { text: errorText(scopesError, t), onRetry: () => loadScopes(cwd) }) : null)
      }

      function renderScopeList() {
        const filter = fileFilter.trim().toLowerCase()
        const sections = [['groupGlobal', groups.global], ['groupProject', groups.project], ['groupSubdir', groups.subdir]]
        const result = sections.flatMap(([key, list]) => {
          const matches = list.filter(scope => `${scope.display} ${scope.path}`.toLowerCase().includes(filter))
          if (!matches.length) return []
          return [h('div', { key, className: 'group-title' }, t(key)), ...matches.map(scope =>
            h('button', { type: 'button', key: scope.path, className: 'pick-option', 'aria-current': selectedPath === scope.path ? 'true' : undefined, disabled: busy || fileLoading, onClick: () => {
              selectScope(scope)
              setFilesOpen(false)
              setFileFilter('')
            } }, h(Icon, { name: scope.kind.includes('global') ? 'globe' : scope.kind === 'subdir' ? 'branch' : 'file', size: 16 }),
              h('span', { className: 'od-field od-fill' }, h('span', { className: 'file-option-name' }, scope.display || scope.name), h('span', { className: 'file-option-path' }, scope.path)),
              !scope.exists ? h('span', { className: 'uncreated' }, t('notExist')) : null,
              selectedPath === scope.path ? h(Icon, { name: 'check', size: 16, className: 'check' }) : null))]
        })
        return h('nav', { className: 'pick-options', 'aria-label': t('selectFile') }, result.length ? result : scopesLoading ? h(Loader, { label: t('loading') }) : h('div', { className: 'empty' }, t('noScopes')))
      }

      function renderEditor() {
        if (fileLoading) return h(Loader, { label: t('loading') })
        if (fileError) return h(ErrorLine, { text: errorText(fileError, t), onRetry: reloadSelected })
        if (!file) return h('div', { className: 'empty' }, h(Icon, { name: 'file', size: 32 }), h('h3', null, t('empty')), h('p', null, t('emptyHint')))
        const display = selectedScope?.display || file.path.split(/[\\/]/).pop()
        const scopeLabel = isGlobal ? t('groupGlobal') : selectedScope?.kind === 'subdir' ? t('groupSubdir') : t('groupProject')
        const description = isGlobal ? t('globalDescription') : selectedScope?.kind === 'subdir' ? t('nestedDescription') : t('projectDescription')
        return h(react.Fragment, null,
          h('div', { className: 'file-head' }, h('span', { className: 'file-symbol' }, h(Icon, { name: isGlobal ? 'globe' : 'file', size: 22 })),
            h('div', { className: 'od-field od-fill' }, h('div', { className: 'od-cluster' }, h('h2', { className: 'file-name' }, file.path.split(/[\\/]/).pop()), h('span', { className: 'scope-badge active' }, scopeLabel)), h('p', { className: 'file-description' }, description)),
            h(Btn, { className: 'icon-btn', icon: 'refresh', ariaLabel: t('reload'), title: t('reload'), onClick: requestReload, disabled: busy })),
          h('details', { className: 'filepath-detail' }, h('summary', null, `${t('filePath')} · ${display}`), h('p', null, file.path)),
          isGlobal ? h('div', { className: 'notice' }, h(Icon, { name: 'globe', size: 16 }), h('p', null, t('generateGlobalHint'))) : null,
          !file.exists ? h('div', { className: 'notice' }, h(Icon, { name: 'info', size: 16 }), h('p', null, t('fileMissing'))) : null,
          h('div', { className: 'editor-card' },
            h('div', { className: 'editor-toolbar' },
              h('div', { className: 'segmented', role: 'group', 'aria-label': `${t('editor')} / ${t('preview')}` },
                ['edit', 'preview'].map(value => h(Btn, { key: value, className: 'segment', icon: value === 'edit' ? 'code' : 'eye', 'aria-pressed': mode === value, onClick: () => setMode(value) }, t(value === 'edit' ? 'editor' : 'preview')))),
              h(Btn, { className: 'text-action accent', icon: 'spark', disabled: !canGenerate, onClick: generate, title: dirty ? t('generateNeedsClean') : llmUnavailable ? t('healthLlmUnavailable') : t(isGlobal ? 'generateGlobalHint' : 'generateHint') }, t(generating ? 'generating' : isGlobal ? 'generateGlobal' : 'generate'))),
            mode === 'preview' ? h(Preview, { source: draft }) : h('textarea', { className: 'editor-input', 'aria-label': display, value: draft, onChange: e => setDraft(e.target.value), disabled: busy, spellCheck: false }),
            h('div', { className: 'editor-meta' }, h('div', { className: 'od-row' }, h('span', { className: `status-dot${dirty ? ' dirty' : ''}`, 'aria-hidden': true }), h('span', null, t(dirty ? 'unsaved' : file.exists ? 'synced' : 'notExist'))),
              h('span', { className: 'od-nowrap' }, `${draft.split('\n').length} ${t('lines')} · ${formatBytes(new TextEncoder().encode(draft).length)}`))),
          h('div', { className: 'savebar' }, h('div', { className: 'od-field' }, h('span', { className: 'save-state' }, t(dirty ? 'dirtyHint' : file.exists ? 'allSaved' : 'fileMissing')),
            h('span', { className: 'save-help' }, h(Icon, { name: 'shield', size: 12 }), h('span', null, t('versionProtection')), h('kbd', null, '⌘ / Ctrl S'))),
            h('div', { className: 'button-row' }, dirty ? h(Btn, { className: 'text-action discard-action', onClick: discardDraft, disabled: busy }, t('discard')) : null,
              h(Btn, { tone: 'primary', icon: 'check', onClick: save, disabled: !canSave }, t(saving ? 'saving' : 'save')))),
          dirty ? h('p', { className: 'section-subtitle' }, t('generateNeedsClean')) : null,
          genVisible || generating || genError ? h(GeneratePanel, { gen, scope: selectedScope?.kind, generating, error: genError, stale: genStale, onToggleHunk: toggleHunk, onApply: applyGen,
            onDiscard: () => { setGen(null); setGenError(null) }, onRegenerate: generate }) : null,
          h('details', { className: 'scope-note' }, h('summary', null, h(Icon, { name: 'info', size: 16 }), h('span', null, t('whenLoaded')), h(Icon, { name: 'down', size: 16, className: 'chevron' })),
            h('p', null, t(selectedScope?.kind === 'subdir' ? 'reasonDynamic' : 'loadingExplanation')),
            h(Btn, { className: 'text-action accent', icon: 'arrow', onClick: () => changeTab('chain') }, t('chainTitle'))))
      }

      function closeDiff() {
        cancel('diff')
        setDiff(null)
        setDiffError(null)
        setDiffLoading(false)
        lastDiffBackup.current = null
      }

      function renderHistory() {
        if (!file) return h('div', { className: 'empty' }, t('empty'))
        return h(HistoryPanel, { history, loading: historyLoading, error: historyError, onRefresh: () => loadHistory(file.path, cwd), busy, rollingBack, diff, diffLoading, diffError, onViewDiff: loadDiff,
          onRetryDiff: () => { if (lastDiffBackup.current) loadDiff(lastDiffBackup.current) }, onCloseDiff: closeDiff, onRollback: requestRollback, onEditor: () => changeTab('editor') })
      }

      function changeTab(next) {
        if (mutationLock.current) return
        setTab(next)
        setFilesOpen(false)
        setWorkspaceOpen(false)
      }

      const tabNames = ['editor', 'chain', 'history']
      const counts = { chain: chain?.rows?.filter(row => ['loaded', 'truncated'].includes(row.status)).length, history: history?.length }
      return h('div', { className: 'app', 'data-agents-desk': '' },
        h('style', null, CSS),
        h('header', { className: 'brandbar' }, h('div', { className: 'brand' }, h('span', { className: 'brandmark' }, h(Icon, { name: 'layers' })), h('span', null, 'Agents Desk')),
          h('div', { className: 'od-row' }, health?.version ? h('span', { className: 'version' }, `v${health.version}`) : null,
            h(Btn, { className: 'icon-btn', icon: 'help', ariaLabel: t('help'), onClick: () => setPending({ kind: 'help', message: t('helpContent'), confirmLabel: t('close') }) }))),
        h('section', { className: 'intro' }, h('p', { className: 'eyebrow' }, 'WORKSPACE INSTRUCTIONS'), h('h1', null, t('label')), h('p', null, t('designIntro'))),
        renderWorkspaceBar(),
        h('nav', { className: 'tabs', role: 'tablist', 'aria-label': t('views'), onKeyDown: e => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || busy) return
          e.preventDefault()
          const index = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (tabNames.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3
          changeTab(tabNames[index])
          document.getElementById(`agents-desk-tab-${tabNames[index]}`)?.focus()
        } }, tabNames.map(name => h('button', { key: name, type: 'button', id: `agents-desk-tab-${name}`, className: 'tab', role: 'tab', 'aria-selected': tab === name, 'aria-controls': 'agents-desk-view', tabIndex: tab === name ? 0 : -1, disabled: busy, onClick: () => changeTab(name) },
          t(name === 'editor' ? 'editorTab' : name === 'chain' ? 'chainTitle' : 'historyTitle'), counts[name] !== undefined ? h('span', { className: 'tab-count' }, counts[name]) : null))),
        h('section', { id: 'agents-desk-view', role: 'tabpanel', 'aria-labelledby': `agents-desk-tab-${tab}`, tabIndex: 0 },
          bootState === 'error' ? h(ErrorLine, { text: errorText(bootError, t), onRetry: loadWorkspaces }) : null,
          llmUnavailable && tab === 'editor' ? h('div', { className: 'notice warning' }, t('healthLlmUnavailable')) : null,
          notice?.kind !== 'ok' ? h(NoticeBar, { notice, onDismiss: () => setNotice(null) }) : null,
          tab === 'editor' ? renderEditor() : tab === 'chain' ? h(ChainPanel, { chain, loading: chainLoading, error: chainError, onRefresh: () => loadChain(cwd), onSelect: selectScope }) : renderHistory()),
        h('footer', { className: 'footer' }, h('div', { className: 'od-row' }, h(Icon, { name: 'info', size: 14 }), h('span', null, t('hostStorage'), h('br'), t('hostControlsLoading'))),
          h('a', { href: 'https://github.com/Cassius0924/dsh-agents-desk', target: '_blank', rel: 'noopener noreferrer' }, t('repository'), h(Icon, { name: 'arrow', size: 12 }))),
        notice?.kind === 'ok' ? h(NoticeBar, { notice, onDismiss: () => setNotice(null) }) : null,
        h(ConfirmBar, { pending, onCancel: () => setPending(null), onConfirm: confirmPending }))
    }

    let translate = (key) => key

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, DICTS), 'agents-desk: dictionaries')
      const t = ctx.locale.bind(NS)
      translate = t
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'agents-desk',
        order: 40,
        locale: NS,
        label: () => t('label'),
      }, DeskSection))
    }

    exports.name = NS
    exports.inject = inject
    exports.apply = apply
    exports.DICTS = DICTS
    return module.exports
  },
})
