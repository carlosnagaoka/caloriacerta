// Dentro do map de items, substituir a div do item por:

<div key={item.id} className="flex flex-col gap-2 bg-white p-3 rounded border">
  <div className="flex items-center gap-3">
    <div className="flex-1">
      <p className="font-medium text-sm">{item.name}</p>

      {/* Campo editável para calorias/100g */}
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          value={item.caloriesPer100g}
          onChange={(e) => updateItemCalories(item.id, parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
          placeholder="kcal/100g"
        />
        <span className="text-xs text-gray-500">kcal/100g</span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <input
        type="number"
        value={item.weight}
        onChange={(e) => updateItemWeight(item.id, parseFloat(e.target.value) || 0)}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
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