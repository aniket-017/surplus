import { heroListings, chartBars } from '../data/landingData'
import { PLAY_STORE_URL } from '../constants/links'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-grid-lines" />
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-badge">India&apos;s Industrial Marketplace</div>
          <h1 className="hero-title">
            Turn
            <br />
            <span className="accent">Surplus</span>
            <br />
            <span className="line2">Into Value</span>
          </h1>
          <p className="hero-sub">
            Connect with verified buyers and sellers across auto parts, packaging,
            chemicals, metals, and more. Stop losing money on idle inventory.
          </p>
          <div className="hero-actions">
            <a
              href={PLAY_STORE_URL}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download App →
            </a>
            <a href="#how" className="btn btn-ghost">
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-tag t1">
            <div className="tag-dot" />
            Live Deal Matched
          </div>
          <div className="floating-tag t2">🏭 Pune → Ahmedabad</div>
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="card-title-text">surplus.app — marketplace</span>
            </div>
            <div className="card-body">
              {heroListings.map((item) => (
                <div key={item.name} className="listing-item">
                  <div className="listing-icon" style={{ background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div className="listing-info">
                    <div className="listing-name">{item.name}</div>
                    <div className="listing-detail">{item.detail}</div>
                  </div>
                  <div className="listing-price">
                    <div className="price-val">{item.price}</div>
                    <div className="price-badge">{item.badge}</div>
                  </div>
                </div>
              ))}
              <div className="card-chart">
                <div className="chart-label">// WEEKLY DEAL VOLUME</div>
                <div className="chart-bars">
                  {chartBars.map((bar, i) => (
                    <div
                      key={i}
                      className="bar"
                      style={{
                        height: '100%',
                        '--h': bar.h,
                        '--delay': bar.delay,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
