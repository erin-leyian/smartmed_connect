import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function PharmacyAdminDashboard() {
  const { user } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  // Fallback form — only used if a pharmacy_admin account somehow has no
  // pharmacy row yet (normally created automatically at signup).
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    license_number: '',
    contact_email: '',
    latitude: '',
    longitude: '',
  })

  const [medicineName, setMedicineName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const [emailCodeInput, setEmailCodeInput] = useState('')
  const [demoCode, setDemoCode] = useState(null)
  const [emailError, setEmailError] = useState(null)

  // Editing existing pharmacy details (FR8)
  const [editingDetails, setEditingDetails] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editError, setEditError] = useState(null)
  const [editSaving, setEditSaving] = useState(false)

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
    if (data?.contact_email_code && new Date(data.contact_email_code_expires_at) > new Date()) {
      setDemoCode(data.contact_email_code)
    }
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

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Location is not supported on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((f) => ({
          ...f,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
      },
      () => alert('Could not get your location. You can leave this blank and add it later.')
    )
  }

  async function handleCreatePharmacy(e) {
    e.preventDefault()
    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    }
    const { data, error } = await supabase
      .from('pharmacies')
      .insert({ ...payload, admin_id: user.id })
      .select()
      .single()

    if (error) return alert(error.message)

    const { error: reqError } = await supabase
      .from('verification_requests')
      .insert({ pharmacy_id: data.id })
    if (reqError) console.error(reqError.message)

    setPharmacy(data)
  }

  async function handleResubmitVerification() {
    const { error } = await supabase
      .from('verification_requests')
      .insert({ pharmacy_id: pharmacy.id })

    if (error) return alert(error.message)
    alert('Verification request submitted.')
  }

  async function handleSendEmailCode() {
    setEmailError(null)
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('pharmacies')
      .update({ contact_email_code: code, contact_email_code_expires_at: expiresAt })
      .eq('id', pharmacy.id)
      .select()
      .single()

    if (error) return alert(error.message)
    setPharmacy(data)
    setDemoCode(code)
  }

  async function handleVerifyEmailCode(e) {
    e.preventDefault()
    setEmailError(null)

    if (!pharmacy.contact_email_code) {
      setEmailError('Send a verification code first.')
      return
    }
    if (new Date(pharmacy.contact_email_code_expires_at) < new Date()) {
      setEmailError('That code has expired. Send a new one.')
      return
    }
    if (emailCodeInput.trim() !== pharmacy.contact_email_code) {
      setEmailError('Incorrect code.')
      return
    }

    const { data, error } = await supabase
      .from('pharmacies')
      .update({
        contact_email_verified: true,
        contact_email_code: null,
        contact_email_code_expires_at: null,
      })
      .eq('id', pharmacy.id)
      .select()
      .single()

    if (error) return alert(error.message)
    setPharmacy(data)
    setDemoCode(null)
    setEmailCodeInput('')
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

  // --- Edit pharmacy details (FR8) ---

  function openEditDetails() {
    setEditForm({
      name: pharmacy.name || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      license_number: pharmacy.license_number || '',
      contact_email: pharmacy.contact_email || '',
      latitude: pharmacy.latitude != null ? String(pharmacy.latitude) : '',
      longitude: pharmacy.longitude != null ? String(pharmacy.longitude) : '',
    })
    setEditError(null)
    setEditingDetails(true)
  }

  function handleUseLocationForEdit() {
    if (!navigator.geolocation) {
      alert('Location is not supported on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditForm((f) => ({
          ...f,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
      },
      () => alert('Could not get your location.')
    )
  }

  async function handleSaveDetails(e) {
    e.preventDefault()
    setEditError(null)
    setEditSaving(true)

    const emailChanged = editForm.contact_email !== pharmacy.contact_email

    const payload = {
      name: editForm.name,
      address: editForm.address,
      phone: editForm.phone,
      license_number: editForm.license_number,
      contact_email: editForm.contact_email,
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
    }

    if (emailChanged) {
      payload.contact_email_verified = false
      payload.contact_email_code = null
      payload.contact_email_code_expires_at = null
    }

    const { data, error } = await supabase
      .from('pharmacies')
      .update(payload)
      .eq('id', pharmacy.id)
      .select()
      .single()

    setEditSaving(false)

    if (error) {
      setEditError(error.message)
      return
    }

    setPharmacy(data)
    setDemoCode(null)
    setEditingDetails(false)
  }

  if (loading) return <p className="page-loading">Loading...</p>

  // Fallback: only reached if this pharmacy_admin account has no pharmacy row
  // at all (shouldn't normally happen, since registration creates one automatically).
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
            Contact email
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              required
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

          <button type="button" onClick={handleUseCurrentLocation} className="link-button">
            📍 Use my current location for pharmacy coordinates
          </button>
          {form.latitude && form.longitude && (
            <p className="form-hint">Location set: {form.latitude}, {form.longitude}</p>
          )}

          <button type="submit">Register pharmacy</button>
        </form>
      </div>
    )
  }

  const detailsSection = editingDetails ? (
    <div className="email-verify-box">
      <h2>Edit pharmacy details</h2>
      <form onSubmit={handleSaveDetails} className="auth-form">
        <label>
          Pharmacy name
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
        </label>
        <label>
          Address
          <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
        </label>
        <label>
          Phone
          <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
        </label>
        <label>
          Contact email
          <input
            type="email"
            value={editForm.contact_email}
            onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
            required
          />
        </label>
        <label>
          License number
          <input
            value={editForm.license_number}
            onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
            required
          />
        </label>

        <button type="button" onClick={handleUseLocationForEdit} className="link-button">
          📍 Update coordinates to my current location
        </button>
        {editForm.latitude && editForm.longitude && (
          <p className="form-hint">Location: {editForm.latitude}, {editForm.longitude}</p>
        )}

        {editForm.contact_email !== pharmacy.contact_email && (
          <p className="form-hint">
            Changing your contact email will require re-verifying it before you can manage inventory again.
          </p>
        )}

        {editError && <p className="form-error">{editError}</p>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" className="link-button" onClick={() => setEditingDetails(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  ) : (
    <div className="pharmacy-info-card">
      <p><span className="info-icon">📍</span> {pharmacy.address}</p>
      <p><span className="info-icon">📞</span> {pharmacy.phone || 'No phone on file'}</p>
      <p><span className="info-icon">🪪</span> License: {pharmacy.license_number}</p>
      <button type="button" className="link-button" onClick={openEditDetails}>
        Edit pharmacy details
      </button>
    </div>
  )

  // Pharmacy exists but hasn't been approved by a system admin yet
  if (pharmacy.verification_status !== 'verified') {
    return (
      <div className="page">
        <h1>
          {pharmacy.name}{' '}
          <span className={`badge status-${pharmacy.verification_status}`}>{pharmacy.verification_status}</span>
        </h1>

        {detailsSection}

        {pharmacy.verification_status === 'rejected' ? (
          <>
            <p>Your pharmacy application was rejected by a system administrator.</p>
            <button onClick={handleResubmitVerification}>Resubmit for verification</button>
          </>
        ) : (
          <p>
            Your pharmacy application is under review by a system administrator. Once
            approved, you'll be able to manage your inventory here.
          </p>
        )}
      </div>
    )
  }

  // Pharmacy is verified — full dashboard
  return (
    <div className="page">
      <h1>
        {pharmacy.name} <span className="badge">verified</span>
      </h1>

      {detailsSection}

      <h2>Contact email</h2>
      {pharmacy.contact_email_verified ? (
        <p>
          {pharmacy.contact_email} <span className="badge">Verified</span>
        </p>
      ) : (
        <div className="email-verify-box">
          <p>
            {pharmacy.contact_email} <span className="badge status-pending">Not verified</span>
          </p>
          <button type="button" onClick={handleSendEmailCode}>
            {pharmacy.contact_email_code ? 'Resend code' : 'Send verification code'}
          </button>

          {demoCode && (
            <p className="form-error" style={{ color: '#0f4c75' }}>
              Demo mode — no real email is sent. Verification code: <strong>{demoCode}</strong>
            </p>
          )}

          <form onSubmit={handleVerifyEmailCode} className="auth-form">
            <label>
              Enter verification code
              <input
                value={emailCodeInput}
                onChange={(e) => setEmailCodeInput(e.target.value)}
                maxLength={6}
                required
              />
            </label>
            {emailError && <p className="form-error">{emailError}</p>}
            <button type="submit">Verify email</button>
          </form>
        </div>
      )}

      {pharmacy.contact_email_verified ? (
        <>
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
        </>
      ) : (
        <p>Verify your pharmacy's contact email above to manage inventory.</p>
      )}
    </div>
  )
}