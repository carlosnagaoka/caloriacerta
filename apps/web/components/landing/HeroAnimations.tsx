'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

export default function HeroAnimations() {
  return (
    <div className="flex flex-col items-start gap-6 mt-8">
      <motion.p
        className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.1 }}
      >
        Não porque você vai contar melhor. Mas porque o sistema vai entender
        quando você pode contar e quando não pode.
      </motion.p>

      <motion.p
        className="text-base text-gray-400 max-w-lg leading-relaxed"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.2 }}
      >
        CaloriaCerta é um Sistema Operacional de Nutrição Consciente: adapta a
        complexidade nutricional ao seu estado psicológico, transformando dados
        em inteligência contextual.
      </motion.p>

      <motion.a
        href="#quiz"
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.snappy, delay: 0.3 }}
        onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
      >
        Descobrir meu perfil alimentar
        <span className="text-sm opacity-75">60 segundos</span>
      </motion.a>

      <motion.p
        className="text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        1.847 pessoas na lista de espera · Lançamento: 2025
      </motion.p>
    </div>
  )
}
