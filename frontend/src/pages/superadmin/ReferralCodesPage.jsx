import { useCallback, useEffect, useState } from 'react'
import {
  createSuperadminReferralCode,
  getSuperadminReferralCodeUsers,
  getSuperadminReferralCodes,
  updateSuperadminReferralCode,
} from '../../lib/api'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function ReferralCodesPage() {
  const [codes, setCodes] = useState([])
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [selectedMeta, setSelectedMeta] = useState(null)
  const [users, setUsers] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')

  const loadCodes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadminReferralCodes()
      setCodes(data.referralCodes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  const loadUsers = useCallback(async (id, page = 1) => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const data = await getSuperadminReferralCodeUsers(id, { page, limit: 20 })
      setSelectedMeta(data.referralCode)
      setUsers(data.users)
      setUsersTotal(data.total)
      setUsersPage(data.page)
    } catch (err) {
      setUsersError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    loadUsers(selectedId, usersPage)
  }, [selectedId, usersPage, loadUsers])

  async function handleCreate(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setInfo('')

    try {
      await createSuperadminReferralCode({
        code: code.trim(),
        ...(label.trim() ? { label: label.trim() } : {}),
      })
      setCode('')
      setLabel('')
      setInfo('Referral code created.')
      await loadCodes()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(item) {
    const nextActive = !item.isActive
    const action = nextActive ? 'activate' : 'deactivate'
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} code ${item.code}?`)) {
      return
    }

    setBusyId(item.id)
    setError('')
    setInfo('')
    try {
      await updateSuperadminReferralCode(item.id, { isActive: nextActive })
      setInfo(`Referral code ${nextActive ? 'activated' : 'deactivated'}.`)
      await loadCodes()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function handleSelectCode(item) {
    if (selectedId === item.id) {
      setSelectedId(null)
      setSelectedMeta(null)
      setUsers([])
      setUsersTotal(0)
      setUsersPage(1)
      setUsersError('')
      return
    }

    setSelectedId(item.id)
    setUsersPage(1)
    setUsers([])
    setUsersError('')
  }

  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / 20))

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Referral codes</h1>
        <p>Create codes and track which users registered with each one.</p>
      </div>

      <form className="dash-card sa-panel sa-invite-form" onSubmit={handleCreate}>
        <label className="auth-label" htmlFor="referral-code">
          Create referral code
        </label>
        <div className="sa-toolbar">
          <input
            id="referral-code"
            className="auth-input"
            type="text"
            placeholder="e.g. PARTNER2026"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            required
            minLength={3}
            maxLength={32}
          />
          <input
            id="referral-label"
            className="auth-input"
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={80}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create code'}
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
                  <th>Code</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sa-muted">
                      No referral codes yet.
                    </td>
                  </tr>
                ) : (
                  codes.map((item) => (
                    <tr key={item.id} className={selectedId === item.id ? 'sa-row-selected' : undefined}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline sa-action-btn"
                          onClick={() => handleSelectCode(item)}
                        >
                          {item.code}
                        </button>
                      </td>
                      <td>{item.label || '—'}</td>
                      <td>
                        <span className={`sa-badge${item.isActive ? '' : ' sa-badge-muted'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline sa-action-btn"
                          onClick={() => handleSelectCode(item)}
                        >
                          {item.userCount}
                        </button>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-outline sa-action-btn${item.isActive ? ' sa-danger-btn' : ''}`}
                          disabled={busyId === item.id}
                          onClick={() => handleToggle(item)}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedId ? (
        <div className="dash-card sa-panel">
          <div className="dash-hero" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              Users for {selectedMeta?.code || '…'}
            </h2>
            <p style={{ margin: '0.35rem 0 0' }}>
              {usersTotal} registered with this code
              {selectedMeta?.label ? ` · ${selectedMeta.label}` : ''}
            </p>
          </div>

          {usersError && <p className="auth-error">{usersError}</p>}

          {usersLoading ? (
            <div className="empty-state">
              <div className="app-spinner" aria-label="Loading users" />
            </div>
          ) : (
            <>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Applied</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="sa-muted">
                          No users have used this code yet.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || '—'}</td>
                          <td>{user.email || '—'}</td>
                          <td>{user.phone || '—'}</td>
                          <td>{user.role || '—'}</td>
                          <td>{formatDate(user.referralAppliedAt)}</td>
                          <td>{formatDate(user.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {usersTotal > 0 ? (
                <div className="sa-pagination">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((value) => value - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {usersPage} of {usersTotalPages} · {usersTotal} users
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={usersPage >= usersTotalPages}
                    onClick={() => setUsersPage((value) => value + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
