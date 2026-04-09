'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { spring, fadeUp } from '@/lib/motion'
import { track } from '@/lib/analytics'

export default function NutricionistasSection() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nome: '', crn: '', email: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    track('email_submit', { type: 'nutritionist', ...form })
    setSubmitted(true)
  }

  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-950">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp} transition={spring.gentle}>
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Para Nutricionistas
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Seus pacientes vão usar apps de nutrição
            <br />
            <span className="text-gray-400">com ou sem você.</span>
          </h2>
          <p className="text-gray-400 mb-4 max-w-lg">
            O CaloriaCerta foi desenhado para ser prescrito.
          </p>
          <p className="text-gray-500 text-sm mb-10 max-w-lg">
            Em desenvolvimento: Dashboard profissional com relatórios de consistência,
            prescrição de modos, e alertas de risco de abandono por paciente.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.snappy}
            className="p-8 bg-blue-950 border border-blue-700 rounded-2xl text-center"
          >
            <p className="text-2xl font-bold text-white mb-2">Você está na lista!</p>
            <p className="text-gray-400">
              Entraremos em contato quando o dashboard profissional estiver disponível.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="nutri-nome" className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                id="nutri-nome"
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label htmlFor="nutri-crn" className="block text-sm text-gray-400 mb-1">CRN</label>
              <input
                id="nutri-crn"
                type="text"
                required
                value={form.crn}
                onChange={(e) => setForm({ ...form, crn: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="CRN-3 12345"
              />
            </div>
            <div>
              <label htmlFor="nutri-email" className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                id="nutri-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              Entrar na lista de acesso antecipado →
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
