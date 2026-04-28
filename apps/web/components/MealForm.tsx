'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { salvarRefeicao, buscarAlimentosComHistorico } from '@/app/app/refeicao/actions'
import MealTriggerModal from '@/components/MealTriggerModal'
import { analyzeFoodImage } from '@/app/app/refeicao/analyze-image'
import { estimarCalorias } from '@/app/app/refeicao/estimate-calories'
import { createClient } from '@/lib/supabase-client'
import dynamic from 'next/dynamic'
import type { FoodFromBarcode } from '@/app/app/refeicao/barcode-lookup'
import type { LabelItem } from '@/components/ScanRotuloModal'

const BarcodeScanner   = dynamic(() => import('@/components/BarcodeScanner'),   { ssr: false })
const ScanRotuloModal  = dynamic(() => import('@/components/ScanRotuloModal'),  { ssr: false })

interface MealItem {
  id: string
  foodId?: string
  name: string
  weight: number
  caloriesPer100g: number
  totalCalories: number
  country?: string
  // Macros (from label scan or barcode)
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
}

export default function MealForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [mealType, setMealType] = useState('almoco')
  // Usa data/hora LOCAL do dispositivo (importante para usuários no Japão UTC+9)
  const now = new Date()
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const localTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const [mealDate, setMealDate] = useState(localDate)
  const [mealTime, setMealTime] = useState(localTime)
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [items, setItems] = useState<MealItem[]>([])
  const [focusItemId, setFocusItemId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Busca inline por item individual
  const [itemSearchResults, setItemSearchResults] = useState<Record<string, any[]>>({})
  const [itemSearchVisible, setItemSearchVisible] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(false)
  const [triggerModal, setTriggerModal] = useState<{ mealId: string; totalCalories: number } | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)
  const [estimatingId, setEstimatingId] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showScanRotulo, setShowScanRotulo] = useState(false)
  const [error, setError] = useState('')

  // Upload de foto para Supabase Storage
  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file) return

    setUploadingPhoto(true)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `meal_${userId}_${Date.now()}.${fileExt}`
      const filePath = `meals/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Erro upload:', uploadError)
        setError('Erro ao fazer upload da foto')
        setUploadingPhoto(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('meal-photos')
        .getPublicUrl(filePath)

      setPhotoUrl(publicUrl)
      console.log('Foto uploadada:', publicUrl)

      // Analisar imagem com OpenAI
      setAnalyzingPhoto(true)
      const analysis = await analyzeFoodImage(publicUrl)
      console.log('Análise:', analysis)

      if (analysis.success && analysis.foods && analysis.foods.length > 0) {
        const newItems: MealItem[] = analysis.foods.map((food: any) => {
          const weight = food.estimatedWeightGrams || 100
          const caloriesPer100g = food.caloriesPer100g || 0
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: food.name,
            weight,
            caloriesPer100g,
            totalCalories: Math.round((weight * caloriesPer100g) / 100),
          }
        })
        setItems(prev => [...prev, ...newItems])
      } else if (!analysis.success) {
        setError(`IA: ${analysis.error || 'Erro desconhecido'}`)
      }
      setAnalyzingPhoto(false)

    } catch (err) {
      console.error('Erro:', err)
      setError('Erro no upload da foto')
      setAnalyzingPhoto(false)
    }

    setUploadingPhoto(false)
  }, [userId, supabase])

  // Buscar alimentos (banco global + histórico pessoal)
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    const results = await buscarAlimentosComHistorico(term, userId)
    setSearchResults(results)
    setShowSearch(true)
  }

  // Adicionar item — preenche kcal e macros se o alimento vier do histórico ou banco
  const addItem = (food: any, customName?: string) => {
    const caloriesPer100g = food?.calories_per_100g ?? 0
    const id = Math.random().toString(36).substr(2, 9)
    const newItem: MealItem = {
      id,
      foodId: food?.id,
      name: customName || food?.name || '',
      weight: 100,
      caloriesPer100g,
      totalCalories: Math.round(caloriesPer100g),
      proteinPer100g: food?.protein_per_100g ?? undefined,
      carbsPer100g:   food?.carbs_per_100g   ?? undefined,
      fatPer100g:     food?.fat_per_100g     ?? undefined,
      proteinGrams:   food?.protein_per_100g != null ? Math.round(food.protein_per_100g) : undefined,
      carbsGrams:     food?.carbs_per_100g   != null ? Math.round(food.carbs_per_100g)   : undefined,
      fatGrams:       food?.fat_per_100g     != null ? Math.round(food.fat_per_100g)     : undefined,
    }

    setItems([...items, newItem])
    setSearchTerm('')
    setSearchResults([])
    setShowSearch(false)
    setFocusItemId(id)
  }

  // Atualizar peso do item (recalcula calorias + macros proporcionalmente)
  const updateItemWeight = (id: string, weight: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const totalCalories = Math.round((weight * item.caloriesPer100g) / 100)
        return {
          ...item,
          weight,
          totalCalories,
          proteinGrams: item.proteinPer100g != null ? Math.round((item.proteinPer100g * weight) / 100) : item.proteinGrams,
          carbsGrams:   item.carbsPer100g   != null ? Math.round((item.carbsPer100g   * weight) / 100) : item.carbsGrams,
          fatGrams:     item.fatPer100g     != null ? Math.round((item.fatPer100g     * weight) / 100) : item.fatGrams,
        }
      }
      return item
    }))
  }

  // Atualizar calorias por 100g
  const updateItemCalories = (id: string, caloriesPer100g: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const totalCalories = Math.round((item.weight * caloriesPer100g) / 100)
        return { ...item, caloriesPer100g, totalCalories }
      }
      return item
    }))
  }

  // Estimar calorias via IA pelo nome do alimento
  const handleEstimarCalorias = async (id: string, nome: string) => {
    if (!nome.trim()) return
    setEstimatingId(id)
    const result = await estimarCalorias(nome)
    if (result.caloriesPer100g > 0) {
      updateItemCalories(id, result.caloriesPer100g)
    }
    setEstimatingId(null)
  }

  // Atualizar nome do item e buscar sugestões (banco + histórico pessoal)
  const updateItemName = async (id: string, name: string) => {
    setItems(items.map(item => item.id === id ? { ...item, name } : item))

    if (name.length < 2) {
      setItemSearchResults(prev => ({ ...prev, [id]: [] }))
      setItemSearchVisible(prev => ({ ...prev, [id]: false }))
      return
    }

    const results = await buscarAlimentosComHistorico(name, userId)
    setItemSearchResults(prev => ({ ...prev, [id]: results }))
    setItemSearchVisible(prev => ({ ...prev, [id]: results.length > 0 }))

    // Auto-preenche kcal se há match exato no histórico pessoal
    const exactMatch = results.find(
      r => r.name.toLowerCase() === name.toLowerCase() && r.calories_per_100g > 0
    )
    if (exactMatch) {
      setItems(prev => prev.map(item => {
        if (item.id !== id || item.caloriesPer100g > 0) return item
        return {
          ...item,
          caloriesPer100g: exactMatch.calories_per_100g,
          totalCalories: Math.round((item.weight * exactMatch.calories_per_100g) / 100),
          proteinPer100g: exactMatch.protein_per_100g ?? item.proteinPer100g,
          carbsPer100g:   exactMatch.carbs_per_100g   ?? item.carbsPer100g,
          fatPer100g:     exactMatch.fat_per_100g     ?? item.fatPer100g,
        }
      }))
    }
  }

  // Selecionar sugestão — preenche nome, kcal e macros
  const selectItemSuggestion = (id: string, food: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const cal = food.calories_per_100g
      return {
        ...item,
        name: food.name,
        foodId: food.id,
        caloriesPer100g: cal,
        totalCalories: Math.round((item.weight * cal) / 100),
        proteinPer100g: food.protein_per_100g ?? item.proteinPer100g,
        carbsPer100g:   food.carbs_per_100g   ?? item.carbsPer100g,
        fatPer100g:     food.fat_per_100g     ?? item.fatPer100g,
        proteinGrams: food.protein_per_100g != null ? Math.round((item.weight * food.protein_per_100g) / 100) : item.proteinGrams,
        carbsGrams:   food.carbs_per_100g   != null ? Math.round((item.weight * food.carbs_per_100g)   / 100) : item.carbsGrams,
        fatGrams:     food.fat_per_100g     != null ? Math.round((item.weight * food.fat_per_100g)     / 100) : item.fatGrams,
      }
    }))
    setItemSearchVisible(prev => ({ ...prev, [id]: false }))
  }

  // Adicionar item via código de barras
  const handleBarcodeFood = (food: FoodFromBarcode) => {
    const newItem: MealItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: food.name,
      weight: 100,
      caloriesPer100g: food.caloriesPer100g,
      totalCalories: food.caloriesPer100g,
      country: food.country,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g:   food.carbsPer100g,
      fatPer100g:     food.fatPer100g,
      proteinGrams:   food.proteinPer100g,
      carbsGrams:     food.carbsPer100g,
      fatGrams:       food.fatPer100g,
    }
    setItems((prev) => [...prev, newItem])
  }

  // Adicionar item via scanner de rótulo japonês
  const handleLabelItem = (label: LabelItem) => {
    const newItem: MealItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: label.name,
      weight: label.weight,
      caloriesPer100g: label.caloriesPer100g,
      totalCalories:   label.totalCalories,
      proteinPer100g:  label.proteinPer100g,
      carbsPer100g:    label.carbsPer100g,
      fatPer100g:      label.fatPer100g,
      proteinGrams:    label.proteinGrams,
      carbsGrams:      label.carbsGrams,
      fatGrams:        label.fatGrams,
    }
    setItems((prev) => [...prev, newItem])
  }

  // Remover item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Calcular total
  const totalCalories = items.reduce((sum, item) => sum + item.totalCalories, 0)

  // Salvar refeição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (items.length === 0) {
      setError('Adicione pelo menos um alimento')
      setLoading(false)
      return
    }

    const result = await salvarRefeicao({
      userId,
      mealType,
      mealDate,
      mealTime,
      photoUrl,
      notes,
      items: items.map(item => ({
        foodId:       item.foodId,
        name:         item.name,
        weight:       item.weight,
        caloriesPer100g: item.caloriesPer100g,
        proteinGrams: item.proteinGrams,
        carbsGrams:   item.carbsGrams,
        fatGrams:     item.fatGrams,
      })),
    })

    if (!result.success) {
      setError(result.error || 'Erro ao salvar refeição')
      setLoading(false)
      return
    }

    console.log('Refeição salva! Total:', result.totalCalories)
    setLoading(false)

    // Mostra modal de trigger comportamental antes de redirecionar
    setTriggerModal({
      mealId: result.mealId,
      totalCalories: result.totalCalories ?? 0,
    })
  }

  const handleTriggerClose = () => {
    setTriggerModal(null)
    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <>
    {triggerModal && (
      <MealTriggerModal
        mealId={triggerModal.mealId}
        totalCalories={triggerModal.totalCalories}
        onClose={handleTriggerClose}
      />
    )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tipo e Data/Hora */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Refeição</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          >
            <option value="cafe_da_manha">Café da Manhã</option>
            <option value="almoco">Almoço</option>
            <option value="jantar">Jantar</option>
            <option value="lanche">Lanche</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hora</label>
          <input
            type="time"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          />
        </div>
      </div>

      {/* Foto */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Foto da Refeição</label>

        {photoPreview ? (
          <div className="mt-2 relative">
            <img
              src={photoPreview}
              alt="Preview"
              className="max-w-xs rounded-lg shadow"
            />
            {(uploadingPhoto || analyzingPhoto) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <span className="text-white text-sm">
                  {uploadingPhoto ? 'Enviando...' : 'Identificando alimentos...'}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setPhoto(null)
                setPhotoPreview(null)
                setPhotoUrl(null)
              }}
              className="mt-2 text-red-600 text-sm hover:underline"
            >
              Remover foto
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
        )}
      </div>

      {/* Barcode scanner modal */}
      {showScanner && (
        <BarcodeScanner
          onFood={handleBarcodeFood}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Japanese label scanner modal */}
      {showScanRotulo && (
        <ScanRotuloModal
          onAdd={handleLabelItem}
          onClose={() => setShowScanRotulo(false)}
        />
      )}

      {/* Busca de Alimentos */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">
          Adicionar Alimentos
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowSearch(true)}
            placeholder="Buscar alimento (ex: arroz, frango)..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm"
            title="Escanear código de barras"
          >
            📷 Código
          </button>
          <button
            type="button"
            onClick={() => setShowScanRotulo(true)}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1 text-sm"
            title="Escanear rótulo japonês"
          >
            🇯🇵 Rótulo
          </button>
          <button
            type="button"
            onClick={() => addItem(null, searchTerm)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            + Manual
          </button>
        </div>

        {/* Resultados da busca */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto">
            {searchResults.map((food, i) => (
              <button
                key={food.id ?? `h-${i}`}
                type="button"
                onClick={() => addItem(food)}
                className="w-full px-4 py-2.5 text-left hover:bg-green-50 flex items-center justify-between border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {food.fromHistory && <span className="text-xs">📌</span>}
                  <span className="text-sm text-gray-800 truncate">{food.name}</span>
                  {food.fromHistory && food.frequency > 1 && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {food.frequency}×
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-2">{food.calories_per_100g} kcal/100g</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      {items.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Itens da Refeição</h3>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 bg-white p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {item.country === 'JP' && <span title="Produto japonês">🇯🇵</span>}
                      {item.country === 'BR' && <span title="Produto brasileiro">🇧🇷</span>}
                      {item.proteinGrams != null && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          P{item.proteinGrams}g C{item.carbsGrams}g G{item.fatGrams}g
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Nome do alimento"
                      ref={focusItemId === item.id ? (el) => { el?.focus(); setFocusItemId(null) } : undefined}
                      onChange={(e) => updateItemName(item.id, e.target.value)}
                      onBlur={() => setTimeout(() => setItemSearchVisible(prev => ({ ...prev, [item.id]: false })), 150)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-900 bg-white"
                    />
                    {itemSearchVisible[item.id] && (itemSearchResults[item.id] || []).length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                        {itemSearchResults[item.id].map((food, i) => (
                          <button
                            key={food.id ?? `h-${i}`}
                            type="button"
                            onMouseDown={() => selectItemSuggestion(item.id, food)}
                            className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center justify-between text-sm border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {food.fromHistory && <span className="text-xs">📌</span>}
                              <span className="truncate text-gray-800">{food.name}</span>
                              {food.fromHistory && food.frequency > 1 && (
                                <span className="text-[10px] text-green-600 bg-green-50 px-1 py-0.5 rounded-full flex-shrink-0">{food.frequency}×</span>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0 ml-2">{food.calories_per_100g} kcal/100g</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Campo editável para calorias/100g */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <input
                        type="number"
                        value={item.caloriesPer100g || ''}
                        onChange={(e) => updateItemCalories(item.id, parseFloat(e.target.value) || 0)}
                        className={`w-20 px-2 py-1 border rounded text-xs text-gray-900 bg-white ${
                          item.caloriesPer100g === 0
                            ? 'border-red-400 ring-1 ring-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      <span className="text-xs text-gray-500">kcal/100g</span>
                      {item.caloriesPer100g === 0 && (
                        <button
                          type="button"
                          onClick={() => handleEstimarCalorias(item.id, item.name)}
                          disabled={estimatingId === item.id}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                        >
                          {estimatingId === item.id ? '⏳ Estimando...' : '🤖 Estimar'}
                        </button>
                      )}
                    </div>
                    {item.caloriesPer100g === 0 && estimatingId !== item.id && (
                      <p className="text-xs text-red-500 mt-0.5">
                        ⚠️ Digite as calorias ou clique em 🤖 Estimar
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateItemWeight(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-900 bg-white"
                      min="0"
                      step="1"
                    />
                    <span className="text-sm text-gray-500">g</span>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="font-medium text-sm text-green-600">{item.totalCalories} kcal</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800 text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium text-gray-700">Total da Refeição:</span>
            <span className="text-2xl font-bold text-green-600">{totalCalories} kcal</span>
          </div>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Observações (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
          placeholder="Ex: Comi fora, porção grande, etc."
        />
      </div>

      {/* Botões */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploadingPhoto || analyzingPhoto || items.length === 0}
          className="flex-1 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Salvando...' : `Salvar Refeição (${totalCalories} kcal)`}
        </button>

        <a
          href="/app/dashboard"
          className="py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </a>
      </div>
    </form>
    </>
  )
}