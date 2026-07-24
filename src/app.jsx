import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SearchResults from './pages/SearchResults'
import PharmacyProfile from './pages/PharmacyProfile'
import ProtectedRoute from './components/ProtectedRoute'
import PharmacyAdminDashboard from './pages/PharmacyAdminDashboard'
import SystemAdminPanel from './pages/SystemAdminPanel'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/pharmacy/:id" element={<PharmacyProfile />} />
        <Route
          path="/pharmacy-admin"
          element={
            <ProtectedRoute allowedRoles={['pharmacy_admin']}>
              <PharmacyAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-admin"
          element={
            <ProtectedRoute allowedRoles={['system_admin']}>
              <SystemAdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}