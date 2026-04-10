'use server'

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function estimarCalorias(nomeAlimento: string): Promise<{
  caloriesPer100g: number
  confidence: 'alta' | 'media' | 'baixa'
  nota?: string
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um nutricionista especialista em tabelas nutricionais brasileiras e japonesas.
Responda APENAS com JSON válido, sem markdown, sem explicações.`,
        },
        {
          role: 'user',
          content: `Estime as calorias por 100g de: "${nomeAlimento}"

Responda exatamente neste formato JSON:
{
  "caloriesPer100g": 150,
  "confidence": "alta",
  "nota": "receita caseira típica"
}

confidence pode ser: "alta" (alimento simples conhecido), "media" (receita comum), "baixa" (muito variável)`,
        },
      ],
      max_tokens: 100,
      temperature: 0.2,
    })

    const text = response.choices[0]?.message?.content?.trim() || '{}'
    const data = JSON.parse(text)

    return {
      caloriesPer100g: Math.round(data.caloriesPer100g || 0),
      confidence: data.confidence || 'baixa',
      nota: data.nota,
    }
  } catch (err) {
    console.error('[EstimarCalorias] Erro:', err)
    return { caloriesPer100g: 0, confidence: 'baixa', nota: 'Erro na estimativa' }
  }
}
