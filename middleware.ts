import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasEnvVars } from './lib/utils';

export async function middleware(request: NextRequest) {
  try {
    // Si las variables de entorno no están configuradas, saltamos
    if (!hasEnvVars) {
      return NextResponse.next();
    }

    // Crear respuesta inicial
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Crear cliente de Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            request.cookies.delete({
              name,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirigir a login si intenta acceder a dashboard sin autenticación
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Redirigir a dashboard si ya está autenticado y visita login/signup
    if (session && (
      request.nextUrl.pathname.startsWith('/auth/login') || 
      request.nextUrl.pathname.startsWith('/auth/sign-up')
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Redirigir de la página protegida (que es la demo) al dashboard
    if (session && request.nextUrl.pathname === '/protected') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
