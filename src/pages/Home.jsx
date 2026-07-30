import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCatalog()
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data[1] || []))
        .catch(() => setSuggestions([]))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  async function fetchCatalog() {
    setLoadingCatalog(true)
    const { data, error } = await supabase
      .from('inventory')
      .select(`price, medicines!inner ( name, category ), pharmacies!inner ( verification_status )`)
      .eq('pharmacies.verification_status', 'verified')
      .gt('quantity', 0)

    if (!error && data) {
      const grouped = {}
      data.forEach((item) => {
        const name = item.medicines.name
        if (!grouped[name]) {
          grouped[name] = { name, category: item.medicines.category, minPrice: item.price, count: 1 }
        } else {
          grouped[name].count += 1
          if (item.price < grouped[name].minPrice) grouped[name].minPrice = item.price
        }
      })
      setCatalog(Object.values(grouped))
    }
    setLoadingCatalog(false)
  }

  function handleSearch(e, term) {
    if (e) e.preventDefault()
    const finalQuery = term || query
    if (!finalQuery.trim()) return
    navigate(`/search?medicine=${encodeURIComponent(finalQuery.trim())}`)
  }

  return (
    <div className="page home-page">
      <h1>Find medicine at a verified pharmacy near you</h1>
      <p>Search by medicine name to see which licensed pharmacies have it in stock.</p>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="e.g. Amoxicillin, Paracetamol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((name, i) => (
                <li key={i} onClick={() => { setQuery(name); setSuggestions([]); handleSearch(null, name) }}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit">Search</button>
      </form>

      <div className="catalog-section">
        <h2>Available medicines</h2>
        {loadingCatalog && <p>Loading...</p>}
        {!loadingCatalog && catalog.length === 0 && <p>No medicines listed yet.</p>}
        <div className="product-grid">
          {catalog.map((item, i) => (
            <div key={i} className="product-card" onClick={() => handleSearch(null, item.name)}>
              <div className="product-icon">
                <svg viewBox="0 0 40 40" width="40" height="40">
                  <g transform="translate(4,13) rotate(-20)">
                    <rect width="32" height="14" rx="7" fill="#2196d8" />
                    <rect width="16" height="14" rx="7" fill="#ffffff" />
                  </g>
                </svg>
              </div>
              <h3>{item.name}</h3>
              <p className="product-category">{item.category}</p>
              <p className="product-price">From KES {item.minPrice}</p>
              <p className="product-stock">{item.count} {item.count === 1 ? 'pharmacy' : 'pharmacies'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}