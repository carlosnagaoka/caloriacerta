'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore, calculateProfile, type Profile } from '@/lib/quiz-store'
import { spring } from '@/lib/motion'
import { track } from '@/lib/analytics'

const questions = [
  {
    text: 'Qual é sua maior dificuldade com alimentação?',
    options: [
      { label: 'Esqueço de registrar o que como', value: 'esqueço' },
      { label: 'Fico ansioso quando saio da dieta', value: 'ansioso' },
      { label: 'Não sei quais alimentos escolher', value: 'naosei' },
      { label: 'Registro tudo, mas não muda nada', value: 'semresult' },
    ],
  },
  {
    text: 'Com que frequência você come fora ou pede delivery?',
    options: [
      { label: 'Raramente (preparo em casa)', value: 'raramente' },
      { label: '2–3 vezes por semana', value: 'dois_tres' },
      { label: 'Quase todo dia', value: 'todo_dia' },
      { label: 'Varia muito dependendo da semana', value: 'varia' },
    ],
  },
  {
    text: 'O que mais te faz abandonar um app de nutrição?',
    options: [
      { label: 'É muito trabalhoso registrar tudo', value: 'trabalhoso' },
      { label: 'Me sinto culpado quando erro', value: 'culpa' },
      { label: 'Não vejo progresso visível', value: 'semprogresso' },
      { label: 'Não entende minha realidade (comida brasileira)', value: 'realidade' },
    ],
  },
]

const ctaByProfile: Record<Profile, string> = {
  scanner: 'Seu perfil: Decisão Rápida. Conheça o Modo Scanner →',
  reflex: 'Seu perfil: Transformação de Hábito. Conheça o Modo Reflex →',
  diario: 'Seu perfil: Controle Estruturado. Conheça o Modo Diário →',
  misto: 'Seu perfil é único. Veja como o sistema se adapta →',
}

export default function QuizSection() {
  const { step, answers, profile, setAnswer, setStep, setProfile } = useQuizStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('cc_quiz_profile')
    if (saved) {
      try {
        const { profile: savedProfile, answers: savedAnswers } = JSON.parse(saved)
        if (savedProfile) {
          useQuizStore.setState({ profile: savedProfile, answers: savedAnswers, step: 3 })
        }
      } catch {}
    }
  }, [])

  const handleAnswer = (value: string) => {
    track('quiz_answer', { question: step, answer: value })
    setAnswer(step, value)
    if (step < questions.length - 1) {
      setTimeout(() => {
        setStep(step + 1)
        containerRef.current?.focus()
      }, 300)
    } else {
      const p = calculateProfile({ ...answers, [step]: value })
      setTimeout(() => {
        setProfile(p)
        setStep(3)
        track('quiz_complete', { profile: p })
      }, 300)
    }
  }

  return (
    <section id="quiz" className="py-24 px-6 md:px-16 lg:px-24 bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={spring.gentle}
        >
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Quiz de Consciência Alimentar
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Descubra seu perfil em 60 segundos
          </h2>
        </motion.div>

        <div
          ref={containerRef}
          tabIndex={-1}
          className="mt-10 outline-none"
          aria-live="polite"
        >
          {profile && step === 3 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.snappy}
              className="p-8 bg-green-950 border border-green-700 rounded-2xl text-center"
            >
              <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
                Análise completa
              </p>
              <p className="text-2xl font-bold text-white mb-6">{ctaByProfile[profile]}</p>
              <a
                href="#modos"
                onClick={() => document.getElementById('modos')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
              >
                Ver como funciona
              </a>
              <button
                onClick={() => useQuizStore.getState().reset()}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-400 underline"
              >
                Refazer quiz
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={spring.snappy}
              >
                {/* Barra de progresso */}
                <div
                  className="flex gap-2 mb-8"
                  role="progressbar"
                  aria-valuenow={step + 1}
                  aria-valuemin={1}
                  aria-valuemax={3}
                >
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-500"
                      style={{ backgroundColor: i <= step ? '#22c55e' : '#374151' }}
                    />
                  ))}
                </div>

                <fieldset>
                  <legend className="text-xl md:text-2xl font-semibold text-white mb-6">
                    {questions[step]?.text}
                  </legend>
                  <div className="space-y-3">
                    {questions[step]?.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          answers[step] === opt.value
                            ? 'border-green-500 bg-green-950'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${step}`}
                          value={opt.value}
                          checked={answers[step] === opt.value}
                          onChange={() => handleAnswer(opt.value)}
                          className="accent-green-500"
                          aria-describedby={`q${step}-legend`}
                        />
                        <span className="text-gray-200">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
