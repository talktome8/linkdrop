import { useState, useEffect } from 'react'

export default function NotFound() {
  const [lang, setLang] = useState('en')

  // Detect preferred language from document direction
  useEffect(() => {
    const dir = document.documentElement.getAttribute('dir')
    if (dir === 'rtl') setLang('he')
  }, [])

  const t = {
    en: {
      title: 'Page not found',
      sub: "The page you're looking for doesn't exist or has been moved.",
      btn: 'Back to Home',
    },
    he: {
      title: 'הדף לא נמצא',
      sub: 'הדף שחיפשתם לא קיים או שהוא הועבר.',
      btn: 'חזרה לדף הבית',
    },
  }

  const tr = t[lang]
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 font-body" dir={dir}>
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-10">
        <svg width={28} height={34} viewBox="0 0 28 34" fill="none">
          <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
          <path d="M9 22C9 22 10.5 27 14 27" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-sora font-bold text-lg text-ink">Linkdrop</span>
      </a>

      {/* 404 badge */}
      <div className="bg-blue-50 text-drop font-sora font-bold text-sm px-4 py-1.5 rounded-full mb-6">
        404
      </div>

      <h1 className="font-sora font-bold text-3xl text-ink mb-3 text-center">{tr.title}</h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">{tr.sub}</p>

      <a href="/"
        className="bg-ink text-white font-sora font-semibold px-8 py-3 rounded-full hover:opacity-80 transition text-sm">
        {tr.btn}
      </a>

      {/* Language toggle */}
      <div className="flex bg-gray-100 rounded-full p-0.5 mt-10">
        {['en', 'he'].map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-xs font-bold font-sora transition
              ${lang === l ? 'bg-white shadow text-ink' : 'text-gray-400 hover:text-gray-600'}`}>
            {l === 'en' ? 'EN' : 'עב'}
          </button>
        ))}
      </div>
    </div>
  )
}
