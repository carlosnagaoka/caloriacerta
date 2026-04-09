import Hero from '@/components/landing/Hero'
import QuizSection from '@/components/landing/QuizSection'
import ModosSection from '@/components/landing/ModosSection'
import GrafoSection from '@/components/landing/GrafoSection'
import ICSection from '@/components/landing/ICSection'
import ProvasSocial from '@/components/landing/ProvasSocial'
import NutricionistasSection from '@/components/landing/NutricionistasSection'
import PrivacidadeSection from '@/components/landing/PrivacidadeSection'
import CTAFinal from '@/components/landing/CTAFinal'

export default function LandingPage() {
  return (
    <div className="bg-gray-950 min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <span className="text-white font-bold text-lg tracking-tight">
          Caloria<span className="text-green-400">Certa</span>
        </span>
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Entrar
          </a>
          <a
            href="#quiz"
            className="text-sm px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
          >
            Começar
          </a>
        </div>
      </nav>

      {/* Seções */}
      <Hero />
      <QuizSection />
      <ModosSection />
      <GrafoSection />
      <ICSection />
      <ProvasSocial />
      <NutricionistasSection />
      <PrivacidadeSection />
      <CTAFinal />

      {/* Footer */}
      <footer className="py-8 px-6 md:px-16 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-gray-600 text-sm">
          © 2025 CaloriaCerta. Todos os direitos reservados.
        </span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacidade</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Termos</a>
          <a href="/login" className="hover:text-gray-400 transition-colors">App</a>
        </div>
      </footer>

      {/* Reduz motion se usuário preferir */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
