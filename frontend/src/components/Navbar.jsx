import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath } from '../lib/authRedirect'

const NAV_LINKS = [
  { href: '#problem', label: 'Problem' },
  { href: '#how', label: 'How it Works' },
  { href: '#categories', label: 'Categories' },
  { href: '#why', label: 'Why Surplus' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleSignOut() {
    closeMenu()
    await logout()
  }

  return (
    <>
      <nav className="landing-nav">
        <Link to="/" className="logo nav-logo" onClick={closeMenu}>
          <img
            src={surplusLogo}
            alt="Surplus — Buy, Sell, Recover Value"
            className="logo-img"
          />
        </Link>
        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-cta">
          {user ? (
            <>
              <Link to={getPostAuthPath(user)} className="btn btn-primary">
                Dashboard
              </Link>
              <span className="nav-user">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="nav-user-avatar" />
                ) : (
                  <span className="nav-user-initial">{user.email[0].toUpperCase()}</span>
                )}
                <span className="nav-user-email">{user.name || user.email}</span>
              </span>
              <button type="button" className="btn btn-outline" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
          <a href="#" className="btn btn-primary nav-app-btn">
            Get the App ↗
          </a>
        </div>
        <button
          type="button"
          className={`hamburger btn btn-outline${menuOpen ? ' is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="hamburger-icon" aria-hidden="true">
            {menuOpen ? '✕' : '☰'}
          </span>
        </button>
      </nav>

      <div
        id="landing-mobile-menu"
        className={`landing-mobile-menu${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="landing-mobile-menu-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
        />
        <div className="landing-mobile-menu-panel">
          <ul className="landing-mobile-menu-links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="landing-mobile-menu-cta">
            {user ? (
              <>
                <Link
                  to={getPostAuthPath(user)}
                  className="btn btn-primary btn-block"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <button type="button" className="btn btn-outline btn-block" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn btn-outline btn-block" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-block" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
            <a href="#" className="btn btn-primary btn-block" onClick={closeMenu}>
              Get the App ↗
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
