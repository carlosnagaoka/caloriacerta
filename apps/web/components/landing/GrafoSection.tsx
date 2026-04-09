'use client'

import dynamic from 'next/dynamic'

const GrafoD3 = dynamic(() => import('./GrafoD3'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-gray-500 text-sm animate-pulse">Carregando grafo...</div>
    </div>
  ),
})

export default function GrafoSection() {
  return (
    <section className="py-24 px-6 md:px-16 lg:px-24 bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
          Grafo Alimentar Vivo
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Como o sistema entende
          <br />
          <span className="text-gray-400">a culinária brasileira.</span>
        </h2>
        <p className="text-gray-400 mb-10 max-w-lg">
          Cada alimento conectado por contexto cultural, perfil nutricional e padrões
          de consumo reais. Arraste os nós para explorar.
        </p>

        <div
          role="img"
          aria-labelledby="grafo-titulo"
          aria-describedby="grafo-desc"
          className="relative bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden"
          style={{ height: '420px' }}
        >
          <p id="grafo-titulo" className="sr-only">Grafo de conexões alimentares brasileiras</p>
          <p id="grafo-desc" className="sr-only">
            Visualização de como o sistema conecta alimentos brasileiros por contexto cultural
            e perfil nutricional. Exemplos: arroz com feijão conecta-se a frango grelhado,
            bife e salada mista.
          </p>
          <GrafoD3 />

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {[
              { label: 'Base', color: '#22c55e' },
              { label: 'Proteína', color: '#3b82f6' },
              { label: 'Carboidrato', color: '#f59e0b' },
              { label: 'Vegetal', color: '#10b981' },
              { label: 'Bebida', color: '#8b5cf6' },
              { label: 'Lanche', color: '#ef4444' },
            ].map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-1 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded-full"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Fallback acessível */}
        <details className="mt-4">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
            Ver conexões como lista
          </summary>
          <ul className="mt-3 space-y-1 text-sm text-gray-400">
            <li>Arroz com feijão → Frango grelhado, Bife, Salada mista, Moqueca</li>
            <li>Frango grelhado → Batata doce, Brócolis, Salada mista</li>
            <li>Açaí → Vitamina de banana</li>
            <li>Tapioca, Pão de queijo, Ovo mexido → Café com leite</li>
            <li>Macarrão → Bife</li>
          </ul>
        </details>
      </div>
    </section>
  )
}
