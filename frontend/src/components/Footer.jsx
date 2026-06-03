import { footerLinks } from '../data/landingData'

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo">
            SUR<span>PLUS</span>
          </div>
          <p className="footer-tagline">
            India&apos;s trusted marketplace for industrial surplus inventory. Transparent
            pricing, verified buyers, reliable deals.
          </p>
        </div>
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <div className="footer-col-title">{title}</div>
            <ul className="footer-links">
              {links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">
          © 2025 Surplus Technologies Pvt. Ltd. All rights reserved.
        </span>
        <span className="footer-made">
          Made with <span>♥</span> in India 🇮🇳
        </span>
      </div>
    </footer>
  )
}
