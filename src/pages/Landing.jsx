import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

// ── Country data ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  {c:'IL',f:'🇮🇱',d:'+972',n:'Israel'},
  {c:'US',f:'🇺🇸',d:'+1',n:'United States'},
  {c:'GB',f:'🇬🇧',d:'+44',n:'United Kingdom'},
  {c:'DE',f:'🇩🇪',d:'+49',n:'Germany'},
  {c:'FR',f:'🇫🇷',d:'+33',n:'France'},
  {c:'IT',f:'🇮🇹',d:'+39',n:'Italy'},
  {c:'ES',f:'🇪🇸',d:'+34',n:'Spain'},
  {c:'NL',f:'🇳🇱',d:'+31',n:'Netherlands'},
  {c:'BE',f:'🇧🇪',d:'+32',n:'Belgium'},
  {c:'CH',f:'🇨🇭',d:'+41',n:'Switzerland'},
  {c:'AT',f:'🇦🇹',d:'+43',n:'Austria'},
  {c:'PL',f:'🇵🇱',d:'+48',n:'Poland'},
  {c:'RU',f:'🇷🇺',d:'+7',n:'Russia'},
  {c:'UA',f:'🇺🇦',d:'+380',n:'Ukraine'},
  {c:'TR',f:'🇹🇷',d:'+90',n:'Turkey'},
  {c:'SA',f:'🇸🇦',d:'+966',n:'Saudi Arabia'},
  {c:'AE',f:'🇦🇪',d:'+971',n:'UAE'},
  {c:'EG',f:'🇪🇬',d:'+20',n:'Egypt'},
  {c:'JO',f:'🇯🇴',d:'+962',n:'Jordan'},
  {c:'LB',f:'🇱🇧',d:'+961',n:'Lebanon'},
  {c:'IN',f:'🇮🇳',d:'+91',n:'India'},
  {c:'CN',f:'🇨🇳',d:'+86',n:'China'},
  {c:'JP',f:'🇯🇵',d:'+81',n:'Japan'},
  {c:'KR',f:'🇰🇷',d:'+82',n:'South Korea'},
  {c:'AU',f:'🇦🇺',d:'+61',n:'Australia'},
  {c:'CA',f:'🇨🇦',d:'+1',n:'Canada'},
  {c:'BR',f:'🇧🇷',d:'+55',n:'Brazil'},
  {c:'MX',f:'🇲🇽',d:'+52',n:'Mexico'},
  {c:'AR',f:'🇦🇷',d:'+54',n:'Argentina'},
  {c:'ZA',f:'🇿🇦',d:'+27',n:'South Africa'},
  {c:'NG',f:'🇳🇬',d:'+234',n:'Nigeria'},
  {c:'PT',f:'🇵🇹',d:'+351',n:'Portugal'},
  {c:'GR',f:'🇬🇷',d:'+30',n:'Greece'},
  {c:'SE',f:'🇸🇪',d:'+46',n:'Sweden'},
  {c:'NO',f:'🇳🇴',d:'+47',n:'Norway'},
  {c:'DK',f:'🇩🇰',d:'+45',n:'Denmark'},
  {c:'FI',f:'🇫🇮',d:'+358',n:'Finland'},
  {c:'SG',f:'🇸🇬',d:'+65',n:'Singapore'},
  {c:'TH',f:'🇹🇭',d:'+66',n:'Thailand'},
  {c:'PH',f:'🇵🇭',d:'+63',n:'Philippines'},
  {c:'ID',f:'🇮🇩',d:'+62',n:'Indonesia'},
  {c:'MY',f:'🇲🇾',d:'+60',n:'Malaysia'},
  {c:'PK',f:'🇵🇰',d:'+92',n:'Pakistan'},
  {c:'BD',f:'🇧🇩',d:'+880',n:'Bangladesh'},
].sort((a,b)=>a.n.localeCompare(b.n))

const TZ_MAP = {'Asia/Jerusalem':'IL','America/New_York':'US','America/Los_Angeles':'US','America/Chicago':'US','Europe/London':'GB','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Rome':'IT','Europe/Madrid':'ES','Europe/Amsterdam':'NL','Europe/Brussels':'BE','Europe/Zurich':'CH','Europe/Vienna':'AT','Europe/Warsaw':'PL','Europe/Moscow':'RU','Europe/Kiev':'UA','Europe/Athens':'GR','Europe/Lisbon':'PT','Europe/Stockholm':'SE','Europe/Oslo':'NO','Europe/Copenhagen':'DK','Europe/Helsinki':'FI','Asia/Istanbul':'TR','Asia/Riyadh':'SA','Asia/Dubai':'AE','Africa/Cairo':'EG','Asia/Amman':'JO','Asia/Beirut':'LB','Asia/Kolkata':'IN','Asia/Shanghai':'CN','Asia/Tokyo':'JP','Asia/Seoul':'KR','Australia/Sydney':'AU','America/Toronto':'CA','America/Sao_Paulo':'BR','America/Mexico_City':'MX','America/Argentina/Buenos_Aires':'AR','Africa/Johannesburg':'ZA','Africa/Lagos':'NG','Asia/Singapore':'SG','Asia/Bangkok':'TH','Asia/Manila':'PH','Asia/Jakarta':'ID','Asia/Kuala_Lumpur':'MY','Asia/Karachi':'PK','Asia/Dhaka':'BD'}

// ── Translations ──────────────────────────────────────────────────────────────
const TR = {
  en: {
    badge: 'Free link shortener + analytics',
    h1a: 'Short links.', h1b: 'Real data.',
    sub: 'Shorten any link, create WhatsApp links, and get full analytics — completely free.',
    urlPh: 'Paste any link here…', dropBtn: 'Drop it',
    customLabel: 'Custom link (optional)',
    customPrefix: `${APP_URL}/`,
    customPh: 'your-name',
    customNote: 'Leave empty for a random short link',
    customTaken: 'This name is already taken — try another',
    customInvalid: 'Only letters, numbers and hyphens',
    copy: 'Copy', copied: '✓ Copied',
    yourLink: 'Your link is ready',
    hintA: 'Create a free account', hintB: ' to track your links and see analytics.',
    or: 'or create a WhatsApp link',
    waLbl: 'WhatsApp Link', waPill: 'Instant',
    waNumPh: '50 123 4567',
    waMsgPh: 'Pre-written message (optional)…',
    waGenBtn: 'Create & Copy WhatsApp Link',
    waCopied: '✓ Link copied to clipboard!',
    navLogin: 'Login', navSignup: 'Sign up free', dashboard: 'Dashboard',
    prevLbl: 'Live Preview',
    prevNote: 'Type your number and message — preview updates live.',
    typeLabel: 'Message', online: 'online',
    emptyChat: 'Enter a phone number\nto preview',
    qrH: 'Need a QR Code?',
    qrP: 'Generate a custom QR code for any link — free, no login needed.',
    qrBtn: 'Open QR Generator →',
    ctaH: 'Ready to start?', ctaP: 'No credit card required.',
    ctaBtn: 'Create free account',
    privacy: 'Privacy', terms: 'Terms',
    rights: '© 2026 Linkdrop. All rights reserved.',
    invalidUrl: 'Invalid URL — make sure it starts with https://',
    errGeneric: 'Something went wrong — please try again',
    copyShortLink: 'Copy short link',
    copyWaLink: 'Copy WA link',
    redirectsTo: 'This link redirects to',
    analyticsNudge: 'Want to see clicks and analytics? Create a free account →',
  },
  he: {
    badge: 'קיצור קישורים + אנליטיקס — בחינם',
    h1a: 'קישורים קצרים.', h1b: 'דאטה אמיתי.',
    sub: 'קצרו כל קישור, צרו קישורי WhatsApp, וקבלו אנליטיקס מלא — בחינם לגמרי.',
    urlPh: 'הדביקו קישור — כל קישור, כל אתר', dropBtn: 'Drop it',
    customLabel: 'קישור מותאם אישית (אופציונלי)',
    customPrefix: `${APP_URL}/`,
    customPh: 'השם-שלך',
    customNote: 'השאירו ריק לקישור אקראי',
    customTaken: 'השם הזה כבר תפוס — נסו אחר',
    customInvalid: 'רק אותיות, מספרים ומקפים',
    copy: 'העתק', copied: '✓ הועתק',
    yourLink: 'הקישור שלכם מוכן',
    hintA: 'צרו חשבון חינמי', hintB: ' כדי לעקוב ולראות אנליטיקס.',
    or: 'או צרו קישור WhatsApp',
    waLbl: 'קישור WhatsApp', waPill: 'מיידי',
    waNumPh: '50 123 4567',
    waMsgPh: 'הודעה אוטומטית (אופציונלי)…',
    waGenBtn: 'צור והעתק קישור WhatsApp',
    waCopied: '✓ הקישור הועתק!',
    navLogin: 'כניסה', navSignup: 'הרשמה חינם', dashboard: 'דשבורד',
    prevLbl: 'תצוגה חיה',
    prevNote: 'הקלידו מספר והודעה — התצוגה מתעדכנת בזמן אמת.',
    typeLabel: 'הודעה', online: 'מחובר',
    emptyChat: 'הכניסו מספר טלפון\nלתצוגה מקדימה',
    qrH: 'צריכים QR Code?',
    qrP: 'צרו QR Code לכל קישור — בחינם, ללא הרשמה.',
    qrBtn: 'פתח יוצר QR →',
    ctaH: 'מוכנים להתחיל?', ctaP: 'ללא כרטיס אשראי.',
    ctaBtn: 'יצירת חשבון חינמי',
    privacy: 'פרטיות', terms: 'תנאי שימוש',
    rights: '© 2026 Linkdrop. כל הזכויות שמורות.',
    invalidUrl: 'URL לא תקין — ודאו שמתחיל ב-https://',
    errGeneric: 'שגיאה — נסו שוב',
    copyShortLink: 'העתק קישור קצר',
    copyWaLink: 'העתק קישור WA',
    redirectsTo: 'הקישור מפנה אל',
    analyticsNudge: 'רוצים לראות קליקים ואנליטיקס? צרו חשבון חינמי ←',
  }
}

function generateCode(len = 6) {
  return Array.from({ length: len }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [lang, setLang] = useState('en')
  const t   = TR[lang]
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  // URL shortener state
  const [url, setUrl]           = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [slugError, setSlugError]   = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [urlError, setUrlError] = useState('')

  // WhatsApp state
  const [country, setCountry]   = useState(COUNTRIES.find(c => c.c === 'IL'))
  const [waPhone, setWaPhone]   = useState('')
  const [waMsg, setWaMsg]       = useState('')
  const [waCopied, setWaCopied] = useState(false)
  const [ddOpen, setDdOpen]     = useState(false)
  const [ddSearch, setDdSearch] = useState('')
  const ddRef = useRef(null)

  // WhatsApp custom slug + result state
  const [waCustomSlug, setWaCustomSlug] = useState('')
  const [waSlugError, setWaSlugError] = useState('')
  const [waResult, setWaResult] = useState(null)
  const [waShortCopied, setWaShortCopied] = useState(false)

  // Detect country from timezone
  useEffect(() => {
    try {
      const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone
      const code = TZ_MAP[tz]
      if (code) {
        const found = COUNTRIES.find(c => c.c === code)
        if (found) setCountry(found)
      }
    } catch (e) {}
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredCountries = COUNTRIES.filter(c =>
    !ddSearch || c.n.toLowerCase().includes(ddSearch.toLowerCase()) || c.d.includes(ddSearch)
  )

  // ── Shorten URL ────────────────────────────────────────────────────────────
  async function shorten() {
    if (!url.trim()) return
    setLoading(true); setUrlError(''); setSlugError(''); setResult(null)

    try { new URL(url) } catch {
      setUrlError(t.invalidUrl); setLoading(false); return
    }

    // Validate custom slug
    const slug = customSlug.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      setSlugError(t.customInvalid); setLoading(false); return
    }

    const short_code = slug || generateCode()

    // Check if custom slug already taken
    if (slug) {
      const { data: existing } = await supabase
        .from('links').select('id').eq('short_code', slug).single()
      if (existing) {
        setSlugError(t.customTaken); setLoading(false); return
      }
    }

    const { data, error } = await supabase
      .from('links')
      .insert({ original_url: url.trim(), short_code, user_id: user?.id ?? null, is_whatsapp: false })
      .select().single()

    if (error) {
      // Slug collision fallback
      if (slug) { setSlugError(t.customTaken); setLoading(false); return }
      const { data: d2, error: e2 } = await supabase
        .from('links')
        .insert({ original_url: url.trim(), short_code: generateCode(7), user_id: user?.id ?? null, is_whatsapp: false })
        .select().single()
      if (e2) { setUrlError(t.errGeneric); setLoading(false); return }
      setResult(d2)
    } else {
      setResult(data)
    }
    setLoading(false)
  }

  async function copyShort() {
    const text = `${APP_URL}/${result.short_code}`
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  async function genWA() {
    if (!waPhone.trim()) return
    setWaSlugError(''); setWaResult(null); setWaCopied(false); setWaShortCopied(false)

    const dial  = country.d.replace('+', '')
    const clean = waPhone.replace(/\D/g, '')
    const msg   = waMsg.trim()
    const waUrl = `https://wa.me/${dial}${clean}${msg ? '?text=' + encodeURIComponent(msg) : ''}`

    // Validate custom slug
    const slug = waCustomSlug.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      setWaSlugError(t.customInvalid); return
    }

    const short_code = slug || generateCode()

    // Check if custom slug already taken
    if (slug) {
      const { data: existing } = await supabase
        .from('links').select('id').eq('short_code', slug).single()
      if (existing) { setWaSlugError(t.customTaken); return }
    }

    const { data, error } = await supabase.from('links').insert({
      user_id: user?.id ?? null, original_url: waUrl,
      short_code, is_whatsapp: true,
      wa_phone: dial + clean, wa_message: msg || null,
    }).select().single()

    let resultData = null
    if (error) {
      if (slug) { setWaSlugError(t.customTaken); return }
      const { data: d2, error: e2 } = await supabase.from('links').insert({
        user_id: user?.id ?? null, original_url: waUrl,
        short_code: generateCode(7), is_whatsapp: true,
        wa_phone: dial + clean, wa_message: msg || null,
      }).select().single()
      if (e2) return
      resultData = d2
    } else {
      resultData = data
    }
    setWaResult(resultData)

    // Auto-copy WA URL
    try { await navigator.clipboard.writeText(waUrl) } catch {
      const el = document.createElement('textarea')
      el.value = waUrl; document.body.appendChild(el)
      el.select(); document.execCommand('copy')
      document.body.removeChild(el)
    }
    setWaCopied(true)
    setTimeout(() => setWaCopied(false), 3000)
  }

  async function copyWaShort() {
    const text = `${APP_URL}/${waResult.short_code}`
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea')
      el.value = text; document.body.appendChild(el)
      el.select(); document.execCommand('copy')
      document.body.removeChild(el)
    }
    setWaShortCopied(true)
    setTimeout(() => setWaShortCopied(false), 2200)
  }

  async function copyWaFull() {
    const text = waResult.original_url
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea')
      el.value = text; document.body.appendChild(el)
      el.select(); document.execCommand('copy')
      document.body.removeChild(el)
    }
    setWaCopied(true)
    setTimeout(() => setWaCopied(false), 2200)
  }

  // ── Phone preview ──────────────────────────────────────────────────────────
  const previewMsg  = waMsg.trim() || (lang === 'en' ? 'Hello! 👋' : 'שלום! 👋')
  const previewName = waPhone.trim()
    ? `${country.d} ${waPhone}`
    : `${country.d}…`
  const showBubble  = !!waPhone.trim()

  const shortUrl = result ? `${APP_URL}/${result.short_code}` : ''

  // Slug preview (show while typing)
  const slugPreview = customSlug.trim()
    ? `${APP_URL}/${customSlug.trim().toLowerCase().replace(/\s+/g,'-')}`
    : ''

  const waSlugPreview = waCustomSlug.trim()
    ? `${APP_URL}/${waCustomSlug.trim().toLowerCase().replace(/\s+/g,'-')}`
    : ''
  const waShortUrl = waResult ? `${APP_URL}/${waResult.short_code}` : ''

  return (
    <div className="min-h-screen bg-white font-body" dir={dir}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-sora font-bold text-lg text-ink">
            <DropSVG size={22} /> Linkdrop
          </a>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex bg-gray-100 rounded-full p-0.5">
              {['en','he'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-full text-xs font-bold font-sora transition
                    ${lang === l ? 'bg-white shadow text-ink' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l === 'en' ? 'EN' : 'עב'}
                </button>
              ))}
            </div>
            {user ? (
              <button onClick={() => navigate('/dashboard')}
                className="bg-ink text-white text-sm font-sora font-semibold px-5 py-2 rounded-full hover:opacity-80 transition">
                {t.dashboard}
              </button>
            ) : (
              <>
                <a href="/auth" className="text-sm text-gray-500 hover:text-ink transition">{t.navLogin}</a>
                <a href="/auth" className="bg-ink text-white text-sm font-sora font-semibold px-5 py-2 rounded-full hover:opacity-80 transition">
                  {t.navSignup}
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO — two columns ── */}
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-drop text-xs font-sora font-semibold px-3 py-1.5 rounded-full mb-5">
            💧 {t.badge}
          </div>

          <h1 className="font-sora font-bold text-5xl leading-tight tracking-tight text-ink mb-4">
            {t.h1a}<br /><span className="text-drop">{t.h1b}</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">{t.sub}</p>

          {/* ── URL Shortener ── */}
          <div className={`flex items-center bg-white border-2 rounded-2xl px-4 py-2 gap-3 shadow-lg shadow-blue-50 transition-all mb-2
            ${urlError ? 'border-red-300' : 'border-gray-100 focus-within:border-drop focus-within:shadow-blue-100'}`}>
            <input type="url" value={url}
              onChange={e => { setUrl(e.target.value); setUrlError('') }}
              onKeyDown={e => e.key === 'Enter' && shorten()}
              placeholder={t.urlPh} dir="ltr"
              className="flex-1 outline-none text-sm py-2 bg-transparent text-ink placeholder-gray-300" />
            <button onClick={shorten} disabled={loading || !url.trim()}
              className="bg-drop text-white font-sora font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 whitespace-nowrap flex-shrink-0">
              {loading ? '…' : t.dropBtn}
            </button>
          </div>

          {urlError && <p className="text-red-500 text-xs mb-2">{urlError}</p>}

          {/* Custom slug */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">{t.customLabel}</label>
            <div className={`flex items-center bg-white border-2 rounded-xl px-3 py-2 gap-1 transition
              ${slugError ? 'border-red-300' : 'border-gray-100 focus-within:border-drop'}`}>
              <span className="text-xs text-gray-400 font-mono whitespace-nowrap flex-shrink-0" dir="ltr">
                {APP_URL}/
              </span>
              <input type="text" value={customSlug}
                onChange={e => { setCustomSlug(e.target.value); setSlugError('') }}
                placeholder={t.customPh} dir="ltr"
                className="flex-1 outline-none text-sm bg-transparent text-ink font-mono placeholder-gray-300 min-w-0" />
            </div>
            {slugError
              ? <p className="text-red-500 text-xs mt-1">{slugError}</p>
              : slugPreview
                ? <p className="text-xs text-drop mt-1 font-mono" dir="ltr">{slugPreview}</p>
                : <p className="text-xs text-gray-300 mt-1">{t.customNote}</p>
            }
          </div>

          {/* Result */}
          {result && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-3 animate-fade-up">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t.yourLink}</p>
                  <a href={shortUrl} target="_blank" rel="noreferrer" dir="ltr"
                    className="font-sora font-semibold text-drop hover:underline text-sm break-all">
                    {shortUrl}
                  </a>
                </div>
                <button onClick={copyShort}
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition
                    ${copied ? 'bg-green-500 text-white' : 'bg-drop text-white hover:bg-blue-700'}`}>
                  {copied ? t.copied : t.copyShortLink}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2" dir="ltr">
                {t.redirectsTo} <span className="break-all">{result.original_url}</span>
              </p>
            </div>
          )}

          {result && !user && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-3 animate-fade-up">
              <a href="/auth" className="text-sm text-amber-700 font-semibold hover:underline">
                {t.analyticsNudge}
              </a>
            </div>
          )}

          {/* OR */}
          <div className="flex items-center gap-3 my-5 text-gray-300 text-xs">
            <div className="flex-1 h-px bg-gray-100" />
            <span>{t.or}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* ── WhatsApp ── */}
          <div className="flex items-center gap-2 mb-3">
            <DropSVG size={14} color="#25D366" />
            <span className="font-sora font-bold text-xs uppercase tracking-wider text-gray-400">{t.waLbl}</span>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{t.waPill}</span>
          </div>

          {/* Phone row */}
          <div className="flex border-2 border-gray-100 rounded-2xl overflow-visible mb-2 focus-within:border-green-400 focus-within:shadow-sm transition relative"
            ref={ddRef}>
            {/* Country selector */}
            <button type="button"
              onClick={() => { setDdOpen(!ddOpen); setDdSearch('') }}
              className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-100 min-w-[80px] flex-shrink-0 rounded-l-xl hover:bg-gray-100 transition">
              <span className="text-lg">{country.f}</span>
              <span className="text-sm font-sora font-semibold text-ink">{country.d}</span>
              <span className="text-gray-300 text-xs">▼</span>
            </button>

            <input type="tel" value={waPhone}
              onChange={e => setWaPhone(e.target.value)}
              placeholder={t.waNumPh} dir="ltr"
              className="flex-1 outline-none px-3 py-3 text-sm text-ink bg-transparent placeholder-gray-300 min-w-0" />

            {/* Dropdown */}
            {ddOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-up">
                <div className="p-2 border-b border-gray-50">
                  <input type="text" value={ddSearch}
                    onChange={e => setDdSearch(e.target.value)}
                    placeholder="Search…" autoFocus
                    className="w-full outline-none text-sm px-3 py-1.5 bg-gray-50 rounded-lg text-ink" />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button key={c.c} type="button"
                      onClick={() => { setCountry(c); setDdOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition
                        ${c.c === country.c ? 'bg-blue-50' : ''}`}>
                      <span className="text-base">{c.f}</span>
                      <span className="text-sm text-ink flex-1">{c.n}</span>
                      <span className="text-xs font-sora font-semibold text-gray-400">{c.d}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea value={waMsg} onChange={e => setWaMsg(e.target.value)}
            placeholder={t.waMsgPh} rows={2}
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition resize-none text-ink placeholder-gray-300 mb-2" />

          {/* WA Custom slug */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">{t.customLabel}</label>
            <div className={`flex items-center bg-white border-2 rounded-xl px-3 py-2 gap-1 transition
              ${waSlugError ? 'border-red-300' : 'border-gray-100 focus-within:border-green-400'}`}>
              <span className="text-xs text-gray-400 font-mono whitespace-nowrap flex-shrink-0" dir="ltr">
                {APP_URL}/
              </span>
              <input type="text" value={waCustomSlug}
                onChange={e => { setWaCustomSlug(e.target.value); setWaSlugError('') }}
                placeholder={t.customPh} dir="ltr"
                className="flex-1 outline-none text-sm bg-transparent text-ink font-mono placeholder-gray-300 min-w-0" />
            </div>
            {waSlugError
              ? <p className="text-red-500 text-xs mt-1">{waSlugError}</p>
              : waSlugPreview
                ? <p className="text-xs text-green-600 mt-1 font-mono" dir="ltr">{waSlugPreview}</p>
                : <p className="text-xs text-gray-300 mt-1">{t.customNote}</p>
            }
          </div>

          <button onClick={genWA} disabled={!waPhone.trim()}
            className="w-full bg-green-500 text-white font-sora font-bold text-sm py-3.5 rounded-2xl hover:bg-green-600 active:scale-95 transition disabled:opacity-40 flex items-center justify-center gap-2">
            <WAIcon />
            {t.waGenBtn}
          </button>

          {/* WA Result */}
          {waResult && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mt-2 animate-fade-up">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t.yourLink}</p>
                  <a href={waShortUrl} target="_blank" rel="noreferrer" dir="ltr"
                    className="font-sora font-semibold text-green-700 hover:underline text-sm break-all">
                    {waShortUrl}
                  </a>
                </div>
                <button onClick={copyWaShort}
                  className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition
                    ${waShortCopied ? 'bg-green-700 text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                  {waShortCopied ? t.copied : t.copyShortLink}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyWaFull}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition
                    ${waCopied ? 'bg-green-700 text-white' : 'bg-white text-green-700 border border-green-200 hover:bg-green-100'}`}>
                  {waCopied ? t.copied : t.copyWaLink}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2" dir="ltr">
                {t.redirectsTo} <span className="break-all">{waResult.original_url}</span>
              </p>
            </div>
          )}

          {waResult && !user && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mt-2 animate-fade-up">
              <a href="/auth" className="text-sm text-amber-700 font-semibold hover:underline">
                {t.analyticsNudge}
              </a>
            </div>
          )}
        </div>

        {/* RIGHT — live phone */}
        <div className="hidden lg:flex flex-col items-center gap-3">
          <p className="text-xs font-sora font-bold uppercase tracking-widest text-gray-300">{t.prevLbl}</p>

          {/* Phone shell */}
          <div className="w-60 h-[500px] bg-gray-900 rounded-[44px] p-2.5 shadow-2xl shadow-gray-900/40"
            style={{boxShadow:'0 32px 80px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.07)'}}>
            <div className="w-full h-full rounded-[34px] overflow-hidden flex flex-col bg-white">
              {/* Status bar */}
              <div className="bg-gray-900 h-8 flex items-center justify-between px-5 flex-shrink-0">
                <span className="text-white text-[11px] font-sora font-semibold">9:41</span>
                <div className="flex gap-1 text-white text-[8px] tracking-wider">▲▲▲ WiFi ▮</div>
              </div>
              {/* WA header */}
              <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2 flex-shrink-0">
                <span className="text-white/70 text-xl leading-none">‹</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-base flex-shrink-0">👤</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[12px] font-sora font-semibold truncate">{previewName}</p>
                  <p className="text-white/60 text-[10px] mt-px">{t.online}</p>
                </div>
                <div className="flex gap-3 text-white/70 text-base">📹 📞</div>
              </div>
              {/* Chat */}
              <div className="flex-1 relative overflow-hidden flex flex-col justify-end">
                <div className="absolute inset-0 bg-[#e5ddd5]"
                  style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8bdb0' fill-opacity='0.25'%3E%3Cpath d='M32 30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-26V0h-2v4h-4v2h4v4h2V6h4V4h-4zM4 30v-4H2v4H-2v2h4v4h2v-4h4v-2H4zM4 4V0H2v4H-2v2h4v4h2V6h4V4H4z'/%3E%3C/g%3E%3C/svg%3E\")"}} />
                <div className="relative z-10 p-3 flex flex-col justify-end gap-1">
                  {showBubble ? (
                    <div className="bg-[#dcf8c6] rounded-xl rounded-br-sm px-3 py-2 max-w-[88%] self-end shadow-sm">
                      <p className="text-[11px] text-gray-900 leading-snug break-words whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{__html: escHtml(previewMsg)}} />
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] text-gray-400">12:00</span>
                        <span className="text-[9px] text-blue-400">✓✓</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-black/30 text-center py-6 whitespace-pre-line">{t.emptyChat}</p>
                  )}
                </div>
              </div>
              {/* Type bar */}
              <div className="bg-gray-100 border-t border-gray-200 px-2 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5">
                  <span className="text-[10px] text-gray-300">{t.typeLabel}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">➤</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-300 text-center max-w-[200px] leading-relaxed">{t.prevNote}</p>
        </div>
      </div>

      {/* ── QR Banner ── */}
      <div className="max-w-6xl mx-auto px-6 pb-14">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-7 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <DropSVG size={36} color="#f59e0b" />
            <div>
              <h3 className="font-sora font-bold text-ink text-base mb-0.5">{t.qrH}</h3>
              <p className="text-gray-400 text-sm">{t.qrP}</p>
            </div>
          </div>
          <a href="https://qr-it.raztom.com" target="_blank" rel="noreferrer"
            className="bg-amber-500 text-white font-sora font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-amber-600 transition whitespace-nowrap flex-shrink-0">
            {t.qrBtn}
          </a>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="text-center py-16 px-6">
        <h2 className="font-sora font-bold text-3xl text-ink mb-3">{t.ctaH}</h2>
        <p className="text-gray-400 mb-7">{t.ctaP}</p>
        <a href="/auth"
          className="inline-block bg-ink text-white font-sora font-semibold px-10 py-4 rounded-full hover:opacity-80 transition text-sm">
          {t.ctaBtn}
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-300 flex-wrap gap-3">
          <a href="/" className="flex items-center gap-2 font-sora font-semibold text-ink">
            <DropSVG size={18} /> Linkdrop
          </a>
          <span>{t.rights}</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-ink transition">{t.privacy}</a>
            <a href="#" className="hover:text-ink transition">{t.terms}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DropSVG({ size = 24, color = '#1a6bff' }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 28 34" fill="none" flexShrink={0}>
      <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill={color}/>
      <path d="M9 22C9 22 10.5 27 14 27" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function WAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity=".9">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.845L.057 23.5l5.799-1.522A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.852 0-3.587-.5-5.082-1.373l-.364-.215-3.44.902.918-3.352-.236-.38A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}
