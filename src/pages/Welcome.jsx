import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="welcome-shell">
      <div className="welcome-hero">
        <h1>SmartMed Connect</h1>
        <p>Find medicine at verified pharmacies near you.</p>
      </div>
      <div className="welcome-actions">
        <h2>Get started</h2>
        <p>Log in or create an account to manage a pharmacy or oversee the platform.</p>
        <div className="welcome-buttons">
          <Link to="/login" className="welcome-btn welcome-btn-primary">Log in</Link>
          <Link to="/register" className="welcome-btn welcome-btn-secondary">Register</Link>
        </div>
        <p className="welcome-guest">
          Just looking for medicine? <Link to="/browse">Browse without an account</Link>
        </p>
      </div>
    </div>
  )
}