import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-spinner" aria-label="Loading" />
      </div>
    )
  }

  if (!user?.isSuperAdmin || user.isBanned) {
    return <Navigate to="/superlogin" replace state={{ from: location.pathname }} />
  }

  return children
}
