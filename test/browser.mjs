import { createServer } from 'node:http'
import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

import { diffHunks } from '../lib/diff.js'

// Use the host checkout's browser dependencies without adding a build step to the plugin.
const hostRequire = createRequire(process.env.DSH_ROOT
  ? join(resolve(process.env.DSH_ROOT), 'apps/web/package.json')
  : import.meta.url)
const { chromium } = hostRequire('playwright')
const project = fileURLToPath(new URL('../', import.meta.url))
const assets = {
  '/react.js': join(dirname(hostRequire.resolve('react/package.json')), 'umd/react.development.js'),
  '/react-dom.js': join(dirname(hostRequire.resolve('react-dom/package.json')), 'umd/react-dom.development.js'),
  '/client.js': join(project, 'lib/client.js'),
}
const screenshots = process.env.BROWSER_SCREENSHOT_DIR
if (screenshots) await mkdir(screenshots, { recursive: true })

// All workspace/model responses below are test fixtures, not a live DSH session.
const root = '/fixture/project'
const path = `${root}/AGENTS.md`
const globalPath = '/fixture/home/.dsh/AGENTS.md'
const globalContent = '# Global rules\nUse concise explanations.\n'
const backup = `${path}.bak-20260101-000000`
let content = 'project rules\n'
let version = 'v1'
let rollbackPayload
let holdDiff = false
const pageErrors = []
const scope = (path, display, kind = 'project') => ({ path, display, name: 'AGENTS.md', kind, exists: true, bytes: 14 })
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (assets[url.pathname]) {
    res.setHeader('content-type', 'application/javascript')
    res.end(await readFile(assets[url.pathname])); return
  }
  if (url.pathname === '/') {
    res.setHeader('content-type', 'text/html')
    res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--dsw-alias-label-primary:#202020;--dsw-alias-label-secondary:#555;--dsw-alias-label-tertiary:#666;--dsw-alias-bg-base:#fff;}body{margin:16px}</style></head><body><div id="root"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>window.__ModuleLoader__={load({factory}){window.plugin=factory(()=>React)}};</script><script src="/client.js"></script><script>let Section;plugin.apply({effect:fn=>fn(),locale:{register(){},bind:()=>key=>plugin.DICTS.en[key]||key},slots:{inject:(_s,fn)=>fn(),register:(_s,C)=>Section=C}});ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Section));</script></body></html>`)
    return
  }
  res.setHeader('content-type', 'application/json')
  let body
  if (req.method === 'POST') {
    let text = ''
    for await (const chunk of req) text += chunk
    body = JSON.parse(text)
  }
  const file = () => ({ path, exists: true, content, version, bytes: Buffer.byteLength(content) })
  let data
  switch (url.pathname.replace('/api/agents-desk', '')) {
    case '/workspaces': data = { workspaces: [{ id: 'w', path: root, title: 'Fixture' }], defaultCwd: root }; break
    case '/health': data = { capabilities: { fs: true, llm: true, agentDefaultModel: true } }; break
    case '/scopes': data = { scopes: [scope(globalPath, '$DSH_HOME/AGENTS.md', 'user-global'), scope(path, 'AGENTS.md'), scope(`${root}/sub/AGENTS.md`, 'sub/AGENTS.md')] }; break
    case '/chain': data = { budget: { limit: 65536, used: 500 }, rows: [scope(path, 'AGENTS.md')], dynamic: [] }; break
    case '/file':
      if (req.method === 'POST') {
        assert.equal(body.version, version)
        content = body.content; version += '-saved'; data = { ok: true, version, bytes: Buffer.byteLength(content) }
      } else data = url.searchParams.get('path') === globalPath
        ? { path: globalPath, exists: true, content: globalContent, version: 'global-v1', bytes: Buffer.byteLength(globalContent) }
        : { ...file(), path: url.searchParams.get('path') }
      break
    case '/history': data = { backups: [{ backup, name: backup.split('/').pop(), at: '2026-01-01T00:00:00Z', bytes: 10, source: 'save' }] }; break
    case '/history/diff':
      if (holdDiff) return
      data = { path, backup, hunks: [] }; break
    case '/rollback':
      rollbackPayload = body
      content = 'restored rules\n'; version = 'v2'; data = { ok: true, version }; break
    case '/generate': {
      if (body.path === globalPath) {
        const draft = `${globalContent}Keep guidance reusable.\n`
        data = { scope: 'user-global', target: { path: globalPath, content: globalContent, version: 'global-v1' }, draft, hunks: diffHunks(globalContent, draft), facts: [] }
        break
      }
      const lines = content.split('\n'); lines[lines.length - 2] = 'changed rule'
      const draft = lines.join('\n')
      data = { target: file(), draft, hunks: diffHunks(content, draft), facts: ['test fixture'], model: { provider: 'fixture', model: 'fixture' } }
      break
    }
    default: res.statusCode = 404; data = { error: 'fixture route not found' }
  }
  res.end(JSON.stringify(data))
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
page.setDefaultTimeout(6000)
page.on('pageerror', error => pageErrors.push(error.message))
const origin = `http://127.0.0.1:${server.address().port}`
try {
  await page.goto(origin)
  await page.getByRole('button', { name: 'AGENTS.md', exact: false }).filter({ hasText: /^AGENTS.md/ }).first().click()
  await page.getByRole('textbox').waitFor()
  await page.getByRole('button', { name: /history/i }).click()
  await page.getByRole('button', { name: 'Roll back', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Roll back', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'restored rules\n')
  assert.equal(rollbackPayload.version, 'v1', 'rollback must send the editor version')
  console.log('PASS browser rollback sends editor version')

  holdDiff = true
  await page.getByRole('button', { name: 'View diff', exact: true }).click()
  await page.getByText('Computing the diff…', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Close', exact: true }).last().click()
  assert.equal(await page.getByText('Computing the diff…', { exact: true }).count(), 0, 'closing a pending diff must clear its loading state')
  console.log('PASS browser closes pending diff')

  content = 'rule\n'.repeat(150_000)
  version = 'large-v1'
  await page.getByRole('button', { name: 'Reload', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.length === 750000)
  await page.getByRole('button', { name: 'Draft with model', exact: true }).click()
  await page.getByRole('button', { name: 'Apply selected', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.endsWith('changed rule\n'))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByText('Saved', { exact: true }).waitFor()
  assert.ok(content.endsWith('changed rule\n'))
  assert.deepEqual(pageErrors, [])
  console.log('PASS browser applies and saves a 150,000-line proposal without errors')
  if (screenshots) await page.screenshot({ path: join(screenshots, 'agents-desk-desktop.png'), fullPage: true })
  content = 'project rules\n'
  version = 'small-v1'
  await page.getByRole('button', { name: 'Reload', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'project rules\n')
  await page.setViewportSize({ width: 390, height: 844 })
  if (screenshots) await page.screenshot({ path: join(screenshots, 'agents-desk-mobile.png'), fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(pageErrors, [])
  console.log('PASS mobile layout has no horizontal overflow')

  await page.getByRole('button', { name: /\$DSH_HOME\/AGENTS.md/ }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.startsWith('# Global rules'))
  await page.getByText('Applies across projects. Uses only existing global rules; an empty file gets a TODO template. No workspace facts are used.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Draft global rules', exact: true }).click()
  await page.locator('#agents-desk-gen').getByText('Draft global rules', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  if (screenshots) {
    await page.screenshot({ path: join(screenshots, 'agents-desk-global-mobile.png'), fullPage: true })
    await page.setViewportSize({ width: 1100, height: 1000 })
    await page.screenshot({ path: join(screenshots, 'agents-desk-global-desktop.png'), fullPage: true })
  }
  await page.getByRole('button', { name: 'Apply selected', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('Keep guidance reusable.'))
  assert.deepEqual(pageErrors, [])
  console.log('PASS browser identifies global drafting and applies the global proposal')
} catch (error) {
  console.log('ORIGINAL ERROR:', error.message)
  console.log('DOM:', await page.locator('body').innerText().catch(() => '(page unavailable)'))
  console.log('PAGE ERRORS:', pageErrors)
  throw error
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
