import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'

function buildWaUrl(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '')
  const cleanMessage = message.trim()
  return `https://wa.me/${cleanPhone}${cleanMessage ? `?text=${encodeURIComponent(cleanMessage)}` : ''}`
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

function normalizeAnalytics(payload) {
  return {
    total_clicks: Number(payload?.total_clicks || 0),
    clicks_today: Number(payload?.clicks_today || 0),
    clicks_7d: Number(payload?.clicks_7d || 0),
    daily: Array.isArray(payload?.daily) ? payload.daily : [],
    devices: Array.isArray(payload?.devices) ? payload.devices : [],
    referrers: Array.isArray(payload?.referrers) ? payload.referrers : [],
    recent: Array.isArray(payload?.recent) ? payload.recent : [],
  }
}

export default function WADetailsModal({ link, appUrl, onClose, onUpdated }) {
  const canvasRef = useRef(null)
  const shortUrl = `${appUrl}/${link.short_code}`

  const [title, setTitle] = useState(link.title || '')
  const [phone, setPhone] = useState(link.wa_phone || '')
  const [message, setMessage] = useState(link.wa_message || '')
  const [analytics, setAnalytics] = useState(() => normalizeAnalytics(null))
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)
  const [error, setError] = useState(null)

  const nextWaUrl = useMemo(() => buildWaUrl(phone, message), [phone, message])
  const maxDailyCount = Math.max(1, ...analytics.daily.map(day => Number(day.clicks || 0)))

  useEffect(() => {
    setTitle(link.title || '')
    setPhone(link.wa_phone || '')
    setMessage(link.wa_message || '')
  }, [link])

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shortUrl, {
        width: 180,
        margin: 2,
        color: { dark: '#0d0d12', light: '#ffffff' },
      })
    }
  }, [shortUrl])

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      setLoadingAnalytics(true)
      const { data, error: rpcError } = await supabase
        .rpc('get_link_analytics', { p_link_id: link.id })
        .maybeSingle()

      if (!cancelled) {
        if (!rpcError && data) {
          setAnalytics(normalizeAnalytics(data))
        } else {
          setAnalytics(normalizeAnalytics(null))
        }
        setLoadingAnalytics(false)
      }
    }

    fetchAnalytics()
    return () => { cancelled = true }
  }, [link.id])

  async function handleCopy(text, key) {
    await copyToClipboard(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  function downloadQr() {
    const canvas = canvasRef.current
    const a = document.createElement('a')
    a.download = `linkdrop-wa-${link.short_code}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  async function save() {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) {
      setError('הכניסו מספר WhatsApp תקין')
      return
    }

    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('links')
      .update({
        title: title.trim() || null,
        original_url: buildWaUrl(cleanPhone, message),
        wa_phone: cleanPhone,
        wa_message: message.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', link.id)

    if (updateError) {
      setError('שמירה נכשלה — נסו שוב')
      setSaving(false)
      return
    }

    await onUpdated?.()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">WhatsApp link</p>
            <h2 className="font-sora text-xl font-bold text-ink">ניהול ואנליטיקס</h2>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-50 hover:text-ink">
            סגור
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-sora font-bold text-ink">פרטי הקישור</h3>
                  <p dir="ltr" className="mt-1 text-xs text-gray-400">{shortUrl}</p>
                </div>
                <button onClick={() => handleCopy(shortUrl, 'short')}
                  className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-600">
                  {copied === 'short' ? 'הועתק' : 'העתק'}
                </button>
              </div>

              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-400">שם / תיאור</span>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-green-400"
                    placeholder="למשל: WhatsApp ללקוחות" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-400">מספר WhatsApp</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-green-400"
                    placeholder="+972501234567" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-400">הודעה אוטומטית</span>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-green-400"
                    placeholder="שלום! אשמח לשמוע פרטים..." />
                </label>
              </div>

              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3">
                <p className="text-xs text-green-600">יעד WhatsApp מעודכן</p>
                <p dir="ltr" className="mt-1 break-all font-mono text-xs text-green-800">{nextWaUrl}</p>
              </div>

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={save} disabled={saving}
                  className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-50">
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button onClick={() => window.open(shortUrl, '_blank', 'noopener,noreferrer')}
                  className="rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100">
                  פתח קישור קצר
                </button>
                <button onClick={() => handleCopy(nextWaUrl, 'wa')}
                  className="rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100">
                  {copied === 'wa' ? 'הועתק' : 'העתק יעד WhatsApp'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sora font-bold text-ink">אנליטיקס</h3>
                {loadingAnalytics && <span className="text-xs text-gray-300">טוען...</span>}
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                <Metric label="סה״כ" value={analytics.total_clicks} />
                <Metric label="היום" value={analytics.clicks_today} />
                <Metric label="7 ימים" value={analytics.clicks_7d} />
              </div>

              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold text-gray-400">קליקים לפי ימים</p>
                <div className="flex h-28 items-end gap-2 rounded-xl bg-gray-50 px-3 py-3">
                  {analytics.daily.length ? analytics.daily.map(day => (
                    <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-green-400" style={{ height: `${Math.max(4, (Number(day.clicks || 0) / maxDailyCount) * 88)}px` }} />
                      <span className="text-[10px] text-gray-300">{String(day.day).slice(5)}</span>
                    </div>
                  )) : (
                    <div className="flex flex-1 items-center justify-center text-xs text-gray-300">אין קליקים עדיין</div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Breakdown title="מכשירים" items={analytics.devices} labelKey="device" empty="אין נתוני מכשירים" />
                <Breakdown title="מקורות" items={analytics.referrers} labelKey="referrer" empty="אין נתוני מקורות" />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-100 p-5 text-center">
              <h3 className="font-sora font-bold text-ink">QR Code</h3>
              <p className="mb-4 mt-1 text-xs text-gray-400">ה-QR נשאר קבוע כי הכתובת הקצרה לא משתנה.</p>
              <canvas ref={canvasRef} className="mx-auto rounded-xl" />
              <button onClick={downloadQr}
                className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-85">
                הורד PNG
              </button>
            </section>

            <section className="rounded-2xl border border-gray-100 p-5">
              <h3 className="mb-3 font-sora font-bold text-ink">קליקים אחרונים</h3>
              <div className="space-y-2">
                {analytics.recent.length ? analytics.recent.map(click => (
                  <div key={click.id} className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs font-semibold text-ink">{click.device || 'unknown'}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{click.referrer || 'Direct'}</p>
                    <p className="mt-0.5 text-[11px] text-gray-300">{new Date(click.clicked_at).toLocaleString('he-IL')}</p>
                  </div>
                )) : (
                  <p className="text-xs text-gray-300">עדיין אין קליקים להצגה.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="font-sora text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function Breakdown({ title, items, labelKey, empty }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-400">{title}</p>
      <div className="space-y-2">
        {items.length ? items.map(item => (
          <div key={item[labelKey] || 'unknown'} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="max-w-[75%] truncate text-xs text-gray-500">{item[labelKey] || 'Direct'}</span>
            <span className="font-sora text-sm font-bold text-ink">{item.clicks}</span>
          </div>
        )) : (
          <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-300">{empty}</p>
        )}
      </div>
    </div>
  )
}
