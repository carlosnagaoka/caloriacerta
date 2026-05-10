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
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
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
              text: `Você é um nutricionista especializado em culinária japonesa e brasileira.
Analise esta foto de refeição e identifique TODOS os alimentos visíveis.

Para cada alimento:
- Use o nome em português (ex: "Onigiri de salmão", "Arroz branco", "Missoshiru", "Frango grelhado")
- Estime o peso em gramas considerando tamanho típico de porção
- Calcule kcal/100g com base em valores nutricionais médios reais
- Estime proteína, carboidratos e gordura por 100g

Referências de alimentos japoneses comuns:
- Onigiri: ~185kcal/100g (prot 4g, carb 40g, gord 1g)
- Arroz branco japonês: ~168kcal/100g (prot 3g, carb 37g, gord 0g)
- Missoshiru: ~40kcal/100g (prot 3g, carb 4g, gord 1g)
- Tonkatsu: ~290kcal/100g (prot 18g, carb 15g, gord 18g)
- Gyudon (carne sobre arroz): ~140kcal/100g (prot 8g, carb 19g, gord 4g)
- Ramen: ~100kcal/100g (prot 6g, carb 14g, gord 3g)
- Sushi (nigiri): ~150kcal/100g (prot 8g, carb 23g, gord 2g)
- Tempura: ~230kcal/100g (prot 8g, carb 20g, gord 14g)
- Edamame: ~120kcal/100g (prot 11g, carb 9g, gord 5g)
- Karaage: ~270kcal/100g (prot 18g, carb 12g, gord 17g)

Retorne SOMENTE este JSON, sem texto adicional:
{
  "encontrou": true,
  "descricao": "Breve descrição da refeição (ex: 'Bento box com arroz, frango e salada')",
  "itens": [
    {
      "nome": "nome do alimento em português",
      "pesoGramas": 150,
      "caloriasPor100g": 185,
      "proteinaPor100g": 4,
      "carbsPor100g": 40,
      "gorduraPor100g": 1,
      "confianca": 0.85
    }
  ],
  "totalKcal": 450
}

Se não houver alimentos visíveis na imagem, retorne:
{ "encontrou": false, "erro": "Nenhum alimento identificado na imagem" }`,
            },
          ],
        },
      ],
    })

    const raw = (message.content[0] as any).text || ''
    console.log('[AnalisarFoto] Raw:', raw.slice(0, 400))

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'IA não retornou dados válidos' }, { status: 422 })
    }

    const result = JSON.parse(jsonMatch[0])

    if (!result.encontrou) {
      return NextResponse.json({ error: result.erro || 'Nenhum alimento identificado' }, { status: 422 })
    }

    // Sanitize and normalize
    const safe = (v: any, fallback = 0) => {
      const n = parseFloat(v)
      return isNaN(n) ? fallback : Math.round(n)
    }

    const itens = (result.itens || []).map((item: any) => ({
      nome:            item.nome || 'Alimento',
      pesoGramas:      safe(item.pesoGramas, 100),
      caloriasPor100g: safe(item.caloriasPor100g, 0),
      proteinaPor100g: safe(item.proteinaPor100g, 0),
      carbsPor100g:    safe(item.carbsPor100g, 0),
      gorduraPor100g:  safe(item.gorduraPor100g, 0),
      confianca:       Math.min(1, Math.max(0, parseFloat(item.confianca) || 0.7)),
    }))

    const totalKcal = itens.reduce(
      (sum: number, i: any) => sum + Math.round((i.pesoGramas * i.caloriasPor100g) / 100),
      0
    )

    return NextResponse.json({
      success: true,
      descricao: result.descricao || '',
      itens,
      totalKcal,
    })

  } catch (err: any) {
    console.error('[AnalisarFoto] Erro:', err.message)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
