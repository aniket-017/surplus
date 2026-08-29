import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSuperadminOverview } from '../../lib/api'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function OverviewPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSuperadminOverview()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="empty-state">
        <div className="app-spinner" aria-label="Loading" />
      </div>
    )
  }

  if (error) {
    return <p className="auth-error">{error}</p>
  }

  const stats = data?.stats ?? {}

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Platform overview</h1>
        <p>Live snapshot of users, listings, and messaging activity.</p>
      </div>

      <div className="dash-stats sa-stats">
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.users ?? 0}</div>
          <div className="dash-stat-label">Users</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.buyers ?? 0}</div>
          <div className="dash-stat-label">Buyers</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.sellers ?? 0}</div>
          <div className="dash-stat-label">Sellers</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.banned ?? 0}</div>
          <div className="dash-stat-label">Banned</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.deleted ?? 0}</div>
          <div className="dash-stat-label">Deleted</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.products ?? 0}</div>
          <div className="dash-stat-label">Products</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.conversations ?? 0}</div>
          <div className="dash-stat-label">Conversations</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.messages ?? 0}</div>
          <div className="dash-stat-label">Messages</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.openReports ?? 0}</div>
          <div className="dash-stat-label">Open reports</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.superadmins ?? 0}</div>
          <div className="dash-stat-label">Superadmins</div>
        </div>
      </div>

      <div className="sa-columns">
        <section className="dash-card sa-panel">
          <div className="sa-panel-header">
            <h2>Recent users</h2>
            <Link to="/superadmin/users">View all</Link>
          </div>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentUsers ?? []).map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.email}
                      {user.isDeleted ? (
                        <span className="sa-badge sa-badge-danger">Deleted</span>
                      ) : user.isBanned ? (
                        <span className="sa-badge sa-badge-danger">Banned</span>
                      ) : null}
                      {user.isSuperAdmin ? <span className="sa-badge">Admin</span> : null}
                      {user.isDeleted && user.deletedReason ? (
                        <div className="sa-muted">{user.deletedReason}</div>
                      ) : null}
                    </td>
                    <td>{user.role || '—'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-card sa-panel">
          <div className="sa-panel-header">
            <h2>Recent products</h2>
            <Link to="/superadmin/products">View all</Link>
          </div>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Seller</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentProducts ?? []).map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>{product.seller?.email || '—'}</td>
                    <td>{formatDate(product.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
