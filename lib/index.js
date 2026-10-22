/**
 * dsh-agents-desk host half.
 *
 * Routes ride Connection's /api fence (Host/Origin + browser auth). Every write
 * is additionally limited to a server-side whitelist of instruction-file paths,
 * guarded by the fs service's version token, and backed up before it lands.
 */
import { constants, copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { buildChain, discoverScopes, findProjectRoot, isAllowedPath, loadFile, resolveHomes, GLOBAL_NAME } from './scopes.js'
import { diffHunks } from './diff.js'
import { generateDraft } from './generate.js'

export const name = 'agents-desk'

const BASE = '/api/agents-desk'
const MAX_BODY = 2 * 1024 * 1024
const ELEVATED = { mode: 'danger-full-access' }

function json(status, payload) {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

function messageOf(error) {
  return String(error?.message ?? error)
}

function failure(error) {
  return json(error?.status ?? 500, { error: messageOf(error), code: error?.code ?? 'error' })
}

async function readJson(request) {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY) {
    throw Object.assign(new Error('请求体过大'), { status: 413 })
  }
  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) throw Object.assign(new Error('请求体过大'), { status: 413 })
  try {
    return JSON.parse(text)
  } catch {
    throw Object.assign(new Error('请求体必须是 JSON'), { status: 400 })
  }
}

function requireFs(ctx) {
  const fsService = ctx.get('fs')
  if (fsService === undefined || fsService === null) {
    throw Object.assign(new Error('宿主 fs 服务不可用'), { status: 503, code: 'fs/unavailable' })
  }
  return fsService
}

/** Reserve a non-existing backup name next to the target. */
async function backupFile(filePath) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt}`
    const candidate = `${filePath}.bak-${stamp}${suffix}`
    try {
      await copyFile(filePath, candidate, constants.COPYFILE_EXCL)
      return candidate
    } catch (error) {
      if (error?.code === 'EEXIST') continue
      if (error?.code === 'ENOENT') return undefined
      throw error
    }
  }
  throw new Error('无法分配备份文件名')
}

function historyIndexPath(homes) {
  return join(homes.dsh, 'agents-desk', 'history.jsonl')
}

async function appendHistory(homes, entry) {
  try {
    await mkdir(dirname(historyIndexPath(homes)), { recursive: true })
    const { appendFile } = await import('node:fs/promises')
    await appendFile(historyIndexPath(homes), JSON.stringify(entry) + '\n', 'utf8')
  } catch { /* the index is an accelerator; .bak files remain the truth */ }
}

/** Backups on disk for one target, newest first. */
async function listBackups(filePath) {
  const dir = dirname(filePath)
  const prefix = `${basename(filePath)}.bak-`
  let entries = []
  try { entries = await readdir(dir) } catch { return [] }
  const rows = []
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue
    const full = join(dir, entry)
    try {
      const info = await stat(full)
      if (!info.isFile()) continue
      rows.push({ backup: full, name: entry, at: info.mtime.toISOString(), bytes: info.size })
    } catch { /* vanished between readdir and stat */ }
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at))
}

async function readBackup(filePath, backupPath) {
  const dir = dirname(filePath)
  const name = basename(backupPath)
  if (dirname(resolve(backupPath)) !== resolve(dir) || !name.startsWith(`${basename(filePath)}.bak-`)) {
    throw Object.assign(new Error('备份路径不合法'), { status: 403 })
  }
  return readFile(resolve(backupPath), 'utf8')
}

/** Write through the fs service with the plugin's own elevated policy. */
async function writeFile(ctx, { cwd, homes, path, content, version, create }) {
  const fsService = requireFs(ctx)
  const projectRoot = await findProjectRoot(fsService, cwd)
  if (!isAllowedPath(path, { cwd, projectRoot, homes })) {
    throw Object.assign(new Error('路径不在允许编辑的指令文件范围内'), { status: 403, code: 'path/forbidden' })
  }
  const target = await fsService.resolve(path)
  const info = await fsService.stat(target)
  const exists = info !== undefined
  if (create && exists) throw Object.assign(new Error('文件已存在，请先读取版本后再保存'), { status: 409, code: 'path/exists' })
  if (!create && !exists) throw Object.assign(new Error('文件不存在'), { status: 404, code: 'path/absent' })
  const expected = create ? { kind: 'createIfAbsent' } : { kind: 'replaceIfVersion', version }
  if (!create && (version === undefined || version === null || version === '')) {
    throw Object.assign(new Error('覆盖写入必须带版本令牌'), { status: 400, code: 'version/missing' })
  }
  let backup
  if (exists) {
    backup = await backupFile(path)
    if (backup !== undefined) {
      appendHistory(homes, { at: new Date().toISOString(), path, backup, bytes: Buffer.byteLength(content, 'utf8'), source: 'save' })
    }
  }
  const policy = { ...ELEVATED, workspaceRoot: dirname(path) }
  try {
    const outcome = await fsService.writeText(target, content, expected, undefined, policy)
    return {
      ok: true, path, bytes: Buffer.byteLength(content, 'utf8'),
      version: outcome?.version ?? null, created: create, backup: backup ?? null,
    }
  } catch (error) {
    if (String(error?.code ?? '').includes('FS_STALE_VERSION') || String(error?.message ?? '').includes('FS_STALE_VERSION')) {
      throw Object.assign(new Error('文件已被外部修改，请重新读取后再保存'), { status: 409, code: 'FS_STALE_VERSION' })
    }
    if (error?.code === 'FS_SANDBOX_DENIED' || error?.code === 'EPERM' || error?.code === 'EACCES') {
      throw Object.assign(new Error(`写入被宿主文件系统拒绝：${messageOf(error)}`), { status: 403, code: 'fs/denied' })
    }
    throw error
  }
}

export function apply(ctx) {
  const homes = resolveHomes()

  const route = (path, methods, handler) => {
    ctx.inject(['connection'], (host) => {
      host.connection.fetch.register({
        path: BASE + path,
        methods,
        requestBody: 'buffered',
        fetch: async (request) => {
          try {
            return await handler(request, host)
          } catch (error) {
            return failure(error)
          }
        },
      })
    })
  }

  const cwdOf = request => new URL(request.url).searchParams.get('cwd') ?? ''

  route('/workspaces', ['GET'], async () => {
    let workspaces = []
    try {
      workspaces = (ctx.get('workspaceRegistry')?.list() ?? []).map(w => ({ id: w.id, title: w.title, path: w.path }))
    } catch { /* headless profiles simply have no workspace list */ }
    return json(200, { homes, workspaces, defaultCwd: workspaces[0]?.path ?? '' })
  })

  route('/scopes', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const cwd = cwdOf(request)
    if (cwd === '') throw Object.assign(new Error('缺少 cwd'), { status: 400 })
    const { projectRoot, scopes } = await discoverScopes(fsService, { cwd, homes })
    let workspaces = []
    try {
      workspaces = (ctx.get('workspaceRegistry')?.list() ?? []).map(w => ({ id: w.id, title: w.title, path: w.path }))
    } catch { /* headless profiles simply have no workspace list */ }
    return json(200, { cwd: resolve(cwd), projectRoot, homes, scopes, workspaces })
  })

  route('/file', ['GET', 'POST'], async (request) => {
    const fsService = requireFs(ctx)
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const cwd = url.searchParams.get('cwd') ?? ''
      const path = url.searchParams.get('path') ?? ''
      if (cwd === '' || path === '') throw Object.assign(new Error('缺少 cwd 或 path'), { status: 400 })
      const projectRoot = await findProjectRoot(fsService, cwd)
      return json(200, await loadFile(fsService, path, { cwd, projectRoot, homes }))
    }
    const body = await readJson(request)
    const { cwd, path, content } = body
    if (typeof cwd !== 'string' || typeof path !== 'string' || typeof content !== 'string') {
      throw Object.assign(new Error('cwd / path / content 必须是字符串'), { status: 400 })
    }
    if (Buffer.byteLength(content, 'utf8') > 1_048_576) {
      throw Object.assign(new Error('内容超过 1 MiB，DSH 不会加载它'), { status: 413 })
    }
    return json(200, await writeFile(ctx, { cwd, homes, path, content, version: body.version, create: body.create === true }))
  })

  route('/chain', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const cwd = cwdOf(request)
    if (cwd === '') throw Object.assign(new Error('缺少 cwd'), { status: 400 })
    return json(200, await buildChain(fsService, { cwd, homes }))
  })

  route('/history', ['GET'], async (request) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path') ?? ''
    if (path === '') throw Object.assign(new Error('缺少 path'), { status: 400 })
    return json(200, { path, backups: await listBackups(path) })
  })

  route('/history/diff', ['GET'], async (request) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path') ?? ''
    const backup = url.searchParams.get('backup') ?? ''
    if (path === '' || backup === '') throw Object.assign(new Error('缺少 path 或 backup'), { status: 400 })
    const oldText = await readBackup(path, backup)
    let current = ''
    try { current = await readFile(path, 'utf8') } catch { /* absent file diffs against empty */ }
    return json(200, { path, backup, hunks: diffHunks(oldText, current) })
  })

  route('/rollback', ['POST'], async (request) => {
    const body = await readJson(request)
    const { cwd, path, backup } = body
    if (typeof cwd !== 'string' || typeof path !== 'string' || typeof backup !== 'string') {
      throw Object.assign(new Error('cwd / path / backup 必须是字符串'), { status: 400 })
    }
    const content = await readBackup(path, backup)
    const fsService = requireFs(ctx)
    const target = await fsService.resolve(path)
    const info = await fsService.stat(target)
    const result = await writeFile(ctx, {
      cwd, homes, path, content,
      version: info?.version,
      create: info === undefined,
    })
    return json(200, { ...result, source: 'rollback' })
  })

  route('/generate', ['POST'], async (request) => {
    const body = await readJson(request)
    const { cwd, path } = body
    if (typeof cwd !== 'string' || typeof path !== 'string') {
      throw Object.assign(new Error('cwd / path 必须是字符串'), { status: 400 })
    }
    const fsService = requireFs(ctx)
    const projectRoot = await findProjectRoot(fsService, cwd)
    if (!isAllowedPath(path, { cwd, projectRoot, homes })) {
      throw Object.assign(new Error('目标路径不合法'), { status: 403 })
    }
    const llm = ctx.get('llm')
    const selector = ctx.get('agentDefaultModel')
    if (llm === undefined || selector === undefined) {
      throw Object.assign(new Error('宿主未提供 llm / agentDefaultModel 服务'), { status: 503 })
    }
    const target = await loadFile(fsService, path, { cwd, projectRoot, homes }).catch(() => ({ exists: false, content: '', version: null }))
    const globalRules = await loadFile(fsService, join(homes.dsh, GLOBAL_NAME), { cwd, projectRoot, homes }).catch(() => ({ content: '' }))
    const selection = selector.currentSelection()
    const { draft, facts } = await generateDraft({
      llm, selection, cwd,
      existing: target.content ?? '',
      globalRules: globalRules.content ?? '',
    })
    return json(200, {
      target: { path, exists: target.exists === true, content: target.content ?? '', version: target.version ?? null },
      draft,
      facts,
      hunks: target.exists === true ? diffHunks(target.content, draft) : [],
      model: { provider: selection.provider, model: selection.model },
    })
  })
}
