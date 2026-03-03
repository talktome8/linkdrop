import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRModal({ link, appUrl, onClose }) {
  const canvasRef = useRef(null)
  const shortUrl  = `${appUrl}/${link.short_code}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shortUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0d0d12', light: '#ffffff' },
      })
    }
  }, [shortUrl])

  function download() {
    const canvas = canvasRef.current
    const a = document.createElement('a')
    a.download = `linkdrop-${link.short_code}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h2 className="font-sora font-bold text-ink mb-1">QR Code</h2>
        <p dir="ltr" className="text-xs text-gray-400 mb-5 truncate">{shortUrl}</p>
        <canvas ref={canvasRef} className="mx-auto rounded-xl" />
        <button onClick={download}
          className="mt-5 w-full bg-drop text-white font-sora font-semibold text-sm py-3 rounded-xl hover:bg-blue-700 transition">
          הורד PNG
        </button>
        <button onClick={onClose}
          className="mt-2 w-full text-sm text-gray-400 hover:text-ink transition py-2">
          סגור
        </button>
      </div>
    </div>
  )
}
