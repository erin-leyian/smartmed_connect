import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function toRad(deg) {
  return (deg * Math.PI) / 180
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const medicineQuery = searchParams.get('medicine') || ''
  const [results, setResults] = useState([])
  const [sortBy, setSortBy] = useState('price-asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)

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
        pharmacies!inner ( id, name, address, verification_status, phone, latitude, longitude )
      `)
      .ilike('medicines.name', `%${medicineQuery}%`)
      .eq('pharmacies.verification_status', 'verified')
      .gt('quantity', 0)

    if (queryError) setError(queryError.message)
    else setResults(data)
    setLoading(false)
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported on this device.')
      return
    }
    setLocationLoading(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
        setSortBy('distance-asc')
      },
      (err) => {
        setLocationLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied.')
        } else {
          setLocationError('Could not get your location.')
        }
      }
    )
  }

  function distanceFor(item) {
    const { latitude, longitude } = item.pharmacies
    if (!userLocation || latitude == null || longitude == null) return null
    return haversineDistanceKm(userLocation.lat, userLocation.lng, latitude, longitude)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'distance-asc') {
      const da = distanceFor(a)
      const db = distanceFor(b)
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      return da - db
    }
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    return a.pharmacies.name.localeCompare(b.pharmacies.name)
  })

  return (
    <div className="page search-results-page">
      <div className="results-header">
        <h1>Results for "{medicineQuery}"</h1>
        {results.length > 0 && (
          <div className="results-controls">
            <button
              type="button"
              className="location-btn"
              onClick={handleUseLocation}
              disabled={locationLoading}
            >
              {locationLoading ? 'Finding you...' : userLocation ? '📍 Location set' : '📍 Use my location'}
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              {userLocation && <option value="distance-asc">Nearest first</option>}
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="pharmacy">Pharmacy name</option>
            </select>
          </div>
        )}
      </div>

      {locationError && <p className="form-error">{locationError}</p>}
      {loading && <p>Searching...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p>No verified pharmacies currently have this medicine in stock.</p>
      )}

      <div className="product-grid">
        {sortedResults.map((item, i) => {
          const distance = distanceFor(item)
          return (
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
              {distance != null && (
                <p className="product-distance">{distance.toFixed(1)} km away</p>
              )}
              <Link to={`/pharmacy/${item.pharmacies.id}`} className="view-link">View pharmacy</Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}