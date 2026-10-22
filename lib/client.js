// dsh-agents-desk client bundle: settings section for editing instruction files.
// Hand-written __ModuleLoader__ factory (no build step). Only `react` is required
// from the host module table; all chrome is React elements styled with the
// host's --dsw-* theme variables so it follows light/dark automatically.
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

    // Theme tokens. Every color resolves through a --dsw-* variable so both
    // color schemes work; the literals are only last-resort fallbacks.
    const TOKENS = {
      text: 'var(--dsw-alias-label-primary)',
      textSecondary: 'var(--dsw-alias-label-secondary)',
      textTertiary: 'var(--dsw-alias-label-tertiary)',
      border: 'var(--dsw-alias-border-l4, rgba(127,127,127,0.24))',
      borderStrong: 'var(--dsw-alias-border-l3, rgba(127,127,127,0.36))',
      hover: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.12))',
      hoverSolid: 'var(--dsw-alias-interactive-bg-hover-solid, rgba(127,127,127,0.16))',
      hoverDanger: 'var(--dsw-alias-interactive-bg-hover-danger, rgba(198,40,40,0.12))',
      cardFill: 'var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2, transparent))',
      cardStroke: 'var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4, rgba(127,127,127,0.24)))',
      moduleFill: 'var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-1, transparent))',
      baseFill: 'var(--dsw-alias-bg-base, transparent)',
      layer3: 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.16))',
      codeBlock: 'var(--dsw-alias-markdown-code-block, var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.16)))',
      success: 'var(--dsw-alias-state-success-primary, #2e7d32)',
      error: 'var(--dsw-alias-state-error-primary, #c62828)',
      warn: 'var(--dsw-alias-state-warn-label, var(--dsw-alias-state-warn-primary, #a15c00))',
      warnTint: 'var(--dsw-alias-state-warn-tertiary, rgba(255,193,7,0.14))',
      business: 'var(--dsw-alias-state-business-primary, #2563eb)',
      primaryFill: 'var(--dsw-alias-button-primary-fill, #2563eb)',
      primaryHover: 'var(--dsw-alias-button-primary-hover, var(--dsw-alias-button-primary-fill, #1d4ed8))',
      primaryForeground: 'var(--dsw-alias-label-primary-foreground, #ffffff)',
      focusRing: 'var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #2563eb))',
      mono: 'var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)',
      display: 'var(--dsw-font-family, inherit)',
      radiusXs: 'var(--dsw-radius-xs, 4px)',
      radiusSm: 'var(--dsw-radius-sm, 6px)',
      radiusMd: 'var(--dsw-radius-md, 8px)',
      radiusLg: 'var(--dsw-radius-lg, 10px)',
    }

    const S = {
      wrap: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px', color: TOKENS.text, fontFamily: TOKENS.display, fontSize: '13px', lineHeight: '20px' },
      titleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' },
      title: { margin: 0, fontSize: '16px', lineHeight: '24px', fontWeight: 500, color: TOKENS.text },
      subtitle: { margin: '2px 0 0', fontSize: '12px', lineHeight: '18px', color: TOKENS.textTertiary },
      titleMeta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
      meta: { fontSize: '11px', lineHeight: '16px', color: TOKENS.textTertiary },
      metaSecondary: { fontSize: '12px', lineHeight: '18px', color: TOKENS.textSecondary },
      row: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 },
      rowBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', minWidth: 0 },
      fieldLabel: { fontSize: '12px', lineHeight: '18px', fontWeight: 500, color: TOKENS.textSecondary },
      select: { boxSizing: 'border-box', height: '32px', maxWidth: '100%', padding: '0 8px', borderRadius: TOKENS.radiusSm, border: `0.5px solid ${TOKENS.borderStrong}`, background: 'transparent', color: 'inherit', font: 'inherit', fontSize: '13px' },
      layout: (narrow) => ({ display: 'flex', flexDirection: narrow ? 'column' : 'row', alignItems: 'stretch', gap: '12px', minWidth: 0 }),
      list: (narrow) => ({ width: narrow ? '100%' : '200px', flex: narrow ? 'none' : '0 0 200px', minWidth: 0, maxHeight: narrow ? '220px' : '360px', overflow: 'auto', border: `0.5px solid ${TOKENS.cardStroke}`, borderRadius: TOKENS.radiusMd, padding: '4px', background: TOKENS.cardFill, boxSizing: 'border-box' }),
      listGroup: { margin: '8px 6px 2px', fontSize: '11px', lineHeight: '14px', color: TOKENS.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' },
      listItem: (active, hover) => ({ display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '6px 8px', borderRadius: TOKENS.radiusSm, border: 'none', cursor: 'pointer', background: active ? TOKENS.hoverSolid : hover ? TOKENS.hover : 'transparent', boxShadow: active ? `inset 2px 0 0 ${TOKENS.business}` : 'none', color: 'inherit', font: 'inherit', minWidth: 0 }),
      itemTitle: { fontSize: '12px', lineHeight: '18px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      main: (narrow) => ({ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', width: narrow ? '100%' : undefined }),
      card: { border: `0.5px solid ${TOKENS.cardStroke}`, borderRadius: TOKENS.radiusLg, background: TOKENS.cardFill, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box', minWidth: 0 },
      fileHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', minWidth: 0 },
      fileIdentity: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: '1 1 220px' },
      fileName: { fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: TOKENS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      filePath: { fontSize: '11px', lineHeight: '16px', color: TOKENS.textTertiary, fontFamily: TOKENS.mono, wordBreak: 'break-all' },
      badge: (color) => ({ display: 'inline-flex', alignItems: 'center', padding: '0 6px', borderRadius: TOKENS.radiusXs, border: `0.5px solid ${color}`, color, fontSize: '11px', lineHeight: '16px', whiteSpace: 'nowrap' }),
      button: { boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', padding: '0 12px', border: `0.5px solid ${TOKENS.borderStrong}`, borderRadius: TOKENS.radiusMd, background: 'transparent', color: TOKENS.text, font: 'inherit', fontSize: '12px', lineHeight: '18px', cursor: 'pointer', whiteSpace: 'nowrap' },
      primaryButton: { boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '30px', padding: '0 14px', border: 'none', borderRadius: TOKENS.radiusMd, background: TOKENS.primaryFill, color: TOKENS.primaryForeground, font: 'inherit', fontSize: '12px', lineHeight: '18px', cursor: 'pointer', whiteSpace: 'nowrap' },
      smallButton: { height: '26px', padding: '0 8px', borderRadius: TOKENS.radiusSm, fontSize: '11px', lineHeight: '16px' },
      textarea: (focus) => ({ width: '100%', minHeight: '320px', boxSizing: 'border-box', fontFamily: TOKENS.mono, fontSize: '12px', lineHeight: '1.6', padding: '10px', background: TOKENS.baseFill, color: TOKENS.text, border: `0.5px solid ${focus ? TOKENS.business : TOKENS.borderStrong}`, borderRadius: TOKENS.radiusMd, resize: 'vertical', outline: 'none', boxShadow: focus ? `0 0 0 2px ${TOKENS.focusRing}` : 'none' }),
      toggleGroup: { display: 'inline-flex', alignItems: 'center', border: `0.5px solid ${TOKENS.borderStrong}`, borderRadius: TOKENS.radiusMd, overflow: 'hidden', flex: 'none' },
      toggleButton: (active, hover) => ({ boxSizing: 'border-box', height: '28px', padding: '0 10px', border: 'none', background: active ? TOKENS.hoverSolid : hover ? TOKENS.hover : 'transparent', color: active ? TOKENS.text : TOKENS.textSecondary, font: 'inherit', fontSize: '12px', lineHeight: '18px', cursor: 'pointer', whiteSpace: 'nowrap' }),
      toolbar: { position: 'sticky', bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '8px 0 2px', marginTop: '2px', borderTop: `0.5px solid ${TOKENS.border}`, background: TOKENS.cardFill },
      toolbarGroup: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 },
      kbd: { fontFamily: TOKENS.mono, fontSize: '10px', lineHeight: '16px', padding: '0 4px', border: `0.5px solid ${TOKENS.border}`, borderRadius: TOKENS.radiusXs, color: TOKENS.textTertiary, background: TOKENS.layer3 },
      errorText: { fontSize: '12px', lineHeight: '18px', color: TOKENS.error, wordBreak: 'break-word' },
      warnText: { fontSize: '12px', lineHeight: '18px', color: TOKENS.warn, wordBreak: 'break-word' },
      notice: (kind) => ({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', padding: '6px 10px', borderRadius: TOKENS.radiusMd, border: `0.5px solid ${kind === 'ok' ? TOKENS.success : kind === 'warn' ? TOKENS.warn : TOKENS.error}`, color: kind === 'ok' ? TOKENS.success : kind === 'warn' ? TOKENS.warn : TOKENS.error, fontSize: '12px', lineHeight: '18px', background: kind === 'warn' ? TOKENS.warnTint : 'transparent', wordBreak: 'break-word' }),
      confirm: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', border: `0.5px solid ${TOKENS.warn}`, borderRadius: TOKENS.radiusMd, background: TOKENS.warnTint },
      panel: { border: `0.5px solid ${TOKENS.cardStroke}`, borderRadius: TOKENS.radiusLg, background: TOKENS.cardFill, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box', minWidth: 0 },
      panelHeader: (hover) => ({ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0', margin: 0, border: 'none', background: hover ? TOKENS.hover : 'transparent', borderRadius: TOKENS.radiusSm, color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left', minWidth: 0 }),
      chevron: (open) => ({ display: 'inline-block', width: '10px', flex: 'none', fontSize: '10px', lineHeight: '16px', color: TOKENS.textTertiary, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms ease' }),
      panelTitle: { fontSize: '13px', lineHeight: '20px', fontWeight: 500, color: TOKENS.text },
      panelMeta: { marginLeft: 'auto', fontSize: '11px', lineHeight: '16px', color: TOKENS.textTertiary, whiteSpace: 'nowrap' },
      pill: (color) => ({ display: 'inline-flex', alignItems: 'center', padding: '0 5px', borderRadius: TOKENS.radiusXs, border: `0.5px solid ${color}`, color, fontSize: '11px', lineHeight: '16px', whiteSpace: 'nowrap' }),
      budgetTrack: { width: '100%', height: '6px', borderRadius: '999px', background: TOKENS.layer3, overflow: 'hidden' },
      budgetFill: (percent) => ({ height: '100%', width: '100%', borderRadius: '999px', background: TOKENS.business, transformOrigin: 'left center', transform: `scaleX(${Math.max(0, Math.min(1, percent / 100))})`, transition: 'transform 160ms ease' }),
      budgetNumbers: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '11px', lineHeight: '16px', color: TOKENS.textSecondary },
      table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: '18px', tableLayout: 'fixed' },
      th: { textAlign: 'left', fontSize: '11px', lineHeight: '16px', fontWeight: 500, color: TOKENS.textTertiary, padding: '4px 6px', borderBottom: `0.5px solid ${TOKENS.border}` },
      td: { padding: '6px', borderTop: `0.5px solid ${TOKENS.border}`, verticalAlign: 'top', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
      tdNum: { padding: '6px', borderTop: `0.5px solid ${TOKENS.border}`, verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
      rowEmphasis: (color) => ({ boxShadow: `inset 2px 0 0 ${color}` }),
      historyRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '6px 0', borderTop: `0.5px solid ${TOKENS.border}`, minWidth: 0 },
      diffBox: { maxHeight: '300px', overflow: 'auto', border: `0.5px solid ${TOKENS.border}`, borderRadius: TOKENS.radiusMd, padding: '6px', background: TOKENS.baseFill, boxSizing: 'border-box' },
      diffLine: (type) => ({ padding: '0 4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: TOKENS.mono, fontSize: '11px', lineHeight: '1.55', background: type === '+' ? `color-mix(in srgb, ${TOKENS.success} 14%, transparent)` : type === '-' ? `color-mix(in srgb, ${TOKENS.error} 14%, transparent)` : 'transparent', color: type === ' ' ? TOKENS.textSecondary : TOKENS.text }),
      preview: { minHeight: '320px', maxHeight: '520px', overflow: 'auto', padding: '10px 12px', border: `0.5px solid ${TOKENS.borderStrong}`, borderRadius: TOKENS.radiusMd, background: TOKENS.baseFill, fontSize: '13px', lineHeight: '1.65', color: TOKENS.text, boxSizing: 'border-box' },
      h: (depth) => ({ margin: depth <= 2 ? '12px 0 6px' : '10px 0 4px', fontSize: depth === 1 ? '17px' : depth === 2 ? '15px' : '13px', lineHeight: depth === 1 ? '24px' : '21px', fontWeight: 600, color: TOKENS.text }),
      paragraph: { margin: '6px 0' },
      markdownList: { margin: '6px 0', paddingLeft: '20px' },
      codeBlock: { margin: '8px 0', padding: '8px 10px', borderRadius: TOKENS.radiusMd, background: TOKENS.codeBlock, overflow: 'auto', fontFamily: TOKENS.mono, fontSize: '12px', lineHeight: '1.55' },
      inlineCode: { fontFamily: TOKENS.mono, fontSize: '12px', padding: '0 3px', borderRadius: TOKENS.radiusXs, background: TOKENS.layer3 },
      quote: { margin: '6px 0', paddingLeft: '10px', borderLeft: `2px solid ${TOKENS.borderStrong}`, color: TOKENS.textSecondary },
      linkText: { color: TOKENS.textSecondary },
      hr: { margin: '10px 0', border: 'none', borderTop: `0.5px solid ${TOKENS.border}` },
      empty: { padding: '18px 12px', textAlign: 'center', color: TOKENS.textTertiary, fontSize: '12px', lineHeight: '18px', border: `0.5px dashed ${TOKENS.borderStrong}`, borderRadius: TOKENS.radiusMd },
      loader: { display: 'flex', alignItems: 'center', gap: '6px', color: TOKENS.textSecondary, fontSize: '12px', lineHeight: '18px', padding: '4px 0' },
      dot: { width: '6px', height: '6px', borderRadius: '50%', background: TOKENS.business, flex: 'none' },
      errorLine: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '6px 10px', borderRadius: TOKENS.radiusMd, border: `0.5px solid ${TOKENS.error}`, wordBreak: 'break-word' },
      assumption: { fontSize: '11px', lineHeight: '16px', color: TOKENS.textTertiary, wordBreak: 'break-word' },
      factList: { display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '160px', overflow: 'auto' },
      mono: { fontFamily: TOKENS.mono, wordBreak: 'break-all' },
    }

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

    function matchesFocusVisible(event) {
      const target = event !== undefined && event !== null ? event.target : undefined
      if (target === undefined || target === null || typeof target.matches !== 'function') return true
      try { return target.matches(':focus-visible') } catch { return true }
    }

    function Btn(props) {
      const {
        children, tone = 'secondary', size = 'md', disabled = false, title, ariaLabel,
        ariaPressed, ariaExpanded, autoFocus = false, onClick, style: extraStyle,
      } = props
      const [hover, setHover] = useState(false)
      const [focused, setFocused] = useState(false)
      const style = {
        ...(tone === 'primary' ? S.primaryButton : S.button),
        ...(size === 'sm' ? S.smallButton : null),
        ...(extraStyle || null),
      }
      if (tone === 'ghost') {
        style.border = 'none'
        style.background = 'transparent'
        style.color = TOKENS.textSecondary
        style.padding = '0 8px'
      }
      if (tone === 'danger') style.color = TOKENS.error
      if (disabled === true) {
        style.opacity = 0.45
        style.cursor = 'default'
      } else if (hover === true) {
        if (tone === 'primary') style.background = TOKENS.primaryHover
        else if (tone === 'danger') style.background = TOKENS.hoverDanger
        else style.background = TOKENS.hover
      }
      if (focused === true) {
        style.outline = 'none'
        style.boxShadow = `0 0 0 2px ${TOKENS.focusRing}`
      }
      return h('button', {
        type: 'button',
        style,
        disabled: disabled === true,
        title,
        'aria-label': ariaLabel,
        'aria-pressed': typeof ariaPressed === 'boolean' ? ariaPressed : undefined,
        'aria-expanded': typeof ariaExpanded === 'boolean' ? ariaExpanded : undefined,
        autoFocus,
        onClick: disabled === true ? undefined : onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        onFocus: (event) => { if (matchesFocusVisible(event)) setFocused(true) },
        onBlur: () => { setFocused(false); setHover(false) },
      }, children)
    }

    function SelectBox(props) {
      const { value, onChange, ariaLabel, disabled = false, children } = props
      const [focused, setFocused] = useState(false)
      const style = { ...S.select }
      if (disabled === true) { style.opacity = 0.5; style.cursor = 'default' }
      if (focused === true) { style.borderColor = TOKENS.business; style.boxShadow = `0 0 0 2px ${TOKENS.focusRing}` }
      return h('select', {
        style,
        value,
        disabled: disabled === true,
        'aria-label': ariaLabel,
        onChange: (event) => onChange(event.target.value),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
      }, children)
    }

    function TextArea(props) {
      const { value, onChange, ariaLabel, disabled = false } = props
      const [focused, setFocused] = useState(false)
      return h('textarea', {
        style: { ...S.textarea(focused === true), ...(disabled === true ? { opacity: 0.6 } : null) },
        value,
        disabled: disabled === true,
        spellCheck: false,
        'aria-label': ariaLabel,
        onChange: (event) => onChange(event.target.value),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
      })
    }

    function Loader(props) {
      return h('div', { style: S.loader, role: 'status' },
        h('span', { style: S.dot, 'aria-hidden': 'true' }),
        props.label,
      )
    }

    function ErrorLine(props) {
      return h('div', { style: S.errorLine, role: 'alert' },
        h('span', { style: S.errorText }, props.text),
        props.onRetry ? h(Btn, { size: 'sm', onClick: props.onRetry }, props.retryLabel || translate('retry')) : null,
      )
    }

    function NoticeBar(props) {
      const notice = props.notice
      if (notice === undefined || notice === null) return null
      return h('div', { style: S.notice(notice.kind), role: notice.kind === 'err' ? 'alert' : 'status', 'aria-live': 'polite' },
        h('span', null, notice.text),
        props.onDismiss ? h(Btn, { tone: 'ghost', size: 'sm', ariaLabel: translate('close'), onClick: props.onDismiss }, '✕') : null,
      )
    }

    function ConfirmBar(props) {
      const { pending, onCancel, onConfirm } = props
      if (pending === undefined || pending === null) return null
      const t = translate
      return h('div', { style: S.confirm, role: 'alertdialog', 'aria-modal': false, 'aria-label': t('confirmDiscardTitle') },
        h('div', { style: { ...S.fieldLabel, color: TOKENS.warn } }, t('confirmDiscardTitle')),
        h('div', { style: S.metaSecondary }, pending.message),
        h('div', { style: S.row },
          h(Btn, { tone: 'primary', size: 'sm', autoFocus: true, onClick: onConfirm }, pending.confirmLabel),
          h(Btn, { tone: 'secondary', size: 'sm', onClick: onCancel }, t('cancel')),
        ),
      )
    }

    function SectionPanel(props) {
      const { title, meta, open, onToggle, actions, children } = props
      const [hover, setHover] = useState(false)
      return h('section', { style: S.panel, 'aria-label': title },
        h('div', { style: S.rowBetween },
          h('button', {
            type: 'button',
            style: S.panelHeader(hover === true),
            'aria-expanded': open === true,
            onClick: onToggle,
            onMouseEnter: () => setHover(true),
            onMouseLeave: () => setHover(false),
            onFocus: () => setHover(true),
            onBlur: () => setHover(false),
          },
            h('span', { style: S.chevron(open === true), 'aria-hidden': 'true' }, '▸'),
            h('span', { style: S.panelTitle }, title),
            meta ? h('span', { style: S.panelMeta }, meta) : null,
          ),
          actions ? h('div', { style: S.row }, actions) : null,
        ),
        open === true ? children : null,
      )
    }

    function statusColor(status) {
      switch (status) {
        case 'loaded': return TOKENS.success
        case 'duplicate':
        case 'absent': return TOKENS.textTertiary
        case 'ignored':
        case 'unreadable': return TOKENS.error
        case 'truncated':
        case 'omitted': return TOKENS.warn
        case 'dynamic': return TOKENS.business
        default: return TOKENS.textSecondary
      }
    }

    function StatusPill(props) {
      const color = statusColor(props.status)
      return h('span', { style: S.pill(color) }, props.label)
    }

    // ---------- Markdown preview (React elements only; no HTML injection) ----------

    function renderInline(text, keyPrefix) {
      return inlineParts(text).map((part, index) => {
        const key = `${keyPrefix}:${index}`
        switch (part.kind) {
          case 'code': return h('code', { key, style: S.inlineCode }, part.text)
          case 'bold': return h('strong', { key }, part.text)
          case 'italic': return h('em', { key }, part.text)
          case 'link': return h('span', { key, style: S.linkText, title: part.href }, part.href ? `${part.text} (${part.href})` : part.text)
          default: return h('span', { key }, part.text)
        }
      })
    }

    function renderMarkdownBlocks(source) {
      return parseMarkdown(source).map((block, index) => {
        const key = `md:${index}`
        switch (block.type) {
          case 'heading':
            return h(`h${Math.min(6, Math.max(1, block.depth))}`, { key, style: S.h(block.depth) }, renderInline(block.text, key))
          case 'code':
            return h('pre', { key, style: S.codeBlock }, h('code', null, block.text))
          case 'quote':
            return h('blockquote', { key, style: S.quote }, block.text.split('\n').map((line, lineIndex) => (
              h('div', { key: `${key}:q${lineIndex}` }, renderInline(line, `${key}:q${lineIndex}`))
            )))
          case 'list':
            return h(block.ordered ? 'ol' : 'ul', { key, style: S.markdownList }, block.items.map((item, itemIndex) => (
              h('li', { key: `${key}:li${itemIndex}` }, renderInline(item, `${key}:li${itemIndex}`))
            )))
          case 'hr':
            return h('hr', { key, style: S.hr })
          default:
            return h('p', { key, style: S.paragraph }, renderInline(block.text, key))
        }
      })
    }

    function Preview(props) {
      const t = translate
      const blocks = parseMarkdown(props.source)
      const style = blocks.length === 0 ? { ...S.preview, color: TOKENS.textTertiary } : S.preview
      return h('div', { style, role: 'document', 'aria-label': t('preview') },
        blocks.length === 0 ? t('previewEmpty') : renderMarkdownBlocks(props.source),
      )
    }

    // ---------- effective chain panel ----------

    function ChainPanel(props) {
      const { narrow, chain, loading, error, onRefresh } = props
      const t = translate
      const budget = chain !== null && chain !== undefined && typeof chain.budget === 'object' && chain.budget !== null ? chain.budget : {}
      const assumptions = chain !== null && chain !== undefined && typeof chain.assumptions === 'object' && chain.assumptions !== null ? chain.assumptions : {}
      const limit = typeof budget.limit === 'number' ? budget.limit : DEFAULT_MAX_BYTES
      const used = typeof budget.used === 'number' ? budget.used : 0
      const remaining = typeof budget.remaining === 'number' ? budget.remaining : Math.max(0, limit - used)
      const renderedTokens = typeof budget.renderedTokens === 'number' ? budget.renderedTokens : Math.ceil(used / 4)
      const percent = budgetPercent(used, limit)
      const maxSourceBytes = typeof assumptions.maxSourceBytes === 'number' ? assumptions.maxSourceBytes : DEFAULT_MAX_SOURCE_BYTES
      const candidates = Array.isArray(assumptions.instructionFileCandidates) && assumptions.instructionFileCandidates.length > 0
        ? assumptions.instructionFileCandidates
        : DEFAULT_CANDIDATES
      const rows = Array.isArray(chain?.rows) ? chain.rows : []
      const dynamic = Array.isArray(chain?.dynamic) ? chain.dynamic : []
      const scannedDirs = typeof chain?.scannedDirs === 'number' ? chain.scannedDirs : null
      const sourceLabel = assumptions.source === 'custom' ? t('assumptionSourceCustom') : t('assumptionSourceDefaults')

      const header = h('div', { style: S.rowBetween },
        h('div', { style: { minWidth: 0 } },
          h('div', { style: S.panelTitle }, t('chainTitle')),
          h('div', { style: S.meta }, t('chainIntro')),
        ),
        h('div', { style: S.row },
          chain !== null && chain !== undefined ? h('span', { style: S.pill(TOKENS.textTertiary) }, sourceLabel) : null,
          chain?.scannedAt ? h('span', { style: S.meta }, `${t('chainScanned')} ${formatTime(chain.scannedAt)}`) : null,
          scannedDirs !== null ? h('span', { style: S.meta }, `${t('chainDirs')}: ${scannedDirs}`) : null,
          h(Btn, { size: 'sm', onClick: onRefresh, disabled: loading === true, ariaLabel: t('chainRefresh') }, loading === true ? t('loading') : t('refresh')),
        ),
      )

      const budgetBlock = chain !== null && chain !== undefined
        ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 } },
          h('div', { style: S.budgetNumbers },
            h('strong', { style: { fontSize: '12px', color: TOKENS.text } }, t('budget')),
            h('span', null, `${t('budgetUsed')} ${formatBytes(used)} / ${formatBytes(limit)}`),
            h('span', null, `${t('budgetRemaining')} ${formatBytes(remaining)}`),
            h('span', null, `~${renderedTokens} tok`),
          ),
          h('div', {
            style: S.budgetTrack,
            role: 'progressbar',
            'aria-label': t('budgetMeter'),
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': percent,
          }, h('div', { style: S.budgetFill(percent) })),
          h('div', { style: S.assumption },
            `${t('chainAssumptions')}${t('assumptionRenderBudget')} ${formatBytes(limit)} · ${t('assumptionSourceCap')} ${formatBytes(maxSourceBytes)} · ${t('assumptionCandidates')} ${candidates.join(' / ')}`,
            ' ',
            h('span', { title: typeof assumptions.note === 'string' ? assumptions.note : undefined }, t('assumptionCaveat')),
          ),
        )
        : null

      const body = (() => {
        if (loading === true && chain === null) return h(Loader, { label: t('chainLoading') })
        if (error !== null && error !== undefined) {
          return h(ErrorLine, {
            text: `${t('loadFailed')}: ${errorText(error, t)}`,
            retryLabel: t('retry'),
            onRetry: onRefresh,
          })
        }
        if (chain === null || chain === undefined) return h('div', { style: S.empty }, t('chainEmpty'))
        if (rows.length === 0) return h('div', { style: S.empty }, t('chainEmpty'))
        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 } },
          h('div', { style: S.fieldLabel }, t('chainBaseline')),
          narrow === true ? renderChainNarrow(rows) : renderChainTable(rows),
        )
      })()

      function rowKey(row, index) {
        if (typeof row?.path === 'string' && row.path !== '') return row.path
        if (typeof row?.display === 'string' && row.display !== '') return row.display
        return `chain-row:${index}`
      }

      function renderChainTable(list) {
        return h('table', { style: S.table, 'aria-label': t('chainTitle') },
          h('colgroup', null,
            h('col', { style: { width: '46%' } }),
            h('col', { style: { width: '18%' } }),
            h('col', { style: { width: '22%' } }),
            h('col', { style: { width: '14%' } }),
          ),
          h('thead', null, h('tr', null,
            h('th', { style: S.th }, t('fileColumn')),
            h('th', { style: S.th }, t('statusColumn')),
            h('th', { style: { ...S.th, textAlign: 'right' } }, t('includedColumn')),
            h('th', { style: { ...S.th, textAlign: 'right' } }, t('tokensColumn')),
          )),
          h('tbody', null, list.map((row, index) => {
            const status = typeof row.status === 'string' ? row.status : 'absent'
            const color = statusColor(status)
            const reason = chainReason(row, maxSourceBytes, t)
            const emphasize = status === 'truncated' || status === 'omitted' || status === 'ignored'
            const included = typeof row.included === 'number' ? row.included : typeof row.bytes === 'number' ? row.bytes : 0
            const bytes = typeof row.bytes === 'number' ? row.bytes : 0
            const tokens = tokenEstimateOf(row)
            const showIncluded = status === 'loaded' || status === 'truncated' || status === 'dynamic'
            return h('tr', { key: rowKey(row, index), style: emphasize ? S.rowEmphasis(color) : undefined },
              h('td', { style: S.td, title: typeof row.path === 'string' ? row.path : undefined },
                h('div', { style: S.itemTitle }, typeof row.display === 'string' && row.display !== '' ? row.display : row.path || ''),
                typeof row.dirLabel === 'string' && row.dirLabel !== '' && row.dirLabel !== row.display
                  ? h('div', { style: S.meta }, row.dirLabel)
                  : null,
                reason !== '' ? h('div', { style: S.meta, title: typeof row.reason === 'string' ? row.reason : undefined }, reason) : null,
              ),
              h('td', { style: S.td }, h(StatusPill, { status, label: statusLabel(status, t) })),
              h('td', { style: S.tdNum }, showIncluded ? `${formatBytes(included)} / ${formatBytes(bytes)}` : '—'),
              h('td', { style: S.tdNum }, showIncluded && tokens > 0 ? `~${tokens}` : '—'),
            )
          })),
        )
      }

      function renderChainNarrow(list) {
        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0', minWidth: 0 } }, list.map((row, index) => {
          const status = typeof row.status === 'string' ? row.status : 'absent'
          const reason = chainReason(row, maxSourceBytes, t)
          const included = typeof row.included === 'number' ? row.included : typeof row.bytes === 'number' ? row.bytes : 0
          const bytes = typeof row.bytes === 'number' ? row.bytes : 0
          const tokens = tokenEstimateOf(row)
          const showIncluded = status === 'loaded' || status === 'truncated' || status === 'dynamic'
          const meta = [
            showIncluded ? `${t('included')} ${formatBytes(included)} / ${formatBytes(bytes)}` : null,
            showIncluded && tokens > 0 ? `~${tokens} tok` : null,
          ].filter(Boolean).join(' · ')
          return h('div', {
            key: rowKey(row, index),
            style: { padding: '6px 0', borderTop: index === 0 ? 'none' : `0.5px solid ${TOKENS.border}`, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
            title: typeof row.path === 'string' ? row.path : undefined,
          },
            h('div', { style: S.rowBetween },
              h('span', { style: S.itemTitle }, typeof row.display === 'string' && row.display !== '' ? row.display : row.path || ''),
              h(StatusPill, { status, label: statusLabel(status, t) }),
            ),
            meta !== '' ? h('div', { style: S.meta }, meta) : null,
            reason !== '' ? h('div', { style: S.meta, title: typeof row.reason === 'string' ? row.reason : undefined }, reason) : null,
          )
        }))
      }

      return h('div', { style: S.panel, 'aria-label': t('chainTitle') },
        header,
        budgetBlock,
        body,
        chain !== null && chain !== undefined
          ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 } },
            h('div', { style: S.fieldLabel }, t('chainDynamic')),
            dynamic.length === 0
              ? h('div', { style: S.meta }, t('chainDynamicEmpty'))
              : dynamic.map((row, index) => {
                const status = typeof row.status === 'string' ? row.status : 'dynamic'
                return h('div', {
                  key: rowKey(row, index),
                  style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '4px 0', borderTop: index === 0 ? 'none' : `0.5px solid ${TOKENS.border}`, minWidth: 0 },
                  title: typeof row.path === 'string' ? row.path : undefined,
                },
                  h('div', { style: { minWidth: 0 } },
                    h('div', { style: S.itemTitle }, typeof row.display === 'string' && row.display !== '' ? row.display : row.path || ''),
                    typeof row.dirLabel === 'string' && row.dirLabel !== '' ? h('div', { style: S.meta }, row.dirLabel) : null,
                  ),
                  h('div', { style: S.row },
                    h(StatusPill, { status, label: statusLabel(status, t) }),
                    h('span', { style: S.meta }, `${formatBytes(row.bytes)} · ~${tokenEstimateOf(row)} tok`),
                  ),
                )
              }),
          )
          : null,
        h('div', { style: S.meta }, t('chainTokensNote')),
      )
    }

    // ---------- history and diff panels ----------

    function DiffPanel(props) {
      const { diff, loading, error, onClose, onRetry } = props
      const t = translate
      const hunks = Array.isArray(diff?.hunks) ? diff.hunks : []
      const backupName = diff !== null && diff !== undefined && typeof diff.backup === 'string'
        ? diff.backup.split(/[\\/]/).pop()
        : ''
      return h('div', { style: { ...S.panel, background: TOKENS.moduleFill, padding: '10px', gap: '8px' } },
        h('div', { style: S.rowBetween },
          h('div', { style: { minWidth: 0 } },
            h('div', { style: S.fieldLabel }, t('diffTitle')),
            backupName !== '' ? h('div', { style: S.meta }, backupName) : null,
          ),
          h(Btn, { size: 'sm', tone: 'ghost', onClick: onClose, ariaLabel: t('close') }, '✕'),
        ),
        loading === true ? h(Loader, { label: t('diffLoading') }) : null,
        error !== null && error !== undefined
          ? h(ErrorLine, { text: `${t('diffLoadFailed')}: ${errorText(error, t)}`, retryLabel: t('retry'), onRetry })
          : null,
        loading !== true && (error === null || error === undefined)
          ? hunks.length === 0
            ? h('div', { style: S.meta }, t('diffEmpty'))
            : h('div', { style: S.diffBox }, hunks.map((hunk, index) => h('div', {
              key: `diff-hunk:${index}`,
              style: { marginTop: index === 0 ? 0 : '8px' },
            }, (Array.isArray(hunk.lines) ? hunk.lines : []).map((line, lineIndex) => h('div', {
              key: `diff-line:${index}:${lineIndex}`,
              style: S.diffLine(line.t),
            }, `${line.t}${line.text}`)))))
          : null,
      )
    }

    function HistoryPanel(props) {
      const {
        open, onToggle, history, loading, error, onRefresh, busy, rollingBack,
        diff, diffLoading, diffError, onViewDiff, onRetryDiff, onCloseDiff, onRollback,
      } = props
      const t = translate
      const rows = Array.isArray(history) ? history : []
      const meta = rows.length > 0 ? String(rows.length) : ''
      return h(SectionPanel, {
        title: t('historyTitle'),
        meta,
        open,
        onToggle,
        actions: open === true
          ? h(Btn, { size: 'sm', onClick: onRefresh, disabled: loading === true, ariaLabel: t('historyRefresh') }, loading === true ? t('loading') : t('refresh'))
          : null,
      },
        loading === true && history === null ? h(Loader, { label: t('historyLoading') }) : null,
        rollingBack === true ? h(Loader, { label: t('rollingBack') }) : null,
        error !== null && error !== undefined
          ? h(ErrorLine, { text: `${t('backupLoadFailed')}: ${errorText(error, t)}`, retryLabel: t('retry'), onRetry: onRefresh })
          : null,
        loading !== true && (error === null || error === undefined) && rows.length === 0
          ? h('div', { style: S.meta }, t('historyEmpty'))
          : null,
        rows.map((row, index) => {
          const backup = typeof row.backup === 'string' ? row.backup : ''
          const name = typeof row.name === 'string' && row.name !== '' ? row.name : backup.split(/[\\/]/).pop()
          const source = historySourceLabel(row.source, t)
          const metaBits = [formatTime(row.at), formatBytes(row.bytes)]
          if (source !== '') metaBits.push(source)
          return h('div', { key: backup !== '' ? backup : `history:${index}`, style: S.historyRow },
            h('div', { style: { minWidth: 0 } },
              h('div', { style: S.itemTitle, title: backup }, name),
              h('div', { style: S.meta }, metaBits.filter((bit) => bit !== '').join(' · ')),
            ),
            h('div', { style: S.row },
              h(Btn, { size: 'sm', onClick: () => onViewDiff(row), disabled: busy === true }, t('viewDiff')),
              h(Btn, { size: 'sm', tone: 'danger', onClick: () => onRollback(row), disabled: busy === true }, t('rollback')),
            ),
          )
        }),
        diff !== null && diff !== undefined || diffLoading === true || (diffError !== null && diffError !== undefined)
          ? h(DiffPanel, {
            diff,
            loading: diffLoading === true,
            error: diffError,
            onClose: onCloseDiff,
            onRetry: onRetryDiff,
          })
          : null,
      )
    }

    // ---------- model draft panel ----------

    function GeneratePanel(props) {
      const {
        gen, generating, error, stale, onToggleHunk, onApply, onDiscard, onRegenerate,
      } = props
      const t = translate
      const hunks = Array.isArray(gen?.hunks) ? gen.hunks : []
      const accepted = Array.isArray(gen?.accepted) ? gen.accepted : []
      const facts = Array.isArray(gen?.facts) ? gen.facts : []
      const scope = gen?.scope ?? props.scope
      const isGlobal = scope === 'user-global' || scope === 'agents-global'
      const staleHunks = stale === true && hunks.length > 0
      const noHunkSelected = hunks.length > 0 && accepted.some((value) => value === true) !== true
      const model = gen?.model
      const modelLabel = model !== null && model !== undefined && typeof model.provider === 'string' && typeof model.model === 'string'
        ? `${model.provider}/${model.model}`
        : ''

      const children = []
      children.push(h('div', { key: 'gen-head', style: S.rowBetween },
        h('div', { style: { minWidth: 0 } },
          h('div', { style: S.panelTitle }, t(isGlobal ? 'generateGlobal' : 'generate')),
          modelLabel !== '' ? h('div', { style: S.meta }, `${t('genModel')}: ${modelLabel}`) : null,
        ),
        h('div', { style: S.row },
          h(Btn, { size: 'sm', onClick: onRegenerate, disabled: generating === true }, generating === true ? t('generating') : t('regenerate')),
          h(Btn, { size: 'sm', onClick: onDiscard }, t('discardProposal')),
        ),
      ))
      if (generating === true) children.push(h(Loader, { key: 'gen-loading', label: t('generating') }))
      if (error !== null && error !== undefined) {
        children.push(h(ErrorLine, {
          key: 'gen-error',
          text: `${t('generateFailed')}: ${errorText(error, t)}`,
          retryLabel: t('retry'),
          onRetry: onRegenerate,
        }))
      }
      if (gen !== null && gen !== undefined) {
        if (stale === true) {
          children.push(h('div', { key: 'gen-stale', style: S.warnText, role: 'alert' },
            hunks.length > 0 ? t('genStaleHunks') : t('genStaleDraft'),
          ))
        }
        if (facts.length > 0) {
          children.push(h('details', { key: 'gen-facts', style: { fontSize: '11px' } },
            h('summary', { style: S.meta }, `${t('genFacts')} (${facts.length})`),
            h('div', { style: S.factList }, facts.map((fact, index) => h('div', {
              key: `fact:${index}`,
              style: { ...S.meta, ...S.mono },
            }, String(fact)))),
          ))
        }
        if (hunks.length > 0) {
          children.push(h('div', { key: 'gen-hunks', style: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 } },
            h('div', { style: S.fieldLabel }, `${t('genHunks')} (${hunks.length})`),
            hunks.map((hunk, index) => h('label', {
              key: `gen-hunk:${index}`,
              style: { display: 'flex', flexDirection: 'column', gap: '4px', border: `0.5px solid ${TOKENS.border}`, borderRadius: TOKENS.radiusMd, padding: '6px 8px', minWidth: 0 },
            },
              h('span', { style: S.row },
                h('input', {
                  type: 'checkbox',
                  checked: accepted[index] === true,
                  'aria-label': `${t('genHunks')} #${index + 1}`,
                  onChange: (event) => onToggleHunk(index, event.target.checked),
                }),
                h('span', { style: S.meta }, `#${index + 1} · ${Number(hunk?.oldStart) || 1}–${(Number(hunk?.oldStart) || 1) + (Number(hunk?.oldLines) || 0) - 1}`),
              ),
              h('div', { style: S.diffBox }, (Array.isArray(hunk.lines) ? hunk.lines : []).map((line, lineIndex) => h('div', {
                key: `gen-line:${index}:${lineIndex}`,
                style: S.diffLine(line.t),
              }, `${line.t}${line.text}`))),
            )),
          ))
        } else {
          children.push(h('div', { key: 'gen-whole', style: S.meta }, t('applyDraft')))
        }
        children.push(h('div', { key: 'gen-actions', style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' } },
          h(Btn, {
            tone: 'primary',
            onClick: onApply,
            disabled: staleHunks === true || noHunkSelected === true,
            title: noHunkSelected === true ? t('genNoSelection') : undefined,
          }, hunks.length > 0 ? t('applySelected') : t('applyDraft')),
        ))
      }
      return h('div', { id: 'agents-desk-gen', style: S.panel }, children)
    }

    // ---------- responsive breakpoint (settings panel content column) ----------

    function useNarrow() {
      const query = '(max-width: 760px)'
      const [narrow, setNarrow] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
        try { return window.matchMedia(query).matches === true } catch { return false }
      })
      useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
        let media
        try { media = window.matchMedia(query) } catch { return undefined }
        const onChange = (event) => setNarrow(event.matches === true)
        if (typeof media.addEventListener === 'function') {
          media.addEventListener('change', onChange)
          return () => media.removeEventListener('change', onChange)
        }
        if (typeof media.addListener === 'function') {
          media.addListener(onChange)
          return () => media.removeListener(onChange)
        }
        return undefined
      }, [])
      return narrow
    }

    function ScopeItem(props) {
      const { scope, active, disabled, notExistLabel, onClick } = props
      const [hover, setHover] = useState(false)
      const exists = scope.exists === true
      const subtitle = exists ? formatBytes(scope.bytes) : notExistLabel
      return h('button', {
        type: 'button',
        style: { ...S.listItem(active === true, hover === true && disabled !== true), ...(disabled === true ? { opacity: 0.55, cursor: 'default' } : null) },
        title: scope.path,
        'aria-current': active === true ? 'true' : undefined,
        disabled: disabled === true,
        onClick: disabled === true ? undefined : onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        onFocus: () => setHover(true),
        onBlur: () => setHover(false),
      },
        h('div', { style: S.itemTitle }, scope.display || scope.name || scope.path),
        h('div', { style: S.meta }, subtitle),
      )
    }

    function ToggleOption(props) {
      const { active, onClick, children } = props
      const [hover, setHover] = useState(false)
      return h('button', {
        type: 'button',
        style: S.toggleButton(active === true, hover === true),
        'aria-pressed': active === true,
        onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
      }, children)
    }

    function ModeToggle(props) {
      const t = translate
      const { mode, onChange } = props
      return h('div', { style: S.toggleGroup, role: 'group', 'aria-label': `${t('editor')} / ${t('preview')}` },
        h(ToggleOption, { active: mode === 'edit', onClick: () => onChange('edit') }, t('editor')),
        h(ToggleOption, { active: mode === 'preview', onClick: () => onChange('preview') }, t('preview')),
      )
    }

    // ---------- settings section ----------

    function DeskSection() {
      const t = translate
      const narrow = useNarrow()

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

      const [historyOpen, setHistoryOpen] = useState(false)
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
        saving, generating, rollingBack, fileLoading, historyOpen,
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
        setHistoryOpen(false)
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
        setHistoryOpen(false)
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

      const toggleHistory = useCallback(() => {
        const current = live.current
        if (current.historyOpen === true) {
          setHistoryOpen(false)
          return
        }
        setHistoryOpen(true)
        if (current.file !== null) loadHistory(current.file.path, current.cwd)
      }, [loadHistory])

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
            saveRef.current()
            return
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

      function renderWorkspaceBar() {
        const disabled = busy === true || bootState === 'loading'
        return h('div', { style: S.row },
          h('span', { style: S.fieldLabel }, t('workspace')),
          h('div', { style: { flex: '1 1 220px', minWidth: 0 } },
            workspaces.length === 0
              ? h('span', { style: S.meta }, bootState === 'loading' ? t('loadingWorkspaces') : t('noWorkspace'))
              : h(SelectBox, {
                value: cwd,
                onChange: requestWorkspace,
                ariaLabel: t('workspace'),
                disabled,
              }, workspaces.map((workspace) => h('option', {
                key: workspace.id || workspace.path,
                value: workspace.path,
              }, workspace.title ? `${workspace.title} — ${workspace.path}` : workspace.path))),
          ),
          h(Btn, {
            size: 'sm',
            onClick: () => {
              loadWorkspaces()
              if (cwd !== '') {
                loadScopes(cwd)
                loadChain(cwd)
              }
            },
            disabled: busy === true,
          }, t('refresh')),
        )
      }

      function renderScopeList() {
        const children = []
        const sections = [
          ['groupGlobal', groups.global],
          ['groupProject', groups.project],
          ['groupSubdir', groups.subdir],
        ]
        sections.forEach(([labelKey, items]) => {
          if (items.length === 0) return
          children.push(h('div', { key: `group:${labelKey}`, style: S.listGroup }, t(labelKey)))
          items.forEach((scope) => {
            children.push(h(ScopeItem, {
              key: scope.path,
              scope,
              active: selectedPath === scope.path,
              disabled: busy === true || fileLoading === true,
              notExistLabel: t('notExist'),
              onClick: () => selectScope(scope),
            }))
          })
        })
        if (scopesError !== null && scopesError !== undefined) {
          children.push(h('div', { key: 'scopes-error' },
            h(ErrorLine, {
              text: `${t('loadFailed')}: ${errorText(scopesError, t)}`,
              retryLabel: t('retry'),
              onRetry: () => loadScopes(cwd),
            })))
        } else if (scopesLoading === true && (scopes === null || scopes.length === 0)) {
          children.push(h(Loader, { key: 'scopes-loading', label: t('loading') }))
        } else if (children.length === 0) {
          const emptyText = cwd === ''
            ? bootState === 'loading' ? t('loadingWorkspaces') : t('noWorkspace')
            : t('noScopes')
          children.push(h('div', { key: 'scopes-empty', style: S.empty }, emptyText))
        }
        return h('nav', { style: S.list(narrow), 'aria-label': t('selectFile') }, children)
      }

      function renderEditor() {
        if (fileLoading === true) {
          return h('div', { style: S.card },
            h(Loader, { label: `${t('loading')} ${selectedPath !== null ? selectedPath : ''}`.trim() }),
          )
        }
        if (fileError !== null && fileError !== undefined) {
          return h('div', { style: S.card },
            h(ErrorLine, {
              text: `${t('loadFailed')}: ${errorText(fileError, t)}`,
              retryLabel: t('retry'),
              onRetry: reloadSelected,
            }),
          )
        }
        if (file === null) {
          return h('div', { style: S.card },
            h('div', { style: S.empty }, cwd === '' ? t('noWorkspace') : t('empty')),
            h('div', { style: S.meta }, t('emptyHint')),
          )
        }
        const displayName = selectedScope?.display || selectedScope?.name || file.path.split(/[\\/]/).pop()
        const fileBytes = typeof file.bytes === 'number' ? file.bytes : 0
        const sizeText = file.exists === true ? formatBytes(fileBytes) : t('notExist')
        const header = h('div', { style: S.fileHead },
          h('div', { style: S.fileIdentity },
            h('div', { style: S.fileName, title: file.path }, displayName),
            h('div', { style: S.filePath, title: file.path }, file.path),
            file.exists !== true ? h('div', { style: S.meta }, t('fileMissing')) : null,
          ),
          h('div', { style: S.row },
            dirty === true ? h('span', { style: S.badge(TOKENS.warn) }, t('unsaved')) : null,
            h('span', { style: S.meta }, sizeText),
            h(ModeToggle, { mode, onChange: setMode }),
          ),
        )
        const body = mode === 'preview'
          ? h(Preview, { source: draft })
          : h(TextArea, { value: draft, onChange: setDraft, ariaLabel: displayName, disabled: busy })
        const toolbar = h('div', { style: S.toolbar },
          h('div', { style: S.toolbarGroup },
            dirty === true ? h('span', { style: S.warnText }, t('dirtyHint')) : null,
            h('span', { style: S.meta }, `${t('shortcutSave')}: `, h('kbd', { style: S.kbd }, 'Ctrl/Cmd+S')),
          ),
          h('div', { style: S.toolbarGroup },
            h(Btn, { size: 'sm', onClick: requestReload, disabled: busy === true }, t('reload')),
            dirty === true ? h(Btn, { size: 'sm', onClick: discardDraft, disabled: busy === true }, t('discard')) : null,
            h(Btn, {
              size: 'sm',
              onClick: generate,
              disabled: canGenerate !== true,
              title: dirty === true ? t('generateNeedsClean') : llmUnavailable === true ? t('healthLlmUnavailable') : t(isGlobal ? 'generateGlobalHint' : 'generateHint'),
            }, generating === true ? t('generating') : t(isGlobal ? 'generateGlobal' : 'generate')),
            h(Btn, {
              tone: 'primary',
              size: 'sm',
              onClick: save,
              disabled: canSave !== true,
              title: canSave === true ? t('save') : undefined,
            }, saving === true ? t('saving') : t('save')),
          ),
        )
        return h('div', { style: S.card }, header,
          isGlobal ? h('div', { style: S.metaSecondary }, t('generateGlobalHint')) : null,
          body, toolbar)
      }

      function renderHistory() {
        if (file === null) return null
        return h(HistoryPanel, {
          open: historyOpen,
          onToggle: toggleHistory,
          history,
          loading: historyLoading,
          error: historyError,
          onRefresh: () => loadHistory(file.path, cwd),
          busy,
          rollingBack,
          diff,
          diffLoading,
          diffError,
          onViewDiff: loadDiff,
          onRetryDiff: () => { if (lastDiffBackup.current !== null) loadDiff(lastDiffBackup.current) },
          onCloseDiff: () => {
            cancel('diff')
            setDiff(null)
            setDiffError(null)
            setDiffLoading(false)
            lastDiffBackup.current = null
          },
          onRollback: requestRollback,
        })
      }

      return h('div', { style: S.wrap, 'data-agents-desk': '' },
        h('div', { style: S.titleRow },
          h('div', { style: { minWidth: 0 } },
            h('h2', { style: S.title }, t('label')),
            h('div', { style: S.subtitle }, t('intro')),
          ),
          h('div', { style: S.titleMeta },
            health !== null && health !== undefined && health.version !== undefined && health.version !== null && health.version !== ''
              ? h('span', { style: S.meta }, `${t('healthVersion')} ${String(health.version)}`)
              : null,
            llmUnavailable === true ? h('span', { style: { ...S.meta, color: TOKENS.warn } }, t('healthLlmUnavailable')) : null,
          ),
        ),
        renderWorkspaceBar(),
        h(ConfirmBar, { pending, onCancel: () => setPending(null), onConfirm: confirmPending }),
        h(NoticeBar, { notice, onDismiss: () => setNotice(null) }),
        bootState === 'error'
          ? h(ErrorLine, {
            text: `${t('loadFailed')}: ${errorText(bootError, t)}`,
            retryLabel: t('retry'),
            onRetry: loadWorkspaces,
          })
          : null,
        h('div', { style: S.layout(narrow) },
          renderScopeList(),
          h('div', { style: S.main(narrow) },
            renderEditor(),
            genVisible === true || generating === true || (genError !== null && genError !== undefined)
              ? h(GeneratePanel, {
                gen,
                scope: selectedScope?.kind,
                generating,
                error: genError,
                stale: genStale,
                onToggleHunk: toggleHunk,
                onApply: applyGen,
                onDiscard: () => { setGen(null); setGenError(null) },
                onRegenerate: generate,
              })
              : null,
          ),
        ),
        h(ChainPanel, {
          narrow,
          chain,
          loading: chainLoading,
          error: chainError,
          onRefresh: () => loadChain(cwd),
        }),
        renderHistory(),
      )
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
