import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import surplusLogo from '../../assets/logo/surplus.png'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/superadmin', label: 'Overview', end: true },
  { to: '/superadmin/users', label: 'Users' },
  { to: '/superadmin/products', label: 'Products' },
  { to: '/superadmin/reports', label: 'Reports' },
  { to: '/superadmin/admins', label: 'Admins' },
]

export default function SuperAdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/superlogin', { replace: true })
  }

  return (
    <div className="app-shell sa-shell">
      <aside className="app-sidebar">
        <NavLink to="/superadmin" className="app-sidebar-logo" end>
          <img src={surplusLogo} alt="Surplus" />
        </NavLink>

        <nav className="app-sidebar-nav" aria-label="Superadmin">
          {NAV.map((item) => (
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

        <div className="sa-sidebar-footer">
          <p className="sa-sidebar-email">{user?.email}</p>
          <button type="button" className="btn btn-outline sa-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
