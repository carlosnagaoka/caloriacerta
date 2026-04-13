'use client'

import { useState, useRef, useCallback } from 'react'
import { atualizarRefeicao, buscarAlimentos } from '@/app/app/refeicao/actions'
import { estimarCalorias } from '@/app/app/refeicao/estimate-calories'
import { useModalKeyboard } from '@/hooks/useModalKeyboard'

interface EditItem {
  id: string          // id local temporário
  dbId?: string       // id real do meal_item (não usado na edição mas mantido)
  foodId?: string
  name: string
  weight: number
  caloriesPer100g: number
  totalCalories: number
}

interface EditMealModalProps {
  mealId: string
  mealLabel: string   // ex: "Almoço · 12:30"
  initialItems: Array<{
    id?: string
    food_id?: string
    item_name: string
    weight_grams: number
    calories_per_100g: number
    total_calories: number
  }>
  onClose: () => void
}

const mealTypeLabel: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  outro: 'Outro',
}

export default function EditMealModal({ mealId, mealLabel, initialItems, onClose }: EditMealModalProps) {
  const [items, setItems] = useState<EditItem[]>(
    initialItems.map(i => ({
      id: Math.random().toString(36).substr(2, 9),
      dbId: i.id,
      foodId: i.food_id,
      name: i.item_name,
      weight: i.weight_grams,
      caloriesPer100g: i.calories_per_100g,
      totalCalories: i.total_calories,
    }))
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [focusItemId, setFocusItemId] = useState<string | null>(null)
  const [estimatingId, setEstimatingId] = useState<string | null>(null)
  const [itemSearchResults, setItemSearchResults] = useState<Record<string, any[]>>({})
  const [itemSearchVisible, setItemSearchVisible] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSaveRef = useRef<() => Promise<void>>(async () => {})
  const { modalRef } = useModalKeyboard({ isOpen: true, onClose, onSubmit: () => handleSaveRef.current() })

  const totalCalories = items.reduce((s, i) => s + i.totalCalories, 0)

  // ── Busca global ──────────────────────────────────────────────────────────
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) { setSearchResults([]); return }
    const results = await buscarAlimentos(term)
    setSearchResults(results)
  }

  const addFromSearch = (food: any) => {
    const id = Math.random().toString(36).substr(2, 9)
    const cal = food?.calories_per_100g ?? 0
    setItems(prev => [...prev, {
      id, foodId: food?.id,
      name: food?.name || '',
      weight: 100,
      caloriesPer100g: cal,
      totalCalories: cal,
    }])
    setSearchTerm('')
    setSearchResults([])
    setFocusItemId(id)
  }

  const addManual = () => {
    const id = Math.random().toString(36).substr(2, 9)
    setItems(prev => [...prev, { id, name: '', weight: 100, caloriesPer100g: 0, totalCalories: 0 }])
    setSearchTerm('')
    setSearchResults([])
    setFocusItemId(id)
  }

  // ── Edição de item ────────────────────────────────────────────────────────
  const updateWeight = (id: string, weight: number) => {
    setItems(prev => prev.map(i => i.id !== id ? i : {
      ...i, weight, totalCalories: Math.round((weight * i.caloriesPer100g) / 100)
    }))
  }

  const updateCalories = (id: string, caloriesPer100g: number) => {
    setItems(prev => prev.map(i => i.id !== id ? i : {
      ...i, caloriesPer100g, totalCalories: Math.round((i.weight * caloriesPer100g) / 100)
    }))
  }

  const updateName = async (id: string, name: string) => {
    setItems(prev => prev.map(i => i.id !== id ? i : { ...i, name }))
    if (name.length < 2) {
      setItemSearchResults(prev => ({ ...prev, [id]: [] }))
      setItemSearchVisible(prev => ({ ...prev, [id]: false }))
      return
    }
    const results = await buscarAlimentos(name)
    setItemSearchResults(prev => ({ ...prev, [id]: results }))
    setItemSearchVisible(prev => ({ ...prev, [id]: results.length > 0 }))
  }

  const selectSuggestion = (id: string, food: any) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      return {
        ...i,
        name: food.name,
        foodId: food.id,
        caloriesPer100g: food.calories_per_100g,
        totalCalories: Math.round((i.weight * food.calories_per_100g) / 100),
      }
    }))
    setItemSearchVisible(prev => ({ ...prev, [id]: false }))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleEstimar = async (id: string, nome: string) => {
    if (!nome.trim()) return
    setEstimatingId(id)
    const result = await estimarCalorias(nome)
    if (result.caloriesPer100g > 0) updateCalories(id, result.caloriesPer100g)
    setEstimatingId(null)
  }

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (items.length === 0) { setError('Adicione pelo menos um item.'); return }
    setSaving(true)
    setError('')
    const result = await atualizarRefeicao(
      mealId,
      items.map(i => ({
        foodId: i.foodId,
        name: i.name,
        weight: i.weight,
        caloriesPer100g: i.caloriesPer100g,
      }))
    )
    setSaving(false)
    if (!result.success) { setError(result.error || 'Erro ao salvar.'); return }
    onClose()
  }

  // Sincroniza ref do handleSave para o hook poder chamar via Ctrl+Enter
  handleSaveRef.current = handleSave

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-meal-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <p id="edit-meal-title" className="text-sm font-bold text-gray-900">Editar refeição</p>
          <p className="text-xs text-secondary">{mealLabel}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 px-1"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {/* Lista de itens */}
        {items.map(item => (
          <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
            {/* Nome */}
            <div className="relative">
              <input
                type="text"
                value={item.name}
                placeholder="Nome do alimento"
                ref={focusItemId === item.id ? (el) => { el?.focus(); setFocusItemId(null) } : undefined}
                onChange={e => updateName(item.id, e.target.value)}
                onBlur={() => setTimeout(() => setItemSearchVisible(prev => ({ ...prev, [item.id]: false })), 150)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white"
              />
              {itemSearchVisible[item.id] && (itemSearchResults[item.id] || []).length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-auto">
                  {itemSearchResults[item.id].map(food => (
                    <button
                      key={food.id}
                      type="button"
                      onMouseDown={() => selectSuggestion(item.id, food)}
                      className="w-full px-3 py-2 text-left hover:bg-green-50 flex justify-between text-sm"
                    >
                      <span>{food.name}</span>
                      <span className="text-gray-400 text-xs">{food.calories_per_100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Peso + calorias/100g + total + remover */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Peso */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.weight}
                  onChange={e => updateWeight(item.id, parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white"
                  min="0"
                />
                <span className="text-xs text-gray-400">g</span>
              </div>

              <span className="text-gray-200">|</span>

              {/* Kcal/100g */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.caloriesPer100g || ''}
                  placeholder="0"
                  onChange={e => updateCalories(item.id, parseFloat(e.target.value) || 0)}
                  className={`w-16 px-2 py-1 border rounded-lg text-xs text-center text-gray-900 bg-white ${
                    item.caloriesPer100g === 0 ? 'border-red-300' : 'border-gray-200'
                  }`}
                  min="0"
                />
                <span className="text-xs text-gray-400">kcal/100g</span>
              </div>

              {/* Estimar IA */}
              {item.caloriesPer100g === 0 && (
                <button
                  type="button"
                  onClick={() => handleEstimar(item.id, item.name)}
                  disabled={estimatingId === item.id}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg disabled:opacity-50"
                >
                  {estimatingId === item.id ? '⏳' : '🤖 Estimar'}
                </button>
              )}

              {/* Total calculado */}
              <span className="ml-auto text-sm font-semibold text-green-600">
                {item.totalCalories} kcal
              </span>

              {/* Remover */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-600 text-lg leading-none ml-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {/* Adicionar item */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar alimento para adicionar..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white"
            />
            <button
              type="button"
              onClick={addManual}
              className="px-3 py-2 bg-gray-700 text-white text-sm rounded-xl hover:bg-gray-800"
            >
              + Manual
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-h-48 overflow-auto">
              {searchResults.map(food => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addFromSearch(food)}
                  className="w-full px-4 py-2.5 text-left hover:bg-green-50 flex justify-between text-sm border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-800">{food.name}</span>
                  <span className="text-gray-400 text-xs">{food.calories_per_100g} kcal/100g</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: total */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
        <span className="text-sm text-gray-500">Total da refeição</span>
        <span className="text-xl font-bold text-green-600">{totalCalories} kcal</span>
      </div>
    </div>
  )
}
