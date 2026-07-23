import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function PharmacyAdminDashboard() {
  const { user } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', address: '', phone: '', license_number: '' })

  const [medicineName, setMedicineName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

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
    if (data) fetchInventory(data.id)
    else setLoading(false)
  }

  async function fetchInventory(pharmacyId) {
    const { data } = await supabase
      .from('inventory')
      .select('id, price, quantity, medicines ( id, name )')
      .eq('pharmacy_id', pharmacyId)
    setInventory(data || [])
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

  async function handleSubmitVerification() {
    const { error } = await supabase
      .from('verification_requests')
      .insert({ pharmacy_id: pharmacy.id })

    if (error) return alert(error.message)
    alert('Verification request submitted.')
  }

  async function handleAddInventory(e) {
    e.preventDefault()

    let { data: medicine } = await supabase
      .from('medicines')
      .select('id')
      .ilike('name', medicineName)
      .maybeSingle()

    if (!medicine) {
      const { data: newMedicine, error: createError } = await supabase
        .from('medicines')
        .insert({ name: medicineName })
        .select()
        .single()
      if (createError) return alert(createError.message)
      medicine = newMedicine
    }

    const { error } = await supabase.from('inventory').upsert(
      {
        pharmacy_id: pharmacy.id,
        medicine_id: medicine.id,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pharmacy_id,medicine_id' }
    )

    if (error) return alert(error.message)
    setMedicineName('')
    setPrice('')
    setQuantity('')
    fetchInventory(pharmacy.id)
  }

  async function handleRemoveInventory(inventoryId) {
    const { error } = await supabase.from('inventory').delete().eq('id', inventoryId)
    if (error) return alert(error.message)
    fetchInventory(pharmacy.id)
  }

  if (loading) return <p className="page-loading">Loading...</p>

  if (!pharmacy) {
    return (
      <div className="page">
        <h1>Register your pharmacy</h1>
        <form onSubmit={handleCreatePharmacy} className="auth-form">
          <label>
            Pharmacy name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
      <h1>
        {pharmacy.name} <span className={`badge status-${pharmacy.verification_status}`}>{pharmacy.verification_status}</span>
      </h1>

      {pharmacy.verification_status === 'pending' && (
        <button onClick={handleSubmitVerification}>Submit for verification</button>
      )}

      <h2>Add / update stock</h2>
      <form onSubmit={handleAddInventory} className="auth-form">
        <label>
          Medicine name
          <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} required />
        </label>
        <label>
          Price (KES)
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label>
          Quantity
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <button type="submit">Save</button>
      </form>

      <h2>Current inventory</h2>
      <ul className="results-list">
        {inventory.map((item) => (
          <li key={item.id} className="result-card">
            <span>{item.medicines.name}</span>
            <span>KES {item.price}</span>
            <span>{item.quantity} in stock</span>
            <button className="link-button" onClick={() => handleRemoveInventory(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}