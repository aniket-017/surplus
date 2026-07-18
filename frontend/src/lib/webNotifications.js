const PERMISSION_ASKED_KEY = 'surplus_web_notification_permission_asked'

export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }

  try {
    const result = await Notification.requestPermission()
    try {
      localStorage.setItem(PERMISSION_ASKED_KEY, '1')
    } catch {
      // ignore storage errors
    }
    return result
  } catch {
    return Notification.permission
  }
}

export function hasAskedNotificationPermission() {
  try {
    return localStorage.getItem(PERMISSION_ASKED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Show a browser desktop notification. No-ops if permission isn't granted.
 * Returns the Notification instance or null.
 */
export function showBrowserNotification({ title, body, tag, onClick }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    // Prefer in-app toast while the tab is focused.
    return null
  }

  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: '/favicon.svg',
    })

    if (onClick) {
      notification.onclick = () => {
        window.focus()
        onClick()
        notification.close()
      }
    }

    return notification
  } catch {
    return null
  }
}
