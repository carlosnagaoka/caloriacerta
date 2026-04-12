'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/app/dashboard',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Início',
  },
  {
    href: '/app/plano',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    label: 'Plano',
  },
  null, // espaço para o botão central
  {
    href: '/app/perfil',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: 'Perfil',
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-end h-16">

        {/* Início */}
        {(() => {
          const item = NAV_ITEMS[0]!
          const active = pathname === item.href || pathname.startsWith(item.href + '?')
          return (
            <Link href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
              <span className={active ? 'text-green-600' : 'text-gray-400'}>{item.icon(active)}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          )
        })()}

        {/* Plano */}
        {(() => {
          const item = NAV_ITEMS[1]!
          const active = pathname.startsWith('/app/plano')
          return (
            <Link href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
              <span className={active ? 'text-green-600' : 'text-gray-400'}>{item.icon(active)}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          )
        })()}

        {/* Botão central — Registrar */}
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ marginBottom: '0.5rem' }}>
          <Link
            href="/app/refeicao"
            className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg shadow-green-200 transition-all active:scale-95 -mt-5"
            aria-label="Registrar refeição"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <span className={`text-[10px] font-medium mt-1 ${pathname.startsWith('/app/refeicao') ? 'text-green-600' : 'text-gray-400'}`}>
            Registrar
          </span>
        </div>

        {/* Perfil */}
        {(() => {
          const item = NAV_ITEMS[3]!
          const active = pathname.startsWith('/app/perfil')
          return (
            <Link href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
              <span className={active ? 'text-green-600' : 'text-gray-400'}>{item.icon(active)}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          )
        })()}

      </div>
    </nav>
  )
}
