import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/journal'

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=无效的验证链接', request.url)
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 交换 code 获取会话
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('验证错误:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // 验证成功后直接重定向到 journal 页面
    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('回调处理错误:', error)
    return NextResponse.redirect(
      new URL('/login?error=验证过程出错', request.url)
    )
  }
} 