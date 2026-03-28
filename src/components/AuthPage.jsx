import { useState } from 'react'
import { supabase } from '../lib/supabase'

const authStyles = `
  .auth-input {
    width: 100%;
    padding: 12px 16px 12px 42px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    font-family: 'Nunito', sans-serif;
    color: #0f172a;
    outline: none;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    background: white;
  }
  .auth-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
  }
  .auth-btn {
    width: 100%;
    padding: 13px;
    border-radius: 10px;
    border: none;
    background: #0f172a;
    color: white;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
  }
  .auth-btn:hover { background: #1e293b; transform: translateY(-1px); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .auth-checkbox {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }
`

export default function AuthPage({ onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleAuth = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      let result
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password })
        if (result.error) throw result.error
        setSuccess('Account created! Check your email to confirm.')
      } else {
        result = await supabase.auth.signInWithPassword({ email, password })
        if (result.error) throw result.error
        if (onSuccess) onSuccess()
      }
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{authStyles}</style>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Nunito, sans-serif',
        background: '#f8fafc'
      }}>

        {/* Left — Form */}
        <div style={{
          flex: '0 0 480px',
          padding: '60px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'white',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>🔍</div>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>ClearSign</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '32px' }}>
            {isSignUp ? 'Start analyzing documents for free' : 'Welcome back to ClearSign'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: '#fff5f6', border: '1px solid #fda4af', borderRadius: '10px', padding: '12px 16px', color: '#be123c', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', color: '#15803d', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
              ✓ {success}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#94a3b8' }}>✉</span>
              <input
                className="auth-input"
                type="email"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#94a3b8' }}>🔒</span>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button className="auth-btn" onClick={handleAuth} disabled={loading} style={{ marginBottom: '20px' }}>
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign in'}
          </button>

          {/* Toggle + Forgot */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
                style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </span>
            </p>
            {!isSignUp && (
              <p
                style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer' }}
                onClick={async () => {
                  if (!email) { setError('Enter your email first.'); return }
                  await supabase.auth.resetPasswordForEmail(email)
                  setSuccess('Password reset email sent!')
                }}
              >
                Forgot Password
              </p>
            )}
          </div>

          {/* Back link */}
          {onSuccess && (
            <p
              onClick={onSuccess}
              style={{ fontSize: '13px', color: '#94a3b8', cursor: 'pointer', textAlign: 'center' }}
            >
              ← Continue without account
            </p>
          )}
        </div>

        {/* Right — Dark Panel */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40px', right: '40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '100px', left: '-40px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(37,99,235,0.08)', pointerEvents: 'none' }} />

          {/* Big icon */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.12 }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '40px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '90px' }}>🔍</div>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '48px', fontWeight: 700, color: 'white', letterSpacing: '-1px' }}>ClearSign</span>
          </div>

          {/* Brand name */}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>ClearSign</p>

          {/* Tagline */}
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '16px', lineHeight: 1.3 }}>
            Know what you're<br />signing — every time.
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '380px' }}>
            ClearSign reads leases, hospital bills, contracts, and terms of service — then tells you exactly what to watch out for before you sign.
          </p>

          {/* Stats card */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px 28px',
          }}>
            <p style={{ fontWeight: 800, fontSize: '16px', color: 'white', marginBottom: '6px' }}>
              Your documents, protected.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Join thousands of people who use ClearSign to understand their documents before it's too late.
            </p>
            <p style={{ fontWeight: 800, fontSize: '16px', color: 'white', marginBottom: '6px' }}>
              Built for everyone.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Whether it's a lease, a hospital bill, or a contract — ClearSign helps you understand what you're agreeing to before it's too late.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}