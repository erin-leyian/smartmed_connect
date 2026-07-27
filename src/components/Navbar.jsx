import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '‹' : '›'}
      </button>
      <nav className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Link to="/" className="sidebar-brand">SmartMed Connect</Link>
        <div className="sidebar-links">
          <Link to="/">Home</Link>
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {user && profile?.role === 'pharmacy_admin' && <Link to="/pharmacy-admin">My pharmacy</Link>}
          {user && profile?.role === 'system_admin' && <Link to="/system-admin">Admin panel</Link>}
          {user && (
            <button className="link-button sidebar-logout" onClick={handleSignOut}>Log out</button>
          )}
        </div>
      </nav>
    </>
  )
}