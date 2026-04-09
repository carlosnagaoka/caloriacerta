'use server'

export interface FoodFromBarcode {
  name: string
  brand: string
  caloriesPer100g: number
  carbsPer100g: number
  proteinPer100g: number
  fatPer100g: number
  barcode: string
}

export async function lookupBarcode(barcode: string): Promise<
  { success: true; food: FoodFromBarcode } | { success: false; error: string }
> {
  try {
    console.log('[Barcode] Buscando:', barcode)

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { next: { revalidate: 86400 } } // cache 24h
    )

    if (!res.ok) {
      return { success: false, error: 'Erro ao consultar base de dados' }
    }

    const data = await res.json()

    if (data.status === 0 || !data.product) {
      return { success: false, error: 'Produto não encontrado' }
    }

    const p = data.product
    const nutriments = p.nutriments || {}

    const name =
      p.product_name_pt ||
      p.product_name_pt_BR ||
      p.product_name ||
      'Produto desconhecido'

    const brand = p.brands || ''

    const caloriesPer100g =
      nutriments['energy-kcal_100g'] ||
      nutriments['energy-kcal'] ||
      Math.round((nutriments['energy_100g'] || 0) / 4.184) ||
      0

    const food: FoodFromBarcode = {
      name: brand ? `${name} (${brand})` : name,
      brand,
      caloriesPer100g: Math.round(caloriesPer100g),
      carbsPer100g: Math.round(nutriments['carbohydrates_100g'] || 0),
      proteinPer100g: Math.round(nutriments['proteins_100g'] || 0),
      fatPer100g: Math.round(nutriments['fat_100g'] || 0),
      barcode,
    }

    console.log('[Barcode] Encontrado:', food.name, food.caloriesPer100g, 'kcal/100g')
    return { success: true, food }
  } catch (err: any) {
    console.error('[Barcode] Erro:', err)
    return { success: false, error: err.message }
  }
}
