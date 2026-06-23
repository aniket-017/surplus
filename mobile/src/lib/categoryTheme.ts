export type CategoryTheme = {
  iconColor: string;
  iconBg: string;
};

const GREEN: CategoryTheme = { iconColor: '#5CB335', iconBg: 'rgba(92, 179, 53, 0.12)' };
const PURPLE: CategoryTheme = { iconColor: '#8B5CF6', iconBg: 'rgba(139, 92, 246, 0.12)' };
const ORANGE: CategoryTheme = { iconColor: '#D97706', iconBg: 'rgba(217, 119, 6, 0.12)' };
const BLUE: CategoryTheme = { iconColor: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.12)' };
const TEAL: CategoryTheme = { iconColor: '#0D9488', iconBg: 'rgba(13, 148, 136, 0.12)' };
const AMBER: CategoryTheme = { iconColor: '#EAB308', iconBg: 'rgba(234, 179, 8, 0.14)' };
const RED: CategoryTheme = { iconColor: '#EF4444', iconBg: 'rgba(239, 68, 68, 0.12)' };
const SLATE: CategoryTheme = { iconColor: '#64748B', iconBg: 'rgba(100, 116, 139, 0.12)' };

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
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
};

export function getCategoryTheme(name: string): CategoryTheme {
  return CATEGORY_THEMES[name] ?? GREEN;
}
