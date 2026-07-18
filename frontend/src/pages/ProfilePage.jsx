import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath } from '../lib/authRedirect'

const emptyAddress = () => ({
  address: '',
  city: '',
  state: '',
  pincode: '',
})

export default function ProfilePage({ role }) {
  const { user, updateProfile, setRole, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [address, setAddress] = useState(user?.address || emptyAddress())
  const [saving, setSaving] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setAddress(user?.address || emptyAddress())
  }, [user])

  const displayName = user?.name || user?.email || 'User'
  const switchLabel = role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer'

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = { name }

      if (
        address.city.trim() ||
        address.state.trim() ||
        address.pincode.trim() ||
        address.address?.trim()
      ) {
        if (!address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
          throw new Error('City, state, and pincode are required when saving an address')
        }

        payload.address = {
          address: address.address?.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
        }
      }

      await updateProfile(payload)
      setMessage('Profile saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSwitchRole() {
    const nextRole = role === 'buyer' ? 'seller' : 'buyer'
    setSwitching(true)
    setError('')

    try {
      await setRole(nextRole)
      navigate(getPostAuthPath({ role: nextRole }), { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to switch role')
    } finally {
      setSwitching(false)
    }
  }

  async function handleSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

  function updateAddressField(field, value) {
    setAddress((current) => ({ ...current, [field]: value }))
  }

  return (
    <AppShell role={role} title="Profile">
      <div className="profile-account">
        <div className="profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            displayName[0]?.toUpperCase()
          )}
        </div>
        <div>
          <div className="profile-name">{displayName}</div>
          <div className="profile-email">{user?.email}</div>
          <span className="dash-role-badge" style={{ marginTop: '0.5rem' }}>
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <h3 className="dash-section-title">Personal details</h3>
          <p className="detail-section-sub">Update how your account appears</p>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <h3 className="dash-section-title">Address</h3>
          <p className="detail-section-sub">Used for pickup, delivery, and account verification</p>

          <div className="form-field">
            <label className="form-label" htmlFor="street">Street address</label>
            <input
              id="street"
              className="form-input"
              value={address.address || ''}
              onChange={(e) => updateAddressField('address', e.target.value)}
              placeholder="Street address (optional)"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="city">City</label>
              <input
                id="city"
                className="form-input"
                value={address.city}
                onChange={(e) => updateAddressField('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="state">State</label>
              <input
                id="state"
                className="form-input"
                value={address.state}
                onChange={(e) => updateAddressField('state', e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              className="form-input"
              style={{ maxWidth: 180 }}
              value={address.pincode}
              onChange={(e) =>
                updateAddressField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit pincode"
              maxLength={6}
            />
          </div>
        </div>

        {message ? <p className="dash-success">{message}</p> : null}
        {error ? <p className="dash-error">{error}</p> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <div className="dash-card profile-actions">
        <h3 className="dash-section-title">Account actions</h3>
        {role === 'buyer' ? (
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => navigate('/buyer/saved')}
          >
            Saved listings
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={handleSwitchRole}
          disabled={switching}
        >
          {switching ? 'Switching...' : switchLabel}
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </AppShell>
  )
}
