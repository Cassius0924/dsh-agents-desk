/**
 * Scope-aware rule drafting: repository facts for project files, existing
 * cross-project rules for global files, and one model call per proposal.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const FACT_CAP = 8000
const OUTPUT_TOKENS = 2000
const TIMEOUT_MS = 120_000

function generationError(status, code, message) {
  return Object.assign(new Error(message), { status, code })
}

function messageOf(error) {
  return String(error?.message ?? error)
}

async function readTextIfPresent(path, limit = 4000) {
  try {
    const info = await stat(path)
    if (!info.isFile() || info.size > 256 * 1024) return ''
    return (await readFile(path, 'utf8')).slice(0, limit)
  } catch {
    return ''
  }
}

async function existsFile(path) {
  try { return (await stat(path)).isFile() } catch { return false }
}

/** Collect only facts that exist on disk; nothing is inferred. */
export async function collectFacts(cwd) {
  const facts = []
  const pkgRaw = await readTextIfPresent(join(cwd, 'package.json'), 256 * 1024)
  if (pkgRaw !== '') {
    try {
      const pkg = JSON.parse(pkgRaw)
      facts.push(`package.json: name=${pkg.name ?? '(none)'}`)
      const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? Object.entries(pkg.scripts) : []
      for (const [name, command] of scripts.slice(0, 20)) facts.push(`script ${name}: ${String(command)}`)
      if (pkg.packageManager) facts.push(`packageManager: ${pkg.packageManager}`)
      if (pkg.engines) facts.push(`engines: ${JSON.stringify(pkg.engines)}`)
      const deps = Object.keys(pkg.dependencies ?? {}).slice(0, 30)
      if (deps.length > 0) facts.push(`dependencies: ${deps.join(', ')}`)
    } catch { facts.push('package.json: (unparsable)') }
  }
  for (const lock of ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb']) {
    if (await existsFile(join(cwd, lock))) facts.push(`lockfile: ${lock}`)
  }
  const goMod = await readTextIfPresent(join(cwd, 'go.mod'), 2000)
  if (goMod !== '') {
    const module = goMod.match(/^module\s+(.+)$/m)?.[1]
    const version = goMod.match(/^go\s+(.+)$/m)?.[1]
    facts.push(`go.mod: module=${module ?? '(none)'} go=${version ?? '(none)'}`)
  }
  const makefile = await readTextIfPresent(join(cwd, 'Makefile'), 4000)
  if (makefile !== '') {
    const targets = [...makefile.matchAll(/^([A-Za-z0-9_.-]+):(?!=)/gm)].map(m => m[1]).slice(0, 20)
    if (targets.length > 0) facts.push(`Makefile targets: ${targets.join(', ')}`)
  }
  for (const file of ['pyproject.toml', 'Cargo.toml', 'requirements.txt', 'Dockerfile', 'docker-compose.yml']) {
    if (await existsFile(join(cwd, file))) facts.push(`present: ${file}`)
  }
  const readme = await readTextIfPresent(join(cwd, 'README.md'), 1500)
  if (readme !== '') {
    const heading = readme.split('\n').find(line => line.trim().startsWith('#'))?.trim()
    if (heading) facts.push(`README heading: ${heading}`)
  }
  try {
    const dirs = (await readdir(cwd, { withFileTypes: true }))
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map(entry => entry.name).slice(0, 25)
    if (dirs.length > 0) facts.push(`top-level dirs: ${dirs.join(', ')}`)
  } catch { /* unreadable cwd falls through to whatever was collected */ }
  let text = facts.join('\n')
  if (text.length > FACT_CAP) text = text.slice(0, FACT_CAP)
  return { facts, text }
}

const SYSTEM_PROMPT = [
  'You write AGENTS.md files for coding agents.',
  'Use only the facts provided. Never invent commands, files, frameworks, or conventions.',
  'If a section has no supporting fact, omit that section.',
  'Output Markdown only, no code fence around the whole document.',
  'Keep it under 120 lines. Prefer exact commands over prose.',
].join(' ')

const GLOBAL_SYSTEM_PROMPT = [
  'You write global AGENTS.md instructions for coding agents that apply across projects.',
  'Preserve the meaning, language, and scope of existing user rules while improving their organization and clarity.',
  'Do not invent user preferences, project details, repository commands, frameworks, paths, or environment facts.',
  'Do not turn global instructions into rules for a particular project.',
  'When no existing rules are supplied, output only a short template with TODO placeholders for the user to fill in.',
  'Output Markdown only, no code fence around the whole document. Keep it under 120 lines.',
].join(' ')

function buildPrompt({ scope, facts, existing, globalRules }) {
  if (scope !== 'project') {
    return [
      `Target scope: ${scope}. This global AGENTS.md applies across projects.`,
      existing.trim() === ''
        ? 'No global rules have been supplied. Write an unfilled global template with TODO placeholders; do not choose preferences for the user.'
        : `Existing global AGENTS.md:\n${existing}`,
      'Draft only this global file. Repository facts are intentionally not provided.',
    ].join('\n\n')
  }
  return [
    'Facts detected in this repository:',
    facts,
    '',
    existing.trim() === '' ? 'No project AGENTS.md exists yet. Write one.' : `Existing project AGENTS.md:\n${existing}`,
    '',
    globalRules.trim() === '' ? '' : `User-global AGENTS.md (do not repeat its rules):\n${globalRules}`,
    '',
    'Write the project-level AGENTS.md.',
  ].join('\n')
}

function stripFence(text) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?\s*```$/)
  return (fenced ? fenced[1] : trimmed).trim()
}

async function collectText(stream, signal) {
  let text = ''
  let failure = ''
  for await (const chunk of stream) {
    signal.throwIfAborted()
    if (chunk.type === 'text-delta') text += chunk.text
    else if (chunk.type === 'finish' && chunk.reason?.kind === 'error') {
      failure = chunk.reason.failure?.message ?? 'model error'
    }
  }
  if (failure !== '') throw new Error(failure)
  return text
}

/** Read the default selection, tolerating a host that has no usable one. */
function selectionOf(selector) {
  if (selector === undefined || selector === null || typeof selector.currentSelection !== 'function') return undefined
  try {
    const selection = selector.currentSelection()
    const provider = selection?.provider
    const model = selection?.model
    if (typeof provider !== 'string' || provider === '' || typeof model !== 'string' || model === '') return undefined
    return typeof selection.reasoningEffort === 'string' && selection.reasoningEffort !== ''
      ? { provider, model, reasoningEffort: selection.reasoningEffort }
      : { provider, model }
  } catch {
    return undefined
  }
}

/** One generation pass. Returns the draft, the facts it was built from, and the model used. */
export async function generateDraft({ llm, selector, cwd, scope = 'project', existing, globalRules, signal }) {
  if (llm === undefined || llm === null || typeof llm.stream !== 'function') {
    throw generationError(503, 'llm/unavailable', '宿主未提供 llm 服务')
  }
  const selection = selectionOf(selector)
  if (selection === undefined) {
    throw generationError(503, 'llm/no-selection', '宿主未配置默认 provider / model，无法生成草稿')
  }
  const { facts, text } = scope === 'project' ? await collectFacts(cwd) : { facts: [], text: '' }
  if (scope === 'project' && facts.length === 0) {
    throw generationError(400, 'llm/failed', '没有采集到任何仓库事实（目录为空或不可读）')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const streamSignal = signal === undefined ? controller.signal : AbortSignal.any([controller.signal, signal])
  try {
    const stream = llm.stream({
      provider: selection.provider,
      model: selection.model,
      messages: [{ role: 'user', content: [{ type: 'text', text: buildPrompt({ scope, facts: text, existing, globalRules }) }] }],
      system: scope === 'project' ? SYSTEM_PROMPT : GLOBAL_SYSTEM_PROMPT,
      maxTokens: OUTPUT_TOKENS,
      ...selection.reasoningEffort === undefined ? {} : { reasoningEffort: selection.reasoningEffort },
      signal: streamSignal,
    })
    const raw = await collectText(stream, streamSignal)
    const draft = stripFence(raw)
    if (draft === '') throw generationError(502, 'llm/failed', '模型返回了空内容')
    return { draft, facts, model: selection }
  } catch (error) {
    if (typeof error?.code === 'string' && error.code.includes('/')) throw error
    throw generationError(502, 'llm/failed', `模型调用失败：${messageOf(error)}`)
  } finally {
    clearTimeout(timer)
  }
}
