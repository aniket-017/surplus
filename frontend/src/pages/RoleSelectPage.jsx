import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import surplusLogo from '../assets/logo/surplus.png'

export default function RoleSelectPage() {
  const { setRole } = useAuth()
  const navigate = useNavigate()
  const [loadingRole, setLoadingRole] = useState(null)
  const [error, setError] = useState('')

  async function handleSelect(role) {
    setLoadingRole(role)
    setError('')

    try {
      await setRole(role)
      navigate(role === 'buyer' ? '/buyer' : '/seller', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to set role')
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="role-select-page">
      <div className="role-select-shell">
        <img src={surplusLogo} alt="Surplus" style={{ height: 40 }} />
        <h1>How will you use Surplus?</h1>
        <p>Choose your role to get started. You can switch anytime from your profile.</p>

        <button
          type="button"
          className="role-card"
          onClick={() => handleSelect('buyer')}
          disabled={!!loadingRole}
        >
          <span className="role-card-badge">Buyer</span>
          <h2>Become a Buyer</h2>
          <p>
            Browse surplus inventory, place orders, and recover value for your business.
          </p>
        </button>

        <button
          type="button"
          className="role-card"
          onClick={() => handleSelect('seller')}
          disabled={!!loadingRole}
        >
          <span className="role-card-badge">Seller</span>
          <h2>Become a Seller</h2>
          <p>
            List surplus materials and equipment to reach verified buyers on Surplus.
          </p>
        </button>

        {error ? <p className="dash-error">{error}</p> : null}
      </div>
    </div>
  )
}
