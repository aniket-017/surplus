import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath, needsProfile } from '../lib/authRedirect'

export default function OnboardingProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name?.trim() ?? '')
  const [email, setEmail] = useState(user?.email?.trim() ?? '')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user && !needsProfile(user)) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your name to continue.')
      return
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address, or leave it blank.')
      return
    }

    setLoading(true)

    try {
      const trimmedReferral = referralCode.trim()
      const updated = await updateProfile({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail.toLowerCase() } : {}),
        ...(trimmedReferral ? { referralCode: trimmedReferral } : {}),
      })
      navigate(getPostAuthPath(updated), { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to save your profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-logo">
          <img src={surplusLogo} alt="Surplus" className="logo-img" />
        </Link>

        <div className="auth-card">
          <p className="auth-step-badge">Step 1 of 2</p>

          <div className="auth-header">
            <h1>What&apos;s your name?</h1>
            <p>Tell us a bit about you so we can personalize your Surplus experience.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label" htmlFor="onboarding-name">
              Full name
            </label>
            <input
              id="onboarding-name"
              type="text"
              className="auth-input"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              required
              disabled={loading}
            />

            <label className="auth-label" htmlFor="onboarding-email">
              Email (optional)
            </label>
            <input
              id="onboarding-email"
              type="email"
              className="auth-input"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
            />

            <label className="auth-label" htmlFor="onboarding-referral">
              Referral code (optional)
            </label>
            <input
              id="onboarding-referral"
              type="text"
              className="auth-input"
              placeholder="e.g. PARTNER2026"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              disabled={loading}
              maxLength={32}
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
