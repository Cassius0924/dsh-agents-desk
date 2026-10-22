/**
 * Scope discovery and effective-chain computation for AGENTS.md-compatible
 * instruction files. Mirrors @deepseek-ai/dsh-agent-instructions (0.2.1-rc.2):
 * two user-global roots, then project root -> cwd, four candidate names per
 * directory, trimmed-content dedupe per group, 1 MiB per-file cap, 64 KiB
 * render budget.
 */
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { readdir } from 'node:fs/promises'

export const CANDIDATES = ['AGENTS.md', 'CLAUDE.md', 'AGENTS.local.md', 'CLAUDE.local.md']
export const GLOBAL_NAME = 'AGENTS.md'
export const SOURCE_CAP = 1_048_576
export const RENDER_BUDGET = 65_536
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'lib', 'build', '.next', 'target', 'vendor', '.venv', '__pycache__'])

function expandHome(value, home) {
  if (value === '~') return home
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(home, value.slice(2))
  return value
}

/** Resolve the two instruction roots exactly as the harness does. */
export function resolveHomes(env = process.env, home = homedir()) {
  const dshRaw = typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() !== '' ? env.DSH_HOME : join(home, '.dsh')
  const agentsRaw = typeof env.DSH_AGENTS_HOME === 'string' && env.DSH_AGENTS_HOME.trim() !== '' ? env.DSH_AGENTS_HOME : join(home, '.agents')
  return { dsh: resolve(expandHome(dshRaw, home)), agents: resolve(expandHome(agentsRaw, home)), home }
}

/** Walk upward from cwd to the nearest directory holding a project marker. */
export async function findProjectRoot(fsService, cwd) {
  let dir = resolve(cwd)
  for (;;) {
    try {
      const target = await fsService.resolve(join(dir, '.git'))
      if (await fsService.stat(target) !== undefined) return dir
    } catch { /* unreadable marker is not a marker */ }
    const parent = dirname(dir)
    if (parent === dir) return resolve(cwd)
    dir = parent
  }
}

/** Root .. cwd, inclusive. */
export function ancestorChain(root, cwd) {
  const out = []
  let dir = resolve(cwd)
  const stop = resolve(root)
  for (;;) {
    out.push(dir)
    if (dir === stop) break
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return out.reverse()
}

/** Symbolic display path: exact global files first, then project-relative, then home roots. */
export function displayPath(filePath, homes, projectRoot) {
  const p = resolve(filePath)
  if (p === join(homes.dsh, GLOBAL_NAME)) return '$DSH_HOME/AGENTS.md'
  if (p === join(homes.agents, GLOBAL_NAME)) return '$DSH_AGENTS_HOME/AGENTS.md'
  if (projectRoot) {
    const rel = relative(projectRoot, p)
    if (rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)) return rel.split(sep).join('/')
  }
  for (const [root, label] of [[homes.dsh, '$DSH_HOME'], [homes.agents, '$DSH_AGENTS_HOME']]) {
    if (p === root || p.startsWith(root + sep)) return `${label}/${relative(root, p).split(sep).join('/')}`
  }
  return p
}

/** Probe one candidate without reading it. */
async function statFile(fsService, filePath) {
  try {
    const target = await fsService.resolve(filePath)
    const info = await fsService.stat(target)
    if (info === undefined) return { exists: false, bytes: 0, version: null, target }
    const bytes = typeof info.size === 'number' ? info.size : 0
    return { exists: true, bytes, version: info.version ?? null, target, type: info.type }
  } catch {
    return { exists: false, bytes: 0, version: null }
  }
}

/** Read an existing instruction file, or return empty content. */
async function readScope(fsService, filePath) {
  const probe = await statFile(fsService, filePath)
  if (!probe.exists || probe.type !== 'file') return { ...probe, content: '' }
  if (probe.bytes > SOURCE_CAP) return { ...probe, content: '' }
  try {
    return { ...probe, content: await fsService.readText(probe.target) }
  } catch {
    return { ...probe, content: '' }
  }
}

/** Immediate children directories worth scanning for nested instruction files. */
async function childDirs(dir, limit = 200) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter(e => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.')).slice(0, limit).map(e => join(dir, e.name))
  } catch {
    return []
  }
}

/**
 * Every instruction file a session at `cwd` may load, plus creatable candidates.
 * Nested subdirectory files are scanned to depth 3 and marked dynamic.
 */
export async function discoverScopes(fsService, { cwd, homes, scanDepth = 3, scanSubdirs = true }) {
  const projectRoot = await findProjectRoot(fsService, cwd)
  const rows = []
  const add = async (filePath, kind, dirLabel) => {
    const probe = await statFile(fsService, filePath)
    rows.push({
      path: resolve(filePath),
      display: displayPath(filePath, homes, projectRoot),
      name: basename(filePath),
      kind,
      dirLabel,
      exists: probe.exists && probe.type === 'file',
      bytes: probe.exists ? probe.bytes : 0,
      version: probe.version,
    })
  }
  for (const [root, kind, label] of [[homes.dsh, 'user-global', '$DSH_HOME'], [homes.agents, 'agents-global', '$DSH_AGENTS_HOME']]) {
    await add(join(root, GLOBAL_NAME), kind, label)
  }
  const chain = ancestorChain(projectRoot, cwd)
  for (const dir of chain) {
    for (const name of CANDIDATES) await add(join(dir, name), 'project', displayPath(dir, homes, projectRoot) || '.')
  }
  if (!scanSubdirs) return { projectRoot, scopes: rows }
  const seen = new Set(rows.map(r => r.path))
  // ponytail: 2000-directory scan cap; index on demand if a monorepo exceeds it.
  let visited = 0
  const walk = async (dir, depth) => {
    if (depth > scanDepth || visited >= 2000) return
    for (const child of await childDirs(dir)) {
      if (visited >= 2000) return
      visited += 1
      for (const name of CANDIDATES) {
        const filePath = join(child, name)
        const probe = await statFile(fsService, filePath)
        if (probe.exists && probe.type === 'file' && !seen.has(resolve(filePath))) {
          seen.add(resolve(filePath))
          rows.push({
            path: resolve(filePath),
            display: displayPath(filePath, homes, projectRoot),
            name,
            kind: 'subdir',
            dirLabel: displayPath(child, homes, projectRoot),
            exists: true,
            bytes: probe.bytes,
            version: probe.version,
          })
        }
      }
      await walk(child, depth + 1)
    }
  }
  await walk(projectRoot, 1)
  if (resolve(cwd) !== projectRoot) await walk(cwd, 1)
  return { projectRoot, scopes: rows }
}

/** 64-bit-ish content identity for the harness's trimmed dedupe. */
function digest(text) {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0
  }
  return `${h1.toString(16)}${h2.toString(16)}`
}

/**
 * Effective baseline chain for a session at `cwd`, with dedupe and budget
 * accounting. Nested files are listed separately because the harness renders
 * them in dynamic batches, not inside the baseline budget.
 */
export async function buildChain(fsService, { cwd, homes }) {
  const { projectRoot, scopes } = await discoverScopes(fsService, { cwd, homes })
  const baseline = scopes.filter(s => s.kind !== 'subdir')
  const groupOf = scope => (scope.kind === 'user-global' || scope.kind === 'agents-global') ? 'user-global' : dirname(scope.path)
  const keptByGroup = new Map()
  const rows = []
  let used = 0
  for (const scope of baseline) {
    const row = { ...scope, tokens: 0, status: 'absent', reason: '' }
    rows.push(row)
    if (!scope.exists) { row.reason = '文件不存在'; continue }
    if (scope.bytes > SOURCE_CAP) { row.status = 'ignored'; row.reason = '超过 1 MiB，整份忽略'; continue }
    const read = await readScope(fsService, scope.path)
    const trimmed = read.content.trim()
    const group = groupOf(scope)
    const seen = keptByGroup.get(group) ?? new Set()
    const key = digest(trimmed)
    if (trimmed !== '' && seen.has(key)) {
      row.status = 'duplicate'; row.reason = '同目录已有相同内容，被去重'; continue
    }
    if (trimmed !== '') { seen.add(key); keptByGroup.set(group, seen) }
    const remaining = RENDER_BUDGET - used
    if (remaining <= 0) { row.status = 'omitted'; row.reason = '渲染预算已用完'; continue }
    if (scope.bytes > remaining) {
      row.status = 'truncated'
      row.reason = `只纳入前 ${remaining} B（预算 ${RENDER_BUDGET} B）`
      row.included = remaining
      row.tokens = Math.ceil(remaining / 4)
      used = RENDER_BUDGET
      continue
    }
    row.status = 'loaded'
    row.included = scope.bytes
    row.tokens = Math.ceil(scope.bytes / 4)
    used += scope.bytes
  }
  const dynamic = scopes.filter(s => s.kind === 'subdir').map(s => ({
    ...s, tokens: Math.ceil(s.bytes / 4), status: 'dynamic', reason: '仅当工具触碰到该目录后的文件时注入',
  }))
  return {
    cwd: resolve(cwd), projectRoot, budget: { limit: RENDER_BUDGET, used, remaining: RENDER_BUDGET - used },
    rows, dynamic, scannedAt: new Date().toISOString(),
  }
}

/** Path whitelist: global roots, or a candidate name inside the workspace tree. */
export function isAllowedPath(filePath, { cwd, projectRoot, homes }) {
  const p = resolve(filePath)
  const name = basename(p)
  if (name === GLOBAL_NAME && (p === join(homes.dsh, GLOBAL_NAME) || p === join(homes.agents, GLOBAL_NAME))) return true
  if (!CANDIDATES.includes(name)) return false
  const base = projectRoot ?? resolve(cwd)
  const rel = relative(base, p)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return false
  return rel.split(sep).length <= 5
}

/** Public view of one file for the editor. */
export async function loadFile(fsService, filePath, { cwd, projectRoot, homes }) {
  if (!isAllowedPath(filePath, { cwd, projectRoot, homes })) {
    const error = new Error('路径不在允许编辑的指令文件范围内')
    error.status = 403
    throw error
  }
  const probe = await statFile(fsService, filePath)
  if (!probe.exists) return { path: resolve(filePath), exists: false, content: '', version: null, bytes: 0 }
  if (probe.type !== 'file') {
    const error = new Error('目标不是普通文件')
    error.status = 400
    throw error
  }
  if (probe.bytes > SOURCE_CAP) {
    const error = new Error('文件超过 1 MiB，DSH 不会加载它；请先精简')
    error.status = 413
    throw error
  }
  const content = await fsService.readText(probe.target)
  return { path: resolve(filePath), exists: true, content, version: probe.version, bytes: Buffer.byteLength(content, 'utf8') }
}
