import { useState, useRef } from 'react'
import {
  ArrowLeft, ArrowRight, RotateCw, Home,
  Bookmark, X, ExternalLink, Globe, Download, ChevronDown,
} from 'lucide-react'

const HOME_URL = 'https://www.google.com'

const DEFAULT_BOOKMARKS = [
  { label: 'Google',    url: 'https://www.google.com' },
  { label: 'YouTube',   url: 'https://www.youtube.com' },
  { label: 'GitHub',    url: 'https://github.com' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
]

function normalizeUrl(input) {
  const t = input.trim()
  if (!t) return HOME_URL
  if (/^https?:\/\//i.test(t)) return t
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(t) && !t.includes(' ')) return `https://${t}`
  return `https://www.google.com/search?q=${encodeURIComponent(t)}`
}

export default function Browser() {
  const [nav, setNav]           = useState({ pages: [HOME_URL], cursor: 0 })
  const [urlInput, setUrlInput] = useState(HOME_URL)
  const [loading, setLoading]   = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('th_bookmarks')) || DEFAULT_BOOKMARKS }
    catch { return DEFAULT_BOOKMARKS }
  })
  const iframeRef = useRef(null)

  const currentUrl   = nav.pages[nav.cursor]
  const canGoBack    = nav.cursor > 0
  const canGoForward = nav.cursor < nav.pages.length - 1

  const resetPageState = () => setLoading(true)

  const go = (url) => {
    const normalized = normalizeUrl(url)
    setNav(prev => ({
      pages: [...prev.pages.slice(0, prev.cursor + 1), normalized],
      cursor: prev.cursor + 1,
    }))
    setUrlInput(normalized)
    resetPageState()
  }

  const goBack = () => {
    if (!canGoBack) return
    const c = nav.cursor - 1
    setNav(prev => ({ ...prev, cursor: c }))
    setUrlInput(nav.pages[c])
    resetPageState()
  }

  const goForward = () => {
    if (!canGoForward) return
    const c = nav.cursor + 1
    setNav(prev => ({ ...prev, cursor: c }))
    setUrlInput(nav.pages[c])
    resetPageState()
  }

  const refresh = () => { setIframeKey(k => k + 1); resetPageState() }

  const handleSubmit = (e) => { e.preventDefault(); go(urlInput) }

  const handleIframeLoad = () => setLoading(false)

  const saveBookmark = () => {
    try {
      const hostname = new URL(currentUrl).hostname.replace('www.', '')
      if (bookmarks.some(b => b.url === currentUrl)) return
      const updated = [...bookmarks, { label: hostname, url: currentUrl }]
      setBookmarks(updated)
      localStorage.setItem('th_bookmarks', JSON.stringify(updated))
    } catch {}
  }

  const removeBookmark = (i) => {
    const updated = bookmarks.filter((_, idx) => idx !== i)
    setBookmarks(updated)
    localStorage.setItem('th_bookmarks', JSON.stringify(updated))
  }

  const isBookmarked = bookmarks.some(b => b.url === currentUrl)
  let hostname = currentUrl
  try { hostname = new URL(currentUrl).hostname } catch {}

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border border-white/5"
      style={{ height: 'calc(100vh - 112px)' }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={goBack} disabled={!canGoBack} title="Back"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ArrowLeft size={16} />
        </button>
        <button onClick={goForward} disabled={!canGoForward} title="Forward"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ArrowRight size={16} />
        </button>
        <button onClick={refresh} title="Refresh"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
          <RotateCw size={15} className={loading ? 'animate-spin text-primary-400' : ''} />
        </button>
        <button onClick={() => go(HOME_URL)} title="Home"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
          <Home size={16} />
        </button>

        {/* URL bar */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Globe size={13} className="text-slate-600 shrink-0" />
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onFocus={e => e.target.select()}
            className="flex-1 bg-transparent text-sm text-slate-300 outline-none placeholder-slate-600"
            placeholder="Search Google or enter a URL..."
            spellCheck={false}
            autoComplete="off"
          />
        </form>

        <button onClick={saveBookmark}
          title={isBookmarked ? 'Already bookmarked' : 'Bookmark this page'}
          className={`p-1.5 rounded-lg transition-colors hover:bg-white/10 ${isBookmarked ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}>
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        <a href={currentUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab"
          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/10 transition-colors">
          <ExternalLink size={16} />
        </a>
      </div>

      {/* ── Bookmarks bar ── */}
      {bookmarks.length > 0 && (
        <div
          className="flex items-center gap-0.5 px-3 py-1 overflow-x-auto shrink-0"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {bookmarks.map((bm, i) => (
            <div key={i} className="flex items-center group shrink-0">
              <button onClick={() => go(bm.url)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-white/10 transition-colors max-w-[120px] truncate">
                {bm.label}
              </button>
              <button onClick={() => removeBookmark(i)}
                className="hidden group-hover:flex items-center justify-center w-4 h-4 text-slate-600 hover:text-red-400 rounded transition-colors mr-1">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── iframe area ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            style={{ background: '#0a0a14' }}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading…</p>
            </div>
          </div>
        )}

        <iframe
          key={`${iframeKey}__${currentUrl}`}
          ref={iframeRef}
          src={currentUrl}
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-downloads allow-modals"
          className="w-full h-full border-0"
          title="Embedded Browser"
        />
      </div>

      {/* ── Status / extension bar ── */}
      <div
        className="shrink-0"
        style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* Collapsible extension help panel */}
        {showHelp && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-xs font-semibold text-purple-400 mb-2">
              ⚡ Site not loading? Install the TaskHolder Browser Extension
            </p>
            <a
              href="/taskholder-browser-extension.zip"
              download="taskholder-browser-extension.zip"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold text-white mb-3 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Download size={12} />
              Download Extension (.zip)
            </a>
            <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
              <li>Go to <span className="text-slate-300">chrome://extensions</span> → enable <span className="text-slate-300">Developer mode</span></li>
              <li>Click <span className="text-slate-300">Load unpacked</span> → select the extracted folder</li>
              <li>Click <span className="text-slate-300">Details</span> → <span className="text-slate-300">Site access</span> → <span className="text-slate-300">On all sites</span></li>
              <li>Press the <span className="text-slate-300">Refresh ↺</span> button in the toolbar above</li>
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 px-3 py-1">
          <p className="text-xs text-slate-700 truncate">{hostname}</p>
          <button
            onClick={() => setShowHelp(h => !h)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-purple-400 transition-colors shrink-0"
          >
            <Download size={11} />
            Get Extension
            <ChevronDown size={11} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
