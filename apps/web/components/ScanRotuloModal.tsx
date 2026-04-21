'use client'

import { useState, useRef, useCallback } from 'react'

export interface LabelItem {
  name: string
  weight: number
  caloriesPer100g: number
  totalCalories: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
}

interface ScanResult {
  productName: string | null
  servingLabel: string
  servingGrams: number
  caloriesPerServing: number
  proteinPerServing: number
  carbsPerServing: number
  fatPerServing: number
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

interface Props {
  onAdd: (item: LabelItem) => void
  onClose: () => void
}

function calcMacros(per100g: number, weightGrams: number) {
  return Math.round((per100g * weightGrams) / 100)
}

// ── Convert ANY image (HEIC, HEIF, WebP, PNG…) to JPEG via Canvas ──────────────
// This normalises Samsung HEIF photos and large files before sending to Claude.
async function toJpegBase64(file: File, maxPx = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Resize to fit within maxPx × maxPx keeping aspect ratio
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > maxPx || h > maxPx) {
        const scale = Math.min(maxPx / w, maxPx / h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('canvas.toBlob falhou')); return }
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            resolve(dataUrl.split(',')[1]) // strip data:image/jpeg;base64,
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível carregar a imagem. Tente um formato diferente (JPG ou PNG).'))
    }

    img.src = url
  })
}

export default function ScanRotuloModal({ onAdd, onClose }: Props) {
  // Two separate inputs: one with capture (camera), one without (gallery)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState<ScanResult | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const [name,   setName]   = useState('')
  const [weight, setWeight] = useState(100)

  const derived = result ? {
    calories: calcMacros(result.caloriesPer100g, weight),
    protein:  calcMacros(result.proteinPer100g,  weight),
    carbs:    calcMacros(result.carbsPer100g,     weight),
    fat:      calcMacros(result.fatPer100g,       weight),
  } : null

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setResult(null)
    setScanning(true)

    // Show a preview immediately (objectURL works for any format the browser can render)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      // Convert to JPEG — fixes HEIC, HEIF, and wrong MIME types from Samsung/LG
      let base64: string
      try {
        base64 = await toJpegBase64(file)
      } catch (convErr: any) {
        throw new Error(convErr.message || 'Erro ao processar a imagem. Tente salvar como JPG nas configurações da câmera.')
      }

      const res = await fetch('/api/scan-rotulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Não foi possível ler o rótulo')
      }

      const data: ScanResult = json.data
      setResult(data)
      setName(data.productName || '')
      setWeight(data.servingGrams)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar imagem')
    }

    setScanning(false)
  }, [])

  const handleAdd = () => {
    if (!result || !derived) return
    onAdd({
      name:            name || 'Produto japonês',
      weight,
      caloriesPer100g: result.caloriesPer100g,
      totalCalories:   derived.calories,
      proteinPer100g:  result.proteinPer100g,
      carbsPer100g:    result.carbsPer100g,
      fatPer100g:      result.fatPer100g,
      proteinGrams:    derived.protein,
      carbsGrams:      derived.carbs,
      fatGrams:        derived.fat,
    })
    onClose()
  }

  const handleRetry = () => {
    setPreview(null)
    setResult(null)
    setError(null)
    setScanning(false)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // allow re-selecting same file
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">🇯🇵 Scanner de Rótulo</h2>
            <p className="text-xs text-gray-400 mt-0.5">栄養成分表示 → kcal + macros</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Initial state ───────────────────────────────────────────────── */}
          {!preview && !scanning && (
            <div className="space-y-4">
              <div className="text-center pt-2">
                <div className="text-5xl mb-3">📸</div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Fotografe a tabela nutricional
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  A IA lê o rótulo em japonês e extrai<br />kcal, proteína, carbs e gordura
                </p>
              </div>

              {/* Camera button — opens rear camera directly */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl">📷</span>
                <span>Abrir Câmera</span>
              </button>

              {/* Gallery button — choose from photos */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>🖼</span>
                <span>Escolher da Galeria</span>
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Aceita JPG, PNG, HEIC — qualquer formato da câmera
              </p>
            </div>
          )}

          {/* ── Scanning ────────────────────────────────────────────────────── */}
          {scanning && (
            <div className="text-center py-8">
              {preview && (
                <img
                  src={preview}
                  alt="Rótulo"
                  className="w-full max-h-48 object-contain rounded-xl mb-4 border border-gray-100"
                />
              )}
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold text-gray-700">Lendo rótulo japonês...</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">A IA está extraindo os valores nutricionais</p>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────────────── */}
          {error && !scanning && (
            <div className="space-y-4">
              {preview && (
                <img src={preview} alt="Rótulo" className="w-full max-h-40 object-contain rounded-xl border border-gray-100" />
              )}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0">😕</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Não consegui ler o rótulo</p>
                  <p className="text-xs text-red-500 mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* ── Result ──────────────────────────────────────────────────────── */}
          {result && !scanning && (
            <div className="space-y-4">
              {preview && (
                <div className="relative">
                  <img src={preview} alt="Rótulo" className="w-full max-h-36 object-contain rounded-xl border border-gray-100 bg-gray-50" />
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ✓ Lido
                  </span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-semibold">📦 Porção no rótulo</span>
                <span className="text-sm font-bold text-blue-700">{result.servingLabel}</span>
              </div>

              {/* Values read from label */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Valores lidos (por porção)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{result.caloriesPerServing}</p>
                    <p className="text-[10px] text-gray-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-500">{result.proteinPerServing}g</p>
                    <p className="text-[10px] text-gray-400">prot.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-500">{result.carbsPerServing}g</p>
                    <p className="text-[10px] text-gray-400">carbs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-pink-500">{result.fatPerServing}g</p>
                    <p className="text-[10px] text-gray-400">gord.</p>
                  </div>
                </div>
              </div>

              {/* Product name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do produto</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: カップヌードル, Arroz Japonês..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantidade que você comeu</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={weight}
                    min={1}
                    onChange={e => setWeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-center font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="text-sm text-gray-500 font-medium">gramas</span>
                  {weight !== result.servingGrams && (
                    <button type="button" onClick={() => setWeight(result.servingGrams)} className="text-xs text-green-600 hover:underline ml-auto">
                      Resetar {result.servingGrams}g
                    </button>
                  )}
                </div>
              </div>

              {/* Live calculated values */}
              {derived && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-700 mb-2">Para {weight}g → calculado</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-600">{derived.calories}</p>
                      <p className="text-[10px] text-gray-400">kcal</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-500">{derived.protein}g</p>
                      <p className="text-[10px] text-gray-400">prot.</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-500">{derived.carbs}g</p>
                      <p className="text-[10px] text-gray-400">carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-pink-500">{derived.fat}g</p>
                      <p className="text-[10px] text-gray-400">gord.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleRetry}
                  className="flex-none px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all"
                >
                  📷 Novo scan
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all"
                >
                  ✓ Adicionar à refeição
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Camera input — opens rear camera directly (no gallery chooser) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />

        {/* Gallery input — standard file picker */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  )
}
