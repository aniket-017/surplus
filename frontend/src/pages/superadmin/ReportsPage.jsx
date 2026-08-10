import { useCallback, useEffect, useState } from 'react'
import {
  deleteSuperadminProduct,
  getSuperadminReports,
  updateSuperadminReport,
} from '../../lib/api'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'DISMISSED', label: 'Dismissed' },
]

const REASON_LABELS = {
  SPAM: 'Spam',
  MISLEADING: 'Misleading',
  PROHIBITED: 'Prohibited item',
  WRONG_CATEGORY: 'Wrong category',
  OTHER: 'Other',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function formatReason(reason) {
  return REASON_LABELS[reason] || reason
}

function statusBadgeClass(status) {
  if (status === 'OPEN') return 'sa-badge sa-badge-danger'
  if (status === 'REVIEWED') return 'sa-badge sa-badge-ok'
  return 'sa-badge'
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('OPEN')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadminReports({ page, q: search, status })
      setReports(data.reports)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  async function handleUpdateStatus(report, nextStatus) {
    setBusyId(report.id)
    setError('')
    try {
      await updateSuperadminReport(report.id, nextStatus)
      await loadReports()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteProduct(report) {
    const title = report.product?.title || 'this listing'
    if (!window.confirm(`Delete product "${title}"? This cannot be undone.`)) {
      return
    }

    if (!report.product?.id) {
      setError('Product no longer exists')
      return
    }

    setBusyId(report.id)
    setError('')
    try {
      await deleteSuperadminProduct(report.product.id)
      await loadReports()
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
        <h1>Reports</h1>
        <p>Review listing reports filed by buyers and take action when needed.</p>
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
          placeholder="Search by product, reporter, seller, or details"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <select
          className="auth-input"
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value || 'all'} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports found.</p>
        </div>
      ) : (
        <div className="dash-card sa-panel">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <div>{report.product?.title || 'Deleted product'}</div>
                      {report.details ? (
                        <div className="sa-muted-text">{report.details}</div>
                      ) : null}
                    </td>
                    <td>{formatReason(report.reason)}</td>
                    <td>
                      {report.reporter?.name || '—'}
                      <div className="sa-muted-text">{report.reporter?.email || ''}</div>
                    </td>
                    <td>
                      {report.product?.seller?.name || '—'}
                      <div className="sa-muted-text">{report.product?.seller?.email || ''}</div>
                    </td>
                    <td>
                      <span className={statusBadgeClass(report.status)}>{report.status}</span>
                    </td>
                    <td>
                      <div className="sa-actions-stack">
                        {report.status === 'OPEN' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline sa-action-btn"
                              disabled={busyId === report.id}
                              onClick={() => handleUpdateStatus(report, 'REVIEWED')}
                            >
                              Mark reviewed
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline sa-action-btn"
                              disabled={busyId === report.id}
                              onClick={() => handleUpdateStatus(report, 'DISMISSED')}
                            >
                              Dismiss
                            </button>
                          </>
                        ) : null}
                        {report.product?.id ? (
                          <button
                            type="button"
                            className="btn btn-outline sa-action-btn sa-danger-btn"
                            disabled={busyId === report.id}
                            onClick={() => handleDeleteProduct(report)}
                          >
                            Delete product
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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
              Page {page} of {totalPages} · {total} reports
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
