'use client'

interface WeightLog {
  logged_at: string
  weight_kg: number
}

interface Profile {
  weight_kg: number
  peso_alvo_kg: number | null
  tdee: number | null
  daily_calorie_goal: number | null
  objetivo: string | null
}

interface Props {
  profile: Profile
  pesos: WeightLog[]
}

/**
 * Projeta semana a semana o peso esperado, com adaptação metabólica.
 * A cada kg perdido, o TDEE cai ~10 kcal/dia (metabolismo se adapta).
 * Isso torna a curva não-linear — mais honesta que uma linha reta.
 */
function projetarSemanas(
  pesoPartida: number,
  pesoMeta: number,
  tdee: number,
  metaCalorica: number,
  maxSemanas = 104
): { semana: number; peso: number }[] {
  const pontos: { semana: number; peso: number }[] = []
  let peso = pesoPartida
  const deficitBase = tdee - metaCalorica

  for (let s = 0; s <= maxSemanas; s++) {
    pontos.push({ semana: s, peso: Math.round(peso * 10) / 10 })
    if (peso <= pesoMeta + 0.05) break

    // Adaptação metabólica: -10 kcal/dia por kg perdido (cap em -20% do TDEE)
    const kgPerdidos = Math.max(pesoPartida - peso, 0)
    const tdeeAdaptado = Math.max(tdee - kgPerdidos * 10, tdee * 0.8)
    const deficitReal = Math.max(Math.min(deficitBase, tdeeAdaptado - 1200), 50)
    const perdaSemana = (deficitReal * 7) / 7700
    peso = Math.max(peso - perdaSemana, pesoMeta)
  }

  return pontos
}

function formatarData(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function addSemanas(date: Date, semanas: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + semanas * 7)
  return d
}

export default function ProjecaoCard({ profile, pesos }: Props) {
  // Só mostra para quem quer emagrecer e tem meta definida
  if (
    profile.objetivo !== 'emagrecer' ||
    !profile.peso_alvo_kg ||
    !profile.tdee ||
    !profile.daily_calorie_goal
  ) {
    return null
  }

  // Usa peso mais recente (log ou perfil)
  const pesoPartida =
    pesos.length > 0 ? Number(pesos[0].weight_kg) : Number(profile.weight_kg)
  const pesoMeta = Number(profile.peso_alvo_kg)
  const tdee = Number(profile.tdee)
  const metaCalorica = Number(profile.daily_calorie_goal)

  if (pesoPartida <= pesoMeta) {
    return (
      <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
        <p className="text-2xl">🎉</p>
        <p className="font-bold text-green-700 mt-1">Meta atingida!</p>
        <p className="text-xs text-green-600 mt-0.5">
          Você chegou em {pesoPartida} kg — parabéns!
        </p>
      </div>
    )
  }

  const semanas = projetarSemanas(pesoPartida, pesoMeta, tdee, metaCalorica)
  const semanasTotal = semanas.length - 1
  const dataGoal = addSemanas(new Date(), semanasTotal)

  // Peso real logado (histórico)
  const pesosOrdenados = [...pesos].reverse() // do mais antigo para o mais recente

  // ── SVG ────────────────────────────────────────────────────────────────
  const VW = 300
  const VH = 110
  const PAD = { left: 36, right: 12, top: 12, bottom: 24 }
  const plotW = VW - PAD.left - PAD.right
  const plotH = VH - PAD.top - PAD.bottom

  const pesoMax = pesoPartida + 0.5
  const pesoMin = pesoMeta - 0.5
  const pesoRange = pesoMax - pesoMin

  const xOf = (semana: number) => PAD.left + (semana / semanasTotal) * plotW
  const yOf = (peso: number) => PAD.top + ((pesoMax - peso) / pesoRange) * plotH

  // Curva de projeção (smooth bezier)
  // Subamostra para no máximo 20 pontos para performance
  const step = Math.max(1, Math.floor(semanas.length / 20))
  const sampled = semanas.filter((_, i) => i % step === 0 || i === semanas.length - 1)

  let projecaoPath = `M ${xOf(sampled[0].semana)},${yOf(sampled[0].peso)}`
  for (let i = 1; i < sampled.length; i++) {
    const prev = sampled[i - 1]
    const curr = sampled[i]
    const cpx = xOf(prev.semana) + (xOf(curr.semana) - xOf(prev.semana)) / 2
    projecaoPath += ` C ${cpx},${yOf(prev.peso)} ${cpx},${yOf(curr.peso)} ${xOf(curr.semana)},${yOf(curr.peso)}`
  }

  // Área preenchida abaixo da curva
  const areaPath =
    projecaoPath +
    ` L ${xOf(semanasTotal)},${VH - PAD.bottom} L ${xOf(0)},${VH - PAD.bottom} Z`

  // Linha de peso real (logs)
  let realPath = ''
  if (pesosOrdenados.length >= 2) {
    const hoje = new Date()
    pesosOrdenados.forEach((p, i) => {
      const dias =
        (new Date(p.logged_at).getTime() - hoje.getTime()) / 86400000 +
        pesosOrdenados.length * 7
      // mapeia a posição histórica proporcionalmente
      const semanaEquiv = Math.max(
        0,
        (new Date(p.logged_at).getTime() - new Date().getTime()) / (7 * 86400000) +
          semanasTotal * 0.05 // offset para ficar no início
      )
      const x = Math.max(PAD.left, xOf(semanaEquiv))
      const y = yOf(Number(p.weight_kg))
      realPath += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`
    })
  }

  // Labels do eixo Y (4 marcadores)
  const yLabels = [pesoMax, pesoPartida, (pesoPartida + pesoMeta) / 2, pesoMeta].map(
    w => ({ peso: Math.round(w * 10) / 10, y: yOf(Math.round(w * 10) / 10) })
  )

  // Ritmo semanal médio
  const ritmoSemanal =
    semanasTotal > 0
      ? Math.round(((pesoPartida - pesoMeta) / semanasTotal) * 100) / 100
      : 0

  // Progresso já feito (se tem logs)
  const progressoKg =
    pesos.length > 0
      ? Math.max(0, Math.round((Number(profile.weight_kg) - Number(pesos[0].weight_kg)) * 10) / 10)
      : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
          Projeção de peso
        </p>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">
          Você atingirá{' '}
          <span className="text-green-600">{pesoMeta} kg</span>{' '}
          até{' '}
          <span className="text-green-600">{formatarData(dataGoal)}</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Ritmo: −{ritmoSemanal} kg/semana · {semanasTotal} semanas no total
          {progressoKg > 0 && ` · ${progressoKg} kg já perdidos`}
        </p>
      </div>

      {/* SVG Chart */}
      <div className="px-2 pb-3">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="projecaoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid horizontal leve */}
          {yLabels.map(({ peso, y }) => (
            <g key={peso}>
              <line
                x1={PAD.left}
                y1={y}
                x2={VW - PAD.right}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 4}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fill="#9ca3af"
              >
                {peso}
              </text>
            </g>
          ))}

          {/* Eixo X */}
          <line
            x1={PAD.left}
            y1={VH - PAD.bottom}
            x2={VW - PAD.right}
            y2={VH - PAD.bottom}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Área preenchida */}
          <path d={areaPath} fill="url(#projecaoGrad)" />

          {/* Linha de projeção */}
          <path
            d={projecaoPath}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />

          {/* Linha de progresso real (se tiver logs suficientes) */}
          {realPath && (
            <path
              d={realPath}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Ponto de partida */}
          <circle cx={xOf(0)} cy={yOf(pesoPartida)} r="4" fill="#22c55e" />
          <text
            x={xOf(0) + 6}
            y={yOf(pesoPartida) - 5}
            fontSize="8"
            fill="#16a34a"
            fontWeight="600"
          >
            {pesoPartida} kg
          </text>

          {/* Ponto de chegada */}
          <circle cx={xOf(semanasTotal)} cy={yOf(pesoMeta)} r="4" fill="#15803d" />
          <text
            x={xOf(semanasTotal) - 4}
            y={yOf(pesoMeta) - 5}
            fontSize="8"
            fill="#15803d"
            fontWeight="600"
            textAnchor="end"
          >
            {pesoMeta} kg
          </text>

          {/* Label data goal no eixo X */}
          <text
            x={xOf(semanasTotal)}
            y={VH - PAD.bottom + 12}
            fontSize="7"
            fill="#6b7280"
            textAnchor="end"
          >
            {dataGoal.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </text>
          <text
            x={xOf(0)}
            y={VH - PAD.bottom + 12}
            fontSize="7"
            fill="#6b7280"
          >
            Hoje
          </text>
        </svg>
      </div>

      {/* Nota de ajuste adaptativo */}
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Após 7 dias de registros, o algoritmo ajustará a estimativa com base no seu metabolismo real.
        </p>
      </div>
    </div>
  )
}
