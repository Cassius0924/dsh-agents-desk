/**
 * dsh-agents-desk host half.
 *
 * Routes ride Connection's /api fence (Host/Origin + browser auth). Every write
 * is additionally limited to a server-side whitelist of instruction-file paths,
 * guarded by the fs service's version token, and backed up after it lands.
 */
import { readFileSync } from 'node:fs'
import { appendFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { buildChain, discoverScopes, findProjectRoot, isAllowedPath, loadFile, resolveHomes, GLOBAL_NAME } from './scopes.js'
import { diffHunks } from './diff.js'
import { generateDraft } from './generate.js'

export const name = 'agents-desk'

const BASE = '/api/agents-desk'
const MAX_BODY = 2 * 1024 * 1024
const MAX_CONTENT = 1_048_576
const ELEVATED = { mode: 'danger-full-access' }
const PLUGIN_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version

function json(status, payload) {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

function messageOf(error) {
  return String(error?.message ?? error)
}

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code })
}

function failure(error) {
  const status = Number.isInteger(error?.status) ? error.status : 500
  const code = typeof error?.code === 'string' && error.code.includes('/') ? error.code : 'internal/error'
  return json(status, { error: messageOf(error), code, status })
}

function serviceOf(ctx, serviceName) {
  try {
    return ctx.get(serviceName) ?? undefined
  } catch {
    return undefined
  }
}

function workspaceList(ctx) {
  const registry = serviceOf(ctx, 'workspaceRegistry')
  if (registry === undefined) return []
  try {
    return registry.list().map(workspace => ({ id: workspace.id, title: workspace.title, path: workspace.path }))
  } catch {
    return []
  }
}

function fieldString(value, message, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && value === '')) {
    throw httpError(400, 'request/missing-field', message)
  }
  return value
}

async function readJson(request) {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY) {
    throw httpError(413, 'body/too-large', '请求体过大')
  }
  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) throw httpError(413, 'body/too-large', '请求体过大')
  try {
    return JSON.parse(text)
  } catch {
    throw httpError(400, 'body/invalid-json', '请求体必须是 JSON')
  }
}

function requireFs(ctx) {
  const fsService = serviceOf(ctx, 'fs')
  if (fsService === undefined) {
    throw httpError(503, 'fs/unavailable', '宿主 fs 服务不可用')
  }
  return fsService
}

function isWithin(child, root) {
  const c = resolve(child)
  const r = resolve(root)
  return c === r || c.startsWith(r.endsWith(sep) ? r : r + sep)
}

async function canonicalPath(fsService, filePath) {
  try {
    const target = await fsService.resolve(filePath)
    return typeof fsService.processPath === 'function' ? fsService.processPath(target) : resolve(filePath)
  } catch {
    return undefined
  }
}

async function isAllowedCwd(ctx, fsService, cwd, target, homes) {
  const registry = serviceOf(ctx, 'workspaceRegistry')
  if (registry === undefined) return true
  let workspacePaths
  try {
    workspacePaths = registry.list().map(workspace => workspace.path)
  } catch {
    return true
  }
  const candidates = [resolve(cwd)]
  const canonical = typeof fsService.processPath === 'function' ? fsService.processPath(target) : undefined
  if (canonical !== undefined) candidates.push(canonical)
  const roots = [...workspacePaths, homes.home, homes.dsh].filter(root => typeof root === 'string' && root !== '')
  return roots.some(root => candidates.some(candidate => isWithin(candidate, root)))
}

/** Validate a request cwd: absolute, an existing directory, and inside the host's roots. */
async function requireCwd(ctx, homes, rawCwd, message = '缺少 cwd') {
  const cwd = fieldString(rawCwd, message)
  const fsService = requireFs(ctx)
  if (!isAbsolute(cwd)) throw httpError(400, 'request/invalid-cwd', 'cwd 必须是绝对路径')
  let target
  try {
    target = await fsService.resolve(cwd)
    const info = await fsService.stat(target)
    if (info?.type !== 'directory') target = undefined
  } catch {
    target = undefined
  }
  if (target === undefined) throw httpError(400, 'request/invalid-cwd', 'cwd 必须是已存在的目录')
  if (!await isAllowedCwd(ctx, fsService, cwd, target, homes)) {
    throw httpError(400, 'request/invalid-cwd', 'cwd 不在已注册的工作区或指令文件目录下')
  }
  return resolve(cwd)
}

/** Validate the edited path and return its project root. */
async function allowPath(fsService, path, { cwd, homes, message }) {
  const projectRoot = await findProjectRoot(fsService, cwd)
  if (!isAllowedPath(path, { cwd, projectRoot, homes })) {
    throw httpError(403, 'path/forbidden', message)
  }
  return projectRoot
}

async function canonicalRoots(fsService, { cwd, projectRoot, homes }) {
  const canonical = async value => (await canonicalPath(fsService, value)) ?? resolve(value)
  const [canonicalCwd, canonicalProjectRoot, dsh, agents, home] = await Promise.all([
    canonical(cwd), canonical(projectRoot), canonical(homes.dsh), canonical(homes.agents), canonical(homes.home),
  ])
  return { cwd: canonicalCwd, projectRoot: canonicalProjectRoot, homes: { dsh, agents, home } }
}

async function assertNoSymlink(fsService, filePath) {
  if (typeof fsService.lstat !== 'function') return
  let info
  try {
    info = await fsService.lstat(filePath)
  } catch {
    return
  }
  if (info?.type === 'symlink') throw httpError(403, 'path/symlink', '目标是符号链接，拒绝写入')
}

/** Resolve the write target and re-check the real host path against the whitelisted roots. */
async function resolveWriteTarget(fsService, { path, cwd, projectRoot, homes }) {
  const target = await fsService.resolve(path)
  await assertNoSymlink(fsService, path)
  if (typeof fsService.processPath !== 'function') return target
  const hostPath = fsService.processPath(target)
  if (isAllowedPath(hostPath, { cwd, projectRoot, homes })) return target
  if (isAllowedPath(hostPath, await canonicalRoots(fsService, { cwd, projectRoot, homes }))) return target
  throw httpError(403, 'path/symlink', '目标经符号链接解析后不在允许的指令文件范围内')
}

function backupStamp(now = new Date()) {
  const pad = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
    + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

async function writeBackup(filePath, content) {
  const stamp = backupStamp()
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${filePath}.bak-${stamp}${attempt === 0 ? '' : `-${attempt}`}`
    try {
      await writeFile(candidate, content, { flag: 'wx', encoding: 'utf8' })
      return candidate
    } catch (error) {
      if (error?.code === 'EEXIST') continue
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
    await appendFile(historyIndexPath(homes), `${JSON.stringify(entry)}\n`, 'utf8')
  } catch { /* the index is an accelerator; .bak files remain the truth */ }
}

async function readHistorySources(homes) {
  const sources = new Map()
  let raw
  try {
    raw = await readFile(historyIndexPath(homes), 'utf8')
  } catch {
    return sources
  }
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue
    try {
      const entry = JSON.parse(line)
      if (typeof entry?.backup === 'string' && typeof entry?.source === 'string') {
        sources.set(resolve(entry.backup), entry.source)
      }
    } catch { /* a torn line must not hide the intact ones */ }
  }
  return sources
}

/** Backups on disk for one target, newest first. */
async function listBackups(filePath, sources) {
  const dir = dirname(filePath)
  const prefix = `${basename(filePath)}.bak-`
  let entries
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }
  const rows = []
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue
    const full = join(dir, entry)
    try {
      const info = await lstat(full)
      if (!info.isFile()) continue
      rows.push({
        backup: full, name: entry, at: info.mtime.toISOString(), bytes: info.size,
        source: sources.get(resolve(full)) ?? null,
      })
    } catch { /* vanished between readdir and lstat */ }
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at))
}

async function readBackup(filePath, backupPath) {
  const resolvedBackup = resolve(backupPath)
  const name = basename(resolvedBackup)
  if (dirname(resolvedBackup) !== resolve(dirname(filePath)) || !name.startsWith(`${basename(filePath)}.bak-`)) {
    throw httpError(403, 'backup/invalid', '备份路径不合法')
  }
  let info
  try {
    info = await lstat(resolvedBackup)
  } catch (error) {
    if (error?.code === 'ENOENT') throw httpError(404, 'backup/not-found', '备份不存在')
    throw error
  }
  if (!info.isFile()) throw httpError(403, 'backup/invalid', '备份必须是同目录下的普通文件')
  if (info.size > MAX_CONTENT) throw httpError(413, 'content/too-large', '备份超过 1 MiB，DSH 不会加载它')
  try {
    return await readFile(resolvedBackup, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') throw httpError(404, 'backup/not-found', '备份不存在')
    throw error
  }
}

function mapWriteError(error) {
  const code = String(error?.code ?? '')
  if (code === 'FS_STALE_VERSION') {
    return httpError(409, 'version/stale', '文件已被外部修改，请重新读取后再保存')
  }
  if (code === 'FS_NOT_OBSERVED') {
    return httpError(409, 'path/exists', '文件已存在，请先读取版本后再保存')
  }
  if (code === 'FS_SANDBOX_DENIED' || code === 'FS_PERMISSION_DENIED' || code === 'EPERM' || code === 'EACCES') {
    return httpError(403, 'fs/denied', `写入被宿主文件系统拒绝：${messageOf(error)}`)
  }
  return error
}

async function readPreviousText(fsService, target) {
  try {
    return await fsService.readText(target)
  } catch {
    return undefined
  }
}

/** Write through the fs service with the plugin's own elevated policy, then back up the old text. */
async function guardedWrite(ctx, { homes, cwd, projectRoot, path, content, version, create, source }) {
  const fsService = requireFs(ctx)
  if (!isAllowedPath(path, { cwd, projectRoot, homes })) {
    throw httpError(403, 'path/forbidden', '路径不在允许编辑的指令文件范围内')
  }
  const target = await resolveWriteTarget(fsService, { path, cwd, projectRoot, homes })
  const info = await fsService.stat(target)
  const exists = info !== undefined
  if (create && exists) throw httpError(409, 'path/exists', '文件已存在，请先读取版本后再保存')
  if (!create && !exists) throw httpError(404, 'path/absent', '文件不存在')
  if (!create && (version === undefined || version === null || version === '')) {
    throw httpError(400, 'version/missing', '覆盖写入必须带版本令牌')
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT) {
    throw httpError(413, 'content/too-large', '内容超过 1 MiB，DSH 不会加载它')
  }
  const previous = exists ? await readPreviousText(fsService, target) : undefined
  const expected = create ? { kind: 'createIfAbsent' } : { kind: 'replaceIfVersion', version }
  const policy = { ...ELEVATED, workspaceRoot: dirname(path) }
  let outcome
  try {
    outcome = await fsService.writeText(target, content, expected, undefined, policy)
  } catch (error) {
    throw mapWriteError(error)
  }
  const bytes = Buffer.byteLength(content, 'utf8')
  const result = { ok: true, path, bytes, version: outcome?.version ?? null, created: create, backup: null }
  if (previous === undefined) {
    if (exists) result.backupError = '无法读取写入前内容，未生成备份'
    return result
  }
  try {
    result.backup = await writeBackup(path, previous)
  } catch (error) {
    result.backupError = `无法写入备份：${messageOf(error)}`
    return result
  }
  await appendHistory(homes, { at: new Date().toISOString(), path, backup: result.backup, bytes, source })
  return result
}

export function registerRoutes(ctx, { homes = resolveHomes() } = {}) {
  const route = (path, methods, handler) => {
    ctx.inject(['connection'], (host) => {
      host.effect(() => host.connection.fetch.register({
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
      }), `agents-desk: route ${path}`)
    })
  }

  route('/workspaces', ['GET'], async () => {
    const workspaces = workspaceList(ctx)
    return json(200, { homes, workspaces, defaultCwd: workspaces[0]?.path ?? '' })
  })

  route('/health', ['GET'], async () => json(200, {
    ok: true,
    name,
    version: PLUGIN_VERSION,
    capabilities: {
      fs: serviceOf(ctx, 'fs') !== undefined,
      workspaceRegistry: serviceOf(ctx, 'workspaceRegistry') !== undefined,
      llm: serviceOf(ctx, 'llm') !== undefined,
      agentDefaultModel: serviceOf(ctx, 'agentDefaultModel') !== undefined,
    },
    homes,
  }))

  route('/scopes', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const cwd = await requireCwd(ctx, homes, new URL(request.url).searchParams.get('cwd') ?? '')
    const { projectRoot, scopes } = await discoverScopes(fsService, { cwd, homes })
    return json(200, { cwd, projectRoot, homes, scopes, workspaces: workspaceList(ctx) })
  })

  route('/chain', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const cwd = await requireCwd(ctx, homes, new URL(request.url).searchParams.get('cwd') ?? '')
    return json(200, await buildChain(fsService, { cwd, homes }))
  })

  route('/file', ['GET', 'POST'], async (request) => {
    if (request.method === 'GET') {
      const fsService = requireFs(ctx)
      const url = new URL(request.url)
      const cwd = await requireCwd(ctx, homes, url.searchParams.get('cwd') ?? '', '缺少 cwd 或 path')
      const path = resolve(fieldString(url.searchParams.get('path'), '缺少 cwd 或 path'))
      const projectRoot = await findProjectRoot(fsService, cwd)
      return json(200, await loadFile(fsService, path, { cwd, projectRoot, homes }))
    }
    const body = await readJson(request)
    const fields = 'cwd / path / content 必须是字符串'
    const cwd = await requireCwd(ctx, homes, body?.cwd, fields)
    const path = resolve(fieldString(body?.path, fields))
    const content = fieldString(body?.content, fields, true)
    if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT) {
      throw httpError(413, 'content/too-large', '内容超过 1 MiB，DSH 不会加载它')
    }
    const fsService = requireFs(ctx)
    const projectRoot = await findProjectRoot(fsService, cwd)
    return json(200, await guardedWrite(ctx, {
      homes, cwd, projectRoot, path, content,
      version: body.version, create: body.create === true, source: 'save',
    }))
  })

  route('/history', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const url = new URL(request.url)
    const cwd = await requireCwd(ctx, homes, url.searchParams.get('cwd') ?? '')
    const path = resolve(fieldString(url.searchParams.get('path'), '缺少 path'))
    await allowPath(fsService, path, { cwd, homes, message: '路径不在允许读取的指令文件范围内' })
    const sources = await readHistorySources(homes)
    return json(200, { path, backups: await listBackups(path, sources) })
  })

  route('/history/diff', ['GET'], async (request) => {
    const fsService = requireFs(ctx)
    const url = new URL(request.url)
    const cwd = await requireCwd(ctx, homes, url.searchParams.get('cwd') ?? '')
    const path = resolve(fieldString(url.searchParams.get('path'), '缺少 path 或 backup'))
    const backup = resolve(fieldString(url.searchParams.get('backup'), '缺少 path 或 backup'))
    await allowPath(fsService, path, { cwd, homes, message: '路径不在允许读取的指令文件范围内' })
    const oldText = await readBackup(path, backup)
    let current = ''
    try { current = await readFile(path, 'utf8') } catch { /* absent file diffs against empty */ }
    return json(200, { path, backup, hunks: diffHunks(oldText, current) })
  })

  route('/rollback', ['POST'], async (request) => {
    const body = await readJson(request)
    const fields = 'cwd / path / backup 必须是字符串'
    const fsService = requireFs(ctx)
    const cwd = await requireCwd(ctx, homes, body?.cwd, fields)
    const path = resolve(fieldString(body?.path, fields))
    const backup = resolve(fieldString(body?.backup, fields))
    const projectRoot = await allowPath(fsService, path, { cwd, homes, message: '路径不在允许编辑的指令文件范围内' })
    const content = await readBackup(path, backup)
    const target = await fsService.resolve(path)
    const info = await fsService.stat(target)
    const result = await guardedWrite(ctx, {
      homes, cwd, projectRoot, path, content,
      version: body.version, create: info === undefined && body.version == null, source: 'rollback',
    })
    return json(200, { ...result, source: 'rollback' })
  })

  route('/generate', ['POST'], async (request) => {
    const body = await readJson(request)
    const fields = 'cwd / path 必须是字符串'
    const fsService = requireFs(ctx)
    const cwd = await requireCwd(ctx, homes, body?.cwd, fields)
    const path = resolve(fieldString(body?.path, fields))
    const projectRoot = await allowPath(fsService, path, { cwd, homes, message: '目标路径不合法' })
    const llm = serviceOf(ctx, 'llm')
    const selector = serviceOf(ctx, 'agentDefaultModel')
    if (llm === undefined || selector === undefined) {
      throw httpError(503, 'llm/unavailable', '宿主未提供 llm / agentDefaultModel 服务')
    }
    const targetFile = await loadFile(fsService, path, { cwd, projectRoot, homes })
    const scope = path === join(homes.dsh, GLOBAL_NAME) ? 'user-global'
      : path === join(homes.agents, GLOBAL_NAME) ? 'agents-global' : 'project'
    const globalRules = scope === 'project'
      ? await loadFile(fsService, join(homes.dsh, GLOBAL_NAME), { cwd, projectRoot, homes }).catch(() => ({ content: '' }))
      : { content: '' }
    const generated = await generateDraft({
      llm, selector, cwd, scope,
      existing: targetFile.content ?? '',
      globalRules: globalRules.content ?? '',
      signal: request.signal,
    })
    return json(200, {
      scope,
      target: { path, exists: targetFile.exists === true, content: targetFile.content ?? '', version: targetFile.version ?? null },
      draft: generated.draft,
      facts: generated.facts,
      hunks: targetFile.exists === true ? diffHunks(targetFile.content, generated.draft) : [],
      model: generated.model,
    })
  })
}

export function apply(ctx) {
  registerRoutes(ctx)
}
