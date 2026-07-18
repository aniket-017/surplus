import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LOCATION_KEY = 'surplus_buyer_location'

const LocationContext = createContext(null)

function parseStoredLocation(raw) {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.city === 'string' && parsed.city.trim()) {
      return {
        city: parsed.city.trim(),
        state: typeof parsed.state === 'string' ? parsed.state.trim() : '',
        source: parsed.source === 'gps' || parsed.source === 'manual' ? parsed.source : 'manual',
      }
    }
  } catch {
    // Ignore corrupted stored value
  }

  return null
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    })
  })
}

async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error('Could not determine your city from GPS.')
  }

  const data = await res.json()
  const address = data.address || {}
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    address.state_district ||
    ''
  const state = address.state || ''

  if (!city) {
    throw new Error('Could not determine your city. Please choose it manually.')
  }

  return { city, state }
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    const stored = parseStoredLocation(localStorage.getItem(LOCATION_KEY))
    setLocation(stored)
    setLoadingLocation(false)
  }, [])

  const persistLocation = useCallback((next) => {
    setLocation(next)
    if (next) {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(LOCATION_KEY)
    }
  }, [])

  const setManualLocation = useCallback(
    (city, state) => {
      const trimmedCity = city.trim()
      if (!trimmedCity) {
        throw new Error('City is required')
      }

      persistLocation({
        city: trimmedCity,
        state: (state || '').trim(),
        source: 'manual',
      })
    },
    [persistLocation],
  )

  const detectCurrentLocation = useCallback(async () => {
    setDetectingLocation(true)

    try {
      let position
      try {
        position = await getCurrentPosition()
      } catch (err) {
        if (err?.code === 1) {
          throw new Error(
            'Location permission was denied. Allow location access in your browser to use this feature.',
          )
        }
        if (err?.code === 2) {
          throw new Error('Location services are unavailable. Please choose your city manually.')
        }
        if (err?.code === 3) {
          throw new Error('Location request timed out. Please try again or choose a city manually.')
        }
        throw new Error(err?.message || 'Could not detect your location')
      }

      const { city, state } = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      )

      const next = { city, state, source: 'gps' }
      persistLocation(next)
      return next
    } finally {
      setDetectingLocation(false)
    }
  }, [persistLocation])

  const clearLocation = useCallback(() => {
    persistLocation(null)
  }, [persistLocation])

  const value = useMemo(
    () => ({
      location,
      loadingLocation,
      detectingLocation,
      setManualLocation,
      detectCurrentLocation,
      clearLocation,
    }),
    [
      location,
      loadingLocation,
      detectingLocation,
      setManualLocation,
      detectCurrentLocation,
      clearLocation,
    ],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useBuyerLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useBuyerLocation must be used within LocationProvider')
  }
  return context
}
