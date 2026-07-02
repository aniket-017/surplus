import { Link, NavLink, useLocation } from 'react-router-dom'
import surplusLogo from '../assets/logo/surplus.png'
import { useAuth } from '../context/AuthContext'
import RoleSwitchButton from './RoleSwitchButton'

const BUYER_NAV = [
  { to: '/buyer', label: 'Home', end: true },
  { to: '/buyer/categories', label: 'Categories' },
  { to: '/buyer/messages', label: 'Messages' },
  { to: '/buyer/profile', label: 'Profile' },
]

const SELLER_NAV = [
  { to: '/seller', label: 'Listings', end: true },
  { to: '/seller/messages', label: 'Messages' },
  { to: '/seller/profile', label: 'Profile' },
]

export default function AppShell({ role, title, children }) {
  const { user } = useAuth()
  const location = useLocation()
  const navItems = role === 'buyer' ? BUYER_NAV : SELLER_NAV
  const displayName = user?.name || user?.email || 'User'

  const isAddProduct = location.pathname === '/seller/add-product'

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to={role === 'buyer' ? '/buyer' : '/seller'} className="app-sidebar-logo">
          <img src={surplusLogo} alt="Surplus" />
        </Link>

        <nav className="app-sidebar-nav" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-role-switch">
          <RoleSwitchButton role={role} />
        </div>

        {role === 'seller' && (
          <div className="app-sidebar-cta">
            <Link to="/seller/add-product" className="btn btn-primary btn-block">
              Add Product
            </Link>
          </div>
        )}
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <h1 className="app-topbar-title">{title}</h1>
          <div className="app-topbar-actions">
            <RoleSwitchButton role={role} variant="compact" />
            <div className="app-topbar-user">
              <div className="app-topbar-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  displayName[0]?.toUpperCase()
                )}
              </div>
              <span className="app-topbar-name">{displayName}</span>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>

        <nav className="app-bottom-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <RoleSwitchButton role={role} variant="bottom-nav" />
          {role === 'seller' && !isAddProduct && (
            <NavLink
              to="/seller/add-product"
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              Add
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  )
}
