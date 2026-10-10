/* CoffeeFirst - 我的起始页 */
import './styles/main.scss'
import { readStorage, writeStorage, parseEngineIndex, normalizeHttpUrl, looksLikeAddress, parseBookmarks } from './core'
import type { Bookmark } from './core'

/* ---------- 类型定义 ---------- */
interface SearchEngine {
  name: string
  icon: string
  bang: string
  url: string
}

const statusEl = document.querySelector<HTMLParagraphElement>('#app-status')
function notify(message: string): void {
  if (statusEl) statusEl.textContent = message
}

/* ---------- 时钟 ---------- */
const timeEl = document.querySelector<HTMLDivElement>('#time')
const dateEl = document.querySelector<HTMLDivElement>('#date')
const WEEK: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function tick(): void {
  if (!timeEl || !dateEl) return
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  timeEl.textContent = `${h}:${m}`
  const week = WEEK[now.getDay()] ?? ''
  dateEl.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${week}`
}
tick()
setInterval(tick, 1000)

/* ---------- 搜索 ---------- */
// bang：快捷语法前缀（如 "!g 关键词" 临时用 Google，不改变默认引擎）
const ENGINES: SearchEngine[] = [
  { name: 'Google',        icon: '🔍', bang: '!g',        url: 'https://www.google.com/search?q=' },
  { name: 'Bing',          icon: '🔍', bang: '!b',        url: 'https://www.bing.com/search?q=' },
  { name: 'DuckDuckGo',    icon: '🦆', bang: '!ddg',      url: 'https://duckduckgo.com/?q=' },
  { name: '百度',           icon: '🐾', bang: '!bd',       url: 'https://www.baidu.com/s?wd=' },
  { name: '必应中国',       icon: '🌏', bang: '!cn',       url: 'https://cn.bing.com/search?q=' },
  { name: '搜狗',           icon: '🐶', bang: '!sg',       url: 'https://www.sogou.com/web?query=' },
  { name: '360搜索',        icon: '🔎', bang: '!so',       url: 'https://www.so.com/s?q=' },
  { name: 'GitHub',        icon: '🐙', bang: '!gh',       url: 'https://github.com/search?q=' },
  { name: 'MDN',           icon: '📘', bang: '!mdn',      url: 'https://developer.mozilla.org/zh-CN/search?q=' },
  { name: 'StackOverflow', icon: '📚', bang: '!so2',      url: 'https://stackoverflow.com/search?q=' },
  { name: '知乎',           icon: '💬', bang: '!zh',       url: 'https://www.zhihu.com/search?type=content&q=' },
  { name: 'B站',            icon: '📺', bang: '!bilibili', url: 'https://search.bilibili.com/all?keyword=' },
  { name: 'YouTube',       icon: '▶️', bang: '!yt',       url: 'https://www.youtube.com/results?search_query=' },
  { name: 'npm',           icon: '📦', bang: '!npm',      url: 'https://www.npmjs.com/search?q=' },
  { name: 'DeepL',         icon: '🌐', bang: '!dl',       url: 'https://www.deepl.com/translator#en/zh/' },
]

const ENGINE_KEY = 'coffeefirst-engine'
const storedEngine = readStorage(ENGINE_KEY)
let engineIdx = parseEngineIndex(storedEngine.value, ENGINES.length)
if (!storedEngine.ok) notify('无法读取本地设置，已使用默认设置。保存修改时将再次尝试。')

const engineBtn = document.querySelector<HTMLButtonElement>('#engine-toggle')
const engineMenu = document.querySelector<HTMLDivElement>('#engine-menu')
const input = document.querySelector<HTMLInputElement>('#search-input')
const searchGo = document.querySelector<HTMLButtonElement>('#search-go')

function buildEngineMenu(): void {
  if (!engineMenu) return
  engineMenu.innerHTML = ''
  ENGINES.forEach((eng, i) => {
    const item = document.createElement('button')
    item.type = 'button'
    item.setAttribute('role', 'menuitemradio')
    item.tabIndex = -1
    item.className = 'menu-item' + (i === engineIdx ? ' active' : '')
    item.textContent = `${eng.icon} ${eng.name}`
    item.addEventListener('click', () => {
      if (selectEngine(i)) closeMenu(true)
    })
    engineMenu.appendChild(item)
  })
}

function renderEngine(): void {
  if (!engineBtn) return
  const eng = ENGINES[engineIdx]
  if (!eng) return
  engineBtn.innerHTML = `<span class="engine-icon">${eng.icon}</span> ${eng.name} <span class="caret">▾</span>`
  engineMenu?.querySelectorAll<HTMLButtonElement>('.menu-item').forEach((item, index) => {
    item.classList.toggle('active', index === engineIdx)
    item.setAttribute('aria-checked', String(index === engineIdx))
  })
}

function selectEngine(index: number): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= ENGINES.length) return false
  // Persist first: failure leaves both memory and the UI at their old values.
  if (!writeStorage(ENGINE_KEY, String(index))) {
    notify('搜索引擎保存失败，已保留原选择。请检查浏览器存储权限或空间。')
    return false
  }
  engineIdx = index
  renderEngine()
  notify('')
  return true
}

function closeMenu(restoreFocus = false): void {
  engineMenu?.classList.add('hidden')
  engineBtn?.setAttribute('aria-expanded', 'false')
  if (restoreFocus) engineBtn?.focus()
}

function focusMenuItem(index: number): void {
  const item = engineMenu?.querySelectorAll<HTMLButtonElement>('.menu-item')[index]
  item?.focus({ preventScroll: true })
  // Use actual item geometry; labels may wrap or use larger fonts.
  if (item && engineMenu) {
    const top = item.offsetTop
    const bottom = top + item.offsetHeight
    if (top < engineMenu.scrollTop) engineMenu.scrollTop = top
    else if (bottom > engineMenu.scrollTop + engineMenu.clientHeight) engineMenu.scrollTop = bottom - engineMenu.clientHeight
  }
}

function openMenu(index = engineIdx): void {
  if (!engineMenu) return
  engineMenu.classList.remove('hidden')
  engineBtn?.setAttribute('aria-expanded', 'true')
  focusMenuItem(index)
}

// 点击按钮弹出引擎列表；点击页面其他处关闭
engineBtn?.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation()
  if (!engineMenu) return
  if (engineMenu.classList.contains('hidden')) openMenu()
  else closeMenu(true)
})
engineBtn?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    openMenu(e.key === 'ArrowDown' ? 0 : ENGINES.length - 1)
  } else if (e.key === 'Escape') closeMenu(true)
})
engineMenu?.addEventListener('keydown', (e) => {
  const items = Array.from(engineMenu.querySelectorAll<HTMLButtonElement>('.menu-item'))
  const index = items.findIndex((item) => item === document.activeElement)
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu(true)
  } else if (e.key === 'Tab') closeMenu()
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
    e.preventDefault()
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1
      : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    focusMenuItem(next)
  }
})
document.addEventListener('click', () => closeMenu())
document.addEventListener('focusin', (e) => {
  if (e.target instanceof Node && !engineBtn?.contains(e.target) && !engineMenu?.contains(e.target)) closeMenu()
})
engineMenu?.addEventListener('click', (e: MouseEvent) => e.stopPropagation())

buildEngineMenu()
renderEngine()

// 看起来像网址就直接打开，否则搜索
function doSearch(): void {
  if (!input) return
  const q = input.value.trim()
  if (!q) return
  // 快捷语法：!g !b !ddg 等前缀临时指定引擎（不改变默认选择）
  const prefix = q.match(/^(!\S+)(?:\s+([\s\S]*))?$/)
  const bang = ENGINES.find((engine) => engine.bang === prefix?.[1]?.toLowerCase())
  if (bang) {
    const kw = prefix?.[2]?.trim() ?? ''
    if (!kw) { notify('请在搜索引擎快捷语法后输入关键词。'); return }
    location.href = bang.url + encodeURIComponent(kw)
  } else if (looksLikeAddress(q) || /^[a-z][a-z\d+.-]*:/i.test(q)) {
    const url = normalizeHttpUrl(q)
    if (!url) { notify('网址无效，仅支持 HTTP 和 HTTPS 地址。'); return }
    location.href = url
  } else {
    const eng = ENGINES[engineIdx]
    if (!eng) return
    location.href = eng.url + encodeURIComponent(q)
  }
}

searchGo?.addEventListener('click', doSearch)
input?.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === 'Enter') doSearch()
  if (e.key === 'Escape') {
    if (engineMenu && !engineMenu.classList.contains('hidden')) closeMenu()
    else input.value = ''
  }
})

// 快捷键：Ctrl+K 或 "/" 聚焦；Alt+←/→ 切换引擎
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229 || dialog?.open) return
  const activeTag = document.activeElement instanceof HTMLElement
    ? document.activeElement.tagName
    : ''
  const typing = /input|textarea/i.test(activeTag)
  if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
    e.preventDefault()
    input?.focus()
  }
  if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault()
    selectEngine((engineIdx + (e.key === 'ArrowRight' ? 1 : -1) + ENGINES.length) % ENGINES.length)
  }
})

/* ---------- 书签 ---------- */
const BM_KEY = 'coffeefirst-bookmarks'
const DEFAULT_BOOKMARKS: Bookmark[] = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: '掘金', url: 'https://juejin.cn' },
  { name: '知乎', url: 'https://zhihu.com' },
  { name: 'MDN', url: 'https://developer.mozilla.org' },
  { name: 'V2EX', url: 'https://www.v2ex.com' },
]

function loadBookmarks(): Bookmark[] {
  const stored = readStorage(BM_KEY)
  if (!stored.ok) notify('无法读取本地书签，已使用默认书签。保存修改时将再次尝试。')
  return parseBookmarks(stored.value, DEFAULT_BOOKMARKS)
}

let bookmarks: Bookmark[] = loadBookmarks()
let editingIndex = -1 // -1 表示新增

function saveBookmarks(next: Bookmark[]): boolean {
  if (!writeStorage(BM_KEY, JSON.stringify(next))) {
    if (dialogError) dialogError.textContent = '保存失败，原有书签未改变。请检查浏览器存储权限或空间。'
    return false
  }
  bookmarks = next
  notify('')
  render()
  dialog?.close()
  return true
}

const grid = document.querySelector<HTMLDivElement>('#grid')

function faviconUrl(u: string): string {
  try {
    const host = new URL(u).hostname
    return `https://www.google.com/s2/favicons?sz=64&domain=${host}`
  } catch (e) {
    return ''
  }
}

function colorFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0
  return `hsl(${hash % 360}, 55%, 45%)`
}

function makeFallback(name: string): HTMLDivElement {
  const div = document.createElement('div')
  div.className = 'fallback'
  div.style.background = colorFor(name)
  div.textContent = Array.from(name)[0]?.toUpperCase() ?? '?'
  div.setAttribute('aria-hidden', 'true')
  return div
}

function render(): void {
  if (!grid) return
  grid.innerHTML = ''
  bookmarks.forEach((bm, i) => {
    const card = document.createElement('div')
    card.className = 'bookmark-card'
    const a = document.createElement('a')
    a.className = 'card'
    a.href = bm.url
    a.title = `${bm.name}\n${bm.url}`

    const icon = document.createElement('img')
    const fav = faviconUrl(bm.url)
    if (fav) {
      icon.src = fav
      icon.alt = ''
      icon.loading = 'lazy'
      icon.onerror = () => icon.replaceWith(makeFallback(bm.name))
    }

    const label = document.createElement('span')
    label.textContent = bm.name

    a.append(fav ? icon : makeFallback(bm.name), label)
    const edit = document.createElement('button')
    edit.type = 'button'
    edit.className = 'bookmark-edit'
    edit.textContent = '编辑'
    edit.setAttribute('aria-label', `编辑书签：${bm.name}`)
    edit.addEventListener('click', () => {
      openDialog(i)
    })
    card.append(a, edit)
    grid.appendChild(card)
  })
}

/* ---------- 编辑弹窗 ---------- */
const dialog = document.querySelector<HTMLDialogElement>('#edit-dialog')
const dialogTitle = document.querySelector<HTMLHeadingElement>('#dialog-title')
const nameInput = document.querySelector<HTMLInputElement>('#bm-name')
const urlInput = document.querySelector<HTMLInputElement>('#bm-url')
const deleteBtn = document.querySelector<HTMLButtonElement>('#bm-delete')
const addBtn = document.querySelector<HTMLButtonElement>('#add-bookmark')
const cancelBtn = document.querySelector<HTMLButtonElement>('#bm-cancel')
const form = dialog?.querySelector<HTMLFormElement>('form')
const dialogError = document.querySelector<HTMLParagraphElement>('#dialog-error')
let dialogOrigin: HTMLElement | null = null

addBtn?.addEventListener('click', () => openDialog(-1))

function openDialog(index: number): void {
  closeMenu()
  dialogOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (dialogError) dialogError.textContent = ''
  urlInput?.setCustomValidity('')
  nameInput?.setCustomValidity('')
  editingIndex = index
  if (index >= 0) {
    const bm = bookmarks[index]
    if (!bm) return
    if (dialogTitle) dialogTitle.textContent = '编辑书签'
    if (nameInput) nameInput.value = bm.name
    if (urlInput) urlInput.value = bm.url
    deleteBtn?.classList.remove('hidden')
  } else {
    if (dialogTitle) dialogTitle.textContent = '添加书签'
    if (nameInput) nameInput.value = ''
    if (urlInput) urlInput.value = ''
    deleteBtn?.classList.add('hidden')
  }
  dialog?.showModal()
  nameInput?.focus()
}

cancelBtn?.addEventListener('click', () => dialog?.close())
dialog?.addEventListener('close', () => {
  const edited = editingIndex >= 0 ? grid?.querySelectorAll<HTMLButtonElement>('.bookmark-edit')[editingIndex] : null
  const target = dialogOrigin?.isConnected ? dialogOrigin : edited ?? addBtn
  target?.focus()
})
urlInput?.addEventListener('input', () => urlInput.setCustomValidity(''))
nameInput?.addEventListener('input', () => nameInput.setCustomValidity(''))

deleteBtn?.addEventListener('click', () => {
  if (editingIndex >= 0) {
    saveBookmarks(bookmarks.filter((_, index) => index !== editingIndex))
  }
})

form?.addEventListener('submit', (e: Event) => {
  e.preventDefault()
  if (!nameInput || !urlInput) return
  const name = nameInput.value.trim()
  const url = normalizeHttpUrl(urlInput.value)
  nameInput.setCustomValidity(!name ? '请输入书签名称。' : '')
  urlInput.setCustomValidity(!url ? '请输入有效的 HTTP 或 HTTPS 网址，也可以输入域名或 localhost 地址。' : '')
  if (!name || !url) { form?.reportValidity(); return }
  const item: Bookmark = { name, url }
  const next = [...bookmarks]
  if (editingIndex >= 0) {
    next[editingIndex] = item
  } else {
    next.push(item)
  }
  saveBookmarks(next)
})

render()
