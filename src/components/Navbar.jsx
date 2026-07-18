import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">SmartMed Connect</Link>
      <div className="navbar-links">
        <Link to="/login">Login</Link>
      </div>
    </nav>
  )
}