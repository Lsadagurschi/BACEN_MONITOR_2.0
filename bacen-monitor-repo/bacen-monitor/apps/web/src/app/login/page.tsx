// apps/web/src/app/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f3ee', fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff', border: '1px solid #d1c9b8', borderRadius: 16,
        padding: '48px 40px', width: 400, boxShadow: '0 20px 60px rgba(10,15,30,0.08)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: '#0a0f1e', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 12
          }}>🏦</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0a0f1e' }}>BACEN Monitor</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Conformidade regulatória para IFs</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0f1e', marginBottom: 8 }}>
              Verifique seu e-mail
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Enviamos um link de acesso para <strong>{email}</strong>.
              Clique no link para entrar.
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
              color: '#374151', marginBottom: 6 }}>
              E-mail corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="compliance@suaif.com.br"
              required
              style={{
                width: '100%', padding: '11px 14px', border: '1px solid #d1c9b8',
                borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 16,
                fontFamily: 'Arial', boxSizing: 'border-box',
                background: error ? '#fef2f2' : '#fff',
                borderColor: error ? '#ef4444' : '#d1c9b8',
              }}
            />
            {error && (
              <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#6b7280' : '#0a0f1e',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial'
              }}
            >
              {loading ? 'Enviando...' : 'Entrar com magic link →'}
            </button>
            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center',
              marginTop: 16, lineHeight: 1.5 }}>
              Sem senha. Receba um link de acesso direto no e-mail.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
