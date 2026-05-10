'use client'

import { useRef, useState } from 'react'

export interface FotoItem {
  nome: string
  pesoGramas: number
  caloriasPor100g: number
  proteinaPor100g: number
  carbsPor100g: number
  gorduraPor100g: number
  confianca: number
  totalKcal: number
}

interface Props {
  onAdd: (itens: FotoItem[]) => void
  onClose: () => void
}

// Converte qualquer imagem para JPEG base64 (mesmo HEIC do Galaxy/iPhone)
async function toJpegBase64(file: File, maxPx = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas toBlob falhou')); return }
          const reader = new FileReader()
          reader.onloadend = () => {
            const dataUrl = reader.result as string
            resolve(dataUrl.split(',')[1])
          }
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')) }
    img.src = url
  })
}

type Step = 'idle' | 'analisando' | 'resultado' | 'erro'

export default function AnalisarFotoModal({ onAdd, onClose }: Props) {
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)

  const [step, setStep]           = useState<Step>('idle')
  const [preview, setPreview]     = useState<string | null>(null)
  const [erro, setErro]           = useState('')
  const [descricao, setDescricao] = useState('')
  const [itens, setItens]         = useState<FotoItem[]>([])

  const analisar = async (file: File) => {
    setErro('')
    setPreview(URL.createObjectURL(file))
    setStep('analisando')

    try {
      const imageBase64 = await toJpegBase64(file)
      const res = await fetch('/api/analisar-foto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setErro(json.error || 'Erro ao analisar foto')
        setStep('erro')
        return
      }

      const itensComTotal: FotoItem[] = (json.itens || []).map((i: any) => ({
        ...i,
        totalKcal: Math.round((i.pesoGramas * i.caloriasPor100g) / 100),
      }))

      setDescricao(json.descricao || '')
      setItens(itensComTotal)
      setStep('resultado')
    } catch (e: any) {
      setErro(e.message || 'Erro desconhecido')
      setStep('erro')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) analisar(file)
    e.target.value = ''
  }

  const updatePeso = (idx: number, peso: number) => {
    if (isNaN(peso) || peso < 0) return
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item
      return {
        ...item,
        pesoGramas: peso,
        totalKcal: Math.round((peso * item.caloriasPor100g) / 100),
      }
    }))
  }

  const updateNome = (idx: number, nome: string) => {
    setItens(prev => prev.map((item, i) => i === idx ? { ...item, nome } : item))
  }

  const removeItem = (idx: number) => {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  const totalKcal = itens.reduce((s, i) => s + i.totalKcal, 0)

  const confirmar = () => {
    if (itens.length === 0) return
    onAdd(itens)
    onClose()
  }

  const confiancaLabel = (c: number) => {
    if (c >= 0.85) return { text: 'Alta',  color: 'text-green-600' }
    if (c >= 0.65) return { text: 'Média', color: 'text-yellow-600' }
    return              { text: 'Baixa', color: 'text-red-500' }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">📸 Analisar foto da refeição</h2>
            {step === 'resultado' && descricao && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{descricao}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Idle: escolha câmera ou galeria ───────────────────────── */}
          {step === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                Tire uma foto ou escolha da galeria.<br />
                A IA identifica os alimentos e estima as calorias automaticamente.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Câmera</span>
                </button>

                <button
                  type="button"
                  onClick={() => galeriaRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Galeria</span>
                </button>
              </div>

              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Funciona com bento box, prato brasileiro, onigiri, ramen e mais
              </p>
            </div>
          )}

          {/* ── Analisando ─────────────────────────────────────────────── */}
          {step === 'analisando' && (
            <div className="flex flex-col items-center gap-4 py-4">
              {preview && (
                <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
              )}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Identificando alimentos…</p>
                <p className="text-xs text-zinc-400">Isso leva cerca de 3–5 segundos</p>
              </div>
            </div>
          )}

          {/* ── Erro ───────────────────────────────────────────────────── */}
          {step === 'erro' && (
            <div className="space-y-4">
              {preview && (
                <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl opacity-60" />
              )}
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl text-center space-y-2">
                <p className="text-2xl">😕</p>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{erro}</p>
              </div>
              <button
                type="button"
                onClick={() => { setStep('idle'); setPreview(null) }}
                className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Tentar outra foto
              </button>
            </div>
          )}

          {/* ── Resultado: lista de itens editável ─────────────────────── */}
          {step === 'resultado' && (
            <div className="space-y-3">
              {/* Preview miniatura */}
              {preview && (
                <img src={preview} alt="Refeição" className="w-full max-h-40 object-cover rounded-xl" />
              )}

              {itens.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Nenhum item encontrado</p>
              ) : (
                <div className="space-y-2">
                  {itens.map((item, idx) => {
                    const cf = confiancaLabel(item.confianca)
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl"
                      >
                        {/* Info */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          {/* Nome editável */}
                          <input
                            type="text"
                            value={item.nome}
                            onChange={e => updateNome(idx, e.target.value)}
                            className="w-full text-sm font-semibold bg-transparent text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-green-500 pb-0.5"
                          />

                          {/* Peso + kcal */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={item.pesoGramas || ''}
                                onChange={e => updatePeso(idx, parseFloat(e.target.value))}
                                className="w-16 text-xs text-center bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md px-1 py-0.5 text-zinc-800 dark:text-zinc-200"
                              />
                              <span className="text-xs text-zinc-400">g</span>
                            </div>
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">
                              {item.totalKcal} kcal
                            </span>
                            <span className={`text-[10px] font-medium ${cf.color}`}>
                              {cf.text}
                            </span>
                          </div>

                          {/* Macros */}
                          <div className="flex gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                            <span>P {Math.round((item.proteinaPor100g * item.pesoGramas) / 100)}g</span>
                            <span>C {Math.round((item.carbsPor100g    * item.pesoGramas) / 100)}g</span>
                            <span>G {Math.round((item.gorduraPor100g  * item.pesoGramas) / 100)}g</span>
                          </div>
                        </div>

                        {/* Remover */}
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 text-lg leading-none mt-0.5 shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total */}
              {itens.length > 0 && (
                <div className="flex justify-between items-center px-1 py-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-sm text-zinc-500">Total estimado</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{totalKcal} kcal</span>
                </div>
              )}

              {/* Nova foto */}
              <button
                type="button"
                onClick={() => { setStep('idle'); setPreview(null); setItens([]) }}
                className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1"
              >
                ↩ Usar outra foto
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'resultado' && itens.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={confirmar}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
            >
              Adicionar {itens.length} {itens.length === 1 ? 'alimento' : 'alimentos'} à refeição
            </button>
          </div>
        )}

        {/* Inputs de arquivo ocultos */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={galeriaRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
