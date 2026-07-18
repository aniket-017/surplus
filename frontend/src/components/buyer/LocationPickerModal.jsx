import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useBuyerLocation } from '../../context/LocationContext'
import { formatBuyerLocation, POPULAR_CITIES } from '../../lib/cities'

export default function LocationPickerModal({ open, onClose }) {
  const { user } = useAuth()
  const { location, detectingLocation, setManualLocation, detectCurrentLocation, clearLocation } =
    useBuyerLocation()

  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const profileCity = user?.address?.city?.trim() || ''
  const profileState = user?.address?.state?.trim() || ''

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return POPULAR_CITIES
    return POPULAR_CITIES.filter(
      (option) =>
        option.city.toLowerCase().includes(query) || option.state.toLowerCase().includes(query),
    )
  }, [search])

  const customEntry = search.trim()
  const showCustomEntry =
    customEntry.length > 1 &&
    !filteredCities.some((option) => option.city.toLowerCase() === customEntry.toLowerCase())

  function closeModal() {
    setSearch('')
    setError('')
    onClose()
  }

  async function handleUseCurrentLocation() {
    setError('')
    try {
      await detectCurrentLocation()
      closeModal()
    } catch (err) {
      setError(err.message || 'Could not detect your location')
    }
  }

  function handleSelectCity(option) {
    setError('')
    try {
      setManualLocation(option.city, option.state)
      closeModal()
    } catch (err) {
      setError(err.message || 'Could not save location')
    }
  }

  function handleUseProfileAddress() {
    if (!profileCity) return
    handleSelectCity({ city: profileCity, state: profileState })
  }

  function handleClearLocation() {
    setError('')
    clearLocation()
    closeModal()
  }

  if (!open) return null

  return (
    <div className="location-modal-backdrop" onClick={closeModal} role="presentation">
      <div
        className="location-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="location-modal-header">
          <h3 id="location-modal-title">Choose your location</h3>
          <button type="button" className="location-modal-close" onClick={closeModal} aria-label="Close">
            ×
          </button>
        </div>

        {location ? (
          <div className="location-modal-current">
            <span>Current: {formatBuyerLocation(location)}</span>
            <button type="button" className="location-clear-btn" onClick={handleClearLocation}>
              Clear
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="location-gps-btn"
          onClick={handleUseCurrentLocation}
          disabled={detectingLocation}
        >
          {detectingLocation ? 'Detecting your location…' : 'Use my current location'}
        </button>

        {profileCity ? (
          <button type="button" className="location-profile-btn" onClick={handleUseProfileAddress}>
            <span className="location-profile-label">Use profile address</span>
            <span className="location-profile-value">
              {profileCity}
              {profileState ? `, ${profileState}` : ''}
            </span>
          </button>
        ) : null}

        {error ? <p className="location-modal-error">{error}</p> : null}

        <div className="location-search-box">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setError('')
            }}
            placeholder="Search or type your city"
            autoFocus
          />
        </div>

        <div className="location-city-list">
          {showCustomEntry ? (
            <button
              type="button"
              className="location-city-row"
              onClick={() => handleSelectCity({ city: customEntry, state: '' })}
            >
              Use &ldquo;{customEntry}&rdquo;
            </button>
          ) : null}

          {filteredCities.map((item) => {
            const selected =
              location?.city.toLowerCase() === item.city.toLowerCase() &&
              (location?.state || '').toLowerCase() === item.state.toLowerCase()

            return (
              <button
                key={`${item.city}-${item.state}`}
                type="button"
                className={`location-city-row${selected ? ' selected' : ''}`}
                onClick={() => handleSelectCity(item)}
              >
                <span>
                  {item.city}
                  <span className="location-city-state">, {item.state}</span>
                </span>
                {selected ? <span className="location-city-check">✓</span> : null}
              </button>
            )
          })}

          {!showCustomEntry && filteredCities.length === 0 ? (
            <p className="location-city-empty">No matching cities. Type to add your own.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
