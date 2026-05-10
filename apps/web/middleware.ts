import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propaga cookies para a request (necessário para Server Components lerem)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Reconstrói a response com os cookies atualizados
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() lê o JWT do cookie sem chamada de rede externa.
  // Evita MIDDLEWARE_INVOCATION_TIMEOUT no Vercel Edge (limite 1.5s).
  // getUser() (verificação com o servidor) é feito no Server Component.
  await supabase.auth.getSession()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas EXCETO:
     * - _next/static  (arquivos estáticos imutáveis)
     * - _next/image   (otimização de imagens)
     * - favicon e assets públicos com extensão de imagem
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
