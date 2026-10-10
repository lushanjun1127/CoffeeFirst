/* CoffeeFirst - 我的起始页 */
import './styles/main.scss'

/* ---------- 类型定义 ---------- */
interface SearchEngine {
  name: string
  icon: string
  bang: string
  url: string
}

interface Bookmark {
  name: string
  url: string
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
let engineIdx = Math.min(Number(localStorage.getItem(ENGINE_KEY)) || 0, ENGINES.length - 1)

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
    item.className = 'menu-item' + (i === engineIdx ? ' active' : '')
    item.textContent = `${eng.icon} ${eng.name}`
    item.addEventListener('click', () => {
      engineIdx = i
      localStorage.setItem(ENGINE_KEY, String(i))
      renderEngine()
      closeMenu()
      input?.focus()
    })
    engineMenu.appendChild(item)
  })
}

function renderEngine(): void {
  if (!engineBtn) return
  const eng = ENGINES[engineIdx]
  if (!eng) return
  engineBtn.innerHTML = `<span class="engine-icon">${eng.icon}</span> ${eng.name} <span class="caret">▾</span>`
  buildEngineMenu()
}

function closeMenu(): void {
  engineMenu?.classList.add('hidden')
}

// 点击按钮弹出引擎列表；点击页面其他处关闭
engineBtn?.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation()
  if (!engineMenu) return
  const open = engineMenu.classList.toggle('hidden') === false
  if (open) engineMenu.scrollTop = engineIdx * 36 - 72 // 让当前项大致居中
})
document.addEventListener('click', closeMenu)
engineMenu?.addEventListener('click', (e: MouseEvent) => e.stopPropagation())

renderEngine()

// 看起来像网址就直接打开，否则搜索
function looksLikeUrl(s: string): boolean {
  return /^(https?:\/\/)/i.test(s) ||
    /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s) ||
    /^localhost(:\d+)?(\/\S*)?$/.test(s)
}

function doSearch(): void {
  if (!input) return
  const q = input.value.trim()
  if (!q) return
  // 快捷语法：!g !b !ddg 等前缀临时指定引擎（不改变默认选择）
  const bang = ENGINES.find((e) => e.bang && q.toLowerCase().startsWith(e.bang + ' '))
  if (looksLikeUrl(q)) {
    const url = /^https?:\/\//i.test(q) ? q : 'https://' + q
    location.href = url
  } else if (bang) {
    const kw = q.slice(bang.bang.length + 1).trim()
    location.href = bang.url + encodeURIComponent(kw)
  } else {
    const eng = ENGINES[engineIdx]
    if (!eng) return
    location.href = eng.url + encodeURIComponent(q)
  }
}

searchGo?.addEventListener('click', doSearch)
input?.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') doSearch()
  if (e.key === 'Escape') {
    if (engineMenu && !engineMenu.classList.contains('hidden')) closeMenu()
    else input.value = ''
  }
})

// 快捷键：Ctrl+K 或 "/" 聚焦；Alt+←/→ 切换引擎
document.addEventListener('keydown', (e: KeyboardEvent) => {
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
    engineIdx = (engineIdx + (e.key === 'ArrowRight' ? 1 : -1) + ENGINES.length) % ENGINES.length
    localStorage.setItem(ENGINE_KEY, String(engineIdx))
    renderEngine()
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

// localStorage 中的 JSON 结构无法静态确定，用 unknown + 类型守卫校验
function isBookmark(v: unknown): v is Bookmark {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { name?: unknown }).name === 'string' &&
    typeof (v as { url?: unknown }).url === 'string'
  )
}

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BM_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every(isBookmark)) {
        return parsed
      }
    }
  } catch (e) { /* ignore */ }
  return [...DEFAULT_BOOKMARKS]
}

let bookmarks: Bookmark[] = loadBookmarks()
let editingIndex = -1 // -1 表示新增

function saveBookmarks(): void {
  localStorage.setItem(BM_KEY, JSON.stringify(bookmarks))
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
  div.textContent = name.slice(0, 1).toUpperCase()
  return div
}

function render(): void {
  if (!grid) return
  grid.innerHTML = ''
  bookmarks.forEach((bm, i) => {
    const a = document.createElement('a')
    a.className = 'card'
    a.href = bm.url
    a.title = bm.url + '\n（右键/长按可编辑）'

    const icon = document.createElement('img')
    const fav = faviconUrl(bm.url)
    if (fav) {
      icon.src = fav
      icon.alt = ''
      icon.loading = 'lazy'
      icon.onerror = () => icon.replaceWith(makeFallback(bm.name))
    } else {
      icon.replaceWith(makeFallback(bm.name))
    }

    const label = document.createElement('span')
    label.textContent = bm.name

    a.append(icon, label)
    a.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
      openDialog(i)
    })
    a.addEventListener('dblclick', (e: MouseEvent) => {
      e.preventDefault()
      openDialog(i)
    })
    grid.appendChild(a)
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

addBtn?.addEventListener('click', () => openDialog(-1))

function openDialog(index: number): void {
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

deleteBtn?.addEventListener('click', () => {
  if (editingIndex >= 0) {
    bookmarks.splice(editingIndex, 1)
    saveBookmarks()
    render()
    dialog?.close()
  }
})

form?.addEventListener('submit', (e: Event) => {
  e.preventDefault()
  if (!nameInput || !urlInput) return
  const name = nameInput.value.trim()
  let url = urlInput.value.trim()
  if (!name || !url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  const item: Bookmark = { name, url }
  if (editingIndex >= 0) {
    bookmarks[editingIndex] = item
  } else {
    bookmarks.push(item)
  }
  saveBookmarks()
  render()
  dialog?.close()
})

render()
