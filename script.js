/* CoffeeFirst - 我的起始页 */
(() => {
  "use strict";

  /* ---------- 时钟 ---------- */
  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");
  const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    timeEl.textContent = `${h}:${m}`;
    dateEl.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEK[now.getDay()]}`;
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 搜索 ---------- */
  const ENGINES = [
    { name: "Google", url: "https://www.google.com/search?q=" },
    { name: "Bing", url: "https://www.bing.com/search?q=" },
    { name: "百度", url: "https://www.baidu.com/s?wd=" },
  ];
  const ENGINE_KEY = "coffeefirst-engine";
  let engineIdx = Number(localStorage.getItem(ENGINE_KEY)) || 0;

  const engineBtn = document.getElementById("engine-toggle");
  const input = document.getElementById("search-input");

  function renderEngine() {
    engineBtn.textContent = "🔍 " + ENGINES[engineIdx].name;
  }
  renderEngine();

  engineBtn.addEventListener("click", () => {
    engineIdx = (engineIdx + 1) % ENGINES.length;
    localStorage.setItem(ENGINE_KEY, engineIdx);
    renderEngine();
    input.focus();
  });

  // 看起来像网址就直接打开，否则搜索
  function looksLikeUrl(s) {
    return /^(https?:\/\/)/i.test(s) ||
      /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s) ||
      /^localhost(:\d+)?(\/\S*)?$/.test(s);
  }

  function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    if (looksLikeUrl(q)) {
      const url = /^https?:\/\//i.test(q) ? q : "https://" + q;
      location.href = url;
    } else {
      location.href = ENGINES[engineIdx].url + encodeURIComponent(q);
    }
  }

  document.getElementById("search-go").addEventListener("click", doSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
    if (e.key === "Escape") input.value = "";
  });

  // 快捷键：Ctrl+K 或 "/" 聚焦
  document.addEventListener("keydown", (e) => {
    const typing = /input|textarea/i.test(document.activeElement.tagName);
    if ((e.ctrlKey && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
      e.preventDefault();
      input.focus();
    }
  });

  /* ---------- 书签 ---------- */
  const BM_KEY = "coffeefirst-bookmarks";
  const DEFAULT_BOOKMARKS = [
    { name: "GitHub", url: "https://github.com" },
    { name: "YouTube", url: "https://youtube.com" },
    { name: "掘金", url: "https://juejin.cn" },
    { name: "知乎", url: "https://zhihu.com" },
    { name: "MDN", url: "https://developer.mozilla.org" },
    { name: "V2EX", url: "https://www.v2ex.com" },
  ];

  let bookmarks = loadBookmarks();
  let editingIndex = -1; // -1 表示新增

  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(BM_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [...DEFAULT_BOOKMARKS];
  }

  function saveBookmarks() {
    localStorage.setItem(BM_KEY, JSON.stringify(bookmarks));
  }

  const grid = document.getElementById("grid");

  function faviconUrl(u) {
    try {
      const host = new URL(u).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
    } catch (e) {
      return "";
    }
  }

  function colorFor(name) {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return `hsl(${hash % 360}, 55%, 45%)`;
  }

  function render() {
    grid.innerHTML = "";
    bookmarks.forEach((bm, i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = bm.url;
      a.title = bm.url + "\n（右键/长按可编辑）";

      const icon = document.createElement("img");
      const fav = faviconUrl(bm.url);
      if (fav) {
        icon.src = fav;
        icon.alt = "";
        icon.loading = "lazy";
        icon.onerror = () => icon.replaceWith(makeFallback(bm.name));
      } else {
        icon.replaceWith(makeFallback(bm.name));
      }

      const label = document.createElement("span");
      label.textContent = bm.name;

      a.append(icon, label);
      a.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openDialog(i);
      });
      a.addEventListener("dblclick", (e) => {
        e.preventDefault();
        openDialog(i);
      });
      grid.appendChild(a);
    });
  }

  function makeFallback(name) {
    const div = document.createElement("div");
    div.className = "fallback";
    div.style.background = colorFor(name);
    div.textContent = name.slice(0, 1).toUpperCase();
    return div;
  }

  /* ---------- 编辑弹窗 ---------- */
  const dialog = document.getElementById("edit-dialog");
  const dialogTitle = document.getElementById("dialog-title");
  const nameInput = document.getElementById("bm-name");
  const urlInput = document.getElementById("bm-url");
  const deleteBtn = document.getElementById("bm-delete");

  document.getElementById("add-bookmark").addEventListener("click", () => openDialog(-1));

  function openDialog(index) {
    editingIndex = index;
    if (index >= 0) {
      dialogTitle.textContent = "编辑书签";
      nameInput.value = bookmarks[index].name;
      urlInput.value = bookmarks[index].url;
      deleteBtn.classList.remove("hidden");
    } else {
      dialogTitle.textContent = "添加书签";
      nameInput.value = "";
      urlInput.value = "";
      deleteBtn.classList.add("hidden");
    }
    dialog.showModal();
    nameInput.focus();
  }

  document.getElementById("bm-cancel").addEventListener("click", () => dialog.close());

  deleteBtn.addEventListener("click", () => {
    if (editingIndex >= 0) {
      bookmarks.splice(editingIndex, 1);
      saveBookmarks();
      render();
      dialog.close();
    }
  });

  dialog.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    let name = nameInput.value.trim();
    let url = urlInput.value.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const item = { name, url };
    if (editingIndex >= 0) {
      bookmarks[editingIndex] = item;
    } else {
      bookmarks.push(item);
    }
    saveBookmarks();
    render();
    dialog.close();
  });

  render();
})();
