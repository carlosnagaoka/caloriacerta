/**
 * MessageEngine — gera a mensagem certa para o estado certo
 *
 * Pool de mensagens por estado com rotação semanal determinística.
 * A mesma mensagem não aparece toda semana — muda a cada 7 dias,
 * de forma diferente para cada usuário (seed baseado no userId).
 *
 * Regra de ouro do tom:
 * - Nunca culpa. Nunca parabéns excessivos.
 * - Curto, direto, humano.
 * - CTA apenas quando o usuário precisa agir agora.
 */

import type { BehaviorState, BehaviorStatus } from './behavioralEngine'

export type MessageTone =
  | 'encouraging'  // verde
  | 'welcoming'    // azul
  | 'firm'         // âmbar
  | 'confronting'  // vermelho
  | 'celebrating'  // roxo

export interface SmartMessage {
  title: string
  subtitle?: string
  tone: MessageTone
  cta?: string
  ctaHref?: string
  icon: string
}

// ── Pools de mensagens ──────────────────────────────────────────────────────
// 6 mensagens por estado = ciclo de 6 semanas antes de repetir

const POOL: Record<BehaviorStatus, SmartMessage[]> = {
  active: [
    {
      title: 'Você apareceu hoje. Isso vale mais do que perfeição.',
      subtitle: 'Consistência simples vence esforço intenso e raro.',
      tone: 'encouraging',
      icon: '🎯',
    },
    {
      title: 'Cada registro é uma decisão a seu favor.',
      subtitle: 'Você está construindo um padrão.',
      tone: 'encouraging',
      icon: '📈',
    },
    {
      title: 'Seu ritmo está definindo seu resultado.',
      subtitle: 'Não o que você come num dia — o que você repete.',
      tone: 'encouraging',
      icon: '🔥',
    },
    {
      title: 'Registrar é um ato de honestidade com você mesmo.',
      tone: 'encouraging',
      icon: '✅',
    },
    {
      title: 'Você está aqui. Isso não é pequeno.',
      subtitle: 'A maioria desiste antes de criar hábito.',
      tone: 'encouraging',
      icon: '💪',
    },
    {
      title: 'O padrão que você está criando é mais forte do que qualquer dieta.',
      tone: 'encouraging',
      icon: '⚡',
    },
  ],

  returning: [
    {
      title: 'Voltou. Os dias anteriores não contam mais.',
      subtitle: 'O que importa é o próximo registro.',
      tone: 'welcoming',
      cta: 'Registrar agora',
      ctaHref: '/app/refeicao',
      icon: '👋',
    },
    {
      title: 'Voltou. Isso já muda a direção.',
      subtitle: 'Não precisamos de perfeição. Precisamos do próximo passo.',
      tone: 'welcoming',
      cta: 'Próximo passo',
      ctaHref: '/app/refeicao',
      icon: '🔄',
    },
    {
      title: 'A porta estava aberta. Você voltou.',
      subtitle: 'Ainda dá para fechar bem essa semana.',
      tone: 'welcoming',
      cta: 'Começar agora',
      ctaHref: '/app/refeicao',
      icon: '🚪',
    },
    {
      title: 'Recomeçar é sempre a decisão certa.',
      subtitle: 'Sem julgamento. Próximo passo.',
      tone: 'welcoming',
      cta: 'Registrar refeição',
      ctaHref: '/app/refeicao',
      icon: '🌱',
    },
  ],

  inconsistent: [
    {
      title: 'Um dia fora não desfaz o padrão.',
      subtitle: 'Um registro hoje confirma que o padrão continua.',
      tone: 'firm',
      cta: 'Registrar agora',
      ctaHref: '/app/refeicao',
      icon: '⚠️',
    },
    {
      title: 'Você não precisa recomeçar tudo.',
      subtitle: 'Precisa ajustar hoje.',
      tone: 'firm',
      cta: 'Ajustar agora',
      ctaHref: '/app/refeicao',
      icon: '🎯',
    },
    {
      title: 'O problema não é errar uma vez.',
      subtitle: 'É transformar isso em ritmo.',
      tone: 'firm',
      icon: '📊',
    },
    {
      title: 'Seu resultado está sendo decidido agora.',
      subtitle: 'Nos pequenos desvios, não nos grandes.',
      tone: 'firm',
      cta: 'Registrar refeição',
      ctaHref: '/app/refeicao',
      icon: '⏰',
    },
  ],

  absent_short: [
    {
      title: 'Você parou de olhar. Não perdeu o controle.',
      subtitle: 'São coisas diferentes. Volte hoje.',
      tone: 'firm',
      cta: 'Voltar agora',
      ctaHref: '/app/refeicao',
      icon: '👁️',
    },
    {
      title: 'Quanto mais você adia, mais isso vira padrão.',
      subtitle: 'Registre algo hoje. Qualquer coisa.',
      tone: 'firm',
      cta: 'Registrar agora',
      ctaHref: '/app/refeicao',
      icon: '⏳',
    },
    {
      title: 'Silêncio não resolve. Só esconde.',
      subtitle: 'Um registro simples muda a direção.',
      tone: 'firm',
      cta: 'Registrar refeição',
      ctaHref: '/app/refeicao',
      icon: '🔕',
    },
  ],

  absent_long: [
    {
      title: 'Se você não volta agora, isso vira padrão.',
      subtitle: 'Padrões difíceis de mudar depois.',
      tone: 'confronting',
      cta: 'Voltar agora',
      ctaHref: '/app/refeicao',
      icon: '🚨',
    },
    {
      title: 'O app não pode fazer nada sem você aparecer.',
      subtitle: 'Um registro. É o suficiente para hoje.',
      tone: 'confronting',
      cta: 'Um registro agora',
      ctaHref: '/app/refeicao',
      icon: '📵',
    },
    {
      title: 'Você não desistiu. Só parou de aparecer.',
      subtitle: 'Diferença importante. Volte hoje.',
      tone: 'confronting',
      cta: 'Retomar agora',
      ctaHref: '/app/refeicao',
      icon: '🔴',
    },
  ],
}

// ── Mensagens de milestone de streak ───────────────────────────────────────

const MILESTONE_MESSAGES: Record<number, SmartMessage> = {
  3: {
    title: '3 dias seguidos. Isso começa a virar hábito.',
    subtitle: 'Poucos chegam aqui. Continue.',
    tone: 'celebrating',
    icon: '🌟',
  },
  7: {
    title: '7 dias. Você estabeleceu um ritmo real.',
    subtitle: 'Uma semana inteira. Isso é mais raro do que parece.',
    tone: 'celebrating',
    icon: '🏆',
  },
  14: {
    title: 'Duas semanas consistente. Isso é raro.',
    subtitle: 'Seu padrão está mudando de verdade.',
    tone: 'celebrating',
    icon: '🎯',
  },
  21: {
    title: '21 dias. Hábito formado.',
    subtitle: 'Você fez isso. Mantenha.',
    tone: 'celebrating',
    icon: '🧠',
  },
  30: {
    title: '30 dias. Você mudou seu padrão.',
    subtitle: 'Não muita gente chega aqui. Você chegou.',
    tone: 'celebrating',
    icon: '🏅',
  },
  60: {
    title: '2 meses de consistência.',
    subtitle: 'Isso não é sorte. É disciplina.',
    tone: 'celebrating',
    icon: '💎',
  },
  90: {
    title: '90 dias. Você é uma pessoa diferente agora.',
    subtitle: 'Sério. Parabéns.',
    tone: 'celebrating',
    icon: '🌙',
  },
}

// ── Gerador principal ───────────────────────────────────────────────────────

/**
 * Retorna a SmartMessage para o estado atual do usuário.
 * Rotação semanal: a mensagem muda a cada 7 dias, de forma diferente por usuário.
 * O milestone de streak tem prioridade sobre qualquer outro estado.
 */
export function generateSmartMessage(
  state: BehaviorState,
  userId: string
): SmartMessage {
  // Milestone tem prioridade absoluta
  if (state.isStreakMilestone && MILESTONE_MESSAGES[state.streakDays]) {
    return MILESTONE_MESSAGES[state.streakDays]
  }

  const pool = POOL[state.status]

  // Rotação determinística: semana do ano + seed do userId
  // Resultado: mesma mensagem durante a semana, muda na segunda-feira, diferente por usuário
  const weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const userSeed = parseInt(userId.replace(/-/g, '').slice(-6), 16) % 100
  const idx = (weekOfYear + userSeed) % pool.length

  return pool[idx]
}
