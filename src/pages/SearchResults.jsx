import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const medicineQuery = searchParams.get('medicine') || ''
  const [results, setResults] = useState([])
  const [sortBy, setSortBy] = useState('price-asc')
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

    if (queryError) setError(queryError.message)
    else setResults(data)
    setLoading(false)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    return a.pharmacies.name.localeCompare(b.pharmacies.name)
  })

  return (
    <div className="page search-results-page">
      <div className="results-header">
        <h1>Results for "{medicineQuery}"</h1>
        {results.length > 0 && (
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="pharmacy">Pharmacy name</option>
          </select>
        )}
      </div>

      {loading && <p>Searching...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p>No verified pharmacies currently have this medicine in stock.</p>
      )}

      <div className="product-grid">
        {sortedResults.map((item, i) => (
          <div key={i} className="product-card">
            <div className="product-icon">
              <svg viewBox="0 0 40 40" width="40" height="40">
                <g transform="translate(4,13) rotate(-20)">
                  <rect width="32" height="14" rx="7" fill="#1857a4" />
                  <rect width="16" height="14" rx="7" fill="#ffffff" />
                </g>
              </svg>
            </div>
            <span className="badge">Verified</span>
            <h3>{item.medicines.name}</h3>
            <p className="product-category">{item.medicines.category}</p>
            <p className="product-price">KES {item.price}</p>
            <p className="product-stock">{item.quantity} in stock</p>
            <p className="product-pharmacy">{item.pharmacies.name}</p>
            <Link to={`/pharmacy/${item.pharmacies.id}`} className="view-link">View pharmacy</Link>
          </div>
        ))}
      </div>
    </div>
  )
}