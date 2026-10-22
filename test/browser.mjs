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
let saveCalls = 0
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
    const language = url.searchParams.get('lang') === 'zh' ? 'zh' : 'en'
    res.setHeader('content-type', 'text/html')
    res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--dsw-alias-label-primary:#202020;--dsw-alias-label-secondary:#555;--dsw-alias-label-tertiary:#666;--dsw-alias-bg-base:#fff;}body{margin:0;background:var(--dsw-alias-bg-base,#fff)}.gY7AlW_options{background:var(--dsw-alias-bg-layer-2,#f3f4f6);box-sizing:border-box;width:100%;max-width:1000px;margin-inline:auto;padding:24px}</style></head><body><div class="gY7AlW_options"><div id="root"></div></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>window.__ModuleLoader__={load({factory}){window.plugin=factory(()=>React)}};</script><script src="/client.js"></script><script>let Section;plugin.apply({effect:fn=>fn(),locale:{register(){},bind:()=>key=>plugin.DICTS.${language}[key]||key},slots:{inject:(_s,fn)=>fn(),register:(_s,C)=>Section=C}});ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Section));</script></body></html>`)
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
    case '/health': data = { version: '0.2.0', capabilities: { fs: true, llm: true, agentDefaultModel: true } }; break
    case '/scopes': data = { scopes: [scope(globalPath, '$DSH_HOME/AGENTS.md', 'user-global'), scope(path, 'AGENTS.md'), scope(`${root}/sub/AGENTS.md`, 'sub/AGENTS.md')] }; break
    case '/chain': data = { budget: { limit: 65536, used: 500, remaining: 65036 }, rows: [{ ...scope(globalPath, '$DSH_HOME/AGENTS.md'), status: 'loaded', included: 100 }, { ...scope(path, 'AGENTS.md'), status: 'loaded', included: 14 }], dynamic: [], assumptions: { source: 'defaults' } }; break
    case '/file':
      if (req.method === 'POST') {
        saveCalls += 1
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
  await page.getByRole('tab', { name: 'Editor', exact: true }).waitFor()
  await page.getByRole('textbox').waitFor()
  await page.getByRole('textbox').fill('Unsaved cross-tab draft\n')
  await page.getByRole('tab', { name: /Effective chain/ }).click()
  await page.getByRole('tab', { name: 'Editor', exact: true }).click()
  assert.equal(await page.getByRole('textbox').inputValue(), 'Unsaved cross-tab draft\n')
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await page.locator('article.markdown').getByText('Unsaved cross-tab draft', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Select a file', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Filter files', exact: true }).fill('$DSH_HOME')
  await page.getByRole('button', { name: /\$DSH_HOME\/AGENTS.md/ }).click()
  await page.getByRole('alertdialog').waitFor()
  assert.equal(await page.getByRole('alertdialog').evaluate(el => el.open), true)
  await page.keyboard.press('Control+s')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.equal(saveCalls, 0, 'keyboard save must not write behind a confirmation dialog')
  assert.equal(await page.getByRole('textbox').inputValue(), 'Unsaved cross-tab draft\n')
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click()
  console.log('PASS tabs, preview, file filtering and modal cancellation preserve unsaved edits')

  await page.getByRole('tab', { name: /history/i }).click()
  await page.getByRole('button', { name: 'Roll back', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Roll back', exact: true }).click()
  await page.getByRole('tab', { name: 'Editor', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'restored rules\n')
  assert.equal(rollbackPayload.version, 'v1', 'rollback must send the editor version')
  console.log('PASS browser rollback sends editor version')

  await page.getByRole('tab', { name: /history/i }).click()
  holdDiff = true
  await page.getByRole('button', { name: 'View diff', exact: true }).click()
  await page.getByText('Computing the diff…', { exact: true }).waitFor()
  await page.getByRole('tabpanel').getByRole('button', { name: 'Close', exact: true }).click()
  assert.equal(await page.getByText('Computing the diff…', { exact: true }).count(), 0, 'closing a pending diff must clear its loading state')
  console.log('PASS browser closes pending diff')

  await page.getByRole('tab', { name: 'Editor', exact: true }).click()
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
  content = 'project rules\n'
  version = 'small-v1'
  await page.getByRole('button', { name: 'Reload', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'project rules\n')
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(pageErrors, [])
  console.log('PASS mobile layout has no horizontal overflow')

  await page.getByRole('button', { name: 'Select a file', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Filter files', exact: true }).fill('$DSH_HOME')
  await page.getByRole('button', { name: /\$DSH_HOME\/AGENTS.md/ }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.startsWith('# Global rules'))
  await page.getByText('Applies across projects. Uses only existing global rules; an empty file gets a TODO template. No workspace facts are used.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Draft global rules', exact: true }).click()
  await page.locator('#agents-desk-gen').getByText('Draft global rules', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.getByRole('button', { name: 'Apply selected', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('Keep guidance reusable.'))
  assert.deepEqual(pageErrors, [])
  console.log('PASS browser identifies global drafting and applies the global proposal')
  for (const [width, height] of [[360,800],[390,844],[430,932],[600,960],[820,1180],[1024,768],[1366,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({ width, height })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}px`)
  }
  console.log('PASS responsive layout at all 9 handoff viewports')
  const hostStyle = await page.evaluate(() => {
    const button = document.createElement('button')
    button.className = 'btn'
    button.textContent = 'Host control'
    document.body.append(button)
    const result = getComputedStyle(button).minHeight
    button.remove()
    return result
  })
  assert.equal(hostStyle, '0px', 'plugin button styles must not escape the settings section')
  console.log('PASS plugin styles remain isolated from host controls')
  const insets = await page.evaluate(() => {
    const host = document.querySelector('.gY7AlW_options')
    const hostRect = host.getBoundingClientRect()
    const panel = document.querySelector('[data-agents-desk]').getBoundingClientRect()
    const view = document.querySelector('#agents-desk-view').getBoundingClientRect()
    const workspace = document.querySelector('.workspace-control').getBoundingClientRect()
    return { hostPadding: getComputedStyle(host).paddingLeft, panelLeft: panel.left - hostRect.left, panelRight: hostRect.right - panel.right, panelWidth: panel.width, contentLeft: view.left - panel.left, workspaceLeft: workspace.left - panel.left }
  })
  assert.equal(insets.hostPadding, '24px')
  assert.ok(Math.abs(insets.panelLeft - 24) < 1, 'panel must use the host inset')
  assert.ok(Math.abs(insets.panelRight - 24) < 1, 'panel must fill the host content width')
  assert.ok(insets.panelWidth > 559, 'wide settings content must not be clamped to a standalone card width')
  assert.ok(Math.abs(insets.contentLeft) < 1, 'view must not add another horizontal inset')
  assert.ok(Math.abs(insets.workspaceLeft) < 1, 'workspace must align with the settings content edge')
  console.log('PASS embedded panel reuses host 24px insets without a second gutter')
  const surfaceBackgrounds = await page.evaluate(() => [
    document.querySelector('[data-agents-desk]'),
    document.querySelector('.brandbar'),
    document.querySelector('.intro'),
    document.querySelector('.tabs'),
    document.querySelector('#agents-desk-view'),
  ].map(element => getComputedStyle(element).backgroundColor))
  assert.ok(surfaceBackgrounds.every(color => color === 'rgba(0, 0, 0, 0)'), 'outer settings surface and chrome must stay transparent')
  console.log('PASS outer surface uses the host background without a painted panel')



  if (screenshots) {
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click()
    content = '# 项目约定\n\n## 项目概览\nDSH 指令文件管理插件。\n运行于宿主 Web 设置面板。\n\n## 开发命令\n`node --test test/*.test.mjs`\n\n## 编码约定\n- 沿用宿主主题变量。\n- 保持中英文文案一致。\n- 文件写入必须携带版本令牌。\n\n## 修改边界\n- 仅编辑宿主实际加载的指令文件。\n- 不增加新的指令注入层。\n'
    await page.goto(`${origin}/?lang=zh`)
    await page.getByRole('textbox').waitFor()
    for (const [width, height] of [[360,800],[390,844],[430,932],[600,960],[820,1180],[1024,768],[1366,768],[1440,900],[1920,1080]]) {
      await page.setViewportSize({ width, height })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.screenshot({ path: join(screenshots, `editor-${width}.png`), fullPage: true })
      if ([390,1440].includes(width)) {
        await page.getByRole('tab', { name: /生效链/ }).click()
        await page.screenshot({ path: join(screenshots, `chain-${width}.png`), fullPage: true })
        await page.getByRole('tab', { name: /保存历史/ }).click()
        await page.getByRole('button', { name: '查看差异', exact: true }).waitFor()
        await page.screenshot({ path: join(screenshots, `history-${width}.png`), fullPage: true })
        await page.getByRole('tab', { name: '编辑器', exact: true }).click()
      }
    }
    await page.evaluate(() => {
      const style = document.documentElement.style
      style.setProperty('--dsw-alias-bg-base', '#141414')
      style.setProperty('--dsw-alias-bg-layer-2', '#202124')
      style.setProperty('--dsw-alias-label-primary', '#eeeeee')
      style.setProperty('--dsw-alias-label-secondary', '#b9bec7')
      style.setProperty('--dsw-alias-border-l3', '#484e58')
      style.colorScheme = 'dark'
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: join(screenshots, 'editor-dark-390.png'), fullPage: true })
  }

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
