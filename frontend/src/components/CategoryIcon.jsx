import { useEffect, useState } from 'react'
import { defineCustomElements } from 'ionicons/loader'

let ioniconsReady = false
let ioniconsPromise

function ensureIonicons() {
  if (ioniconsReady) {
    return Promise.resolve()
  }

  if (!ioniconsPromise) {
    ioniconsPromise = Promise.resolve().then(() => {
      defineCustomElements(window)
      ioniconsReady = true
    })
  }

  return ioniconsPromise
}

export default function CategoryIcon({ name, className = '', size = 22 }) {
  const [ready, setReady] = useState(ioniconsReady)

  useEffect(() => {
    let cancelled = false

    ensureIonicons().then(() => {
      if (!cancelled) {
        setReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready || !name) {
    return <span className={`category-icon-fallback ${className}`} aria-hidden="true" />
  }

  return (
    <ion-icon
      name={name}
      class={className}
      style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
    />
  )
}
