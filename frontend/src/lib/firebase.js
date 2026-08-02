import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirebaseWebConfig } from './api'

let app = null
let config = null
let loadPromise = null

export function isFirebaseWebConfigured() {
  return Boolean(
    config?.apiKey?.trim() &&
      config?.authDomain?.trim() &&
      config?.projectId?.trim() &&
      config?.appId?.trim(),
  )
}

/** Loads Firebase web config from the backend (backend/.env FIREBASE_WEB_*). */
export async function ensureFirebaseReady() {
  if (isFirebaseWebConfigured() && app) {
    return true
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      config = await getFirebaseWebConfig()
      if (!isFirebaseWebConfigured()) {
        throw new Error(
          'Phone sign-in is not configured. Add FIREBASE_WEB_* values to backend/.env.',
        )
      }

      if (!app) {
        app = getApps().length ? getApps()[0] : initializeApp(config)
      }

      return true
    })().catch((error) => {
      loadPromise = null
      throw error
    })
  }

  return loadPromise
}

export function getFirebaseApp() {
  if (!app || !isFirebaseWebConfigured()) {
    throw new Error(
      'Phone sign-in is not ready. Call ensureFirebaseReady() first, and set FIREBASE_WEB_* in backend/.env.',
    )
  }
  return app
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}
