'use client'

import { motion } from 'framer-motion'
import { spring, fadeUp } from '@/lib/motion'

export default function PrivacidadeSection() {
  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp} transition={spring.gentle}>
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Privacidade por Arquitetura
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Suas fotos nunca existem
            <br />
            <span className="text-gray-400">nos nossos servidores.</span>
          </h2>
        </motion.div>

        <div className="space-y-6 text-gray-400 leading-relaxed">
          <p>
            Não porque prometemos não guardá-las — mas porque tecnicamente não chegam até nós.
            O modelo de IA roda diretamente no seu telefone.
          </p>
          <p>
            <strong className="text-white">Fallback para API:</strong> quando a confiança da
            estimativa é menor que 75%, a imagem é transmitida via TLS 1.3, processada em memória
            e descartada sem persistência. Nunca indexada, nunca usada para treino sem consentimento.
          </p>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <p className="text-white font-semibold mb-2">Dataset de refeições brasileiras</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '6%' }} />
            </div>
            <p className="text-sm text-gray-400">
              Meta: 2,5 milhões de imagens · Fase beta: 150k imagens já catalogadas
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            {['LGPD nativo', 'Consentimento granular', 'On-device por padrão'].map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300"
              >
                <span className="text-green-400">✓</span> {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
