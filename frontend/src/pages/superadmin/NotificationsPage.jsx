import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getSuperadminNotifications,
  getSuperadminUsers,
  sendSuperadminNotification,
} from '../../lib/api'

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All users' },
  { value: 'BUYERS', label: 'Buyers only' },
  { value: 'SELLERS', label: 'Sellers only' },
  { value: 'SPECIFIC', label: 'Specific users' },
]

const AUDIENCE_LABELS = {
  ALL: 'All users',
  BUYERS: 'Buyers',
  SELLERS: 'Sellers',
  SPECIFIC: 'Specific users',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  )

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await getSuperadminNotifications({ page })
      setNotifications(data.notifications)
      setTotal(data.total)
    } catch (err) {
      setListError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (audience !== 'SPECIFIC') return undefined

    const q = userQuery.trim()
    if (q.length < 2) {
      setUserResults([])
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const data = await getSuperadminUsers({ page: 1, limit: 10, q })
        if (!cancelled) {
          setUserResults(data.users.filter((user) => !user.isBanned && user.role))
        }
      } catch {
        if (!cancelled) setUserResults([])
      } finally {
        if (!cancelled) setSearchingUsers(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [audience, userQuery])

  function toggleUser(user) {
    setSelectedUsers((current) => {
      if (current.some((item) => item.id === user.id)) {
        return current.filter((item) => item.id !== user.id)
      }
      return [...current, user]
    })
  }

  async function handleSend(event) {
    event.preventDefault()
    setSendError('')
    setSendSuccess('')

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle || !trimmedBody) {
      setSendError('Title and body are required')
      return
    }
    if (audience === 'SPECIFIC' && selectedUsers.length === 0) {
      setSendError('Select at least one user')
      return
    }

    const audienceLabel = AUDIENCE_LABELS[audience] || audience
    const confirmMessage =
      audience === 'SPECIFIC'
        ? `Send this notification to ${selectedUsers.length} selected user(s)?`
        : `Send this notification to ${audienceLabel.toLowerCase()}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSending(true)
    try {
      const data = await sendSuperadminNotification({
        title: trimmedTitle,
        body: trimmedBody,
        audience,
        targetUserIds: audience === 'SPECIFIC' ? selectedUsers.map((user) => user.id) : [],
      })
      setTitle('')
      setBody('')
      setAudience('ALL')
      setSelectedUsers([])
      setUserQuery('')
      setUserResults([])
      setSendSuccess(
        `Sent to ${data.notification.recipientCount} recipient${
          data.notification.recipientCount === 1 ? '' : 's'
        }.`,
      )
      setPage(1)
      await loadNotifications()
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Notifications</h1>
        <p>Compose announcements and send them to buyers, sellers, or specific users.</p>
      </div>

      <div className="dash-card sa-panel">
        <div className="sa-panel-header">
          <h2>Compose</h2>
        </div>

        <form className="sa-compose-form" onSubmit={handleSend}>
          <label className="sa-field">
            <span>Title</span>
            <input
              className="auth-input"
              type="text"
              maxLength={80}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short headline"
              required
            />
          </label>

          <label className="sa-field">
            <span>Body</span>
            <textarea
              className="auth-input sa-textarea"
              maxLength={500}
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Notification message"
              required
            />
          </label>

          <fieldset className="sa-field">
            <legend>Audience</legend>
            <div className="sa-audience-options">
              {AUDIENCE_OPTIONS.map((option) => (
                <label key={option.value} className="sa-radio-label">
                  <input
                    type="radio"
                    name="audience"
                    value={option.value}
                    checked={audience === option.value}
                    onChange={() => setAudience(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {audience === 'SPECIFIC' ? (
            <div className="sa-field">
              <span>Select users</span>
              <input
                className="auth-input"
                type="search"
                placeholder="Search by name, email, or number"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
              {searchingUsers ? <p className="sa-muted-text">Searching…</p> : null}
              {userResults.length > 0 ? (
                <ul className="sa-user-picker">
                  {userResults.map((user) => (
                    <li key={user.id}>
                      <label className="sa-radio-label">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleUser(user)}
                        />
                        <span>
                          {user.name || 'Unnamed'}
                          <span className="sa-muted-text">
                            {' '}
                            · {user.email || user.phone || 'No contact'} · {user.role || '—'}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selectedUsers.length > 0 ? (
                <div className="sa-selected-users">
                  {selectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="sa-chip"
                      onClick={() => toggleUser(user)}
                    >
                      {user.name || user.email || user.phone || user.id} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {sendError ? <p className="auth-error">{sendError}</p> : null}
          {sendSuccess ? <p className="sa-success-text">{sendSuccess}</p> : null}

          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send notification'}
          </button>
        </form>
      </div>

      <div className="dash-card sa-panel">
        <div className="sa-panel-header">
          <h2>Sent history</h2>
        </div>

        {listError ? <p className="auth-error">{listError}</p> : null}

        {loading ? (
          <div className="empty-state">
            <div className="app-spinner" aria-label="Loading" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications sent yet.</p>
          </div>
        ) : (
          <>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Audience</th>
                    <th>Recipients</th>
                    <th>Sent by</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <div>{item.title}</div>
                        <div className="sa-muted-text">{item.body}</div>
                      </td>
                      <td>{AUDIENCE_LABELS[item.audience] || item.audience}</td>
                      <td>{item.recipientCount}</td>
                      <td>
                        {item.createdBy?.name || '—'}
                        <div className="sa-muted-text">{item.createdBy?.email || ''}</div>
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
                Page {page} of {totalPages} · {total} notifications
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
          </>
        )}
      </div>
    </div>
  )
}
