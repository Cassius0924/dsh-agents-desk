/**
 * Project-rule draft generation: deterministic repo facts in, one model call
 * out. The model never gets to invent commands — every command in the prompt
 * comes from a file we actually read.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const FACT_CAP = 8000
const OUTPUT_TOKENS = 2000
const TIMEOUT_MS = 120_000

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
  const pkgRaw = await readTextIfPresent(join(cwd, 'package.json'))
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

function buildPrompt({ facts, existing, globalRules }) {
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
  if (failure !== '') throw new Error(`模型调用失败：${failure}`)
  return text
}

/** One generation pass. Returns the draft plus the facts it was built from. */
export async function generateDraft({ llm, selection, cwd, existing, globalRules }) {
  const { facts, text } = await collectFacts(cwd)
  if (facts.length === 0) throw new Error('没有采集到任何仓库事实（目录为空或不可读）')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const stream = llm.stream({
      provider: selection.provider,
      model: selection.model,
      messages: [{ role: 'user', content: [{ type: 'text', text: buildPrompt({ facts: text, existing, globalRules }) }] }],
      system: SYSTEM_PROMPT,
      maxTokens: OUTPUT_TOKENS,
      reasoningEffort: 'off',
      signal: controller.signal,
    })
    const raw = await collectText(stream, controller.signal)
    const draft = stripFence(raw)
    if (draft === '') throw new Error('模型返回了空内容')
    return { draft, facts }
  } finally {
    clearTimeout(timer)
  }
}
