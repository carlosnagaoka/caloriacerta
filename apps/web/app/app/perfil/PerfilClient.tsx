'use client'

const objetivoLabel: Record<string, string> = {
  emagrecer:    'Emagrecer',
  manter:       'Manter peso',
  ganhar_massa: 'Ganhar massa',
}

const atividadeLabel: Record<string, string> = {
  sedentario:  'Sedentário',
  leve:        'Levemente ativo',
  moderado:    'Moderado',
  ativo:       'Muito ativo',
  muito_ativo: 'Extremamente ativo',
}

function bmi(peso: number, altura: number) {
  if (!peso || !altura) return null
  return (peso / ((altura / 100) ** 2)).toFixed(1)
}

function bmiLabel(b: number) {
  if (b < 18.5) return { text: 'Abaixo do peso', color: 'text-blue-500' }
  if (b < 25)   return { text: 'Peso ideal',      color: 'text-green-600' }
  if (b < 30)   return { text: 'Sobrepeso',        color: 'text-amber-500' }
  return               { text: 'Obesidade',         color: 'text-red-500' }
}

interface Props {
  profile: any
  email: string
  subscription: any
  totalRefeicoes: number
  pesoAtual: number | null
}

export default function PerfilClient({ profile, email, subscription, totalRefeicoes, pesoAtual }: Props) {
  const imc = profile?.height_cm && pesoAtual
    ? parseFloat(bmi(pesoAtual, profile.height_cm)!)
    : null
  const imcInfo = imc ? bmiLabel(imc) : null

  const statusAssinatura = subscription?.status
  const nomePlano = subscription?.plans?.name || 'Trial'

  const diasUsando = profile?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000))
    : 1

  return (
    <main className="bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-10 pb-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 flex-shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name || 'Usuário'}</h1>
            <p className="text-sm text-gray-400">{email}</p>
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              statusAssinatura === 'ativo'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {statusAssinatura === 'ativo' ? `${nomePlano} ✓` : 'Trial'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Resumo rápido */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dias de uso',   value: diasUsando,      unit: 'd' },
            { label: 'Refeições',     value: totalRefeicoes,  unit: '' },
            { label: 'IC Score',      value: profile?.ic_score ?? '—', unit: '' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{stat.value}{stat.unit}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Métricas corporais */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Métricas</h2>
          <div className="space-y-3">
            <Row label="Peso atual"      value={pesoAtual ? `${pesoAtual} kg` : '—'} />
            <Row label="Meta de peso"    value={profile?.peso_alvo_kg ? `${profile.peso_alvo_kg} kg` : '—'} />
            <Row label="Altura"          value={profile?.height_cm ? `${profile.height_cm} cm` : '—'} />
            {imc !== null && imcInfo && (
              <div className="flex justify-between items-center py-1.5 border-t border-gray-50">
                <span className="text-sm text-gray-500">IMC</span>
                <span className={`text-sm font-semibold ${imcInfo.color}`}>
                  {imc} — {imcInfo.text}
                </span>
              </div>
            )}
            <Row label="Objetivo"        value={objetivoLabel[profile?.objetivo] || '—'} />
            <Row label="Nível atividade" value={atividadeLabel[profile?.nivel_atividade] || '—'} />
            <Row label="Meta calórica"   value={profile?.daily_calorie_goal ? `${profile.daily_calorie_goal} kcal/dia` : '—'} />
            <Row label="TDEE calculado"  value={profile?.tdee ? `${profile.tdee} kcal` : '—'} />
          </div>
        </div>

        {/* Links rápidos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          <NavLink href="/app/plano" icon="🥗" label="Meu Plano" sub="Cardápio + exercícios da semana" />
          <NavLink href="/app/dashboard" icon="📊" label="Dashboard" sub="Consumo calórico e refeições de hoje" />
          <NavLink href="/app/refeicao" icon="➕" label="Registrar refeição" sub="Adicionar o que você comeu" />
          {statusAssinatura !== 'ativo' && (
            <NavLink href="/assinar" icon="⚡" label="Assinar CaloriaCerta" sub="Desbloqueie todos os recursos" highlight />
          )}
        </div>

        {/* Assinatura */}
        {statusAssinatura === 'ativo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            <NavLink href="/app/plano" icon="💳" label="Gerenciar assinatura" sub="Trocar plano, cancelar, histórico de pagamentos" />
          </div>
        )}

        {/* Sair */}
        <form action="/logout" method="post">
          <button
            type="submit"
            className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors font-medium shadow-sm"
          >
            Sair da conta
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 pb-2">CaloriaCerta · v1.0</p>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-t border-gray-50 first:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  )
}

function NavLink({ href, icon, label, sub, highlight }: {
  href: string; icon: string; label: string; sub: string; highlight?: boolean
}) {
  return (
    <a href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
      <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${highlight ? 'text-green-600' : 'text-gray-800'}`}>{label}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}
