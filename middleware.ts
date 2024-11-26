/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // 刷新 session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // 检查是否访问需要认证的路由
    if (request.nextUrl.pathname.startsWith('/journal')) {
      if (!session) {
        // 保存用户想要访问的 URL
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/journal/:path*']
}
