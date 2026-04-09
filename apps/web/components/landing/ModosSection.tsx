'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring, fadeUp } from '@/lib/motion'

const modos = [
  {
    id: 'scanner',
    emoji: '📷',
    nome: 'Modo Scanner',
    tagline: 'Para decisão, não dados',
    desc: 'Foto. Estimativa. Decisão. Sua privacidade intacta — a IA roda no seu telefone.',
    detalhe: 'GPT-4o Vision · Estimativa em segundos · On-device quando possível',
    cor: 'from-blue-600 to-blue-900',
    borda: 'border-blue-500',
  },
  {
    id: 'diario',
    emoji: '📋',
    nome: 'Modo Diário',
    tagline: 'Para controle sem fricção',
    desc: '"Repetir café de ontem?" — Um toque. Auto-preenchimento. Busca por "arroz com feijão" entende o prato inteiro.',
    detalhe: 'Banco com +4.000 alimentos brasileiros · Histórico inteligente · Sugestões contextuais',
    cor: 'from-purple-600 to-purple-900',
    borda: 'border-purple-500',
  },
  {
    id: 'reflex',
    emoji: '🧠',
    nome: 'Modo Reflex',
    tagline: 'Para transformação de hábito',
    desc: '"Antes de comer: fome física ou desejo emocional?" — Experimentos de 48h que revelam seus padrões reais.',
    detalhe: 'Micro-experimentos · Análise de correlações · Insights semanais · Ex: "Você come 40% mais em dias de reuniões após 15h."',
    cor: 'from-orange-600 to-orange-900',
    borda: 'border-orange-500',
  },
]

export default function ModosSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            setActiveIndex(index)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    container.querySelectorAll('[data-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (i: number) => {
    const card = containerRef.current?.querySelector(`[data-index="${i}"]`)
    card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <section id="modos" className="py-24 bg-gray-950">
      <div className="px-6 md:px-16 lg:px-24 mb-12">
        <motion.div {...fadeUp} transition={spring.gentle}>
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Os 3 Modos de Consciência
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            A complexidade que você precisa,
            <br />
            <span className="text-gray-400">na hora que você precisa.</span>
          </h2>
        </motion.div>
      </div>

      {/* Indicador de modo ativo */}
      <div className="flex justify-center gap-3 mb-8 px-6">
        {modos.map((m, i) => (
          <button
            key={m.id}
            onClick={() => scrollTo(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              i === activeIndex
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            aria-current={i === activeIndex}
          >
            {m.nome.replace('Modo ', '')}
          </button>
        ))}
      </div>

      {/* Scroll-snap container */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Os 3 Modos de Consciência"
        className="flex overflow-x-auto gap-4 px-6 md:px-16 pb-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {modos.map((modo, i) => (
          <div
            key={modo.id}
            data-index={i}
            aria-current={i === activeIndex}
            className={`flex-none w-[85vw] max-w-md rounded-2xl border bg-gradient-to-br p-8 ${modo.cor} ${modo.borda}`}
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="text-5xl mb-4">{modo.emoji}</div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
              {modo.tagline}
            </p>
            <h3 className="text-2xl font-bold text-white mb-4">{modo.nome}</h3>
            <p className="text-white/80 leading-relaxed mb-6">{modo.desc}</p>
            <p className="text-xs text-white/50 font-mono leading-relaxed">{modo.detalhe}</p>
          </div>
        ))}
      </div>

      {/* Navegação acessível */}
      <div className="flex justify-center gap-4 mt-6 px-6">
        <button
          onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 transition-all"
          aria-label="Modo anterior"
        >
          ‹ Anterior
        </button>
        <button
          onClick={() => scrollTo(Math.min(modos.length - 1, activeIndex + 1))}
          disabled={activeIndex === modos.length - 1}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 transition-all"
          aria-label="Próximo modo"
        >
          Próximo ›
        </button>
      </div>
    </section>
  )
}
