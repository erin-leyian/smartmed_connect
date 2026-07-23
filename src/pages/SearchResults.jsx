import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const medicineQuery = searchParams.get('medicine') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!medicineQuery) return
    fetchResults()
  }, [medicineQuery])

  async function fetchResults() {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('inventory')
      .select(`
        price,
        quantity,
        medicines!inner ( name, category ),
        pharmacies!inner ( id, name, address, verification_status, phone )
      `)
      .ilike('medicines.name', `%${medicineQuery}%`)
      .eq('pharmacies.verification_status', 'verified')
      .gt('quantity', 0)
      .order('price', { ascending: true })

    if (queryError) {
      setError(queryError.message)
    } else {
      setResults(data)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>Results for "{medicineQuery}"</h1>
      {loading && <p>Searching...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p>No verified pharmacies currently have this medicine in stock.</p>
      )}
      <ul className="results-list">
        {results.map((item, i) => (
          <li key={i} className="result-card">
            <div>
              <h3>{item.pharmacies.name} <span className="badge">Verified</span></h3>
              <p>{item.pharmacies.address}</p>
              <p>{item.medicines.name} — KES {item.price} ({item.quantity} in stock)</p>
            </div>
            <Link to={`/pharmacy/${item.pharmacies.id}`}>View pharmacy</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}