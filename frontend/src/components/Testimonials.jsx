import Reveal from './Reveal'
import { testimonials } from '../data/landingData'

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="section-inner">
        <Reveal>
          <div className="section-tag">Real Businesses. Real Results.</div>
        </Reveal>
        <Reveal>
          <h2 className="section-title">
            What our <span style={{ color: 'var(--accent)' }}>sellers</span>{' '}
            <span className="dim">say</span>
          </h2>
        </Reveal>
        <Reveal>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className={`testi-card${t.featured ? ' featured' : ''}`}
              >
                <div className="stars">★★★★★</div>
                <div className="testi-quote">&quot;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">
                  <div className="testi-avatar" style={t.avatarStyle}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
