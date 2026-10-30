import Reveal from './Reveal'
import { categories } from '../data/landingData'

export default function Categories() {
  return (
    <section className="categories" id="categories">
      <div className="section-inner">
        <Reveal>
          <div className="section-tag">What&apos;s on the Platform</div>
        </Reveal>
        <Reveal>
          <h2 className="section-title">
            Browse by <span style={{ color: 'var(--accent)' }}>Category</span>
          </h2>
        </Reveal>
        <Reveal>
          <div className="cat-grid">
            {categories.map((cat) => (
              <a key={cat.name} href="#" className="cat-card">
                <div className="cat-media">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                </div>
                <div className="cat-body">
                  <div className="cat-name">{cat.name}</div>
                  <div className="cat-count">{cat.count}</div>
                </div>
                <span className="cat-arrow">↗</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
