'use server'

import { stripe } from '@/lib/stripe'
import { createClient as createAdmin } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─────────────────────────────────────────────────────────────────────────────
// Tipos do plano
// ─────────────────────────────────────────────────────────────────────────────

export interface RefeicaoPlano {
  nome: string
  itens: string[]
  kcal_aprox: number
}

export interface DiaCardapio {
  nome: string
  refeicoes: RefeicaoPlano[]
  total_kcal: number
}

export interface PlanoNutricional {
  intro: string          // Fala direta do "nutricionista" ao usuário
  dias: DiaCardapio[]
  dicas: string[]
  gerado_em: string
}

export interface DiaAtividade {
  dia: string
  tipo: string           // 'Descanso' | 'Cardio' | 'Força' | 'Caminhada' | 'Yoga'
  duracao?: string
  descricao: string
}

export interface PlanoAtividades {
  intro: string
  dias: DiaAtividade[]
  dicas: string[]
  gerado_em: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Gerar plano completo via IA
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPlanoIA(
  userId: string,
  notasNutricionista?: string,
  alimentosExcluidos?: string[]
): Promise<{ cardapio?: PlanoNutricional; atividades?: PlanoAtividades; error?: string }> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('name, sex, age, weight_kg, height_cm, peso_alvo_kg, daily_calorie_goal, tdee, nivel_atividade, objetivo, preferencia_alimentar, preocupacoes_saude, refeicoes_por_dia')
      .eq('id', userId)
      .single()

    if (!profile) return { error: 'Perfil não encontrado.' }

    const temNutricionista = notasNutricionista && notasNutricionista.trim().length > 10
    const temExclusoes = alimentosExcluidos && alimentosExcluidos.length > 0

    const blocoExclusoes = temExclusoes
      ? `\n\nRESTRIÇÕES ABSOLUTAS — Estes alimentos NÃO podem aparecer no plano em hipótese alguma:\n${alimentosExcluidos!.join(', ')}\nUse substitutos nutricionalmente equivalentes e igual praticidade de compra.`
      : ''

    const contexto = [
      `Nome: ${profile.name || 'Usuário'}`,
      `Sexo: ${profile.sex === 'feminino' ? 'Feminino' : 'Masculino'}`,
      `Idade: ${profile.age} anos`,
      `Peso atual: ${profile.weight_kg} kg`,
      profile.height_cm ? `Altura: ${profile.height_cm} cm` : null,
      profile.peso_alvo_kg ? `Peso meta: ${profile.peso_alvo_kg} kg` : null,
      `Meta calórica diária: ${profile.daily_calorie_goal} kcal`,
      profile.tdee ? `TDEE calculado: ${profile.tdee} kcal` : null,
      `Nível de atividade: ${profile.nivel_atividade || 'moderado'}`,
      `Objetivo: ${profile.objetivo || 'emagrecer'}`,
      profile.preferencia_alimentar ? `Preferência alimentar: ${profile.preferencia_alimentar}` : null,
      profile.preocupacoes_saude?.length ? `Preocupações de saúde: ${profile.preocupacoes_saude.join(', ')}` : null,
      `Refeições por dia: ${profile.refeicoes_por_dia || 4}`,
      'Contexto: Brasileiro(a) vivendo no Japão. Incluir alimentos acessíveis nos supermercados japoneses E opções brasileiras.',
    ].filter(Boolean).join('\n')

    const regrasCaloricas = `
REGRAS DE CÁLCULO CALÓRICO — OBRIGATÓRIAS:
Calcule kcal_aprox somando cada ingrediente com base em valores nutricionais reais (TACO / USDA).
Referências obrigatórias (kcal por 100g salvo indicação):
- Frango peito grelhado: 110 kcal/100g
- Frango coxa/sobrecoxa: 180 kcal/100g
- Carne bovina magra: 150 kcal/100g
- Peixe branco (tilápia, bacalhau): 90 kcal/100g
- Salmão: 180 kcal/100g
- Atum em água (escorrido): 100 kcal/100g
- Ovo inteiro: 70 kcal/unidade
- Arroz branco cozido: 130 kcal/100g
- Arroz integral cozido: 125 kcal/100g
- Feijão cozido: 77 kcal/100g
- Macarrão cozido: 160 kcal/100g
- Soba cozido: 130 kcal/100g
- Udon cozido: 105 kcal/100g
- Tofu firme: 76 kcal/100g
- Onigiri (médio, 100g): 190 kcal/unidade
- Edamame cozido: 110 kcal/100g
- Pão de forma integral (fatia 25g): 65 kcal
- Banana (média): 89 kcal/100g
- Maçã (média): 52 kcal/100g
- Folhas verdes (alface, rúcula, espinafre): 20 kcal/100g
- Tomate: 18 kcal/100g
- Pepino: 15 kcal/100g
- Cenoura: 41 kcal/100g
- Brócolis cozido: 35 kcal/100g
- Azeite de oliva: 884 kcal/100g (1 col. sopa ≈ 13.5g = 119 kcal)
- Manteiga: 717 kcal/100g (1 col. chá ≈ 5g = 36 kcal)
- Leite integral: 61 kcal/100ml
- Iogurte natural integral: 61 kcal/100g
- Queijo mussarela: 280 kcal/100g
- Whey protein (1 dose 30g): 110 kcal
- Miso (pasta, 1 col. sopa ≈ 18g): 35 kcal
- Yakitori (espeto 30g): 65 kcal
- Natto (1 pacote 50g): 95 kcal

Para ingredientes não listados, use TACO/USDA e estime conservadoramente.
NUNCA arredonde para cima. Prefira subestimar levemente a superestimar.
O total_kcal do dia DEVE ser a soma real dos kcal_aprox de cada refeição.`

    const systemPrompt = temNutricionista
      ? `Você é um assistente que ajuda o usuário a seguir as orientações do nutricionista dele.
Sua função é transformar as anotações do nutricionista em um cardápio semanal prático e em um plano de atividades físicas.
Siga RIGOROSAMENTE as diretrizes informadas. Quando algo não estiver especificado, use bom senso nutricional.
${regrasCaloricas}
Responda APENAS com JSON válido, sem markdown, sem comentários.`
      : `Você é um nutricionista experiente e direto, especializado em brasileiros vivendo no Japão.
Você conhece os supermercados japoneses (イオン, コープ, etc.), sabe quais alimentos brasileiros estão disponíveis no Japão,
e cria planos práticos — não planos de revista que ninguém consegue seguir.
Fale diretamente com o usuário, em primeira pessoa, como um bom amigo que é nutricionista.
${regrasCaloricas}
Responda APENAS com JSON válido, sem markdown, sem comentários.`

    const userPrompt = temNutricionista
      ? `Perfil do usuário:
${contexto}

Orientações do nutricionista:
${notasNutricionista}${blocoExclusoes}

Crie:
1. Um cardápio semanal (7 dias) respeitando TODAS as orientações acima.
2. Um plano de atividades físicas semanal compatível com o objetivo.

Responda neste JSON exato:
{
  "cardapio": {
    "intro": "Fala curta (2-3 frases) explicando como o cardápio segue as orientações do nutricionista",
    "dias": [
      {
        "nome": "Segunda-feira",
        "refeicoes": [
          { "nome": "Café da manhã", "itens": ["item1 (quantidade)", "item2"], "kcal_aprox": 350 }
        ],
        "total_kcal": 1600
      }
    ],
    "dicas": ["dica prática 1", "dica prática 2", "dica prática 3"]
  },
  "atividades": {
    "intro": "Fala curta explicando o plano de exercícios",
    "dias": [
      { "dia": "Segunda", "tipo": "Força", "duracao": "45 min", "descricao": "Descrição do treino" }
    ],
    "dicas": ["dica 1", "dica 2"]
  }
}`
      : `Perfil do usuário:
${contexto}${blocoExclusoes}

Crie um plano completo personalizado para este usuário.
Use alimentos que ele realmente encontra no Japão: tofu, miso, natto, onigiri, yakitori, edamame, soba, udon — misturado com clássicos brasileiros como arroz, feijão, frango, ovo, banana.
Seja realista: não coloque quinoa orgânica nem ingredientes difíceis.

Responda neste JSON exato:
{
  "cardapio": {
    "intro": "Mensagem pessoal (3-4 frases) falando diretamente com ${profile.name || 'o usuário'} sobre o cardápio — por que essas escolhas, o que priorizar",
    "dias": [
      {
        "nome": "Segunda-feira",
        "refeicoes": [
          { "nome": "Café da manhã", "itens": ["item1 (quantidade)", "item2"], "kcal_aprox": 350 },
          { "nome": "Almoço", "itens": ["item1 (quantidade)", "item2"], "kcal_aprox": 550 },
          { "nome": "Lanche", "itens": ["item1", "item2"], "kcal_aprox": 200 },
          { "nome": "Jantar", "itens": ["item1", "item2"], "kcal_aprox": 450 }
        ],
        "total_kcal": 1550
      }
    ],
    "dicas": ["dica prática e específica 1", "dica 2", "dica 3"]
  },
  "atividades": {
    "intro": "Mensagem pessoal (2-3 frases) sobre o plano de atividades físicas — tom encorajador e realista",
    "dias": [
      { "dia": "Segunda", "tipo": "Força", "duracao": "40 min", "descricao": "Descrição clara e motivadora do treino" },
      { "dia": "Terça", "tipo": "Cardio", "duracao": "30 min", "descricao": "..." },
      { "dia": "Quarta", "tipo": "Descanso", "descricao": "Descanso ativo — caminhada leve, alongamento" },
      { "dia": "Quinta", "tipo": "Força", "duracao": "40 min", "descricao": "..." },
      { "dia": "Sexta", "tipo": "Cardio", "duracao": "30 min", "descricao": "..." },
      { "dia": "Sábado", "tipo": "Caminhada", "duracao": "45 min", "descricao": "..." },
      { "dia": "Domingo", "tipo": "Descanso", "descricao": "Recuperação total" }
    ],
    "dicas": ["dica específica e prática 1", "dica 2"]
  }
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const text = response.choices[0]?.message?.content?.trim() || '{}'
    const data = JSON.parse(text)

    const agora = new Date().toISOString()
    const cardapio: PlanoNutricional = { ...data.cardapio, gerado_em: agora }
    const atividades: PlanoAtividades = { ...data.atividades, gerado_em: agora }

    // Salva no perfil do usuário
    await supabaseAdmin
      .from('users')
      .update({
        plano_nutricional: cardapio,
        plano_atividades: atividades,
        plano_gerado_em: agora,
        ...(notasNutricionista !== undefined ? { notas_nutricionista: notasNutricionista } : {}),
      })
      .eq('id', userId)

    return { cardapio, atividades }
  } catch (err: any) {
    console.error('[gerarPlanoIA]', err)
    return { error: err.message || 'Erro ao gerar plano.' }
  }
}

export async function salvarNotasNutricionista(
  userId: string,
  notas: string
): Promise<{ success: boolean }> {
  await supabaseAdmin
    .from('users')
    .update({ notas_nutricionista: notas })
    .eq('id', userId)
  return { success: true }
}

/**
 * Cria uma sessão no Stripe Customer Portal.
 * Permite ao usuário: cancelar, trocar plano, atualizar cartão.
 */
export async function criarPortalSession(
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return { error: 'Nenhuma assinatura ativa encontrada.' }
    }

    const baseUrl = 'https://caloriacerta.vercel.app'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/app/plano`,
    })

    return { url: session.url }
  } catch (err: any) {
    return { error: err.message }
  }
}
