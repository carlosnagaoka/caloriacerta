import Link from 'next/link'
import { buscarReceitas, CATEGORIAS, type Receita } from '@/lib/recipes'

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const categoria = params.cat || 'todos'

  const receitas = buscarReceitas(query, categoria)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">🍽 Receitas</h1>

        {/* Busca */}
        <form method="GET" action="/app/receitas">
          <input type="hidden" name="cat" value={categoria} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar receita ou ingrediente..."
            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </form>

        {/* Filtros de categoria */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIAS.map(cat => (
            <Link
              key={cat.key}
              href={`/app/receitas?cat=${cat.key}${query ? `&q=${query}` : ''}`}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoria === cat.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="px-4 pt-4">
        <p className="text-xs text-gray-400 mb-3">
          {receitas.length} receita{receitas.length !== 1 ? 's' : ''} encontrada{receitas.length !== 1 ? 's' : ''}
        </p>

        {receitas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-gray-500 font-medium">Nenhuma receita encontrada</p>
            <Link href="/app/receitas" className="text-sm text-green-600 mt-2 block">Ver todas</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {receitas.map(receita => (
              <ReceitaCard key={receita.id} receita={receita} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function ReceitaCard({ receita }: { receita: Receita }) {
  const categoriaColors: Record<string, string> = {
    brasileira: 'bg-green-100 text-green-700',
    japonesa:   'bg-red-100 text-red-700',
    fusion:     'bg-purple-100 text-purple-700',
    fitness:    'bg-blue-100 text-blue-700',
  }

  const categoriaLabels: Record<string, string> = {
    brasileira: '🇧🇷',
    japonesa:   '🇯🇵',
    fusion:     '🔀',
    fitness:    '💪',
  }

  const totalTempo = receita.tempoPrep + receita.tempoCozimento

  return (
    <Link
      href={`/app/receitas/${receita.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform block"
    >
      {/* Emoji banner */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-24 flex items-center justify-center text-5xl">
        {receita.emoji}
      </div>

      <div className="p-3">
        {/* Badges */}
        <div className="flex gap-1 mb-1.5 flex-wrap">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${categoriaColors[receita.categoria]}`}>
            {categoriaLabels[receita.categoria]} {receita.categoria}
          </span>
          {receita.japaoFriendly && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              🛒 JP
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
          {receita.titulo}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-green-600">{Math.round(receita.caloriasTotal / receita.porcoes)} kcal</span>
          <span>⏱ {totalTempo}min</span>
        </div>

        <div className="mt-1.5 flex gap-2 text-xs text-gray-400">
          <span>🥩 {Math.round(receita.proteina / receita.porcoes)}g</span>
          <span>🌾 {Math.round(receita.carbs / receita.porcoes)}g</span>
          <span>🫙 {Math.round(receita.gordura / receita.porcoes)}g</span>
        </div>
      </div>
    </Link>
  )
}
