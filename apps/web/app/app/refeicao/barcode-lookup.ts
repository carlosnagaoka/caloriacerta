'use server'

export interface FoodFromBarcode {
  name: string
  brand: string
  caloriesPer100g: number
  carbsPer100g: number
  proteinPer100g: number
  fatPer100g: number
  barcode: string
  country?: string // 'JP' | 'BR' | 'other'
}

// Detecta origem pelo prefixo do código de barras (JAN = EAN-13)
function detectCountry(barcode: string): string {
  const prefix = parseInt(barcode.slice(0, 3))
  if (prefix >= 450 && prefix <= 459) return 'JP'  // JAN Japan
  if (prefix >= 490 && prefix <= 499) return 'JP'  // JAN Japan
  if (prefix >= 789 && prefix <= 790) return 'BR'  // GS1 Brasil
  return 'other'
}

// Extrai o melhor nome disponível priorizando PT > EN > JA
function extractName(p: any): string {
  return (
    p.product_name_pt ||
    p.product_name_pt_BR ||
    p.product_name_en ||
    p.product_name_ja ||
    p.product_name ||
    ''
  ).trim()
}

// Calcula kcal/100g de diferentes formatos da API
function extractCalories(nutriments: any): number {
  const kcal =
    nutriments['energy-kcal_100g'] ??
    nutriments['energy-kcal_serving'] ??
    (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0)
  return Math.round(kcal || 0)
}

async function fetchOpenFoodFacts(barcode: string, host: string) {
  const res = await fetch(
    `https://${host}/api/v0/product/${barcode}.json`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  if (data.status === 0 || !data.product) return null
  return data.product
}

export async function lookupBarcode(barcode: string): Promise<
  { success: true; food: FoodFromBarcode } | { success: false; error: string }
> {
  try {
    const country = detectCountry(barcode)
    console.log('[Barcode] Buscando:', barcode, '| País detectado:', country)

    // Estratégia de busca: tenta hosts em ordem de relevância
    const hosts =
      country === 'JP'
        ? ['jp.openfoodfacts.org', 'world.openfoodfacts.org']
        : country === 'BR'
        ? ['br.openfoodfacts.org', 'world.openfoodfacts.org']
        : ['world.openfoodfacts.org', 'jp.openfoodfacts.org']

    let product: any = null
    for (const host of hosts) {
      product = await fetchOpenFoodFacts(barcode, host)
      if (product) {
        console.log('[Barcode] Encontrado em:', host)
        break
      }
    }

    if (!product) {
      const msg =
        country === 'JP'
          ? '商品が見つかりませんでした / Produto japonês não encontrado'
          : 'Produto não encontrado na base de dados'
      return { success: false, error: msg }
    }

    const nutriments = product.nutriments || {}
    const name = extractName(product)
    const brand = (product.brands || '').split(',')[0].trim()

    if (!name) {
      return { success: false, error: 'Produto encontrado mas sem nome cadastrado' }
    }

    const food: FoodFromBarcode = {
      name: brand ? `${name} (${brand})` : name,
      brand,
      caloriesPer100g: extractCalories(nutriments),
      carbsPer100g:    Math.round(nutriments['carbohydrates_100g'] || 0),
      proteinPer100g:  Math.round(nutriments['proteins_100g']      || 0),
      fatPer100g:      Math.round(nutriments['fat_100g']           || 0),
      barcode,
      country,
    }

    console.log('[Barcode] Resultado:', food.name, food.caloriesPer100g, 'kcal/100g', '|', country)
    return { success: true, food }

  } catch (err: any) {
    console.error('[Barcode] Erro:', err)
    return { success: false, error: err.message }
  }
}
