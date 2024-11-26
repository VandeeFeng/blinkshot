'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email: email,
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (data?.user) {
        setSuccess(true)
        // 不要立即重定向，让用户看到成功消息
        setTimeout(() => {
          router.push('/login?message=请检查您的邮箱以完成注册')
        }, 5000)
      }
    } catch (error: Error | { message: string }) {
      console.error('注册错误:', error)
      setError(error.message || '注册过程中发生错误')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <h3 className="text-xl font-medium text-green-600">注册成功！</h3>
        <p className="mt-2">
          我们已经向您的邮箱 {email} 发送了验证邮件。
        </p>
        <p className="mt-2">
          请检查您的邮箱并点击验证链接来完成注册。
        </p>
        <p className="mt-2 text-sm text-gray-500">
          5秒后将自动跳转到登录页面...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          disabled={loading}
          minLength={6}
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white rounded-md py-2 hover:bg-blue-600 disabled:bg-blue-300"
        disabled={loading}
      >
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  )
} 