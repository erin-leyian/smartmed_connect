import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Welcome from './Welcome'

export default function RootRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <p className="page-loading">Loading...</p>
  if (!user) return <Welcome />

  if (profile?.role === 'pharmacy_admin') return <Navigate to="/pharmacy-admin" replace />
  if (profile?.role === 'system_admin') return <Navigate to="/system-admin" replace />
  return <Navigate to="/browse" replace />
}