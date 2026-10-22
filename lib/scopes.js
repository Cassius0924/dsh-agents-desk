/**
 * Instruction-file discovery and effective-chain computation.
 *
 * Mirrors @deepseek-ai/dsh-agent-instructions 0.2.1-rc.2: two user-global
 * roots, project root -> cwd, base and `.local` candidates per directory,
 * trimmed-content SHA-1 dedupe per candidate group, a 1 MiB source cap, and a
 * 64 KiB rendered budget that drops broad files before specific ones and only
 * truncates the most specific file. The rendered text is rebuilt with the same
 * section headers, intro sentence, and system-reminder frame the host uses, so
 * the reported budget is the host's byte count rather than a sum of file sizes.
 */
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { readdir } from 'node:fs/promises'

export const CANDIDATES = ['AGENTS.md', 'CLAUDE.md', 'AGENTS.local.md', 'CLAUDE.local.md']
export const GLOBAL_NAME = 'AGENTS.md'
export const SOURCE_CAP = 1_048_576
export const RENDER_BUDGET = 65_536
export const PROJECT_ROOT_MARKERS = ['.git']

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'target', 'vendor', '.venv', '__pycache__'])
const SCAN_DEPTH = 3
const SCAN_DIR_CAP = 2000
const READ_CONCURRENCY = 8
const SCAN_BATCH = 24

const SYSTEM_REMINDER_OPEN = '<system-reminder>'
const SYSTEM_REMINDER_CLOSE = '</system-reminder>'
const INTRO = 'The following workspace instructions may be relevant to your work. '
  + 'Use them as guidance when applicable. More specific instructions take precedence over broader ones. '
  + 'They do not override system, developer, or direct user instructions.'
const COMPACT_INTRO = 'Workspace instructions were omitted or truncated to fit the configured byte budget.'

export const LIMITS = Object.freeze({
  maxBytes: RENDER_BUDGET,
  maxSourceBytes: SOURCE_CAP,
  projectRootMarkers: Object.freeze([...PROJECT_ROOT_MARKERS]),
  instructionFileCandidates: Object.freeze([...CANDIDATES]),
})

const textBytes = value => Buffer.byteLength(value, 'utf8')

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

function globalLabel(root, defaultRoot, envName, defaultLabel) {
  return resolve(root) === resolve(defaultRoot) ? defaultLabel : `$${envName}`
}

/** Walk upward from cwd to the nearest directory holding a configured marker. */
export async function findProjectRoot(fsService, cwd, markers = PROJECT_ROOT_MARKERS) {
  const start = resolve(cwd)
  for (let dir = start; ;) {
    for (const marker of markers) {
      try {
        const target = await fsService.resolve(join(dir, marker))
        if (await fsService.stat(target) !== undefined) return dir
      } catch { /* an unreadable marker is not a marker */ }
    }
    const parent = dirname(dir)
    if (parent === dir) return start
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

/**
 * Keep a project-relative display path out of the user-global namespace, as
 * the host's escapeProjectDisplayPath does.
 */
function escapeDisplay(relPath) {
  if (relPath === '') return '.'
  const first = relPath.split(sep)[0]
  const escaped = first === 'user-global' || first === 'agents-global' ? `.${sep}${relPath}` : relPath
  return escaped.split(sep).join('/')
}

/** Symbolic display path: exact global files first, then project-relative, then home roots. */
export function displayPath(filePath, homes, projectRoot) {
  const p = resolve(filePath)
  const dshDefault = join(homes.home, '.dsh')
  const agentsDefault = join(homes.home, '.agents')
  if (p === join(homes.dsh, GLOBAL_NAME)) return `${globalLabel(homes.dsh, dshDefault, 'DSH_HOME', '~/.dsh')}/${GLOBAL_NAME}`
  if (p === join(homes.agents, GLOBAL_NAME)) return `${globalLabel(homes.agents, agentsDefault, 'DSH_AGENTS_HOME', '~/.agents')}/${GLOBAL_NAME}`
  if (projectRoot) {
    const rel = relative(resolve(projectRoot), p)
    if (rel === '') return '.'
    if (!rel.startsWith('..') && !isAbsolute(rel)) return escapeDisplay(rel)
  }
  for (const [root, label] of [
    [homes.dsh, globalLabel(homes.dsh, dshDefault, 'DSH_HOME', '~/.dsh')],
    [homes.agents, globalLabel(homes.agents, agentsDefault, 'DSH_AGENTS_HOME', '~/.agents')],
  ]) {
    if (p === root || p.startsWith(root + sep)) return `${label}/${relative(root, p).split(sep).join('/')}`
  }
  return p
}

/** Probe one candidate without reading it. */
async function statFile(fsService, filePath) {
  try {
    const target = await fsService.resolve(filePath)
    const info = await fsService.stat(target)
    if (info === undefined || info.type !== 'file') return { exists: false, bytes: 0, version: null, target }
    const bytes = typeof info.size === 'number' ? info.size : 0
    return { exists: true, bytes, version: info.version ?? null, target, type: info.type }
  } catch {
    return { exists: false, bytes: 0, version: null }
  }
}

/** Read a directory once, through the fs provider when it can list. */
async function listDirectory(fsService, dir) {
  if (typeof fsService.listDir === 'function') {
    try {
      const target = await fsService.resolve(dir)
      const entries = await fsService.listDir(target)
      return { ok: true, entries: entries.map(entry => ({ ...entry })) }
    } catch {
      return { ok: false, entries: [] }
    }
  }
  try {
    const dirents = await readdir(dir, { withFileTypes: true })
    const entries = []
    for (const dirent of dirents) {
      if (dirent.isDirectory()) entries.push({ name: dirent.name, type: 'directory' })
      else if (dirent.isFile()) {
        const probe = await statFile(fsService, join(dir, dirent.name))
        entries.push({ name: dirent.name, type: 'file', size: probe.bytes, version: probe.version })
      }
    }
    return { ok: true, entries }
  } catch {
    return { ok: false, entries: [] }
  }
}

function entryFiles(dir, listing, candidates) {
  const byName = new Map(listing.entries.map(entry => [entry.name, entry]))
  return candidates.map(name => {
    const entry = byName.get(name)
    const present = entry?.type === 'file'
    return {
      path: resolve(join(dir, name)),
      name,
      dir,
      exists: present,
      bytes: present && typeof entry.size === 'number' ? entry.size : 0,
      version: present ? entry.version ?? null : null,
    }
  })
}

function childDirs(dir, listing) {
  return listing.entries
    .filter(entry => entry.type === 'directory' && !entry.name.startsWith('.') && !SKIP_DIRS.has(entry.name))
    .map(entry => join(dir, entry.name))
}

/**
 * Every instruction candidate a session at `cwd` may load, plus creatable
 * candidates and nested subdirectory files. Directory listings are cached and
 * scanned breadth-first so a monorepo costs one provider round-trip per
 * directory instead of four stats per candidate.
 */
export async function discoverScopes(fsService, {
  cwd,
  homes,
  scanDepth = SCAN_DEPTH,
  scanSubdirs = true,
  candidates = CANDIDATES,
  projectRootMarkers = PROJECT_ROOT_MARKERS,
} = {}) {
  const projectRoot = await findProjectRoot(fsService, cwd, projectRootMarkers)
  const listings = new Map()
  const listingOf = async (dir) => {
    const key = resolve(dir)
    if (!listings.has(key)) listings.set(key, await listDirectory(fsService, dir))
    return listings.get(key)
  }
  const rows = []
  const seenPaths = new Set()
  const addCandidateRows = (dir, kind, label, names = candidates) => {
    const listing = listings.get(resolve(dir)) ?? { entries: [] }
    for (const file of entryFiles(dir, listing, names)) {
      if (seenPaths.has(file.path)) continue
      seenPaths.add(file.path)
      rows.push({
        path: file.path,
        display: displayPath(file.path, homes, projectRoot),
        name: file.name,
        kind,
        dirLabel: label,
        exists: file.exists,
        bytes: file.bytes,
        version: file.version,
      })
    }
  }

  await Promise.all([listingOf(homes.dsh), listingOf(homes.agents)])
  for (const [root, kind, label] of [
    [homes.dsh, 'user-global', globalLabel(homes.dsh, join(homes.home, '.dsh'), 'DSH_HOME', '~/.dsh')],
    [homes.agents, 'agents-global', globalLabel(homes.agents, join(homes.home, '.agents'), 'DSH_AGENTS_HOME', '~/.agents')],
  ]) {
    addCandidateRows(root, kind, label, [GLOBAL_NAME])
  }

  const chain = ancestorChain(projectRoot, cwd)
  await Promise.all(chain.map(dir => listingOf(dir)))
  for (const dir of chain) addCandidateRows(dir, 'project', displayPath(dir, homes, projectRoot))

  if (!scanSubdirs) return { projectRoot, scopes: rows, scannedDirs: chain.length }

  const seenDirs = new Set()
  const starts = [projectRoot]
  if (resolve(cwd) !== resolve(projectRoot)) starts.push(resolve(cwd))
  let visited = 0
  let frontier = starts.map(dir => ({ dir, depth: 0 }))
  while (frontier.length > 0 && visited < SCAN_DIR_CAP) {
    const batch = []
    while (frontier.length > 0 && batch.length < SCAN_BATCH) {
      const item = frontier.shift()
      if (!seenDirs.has(resolve(item.dir))) {
        seenDirs.add(resolve(item.dir))
        batch.push(item)
      }
    }
    if (batch.length === 0) break
    await Promise.all(batch.map(item => listingOf(item.dir)))
    for (const item of batch) {
      if (item.depth === 0) {
        frontier.push(...childDirs(item.dir, listings.get(resolve(item.dir))).map(dir => ({ dir, depth: 1 })))
        continue
      }
      if (visited >= SCAN_DIR_CAP) break
      visited += 1
      const listing = listings.get(resolve(item.dir)) ?? { entries: [] }
      const dirLabel = displayPath(item.dir, homes, projectRoot)
      for (const file of entryFiles(item.dir, listing, candidates)) {
        if (!file.exists || seenPaths.has(file.path)) continue
        seenPaths.add(file.path)
        rows.push({
          path: file.path,
          display: displayPath(file.path, homes, projectRoot),
          name: file.name,
          kind: 'subdir',
          dirLabel,
          exists: true,
          bytes: file.bytes,
          version: file.version,
        })
      }
      if (item.depth < scanDepth) {
        frontier.push(...childDirs(item.dir, listing).map(dir => ({ dir, depth: item.depth + 1 })))
      }
    }
  }
  return { projectRoot, scopes: rows, scannedDirs: seenDirs.size }
}

/** SHA-1 of trimmed content, the host's duplicate-suppression identity. */
function trimmedDigest(content) {
  return createHash('sha1').update(content.trim()).digest('hex')
}

function escapeFrameBody(body) {
  return body.replaceAll(SYSTEM_REMINDER_CLOSE, '<\\/system-reminder>')
}

function sectionText(file) {
  return `Instructions from: ${file.display}\n\n${file.content}`
}

function markerText(maxBytes, omitted, truncated) {
  if (omitted.length === 0 && truncated.length === 0) return ''
  const parts = []
  if (omitted.length > 0) parts.push(`omitted ${omitted.map(file => file.display).join(', ')}`)
  if (truncated.length > 0) {
    parts.push(`truncated ${truncated.map(item => `${item.display} from ${item.originalBytes} to ${item.includedBytes} bytes`).join(', ')}`)
  }
  return `Workspace instruction budget ${maxBytes} bytes: ${parts.join('; ')}`
}

function buildInstructionText(files, maxBytes, omitted, truncated, intro) {
  const marker = markerText(maxBytes, omitted, truncated)
  const body = [marker, intro, ...files.map(sectionText)].filter(block => block.length > 0)
  return [SYSTEM_REMINDER_OPEN, escapeFrameBody(body.join('\n\n')), SYSTEM_REMINDER_CLOSE].join('\n')
}

function truncateUtf8(value, maxBytes) {
  const bytes = Buffer.from(value, 'utf8')
  if (bytes.length <= maxBytes) return value
  let end = Math.max(0, Math.trunc(maxBytes))
  while (end > 0 && (bytes.readUInt8(end) & 0xc0) === 0x80) end -= 1
  return bytes.subarray(0, end).toString('utf8')
}

function withTruncatedContent(file, includedBytes) {
  return { ...file, content: truncateUtf8(file.content, includedBytes) }
}

function truncateToFit(file, maxBytes, omitted, intro) {
  const originalBytes = textBytes(file.content)
  let low = 0
  let high = originalBytes
  let best = withTruncatedContent(file, 0)
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const candidate = withTruncatedContent(file, mid)
    const truncated = [{ display: file.display, originalBytes, includedBytes: textBytes(candidate.content) }]
    const text = buildInstructionText([candidate], maxBytes, omitted, truncated, intro)
    if (textBytes(text) <= maxBytes) {
      best = candidate
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return best
}

/**
 * Rebuild the host's bounded render for loaded files.
 * @returns rendered text, retained/omitted files, truncation map (path -> included bytes)
 */
function renderInstructionSet(files, maxBytes) {
  if (files.length === 0) return { text: '', represented: [], omitted: [], truncated: new Map() }
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    return { text: '', represented: [], omitted: files, truncated: new Map() }
  }
  const full = buildInstructionText(files, maxBytes, [], [], INTRO)
  if (textBytes(full) <= maxBytes) return { text: full, represented: files, omitted: [], truncated: new Map() }

  for (let start = 1; start < files.length; start += 1) {
    const included = files.slice(start)
    const omitted = files.slice(0, start)
    const text = buildInstructionText(included, maxBytes, omitted, [], INTRO)
    if (textBytes(text) <= maxBytes) return { text, represented: included, omitted, truncated: new Map() }
  }

  const mostSpecific = files.at(-1)
  if (mostSpecific === undefined) return { text: '', represented: [], omitted: [], truncated: new Map() }
  const omitted = files.slice(0, -1)
  const originalBytes = textBytes(mostSpecific.content)
  for (const intro of [INTRO, COMPACT_INTRO]) {
    const truncatedFile = truncateToFit(mostSpecific, maxBytes, omitted, intro)
    const includedBytes = textBytes(truncatedFile.content)
    const truncated = [{ display: mostSpecific.display, originalBytes, includedBytes }]
    const text = buildInstructionText([truncatedFile], maxBytes, omitted, truncated, intro)
    if (textBytes(text) <= maxBytes) {
      const represented = includedBytes > 0 || originalBytes === 0 ? [mostSpecific] : []
      return { text, represented, omitted, truncated: new Map([[mostSpecific.path, includedBytes]]) }
    }
  }

  const truncated = [{ display: mostSpecific.display, originalBytes, includedBytes: 0 }]
  const compactNotice = escapeFrameBody(markerText(maxBytes, omitted, truncated))
  const withHeading = escapeFrameBody([compactNotice, sectionText({ ...mostSpecific, content: '' })].join('\n\n'))
  const truncatedMap = new Map([[mostSpecific.path, 0]])
  if (textBytes(withHeading) <= maxBytes) {
    return { text: withHeading, represented: originalBytes === 0 ? [mostSpecific] : [], omitted, truncated: truncatedMap }
  }
  const text = textBytes(compactNotice) <= maxBytes ? compactNotice : truncateUtf8(compactNotice, maxBytes)
  return { text, represented: [], omitted, truncated: truncatedMap }
}

async function mapLimit(items, limit, run) {
  const out = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      out[index] = await run(items[index], index)
    }
  })
  await Promise.all(workers)
  return out
}

/** Read one discovered candidate under the host's source cap. */
async function readCandidate(fsService, row, maxSourceBytes) {
  if (row.bytes > maxSourceBytes) return { kind: 'ignored' }
  try {
    const target = await fsService.resolve(row.path)
    const info = await fsService.stat(target)
    if (info === undefined || info.type !== 'file') return { kind: 'absent' }
    if (typeof info.size === 'number' && info.size > maxSourceBytes) return { kind: 'ignored' }
    const content = await fsService.readText(target)
    if (textBytes(content) > maxSourceBytes) return { kind: 'ignored' }
    return { kind: 'loaded', content, version: info.version ?? null, bytes: textBytes(content) }
  } catch {
    return { kind: 'unreadable' }
  }
}

/**
 * Effective baseline chain for a session at `cwd`, with the host's dedupe,
 * source cap, and rendered-budget accounting. Nested files are listed
 * separately because the host injects them in dynamic batches after a tool
 * touches their directory, not inside the baseline budget.
 */
export async function buildChain(fsService, {
  cwd,
  homes,
  maxBytes = LIMITS.maxBytes,
  maxSourceBytes = LIMITS.maxSourceBytes,
  candidates = LIMITS.instructionFileCandidates,
  projectRootMarkers = LIMITS.projectRootMarkers,
  scanSubdirs = true,
} = {}) {
  const { projectRoot, scopes, scannedDirs } = await discoverScopes(fsService, {
    cwd, homes, candidates, projectRootMarkers, scanSubdirs,
  })
  const baseline = scopes.filter(scope => scope.kind !== 'subdir')
  const dynamic = scopes.filter(scope => scope.kind === 'subdir').map(scope => ({
    ...scope,
    tokens: Math.ceil(scope.bytes / 4),
    status: 'dynamic',
    reason: '工具触碰到该目录后按动态批次注入，未计入基线预算',
  }))
  const assumptions = {
    source: maxBytes === LIMITS.maxBytes && maxSourceBytes === LIMITS.maxSourceBytes
      && candidates === LIMITS.instructionFileCandidates && projectRootMarkers === LIMITS.projectRootMarkers
      ? 'defaults'
      : 'custom',
    maxBytes,
    maxSourceBytes,
    projectRootMarkers,
    instructionFileCandidates: candidates,
    note: '按 DSH 默认加载规则静态复算；若会话预设改写了预算或候选名，实际注入可能不同。',
  }
  const reads = await mapLimit(baseline.filter(scope => scope.exists), READ_CONCURRENCY, async scope => ({
    scope,
    read: await readCandidate(fsService, scope, maxSourceBytes),
  }))
  const readByPath = new Map(reads.map(item => [item.scope.path, item.read]))

  const kept = []
  const duplicate = new Set()
  const seenByGroup = new Map()
  for (const scope of baseline) {
    const read = readByPath.get(scope.path)
    if (read?.kind !== 'loaded') continue
    const group = scope.kind === 'user-global' || scope.kind === 'agents-global' ? 'user-global' : dirname(scope.path)
    const seen = seenByGroup.get(group) ?? new Set()
    const digest = trimmedDigest(read.content)
    if (seen.has(digest)) {
      duplicate.add(scope.path)
      continue
    }
    seen.add(digest)
    seenByGroup.set(group, seen)
    kept.push({ ...scope, content: read.content })
  }

  const rendered = renderInstructionSet(kept, maxBytes)
  const omittedPaths = new Set(rendered.omitted.map(file => file.path))
  const representedPaths = new Set(rendered.represented.map(file => file.path))

  const rows = baseline.map(scope => {
    const row = { ...scope, tokens: 0, status: 'absent', reason: '', included: 0 }
    if (!scope.exists) {
      row.reason = '文件不存在'
      return row
    }
    const read = readByPath.get(scope.path)
    if (read?.kind === 'absent') {
      row.status = 'absent'
      row.reason = '扫描后文件已不存在'
      return row
    }
    if (read?.kind === 'ignored') {
      row.status = 'ignored'
      row.reason = `超过 ${maxSourceBytes} B，宿主整份忽略`
      return row
    }
    if (read?.kind === 'unreadable') {
      row.status = 'unreadable'
      row.reason = '读取失败（可能无权限、非 UTF-8 或读取期间被移动）'
      return row
    }
    if (duplicate.has(scope.path)) {
      row.status = 'duplicate'
      row.reason = '同目录更早的候选内容相同，被宿主去重'
      return row
    }
    if (omittedPaths.has(scope.path)) {
      row.status = 'omitted'
      row.reason = read?.kind === 'loaded'
        ? '渲染预算不足，优先保留更具体的文件，本文件被跳过'
        : '渲染预算不足，未能纳入'
      return row
    }
    if (rendered.truncated.has(scope.path)) {
      const included = rendered.truncated.get(scope.path)
      if (included === (read?.bytes ?? scope.bytes)) {
        row.status = 'loaded'
        row.included = included
        row.tokens = Math.ceil(included / 4)
        return row
      }
      if (included === 0 && (read?.bytes ?? scope.bytes) > 0) {
        row.status = 'omitted'
        row.reason = '渲染预算只够输出预算提示，本文件内容未能纳入'
        return row
      }
      row.status = 'truncated'
      row.included = included
      row.tokens = Math.ceil(included / 4)
      row.reason = `渲染预算只纳入前 ${included} B（原文 ${read?.bytes ?? scope.bytes} B）`
      return row
    }
    if (representedPaths.has(scope.path)) {
      row.status = 'loaded'
      row.included = read?.bytes ?? scope.bytes
      row.tokens = Math.ceil(row.included / 4)
      return row
    }
    row.status = 'omitted'
    row.reason = '渲染预算不足，未能纳入'
    return row
  })

  const renderedText = rendered.text
  const used = textBytes(renderedText)

  return {
    cwd: resolve(cwd),
    projectRoot,
    budget: {
      limit: maxBytes,
      used,
      remaining: Math.max(0, maxBytes - used),
      renderedTokens: Math.ceil(used / 4),
    },
    assumptions,
    rows,
    dynamic,
    scannedDirs,
    scannedAt: new Date().toISOString(),
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
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/** Public view of one file for the editor. */
export async function loadFile(fsService, filePath, { cwd, projectRoot, homes }) {
  if (!isAllowedPath(filePath, { cwd, projectRoot, homes })) {
    const error = new Error('路径不在允许编辑的指令文件范围内')
    error.status = 403
    error.code = 'path/forbidden'
    throw error
  }
  const probe = await statFile(fsService, filePath)
  if (!probe.exists) return { path: resolve(filePath), exists: false, content: '', version: null, bytes: 0 }
  if (probe.type !== 'file') {
    const error = new Error('目标不是普通文件')
    error.status = 400
    error.code = 'path/not-file'
    throw error
  }
  if (probe.bytes > SOURCE_CAP) {
    const error = new Error('文件超过 1 MiB，DSH 不会加载它；请先精简')
    error.status = 413
    error.code = 'content/too-large'
    throw error
  }
  const content = await fsService.readText(probe.target)
  return { path: resolve(filePath), exists: true, content, version: probe.version, bytes: textBytes(content) }
}
