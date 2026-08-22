import { Link } from 'react-router-dom'
import { COMPANY_NAME } from '../constants/links'
import { footerLinks } from '../data/landingData'

function FooterLink({ link }) {
  const label = typeof link === 'string' ? link : link.label
  const href = typeof link === 'string' ? '#' : link.href

  if (href?.startsWith('/')) {
    return <Link to={href}>{label}</Link>
  }

  return <a href={href || '#'}>{label}</a>
}

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
                <li key={typeof link === 'string' ? link : link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </span>
        <span className="footer-made">
          Made with <span>♥</span> in India 🇮🇳
        </span>
      </div>
    </footer>
  )
}
