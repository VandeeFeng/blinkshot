'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast.success('Successfully logged in!')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={cn(
            'w-full px-4 py-2 bg-gray-900/50 border border-gray-700',
            'rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'text-white placeholder:text-gray-300',
            'transition-all duration-200'
          )}
        />
      </div>

      <div className="space-y-2">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={cn(
            'w-full px-4 py-2 bg-gray-900/50 border border-gray-700',
            'rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'text-white placeholder:text-gray-300',
            'transition-all duration-200'
          )}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-2 px-4 rounded-lg',
          'bg-blue-500 hover:bg-blue-600',
          'text-white font-medium',
          'transition-colors duration-200',
          'flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
} 