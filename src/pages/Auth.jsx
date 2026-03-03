import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function Auth() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [mode, setMode]       = useState('login')   // 'login' | 'register' | 'magic'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)       // { type: 'ok'|'err', text }

  useEffect(() => { if (user) navigate('/dashboard') }, [user])

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true); setMsg(null)

    let error
    if (mode === 'magic') {
      ;({ error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${APP_URL}/dashboard` }
      }))
      if (!error) setMsg({ type: 'ok', text: `שלחנו קישור לכניסה ל-${email}` })
    } else if (mode === 'register') {
      ;({ error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${APP_URL}/dashboard` }
      }))
      if (!error) setMsg({ type: 'ok', text: 'נשלח אימייל אימות — בדקו את תיבת הדואר' })
    } else {
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
    }

    if (error) setMsg({ type: 'err', text: error.message })
    setLoading(false)
  }

  async function handleOAuth(provider) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${APP_URL}/dashboard` }
    })
    if (error) { setMsg({ type: 'err', text: error.message }); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-body" dir="rtl">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-8 font-sora font-bold text-xl text-ink">
        <svg className="w-6 h-7" viewBox="0 0 28 34" fill="none">
          <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
          <path d="M9 22C9 22 10.5 27 14 27" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Linkdrop
      </a>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-md p-8">
        <h1 className="font-sora font-bold text-2xl text-ink mb-1">
          {mode === 'register' ? 'יצירת חשבון' : 'כניסה'}
        </h1>
        <p className="text-gray-400 text-sm mb-7">
          {mode === 'register' ? 'בחינם לחלוטין, ללא כרטיס אשראי' : 'ברוכים השבים ל-Linkdrop'}
        </p>

        {/* OAuth */}
        <div className="flex flex-col gap-3 mb-6">
          <button onClick={() => handleOAuth('google')} disabled={loading}
            className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <GoogleIcon /> כניסה עם Google
          </button>
          <button onClick={() => handleOAuth('github')} disabled={loading}
            className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <GitHubIcon /> כניסה עם GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-gray-300 text-xs">או עם אימייל</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Tab toggle */}
        <div className="flex bg-gray-50 rounded-xl p-1 mb-5 text-sm">
          {[['login','כניסה'],['register','הרשמה'],['magic','Magic Link']].map(([key, label]) => (
            <button key={key}
              onClick={() => { setMode(key); setMsg(null) }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${mode === key ? 'bg-white shadow-sm text-ink' : 'text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            dir="ltr"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-drop focus:ring-2 focus:ring-blue-50 transition"
          />
          {mode !== 'magic' && (
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="סיסמה"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-drop focus:ring-2 focus:ring-blue-50 transition"
            />
          )}

          {msg && (
            <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="bg-drop text-white rounded-xl py-3 font-sora font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60 mt-1">
            {loading ? '…' : mode === 'magic' ? 'שלח לי קישור לכניסה' : mode === 'register' ? 'צור חשבון' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}
