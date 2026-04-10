'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { lookupBarcode, type FoodFromBarcode } from '@/app/app/refeicao/barcode-lookup'

interface Props {
  onFood: (food: FoodFromBarcode) => void
  onClose: () => void
}

export default function BarcodeScanner({ onFood, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [status, setStatus] = useState<'starting' | 'scanning' | 'found' | 'error' | 'manual'>('starting')
  const [errorMsg, setErrorMsg] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const [lookingUp, setLookingUp] = useState(false)

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const handleLookup = useCallback(async (barcode: string) => {
    setLookingUp(true)
    const result = await lookupBarcode(barcode)
    setLookingUp(false)

    if (result.success) {
      stopCamera()
      onFood(result.food)
      onClose()
    } else {
      setErrorMsg(result.error)
      setStatus('error')
    }
  }, [stopCamera, onFood, onClose])

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('scanning')

        // Usar BarcodeDetector nativo (Chrome/Android)
        if ('BarcodeDetector' in window) {
          // @ts-ignore — API nativa não tem tipos no TS padrão
          const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] })

          const scan = async () => {
            if (cancelled || !videoRef.current) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue as string
                setStatus('found')
                await handleLookup(code)
                return
              }
            } catch {}
            rafRef.current = requestAnimationFrame(scan)
          }
          rafRef.current = requestAnimationFrame(scan)
        } else {
          // Sem suporte nativo — mostrar input manual mas manter câmera visível
          setStatus('manual')
        }
      } catch {
        if (!cancelled) setStatus('manual')
      }
    }

    startCamera()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [handleLookup, stopCamera])

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualBarcode.trim()
    if (!code) return
    setStatus('found')
    await handleLookup(code)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Escanear Código de Barras</h2>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Câmera */}
          {status !== 'error' && (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Mira */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-32 border-2 border-green-400 rounded-lg relative">
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-green-400 rounded-tl" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-green-400 rounded-tr" />
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-green-400 rounded-bl" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-green-400 rounded-br" />
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400/75 animate-bounce top-1/2" />
                </div>
              </div>

              <div className="absolute bottom-2 inset-x-0 text-center">
                {status === 'starting' && <span className="text-xs text-gray-300 bg-black/60 px-3 py-1 rounded-full">Iniciando câmera...</span>}
                {status === 'scanning' && <span className="text-xs text-green-300 bg-black/60 px-3 py-1 rounded-full">Aponte para o código de barras</span>}
                {status === 'found' && <span className="text-xs text-green-300 bg-black/60 px-3 py-1 rounded-full">{lookingUp ? 'Buscando produto...' : 'Detectado!'}</span>}
                {status === 'manual' && <span className="text-xs text-yellow-300 bg-black/60 px-3 py-1 rounded-full">Digite o código abaixo</span>}
              </div>
            </div>
          )}

          {/* Erro */}
          {status === 'error' && (
            <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-center">
              <p className="text-red-300 font-medium mb-1">Produto não encontrado</p>
              <p className="text-red-400 text-sm">{errorMsg}</p>
              <button onClick={() => { setStatus('manual'); setManualBarcode('') }} className="mt-3 text-sm text-gray-400 hover:text-white underline">
                Tentar outro código
              </button>
            </div>
          )}

          {/* Input manual */}
          {(status === 'manual' || status === 'error') && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Ex: 7891234567890"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={lookingUp || !manualBarcode.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {lookingUp ? '...' : 'Buscar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
