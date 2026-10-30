import appStoreBadge from '../assets/badges/app-store.png'
import googlePlayBadge from '../assets/badges/google-play.png'
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/links'

const BADGES = [
  { href: APP_STORE_URL, src: appStoreBadge, alt: 'Download on the App Store' },
  { href: PLAY_STORE_URL, src: googlePlayBadge, alt: 'Get it on Google Play' },
]

export default function StoreBadges({ size = 'md', column = false, className = '', onClick }) {
  const classes = [
    'store-badges',
    `store-badges--${size}`,
    column ? 'store-badges--column' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {BADGES.map((badge) => (
        <a
          key={badge.href}
          href={badge.href}
          className="store-badge-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          <img src={badge.src} alt={badge.alt} loading="lazy" />
        </a>
      ))}
    </div>
  )
}
