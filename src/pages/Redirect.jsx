import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function detectDevice(ua) {
  if (/mobile/i.test(ua))  return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export default function Redirect() {
  const { code } = useParams()
  const [error, setError]   = useState(false)
  const [status, setStatus] = useState('מחפש קישור…')

  useEffect(() => {
    async function resolve() {
      // 1. מצא את הקישור לפי קוד
      const { data: link, error: linkErr } = await supabase
        .from('links')
        .select('id, original_url, is_whatsapp, wa_phone, wa_message')
        .eq('short_code', code)
        .single()

      if (linkErr || !link) {
        setError(true)
        return
      }

      // 2. רשום קליק (אנונימי — לא מחכים לתשובה)
      supabase.from('clicks').insert({
        link_id:    link.id,
        user_agent: navigator.userAgent,
        referrer:   document.referrer || null,
        device:     detectDevice(navigator.userAgent),
      }).then(() => {}) // fire and forget

      // 3. בנה URL יעד
      let destination = link.original_url

      if (link.is_whatsapp && link.wa_phone) {
        const phone = link.wa_phone.replace(/\D/g, '')
        const msg   = link.wa_message ? encodeURIComponent(link.wa_message) : ''
        destination = `https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`
      }

      setStatus('מעביר…')
      window.location.replace(destination)
    }

    resolve()
  }, [code])

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-body">
      <svg className="w-16 h-20 opacity-20" viewBox="0 0 28 34" fill="none">
        <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
      </svg>
      <h1 className="text-2xl font-sora font-bold text-ink">Link not found · קישור לא נמצא</h1>
      <p className="text-gray-400 text-sm">This link doesn’t exist or has expired · הקישור לא קיים או פג תוקפו</p>
      <a href="/" className="mt-4 text-drop text-sm font-medium hover:underline">Back to Home · חזרה לדף הבית</a>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <svg className="animate-float w-12 h-14" viewBox="0 0 28 34" fill="none">
        <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
      </svg>
      <p className="text-gray-400 text-sm font-body">{status}</p>
    </div>
  )
}
