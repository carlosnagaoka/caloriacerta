'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const active = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')

  const itemCls = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 ${isActive ? 'text-green-600' : 'text-gray-400'}`

  const labelCls = (isActive: boolean) =>
    `text-[10px] font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-end h-16">

        {/* Início */}
        <Link href="/app/dashboard" className={itemCls(active('/app/dashboard'))}>
          <svg className="w-5 h-5" fill={active('/app/dashboard') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/app/dashboard') ? 0 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={labelCls(active('/app/dashboard'))}>Início</span>
        </Link>

        {/* Receitas */}
        <Link href="/app/receitas" className={itemCls(active('/app/receitas'))}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/app/receitas') ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className={labelCls(active('/app/receitas'))}>Receitas</span>
        </Link>

        {/* Botão central — Registrar */}
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ marginBottom: '0.5rem' }}>
          <Link
            href="/app/refeicao"
            className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg shadow-green-200 transition-all active:scale-95 -mt-5"
            aria-label="Registrar refeição"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <span className={labelCls(active('/app/refeicao'))}>Registrar</span>
        </div>

        {/* Plano */}
        <Link href="/app/plano" className={itemCls(active('/app/plano'))}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/app/plano') ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className={labelCls(active('/app/plano'))}>Plano</span>
        </Link>

        {/* Perfil */}
        <Link href="/app/perfil" className={itemCls(active('/app/perfil'))}>
          <svg className="w-5 h-5" fill={active('/app/perfil') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/app/perfil') ? 0 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className={labelCls(active('/app/perfil'))}>Perfil</span>
        </Link>

      </div>
    </nav>
  )
}
