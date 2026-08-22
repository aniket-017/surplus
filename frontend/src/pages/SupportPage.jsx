import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
  WEBSITE_URL,
} from '../constants/links'

const ISSUE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  `${PRODUCT_NAME} — Issue report`,
)}`
const FEEDBACK_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  `${PRODUCT_NAME} — Feedback`,
)}`

export default function SupportPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${PRODUCT_NAME} Support`
    window.scrollTo(0, 0)
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="support-page">
      <Navbar />
      <main className="support-main">
        <div className="support-inner">
          <div className="section-tag">Support</div>
          <h1 className="support-title">{PRODUCT_NAME} Support</h1>
          <p className="support-lead">
            Need help with the {PRODUCT_NAME} app? Contact us for technical support,
            account assistance, listing issues, or general feedback. We aim to
            respond to support requests as soon as possible.
          </p>

          <section className="support-card" aria-labelledby="support-contact-heading">
            <h2 id="support-contact-heading" className="support-card-title">
              Contact information
            </h2>
            <dl className="support-dl">
              <div className="support-row">
                <dt>Company</dt>
                <dd>{COMPANY_NAME}</dd>
              </div>
              <div className="support-row">
                <dt>Product</dt>
                <dd>{PRODUCT_NAME}</dd>
              </div>
              <div className="support-row">
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </dd>
              </div>
              <div className="support-row">
                <dt>Website</dt>
                <dd>
                  <Link to="/">{WEBSITE_URL.replace(/^https:\/\//, '')}</Link>
                </dd>
              </div>
              <div className="support-row">
                <dt>Address</dt>
                <dd>
                  <address className="support-address">
                    {COMPANY_ADDRESS.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </address>
                </dd>
              </div>
            </dl>
          </section>

          <div className="support-grid">
            <section className="support-card" aria-labelledby="support-issue-heading">
              <h2 id="support-issue-heading" className="support-card-title">
                Report an issue
              </h2>
              <p>
                If something is not working in the {PRODUCT_NAME} app or website —
                sign-in problems, listing errors, messaging, or account access —
                email us with as much detail as you can.
              </p>
              <ul className="support-list">
                <li>What you were trying to do</li>
                <li>What happened instead</li>
                <li>The device, OS, and app version, if you know them</li>
                <li>Screenshots or the listing ID, when relevant</li>
              </ul>
              <a className="btn btn-primary" href={ISSUE_MAILTO}>
                Email an issue
              </a>
            </section>

            <section className="support-card" aria-labelledby="support-feedback-heading">
              <h2 id="support-feedback-heading" className="support-card-title">
                Provide feedback
              </h2>
              <p>
                We welcome product ideas, marketplace feedback, and suggestions
                for buyers and sellers. Tell us what is working well and what we
                should improve.
              </p>
              <ul className="support-list">
                <li>Feature requests and UX comments</li>
                <li>Category or listing feedback</li>
                <li>Anything else you want the team to know</li>
              </ul>
              <a className="btn btn-outline" href={FEEDBACK_MAILTO}>
                Send feedback
              </a>
            </section>
          </div>

          <p className="support-note">
            Send requests to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We aim to
            respond as soon as possible during business days.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
