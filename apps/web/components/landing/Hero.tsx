'use client'

import dynamic from 'next/dynamic'

const HeroAnimations = dynamic(() => import('./HeroAnimations'), {
  ssr: false,
  loading: () => <HeroStatic />,
})

function HeroStatic() {
  return (
    <div className="flex flex-col items-start gap-6 mt-8">
      <p className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
        Não porque você vai contar melhor. Mas porque o sistema vai entender
        quando você pode contar e quando não pode.
      </p>
      <p className="text-base text-gray-400 max-w-lg leading-relaxed">
        CaloriaCerta é um Sistema Operacional de Nutrição Consciente: adapta a
        complexidade nutricional ao seu estado psicológico, transformando dados
        em inteligência contextual.
      </p>
      <a
        href="#quiz"
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
      >
        Descobrir meu perfil alimentar
        <span className="text-sm opacity-75">60 segundos</span>
      </a>
      <p className="text-sm text-gray-500">
        1.847 pessoas na lista de espera · Lançamento: 2025
      </p>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-20 pb-16 bg-gray-950">
      <div className="max-w-4xl">
        {/* LCP element — texto puro, zero JS */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
          A ansiedade alimentar
          <br />
          <span className="text-green-400">termina aqui.</span>
        </h1>
        <HeroAnimations />
      </div>
    </section>
  )
}
