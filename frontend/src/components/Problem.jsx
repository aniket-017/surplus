import Reveal from './Reveal'
import { problemCards } from '../data/landingData'

export default function Problem() {
  return (
    <section className="problem" id="problem">
      <div className="section-inner">
        <Reveal>
          <div className="section-tag">The Problem</div>
        </Reveal>
        <Reveal>
          <h2 className="section-title">
            India&apos;s industrial surplus <span className="dim">is leaking value</span>
          </h2>
        </Reveal>
        <Reveal>
          <p className="section-desc">
            Every year, billions of rupees worth of usable industrial material is sold at
            throwaway prices or simply wastes away in godowns.
          </p>
        </Reveal>
        <Reveal>
          <div className="problem-grid">
            {problemCards.map((card) => (
              <div key={card.title} className="problem-card">
                <span className="p-icon">{card.icon}</span>
                <div className="p-title">{card.title}</div>
                <p className="p-desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
