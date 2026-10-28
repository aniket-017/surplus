import { useCallback, useEffect, useState } from 'react'
import { getSuperadminAppSettings, updateSuperadminAppSettings } from '../../lib/api'

const CARDS = [
  {
    field: 'shareAppMessage',
    title: 'Share App message',
    description: (
      <>
        Sent when a user taps <strong>Profile → Share App</strong>. Include the store links you
        want people to open.
      </>
    ),
    rows: 10,
    format: 'plain',
  },
  {
    field: 'termsOfService',
    title: 'Terms of Service',
    description: (
      <>
        Shown when a user taps <strong>Terms of Service</strong> on the app sign-in screen.
      </>
    ),
    rows: 22,
    format: 'legal',
  },
  {
    field: 'privacyPolicy',
    title: 'Privacy Policy',
    description: (
      <>
        Shown when a user taps <strong>Privacy Policy</strong> on the app sign-in screen.
      </>
    ),
    rows: 22,
    format: 'legal',
  },
]

function formatDate(value) {
  if (!value) return null
  return new Date(value).toLocaleString()
}

/** Mirrors the app parser: "## " heading, "- " bullet, other lines are paragraphs. */
function parseLegalText(text) {
  const intro = []
  const sections = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('## ')) {
      sections.push({ heading: line.slice(3).trim(), blocks: [] })
      continue
    }
    const bullet = /^[-•*]\s+/.test(line)
    const block = { bullet, text: bullet ? line.replace(/^[-•*]\s+/, '') : line }
    ;(sections.length ? sections[sections.length - 1].blocks : intro).push(block)
  }
  return { intro, sections }
}

function LegalBlocks({ blocks }) {
  return blocks.map((block, i) =>
    block.bullet ? (
      <li key={i} className="sa-legal-bullet">
        {block.text}
      </li>
    ) : (
      <p key={i}>{block.text}</p>
    ),
  )
}

function LegalPreview({ text }) {
  const { intro, sections } = parseLegalText(text)
  if (!intro.length && !sections.length) {
    return <div className="sa-share-preview sa-legal-preview">Nothing to preview</div>
  }
  return (
    <div className="sa-share-preview sa-legal-preview">
      <LegalBlocks blocks={intro} />
      {sections.map((section, i) => (
        <section key={i}>
          <h3>{section.heading}</h3>
          <LegalBlocks blocks={section.blocks} />
        </section>
      ))}
    </div>
  )
}

function SettingCard({ card, setting, defaultValue, maxLength, onSaved }) {
  const [value, setValue] = useState(setting.value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    setValue(setting.value)
  }, [setting.value])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')
    try {
      onSaved(await updateSuperadminAppSettings({ [card.field]: value }))
      setInfo('Saved. The app picks this up the next time it is opened.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const dirty = value !== setting.value
  const lastUpdated = formatDate(setting.updatedAt)

  return (
    <form className="dash-card sa-panel sa-settings-form" onSubmit={handleSave}>
      <div className="sa-settings-head">
        <h2>{card.title}</h2>
        <p className="sa-muted">
          {card.description}
          {lastUpdated ? ` Last updated ${lastUpdated}.` : ' Currently using the default text.'}
        </p>
        {card.format === 'legal' ? (
          <p className="sa-muted sa-settings-format">
            Format: start a line with <code>## </code> for a section heading and <code>- </code>{' '}
            for a bullet point. Every other line is a paragraph. Lines before the first heading
            are the introduction.
          </p>
        ) : null}
      </div>

      {error && <p className="auth-error">{error}</p>}
      {info && <p className="auth-info">{info}</p>}

      <div className="sa-settings-grid">
        <label className="sa-field">
          <span>{card.format === 'legal' ? 'Content' : 'Message'}</span>
          <textarea
            className="auth-input sa-textarea sa-settings-textarea"
            rows={card.rows}
            maxLength={maxLength}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
          <span className="sa-muted sa-settings-count">
            {value.length}/{maxLength}
          </span>
        </label>

        <div className="sa-field">
          <span>Preview</span>
          {card.format === 'legal' ? (
            <LegalPreview text={value} />
          ) : (
            <div className="sa-share-preview">{value.trim() || 'Message is empty'}</div>
          )}
        </div>
      </div>

      <div className="sa-settings-actions">
        <button
          type="button"
          className="btn btn-outline"
          disabled={saving || value === defaultValue}
          onClick={() => setValue(defaultValue)}
        >
          Reset to default
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={saving || !dirty}
          onClick={() => setValue(setting.value)}
        >
          Discard changes
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || !dirty || !value.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getSuperadminAppSettings())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>App settings</h1>
        <p>Control content shown in the mobile app without releasing an update.</p>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : data ? (
        CARDS.map((card) => (
          <SettingCard
            key={card.field}
            card={card}
            setting={data.settings[card.field]}
            defaultValue={data.defaults[card.field]}
            maxLength={data.limits[card.field]}
            onSaved={setData}
          />
        ))
      ) : null}
    </div>
  )
}
