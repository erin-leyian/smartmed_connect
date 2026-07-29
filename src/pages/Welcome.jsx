import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Welcome() {
  const [view, setView] = useState('start') // 'start' | 'login' | 'register'

  return (
    <div className="welcome-shell">
      <div className="welcome-hero">
        <h1>SmartMed Connect</h1>
        <p>Find medicine at verified pharmacies near you.</p>
      </div>
      <div className="welcome-actions">
        {view === 'start' && <StartPanel onChoose={setView} />}
        {view === 'login' && <InlineLogin onSwitch={setView} />}
        {view === 'register' && <InlineRegister onSwitch={setView} />}
      </div>
    </div>
  )
}

function StartPanel({ onChoose }) {
  return (
    <>
      <h2>Get started</h2>
      <p>Log in or create an account to manage a pharmacy or oversee the platform.</p>
      <div className="welcome-buttons">
        <button className="welcome-btn welcome-btn-primary" onClick={() => onChoose('login')}>Log in</button>
        <button className="welcome-btn welcome-btn-secondary" onClick={() => onChoose('register')}>Register</button>
      </div>
      <p className="welcome-guest">
        Just looking for medicine? <Link to="/browse">Browse without an account</Link>
      </p>
    </>
  )
}

function InlineLogin({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (signInError) setError(signInError.message)
    // On success, AuthContext's listener picks up the session and RootRedirect
    // automatically swaps this page out for the right dashboard.
  }

  return (
    <div className="welcome-form-wrap">
      <h2>Log in</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p>
        Don't have an account?{' '}
        <button type="button" className="link-button" onClick={() => onSwitch('register')}>Register</button>
      </p>
      <button type="button" className="link-button welcome-back" onClick={() => onSwitch('start')}>
        ← Back
      </button>
    </div>
  )
}

function InlineRegister({ onSwitch }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      role,
    })

    setLoading(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="welcome-form-wrap">
        <h2>Check your email</h2>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Confirm it,
          then log in below.
        </p>
        <button onClick={() => onSwitch('login')}>Go to log in</button>
      </div>
    )
  }

  return (
    <div className="welcome-form-wrap">
      <h2>Create an account</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          I am a...
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient looking for medicine</option>
            <option value="pharmacy_admin">Pharmacy administrator</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      <p>
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={() => onSwitch('login')}>Log in</button>
      </p>
      <button type="button" className="link-button welcome-back" onClick={() => onSwitch('start')}>
        ← Back
      </button>
    </div>
  )
}