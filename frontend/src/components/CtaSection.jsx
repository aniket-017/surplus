import Reveal from './Reveal'
import { Link } from 'react-router-dom'
import StoreBadges from './StoreBadges'

export default function CtaSection() {
  return (
    <section className="cta-section" id="download">
      <Reveal>
        <div className="cta-inner">
          <div>
            <div className="section-tag" style={{ marginBottom: 16 }}>
              Get Started Today
            </div>
            <h2 className="cta-title">
              Your idle inventory
              <br />
              <span>is someone&apos;s</span> opportunity.
            </h2>
            <p className="cta-sub">
              Join thousands of Indian manufacturers already turning surplus stock into
              working capital. Free to list. No hidden fees until you close.
            </p>
          </div>
          <div className="cta-actions">
            <Link
              to="/signin"
              className="btn btn-primary"
              style={{
                width: 200,
                justifyContent: 'center',
                fontSize: 15,
                padding: '14px 28px',
              }}
            >
              List for Free →
            </Link>
            <StoreBadges column className="cta-store-badges" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
