import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath, needsProfile } from '../lib/authRedirect'

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-spinner" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (needsProfile(user) && role !== 'profile') {
    return <Navigate to="/onboarding/profile" replace />
  }

  if (role === 'profile') {
    if (!needsProfile(user)) {
      return <Navigate to={getPostAuthPath(user)} replace />
    }
    return children
  }

  if (role === 'none') {
    if (user.role) {
      return <Navigate to={getPostAuthPath(user)} replace />
    }
    return children
  }

  if (!user.role) {
    return <Navigate to="/onboarding/role" replace />
  }

  if (user.role !== role) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  return children
}
