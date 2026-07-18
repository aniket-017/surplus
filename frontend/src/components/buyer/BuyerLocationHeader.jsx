import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useBuyerLocation } from '../../context/LocationContext'
import { formatBuyerLocation } from '../../lib/cities'
import LocationPickerModal from './LocationPickerModal'

export default function BuyerLocationHeader() {
  const { user } = useAuth()
  const { location } = useBuyerLocation()
  const [pickerOpen, setPickerOpen] = useState(false)

  const profileLabel = user?.address?.city
    ? `${user.address.city}, ${user.address.state}`
    : ''
  const locationLabel = location
    ? formatBuyerLocation(location)
    : profileLabel || 'Choose location'

  return (
    <>
      <button
        type="button"
        className="buyer-location-trigger"
        onClick={() => setPickerOpen(true)}
      >
        <span className="buyer-location-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className="buyer-location-text">
          <span className="buyer-location-label">Location</span>
          <span className="buyer-location-value">{locationLabel}</span>
        </span>
        <span className="buyer-location-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <LocationPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
