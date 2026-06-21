import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPostAuthPath } from '../lib/authRedirect'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    async function finishAuth() {
      if (error) {
        navigate('/signin', { replace: true, state: { error: 'Google sign-in failed' } })
        return
      }

      if (success) {
        const user = await refreshUser()
        navigate(user ? getPostAuthPath(user) : '/', { replace: true })
        return
      }

      navigate('/signin', { replace: true })
    }

    finishAuth()
  }, [navigate, refreshUser, searchParams])

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card auth-callback-card">
          <p>Completing sign in...</p>
        </div>
      </div>
    </div>
  )
}
