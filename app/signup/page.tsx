import SignUpForm from '@/components/auth/SignUpForm'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">注册</h1>
      <SignUpForm />
      <p className="mt-4">
        已有账号？{' '}
        <Link href="/login" className="text-blue-500 hover:underline">
          登录
        </Link>
      </p>
    </div>
  )
} 