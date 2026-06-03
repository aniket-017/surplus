import Reveal from './Reveal'
import { features, metrics } from '../data/landingData'

function MetricValue({ metric }) {
  if (metric.prefix) {
    return (
      <div className="metric-num">
        <span>{metric.value}</span>
        {metric.middle}
        <span>{metric.suffix}</span>
      </div>
    )
  }
  return (
    <div className="metric-num">
      {metric.value}
      <span>{metric.suffix}</span>
    </div>
  )
}

export default function Features() {
  return (
    <section className="features" id="why">
      <div className="section-inner">
        <Reveal>
          <div className="section-tag">Why Choose Us</div>
        </Reveal>
        <Reveal>
          <h2 className="section-title">
            Built for <span style={{ color: 'var(--accent)' }}>Indian</span>
            <br />
            <span className="dim">Industry</span>
          </h2>
        </Reveal>
        <div className="features-grid">
          <Reveal>
            <div className="feature-list">
              {features.map((feat) => (
                <div key={feat.title} className="feat-item">
                  <div className="feat-icon">{feat.icon}</div>
                  <div>
                    <div className="feat-title">{feat.title}</div>
                    <p className="feat-desc">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="features-right">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`metric-box${metric.highlight ? ' highlight' : ''}`}
                >
                  <MetricValue metric={metric} />
                  <div className="metric-label">{metric.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
