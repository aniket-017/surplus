import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath } from '../lib/authRedirect'

export default function RoleSwitchButton({ role, variant = 'sidebar' }) {
  const { setRole } = useAuth()
  const navigate = useNavigate()
  const [switching, setSwitching] = useState(false)

  const nextRole = role === 'buyer' ? 'seller' : 'buyer'
  const label = role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer'
  const shortLabel = role === 'buyer' ? 'Seller mode' : 'Buyer mode'
  const navLabel = role === 'buyer' ? 'Sell' : 'Buy'

  async function handleSwitch() {
    setSwitching(true)

    try {
      await setRole(nextRole)
      navigate(getPostAuthPath({ role: nextRole }), { replace: true })
    } catch {
      // Role switch errors are rare; user can retry from profile if needed.
    } finally {
      setSwitching(false)
    }
  }

  if (variant === 'bottom-nav') {
    return (
      <button
        type="button"
        className="app-nav-link app-nav-link-switch"
        onClick={handleSwitch}
        disabled={switching}
        title={label}
      >
        {switching ? '…' : navLabel}
      </button>
    )
  }

  const compact = variant === 'compact'

  return (
    <button
      type="button"
      className={`role-switch-btn${compact ? ' role-switch-btn-compact' : ''}`}
      onClick={handleSwitch}
      disabled={switching}
      title={label}
    >
      <span className="role-switch-btn-icon" aria-hidden="true">
        ⇄
      </span>
      <span className="role-switch-btn-text">{compact ? shortLabel : label}</span>
    </button>
  )
}
