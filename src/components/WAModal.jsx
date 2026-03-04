import { useState } from 'react'
import { supabase } from '../lib/supabase'

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

export default function WAModal({ userId, onClose, onCreated }) {
  const [phone, setPhone]     = useState('')
  const [message, setMessage] = useState('')
  const [title, setTitle]     = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [slugError, setSlugError]   = useState(null)
  const [createdShort, setCreatedShort] = useState(null)
  const [copied, setCopied]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function create() {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) { setError('הכניסו מספר טלפון'); return }

    setLoading(true); setError(null); setSlugError(null); setCreatedShort(null)

    let code
    if (customSlug.trim()) {
      if (!/^[a-zA-Z0-9-]+$/.test(customSlug.trim())) {
        setSlugError('רק אותיות, מספרים ומקפים מותרים'); setLoading(false); return
      }
      const { data } = await supabase.from('links').select('id').eq('short_code', customSlug.trim()).maybeSingle()
      if (data) {
        setSlugError('השם הזה כבר תפוס — נסו אחר'); setLoading(false); return
      }
      code = customSlug.trim()
    } else {
      code = generateCode()
    }

    const waUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`

    const { error: err } = await supabase.from('links').insert({
      user_id:      userId,
      original_url: waUrl,
      short_code:   code,
      title:        title.trim() || null,
      is_whatsapp:  true,
      wa_phone:     cleanPhone,
      wa_message:   message.trim() || null,
    })

    if (err) {
      if (customSlug.trim()) {
        setSlugError('השם הזה כבר תפוס — נסו אחר'); setLoading(false); return
      }
      setError('שגיאה — נסו שוב'); setLoading(false); return
    }

    setCreatedShort(`${APP_URL}/${code}`)
    onCreated()
  }

  const preview = phone.replace(/\D/g, '')
    ? `wa.me/${phone.replace(/\D/g, '')}${message ? '?text=…' : ''}`
    : ''

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-7 h-8" viewBox="0 0 28 34" fill="none">
            <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#25D366"/>
          </svg>
          <h2 className="font-sora font-bold text-ink">קישור WhatsApp</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">מספר טלפון (עם קידומת מדינה)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+972501234567"
              dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">הודעה אוטומטית (אופציונלי)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="שלום! אשמח לשמוע פרטים…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition resize-none" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">שם לקישור (אופציונלי)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="למשל: WhatsApp לקשר עם לקוחות"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">שם מותאם אישית (אופציונלי) — אותיות, מספרים ומקפים</label>
            <input type="text" value={customSlug}
              onChange={e => { setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '')); setSlugError(null) }}
              placeholder="my-link"
              dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition" />
            {customSlug && (
              <p dir="ltr" className="text-xs text-gray-400 mt-1">
                תצוגה מקדימה: <span className="font-mono text-green-600">linkdrop.raztom.com/{customSlug}</span>
              </p>
            )}
            {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
          </div>

          {preview && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-xs text-green-600 mb-0.5">תצוגה מקדימה של ה-URL</p>
              <p dir="ltr" className="text-xs font-mono text-green-700 break-all">{preview}</p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {/* Created link result */}
          {createdShort && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p dir="ltr" className="flex-1 text-sm font-mono text-green-700 truncate">{createdShort}</p>
              <button onClick={async () => { await copyToClipboard(createdShort); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${copied ? 'bg-green-500 text-white' : 'bg-white text-green-600 border border-green-200 hover:bg-green-100'}`}>
                {copied ? '✓ הועתק' : 'העתק'}
              </button>
            </div>
          )}

          <button onClick={create} disabled={loading || !phone}
            className="bg-green-500 text-white font-sora font-semibold text-sm py-3 rounded-xl hover:bg-green-600 transition disabled:opacity-50 mt-1">
            {loading ? '…' : 'צור קישור'}
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-ink transition">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
