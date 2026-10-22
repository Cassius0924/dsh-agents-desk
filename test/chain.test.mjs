import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { buildChain, discoverScopes, findProjectRoot, resolveHomes, SOURCE_CAP } from '../lib/scopes.js'

const INTRO = 'The following workspace instructions may be relevant to your work. '
  + 'Use them as guidance when applicable. More specific instructions take precedence over broader ones. '
  + 'They do not override system, developer, or direct user instructions.'

function fakeFs({ failRead = [] } = {}) {
  const calls = { listDir: 0, stat: 0, readText: 0 }
  const targetPath = target => (typeof target === 'string' ? target : target.targetKey)
  return {
    calls,
    resolve: async path => ({ targetKey: path, displayPath: path }),
    stat: async (target) => {
      calls.stat += 1
      try {
        const info = await stat(targetPath(target))
        return {
          type: info.isDirectory() ? 'directory' : 'file',
          size: info.size,
          version: String(info.mtimeMs),
        }
      } catch {
        return undefined
      }
    },
    readText: async (target) => {
      calls.readText += 1
      const path = targetPath(target)
      if (failRead.includes(basename(path))) throw new Error('read failed')
      return readFile(path, 'utf8')
    },
    listDir: async (target) => {
      calls.listDir += 1
      const dir = targetPath(target)
      const dirents = await readdir(dir, { withFileTypes: true })
      const entries = []
      for (const dirent of dirents) {
        const path = join(dir, dirent.name)
        if (dirent.isDirectory()) {
          entries.push({ name: dirent.name, type: 'directory', target: { targetKey: path, displayPath: path } })
        } else if (dirent.isFile()) {
          const info = await stat(path)
          entries.push({
            name: dirent.name,
            type: 'file',
            target: { targetKey: path, displayPath: path },
            size: info.size,
            version: String(info.mtimeMs),
          })
        }
      }
      return entries
    },
  }
}

async function fixture(files = {}) {
  const root = await mkdtemp(join(tmpdir(), 'agents-desk-chain-'))
  const home = join(root, 'home')
  const cwd = join(root, 'project')
  await mkdir(join(cwd, '.git'), { recursive: true })
  await mkdir(join(home, '.dsh'), { recursive: true })
  await mkdir(join(home, '.agents'), { recursive: true })
  for (const [path, content] of Object.entries(files)) {
    const full = join(cwd, path)
    await mkdir(join(full, '..'), { recursive: true })
    await writeFile(full, content)
  }
  await writeFile(join(home, '.dsh', 'AGENTS.md'), 'global rules\n')
  const homes = resolveHomes({ DSH_HOME: join(home, '.dsh'), DSH_AGENTS_HOME: join(home, '.agents') })
  return { root, home, cwd, homes }
}

const GROUPS = chain => ({
  loaded: chain.rows.filter(row => row.status === 'loaded').map(row => row.display),
  duplicate: chain.rows.filter(row => row.status === 'duplicate').map(row => row.display),
  omitted: chain.rows.filter(row => row.status === 'omitted').map(row => row.display),
  truncated: chain.rows.filter(row => row.status === 'truncated').map(row => row.display),
  ignored: chain.rows.filter(row => row.status === 'ignored').map(row => row.display),
  unreadable: chain.rows.filter(row => row.status === 'unreadable').map(row => row.display),
})

test('rendered budget matches the host frame, headers and intro', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': 'project rules\n' })
  const chain = await buildChain(fakeFs(), { cwd, homes })
  const body = [
    INTRO,
    'Instructions from: $DSH_HOME/AGENTS.md\n\nglobal rules\n',
    'Instructions from: AGENTS.md\n\nproject rules\n',
  ].join('\n\n')
  const expected = `<system-reminder>\n${body}\n</system-reminder>`
  assert.equal(chain.budget.used, Buffer.byteLength(expected))
  assert.equal(chain.rows.find(row => row.display === 'AGENTS.md').included, Buffer.byteLength('project rules\n'))
  assert.equal(chain.rows.find(row => row.display === '$DSH_HOME/AGENTS.md').included, Buffer.byteLength('global rules\n'))
})

test('budget drops broad files before specific ones', async () => {
  const global = `${'g'.repeat(400)}\n`
  const project = `${'p'.repeat(400)}\n`
  const { cwd, homes } = await fixture({ 'AGENTS.md': project })
  await writeFile(join(homes.dsh, 'AGENTS.md'), global)
  const chain = await buildChain(fakeFs(), { cwd, homes, maxBytes: 800 })
  const status = GROUPS(chain)
  assert.deepEqual(status.omitted, ['$DSH_HOME/AGENTS.md'])
  assert.deepEqual(status.loaded, ['AGENTS.md'])
  assert.ok(chain.budget.used <= 800)
  assert.match(chain.rows.find(row => row.status === 'omitted').reason, /预算/)
})

test('only the most specific file is truncated', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': `${'p'.repeat(400)}\n` })
  const chain = await buildChain(fakeFs(), { cwd, homes, maxBytes: 500 })
  const status = GROUPS(chain)
  assert.deepEqual(status.truncated, ['AGENTS.md'])
  const row = chain.rows.find(entry => entry.status === 'truncated')
  assert.ok(row.included > 0 && row.included < 401)
  assert.ok(chain.budget.used <= 500)
})

test('duplicate suppression is trimmed-content based and includes empty files', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': '  same rules  \n', 'CLAUDE.md': 'same rules\n', 'AGENTS.local.md': '' , 'CLAUDE.local.md': '' })
  const chain = await buildChain(fakeFs(), { cwd, homes })
  const status = GROUPS(chain)
  assert.deepEqual(status.duplicate, ['CLAUDE.md', 'CLAUDE.local.md'])
})

test('source cap skips a file entirely and read failures are reported', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': 'project rules\n', 'CLAUDE.md': 'claude rules\n' })
  await writeFile(join(cwd, 'AGENTS.local.md'), 'x'.repeat(SOURCE_CAP + 1))
  const chain = await buildChain(fakeFs({ failRead: ['CLAUDE.md'] }), { cwd, homes })
  const status = GROUPS(chain)
  assert.deepEqual(status.ignored, ['AGENTS.local.md'])
  assert.deepEqual(status.unreadable, ['CLAUDE.md'])
  assert.ok(chain.budget.used <= chain.budget.limit)
})

test('discovery lists each directory once and finds nested candidates', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': 'project\n', 'sub/AGENTS.md': 'sub\n' })
  const fs = fakeFs()
  const { scopes } = await discoverScopes(fs, { cwd, homes })
  assert.ok(scopes.some(scope => scope.kind === 'subdir' && scope.display === 'sub/AGENTS.md'))
  // one listing for the project root, one for sub/; candidate count never drives listings
  assert.ok(fs.calls.listDir <= 4, `expected one listing per directory, got ${fs.calls.listDir}`)
})

test('global display paths follow the host default/override labels', async () => {
  const { cwd, homes } = await fixture({})
  const defaultHomes = resolveHomes({}, homes.home)
  assert.equal(defaultHomes.dsh, join(homes.home, '.dsh'))
  const chain = await buildChain(fakeFs(), { cwd, homes: defaultHomes })
  assert.equal(chain.rows[0].display, '~/.dsh/AGENTS.md')
  assert.equal(chain.rows[1].display, '~/.agents/AGENTS.md')
})

test('findProjectRoot honors markers and falls back to cwd', async () => {
  const { cwd } = await fixture({})
  const nested = join(cwd, 'deep', 'dir')
  await mkdir(nested, { recursive: true })
  assert.equal(await findProjectRoot(fakeFs(), nested), cwd)
  assert.equal(await findProjectRoot(fakeFs(), nested, ['.hg']), nested)
})

test('identical content in different dedupe groups both load', async () => {
  const shared = 'shared rules\n'
  const { cwd, homes } = await fixture({ 'AGENTS.md': shared })
  await writeFile(join(homes.dsh, 'AGENTS.md'), shared)
  const chain = await buildChain(fakeFs(), { cwd, homes })
  assert.deepEqual(GROUPS(chain).loaded, ['$DSH_HOME/AGENTS.md', 'AGENTS.md'])
  assert.deepEqual(GROUPS(chain).duplicate, [])
})

test('truncation keeps UTF-8 content valid', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': `${'你好世界🙂'.repeat(80)}\n` })
  const chain = await buildChain(fakeFs(), { cwd, homes, maxBytes: 500 })
  const row = chain.rows.find(entry => entry.status === 'truncated')
  assert.ok(row)
  assert.ok(row.included > 0)
  assert.ok(chain.budget.used <= 500)
})

test('a budget that only fits the notice reports the file as omitted', async () => {
  const { cwd, homes } = await fixture({ 'AGENTS.md': `${'p'.repeat(400)}\n` })
  const chain = await buildChain(fakeFs(), { cwd, homes, maxBytes: 200 })
  const row = chain.rows.find(entry => entry.display === 'AGENTS.md')
  assert.equal(row.status, 'omitted')
  assert.match(row.reason, /预算/)
  assert.ok(chain.budget.used <= 200)
})
