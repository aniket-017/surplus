import { Link } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav>
      <Link to="/" className="logo nav-logo">
        <img
          src={surplusLogo}
          alt="Surplus — Buy, Sell, Recover Value"
          className="logo-img"
        />
      </Link>
      <ul className="nav-links">
        <li>
          <a href="#problem">Problem</a>
        </li>
        <li>
          <a href="#how">How it Works</a>
        </li>
        <li>
          <a href="#categories">Categories</a>
        </li>
        <li>
          <a href="#why">Why Surplus</a>
        </li>
      </ul>
      <div className="nav-cta">
        {user ? (
          <>
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
      <button type="button" className="hamburger btn btn-outline" aria-label="Menu">
        ☰
      </button>
    </nav>
  )
}
