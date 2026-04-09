'use client'

import { motion } from 'framer-motion'
import { spring, fadeUp } from '@/lib/motion'

const depoimentos = [
  {
    texto:
      'Parei de me culpar depois de 3 semanas. O Modo Reflex me mostrou que eu comia por ansiedade toda terça-feira à tarde — não por fome.',
    nome: 'Camila R.',
    cargo: 'Nutricionista',
    cidade: 'São Paulo',
  },
  {
    texto:
      'Finalmente um app que entende que eu como marmita de bandejão. A busca por "arroz feijão bife" funcionou de primeira.',
    nome: 'Marcos T.',
    cargo: 'Engenheiro',
    cidade: 'Campinas',
  },
  {
    texto:
      'Minha paciente veio com o gráfico de IC dela. Foi a primeira vez que tive dados reais de consistência — não só calorias.',
    nome: 'Dr. André L.',
    cargo: 'Nutrólogo',
    cidade: 'Porto Alegre',
  },
]

export default function ProvasSocial() {
  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} transition={spring.gentle} className="text-center mb-16">
          <div className="inline-flex flex-col items-center gap-1 mb-8">
            <span className="text-5xl md:text-6xl font-black text-white tabular-nums">
              1.847
            </span>
            <span className="text-gray-400">pessoas na lista de espera</span>
          </div>

          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Prova Social
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Quem já está esperando
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {depoimentos.map((d, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...spring.gentle, delay: i * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
            >
              <p className="text-gray-300 leading-relaxed flex-1">"{d.texto}"</p>
              <footer className="text-sm">
                <strong className="text-white">{d.nome}</strong>
                <span className="text-gray-500"> · {d.cargo}, {d.cidade}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
