import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth'
import { ensureFirebaseReady, getFirebaseAuth, isFirebaseWebConfigured } from './firebase'

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'

let recaptchaVerifier = null

export function isPhoneAuthReady() {
  return isFirebaseWebConfigured()
}

export async function preparePhoneAuth() {
  await ensureFirebaseReady()
  return isFirebaseWebConfigured()
}

function clearRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear()
    } catch {
      // Ignore clear errors from a stale verifier.
    }
    recaptchaVerifier = null
  }

  const container = document.getElementById(RECAPTCHA_CONTAINER_ID)
  if (container) {
    container.innerHTML = ''
  }
}

function getOrCreateRecaptchaVerifier() {
  if (typeof window === 'undefined') {
    throw new Error('Phone auth is only available in the browser.')
  }

  let container = document.getElementById(RECAPTCHA_CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = RECAPTCHA_CONTAINER_ID
    container.style.display = 'none'
    document.body.appendChild(container)
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier
  }

  const auth = getFirebaseAuth()
  recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
    size: 'invisible',
  })

  return recaptchaVerifier
}

export async function sendFirebasePhoneOtp(e164Phone) {
  await ensureFirebaseReady()
  const auth = getFirebaseAuth()

  // Clear any previous Firebase session so this attempt owns verification.
  if (auth.currentUser) {
    await signOut(auth)
  }

  clearRecaptcha()
  const verifier = getOrCreateRecaptchaVerifier()
  return signInWithPhoneNumber(auth, e164Phone, verifier)
}

export async function confirmFirebasePhoneOtp(confirmation, code) {
  await ensureFirebaseReady()
  const credential = await confirmation.confirm(code)
  const user = credential?.user ?? getFirebaseAuth().currentUser

  if (!user) {
    throw new Error('Phone verification failed. Please try again.')
  }

  return user.getIdToken(true)
}

export async function signOutFirebaseAuth() {
  await ensureFirebaseReady()
  const auth = getFirebaseAuth()
  if (auth.currentUser) {
    await signOut(auth)
  }
}

export function mapFirebaseAuthError(error) {
  const code = typeof error?.code === 'string' ? error.code : ''
  const message = error instanceof Error ? error.message : String(error ?? '')

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid mobile number.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check the code and try again.'
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'OTP expired. Request a new code.'
    case 'auth/missing-client-identifier':
    case 'auth/argument-error':
      return 'Phone auth is not configured for this site. Check Firebase web settings and authorized domains.'
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Refresh the page and try again.'
    default:
      return message || 'Something went wrong'
  }
}
