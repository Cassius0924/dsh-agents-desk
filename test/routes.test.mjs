import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lstat as lstatNode, mkdir, mkdtemp, readFile, realpath, stat as statNode, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { registerRoutes } from '../lib/index.js'

const BASE = '/api/agents-desk'

function versionOf(info) {
  return `${info.mtimeMs}-${info.size}`
}

/** fs service double backed by the real temporary filesystem. */
function fakeFs(overrides = {}) {
  const fs = {
    async resolve(path) {
      const absolute = resolve(path)
      try {
        return { targetKey: await realpath(absolute), displayPath: absolute }
      } catch {
        return { targetKey: absolute, displayPath: absolute }
      }
    },
    processPath(target) {
      return target.targetKey
    },
    async stat(target) {
      try {
        const info = await statNode(target.targetKey)
        return {
          type: info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'other',
          size: info.size,
          version: versionOf(info),
        }
      } catch {
        return undefined
      }
    },
    async lstat(path) {
      try {
        const info = await lstatNode(resolve(path))
        return {
          type: info.isSymbolicLink() ? 'symlink' : info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'other',
          size: info.size,
          version: versionOf(info),
        }
      } catch {
        return undefined
      }
    },
    async readText(target) {
      return readFile(target.targetKey, 'utf8')
    },
    async writeText(target, content, expected) {
      let info
      try {
        info = await statNode(target.targetKey)
      } catch {
        info = undefined
      }
      if (expected?.kind === 'createIfAbsent' && info !== undefined) {
        throw Object.assign(new Error('target already exists'), { code: 'FS_NOT_OBSERVED' })
      }
      if (expected?.kind === 'replaceIfVersion') {
        if (info === undefined) throw Object.assign(new Error('target absent'), { code: 'FS_NOT_OBSERVED' })
        if (expected.version !== versionOf(info)) throw Object.assign(new Error('stale target'), { code: 'FS_STALE_VERSION' })
      }
      const before = info === undefined ? null : await readFile(target.targetKey, 'utf8')
      await writeFile(target.targetKey, content, 'utf8')
      return {
        operation: info === undefined ? 'create' : 'update',
        version: versionOf(await statNode(target.targetKey)),
        before,
        after: content,
      }
    },
  }
  return { ...fs, ...overrides }
}

function registry(paths) {
  return { list: () => paths.map((path, index) => ({ id: `w${index}`, title: `w${index}`, path })) }
}

function selector(selection) {
  return { currentSelection: () => selection }
}

function fakeLlm(chunks) {
  const calls = []
  return {
    calls,
    stream(options) {
      calls.push(options)
      return (async function* () {
        for (const chunk of chunks) yield chunk
      })()
    },
  }
}

function createHost({ services = {}, homes } = {}) {
  const routes = new Map()
  const disposers = []
  const connection = {
    fetch: {
      register(route) {
        routes.set(route.path, route)
        return async () => { routes.delete(route.path) }
      },
    },
  }
  const available = { connection, ...services }
  const host = {
    connection,
    effect(callback) {
      const dispose = callback()
      disposers.push(dispose)
      return dispose
    },
  }
  const ctx = {
    get(serviceName) { return available[serviceName] },
    inject(names, callback) {
      if (names.every(name => available[name] !== undefined)) callback(host)
    },
    effect(callback) {
      const dispose = callback()
      disposers.push(dispose)
      return dispose
    },
  }
  registerRoutes(ctx, { homes })
  return {
    routes,
    disposers,
    async call(method, routePath, { query = {}, body, rawBody } = {}) {
      const registered = routes.get(routePath)
      assert.ok(registered, `route ${routePath} is not registered`)
      assert.ok(registered.methods.includes(method), `${routePath} does not accept ${method}`)
      const url = new URL(`http://127.0.0.1${routePath}`)
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
      const init = { method }
      if (body !== undefined) {
        init.body = JSON.stringify(body)
        init.headers = { 'content-type': 'application/json' }
      } else if (rawBody !== undefined) {
        init.body = rawBody
        init.headers = { 'content-type': 'application/json' }
      }
      const response = await registered.fetch(new Request(url, init))
      return { status: response.status, json: await response.json() }
    },
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'agents-desk-routes-'))
  const home = join(root, 'home')
  const cwd = join(root, 'project')
  await mkdir(join(cwd, '.git'), { recursive: true })
  await mkdir(join(home, '.dsh'), { recursive: true })
  await mkdir(join(home, '.agents'), { recursive: true })
  await writeFile(join(cwd, 'AGENTS.md'), 'project rules\n')
  await writeFile(join(home, '.dsh', 'AGENTS.md'), 'global rules\n')
  return { root, home, cwd, homes: { dsh: join(home, '.dsh'), agents: join(home, '.agents'), home } }
}

test('routes register through host effects and dispose cleanly', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  assert.equal(host.routes.size, 9)
  const workspaces = await host.call('GET', `${BASE}/workspaces`)
  assert.equal(workspaces.status, 200)
  assert.equal(workspaces.json.defaultCwd, cwd)
  await Promise.all(host.disposers.map(dispose => dispose?.()))
  assert.equal(host.routes.size, 0)
})

test('GET /health reports capabilities and stays 200 without optional services', async () => {
  const { homes } = await fixture()
  const bare = createHost({ homes })
  const bareResponse = await bare.call('GET', `${BASE}/health`)
  assert.equal(bareResponse.status, 200)
  assert.equal(bareResponse.json.ok, true)
  assert.equal(bareResponse.json.name, 'agents-desk')
  assert.match(bareResponse.json.version, /^\d+\.\d+\.\d+/)
  assert.deepEqual(bareResponse.json.capabilities, {
    fs: false, workspaceRegistry: false, llm: false, agentDefaultModel: false,
  })

  const services = {
    fs: fakeFs(),
    workspaceRegistry: registry([]),
    llm: fakeLlm([]),
    agentDefaultModel: selector({ provider: 'p', model: 'm' }),
  }
  const full = createHost({ services, homes })
  const fullResponse = await full.call('GET', `${BASE}/health`)
  assert.equal(fullResponse.status, 200)
  assert.deepEqual(fullResponse.json.capabilities, {
    fs: true, workspaceRegistry: true, llm: true, agentDefaultModel: true,
  })
})

test('cwd validation rejects missing, relative, non-directory, and unregistered paths', async () => {
  const { root, home, cwd, homes } = await fixture()
  await mkdir(join(root, 'elsewhere'), { recursive: true })
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })

  const missing = await host.call('GET', `${BASE}/scopes`)
  assert.equal(missing.status, 400)
  assert.equal(missing.json.code, 'request/missing-field')

  for (const candidate of ['relative/dir', join(cwd, 'AGENTS.md'), join(root, 'nope'), join(root, 'elsewhere')]) {
    const response = await host.call('GET', `${BASE}/scopes`, { query: { cwd: candidate } })
    assert.equal(response.status, 400, candidate)
    assert.equal(response.json.code, 'request/invalid-cwd', candidate)
    assert.equal(response.json.status, 400)
  }

  const homeResponse = await host.call('GET', `${BASE}/scopes`, { query: { cwd: home } })
  assert.equal(homeResponse.status, 200)
  assert.equal(homeResponse.json.cwd, home)
})

test('writes reject symlinked instruction paths', async () => {
  const { root, cwd, homes } = await fixture()
  await writeFile(join(root, 'secret.txt'), 'outside content\n')
  await symlink(join(root, 'secret.txt'), join(cwd, 'CLAUDE.md'))
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const response = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: join(cwd, 'CLAUDE.md'), content: 'x\n', create: true },
  })
  assert.equal(response.status, 403)
  assert.equal(response.json.code, 'path/symlink')
  assert.equal(await readFile(join(root, 'secret.txt'), 'utf8'), 'outside content\n')
})

test('writes reject targets whose real host path escapes the whitelist', async () => {
  const { root, cwd, homes } = await fixture()
  await writeFile(join(root, 'secret.txt'), 'outside content\n')
  await symlink(join(root, 'secret.txt'), join(cwd, 'CLAUDE.md'))
  const fs = fakeFs({ async lstat() { return undefined } })
  const host = createHost({ services: { fs, workspaceRegistry: registry([cwd]) }, homes })
  const response = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: join(cwd, 'CLAUDE.md'), content: 'x\n', create: true },
  })
  assert.equal(response.status, 403)
  assert.equal(response.json.code, 'path/symlink')
})

test('history endpoints require cwd and stay inside the instruction whitelist', async () => {
  const { root, cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const target = join(cwd, 'AGENTS.md')

  const noCwd = await host.call('GET', `${BASE}/history`, { query: { path: target } })
  assert.equal(noCwd.status, 400)
  assert.equal(noCwd.json.code, 'request/missing-field')

  const outside = await host.call('GET', `${BASE}/history`, { query: { cwd, path: join(root, 'AGENTS.md') } })
  assert.equal(outside.status, 403)
  assert.equal(outside.json.code, 'path/forbidden')

  const crossDir = await host.call('GET', `${BASE}/history/diff`, {
    query: { cwd, path: target, backup: join(root, 'AGENTS.md.bak-20260101-000000') },
  })
  assert.equal(crossDir.status, 403)
  assert.equal(crossDir.json.code, 'backup/invalid')

  const wrongName = await host.call('GET', `${BASE}/history/diff`, {
    query: { cwd, path: target, backup: join(cwd, 'CLAUDE.md.bak-20260101-000000') },
  })
  assert.equal(wrongName.status, 403)
  assert.equal(wrongName.json.code, 'backup/invalid')

  const missingBackup = await host.call('GET', `${BASE}/history/diff`, {
    query: { cwd, path: target, backup: join(cwd, 'AGENTS.md.bak-20260101-000000') },
  })
  assert.equal(missingBackup.status, 404)
  assert.equal(missingBackup.json.code, 'backup/not-found')

  const empty = await host.call('GET', `${BASE}/history`, { query: { cwd, path: target } })
  assert.equal(empty.status, 200)
  assert.deepEqual(empty.json, { path: target, backups: [] })
})

test('save writes a timestamped backup and history exposes its source', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const target = join(cwd, 'AGENTS.md')

  const loaded = await host.call('GET', `${BASE}/file`, { query: { cwd, path: target } })
  assert.equal(loaded.status, 200)
  const saved = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: target, content: 'saved by test\n', version: loaded.json.version },
  })
  assert.equal(saved.status, 200)
  assert.equal(saved.json.ok, true)
  assert.match(basename(saved.json.backup), /^AGENTS\.md\.bak-\d{8}-\d{6}$/)
  assert.equal(await readFile(saved.json.backup, 'utf8'), 'project rules\n')

  const preview = await host.call('GET', `${BASE}/history/diff`, {
    query: { cwd, path: target, backup: saved.json.backup },
  })
  assert.equal(preview.status, 200)
  assert.ok(preview.json.hunks.length >= 1)

  let history = await host.call('GET', `${BASE}/history`, { query: { cwd, path: target } })
  assert.equal(history.status, 200)
  assert.equal(history.json.backups.length, 1)
  assert.equal(history.json.backups[0].source, 'save')
  assert.equal(history.json.backups[0].bytes, Buffer.byteLength('project rules\n'))

  const rolled = await host.call('POST', `${BASE}/rollback`, {
    body: { cwd, path: target, backup: saved.json.backup, version: saved.json.version },
  })
  assert.equal(rolled.status, 200)
  assert.equal(rolled.json.source, 'rollback')
  assert.equal(await readFile(target, 'utf8'), 'project rules\n')
  assert.equal(await readFile(rolled.json.backup, 'utf8'), 'saved by test\n')

  history = await host.call('GET', `${BASE}/history`, { query: { cwd, path: target } })
  assert.equal(history.json.backups.length, 2)
  assert.deepEqual(history.json.backups.map(row => row.source).sort(), ['rollback', 'save'])
})

test('rollback requires the editor version and preserves external changes', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const path = join(cwd, 'AGENTS.md')
  const backup = `${path}.bak-20260101-000000`
  await writeFile(backup, 'old rules\n')
  const loaded = await host.call('GET', `${BASE}/file`, { query: { cwd, path } })
  const missing = await host.call('POST', `${BASE}/rollback`, { body: { cwd, path, backup } })
  assert.equal(missing.status, 400)
  assert.equal(missing.json.code, 'version/missing')
  await writeFile(path, 'externally edited rules\n')
  const stale = await host.call('POST', `${BASE}/rollback`, {
    body: { cwd, path, backup, version: loaded.json.version },
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.json.code, 'version/stale')
  assert.equal(await readFile(path, 'utf8'), 'externally edited rules\n')
  const history = await host.call('GET', `${BASE}/history`, { query: { cwd, path } })
  assert.equal(history.json.backups.length, 1)
})

test('history sources are isolated by full backup path across directories', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const paths = [join(cwd, 'AGENTS.md'), join(cwd, 'sub', 'AGENTS.md')]
  await mkdir(join(cwd, 'sub'))
  await mkdir(join(homes.dsh, 'agents-desk'))
  const entries = paths.map((path, index) => ({
    path, backup: `${path}.bak-20260101-000000`, source: index === 0 ? 'save' : 'rollback',
  }))
  for (const entry of entries) await writeFile(entry.backup, 'old rules\n')
  await writeFile(join(homes.dsh, 'agents-desk', 'history.jsonl'), entries.map(entry => JSON.stringify(entry)).join('\n'))
  for (const entry of entries) {
    const history = await host.call('GET', `${BASE}/history`, { query: { cwd, path: entry.path } })
    assert.equal(history.json.backups[0].source, entry.source)
  }
})

test('a failed backup keeps the save and reports backupError', async () => {
  const { cwd, homes } = await fixture()
  const base = fakeFs()
  let denyRead = false
  const fs = {
    ...base,
    async readText(target) {
      if (denyRead) throw new Error('read denied')
      return base.readText(target)
    },
  }
  const host = createHost({ services: { fs, workspaceRegistry: registry([cwd]) }, homes })
  const target = join(cwd, 'AGENTS.md')
  const loaded = await host.call('GET', `${BASE}/file`, { query: { cwd, path: target } })
  denyRead = true
  const saved = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: target, content: 'written anyway\n', version: loaded.json.version },
  })
  assert.equal(saved.status, 200)
  assert.equal(saved.json.ok, true)
  assert.equal(saved.json.backup, null)
  assert.match(saved.json.backupError, /备份/)
  assert.equal(await readFile(target, 'utf8'), 'written anyway\n')
})

test('request failures carry stable codes and statuses', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const target = join(cwd, 'AGENTS.md')
  const loaded = await host.call('GET', `${BASE}/file`, { query: { cwd, path: target } })

  const invalidJson = await host.call('POST', `${BASE}/file`, { rawBody: '{oops' })
  assert.equal(invalidJson.status, 400)
  assert.equal(invalidJson.json.code, 'body/invalid-json')

  const tooLarge = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: target, content: 'x'.repeat(1_048_577), version: loaded.json.version },
  })
  assert.equal(tooLarge.status, 413)
  assert.equal(tooLarge.json.code, 'content/too-large')

  const exists = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: target, content: 'x', create: true },
  })
  assert.equal(exists.status, 409)
  assert.equal(exists.json.code, 'path/exists')

  const noVersion = await host.call('POST', `${BASE}/file`, { body: { cwd, path: target, content: 'x' } })
  assert.equal(noVersion.status, 400)
  assert.equal(noVersion.json.code, 'version/missing')

  const stale = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: target, content: 'x', version: 'stale' },
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.json.code, 'version/stale')

  const absent = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: join(cwd, 'CLAUDE.md'), content: 'x', version: 'any' },
  })
  assert.equal(absent.status, 404)
  assert.equal(absent.json.code, 'path/absent')

  const noFs = createHost({ services: { workspaceRegistry: registry([cwd]) }, homes })
  const unavailable = await noFs.call('GET', `${BASE}/scopes`, { query: { cwd } })
  assert.equal(unavailable.status, 503)
  assert.equal(unavailable.json.code, 'fs/unavailable')

  for (const response of [invalidJson, tooLarge, exists, noVersion, stale, absent, unavailable]) {
    assert.equal(typeof response.json.error, 'string')
    assert.equal(typeof response.json.code, 'string')
    assert.equal(typeof response.json.status, 'number')
    assert.equal(response.json.status, response.status)
  }
})

test('POST /generate validates selection, streams with the request signal, and maps model failures', async () => {
  const { cwd, homes } = await fixture()
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } }))
  const target = join(cwd, 'AGENTS.md')
  const baseServices = { fs: fakeFs(), workspaceRegistry: registry([cwd]) }

  const withoutLlm = createHost({
    services: { ...baseServices, agentDefaultModel: selector({ provider: 'p', model: 'm' }) }, homes,
  })
  const noLlm = await withoutLlm.call('POST', `${BASE}/generate`, { body: { cwd, path: target } })
  assert.equal(noLlm.status, 503)
  assert.equal(noLlm.json.code, 'llm/unavailable')

  const withoutSelection = createHost({
    services: { ...baseServices, llm: fakeLlm([]), agentDefaultModel: selector(null) }, homes,
  })
  const noSelection = await withoutSelection.call('POST', `${BASE}/generate`, { body: { cwd, path: target } })
  assert.equal(noSelection.status, 503)
  assert.equal(noSelection.json.code, 'llm/no-selection')

  const llm = fakeLlm([
    { type: 'text-delta', text: '# Draft rules\nRun tests.\n' },
    { type: 'finish', reason: { kind: 'stop' } },
  ])
  const host = createHost({
    services: {
      ...baseServices, llm,
      agentDefaultModel: selector({ provider: 'demo', model: 'demo-chat', reasoningEffort: 'high' }),
    },
    homes,
  })
  const generated = await host.call('POST', `${BASE}/generate`, { body: { cwd, path: target } })
  assert.equal(generated.status, 200)
  assert.equal(generated.json.draft, '# Draft rules\nRun tests.')
  assert.deepEqual(generated.json.model, { provider: 'demo', model: 'demo-chat', reasoningEffort: 'high' })
  assert.ok(generated.json.facts.length >= 1)
  assert.equal(llm.calls.length, 1)
  assert.equal(llm.calls[0].provider, 'demo')
  assert.equal(llm.calls[0].model, 'demo-chat')
  assert.equal(llm.calls[0].reasoningEffort, 'high')
  assert.ok(llm.calls[0].signal instanceof AbortSignal)

  const failing = createHost({
    services: {
      ...baseServices,
      llm: { stream() { throw new Error('provider down') } },
      agentDefaultModel: selector({ provider: 'demo', model: 'demo-chat' }),
    },
    homes,
  })
  const failed = await failing.call('POST', `${BASE}/generate`, { body: { cwd, path: target } })
  assert.equal(failed.status, 502)
  assert.equal(failed.json.code, 'llm/failed')
})

test('POST /generate omits reasoningEffort when the default selection has none', async () => {
  const { cwd, homes } = await fixture()
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } }))
  const llm = fakeLlm([
    { type: 'text-delta', text: '# Rules\n' },
    { type: 'finish', reason: { kind: 'stop' } },
  ])
  const host = createHost({
    services: {
      fs: fakeFs(),
      workspaceRegistry: registry([cwd]),
      llm,
      agentDefaultModel: selector({ provider: 'p', model: 'm' }),
    },
    homes,
  })
  const generated = await host.call('POST', `${BASE}/generate`, { body: { cwd, path: join(cwd, 'AGENTS.md') } })
  assert.equal(generated.status, 200)
  assert.equal('reasoningEffort' in llm.calls[0], false)
})

test('global drafts use only the target global rules, never workspace facts', async () => {
  const { cwd, homes } = await fixture()
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'project-only-secret', scripts: { test: 'project-only-command' } }))
  for (const [root, scope] of [[homes.dsh, 'user-global'], [homes.agents, 'agents-global']]) {
    const path = join(root, 'AGENTS.md')
    const rules = `# My global rules\nPreserve this preference for ${scope}.`
    await writeFile(path, rules)
    const llm = fakeLlm([{ type: 'text-delta', text: rules }])
    const host = createHost({ services: {
      fs: fakeFs(), workspaceRegistry: registry([cwd]), llm,
      agentDefaultModel: selector({ provider: 'p', model: 'm' }),
    }, homes })
    const result = await host.call('POST', `${BASE}/generate`, { body: { cwd, path, scope: 'project' } })
    assert.equal(result.status, 200)
    assert.equal(result.json.scope, scope, 'scope must come from the server-validated target, not the request body')
    assert.deepEqual(result.json.facts, [])
    const prompt = llm.calls[0].messages[0].content[0].text
    assert.ok(prompt.includes(rules))
    assert.equal(prompt.split(rules).length - 1, 1, 'the target must not also be supplied as inherited rules')
    assert.doesNotMatch(prompt, /project-only-secret|project-only-command|Facts detected in this repository|Write the project-level/)
    assert.match(llm.calls[0].system, /across projects/)
  }
})

test('an empty global draft requests an unfilled template without repository facts', async () => {
  const { cwd, homes } = await fixture()
  const llm = fakeLlm([{ type: 'text-delta', text: '# Global rules\n- TODO: Your preferences.' }])
  const host = createHost({ services: {
    fs: fakeFs(), workspaceRegistry: registry([cwd]), llm,
    agentDefaultModel: selector({ provider: 'p', model: 'm' }),
  }, homes })
  const path = join(homes.agents, 'AGENTS.md')
  const result = await host.call('POST', `${BASE}/generate`, { body: { cwd, path } })
  assert.equal(result.status, 200)
  assert.equal(result.json.target.exists, false)
  assert.deepEqual(result.json.facts, [])
  assert.match(llm.calls[0].messages[0].content[0].text, /TODO/)
  assert.match(llm.calls[0].system, /Do not invent user preferences/)
  assert.doesNotMatch(llm.calls[0].messages[0].content[0].text, /project rules|global rules\n/)
})

test('POST /generate reads manifests larger than the 4 KiB text probe', async () => {
  const { cwd, homes } = await fixture()
  const dependencies = Object.fromEntries(Array.from({ length: 400 }, (_, index) => [`dep-${index}`, '^1.0.0']))
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'big-demo', scripts: { test: 'node --test' }, dependencies }))
  const llm = fakeLlm([
    { type: 'text-delta', text: '# Rules\n' },
    { type: 'finish', reason: { kind: 'stop' } },
  ])
  const host = createHost({
    services: {
      fs: fakeFs(),
      workspaceRegistry: registry([cwd]),
      llm,
      agentDefaultModel: selector({ provider: 'p', model: 'm' }),
    },
    homes,
  })
  const response = await host.call('POST', `${BASE}/generate`, { body: { cwd, path: join(cwd, 'AGENTS.md') } })
  assert.equal(response.status, 200)
  const prompt = llm.calls[0].messages[0].content[0].text
  assert.match(prompt, /script test: node --test/)
  assert.doesNotMatch(prompt, /\(unparsable\)/)
})

test('POST /generate rejects an oversized target instead of treating it as absent', async () => {
  const { cwd, homes } = await fixture()
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } }))
  await writeFile(join(cwd, 'CLAUDE.md'), 'x'.repeat(1_048_577))
  const host = createHost({
    services: {
      fs: fakeFs(),
      workspaceRegistry: registry([cwd]),
      llm: fakeLlm([]),
      agentDefaultModel: selector({ provider: 'p', model: 'm' }),
    },
    homes,
  })
  const response = await host.call('POST', `${BASE}/generate`, { body: { cwd, path: join(cwd, 'CLAUDE.md') } })
  assert.equal(response.status, 413)
  assert.equal(response.json.code, 'content/too-large')
})

test('create writes without a backup and rollback enforces the content cap', async () => {
  const { cwd, homes } = await fixture()
  const host = createHost({ services: { fs: fakeFs(), workspaceRegistry: registry([cwd]) }, homes })
  const created = await host.call('POST', `${BASE}/file`, {
    body: { cwd, path: join(cwd, 'CLAUDE.md'), content: 'created\n', create: true },
  })
  assert.equal(created.status, 200)
  assert.equal(created.json.backup, null)
  assert.equal(await readFile(join(cwd, 'CLAUDE.md'), 'utf8'), 'created\n')
  const emptyHistory = await host.call('GET', `${BASE}/history`, { query: { cwd, path: join(cwd, 'CLAUDE.md') } })
  assert.deepEqual(emptyHistory.json.backups, [])

  const target = join(cwd, 'AGENTS.md')
  const oversized = join(cwd, 'AGENTS.md.bak-20260101-000000')
  await writeFile(oversized, 'y'.repeat(1_048_577))
  const rolled = await host.call('POST', `${BASE}/rollback`, { body: { cwd, path: target, backup: oversized } })
  assert.equal(rolled.status, 413)
  assert.equal(rolled.json.code, 'content/too-large')
})
