'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [variant, setVariant] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (variant === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(`Sign in failed: ${error.message}`)
        } else {
          setMessage('Signed in successfully.')
          router.push('/app/dashboard')
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setMessage(`Sign up failed: ${error.message}`)
        } else {
          if (data.user?.id) {
            setMessage('Account created. Check your email to confirm your address.')
          } else {
            setMessage('Sign up successful. Please check your email to confirm.')
          }
          // Optionally, we could redirect after confirmation; for now we stay on the page.
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {variant === 'signin' ? 'Sign in' : 'Create an account'}
        </h1>
        <p className="mb-4 text-sm text-[var(--text-2)]">
          {variant === 'signin'
            ? 'Use your clinic email and password to access the app.'
            : 'Enter your clinic email and a password to create an account.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--text-2)]" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--text-2)]" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-xs text-[var(--text-3)]">{message}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (variant === 'signin' ? 'Signing in…' : 'Signing up…') : 'Continue'}
            </Button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-2)]">
          <span>
            {variant === 'signin'
              ? "Don't have an account yet?"
              : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="text-[var(--primary-600)] hover:underline"
            onClick={() => {
              setMessage(null)
              setVariant((current) => (current === 'signin' ? 'signup' : 'signin'))
            }}
          >
            {variant === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

