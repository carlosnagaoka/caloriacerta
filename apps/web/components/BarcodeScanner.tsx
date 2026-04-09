'use client'

import { useEffect, useRef, useState } from 'react'
import { lookupBarcode, type FoodFromBarcode } from '@/app/app/refeicao/barcode-lookup'

interface Props {
  onFood: (food: FoodFromBarcode) => void
  onClose: () => void
}

export default function BarcodeScanner({ onFood, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'found' | 'error' | 'manual'>('starting')
  const [errorMsg, setErrorMsg] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const readerRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        // Preferir câmera traseira no mobile
        const backCamera = devices.find(
          (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira')
        )
        const deviceId = backCamera?.deviceId || devices[0]?.deviceId

        if (!deviceId) {
          setStatus('manual')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId }, facingMode: 'environment' },
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        setStatus('scanning')

        // Scan a cada 500ms
        const interval = setInterval(async () => {
          if (cancelled || !videoRef.current) return
          try {
            const result = await reader.decodeFromVideoElement(videoRef.current)
            if (result && !cancelled) {
              clearInterval(interval)
              const barcode = result.getText()
              setStatus('found')
              await handleLookup(barcode)
            }
          } catch {}
        }, 500)

        return () => clearInterval(interval)
      } catch (err: any) {
        if (cancelled) return
        if (err.name === 'NotAllowedError') {
          setStatus('manual')
        } else {
          setStatus('manual')
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function handleLookup(barcode: string) {
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
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    setStatus('found')
    await handleLookup(manualBarcode.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Escanear Código de Barras</h2>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Fechar scanner"
          >
            ×
          </button>
        </div>

        {/* Câmera ou input manual */}
        <div className="p-5 space-y-4">
          {(status === 'starting' || status === 'scanning' || status === 'found') && (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                aria-label="Feed da câmera para escaneamento de código de barras"
              />
              {/* Mira de escaneamento */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-32 border-2 border-green-400 rounded-lg relative">
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400 rounded-tl" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400 rounded-tr" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400 rounded-bl" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400 rounded-br" />
                  {/* Linha de scan animada */}
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400 opacity-75 animate-bounce top-1/2" />
                </div>
              </div>

              {/* Status */}
              <div className="absolute bottom-2 left-0 right-0 text-center">
                {status === 'starting' && (
                  <span className="text-xs text-gray-300 bg-black/60 px-3 py-1 rounded-full">
                    Iniciando câmera...
                  </span>
                )}
                {status === 'scanning' && (
                  <span className="text-xs text-green-300 bg-black/60 px-3 py-1 rounded-full">
                    Aponte para o código de barras
                  </span>
                )}
                {status === 'found' && (
                  <span className="text-xs text-green-300 bg-black/60 px-3 py-1 rounded-full">
                    {lookingUp ? 'Buscando produto...' : 'Código detectado!'}
                  </span>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-900/40 border border-red-700 rounded-xl text-center">
              <p className="text-red-300 font-medium mb-1">Produto não encontrado</p>
              <p className="text-red-400 text-sm">{errorMsg}</p>
              <button
                onClick={() => setStatus('manual')}
                className="mt-3 text-sm text-gray-400 hover:text-white underline"
              >
                Tentar outro código
              </button>
            </div>
          )}

          {/* Input manual */}
          {(status === 'manual' || status === 'error') && (
            <div className="space-y-3">
              {status === 'manual' && (
                <p className="text-sm text-gray-400 text-center">
                  Câmera não disponível. Digite o código de barras manualmente:
                </p>
              )}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
