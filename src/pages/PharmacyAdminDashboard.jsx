import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function PharmacyAdminDashboard() {
  const { user } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', address: '', phone: '', license_number: '' })

  useEffect(() => {
    fetchPharmacy()
  }, [])

  async function fetchPharmacy() {
    setLoading(true)
    const { data } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('admin_id', user.id)
      .maybeSingle()

    setPharmacy(data)
    setLoading(false)
  }

  async function handleCreatePharmacy(e) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('pharmacies')
      .insert({ ...form, admin_id: user.id })
      .select()
      .single()

    if (error) return alert(error.message)
    setPharmacy(data)
  }

  if (loading) return <p className="page-loading">Loading...</p>

  if (!pharmacy) {
    return (
      <div className="page">
        <h1>Register your pharmacy</h1>
        <form onSubmit={handleCreatePharmacy} className="auth-form">
          <label>
            Pharmacy name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            License number
            <input
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              required
            />
          </label>
          <button type="submit">Register pharmacy</button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>{pharmacy.name}</h1>
      <p>Status: {pharmacy.verification_status}</p>
    </div>
  )
}