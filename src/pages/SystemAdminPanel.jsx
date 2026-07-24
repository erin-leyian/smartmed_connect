import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function SystemAdminPanel() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('verification_requests')
      .select('id, submitted_at, status, pharmacies ( id, name, address, license_number )')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })

    if (error) console.error(error.message)
    setRequests(data || [])
    setLoading(false)
  }

  async function handleReview(requestId, pharmacyId, decision) {
    const { error: reqError } = await supabase
      .from('verification_requests')
      .update({
        status: decision,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (reqError) return alert(reqError.message)

    const { error: pharmacyError } = await supabase
      .from('pharmacies')
      .update({ verification_status: decision === 'approved' ? 'verified' : 'rejected' })
      .eq('id', pharmacyId)

    if (pharmacyError) return alert(pharmacyError.message)

    fetchRequests()
  }

  if (loading) return <p className="page-loading">Loading...</p>

  return (
    <div className="page">
      <h1>Pending pharmacy verifications</h1>
      {requests.length === 0 && <p>No pending requests. All caught up.</p>}
      <ul className="results-list">
        {requests.map((req) => (
          <li key={req.id} className="result-card">
            <div>
              <h3>{req.pharmacies.name}</h3>
              <p>{req.pharmacies.address}</p>
              <p>License: {req.pharmacies.license_number}</p>
            </div>
            <div>
              <button onClick={() => handleReview(req.id, req.pharmacies.id, 'approved')}>
                Approve
              </button>
              <button onClick={() => handleReview(req.id, req.pharmacies.id, 'rejected')}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}