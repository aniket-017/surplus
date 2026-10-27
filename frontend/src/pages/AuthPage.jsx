import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import { getAuthMethods, resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/api'
import { getPostAuthPath } from '../lib/authRedirect'
import { formatPhoneForDisplay, toE164Phone } from '../lib/phone'

const RESEND_COOLDOWN_SECONDS = 30
const OTP_LENGTH = 4

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phoneInput, setPhoneInput] = useState('')
  const [e164Phone, setE164Phone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [phoneEnabled, setPhoneEnabled] = useState(false)
  const completingRef = useRef(false)

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
        setPhoneEnabled(phone)

        if (!phone) {
          setError('Phone sign-in is not available right now. Please try again later.')
        }
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

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function handleSendPhoneOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    completingRef.current = false

    if (!phoneEnabled) {
      setError('Phone sign-in is not available right now. Please try again later.')
      return
    }

    const normalized = toE164Phone(phoneInput)
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)

    try {
      await sendPhoneOtp(normalized)
      setE164Phone(normalized)
      setStep('otp')
      setOtp('')
      setResendIn(RESEND_COOLDOWN_SECONDS)
      setInfo(`We sent a ${OTP_LENGTH}-digit code to your phone.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    if (resendIn > 0 || resending || loading || !e164Phone) return

    setError('')
    setInfo('')
    setResending(true)

    try {
      await resendPhoneOtp(e164Phone)
      setOtp('')
      setResendIn(RESEND_COOLDOWN_SECONDS)
      setInfo('We sent a new code to your phone.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  async function handleVerifyPhoneOtp(event) {
    event.preventDefault()
    setError('')
    setInfo('')

    const code = otp.trim()
    if (code.length !== OTP_LENGTH || !/^\d+$/.test(code)) {
      setError(`Enter the ${OTP_LENGTH}-digit verification code.`)
      return
    }

    if (completingRef.current) return

    completingRef.current = true
    setLoading(true)

    try {
      const data = await verifyPhoneOtp(e164Phone, code)
      setInfo('Verified. Signing you in…')
      setUser(data.user)
      navigate(getPostAuthPath(data.user), { replace: true })
    } catch (err) {
      setError(err.message)
      completingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  function resetToPhoneStep() {
    setStep('phone')
    setOtp('')
    setError('')
    setInfo('')
    setResendIn(0)
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
                pattern={`\\d{${OTP_LENGTH}}`}
                maxLength={OTP_LENGTH}
                className="auth-input auth-otp-input"
                placeholder={'0'.repeat(OTP_LENGTH)}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))
                }
                required
                autoComplete="one-time-code"
              />

              {error && <p className="auth-error">{error}</p>}
              {info && <p className="auth-info">{info}</p>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Continue'}
              </button>

              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResendOtp}
                disabled={resendIn > 0 || resending || loading}
              >
                {resending
                  ? 'Resending...'
                  : resendIn > 0
                    ? `Resend code in ${resendIn}s`
                    : 'Resend code'}
              </button>

              <button type="button" className="auth-link-btn" onClick={resetToPhoneStep}>
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
