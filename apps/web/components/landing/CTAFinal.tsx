'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { useQuizStore, type Profile } from '@/lib/quiz-store'
import { track } from '@/lib/analytics'

const headlineByProfile: Record<Profile, string> = {
  scanner: 'Seu sistema de decisão rápida está pronto.',
  reflex: 'Sua transformação de hábito começa aqui.',
  diario: 'Seu controle estruturado está esperando.',
  misto: 'Seu sistema adaptável está pronto.',
}

export default function CTAFinal() {
  const { profile } = useQuizStore()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const headline = profile
    ? headlineByProfile[profile]
    : 'Seu sistema de nutrição consciente está pronto para começar.'

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    track('email_submit', { email, profile: profile ?? 'unknown' })
    setSubmitted(true)
  }

  const whatsappUrl = 'https://wa.me/819098992686?text=Quero+acesso+antecipado+ao+CaloriaCerta'

  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-950 border-t border-gray-800">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={spring.gentle}
        >
          {profile && (
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Perfil detectado: {profile}
            </p>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{headline}</h2>
          <p className="text-gray-400 mb-10">
            Sem spam. Sem cobrança agora. Você escolhe quando (e se) quer o Pro.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.snappy}
            className="p-8 bg-green-950 border border-green-700 rounded-2xl"
          >
            <p className="text-2xl font-bold text-white mb-2">Vaga garantida!</p>
            <p className="text-gray-400">Você será um dos primeiros a acessar o CaloriaCerta.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 px-5 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors whitespace-nowrap"
              >
                Garantir minha vaga
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600">ou</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { profile: profile ?? 'unknown' })}
              className="flex items-center justify-center gap-3 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-semibold rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Prefere receber pelo WhatsApp? Entrar no grupo de early access
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
