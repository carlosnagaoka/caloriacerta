'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarOnboarding } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────
type Step =
  | 'welcome'
  | 'objetivo'
  | 'sexo'
  | 'idade'
  | 'medidas'
  | 'peso_alvo'
  | 'atividade'
  | 'saude'
  | 'prazo'
  | 'alimentacao'
  | 'habitos'
  | 'resumo'
  | 'loading'

const STEPS: Step[] = [
  'welcome', 'objetivo', 'sexo', 'idade', 'medidas',
  'peso_alvo', 'atividade', 'saude', 'prazo',
  'alimentacao', 'habitos', 'resumo', 'loading',
]

interface FormState {
  name: string
  objetivo: string
  sexo: string
  idade: string
  altura_cm: string
  peso_kg: string
  peso_alvo_kg: string
  nivel_atividade: string
  preocupacoes_saude: string[]
  prazo_semanas: string
  preferencia_alimentar: string
  refeicoes_por_dia: string
  horario_acordar: string
  horario_dormir: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcBMI(peso: string, altura: string) {
  const p = parseFloat(peso)
  const h = parseFloat(altura) / 100
  if (!p || !h) return null
  return (p / (h * h)).toFixed(1)
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (bmi < 25) return  { label: 'Peso ideal', color: 'text-green-500' }
  if (bmi < 30) return  { label: 'Sobrepeso', color: 'text-yellow-500' }
  return                { label: 'Obesidade', color: 'text-red-500' }
}

function progressPercent(step: Step) {
  const idx = STEPS.indexOf(step)
  return Math.round((idx / (STEPS.length - 1)) * 100)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ChoiceBtn({
  label, icon, selected, onClick, sub,
}: {
  label: string; icon?: string; selected: boolean; onClick: () => void; sub?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-green-500 bg-green-50 text-green-800'
          : 'border-gray-200 bg-white text-gray-800 hover:border-green-300'
      }`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <div className="font-semibold">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {selected && <span className="ml-auto text-green-500 text-lg">✓</span>}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingWizard({ userId, initialName }: { userId: string; initialName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('welcome')
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState<FormState>({
    name: initialName || '',
    objetivo: '',
    sexo: '',
    idade: '',
    altura_cm: '',
    peso_kg: '',
    peso_alvo_kg: '',
    nivel_atividade: '',
    preocupacoes_saude: [],
    prazo_semanas: '12',
    preferencia_alimentar: '',
    refeicoes_por_dia: '3',
    horario_acordar: '07:00',
    horario_dormir: '23:00',
  })

  const set = (field: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const next = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const handleFinish = () => {
    setStep('loading')
    setSaveError('')
    startTransition(async () => {
      try {
        const result = await salvarOnboarding({
          userId,
          name: form.name,
          objetivo: form.objetivo,
          sexo: form.sexo,
          idade: parseInt(form.idade) || 30,
          altura_cm: parseInt(form.altura_cm) || 170,
          peso_kg: parseFloat(form.peso_kg) || 70,
          peso_alvo_kg: parseFloat(form.peso_alvo_kg) || 65,
          nivel_atividade: form.nivel_atividade,
          preocupacoes_saude: form.preocupacoes_saude,
          prazo_semanas: parseInt(form.prazo_semanas) || 12,
          preferencia_alimentar: form.preferencia_alimentar,
          refeicoes_por_dia: parseInt(form.refeicoes_por_dia) || 3,
          horario_acordar: form.horario_acordar,
          horario_dormir: form.horario_dormir,
        })
        if (result.success) {
          router.push('/app/dashboard')
        } else {
          setSaveError(result.error || 'Erro ao salvar. Tente novamente.')
          setStep('resumo')
        }
      } catch (err: any) {
        setSaveError(err.message || 'Erro inesperado. Tente novamente.')
        setStep('resumo')
      }
    })
  }

  // ─── Steps ────────────────────────────────────────────────────────────────
  const bmiRaw = calcBMI(form.peso_kg, form.altura_cm)
  const bmi = bmiRaw ? parseFloat(bmiRaw) : null

  const PREOCUPACOES = [
    { value: 'diabetes', label: '🩸 Diabetes / Glicemia alta' },
    { value: 'hipertensao', label: '💓 Pressão alta' },
    { value: 'colesterol', label: '🧪 Colesterol elevado' },
    { value: 'tireoide', label: '🦋 Tireoide' },
    { value: 'digestao', label: '🫃 Problemas digestivos' },
    { value: 'nenhuma', label: '✅ Nenhuma' },
  ]

  const togglePreocupacao = (v: string) => {
    if (v === 'nenhuma') { set('preocupacoes_saude', ['nenhuma']); return }
    const cur = form.preocupacoes_saude.filter(x => x !== 'nenhuma')
    if (cur.includes(v)) set('preocupacoes_saude', cur.filter(x => x !== v))
    else set('preocupacoes_saude', [...cur, v])
  }

  const renderStep = () => {
    switch (step) {
      // ── 1. Welcome ──────────────────────────────────────────────────────────
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl">🥗</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao</h1>
              <h1 className="text-3xl font-bold text-green-600">CaloriaCerta!</h1>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Vamos criar o seu <strong>plano personalizado</strong> em 2 minutos.<br />
              São apenas algumas perguntas rápidas.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Como podemos te chamar?</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none text-center text-lg"
              />
            </div>
            <button
              onClick={next}
              disabled={!form.name.trim()}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg disabled:opacity-40 hover:bg-green-700 transition-colors"
            >
              Começar →
            </button>
          </div>
        )

      // ── 2. Objetivo ─────────────────────────────────────────────────────────
      case 'objetivo':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Qual é o seu objetivo?</h2>
            <p className="text-gray-500">Isso define seu plano alimentar</p>
            <div className="space-y-3 pt-2">
              <ChoiceBtn icon="📉" label="Emagrecer" sub="Reduzir peso e gordura corporal" selected={form.objetivo === 'emagrecer'} onClick={() => set('objetivo', 'emagrecer')} />
              <ChoiceBtn icon="⚖️" label="Manter peso" sub="Manter a composição atual" selected={form.objetivo === 'manter'} onClick={() => set('objetivo', 'manter')} />
              <ChoiceBtn icon="💪" label="Ganhar massa" sub="Aumentar músculo e força" selected={form.objetivo === 'ganhar_massa'} onClick={() => set('objetivo', 'ganhar_massa')} />
            </div>
          </div>
        )

      // ── 3. Sexo ─────────────────────────────────────────────────────────────
      case 'sexo':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Qual é o seu sexo biológico?</h2>
            <p className="text-gray-500">Usado para calcular seu metabolismo basal</p>
            <div className="space-y-3 pt-2">
              <ChoiceBtn icon="♂️" label="Masculino" selected={form.sexo === 'masculino'} onClick={() => set('sexo', 'masculino')} />
              <ChoiceBtn icon="♀️" label="Feminino" selected={form.sexo === 'feminino'} onClick={() => set('sexo', 'feminino')} />
            </div>
          </div>
        )

      // ── 4. Idade ────────────────────────────────────────────────────────────
      case 'idade':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Quantos anos você tem?</h2>
            <p className="text-gray-500">A idade afeta o metabolismo</p>
            <div className="pt-4 flex flex-col items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                value={form.idade}
                onChange={e => set('idade', e.target.value)}
                placeholder="Ex: 32"
                min="10" max="100"
                className="w-40 text-center text-4xl font-bold px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none"
              />
              <span className="text-gray-500">anos</span>
            </div>
          </div>
        )

      // ── 5. Altura + Peso ────────────────────────────────────────────────────
      case 'medidas':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Suas medidas atuais</h2>
            <p className="text-gray-500">Para calcular seu IMC e TDEE</p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Altura</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.altura_cm}
                    onChange={e => set('altura_cm', e.target.value)}
                    placeholder="170"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none pr-10"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso atual</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form.peso_kg}
                    onChange={e => set('peso_kg', e.target.value)}
                    placeholder="70"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none pr-10"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm">kg</span>
                </div>
              </div>
            </div>
            {bmi && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-600 text-sm">Seu IMC</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{bmiRaw}</span>
                  <span className={`ml-2 text-sm font-medium ${bmiLabel(bmi).color}`}>
                    {bmiLabel(bmi).label}
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      // ── 6. Peso alvo ────────────────────────────────────────────────────────
      case 'peso_alvo': {
        const pesoAtual = parseFloat(form.peso_kg) || 70
        const sugestaoFacil = (pesoAtual * 0.95).toFixed(1)
        const sugestaoReal = (pesoAtual * 0.88).toFixed(1)
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Qual é o seu peso ideal?</h2>
            <p className="text-gray-500">Peso atual: <strong>{form.peso_kg} kg</strong></p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => set('peso_alvo_kg', sugestaoFacil)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  form.peso_alvo_kg === sugestaoFacil
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-xs font-bold text-green-600 mb-1">VITÓRIA FÁCIL</div>
                <div className="text-2xl font-bold text-gray-900">{sugestaoFacil} kg</div>
                <div className="text-xs text-gray-500 mt-1">-5% do peso atual</div>
              </button>
              <button
                type="button"
                onClick={() => set('peso_alvo_kg', sugestaoReal)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  form.peso_alvo_kg === sugestaoReal
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-xs font-bold text-blue-600 mb-1">META REALISTA</div>
                <div className="text-2xl font-bold text-gray-900">{sugestaoReal} kg</div>
                <div className="text-xs text-gray-500 mt-1">-12% do peso atual</div>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ou defina manualmente:</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.peso_alvo_kg}
                  onChange={e => set('peso_alvo_kg', e.target.value)}
                  placeholder="Ex: 68"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none pr-10"
                />
                <span className="absolute right-3 top-3 text-gray-400 text-sm">kg</span>
              </div>
            </div>
          </div>
        )
      }

      // ── 7. Nível de atividade ───────────────────────────────────────────────
      case 'atividade':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Nível de atividade física</h2>
            <p className="text-gray-500">Qual melhor descreve sua rotina?</p>
            <div className="space-y-2 pt-1">
              <ChoiceBtn icon="🛋️" label="Sedentário" sub="Pouco ou nenhum exercício" selected={form.nivel_atividade === 'sedentario'} onClick={() => set('nivel_atividade', 'sedentario')} />
              <ChoiceBtn icon="🚶" label="Levemente ativo" sub="1–3 dias de exercício/semana" selected={form.nivel_atividade === 'leve'} onClick={() => set('nivel_atividade', 'leve')} />
              <ChoiceBtn icon="🏃" label="Moderadamente ativo" sub="3–5 dias de exercício/semana" selected={form.nivel_atividade === 'moderado'} onClick={() => set('nivel_atividade', 'moderado')} />
              <ChoiceBtn icon="🏋️" label="Muito ativo" sub="6–7 dias intensos/semana" selected={form.nivel_atividade === 'ativo'} onClick={() => set('nivel_atividade', 'ativo')} />
              <ChoiceBtn icon="⚡" label="Atleta" sub="Duas sessões por dia" selected={form.nivel_atividade === 'muito_ativo'} onClick={() => set('nivel_atividade', 'muito_ativo')} />
            </div>
          </div>
        )

      // ── 8. Preocupações de saúde ────────────────────────────────────────────
      case 'saude':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Condições de saúde</h2>
            <p className="text-gray-500">Selecione todas que se aplicam</p>
            <div className="space-y-2 pt-1">
              {PREOCUPACOES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePreocupacao(p.value)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium transition-all ${
                    form.preocupacoes_saude.includes(p.value)
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-green-300'
                  }`}
                >
                  {p.label}
                  {form.preocupacoes_saude.includes(p.value) && (
                    <span className="float-right text-green-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      // ── 9. Prazo ────────────────────────────────────────────────────────────
      case 'prazo': {
        const prazoOpts = [
          { v: '4', label: '1 mês', sub: 'Resultado rápido' },
          { v: '8', label: '2 meses', sub: 'Ritmo moderado' },
          { v: '12', label: '3 meses', sub: 'Recomendado' },
          { v: '24', label: '6 meses', sub: 'Sustentável' },
        ]
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Em quanto tempo?</h2>
            <p className="text-gray-500">Qual é o seu horizonte de tempo?</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {prazoOpts.map(o => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => set('prazo_semanas', o.v)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.prazo_semanas === o.v
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-bold text-gray-900">{o.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{o.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )
      }

      // ── 10. Preferência alimentar ───────────────────────────────────────────
      case 'alimentacao':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Preferência alimentar</h2>
            <p className="text-gray-500">Como você prefere se alimentar?</p>
            <div className="space-y-2 pt-1">
              <ChoiceBtn icon="🥩" label="Onívoro" sub="Como de tudo" selected={form.preferencia_alimentar === 'onivoro'} onClick={() => set('preferencia_alimentar', 'onivoro')} />
              <ChoiceBtn icon="🥗" label="Vegetariano" sub="Sem carne, com ovos/laticínios" selected={form.preferencia_alimentar === 'vegetariano'} onClick={() => set('preferencia_alimentar', 'vegetariano')} />
              <ChoiceBtn icon="🌱" label="Vegano" sub="Somente alimentos de origem vegetal" selected={form.preferencia_alimentar === 'vegano'} onClick={() => set('preferencia_alimentar', 'vegano')} />
              <ChoiceBtn icon="🥦" label="Low carb / Keto" sub="Poucos carboidratos" selected={form.preferencia_alimentar === 'low_carb'} onClick={() => set('preferencia_alimentar', 'low_carb')} />
              <ChoiceBtn icon="🍱" label="Outro" sub="Flexível ou dieta específica" selected={form.preferencia_alimentar === 'outro'} onClick={() => set('preferencia_alimentar', 'outro')} />
            </div>
          </div>
        )

      // ── 11. Hábitos ─────────────────────────────────────────────────────────
      case 'habitos':
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Seus hábitos diários</h2>
            <p className="text-gray-500">Nos ajuda a personalizar lembretes</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantas refeições por dia?</label>
              <div className="flex gap-2">
                {['2','3','4','5','6'].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('refeicoes_por_dia', n)}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                      form.refeicoes_por_dia === n
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acorda às</label>
                <input
                  type="time"
                  value={form.horario_acordar}
                  onChange={e => set('horario_acordar', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dorme às</label>
                <input
                  type="time"
                  value={form.horario_dormir}
                  onChange={e => set('horario_dormir', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-green-500 outline-none"
                />
              </div>
            </div>
          </div>
        )

      // ── 12. Resumo ──────────────────────────────────────────────────────────
      case 'resumo': {
        const pesoA = parseFloat(form.peso_kg) || 70
        const altA = parseInt(form.altura_cm) || 170
        const idadeA = parseInt(form.idade) || 30
        const tmb = form.sexo === 'feminino'
          ? 10 * pesoA + 6.25 * altA - 5 * idadeA - 161
          : 10 * pesoA + 6.25 * altA - 5 * idadeA + 5
        const fatores: Record<string, number> = { sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725, muito_ativo: 1.9 }
        const tdee = Math.round(tmb * (fatores[form.nivel_atividade] ?? 1.55))
        const diffKg = pesoA - parseFloat(form.peso_alvo_kg || String(pesoA))
        const deficit = form.objetivo === 'emagrecer' && diffKg > 0
          ? Math.min(1000, (diffKg * 7700) / ((parseInt(form.prazo_semanas) || 12) * 7))
          : form.objetivo === 'ganhar_massa' ? -300 : 0
        const meta = Math.max(1200, Math.round(tdee - deficit))
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Seu plano está pronto!</h2>
            <p className="text-gray-500">Criado exclusivamente para você, {form.name}</p>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-600">Objetivo</span>
                <span className="font-semibold text-gray-900 capitalize">{form.objetivo.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-600">Metabolismo (TDEE)</span>
                <span className="font-semibold text-gray-900">{tdee} kcal/dia</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-600">IMC atual</span>
                <span className={`font-semibold ${bmi ? bmiLabel(bmi).color : 'text-gray-900'}`}>
                  {bmiRaw} — {bmi ? bmiLabel(bmi).label : ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Prazo</span>
                <span className="font-semibold text-gray-900">{Math.round(parseInt(form.prazo_semanas) / 4)} meses</span>
              </div>
              <div className="bg-green-600 text-white rounded-xl p-4 text-center mt-2">
                <div className="text-sm font-medium opacity-90">Sua meta calórica diária</div>
                <div className="text-4xl font-bold mt-1">{meta}</div>
                <div className="text-sm opacity-90">kcal / dia</div>
              </div>
            </div>
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                ⚠️ {saveError}
              </div>
            )}
            <button
              onClick={handleFinish}
              disabled={isPending}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {isPending ? 'Salvando...' : 'Criar meu plano 🚀'}
            </button>
          </div>
        )
      }

      // ── 13. Loading ─────────────────────────────────────────────────────────
      case 'loading':
        return (
          <div className="text-center space-y-8 py-8">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-green-100" />
              <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🥗</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Criando seu plano...</h2>
              <p className="text-gray-500 mt-2">Calculando suas necessidades nutricionais</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── Can advance? ────────────────────────────────────────────────────────────
  const canNext = () => {
    switch (step) {
      case 'welcome': return !!form.name.trim()
      case 'objetivo': return !!form.objetivo
      case 'sexo': return !!form.sexo
      case 'idade': return !!form.idade && parseInt(form.idade) > 0
      case 'medidas': return !!form.altura_cm && !!form.peso_kg
      case 'peso_alvo': return !!form.peso_alvo_kg
      case 'atividade': return !!form.nivel_atividade
      case 'saude': return form.preocupacoes_saude.length > 0
      case 'prazo': return !!form.prazo_semanas
      case 'alimentacao': return !!form.preferencia_alimentar
      case 'habitos': return !!form.refeicoes_por_dia
      default: return true
    }
  }

  const showNav = !['welcome', 'resumo', 'loading'].includes(step)
  const progress = progressPercent(step)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress bar */}
      {step !== 'loading' && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Back button */}
        {STEPS.indexOf(step) > 0 && step !== 'loading' && (
          <button
            onClick={back}
            className="self-start mb-6 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
        )}

        {/* Step content */}
        <div className="flex-1">{renderStep()}</div>

        {/* Next button (for most steps) */}
        {showNav && (
          <div className="mt-8">
            <button
              onClick={next}
              disabled={!canNext()}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg disabled:opacity-40 hover:bg-green-700 transition-colors"
            >
              Continuar →
            </button>
            <div className="text-center mt-3 text-xs text-gray-400">
              Etapa {STEPS.indexOf(step) + 1} de {STEPS.length - 1}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
