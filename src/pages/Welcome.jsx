import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Welcome() {
  const [view, setView] = useState('start')
  // 'start' | 'login' | 'register-choice' | 'register-patient' | 'register-pharmacy'

  return (
    <div className="welcome-shell">
      <div className="welcome-hero">
        <h1>SmartMed Connect</h1>
        <p>Find medicine at verified pharmacies near you.</p>
      </div>
      <div className="welcome-actions">
        {view === 'start' && <StartPanel onChoose={setView} />}
        {view === 'login' && <InlineLogin onSwitch={setView} />}
        {view === 'register-choice' && <RegisterChoice onChoose={setView} />}
        {view === 'register-patient' && <PatientRegisterForm onSwitch={setView} />}
        {view === 'register-pharmacy' && <PharmacyRegisterForm onSwitch={setView} />}
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
        <button className="welcome-btn welcome-btn-secondary" onClick={() => onChoose('register-choice')}>Register</button>
      </div>
      <p className="welcome-guest">
        Just looking for medicine? <Link to="/browse">Browse without an account</Link>
      </p>
    </>
  )
}

function RegisterChoice({ onChoose }) {
  return (
    <div className="welcome-form-wrap">
      <h2>Register as...</h2>
      <div className="welcome-buttons welcome-buttons-stacked">
        <button className="welcome-btn welcome-btn-primary" onClick={() => onChoose('register-patient')}>
          I'm a patient
        </button>
        <button className="welcome-btn welcome-btn-secondary" onClick={() => onChoose('register-pharmacy')}>
          Register my pharmacy
        </button>
      </div>
      <button type="button" className="link-button welcome-back" onClick={() => onChoose('start')}>
        ← Back
      </button>
    </div>
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
        <button type="button" className="link-button" onClick={() => onSwitch('register-choice')}>Register</button>
      </p>
      <button type="button" className="link-button welcome-back" onClick={() => onSwitch('start')}>
        ← Back
      </button>
    </div>
  )
}

function PatientRegisterForm({ onSwitch }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'patient' } },
    })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="welcome-form-wrap">
        <h2>Check your email</h2>
        <p>We sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in below.</p>
        <button onClick={() => onSwitch('login')}>Go to log in</button>
      </div>
    )
  }

  return (
    <div className="welcome-form-wrap">
      <h2>Register as a patient</h2>
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
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      <button type="button" className="link-button welcome-back" onClick={() => onSwitch('register-choice')}>
        ← Back
      </button>
    </div>
  )
}

function PharmacyRegisterForm({ onSwitch }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [pharmacyName, setPharmacyName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Location is not supported on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
      },
      () => alert('Could not get your location. You can leave this blank and add it later.')
    )
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'pharmacy_admin' },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('register_pharmacy', {
      p_admin_id: signUpData.user.id,
      p_name: pharmacyName,
      p_address: address,
      p_phone: phone,
      p_license_number: license,
      p_contact_email: contactEmail,
      p_latitude: latitude ? parseFloat(latitude) : null,
      p_longitude: longitude ? parseFloat(longitude) : null,
    })

    setLoading(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="welcome-form-wrap">
        <h2>Application submitted</h2>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in
          below. Your pharmacy has been sent to a system administrator for verification —
          once approved, you'll be able to manage inventory.
        </p>
        <button onClick={() => onSwitch('login')}>Go to log in</button>
      </div>
    )
  }

  return (
    <div className="welcome-form-wrap-wide">
      <h2>Register my pharmacy</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <label>
          Your full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Login email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>

        <hr />

        <label>
          Pharmacy name
          <input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} required />
        </label>
        <label>
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Pharmacy contact email
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
        </label>
        <label>
          License number
          <input value={license} onChange={(e) => setLicense(e.target.value)} required />
        </label>

        <button type="button" onClick={handleUseCurrentLocation} className="link-button">
          📍 Use my current location for pharmacy coordinates
        </button>
        {latitude && longitude && (
          <p className="form-hint">Location set: {latitude}, {longitude}</p>
        )}

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for verification'}
        </button>
      </form>
      <button type="button" className="link-button welcome-back" onClick={() => onSwitch('register-choice')}>
        ← Back
      </button>
    </div>
  )
}