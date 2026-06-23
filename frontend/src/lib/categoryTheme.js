const GREEN = { iconColor: '#5CB335', iconBg: 'rgba(92, 179, 53, 0.12)' }
const PURPLE = { iconColor: '#8B5CF6', iconBg: 'rgba(139, 92, 246, 0.12)' }
const ORANGE = { iconColor: '#D97706', iconBg: 'rgba(217, 119, 6, 0.12)' }
const BLUE = { iconColor: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.12)' }
const TEAL = { iconColor: '#0D9488', iconBg: 'rgba(13, 148, 136, 0.12)' }
const AMBER = { iconColor: '#EAB308', iconBg: 'rgba(234, 179, 8, 0.14)' }
const RED = { iconColor: '#EF4444', iconBg: 'rgba(239, 68, 68, 0.12)' }
const SLATE = { iconColor: '#64748B', iconBg: 'rgba(100, 116, 139, 0.12)' }

const CATEGORY_THEMES = {
  Metals: GREEN,
  Plastics: GREEN,
  Piping: GREEN,
  Machinery: GREEN,
  Electronics: GREEN,
  Chemicals: PURPLE,
  Rubber: GREEN,
  Packaging: ORANGE,
  Construction: ORANGE,
  Textiles: BLUE,
  'Wood & Agro': ORANGE,
  Minerals: TEAL,
  Energy: AMBER,
  Safety: RED,
  Others: SLATE,
}

export function getCategoryTheme(name) {
  return CATEGORY_THEMES[name] ?? GREEN
}
