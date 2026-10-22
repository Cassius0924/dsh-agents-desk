// dsh-agents-desk client bundle: settings section for editing instruction files.
// Hand-written __ModuleLoader__ factory (no build step). Only `react` is required
// from the host module table.
window.__ModuleLoader__.load({
  id: 'dsh-agents-desk',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const react = require('react')
    const h = react.createElement
    const { useState, useEffect, useCallback, useMemo } = react

    const NS = 'agents-desk'
    const API = '/api/agents-desk'
    const inject = ['slots', 'locale']

    const DICTS = {
      zh: {
        label: '指令文件',
        workspace: '工作区',
        refresh: '刷新',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        reload: '重新读取',
        generate: '生成草稿',
        generating: '生成中…',
        chain: '生效链',
        history: '历史',
        rollback: '回滚',
        view: '查看',
        apply: '应用选中',
        cancel: '取消',
        empty: '选择一个指令文件',
        notExist: '不存在（点击可新建）',
        conflict: '磁盘上的文件已被修改，请重新读取',
        noWorkspace: '没有可用工作区，请先在 DSH 中打开一个目录',
        budget: '预算',
        used: '已用',
        dynamic: '动态（工具触碰后注入）',
        facts: '依据的事实',
        draftReady: '草稿已载入编辑器，确认后保存',
        applied: '已合并选中修改，保存后写入',
        backupNone: '还没有备份',
        tokenEstimate: 'token 为粗估（字节/4）',
      },
      en: {
        label: 'Instruction files',
        workspace: 'Workspace',
        refresh: 'Refresh',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        reload: 'Reload',
        generate: 'Draft with model',
        generating: 'Generating…',
        chain: 'Effective chain',
        history: 'History',
        rollback: 'Roll back',
        view: 'View',
        apply: 'Apply selected',
        cancel: 'Cancel',
        empty: 'Select an instruction file',
        notExist: 'Missing (click to create)',
        conflict: 'File changed on disk. Reload before saving.',
        noWorkspace: 'No workspace yet. Open a directory in DSH first.',
        budget: 'Budget',
        used: 'used',
        dynamic: 'Dynamic (injected after a tool touches the directory)',
        facts: 'Facts used',
        draftReady: 'Draft loaded into the editor; review then save',
        applied: 'Selected changes merged; save to write',
        backupNone: 'No backups yet',
        tokenEstimate: 'tokens are rough (bytes/4)',
      },
    }

    const S = {
      wrap: { display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' },
      row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
      select: { height: '32px', padding: '0 8px', borderRadius: 'var(--dsw-radius-md)', border: '0.5px solid var(--dsw-alias-border-l4)', background: 'transparent', color: 'inherit' },
      layout: { display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },
      list: { width: '260px', minWidth: '220px', maxHeight: '460px', overflow: 'auto', border: '0.5px solid var(--dsw-alias-border-l4)', borderRadius: 'var(--dsw-radius-md)', padding: '6px' },
      group: { margin: '6px 4px 2px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.04em' },
      item: (active) => ({ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 'var(--dsw-radius-sm)', border: 'none', cursor: 'pointer', background: active ? 'var(--dsw-alias-fill-secondary, rgba(127,127,127,0.16))' : 'transparent', color: 'inherit', fontSize: '12px' }),
      meta: { fontSize: '11px', opacity: 0.65 },
      main: { flex: '1 1 420px', minWidth: '320px' },
      textarea: { width: '100%', minHeight: '340px', boxSizing: 'border-box', fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace", fontSize: '13px', lineHeight: 1.5, padding: '10px', background: 'transparent', color: 'inherit', border: '0.5px solid var(--dsw-alias-border-l4)', borderRadius: 'var(--dsw-radius-md)', resize: 'vertical' },
      button: { height: '32px', padding: '0 12px', borderRadius: 'var(--dsw-radius-md)', border: '0.5px solid var(--dsw-alias-border-l4)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '13px' },
      primary: { height: '32px', padding: '0 14px', borderRadius: 'var(--dsw-radius-md)', border: 'none', background: 'var(--dsw-alias-button-primary-fill)', color: 'var(--dsw-alias-label-primary-foreground)', cursor: 'pointer', fontSize: '13px' },
      panel: { border: '0.5px solid var(--dsw-alias-border-l4)', borderRadius: 'var(--dsw-radius-md)', padding: '10px 12px' },
      ok: { color: 'var(--dsw-alias-state-success-primary, #2e7d32)' },
      err: { color: 'var(--dsw-alias-state-error-primary)' },
      table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
      td: { padding: '4px 6px', borderTop: '0.5px solid var(--dsw-alias-border-l4)', verticalAlign: 'top' },
      diffLine: (t) => ({ padding: '1px 6px', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', background: t === '+' ? 'rgba(46,125,50,0.12)' : t === '-' ? 'rgba(198,40,40,0.12)' : 'transparent' }),
    }

    async function call(path, init) {
      const response = await fetch(API + path, { cache: 'no-store', ...init })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`)
        error.status = response.status
        error.code = data.code
        throw error
      }
      return data
    }

    function postJson(path, body) {
      return call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    }

    function applyHunks(oldText, hunks, accepted) {
      const lines = oldText.split('\n')
      const out = []
      let cursor = 0
      hunks.forEach((hunk, index) => {
        const start = hunk.oldStart - 1
        out.push(...lines.slice(cursor, start))
        out.push(...(accepted[index] ? hunk.newText : lines.slice(start, start + hunk.oldLines)))
        cursor = start + hunk.oldLines
      })
      out.push(...lines.slice(cursor))
      return out.join('\n')
    }

    function statusLabel(row, t) {
      switch (row.status) {
        case 'loaded': return t('used')
        case 'duplicate': return row.reason
        case 'ignored': return row.reason
        case 'truncated': return row.reason
        case 'omitted': return row.reason
        case 'dynamic': return t('dynamic')
        default: return row.reason || ''
      }
    }

    let translate = (key) => key

    function DeskSection(props) {
      const t = translate
      const [cwd, setCwd] = useState('')
      const [workspaces, setWorkspaces] = useState([])
      const [scopes, setScopes] = useState([])
      const [selected, setSelected] = useState(null)
      const [file, setFile] = useState(null)
      const [draft, setDraft] = useState('')
      const [notice, setNotice] = useState(null)
      const [busy, setBusy] = useState(false)
      const [chain, setChain] = useState(null)
      const [history, setHistory] = useState(null)
      const [diff, setDiff] = useState(null)
      const [gen, setGen] = useState(null)

      useEffect(() => {
        let cancelled = false
        call('/workspaces')
          .then((data) => {
            if (cancelled) return
            setWorkspaces(data.workspaces || [])
            if (data.defaultCwd) setCwd(data.defaultCwd)
            else if (data.homes?.home) setCwd(data.homes.home)
          })
          .catch((error) => { if (!cancelled) setNotice({ kind: 'err', text: error.message }) })
        return () => { cancelled = true }
      }, [])

      const loadScopes = useCallback((target) => {
        if (!target) return
        setBusy(true)
        call(`/scopes?cwd=${encodeURIComponent(target)}`)
          .then((data) => { setScopes(data.scopes || []) })
          .catch((error) => setNotice({ kind: 'err', text: error.message }))
          .finally(() => setBusy(false))
      }, [])

      useEffect(() => { loadScopes(cwd) }, [cwd, loadScopes])

      const loadFile = useCallback((scope) => {
        setSelected(scope)
        setHistory(null)
        setDiff(null)
        setGen(null)
        call(`/file?cwd=${encodeURIComponent(cwd)}&path=${encodeURIComponent(scope.path)}`)
          .then((data) => { setFile(data); setDraft(data.content || ''); setNotice(null) })
          .catch((error) => setNotice({ kind: 'err', text: error.message }))
      }, [cwd])

      const save = useCallback(() => {
        if (!file) return
        setBusy(true)
        postJson('/file', {
          cwd, path: file.path, content: draft,
          version: file.exists ? file.version : undefined,
          create: !file.exists,
        })
          .then(() => {
            setNotice({ kind: 'ok', text: t('saved') })
            return call(`/file?cwd=${encodeURIComponent(cwd)}&path=${encodeURIComponent(file.path)}`).then((data) => {
              setFile(data); setDraft(data.content || '')
            })
          })
          .then(() => { loadScopes(cwd); loadChain(cwd) })
          .catch((error) => { setNotice({ kind: 'err', text: error.status === 409 ? t('conflict') : error.message }) })
          .finally(() => setBusy(false))
      }, [cwd, draft, file, loadScopes, t])

      const loadChain = useCallback((target) => {
        call(`/chain?cwd=${encodeURIComponent(target)}`).then(setChain).catch(() => setChain(null))
      }, [])

      useEffect(() => { if (cwd) loadChain(cwd) }, [cwd, loadChain])

      const loadHistory = useCallback(() => {
        if (!file) return
        call(`/history?path=${encodeURIComponent(file.path)}`)
          .then((data) => setHistory(data.backups || []))
          .catch((error) => setNotice({ kind: 'err', text: error.message }))
      }, [file])

      const showDiff = useCallback((backup) => {
        call(`/history/diff?path=${encodeURIComponent(file.path)}&backup=${encodeURIComponent(backup)}`)
          .then((data) => setDiff(data))
          .catch((error) => setNotice({ kind: 'err', text: error.message }))
      }, [file])

      const rollback = useCallback((backup) => {
        setBusy(true)
        postJson('/rollback', { cwd, path: file.path, backup })
          .then(() => call(`/file?cwd=${encodeURIComponent(cwd)}&path=${encodeURIComponent(file.path)}`))
          .then((data) => { setFile(data); setDraft(data.content || ''); setDiff(null); setNotice({ kind: 'ok', text: t('saved') }) })
          .catch((error) => setNotice({ kind: 'err', text: error.message }))
          .finally(() => setBusy(false))
      }, [cwd, file, t])

      const generate = useCallback(() => {
        if (!file) return
        setBusy(true)
        setGen({ loading: true })
        postJson('/generate', { cwd, path: file.path })
          .then((data) => setGen({
            draft: data.draft, hunks: data.hunks || [], facts: data.facts || [],
            model: data.model, accepted: (data.hunks || []).map(() => true),
          }))
          .catch((error) => { setGen(null); setNotice({ kind: 'err', text: error.message }) })
          .finally(() => setBusy(false))
      }, [cwd, file])

      useEffect(() => {
        if (gen !== null) document.getElementById('agents-desk-gen')?.scrollIntoView({ block: 'nearest' })
      }, [gen])

      const applyGen = useCallback(() => {
        if (!gen) return
        if (gen.hunks.length > 0) setDraft(applyHunks(draft, gen.hunks, gen.accepted))
        else setDraft(gen.draft)
        setGen(null)
        setNotice({ kind: 'ok', text: gen.hunks.length > 0 ? t('applied') : t('draftReady') })
      }, [draft, gen, t])

      const groups = useMemo(() => {
        const visible = scopes.filter(scope => scope.exists || scope.name === 'AGENTS.md')
        return {
          global: visible.filter(scope => scope.kind === 'user-global' || scope.kind === 'agents-global'),
          project: visible.filter(scope => scope.kind === 'project'),
          subdir: visible.filter(scope => scope.kind === 'subdir'),
        }
      }, [scopes])

      const renderItem = (scope) => h('button', {
        key: scope.path,
        type: 'button',
        style: S.item(selected && selected.path === scope.path),
        title: scope.path,
        onClick: () => loadFile(scope),
      },
        h('div', null, scope.display),
        h('div', { style: S.meta }, scope.exists ? `${scope.bytes} B` : t('notExist')),
      )

      return h('div', { style: S.wrap },
        h('div', { style: S.row },
          h('strong', null, t('label')),
          h('span', { style: S.meta }, t('workspace')),
          h('select', {
            style: S.select,
            value: cwd,
            onChange: (event) => { setCwd(event.target.value); setSelected(null); setFile(null) },
          }, workspaces.length === 0
            ? h('option', { value: '' }, t('noWorkspace'))
            : workspaces.map(w => h('option', { key: w.id, value: w.path }, w.title ? `${w.title} — ${w.path}` : w.path))),
          h('button', { type: 'button', style: S.button, onClick: () => loadScopes(cwd) }, t('refresh')),
        ),
        h('div', { style: S.layout },
          h('div', { style: S.list },
            groups.global.length > 0 ? h('div', { style: S.group }, 'global') : null,
            groups.global.map(renderItem),
            groups.project.length > 0 ? h('div', { style: S.group }, 'project') : null,
            groups.project.map(renderItem),
            groups.subdir.length > 0 ? h('div', { style: S.group }, 'subdirectory') : null,
            groups.subdir.map(renderItem),
          ),
          h('div', { style: S.main },
            file === null
              ? h('div', { style: S.panel }, t('empty'))
              : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                h('div', { style: S.row },
                  h('code', null, file.path),
                  h('span', { style: S.meta }, file.exists ? `${file.bytes} B` : t('notExist')),
                ),
                h('textarea', {
                  style: S.textarea,
                  value: draft,
                  spellCheck: false,
                  onChange: (event) => setDraft(event.target.value),
                }),
                h('div', { style: S.row },
                  h('button', { type: 'button', style: S.primary, disabled: busy, onClick: save }, busy ? t('saving') : t('save')),
                  h('button', {
                    type: 'button', style: S.button,
                    onClick: () => call(`/file?cwd=${encodeURIComponent(cwd)}&path=${encodeURIComponent(file.path)}`)
                      .then((data) => { setFile(data); setDraft(data.content || '') })
                      .catch((error) => setNotice({ kind: 'err', text: error.message })),
                  }, t('reload')),
                  h('button', { type: 'button', style: S.button, disabled: busy, onClick: generate }, busy && gen?.loading ? t('generating') : t('generate')),
                ),
                notice ? h('div', { style: notice.kind === 'ok' ? S.ok : S.err }, notice.text) : null,
              ),
          ),
        ),
        chain ? h('details', { style: S.panel, open: true },
          h('summary', null, `${t('chain')} — ${t('budget')} ${chain.budget.used}/${chain.budget.limit} B`),
          h('table', { style: S.table },
            h('tbody', null,
              (chain.rows || []).map(row => h('tr', { key: row.path },
                h('td', { style: S.td }, row.display),
                h('td', { style: S.td }, row.exists ? `${row.included ?? row.bytes} B` : '—'),
                h('td', { style: S.td }, row.tokens ? `~${row.tokens} tok` : ''),
                h('td', { style: { ...S.td, ...(row.status === 'loaded' ? S.ok : S.meta) } }, row.status),
                h('td', { style: S.td }, statusLabel(row, t)),
              )),
            ),
          ),
          (chain.dynamic || []).length > 0 ? h('div', null,
            h('div', { style: S.group }, t('dynamic')),
            chain.dynamic.map(row => h('div', { key: row.path, style: S.meta }, `${row.display} — ${row.bytes} B`)),
          ) : null,
          h('div', { style: S.meta }, t('tokenEstimate')),
        ) : null,
        file ? h('details', { style: S.panel, onToggle: (event) => { if (event.target.open) loadHistory() } },
          h('summary', null, t('history')),
          history === null ? h('div', { style: S.meta }, '…')
            : history.length === 0 ? h('div', { style: S.meta }, t('backupNone'))
              : history.map((row) => h('div', { key: row.backup, style: S.row },
                h('span', null, row.at.replace('T', ' ').slice(0, 19)),
                h('span', { style: S.meta }, `${row.bytes} B`),
                h('button', { type: 'button', style: S.button, onClick: () => showDiff(row.backup) }, t('view')),
                h('button', { type: 'button', style: S.button, disabled: busy, onClick: () => rollback(row.backup) }, t('rollback')),
              )),
        ) : null,
        diff ? h('div', { style: S.panel },
          h('div', { style: S.row },
            h('strong', null, `${t('history')}: ${diff.backup.split('/').pop()}`),
            h('button', { type: 'button', style: S.button, onClick: () => setDiff(null) }, t('cancel')),
          ),
          diff.hunks.length === 0
            ? h('div', { style: S.meta }, '—')
            : diff.hunks.map((hunk, index) => h('div', { key: index, style: { marginTop: '8px' } },
              hunk.lines.map((line, lineIndex) => h('div', { key: lineIndex, style: S.diffLine(line.t) }, `${line.t}${line.text}`)),
            )),
        ) : null,
        gen ? h('div', { id: 'agents-desk-gen', style: S.panel },
          h('div', { style: S.row },
            h('strong', null, t('generate')),
            gen.model ? h('span', { style: S.meta }, `${gen.model.provider}/${gen.model.model}`) : null,
            h('button', { type: 'button', style: S.button, onClick: () => setGen(null) }, t('cancel')),
            h('button', { type: 'button', style: S.primary, disabled: gen.loading, onClick: applyGen }, t('apply')),
          ),
          gen.loading ? h('div', { style: S.meta }, t('generating')) : null,
          gen.facts ? h('details', null,
            h('summary', { style: S.meta }, `${t('facts')} (${gen.facts.length})`),
            gen.facts.map((fact, index) => h('div', { key: index, style: S.meta }, fact)),
          ) : null,
          gen.hunks ? h('div', null,
            gen.hunks.map((hunk, index) => h('div', { key: index, style: { marginTop: '8px' } },
              h('label', { style: S.row },
                h('input', {
                  type: 'checkbox',
                  checked: gen.accepted[index],
                  onChange: (event) => setGen({
                    ...gen,
                    accepted: gen.accepted.map((value, i) => (i === index ? event.target.checked : value)),
                  }),
                }),
                h('span', { style: S.meta }, `${t('view')} #${index + 1}`),
              ),
              hunk.lines.map((line, lineIndex) => h('div', { key: lineIndex, style: S.diffLine(line.t) }, `${line.t}${line.text}`)),
            )),
          ) : null,
        ) : null,
      )
    }

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
