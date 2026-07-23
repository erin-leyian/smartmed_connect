import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?medicine=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="page home-page">
      <h1>Find medicine at a verified pharmacy near you</h1>
      <p>Search by medicine name to see which licensed pharmacies have it in stock.</p>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="e.g. Amoxicillin, Paracetamol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  )
}