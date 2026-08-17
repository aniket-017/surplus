import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  banSuperadminUser,
  deleteSuperadminUser,
  getSuperadminUsers,
  unbanSuperadminUser,
} from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { formatPhoneForDisplay } from '../../lib/phone'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadminUsers({ page, q: search })
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleBan(user) {
    const reason = window.prompt(`Ban reason for ${user.email} (optional):`, '')
    if (reason === null) return

    setBusyId(user.id)
    setError('')
    try {
      await banSuperadminUser(user.id, reason.trim())
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnban(user) {
    if (!window.confirm(`Unban ${user.email}?`)) return

    setBusyId(user.id)
    setError('')
    try {
      await unbanSuperadminUser(user.id)
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function userLabel(user) {
    return user.name || user.email || formatPhoneForDisplay(user.phone) || 'this user'
  }

  async function handleDelete(user) {
    const label = userLabel(user)
    const listingNote =
      user.productCount === 1
        ? '1 listing'
        : `${user.productCount || 0} listings`

    if (
      !window.confirm(
        `Delete ${label} permanently? This removes the account, ${listingNote}, chats, saved items, and related data. This cannot be undone.`,
      )
    ) {
      return
    }

    setBusyId(user.id)
    setError('')
    try {
      await deleteSuperadminUser(user.id)
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Users</h1>
        <p>Search accounts, ban or restore access, or delete a user completely.</p>
      </div>

      <form
        className="sa-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setSearch(q.trim())
        }}
      >
        <input
          className="auth-input"
          type="search"
          placeholder="Search by email, name, or mobile"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

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
                  <th>User</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  const canBan = !user.isSuperAdmin && !user.isBanned && !isSelf
                  const canUnban = user.isBanned
                  const canDelete = !user.isSuperAdmin && !isSelf

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="sa-cell-stack">
                          <strong>{user.name || '—'}</strong>
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td>{formatPhoneForDisplay(user.phone) || '—'}</td>
                      <td>{user.role || '—'}</td>
                      <td>{user.productCount}</td>
                      <td>
                        {user.isSuperAdmin ? <span className="sa-badge">Admin</span> : null}
                        {user.isBanned ? (
                          <span className="sa-badge sa-badge-danger">Banned</span>
                        ) : (
                          <span className="sa-badge sa-badge-ok">Active</span>
                        )}
                        {user.bannedReason ? (
                          <div className="sa-muted">{user.bannedReason}</div>
                        ) : null}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="sa-actions-stack">
                          <Link
                            to={`/superadmin/users/${user.id}/chats`}
                            className="btn btn-outline sa-action-btn"
                          >
                            Chats
                          </Link>
                          {canBan ? (
                            <button
                              type="button"
                              className="btn btn-outline sa-action-btn"
                              disabled={busyId === user.id}
                              onClick={() => handleBan(user)}
                            >
                              Ban
                            </button>
                          ) : null}
                          {canUnban ? (
                            <button
                              type="button"
                              className="btn btn-primary sa-action-btn"
                              disabled={busyId === user.id}
                              onClick={() => handleUnban(user)}
                            >
                              Unban
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="btn btn-outline sa-action-btn sa-danger-btn"
                              disabled={busyId === user.id}
                              onClick={() => handleDelete(user)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="sa-pagination">
            <button
              type="button"
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages} · {total} users
            </span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
