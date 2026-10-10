const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function loadCore(storage) {
  const context = { exports: {}, URL, localStorage: storage }
  vm.createContext(context)
  const source = fs.readFileSync('src/core.ts', 'utf8')
  vm.runInContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context)
  return context.exports
}

test('unavailable storage is safe, including failure to acquire the storage object', () => {
  const core = loadCore(undefined)
  assert.equal(core.readStorage('engine').ok, false)
  assert.equal(core.readStorage('engine').value, null)
  assert.equal(core.writeStorage('engine', '1'), false)
})

test('storage access exceptions are contained; successful writes remain readable', () => {
  const failed = loadCore({ getItem() { throw Error('denied') }, setItem() { throw Error('quota') } })
  assert.equal(failed.readStorage('engine').ok, false)
  assert.equal(failed.writeStorage('engine', '1'), false)
  const values = new Map()
  const core = loadCore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) })
  assert.equal(core.writeStorage('engine', '2'), true)
  assert.equal(core.readStorage('engine').value, '2')
})

test('engine indices must be integers within the engine list', () => {
  const { parseEngineIndex } = loadCore()
  for (const value of [null, '-1', '1.5', '15', 'Infinity', 'NaN', 'corrupt']) {
    assert.equal(parseEngineIndex(value, 15), 0, String(value))
  }
  assert.equal(parseEngineIndex('14', 15), 14)
})

test('normalization supports domains, query strings, ports, and local HTTP', () => {
  const { normalizeHttpUrl } = loadCore()
  const cases = {
    'example.com?x=1': 'https://example.com/?x=1',
    'example.com:8080/path': 'https://example.com:8080/path',
    'localhost:3000': 'http://localhost:3000/',
    '127.0.0.1:5173': 'http://127.0.0.1:5173/',
    '[::1]:3000': 'http://[::1]:3000/',
    ' HTTP://example.com ': 'http://example.com/',
  }
  for (const [value, expected] of Object.entries(cases)) assert.equal(normalizeHttpUrl(value), expected)
})

test('unsafe protocols, credentials, malformed URLs and control characters are rejected', () => {
  const { normalizeHttpUrl } = loadCore()
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', 'file:///tmp', 'https://', 'https://user:pass@example.com', 'https://example.com\\evil', '', '   ']) {
    assert.equal(normalizeHttpUrl(value), null, value)
  }
  assert.equal(normalizeHttpUrl('https://exam\nple.com'), null)
})

test('bookmark loading preserves empty lists and filters unsafe entries without losing safe ones', () => {
  const { parseBookmarks } = loadCore()
  const defaults = [{ name: 'Default', url: 'https://example.com' }]
  assert.equal(parseBookmarks('[]', defaults).length, 0)
  assert.equal(parseBookmarks('{bad json', defaults)[0].name, 'Default')
  const result = parseBookmarks(JSON.stringify([
    { name: ' Safe ', url: 'https://example.com' },
    { name: 'Unsafe', url: 'javascript:alert(1)' },
    { name: 'FTP', url: 'ftp://example.com' },
    { name: ' ', url: 'https://example.com' },
    null,
  ]), defaults)
  assert.equal(result.length, 1)
  assert.equal(result[0].name, 'Safe')
  assert.equal(result[0].url, 'https://example.com/')
})
