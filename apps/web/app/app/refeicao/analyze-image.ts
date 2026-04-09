'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeFoodImage(imageUrl: string) {
  console.log('[OpenAI] Analisando imagem:', imageUrl.slice(0, 80))

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um nutricionista especializado em identificar alimentos em fotos.
Analise a imagem e retorne APENAS um JSON no formato:
{
  "foods": [
    {"name": "nome do alimento em português", "estimatedWeightGrams": 150, "caloriesPer100g": 130, "confidence": 0.85}
  ],
  "totalEstimatedCalories": 450
}
Inclua caloriesPer100g (kcal por 100g) para cada alimento com base em valores nutricionais médios conhecidos.
Seja realista nas estimativas de peso. Confiança deve ser entre 0 e 1.
Retorne SOMENTE o JSON, sem texto adicional.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identifique os alimentos nesta foto e estime as calorias.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || '{}'
    console.log('[OpenAI] Resposta bruta:', content.slice(0, 200))

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[OpenAI] Resposta sem JSON:', content)
      return { success: false, error: 'Resposta inválida da IA' }
    }

    const result = JSON.parse(jsonMatch[0])
    console.log('[OpenAI] Resultado:', result)

    return {
      success: true,
      foods: result.foods || [],
      totalCalories: result.totalEstimatedCalories || 0,
    }
  } catch (err: any) {
    console.error('[OpenAI] Erro:', err?.message || err)
    return { success: false, error: err.message }
  }
}
