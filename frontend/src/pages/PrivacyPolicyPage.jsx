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

export default function PrivacyPolicyPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${PRODUCT_NAME} Privacy Policy`
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
          <div className="section-tag">Legal</div>
          <h1 className="support-title">Privacy Policy</h1>
          <p className="support-updated">Last updated: 22 August 2026</p>
          <p className="support-lead">
            This Privacy Policy explains how {COMPANY_NAME} (“we”, “us”) collects, uses, and
            shares information when you use the {PRODUCT_NAME} website and mobile apps.
          </p>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Who we are</h2>
            <p>
              {PRODUCT_NAME} is an industrial surplus marketplace operated by {COMPANY_NAME}.
            </p>
            <p>
              Registered office:{' '}
              {COMPANY_ADDRESS.join(', ')}.
            </p>
            <p>
              Website:{' '}
              <a href={WEBSITE_URL} rel="noopener noreferrer">
                {WEBSITE_URL.replace(/^https:\/\//, '')}
              </a>
              . Support:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Information we collect</h2>
            <h3>Account information</h3>
            <p>
              When you create an account we collect the details you provide, which may
              include your name, phone number, email address, buyer or seller role,
              profile photo, and address (street, city, state, pincode, and map
              coordinates if you set a pin).
            </p>
            <p>
              We use phone number sign-in through Firebase Authentication (Google). If
              you sign in with Google on the website, we receive your Google account
              identifier, name, and email.
            </p>

            <h3>Listings and marketplace activity</h3>
            <p>
              Sellers may upload product photos, titles, descriptions, quantities,
              prices, condition, category, and pickup location. Buyers may save listings
              and report listings they believe are spam, misleading, prohibited, or
              incorrectly categorised.
            </p>

            <h3>Messages</h3>
            <p>
              If you chat with another user about a listing, we store the conversation,
              including message text and any photos or files you send.
            </p>

            <h3>Device permissions</h3>
            <p>
              With your permission, the app may access:
            </p>
            <ul className="support-list">
              <li>Camera and photo library, to add listing or chat images</li>
              <li>Location, to show nearby listings and help you set an address</li>
              <li>Notifications, to alert you about messages and account updates</li>
            </ul>
            <p>You can turn these permissions off in your device settings.</p>

            <h3>Device and technical data</h3>
            <p>
              We may store a push-notification token and platform (iOS or Android) so we
              can send you alerts. On the website we use an authentication cookie to keep
              you signed in. We also record basic listing view counts.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">How we use information</h2>
            <p>We use the information above to:</p>
            <ul className="support-list">
              <li>Create and manage your account, and keep you signed in</li>
              <li>Publish listings and help buyers and sellers find each other</li>
              <li>Enable in-app messaging about listings</li>
              <li>
                Analyse listing photos with Google Gemini so we can suggest product
                details when a seller uploads images
              </li>
              <li>Show maps and resolve addresses with Google Maps</li>
              <li>Send transactional notifications you have opted in to receive</li>
              <li>Review reports, prevent abuse, and keep the marketplace safe</li>
              <li>Respond to support requests you send us</li>
            </ul>
            <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">How information is shared</h2>
            <h3>Other users</h3>
            <p>
              Listings you publish, including photos and location details you include,
              are visible to other signed-in users. Your name (and profile photo, if you
              add one) may be shown in conversations. Messages and attachments are shared
              with the other person in that chat.
            </p>

            <h3>Service providers</h3>
            <p>We use trusted providers to operate the service:</p>
            <ul className="support-list">
              <li>Google Firebase, for phone authentication</li>
              <li>Google, for optional website sign-in, Maps, and listing-photo analysis</li>
              <li>Amazon Web Services, to store listing and chat files</li>
              <li>Expo, to deliver push notifications on mobile</li>
            </ul>
            <p>
              These providers process data on our behalf under their own terms and
              privacy policies. We may also disclose information if required by law or to
              protect users, {COMPANY_NAME}, or the public.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Retention</h2>
            <p>
              We keep account, listing, message, and report data for as long as needed to
              provide the marketplace, handle disputes, and meet legal obligations. If
              you ask us to delete your account, we will delete or de-identify personal
              data we no longer need to retain.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Your choices and rights</h2>
            <p>
              You can update your name, email, and address in your profile. You can
              remove or mark listings as sold. You can control camera, photos, location,
              and notification access in your device settings.
            </p>
            <p>
              To access, correct, or delete your personal information, or to request
              account deletion, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the contact
              details on your account. We will respond as soon as reasonably possible.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Children</h2>
            <p>
              {PRODUCT_NAME} is intended for business users aged 18 and over. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Security</h2>
            <p>
              We use industry-standard measures such as encrypted connections and
              restricted access to help protect your information. No method of
              transmission or storage is completely secure.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Changes</h2>
            <p>
              We may update this policy from time to time. The “Last updated” date at the
              top of this page will change when we do. Continued use of {PRODUCT_NAME}{' '}
              after an update means you accept the revised policy.
            </p>
          </section>

          <section className="support-card support-prose">
            <h2 className="support-card-title">Contact us</h2>
            <p>
              Questions about this policy or your data can be sent to{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or by post to:
            </p>
            <address className="support-address">
              <span>{COMPANY_NAME}</span>
              {COMPANY_ADDRESS.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <p>
              You can also visit our{' '}
              <Link to="/support">Support</Link> page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
