import { useState } from 'react'
import Reveal from './Reveal'
import { steps, filterChips, appListings } from '../data/landingData'

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [activeFilter, setActiveFilter] = useState(0)

  return (
    <section className="how" id="how">
      <div className="section-inner">
        <Reveal>
          <div className="section-tag">The Solution</div>
        </Reveal>
        <Reveal>
          <h2 className="section-title">
            How <span style={{ color: 'var(--accent)' }}>Surplus</span> works
          </h2>
        </Reveal>
        <div className="steps-layout">
          <Reveal>
            <div className="steps-list">
              {steps.map((step, index) => (
                <div
                  key={step.num}
                  className={`step${activeStep === index ? ' active' : ''}`}
                  onClick={() => setActiveStep(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveStep(index)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="step-num">{step.num}</div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <p className="step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="steps-visual">
              <div className="phone-mock">
                <div className="phone-notch" />
                <div className="app-screen">
                  <div className="app-header">
                    Marketplace
                    <span className="app-header-badge">48 New</span>
                  </div>
                  <div className="app-filter">
                    {filterChips.map((chip, index) => (
                      <button
                        key={chip}
                        type="button"
                        className={`filter-chip${activeFilter === index ? ' active' : ''}`}
                        onClick={() => setActiveFilter(index)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  {appListings.map((listing) => (
                    <div key={listing.name} className="app-listing">
                      <div className="app-listing-name">{listing.name}</div>
                      <div className="app-listing-meta">
                        <span className="app-listing-qty">{listing.qty}</span>
                        <span className="app-listing-price">{listing.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
