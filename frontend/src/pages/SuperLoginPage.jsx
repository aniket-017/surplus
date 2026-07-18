import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import { sendSuperadminOtp, verifySuperadminOtp } from '../lib/api'
import { getSuperadminPath } from '../lib/authRedirect'

export default function SuperLoginPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (user?.isSuperAdmin && !user.isBanned) {
      navigate(getSuperadminPath(), { replace: true })
    }
  }, [user, navigate])

  async function handleSendOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      await sendSuperadminOtp(email.trim().toLowerCase())
      setStep('otp')
      setInfo('We sent a 6-digit code to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const data = await verifySuperadminOtp(email.trim().toLowerCase(), otp.trim())
      setUser(data.user)
      navigate(getSuperadminPath(), { replace: true })
    } catch (err) {
      setError(err.message)
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
          <div className="auth-header">
            <h1>Superadmin</h1>
            <p>Sign in with your authorized superadmin email to manage the platform.</p>
          </div>

          {step === 'email' && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <label className="auth-label" htmlFor="superadmin-email">
                Email address
              </label>
              <input
                id="superadmin-email"
                type="email"
                className="auth-input"
                placeholder="you@surplustovalue.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send verification code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <p className="auth-email-hint">
                Code sent to <strong>{email}</strong>
              </p>

              <label className="auth-label" htmlFor="superadmin-otp">
                Verification code
              </label>
              <input
                id="superadmin-otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="auth-input auth-otp-input"
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
              />

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Sign in'}
              </button>

              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setError('')
                  setInfo('')
                }}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
