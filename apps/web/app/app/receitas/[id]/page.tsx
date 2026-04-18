import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReceita } from '@/lib/recipes'
import RegistrarReceitaBtn from './RegistrarReceitaBtn'

export default async function ReceitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const receita = getReceita(id)
  if (!receita) notFound()

  const calPorcao      = Math.round(receita.caloriasTotal / receita.porcoes)
  const protPorcao     = Math.round(receita.proteina / receita.porcoes)
  const carbsPorcao    = Math.round(receita.carbs / receita.porcoes)
  const gorduraPorcao  = Math.round(receita.gordura / receita.porcoes)
  const totalTempo     = receita.tempoPrep + receita.tempoCozimento

  const categoriaColors: Record<string, string> = {
    brasileira: 'bg-green-100 text-green-700',
    japonesa:   'bg-red-100 text-red-700',
    fusion:     'bg-purple-100 text-purple-700',
    fitness:    'bg-blue-100 text-blue-700',
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      {/* Header com emoji */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center relative">
        <Link
          href="/app/receitas"
          className="absolute top-4 left-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600"
          aria-label="Voltar"
        >
          ←
        </Link>
        <span className="text-7xl">{receita.emoji}</span>
      </div>

      <div className="px-4 -mt-4">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[receita.categoria]}`}>
              {receita.categoria}
            </span>
            {receita.japaoFriendly && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                🛒 Ingredientes fáceis no Japão
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">{receita.titulo}</h1>
          <p className="text-sm text-gray-500 mb-4">{receita.descricao}</p>

          {/* Meta info */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-gray-50 rounded-xl py-2">
              <p className="text-xs text-gray-400">Preparo</p>
              <p className="text-sm font-bold text-gray-800">{receita.tempoPrep}min</p>
            </div>
            <div className="text-center bg-gray-50 rounded-xl py-2">
              <p className="text-xs text-gray-400">Cozimento</p>
              <p className="text-sm font-bold text-gray-800">{receita.tempoCozimento > 0 ? `${receita.tempoCozimento}min` : '—'}</p>
            </div>
            <div className="text-center bg-gray-50 rounded-xl py-2">
              <p className="text-xs text-gray-400">Porções</p>
              <p className="text-sm font-bold text-gray-800">{receita.porcoes}</p>
            </div>
          </div>

          {/* Macros por porção */}
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-700 mb-2">Nutrição por porção</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{calPorcao}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{protPorcao}g</p>
                <p className="text-xs text-gray-500">prot.</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{carbsPorcao}g</p>
                <p className="text-xs text-gray-500">carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{gorduraPorcao}g</p>
                <p className="text-xs text-gray-500">gord.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Ingredientes</h2>
          <ul className="space-y-2">
            {receita.ingredientes.map((ing, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-sm text-gray-900">
                    <strong>{ing.quantidade}</strong> {ing.nome}
                  </span>
                  {ing.onde && (
                    <p className="text-xs text-amber-600 mt-0.5">🛒 {ing.onde}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modo de preparo */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Modo de preparo</h2>
          <ol className="space-y-4">
            {receita.passos.map((passo, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{passo}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Tags */}
        {receita.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {receita.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                #{tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA fixo no bottom */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
        <RegistrarReceitaBtn
          receitaId={receita.id}
          titulo={receita.titulo}
          caloriasTotal={calPorcao}
          proteina={protPorcao}
          carbs={carbsPorcao}
          gordura={gorduraPorcao}
        />
      </div>
    </main>
  )
}
