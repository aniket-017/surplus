const COLORS = {
  onAccent: {
    sent: 'rgba(255, 255, 255, 0.85)',
    delivered: 'rgba(255, 255, 255, 0.85)',
    read: '#53BDEB',
  },
  onLight: {
    sent: 'rgba(0, 0, 0, 0.35)',
    delivered: 'rgba(0, 0, 0, 0.35)',
    read: '#53BDEB',
  },
}

function SingleCheck({ color }) {
  return (
    <svg width="14" height="11" viewBox="0 0 16 11" aria-hidden="true">
      <path
        d="M1.5 5.5L5.5 9.5L14.5 1"
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DoubleCheck({ color }) {
  return (
    <svg width="18" height="11" viewBox="0 0 20 11" aria-hidden="true">
      <path
        d="M1 5.5L4.5 9L11.5 1.5"
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 5.5L10 9L17.5 1"
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function MessageReceipt({ status, tone = 'onAccent' }) {
  const resolved = status || 'sent'
  const palette = COLORS[tone] || COLORS.onAccent
  const color = palette[resolved] || palette.sent
  const label =
    resolved === 'read' ? 'Read' : resolved === 'delivered' ? 'Delivered' : 'Sent'

  return (
    <span className={`chat-receipt chat-receipt--${resolved}`} title={label} aria-label={label}>
      {resolved === 'sent' ? <SingleCheck color={color} /> : <DoubleCheck color={color} />}
    </span>
  )
}
