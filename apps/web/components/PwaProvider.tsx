'use client'

import { useEffect, useState } from 'react'

// Detects iOS Safari specifically
function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// True when running as installed PWA (standalone)
function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

export default function PwaProvider() {
  const [showIosBanner, setShowIosBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showAndroidBanner, setShowAndroidBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => console.log('[SW] Registered, scope:', reg.scope))
        .catch(err => console.error('[SW] Registration failed:', err))
    }

    // Skip if already installed
    if (isInStandaloneMode()) return

    // Skip if user already dismissed
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
    if (dismissed) return

    // iOS: show manual instructions banner
    if (isIos()) {
      setShowIosBanner(true)
      return
    }

    // Android / Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroidBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShowIosBanner(false)
    setShowAndroidBanner(false)
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowAndroidBanner(false)
    setDeferredPrompt(null)
  }

  // ── iOS install banner ────────────────────────────────────────────────────
  if (showIosBanner) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-slide-up">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192x192.png" alt="CaloriaCerta" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Instalar CaloriaCerta</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Toque em{' '}
              <span className="inline-flex items-center gap-0.5 font-semibold text-gray-700">
                <ShareIcon /> Compartilhar
              </span>
              {' '}e depois em{' '}
              <strong className="text-gray-700">"Adicionar à Tela de Início"</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Android install banner ────────────────────────────────────────────────
  if (showAndroidBanner) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-slide-up">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192x192.png" alt="CaloriaCerta" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Instalar CaloriaCerta</p>
            <p className="text-xs text-gray-500">Acesso rápido, funciona offline</p>
          </div>
          <button
            onClick={installAndroid}
            className="flex-shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl active:scale-95 transition-all"
          >
            Instalar
          </button>
        </div>
      </div>
    )
  }

  return null
}

// iOS share sheet icon (simplified)
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="inline-block">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}
