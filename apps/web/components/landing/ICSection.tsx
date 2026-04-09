'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { spring, fadeUp } from '@/lib/motion'

const niveis = [
  { label: 'Explorador', min: 0, max: 20, color: '#6b7280', desc: 'Iniciando a jornada de consciência alimentar.' },
  { label: 'Praticante', min: 21, max: 40, color: '#3b82f6', desc: 'Padrões começam a emergir nos seus dados.' },
  { label: 'Consistente', min: 41, max: 60, color: '#8b5cf6', desc: 'Desbloqueado: relatórios semanais de correlação.' },
  { label: 'Consciente', min: 61, max: 80, color: '#22c55e', desc: 'Desbloqueado: modo Reflex + micro-experimentos.' },
  { label: 'Maestro', min: 81, max: 100, color: '#f59e0b', desc: 'Desbloqueado: dashboard para nutricionista.' },
]

function calcIC(regularidade: number, proximidade: number, humor: number) {
  return Math.round(regularidade * 0.5 + proximidade * 0.3 + humor * 0.2)
}

function getNivel(ic: number) {
  return niveis.find((n) => ic >= n.min && ic <= n.max) || niveis[0]
}

export default function ICSection() {
  const [regularidade, setRegularidade] = useState(5)
  const [proximidade, setProximidade] = useState(70)
  const [humor, setHumor] = useState(50)

  const ic = calcIC((regularidade / 7) * 100, proximidade, humor)
  const nivel = getNivel(ic)

  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-950">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp} transition={spring.gentle}>
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Índice de Consistência™
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Simule sua pontuação IC
          </h2>
          <p className="text-gray-400 mb-12">
            O IC mede padrões reais — não perfeição calórica. Ajuste os sliders e veja onde você estaria.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Sliders */}
          <div className="space-y-8">
            <div>
              <label
                htmlFor="slider-regularidade"
                className="flex justify-between text-sm font-medium text-gray-300 mb-2"
              >
                <span>Dias de registro por semana</span>
                <span
                  id="slider-regularidade-value"
                  className="text-green-400 font-bold"
                  aria-live="polite"
                >
                  {regularidade} dias
                </span>
              </label>
              <input
                id="slider-regularidade"
                type="range"
                min={1}
                max={7}
                step={1}
                value={regularidade}
                onChange={(e) => setRegularidade(Number(e.target.value))}
                className="w-full accent-green-500 h-2"
                aria-valuemin={1}
                aria-valuemax={7}
                aria-valuenow={regularidade}
                aria-valuetext={`${regularidade} dias por semana`}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1</span><span>7</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="slider-proximidade"
                className="flex justify-between text-sm font-medium text-gray-300 mb-2"
              >
                <span>Proximidade da meta calórica</span>
                <span className="text-green-400 font-bold" aria-live="polite">{proximidade}%</span>
              </label>
              <input
                id="slider-proximidade"
                type="range"
                min={0}
                max={100}
                step={5}
                value={proximidade}
                onChange={(e) => setProximidade(Number(e.target.value))}
                className="w-full accent-green-500 h-2"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={proximidade}
                aria-valuetext={`${proximidade}% de proximidade da meta`}
              />
            </div>

            <div>
              <label
                htmlFor="slider-humor"
                className="flex justify-between text-sm font-medium text-gray-300 mb-2"
              >
                <span>Registros com humor pré-refeição</span>
                <span className="text-green-400 font-bold" aria-live="polite">{humor}%</span>
              </label>
              <input
                id="slider-humor"
                type="range"
                min={0}
                max={100}
                step={5}
                value={humor}
                onChange={(e) => setHumor(Number(e.target.value))}
                className="w-full accent-green-500 h-2"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={humor}
                aria-valuetext={`${humor}% dos registros com humor`}
              />
            </div>
          </div>

          {/* Termômetro */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-56 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-full"
                style={{ backgroundColor: nivel.color }}
                animate={{ height: `${ic}%` }}
                transition={spring.gentle}
              />
            </div>
            <motion.div
              className="mt-6 text-center"
              animate={{ color: nivel.color }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-5xl font-black">{ic}</p>
              <p className="text-xl font-bold mt-1" style={{ color: nivel.color }}>
                {nivel.label}
              </p>
            </motion.div>
            <p className="text-center text-gray-400 text-sm mt-3 max-w-xs">{nivel.desc}</p>

            {/* Escala de níveis */}
            <div className="mt-6 w-full max-w-xs space-y-1">
              {[...niveis].reverse().map((n) => (
                <div
                  key={n.label}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    nivel.label === n.label ? 'bg-gray-800' : 'opacity-40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
                  <span className="text-gray-300 font-medium">{n.label}</span>
                  <span className="text-gray-500 ml-auto">{n.min}–{n.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
