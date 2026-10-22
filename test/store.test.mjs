import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildChain, discoverScopes, isAllowedPath, resolveHomes } from '../lib/scopes.js'
import { applyHunks, diffHunks } from '../lib/diff.js'

function fakeFs() {
  return {
    resolve: async path => path,
    stat: async (path) => {
      try {
        const info = await stat(path)
        return { type: info.isDirectory() ? 'directory' : 'file', size: info.size, version: String(info.mtimeMs) }
      } catch {
        return undefined
      }
    },
    readText: async path => readFile(path, 'utf8'),
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'agents-desk-'))
  const home = join(root, 'home')
  const cwd = join(root, 'project')
  await mkdir(join(cwd, '.git'), { recursive: true })
  await mkdir(join(cwd, 'sub'), { recursive: true })
  await mkdir(join(home, '.dsh'), { recursive: true })
  await mkdir(join(home, '.agents'), { recursive: true })
  await writeFile(join(home, '.dsh', 'AGENTS.md'), 'global rules\n')
  await writeFile(join(cwd, 'AGENTS.md'), 'project rules\n')
  await writeFile(join(cwd, 'CLAUDE.md'), 'project rules\n')
  await writeFile(join(cwd, 'sub', 'AGENTS.md'), 'sub rules\n')
  const homes = resolveHomes({ DSH_HOME: join(home, '.dsh'), DSH_AGENTS_HOME: join(home, '.agents') })
  return { root, home, cwd, homes }
}

test('resolveHomes honors env overrides', () => {
  const homes = resolveHomes({ DSH_HOME: '/tmp/x', DSH_AGENTS_HOME: '/tmp/y' })
  assert.equal(homes.dsh, '/tmp/x')
  assert.equal(homes.agents, '/tmp/y')
})

test('discovery order: globals, project chain, then nested subdirectory files', async () => {
  const { cwd, homes } = await fixture()
  const { projectRoot, scopes } = await discoverScopes(fakeFs(), { cwd, homes })
  assert.equal(projectRoot, cwd)
  assert.equal(scopes[0].kind, 'user-global')
  assert.equal(scopes[1].kind, 'agents-global')
  const project = scopes.filter(scope => scope.kind === 'project')
  assert.equal(project[0].name, 'AGENTS.md')
  assert.equal(project[0].exists, true)
  const nested = scopes.find(scope => scope.kind === 'subdir')
  assert.ok(nested)
  assert.match(nested.display, /sub\/AGENTS\.md$/)
})

test('chain dedupes identical content and charges the budget once', async () => {
  const { cwd, homes } = await fixture()
  const chain = await buildChain(fakeFs(), { cwd, homes })
  const loaded = chain.rows.filter(row => row.status === 'loaded')
  const duplicates = chain.rows.filter(row => row.status === 'duplicate')
  assert.equal(loaded.length, 2) // global + project AGENTS.md
  assert.equal(duplicates.length, 1) // CLAUDE.md with the same text
  assert.ok(chain.budget.used > Buffer.byteLength('global rules\n') + Buffer.byteLength('project rules\n'))
  assert.ok(chain.budget.used <= chain.budget.limit)
  assert.equal(chain.dynamic.length, 1)
})

test('write whitelist accepts instruction files only', async () => {
  const { cwd, homes } = await fixture()
  const projectRoot = cwd
  assert.equal(isAllowedPath(join(homes.dsh, 'AGENTS.md'), { cwd, projectRoot, homes }), true)
  assert.equal(isAllowedPath(join(cwd, 'AGENTS.md'), { cwd, projectRoot, homes }), true)
  assert.equal(isAllowedPath(join(cwd, 'sub', 'CLAUDE.md'), { cwd, projectRoot, homes }), true)
  assert.equal(isAllowedPath(join(cwd, 'notes.md'), { cwd, projectRoot, homes }), false)
  assert.equal(isAllowedPath('/etc/passwd', { cwd, projectRoot, homes }), false)
  assert.equal(isAllowedPath(join(cwd, '..', 'AGENTS.md'), { cwd, projectRoot, homes }), false)
})

test('deep workspace instructions remain editable independently of scan depth', async () => {
  const { cwd: projectRoot, homes } = await fixture()
  const cwd = join(projectRoot, 'packages', 'app', 'src', 'features', 'editor', 'components')
  await mkdir(cwd, { recursive: true })
  const path = join(cwd, 'AGENTS.md')
  await writeFile(path, 'editor rules\n')
  const { scopes } = await discoverScopes(fakeFs(), { cwd, homes })
  assert.ok(scopes.some(scope => scope.path === path))
  assert.equal(isAllowedPath(path, { cwd, projectRoot, homes }), true)
})

test('discovery includes instruction files in source lib directories', async () => {
  const { cwd, homes } = await fixture()
  await mkdir(join(cwd, 'lib'))
  const path = join(cwd, 'lib', 'AGENTS.md')
  await writeFile(path, 'library rules\n')
  const { scopes } = await discoverScopes(fakeFs(), { cwd, homes })
  assert.ok(scopes.some(scope => scope.path === path && scope.kind === 'subdir'))
})

test('diff hunks apply independently', () => {
  const oldText = 'a\nb\nc\n'
  const newText = 'a\nB\nc\nd\n'
  const hunks = diffHunks(oldText, newText)
  assert.ok(hunks.length >= 1)
  assert.equal(applyHunks(oldText, hunks, hunks.map(() => true)), newText)
  assert.equal(applyHunks(oldText, hunks, hunks.map(() => false)), oldText)
})

test('a small edit in a large file keeps a localized, applicable hunk', () => {
  const lines = Array.from({ length: 150_000 }, () => 'rule')
  const oldText = lines.join('\n')
  lines[75_000] = 'changed rule'
  const newText = lines.join('\n')
  const hunks = diffHunks(oldText, newText)
  assert.equal(hunks.length, 1)
  assert.ok(hunks[0].oldLines <= 7, 'unchanged lines must not become a whole-file replacement')
  assert.equal(applyHunks(oldText, hunks, [true]), newText)
  assert.equal(applyHunks(oldText, hunks, [false]), oldText)
})

test('large whole-file proposals can be accepted or rejected without argument overflow', () => {
  const oldText = 'a\n'.repeat(150_000)
  const newText = 'b\n'.repeat(150_000)
  const hunks = diffHunks(oldText, newText)
  assert.equal(applyHunks(oldText, hunks, [true]), newText)
  assert.equal(applyHunks(oldText, hunks, [false]), oldText)
})
