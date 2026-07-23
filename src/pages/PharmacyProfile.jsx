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
      <h1>
        {pharmacy.name}{' '}
        {pharmacy.verification_status === 'verified' && (
          <span className="badge">Verified</span>
        )}
      </h1>
      <p>{pharmacy.address}</p>
      <p>{pharmacy.phone}</p>

      <h2>Medicine in stock</h2>
      {inventory.length === 0 && <p>No stock listed yet.</p>}
      <ul className="results-list">
        {inventory.map((item, i) => (
          <li key={i} className="result-card">
            <span>{item.medicines.name}</span>
            <span>KES {item.price}</span>
            <span>{item.quantity} available</span>
          </li>
        ))}
      </ul>
    </div>
  )
}