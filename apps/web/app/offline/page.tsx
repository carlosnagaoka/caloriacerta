'use client'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">📵</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Você está offline</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        Sem conexão com a internet no momento.<br />
        As páginas que você visitou recentemente ainda estão disponíveis.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all"
      >
        Tentar novamente
      </button>

      <p className="text-xs text-gray-400 mt-8">CaloriaCerta</p>
    </main>
  )
}
