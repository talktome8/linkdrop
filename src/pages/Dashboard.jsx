import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import QRModal from '../components/QRModal'
import WAModal from '../components/WAModal'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

function generateCode(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text; document.body.appendChild(el)
    el.select(); document.execCommand('copy')
    document.body.removeChild(el)
  }
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [links, setLinks]         = useState([])
  const [clicks, setClicks]       = useState({})   // { link_id: count }
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newUrl, setNewUrl]       = useState('')
  const [newTitle, setNewTitle]   = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [slugError, setSlugError]   = useState(null)
  const [createdShort, setCreatedShort] = useState(null)
  const [tab, setTab]             = useState('links')  // 'links' | 'whatsapp'
  const [qrLink, setQrLink]       = useState(null)
  const [waModal, setWaModal]     = useState(false)
  const [copiedId, setCopiedId]   = useState(null)
  const [error, setError]         = useState(null)

  useEffect(() => { fetchLinks() }, [user])

  async function fetchLinks() {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    setLinks(data || [])

    // קבל מספר קליקים לכל קישור
    if (data?.length) {
      const ids = data.map(l => l.id)
      const { data: clickData } = await supabase
        .from('clicks')
        .select('link_id')
        .in('link_id', ids)

      const counts = {}
      clickData?.forEach(c => { counts[c.link_id] = (counts[c.link_id] || 0) + 1 })
      setClicks(counts)
    }

    setLoading(false)
  }

  async function checkSlugAvailable(slug) {
    if (!slug) return true
    const { data } = await supabase.from('links').select('id').eq('short_code', slug).maybeSingle()
    return !data
  }

  async function createLink() {
    if (!newUrl.trim()) return
    setCreating(true); setError(null); setSlugError(null); setCreatedShort(null)

    try { new URL(newUrl) } catch {
      setError('URL לא תקין'); setCreating(false); return
    }

    let code
    if (customSlug.trim()) {
      if (!/^[a-zA-Z0-9-]+$/.test(customSlug.trim())) {
        setSlugError('רק אותיות, מספרים ומקפים מותרים'); setCreating(false); return
      }
      const available = await checkSlugAvailable(customSlug.trim())
      if (!available) {
        setSlugError('השם הזה כבר תפוס — נסו אחר'); setCreating(false); return
      }
      code = customSlug.trim()
    } else {
      code = generateCode()
    }

    const { error: insertErr } = await supabase.from('links').insert({
      user_id: user.id,
      original_url: newUrl.trim(),
      short_code: code,
      title: newTitle.trim() || null,
      is_whatsapp: false,
    })

    if (insertErr) {
      if (customSlug.trim()) {
        setSlugError('השם הזה כבר תפוס — נסו אחר'); setCreating(false); return
      }
      code = generateCode(7)
      const { error: err2 } = await supabase.from('links').insert({
        user_id: user.id, original_url: newUrl.trim(),
        short_code: code, title: newTitle.trim() || null, is_whatsapp: false,
      })
      if (err2) { setError('שגיאה — נסו שוב'); setCreating(false); return }
    }

    const shortUrl = `${APP_URL}/${code}`
    setCreatedShort(shortUrl)
    setNewUrl(''); setNewTitle(''); setCustomSlug('')
    fetchLinks()
    setCreating(false)
  }

  async function deleteLink(id) {
    if (!confirm('למחוק את הקישור? הפעולה לא ניתנת לביטול.')) return
    await supabase.from('links').delete().eq('id', id).eq('user_id', user.id)
    fetchLinks()
  }

  async function copy(text, id) {
    await copyToClipboard(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalClicks   = Object.values(clicks).reduce((a, b) => a + b, 0)
  const totalLinks    = links.length
  const regularLinks  = links.filter(l => !l.is_whatsapp)
  const waLinks       = links.filter(l => l.is_whatsapp)

  return (
    <div className="min-h-screen bg-gray-50 font-body" dir="rtl">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-sora font-bold text-lg text-ink">
            <DropLogo />
            Linkdrop
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <button onClick={() => { signOut(); navigate('/') }}
              className="text-sm text-gray-400 hover:text-ink transition">
              יציאה
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats — רק אם יש דאטה */}
        {!loading && totalLinks > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="קישורים" value={totalLinks} />
            <StatCard label="קליקים סה״כ" value={totalClicks} />
            {totalLinks > 0 && totalClicks > 0 && (
              <StatCard label="ממוצע לקישור" value={(totalClicks / totalLinks).toFixed(1)} />
            )}
          </div>
        )}

        {/* Create new */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button onClick={() => setTab('links')}
              className={`text-sm font-semibold pb-1 border-b-2 transition ${tab === 'links' ? 'border-drop text-drop' : 'border-transparent text-gray-400'}`}>
              קיצור קישור
            </button>
            <button onClick={() => { setTab('whatsapp'); setWaModal(true) }}
              className={`text-sm font-semibold pb-1 border-b-2 transition ${tab === 'whatsapp' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>
              קישור WhatsApp
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="שם / תיאור (אופציונלי)"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-drop w-full sm:w-44 transition" />
            <input type="url" value={newUrl} onChange={e => { setNewUrl(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && createLink()}
              placeholder="https://your-long-url.com"
              dir="ltr"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-drop transition" />
            <button onClick={createLink} disabled={creating || !newUrl.trim()}
              className="bg-drop text-white font-sora font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap">
              {creating ? '…' : '+ קצר'}
            </button>
          </div>

          {/* Custom slug field */}
          <div className="mt-3">
            <input type="text" value={customSlug}
              onChange={e => { setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '')); setSlugError(null) }}
              placeholder="שם מותאם אישית (אופציונלי) — אותיות, מספרים ומקפים"
              dir="ltr"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-drop w-full transition" />
            {customSlug && (
              <p dir="ltr" className="text-xs text-gray-400 mt-1">
                תצוגה מקדימה: <span className="font-mono text-drop">linkdrop.raztom.com/{customSlug}</span>
              </p>
            )}
            {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
          </div>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          {/* Created link result */}
          {createdShort && (
            <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p dir="ltr" className="flex-1 text-sm font-mono text-green-700 truncate">{createdShort}</p>
              <button onClick={async () => { await copyToClipboard(createdShort); setCopiedId('created'); setTimeout(() => setCopiedId(null), 2000) }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${copiedId === 'created' ? 'bg-green-500 text-white' : 'bg-white text-green-600 border border-green-200 hover:bg-green-100'}`}>
                {copiedId === 'created' ? '✓ הועתק' : 'העתק'}
              </button>
            </div>
          )}
        </div>

        {/* Links list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-float w-8 h-10" viewBox="0 0 28 34" fill="none">
              <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
            </svg>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <svg className="w-12 h-14 mx-auto mb-4 opacity-20" viewBox="0 0 28 34" fill="none">
              <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
            </svg>
            <p className="font-sora font-semibold text-gray-400">עדיין אין קישורים</p>
            <p className="text-sm mt-1">צרו את הקישור הראשון למעלה</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map(link => {
              const short = `${APP_URL}/${link.short_code}`
              const count = clicks[link.id] || 0
              return (
                <div key={link.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-gray-200 transition animate-fade-up">
                  {/* Drop icon */}
                  <svg className="w-5 h-6 flex-shrink-0" viewBox="0 0 28 34" fill="none">
                    <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z"
                      fill={link.is_whatsapp ? '#25D366' : '#1a6bff'} opacity="0.8"/>
                  </svg>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {link.title && <p className="text-sm font-medium text-ink mb-0.5 truncate">{link.title}</p>}
                    <a href={short} target="_blank" rel="noreferrer"
                      dir="ltr" className="text-drop text-sm font-sora font-semibold hover:underline block truncate">
                      {short}
                    </a>
                    <p dir="ltr" className="text-gray-300 text-xs truncate mt-0.5">{link.original_url}</p>
                  </div>

                  {/* Clicks */}
                  <div className="text-center flex-shrink-0 hidden sm:block">
                    <p className="font-sora font-bold text-lg text-ink">{count}</p>
                    <p className="text-xs text-gray-300">קליקים</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copy(short, link.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition
                        ${copiedId === link.id ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                      {copiedId === link.id ? '✓' : 'העתק'}
                    </button>
                    <button onClick={() => setQrLink(link)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition">
                      QR
                    </button>
                    <button onClick={() => deleteLink(link.id)}
                      className="text-xs px-2 py-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition">
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {qrLink  && <QRModal link={qrLink} appUrl={APP_URL} onClose={() => setQrLink(null)} />}
      {waModal && <WAModal userId={user.id} onClose={() => { setWaModal(false); setTab('links') }} onCreated={() => { fetchLinks(); setWaModal(false); setTab('links') }} />}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
      <p className="font-sora font-bold text-2xl text-ink">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function DropLogo() {
  return (
    <svg width="22" height="26" viewBox="0 0 28 34" fill="none">
      <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
    </svg>
  )
}
