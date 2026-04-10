/**
 * CorrectionEngine — uma missão por semana, específica e temporal
 *
 * Princípio: nunca dar 5 recomendações ao mesmo tempo.
 * A correção mais estratégica do momento — e só essa.
 *
 * A missão muda toda segunda-feira (por semana calendário).
 * É determinística: a mesma semana gera a mesma missão para o usuário.
 *
 * Tom: direto, específico, sem julgamento.
 * Não: "tente comer menos à noite"
 * Sim: "Defina um limite para o jantar: no máximo 500 kcal."
 */

import type { PatternType } from './patternEngine'

export type CorrectionDifficulty = 'facil' | 'media' | 'dificil'

export interface Correction {
  badge: string           // "Missão desta semana"
  instruction: string     // a instrução exata e acionável
  why: string             // por que isso importa agora
  difficulty: CorrectionDifficulty
  type: PatternType
}

// ── Uma correção por padrão, com variações semanais ─────────────────────────
// Cada padrão tem 3 variações — ciclo de 3 semanas antes de repetir.

const CORRECTIONS: Record<PatternType, Correction[]> = {
  snacking: [
    {
      badge: 'Missão desta semana',
      instruction: 'Nada entre as refeições principais. Se sentir fome antes da hora, beba água e espere 20 minutos.',
      why: 'Seus lanches representam mais de 30% das suas calorias. Não é o almoço que está pesando — é o que vem depois.',
      difficulty: 'media',
      type: 'snacking',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Se for lanchar, registre antes de comer. Só isso — registrar antes.',
      why: 'Tornar o lanche consciente reduz automaticamente a quantidade consumida.',
      difficulty: 'facil',
      type: 'snacking',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Estabeleça dois horários fixos para lanches (ex: 10h e 15h). Fora desses horários, não há lanche.',
      why: 'Horário fixo elimina decisões impulsivas. Decisão impulsiva = excesso.',
      difficulty: 'media',
      type: 'snacking',
    },
  ],

  late_overeating: [
    {
      badge: 'Missão desta semana',
      instruction: 'Teto para o jantar: 500 kcal. Registre o jantar antes de terminar de comer.',
      why: 'Seu jantar está consumindo mais de 40% das suas calorias. Um teto claro muda o comportamento na hora da decisão.',
      difficulty: 'media',
      type: 'late_overeating',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Jante antes das 20h. Independentemente do que comer, o horário muda o padrão.',
      why: 'Quem come tarde tende a comer mais. O horário não é detalhe — é parte do hábito.',
      difficulty: 'facil',
      type: 'late_overeating',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Coma proteína no almoço. Quem come proteína suficiente no almoço chega ao jantar com menos fome.',
      why: 'Seu excesso no jantar começa nas escolhas do almoço.',
      difficulty: 'facil',
      type: 'late_overeating',
    },
  ],

  weekend_excess: [
    {
      badge: 'Missão deste fim de semana',
      instruction: 'No sábado e domingo, registre tudo — mesmo o que você não queria registrar.',
      why: 'Seu fim de semana consome significativamente mais calorias que a semana. O que não é registrado não pode ser melhorado.',
      difficulty: 'facil',
      type: 'weekend_excess',
    },
    {
      badge: 'Missão deste fim de semana',
      instruction: 'Escolha um refeição do fim de semana para manter dentro da meta. Só uma.',
      why: 'Não pedimos perfeição no final de semana. Pedimos uma âncora.',
      difficulty: 'facil',
      type: 'weekend_excess',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Planeje o sábado antes de chegar nele. Decida uma refeição com antecedência.',
      why: 'A maioria dos excessos de fim de semana não é fome — é falta de planejamento.',
      difficulty: 'media',
      type: 'weekend_excess',
    },
  ],

  breakfast_skipper: [
    {
      badge: 'Missão desta semana',
      instruction: 'Café da manhã todos os dias, mesmo que pequeno. Um ovo e uma fruta já contam.',
      why: 'Quem pula o café tende a compensar no jantar. O padrão começa de manhã.',
      difficulty: 'facil',
      type: 'breakfast_skipper',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Prepare o café da manhã na noite anterior. Remova a barreira da manhã.',
      why: 'Hábitos não falham por falta de vontade. Falham por falta de facilidade.',
      difficulty: 'facil',
      type: 'breakfast_skipper',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Registre o café da manhã todos os dias, mesmo que seja só café com leite.',
      why: 'Tornar o café da manhã visível no app cria responsabilidade. Responsabilidade cria consistência.',
      difficulty: 'facil',
      type: 'breakfast_skipper',
    },
  ],

  calorie_spikes: [
    {
      badge: 'Missão desta semana',
      instruction: 'Defina uma faixa: entre 1.400 e 1.800 kcal por dia (ou ajuste à sua meta). Tente ficar dentro.',
      why: 'Seus dias variam muito entre si. Alta variância dificulta o controle de peso e desorientam o metabolismo.',
      difficulty: 'media',
      type: 'calorie_spikes',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Nos dias acima da meta, identifique qual refeição causou o desvio. Só identifique — sem punição.',
      why: 'Entender o padrão é o primeiro passo para corrigi-lo.',
      difficulty: 'facil',
      type: 'calorie_spikes',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Planeje o almoço com antecedência 3 vezes esta semana.',
      why: 'A maioria dos dias de pico calórico começa com almoço impulsivo.',
      difficulty: 'media',
      type: 'calorie_spikes',
    },
  ],

  under_logging: [
    {
      badge: 'Missão desta semana',
      instruction: 'Registre pelo menos uma refeição por dia — qualquer uma, todos os dias.',
      why: 'O app não pode ajudar sem dados. Um registro por dia já é suficiente para começar a análise.',
      difficulty: 'facil',
      type: 'under_logging',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Escolha uma refeição fixa (ex: almoço) e registre ela todos os dias desta semana.',
      why: 'Criar consistência em uma refeição é mais poderoso do que registros esporádicos de tudo.',
      difficulty: 'facil',
      type: 'under_logging',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Abra o app todo dia. Mesmo que não registre — abrir cria o hábito de registrar.',
      why: 'O comportamento começa com a ação mais simples possível.',
      difficulty: 'facil',
      type: 'under_logging',
    },
  ],

  breakfast_anchor: [
    {
      badge: 'Missão desta semana',
      instruction: 'Você já tem o café da manhã. Agora proteja o almoço com a mesma consistência.',
      why: 'Âncoras se constroem uma de cada vez. O café está estável — o próximo passo é o almoço.',
      difficulty: 'media',
      type: 'breakfast_anchor',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Registre o jantar todos os dias desta semana.',
      why: 'Você é consistente de manhã. A lacuna está no registro do final do dia.',
      difficulty: 'media',
      type: 'breakfast_anchor',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Mantenha o que está funcionando. Sua única missão esta semana é continuar.',
      why: 'Padrões saudáveis se quebram por excesso de mudanças. Às vezes manter é o trabalho.',
      difficulty: 'facil',
      type: 'breakfast_anchor',
    },
  ],

  consistent_logger: [
    {
      badge: 'Missão desta semana',
      instruction: 'Você está registrando bem. Agora adicione o peso corporal uma vez por dia.',
      why: 'Com histórico de refeições sólido, o próximo dado mais valioso é o peso diário.',
      difficulty: 'facil',
      type: 'consistent_logger',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Adicione detalhes nas refeições: peso dos alimentos em gramas, não só o nome.',
      why: 'Mais precisão = análise mais útil = resultados mais previsíveis.',
      difficulty: 'media',
      type: 'consistent_logger',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Mantenha o ritmo. Sua missão é não quebrar o streak.',
      why: 'Consistência composta gera resultado composto.',
      difficulty: 'facil',
      type: 'consistent_logger',
    },
  ],

  balanced: [
    {
      badge: 'Missão desta semana',
      instruction: 'Continue registrando com a mesma frequência. Consistência é a missão.',
      why: 'Não há desvio crítico no momento. O trabalho agora é manter.',
      difficulty: 'facil',
      type: 'balanced',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Adicione o registro de peso diário para refinar as projeções.',
      why: 'Com o padrão alimentar estável, o próximo dado mais valioso é o peso.',
      difficulty: 'facil',
      type: 'balanced',
    },
    {
      badge: 'Missão desta semana',
      instruction: 'Foque em detalhar melhor cada refeição: ingredientes, pesos, horários.',
      why: 'Dados melhores geram insights melhores. Seu padrão está estável para ir mais fundo.',
      difficulty: 'media',
      type: 'balanced',
    },
  ],

  insufficient_data: [
    {
      badge: 'Primeira missão',
      instruction: 'Registre pelo menos uma refeição hoje.',
      why: 'Tudo começa com o primeiro dado. Sem registro, não há análise.',
      difficulty: 'facil',
      type: 'insufficient_data',
    },
  ],
}

/**
 * Retorna a correção da semana para o padrão detectado.
 * Rotação: muda toda segunda-feira, ciclo de 3 semanas.
 */
export function getWeeklyCorrection(
  patternType: PatternType,
  userId: string
): Correction {
  const pool = CORRECTIONS[patternType] ?? CORRECTIONS['insufficient_data']

  // Rotação semanal — reset toda segunda-feira
  const weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const userSeed = parseInt(userId.replace(/-/g, '').slice(-4), 16) % 100
  const idx = (weekOfYear + userSeed) % pool.length

  return pool[idx]
}
