import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function PharmacyProfile() {
  const { id } = useParams()
  const [pharmacy, setPharmacy] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPharmacy()
  }, [id])

  async function fetchPharmacy() {
    setLoading(true)

    const { data: pharmacyData } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', id)
      .single()

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('price, quantity, medicines ( name, category )')
      .eq('pharmacy_id', id)
      .gt('quantity', 0)

    setPharmacy(pharmacyData)
    setInventory(inventoryData || [])
    setLoading(false)
  }

  if (loading) return <p className="page-loading">Loading...</p>
  if (!pharmacy) return <p className="page">Pharmacy not found.</p>

  return (
    <div className="page">
      <div className="pharmacy-header">
        <h1>
          {pharmacy.name}{' '}
          {pharmacy.verification_status === 'verified' && (
            <span className="badge">Verified</span>
          )}
        </h1>
        <div className="pharmacy-info-card">
          <p><span className="info-icon">📍</span> {pharmacy.address}</p>
          <p><span className="info-icon">📞</span> {pharmacy.phone}</p>
        </div>
      </div>

      <h2>Medicine in stock</h2>
      {inventory.length === 0 && <p>No stock listed yet.</p>}
      <div className="product-grid">
        {inventory.map((item, i) => (
          <div key={i} className="product-card">
            <div className="product-icon">
              <svg viewBox="0 0 40 40" width="40" height="40">
                <g transform="translate(4,13) rotate(-20)">
                  <rect width="32" height="14" rx="7" fill="#2196d8" />
                  <rect width="16" height="14" rx="7" fill="#ffffff" />
                </g>
              </svg>
            </div>
            <h3>{item.medicines.name}</h3>
            <p className="product-category">{item.medicines.category}</p>
            <p className="product-price">KES {item.price}</p>
            <p className="product-stock">{item.quantity} available</p>
          </div>
        ))}
      </div>
    </div>
  )
}