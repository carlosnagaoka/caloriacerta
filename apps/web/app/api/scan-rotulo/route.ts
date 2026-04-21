import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are a Japanese food nutrition label parser. Analyze this image and extract nutritional information from the 栄養成分表示 (nutrition facts) table.

Look for these fields (Japanese → meaning):
- エネルギー → calories (kcal)
- たんぱく質 → protein (g)
- 脂質 → fat (g)
- 炭水化物 → total carbohydrates (g)
- 食塩相当量 → sodium equivalent (g)

Also identify the serving size — look for patterns like:
- "1食分(150g)" → servingGrams = 150
- "100gあたり" → servingGrams = 100
- "1袋(200g)" → servingGrams = 200
- "1個(80g)" → servingGrams = 80

If values are already "per 100g", set servingGrams = 100 and values equal to per100g.
Otherwise, calculate per100g = (perServing / servingGrams) * 100.

Return ONLY this JSON, no other text:
{
  "found": true,
  "productName": "product name in Japanese if visible, else null",
  "servingLabel": "e.g. '1食分 (150g)' or '100gあたり'",
  "servingGrams": 100,
  "caloriesPerServing": 0,
  "proteinPerServing": 0,
  "carbsPerServing": 0,
  "fatPerServing": 0,
  "sodiumPerServing": 0,
  "caloriesPer100g": 0,
  "proteinPer100g": 0,
  "carbsPer100g": 0,
  "fatPer100g": 0
}

If you cannot find a nutrition label in the image, return:
{ "found": false, "error": "Nenhuma tabela nutricional encontrada na imagem" }`,
            },
          ],
        },
      ],
    })

    const raw = (message.content[0] as any).text || ''
    console.log('[ScanRotulo] Raw response:', raw.slice(0, 300))

    // Extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'IA não retornou dados válidos' }, { status: 422 })
    }

    const result = JSON.parse(jsonMatch[0])

    if (!result.found) {
      return NextResponse.json({ error: result.error || 'Rótulo não encontrado' }, { status: 422 })
    }

    // Ensure per100g values are calculated
    const sg = result.servingGrams || 100
    const safe = (v: any) => Math.round(parseFloat(v) || 0)

    const normalized = {
      productName:       result.productName || null,
      servingLabel:      result.servingLabel || `${sg}g`,
      servingGrams:      sg,
      caloriesPerServing: safe(result.caloriesPerServing),
      proteinPerServing:  safe(result.proteinPerServing),
      carbsPerServing:    safe(result.carbsPerServing),
      fatPerServing:      safe(result.fatPerServing),
      sodiumPerServing:   safe(result.sodiumPerServing),
      caloriesPer100g:   result.caloriesPer100g ? safe(result.caloriesPer100g) : Math.round((safe(result.caloriesPerServing) / sg) * 100),
      proteinPer100g:    result.proteinPer100g  ? safe(result.proteinPer100g)  : Math.round((safe(result.proteinPerServing)  / sg) * 100),
      carbsPer100g:      result.carbsPer100g    ? safe(result.carbsPer100g)    : Math.round((safe(result.carbsPerServing)    / sg) * 100),
      fatPer100g:        result.fatPer100g      ? safe(result.fatPer100g)      : Math.round((safe(result.fatPerServing)      / sg) * 100),
    }

    console.log('[ScanRotulo] Parsed:', normalized)
    return NextResponse.json({ success: true, data: normalized })

  } catch (err: any) {
    console.error('[ScanRotulo] Erro:', err.message)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
