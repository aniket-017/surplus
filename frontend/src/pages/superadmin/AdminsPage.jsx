import { useCallback, useEffect, useState } from 'react'
import { addSuperadmin, getSuperadmins, revokeSuperadmin } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function AdminsPage() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadmins()
      setAdmins(data.admins)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  async function handleAdd(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setInfo('')

    try {
      await addSuperadmin(email.trim().toLowerCase())
      setEmail('')
      setInfo('Superadmin access granted. They can sign in at /superlogin.')
      await loadAdmins()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(admin) {
    if (!window.confirm(`Revoke superadmin access for ${admin.email}?`)) return

    setBusyId(admin.id)
    setError('')
    setInfo('')
    try {
      await revokeSuperadmin(admin.id)
      setInfo('Superadmin access revoked.')
      await loadAdmins()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Superadmins</h1>
        <p>Grant or revoke platform admin access by email.</p>
      </div>

      <form className="dash-card sa-panel sa-invite-form" onSubmit={handleAdd}>
        <label className="auth-label" htmlFor="admin-email">
          Add superadmin by email
        </label>
        <div className="sa-toolbar">
          <input
            id="admin-email"
            className="auth-input"
            type="email"
            placeholder="colleague@surplustovalue.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add superadmin'}
          </button>
        </div>
      </form>

      {error && <p className="auth-error">{error}</p>}
      {info && <p className="auth-info">{info}</p>}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : (
        <div className="dash-card sa-panel">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin.id === currentUser?.id
                  const canRevoke = !isSelf && admins.length > 1

                  return (
                    <tr key={admin.id}>
                      <td>
                        {admin.email}
                        {isSelf ? <span className="sa-badge">You</span> : null}
                      </td>
                      <td>{admin.name || '—'}</td>
                      <td>{formatDate(admin.createdAt)}</td>
                      <td>
                        {canRevoke ? (
                          <button
                            type="button"
                            className="btn btn-outline sa-action-btn sa-danger-btn"
                            disabled={busyId === admin.id}
                            onClick={() => handleRevoke(admin)}
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="sa-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
