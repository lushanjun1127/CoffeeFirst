export interface Bookmark {
  name: string
  url: string
}

// Accessing localStorage itself can throw, so acquire it inside the guard.
export function readStorage(key: string): { value: string | null; ok: boolean } {
  try {
    return { value: localStorage.getItem(key), ok: true }
  } catch {
    return { value: null, ok: false }
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function parseEngineIndex(value: string | null, count: number): number {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 && index < count ? index : 0
}

export function looksLikeAddress(value: string): boolean {
  return /^(?:localhost|\[[\da-f:]+\]|[\p{L}\d-]+(?:\.[\p{L}\d-]+)+)(?::\d+)?(?:[/?#]\S*)?$/iu.test(value)
}

export function normalizeHttpUrl(value: string): string | null {
  const text = value.trim()
  if (!text || /\s|[\\\u0000-\u001f\u007f]/u.test(text)) return null
  let address = text
  if (!/^https?:\/\//i.test(text)) {
    // Reject explicit schemes; a bare hostname with a numeric port is allowed.
    if (!looksLikeAddress(text)) return null
    const local = /^(?:localhost|127(?:\.\d+){3}|\[::1\])(?=[:/?#]|$)/i.test(text)
    address = (local ? 'http://' : 'https://') + text
  }
  try {
    const url = new URL(address)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

export function parseBookmarks(raw: string | null, defaults: Bookmark[]): Bookmark[] {
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const result: Bookmark[] = []
        for (const value of parsed) {
          if (typeof value !== 'object' || value === null || !('name' in value) || !('url' in value)) continue
          if (typeof value.name !== 'string' || typeof value.url !== 'string') continue
          const name = value.name.trim()
          // Stored entries must already have an explicitly safe protocol.
          const url = /^https?:\/\//i.test(value.url) ? normalizeHttpUrl(value.url) : null
          if (name && name.length <= 20 && url) result.push({ name, url })
        }
        return result
      }
    } catch { /* Corrupt storage falls back to the supplied defaults. */ }
  }
  return defaults.map((bookmark) => ({ ...bookmark }))
}
