import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import { getAuthMethods, verifyFirebasePhone } from '../lib/api'
import { getPostAuthPath } from '../lib/authRedirect'
import {
  confirmFirebasePhoneOtp,
  mapFirebaseAuthError,
  preparePhoneAuth,
  sendFirebasePhoneOtp,
} from '../lib/firebaseAuth'
import { formatPhoneForDisplay, toE164Phone } from '../lib/phone'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phoneInput, setPhoneInput] = useState('')
  const [e164Phone, setE164Phone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [phoneConfigured, setPhoneConfigured] = useState(false)
  const [phoneReady, setPhoneReady] = useState(false)
  const confirmationRef = useRef(null)
  const completingRef = useRef(false)

  const phoneEnabled = phoneConfigured && phoneReady

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    if (user) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const next = await getAuthMethods()
        if (cancelled) return

        const phone = Boolean(next.phone)
        setPhoneConfigured(phone)

        if (!phone) {
          setError(
            'Phone authentication is not available. Set FIREBASE_* Admin and FIREBASE_WEB_* in backend/.env.',
          )
          return
        }

        await preparePhoneAuth()
        if (cancelled) return
        setPhoneReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load sign-in options')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function completeWithIdToken(idToken) {
    if (completingRef.current) {
      return
    }

    completingRef.current = true
    setLoading(true)
    setError('')
    setInfo('Verified. Signing you in…')

    try {
      const data = await verifyFirebasePhone(idToken)
      setUser(data.user)
      navigate(getPostAuthPath(data.user), { replace: true })
    } catch (err) {
      setError(err.message)
      completingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  async function handleSendPhoneOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    completingRef.current = false

    if (!phoneEnabled) {
      setError(
        'Phone sign-in is not configured. Add FIREBASE_WEB_* values to backend/.env.',
      )
      return
    }

    const normalized = toE164Phone(phoneInput)
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)

    try {
      confirmationRef.current = await sendFirebasePhoneOtp(normalized)
      setE164Phone(normalized)
      setStep('otp')
      setOtp('')
      setInfo('We sent a 6-digit code to your phone.')
    } catch (err) {
      setError(mapFirebaseAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyPhoneOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')

    const code = otp.trim()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit verification code.')
      return
    }

    if (!confirmationRef.current) {
      setError('Request a new OTP and try again.')
      setStep('phone')
      return
    }

    setLoading(true)

    try {
      const idToken = await confirmFirebasePhoneOtp(confirmationRef.current, code)
      await completeWithIdToken(idToken)
    } catch (err) {
      setError(mapFirebaseAuthError(err))
      setLoading(false)
    }
  }

  function resetToPhoneStep() {
    setStep('phone')
    setOtp('')
    setError('')
    setInfo('')
    confirmationRef.current = null
    completingRef.current = false
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-logo">
          <img src={surplusLogo} alt="Surplus" className="logo-img" />
        </Link>

        <div className="auth-card">
          <div className="auth-header">
            <h1>{step === 'otp' ? 'Enter verification code' : 'Welcome to Surplus'}</h1>
            <p>
              {step === 'otp'
                ? `Code sent to ${formatPhoneForDisplay(e164Phone)}`
                : 'Enter your mobile number to continue. We’ll send a one-time code to verify it’s you.'}
            </p>
          </div>

          {step === 'phone' && (
            <form className="auth-form" onSubmit={handleSendPhoneOtp}>
              <label className="auth-label" htmlFor="phone">
                Mobile number
              </label>
              <div className="auth-phone-field">
                <span className="auth-country-code">+91</span>
                <span className="auth-phone-divider" aria-hidden="true" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="auth-input auth-phone-input"
                  placeholder="98765 43210"
                  value={phoneInput}
                  onChange={(event) =>
                    setPhoneInput(event.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  required
                  maxLength={10}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || !phoneEnabled || phoneInput.length < 10}
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="auth-form" onSubmit={handleVerifyPhoneOtp}>
              <label className="auth-label" htmlFor="phone-otp">
                Verification code
              </label>
              <input
                id="phone-otp"
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
                {loading ? 'Verifying...' : 'Continue'}
              </button>

              <button type="button" className="auth-link-btn" onClick={resetToPhoneStep}>
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>

      <div id="recaptcha-container" />
    </div>
  )
}
