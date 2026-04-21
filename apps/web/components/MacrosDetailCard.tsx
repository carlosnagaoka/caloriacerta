'use client'

import { useState } from 'react'

interface MealItem {
  item_name: string
  weight_grams: number
  total_calories: number
  protein_grams?: number | null
  carbs_grams?: number | null
  fat_grams?: number | null
}

interface Meal {
  id: string
  meal_type: string
  total_calories: number
  meal_items?: MealItem[]
}

interface MacroTotals {
  prot: number
  carbs: number
  fat: number
}

const mealTypeLabel: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  outro: 'Outro',
}

const mealTypeIcon: Record<string, string> = {
  cafe_da_manha: '🌅',
  almoco: '☀️',
  jantar: '🌙',
  lanche: '🍎',
  outro: '🍽️',
}

function getMealMacros(items: MealItem[]): MacroTotals {
  return items.reduce(
    (acc, i) => ({
      prot:  acc.prot  + (i.protein_grams != null ? Math.round(i.protein_grams)  : Math.round((i.total_calories * 0.25) / 4)),
      carbs: acc.carbs + (i.carbs_grams   != null ? Math.round(i.carbs_grams)    : Math.round((i.total_calories * 0.50) / 4)),
      fat:   acc.fat   + (i.fat_grams     != null ? Math.round(i.fat_grams)      : Math.round((i.total_calories * 0.25) / 9)),
    }),
    { prot: 0, carbs: 0, fat: 0 }
  )
}

// ── Big progress bar ────────────────────────────────────────────────────────────
function MacroRow({
  label, emoji, value, max, color, bgColor, textColor,
}: {
  label: string
  emoji: string
  value: number
  max: number
  color: string
  bgColor: string
  textColor: string
}) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const over = value > max

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-bold ${over ? 'text-red-500' : textColor}`}>
            {value}g
          </span>
          <span className="text-xs text-gray-400">/ {max}g</span>
          <span className={`text-xs font-semibold ml-1 px-1.5 py-0.5 rounded-full ${over ? 'bg-red-100 text-red-600' : `${bgColor} ${textColor}`}`}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Mini macro pill strip for per-meal rows ─────────────────────────────────────
function MacroMiniStrip({ prot, carbs, fat, protMax, carbMax, fatMax }: {
  prot: number; carbs: number; fat: number
  protMax: number; carbMax: number; fatMax: number
}) {
  const protPct  = protMax  > 0 ? Math.min((prot  / protMax)  * 100, 100) : 0
  const carbsPct = carbMax  > 0 ? Math.min((carbs / carbMax)  * 100, 100) : 0
  const fatPct   = fatMax   > 0 ? Math.min((fat   / fatMax)   * 100, 100) : 0

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-blue-500 w-4">P</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 bg-blue-400 rounded-full" style={{ width: `${protPct}%` }} />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{prot}g</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-500 w-4">C</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${carbsPct}%` }} />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{carbs}g</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-pink-500 w-4">G</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-1.5 bg-pink-400 rounded-full" style={{ width: `${fatPct}%` }} />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{fat}g</span>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function MacrosDetailCard({
  meals,
  totalProt,
  totalCarbs,
  totalFat,
  protMeta,
  carbMeta,
  fatMeta,
}: {
  meals: Meal[]
  totalProt: number
  totalCarbs: number
  totalFat: number
  protMeta: number
  carbMeta: number
  fatMeta: number
}) {
  const [expanded, setExpanded] = useState(false)

  // Calorie distribution (for the "% of calories" pills)
  const totalCals = totalProt * 4 + totalCarbs * 4 + totalFat * 9
  const protCalPct  = totalCals > 0 ? Math.round((totalProt  * 4 / totalCals) * 100) : 0
  const carbsCalPct = totalCals > 0 ? Math.round((totalCarbs * 4 / totalCals) * 100) : 0
  const fatCalPct   = totalCals > 0 ? Math.round((totalFat   * 9 / totalCals) * 100) : 0

  // Meals with macros
  const mealsWithMacros = meals.map(m => ({
    ...m,
    macros: getMealMacros(m.meal_items || []),
  }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">🥗 Macros do Dia</h3>
        {/* Calorie distribution pills */}
        {totalCals > 0 && (
          <div className="flex gap-1.5 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">P {protCalPct}%</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">C {carbsCalPct}%</span>
            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">G {fatCalPct}%</span>
          </div>
        )}
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        <MacroRow
          label="Proteína" emoji="🥩"
          value={totalProt} max={protMeta}
          color="bg-blue-400" bgColor="bg-blue-50" textColor="text-blue-600"
        />
        <MacroRow
          label="Carboidratos" emoji="🌾"
          value={totalCarbs} max={carbMeta}
          color="bg-amber-400" bgColor="bg-amber-50" textColor="text-amber-600"
        />
        <MacroRow
          label="Gordura" emoji="🫙"
          value={totalFat} max={fatMeta}
          color="bg-pink-400" bgColor="bg-pink-50" textColor="text-pink-600"
        />
      </div>

      {/* Per-meal breakdown toggle */}
      {meals.length > 0 && (
        <div className="mt-4 border-t border-gray-50 pt-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>{expanded ? '▴ Ocultar' : '▾ Por refeição'} ({meals.length})</span>
            <span className="text-gray-400 font-normal">detalhes por refeição</span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {mealsWithMacros.map(meal => (
                <div
                  key={meal.id}
                  className="bg-gray-50 rounded-xl p-3"
                >
                  {/* Meal header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{mealTypeIcon[meal.meal_type] || '🍽️'}</span>
                      <span className="text-xs font-bold text-gray-700">
                        {mealTypeLabel[meal.meal_type] || meal.meal_type}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-green-600">{meal.total_calories} kcal</span>
                  </div>

                  {/* Macro numbers */}
                  <div className="flex gap-3 text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-blue-500">P: {meal.macros.prot}g</span>
                    <span className="font-semibold text-amber-500">C: {meal.macros.carbs}g</span>
                    <span className="font-semibold text-pink-500">G: {meal.macros.fat}g</span>
                  </div>

                  {/* Mini bars */}
                  <MacroMiniStrip
                    prot={meal.macros.prot}   protMax={protMeta}
                    carbs={meal.macros.carbs} carbMax={carbMeta}
                    fat={meal.macros.fat}     fatMax={fatMeta}
                  />

                  {/* Items breakdown */}
                  {meal.meal_items && meal.meal_items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {meal.meal_items.map((item, idx) => {
                        const ip = item.protein_grams != null ? Math.round(item.protein_grams) : Math.round((item.total_calories * 0.25) / 4)
                        const ic = item.carbs_grams   != null ? Math.round(item.carbs_grams)   : Math.round((item.total_calories * 0.50) / 4)
                        const ig = item.fat_grams     != null ? Math.round(item.fat_grams)     : Math.round((item.total_calories * 0.25) / 9)
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate flex-1 mr-2">{item.item_name}</span>
                            <span className="flex gap-2 text-gray-400 flex-shrink-0">
                              <span className="text-blue-400">P{ip}</span>
                              <span className="text-amber-400">C{ic}</span>
                              <span className="text-pink-400">G{ig}</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
