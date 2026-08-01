/** Phone / tablet breakpoint (dp). */
export const TABLET_BREAKPOINT = 600;

/** Max content width for forms and detail bodies. */
export const CONTENT_MAX_WIDTH_PHONE = 560;
export const CONTENT_MAX_WIDTH_TABLET = 720;

/** Readable max width for chat bubbles / composer on wide screens. */
export const CHAT_CONTENT_MAX_WIDTH = 640;

export function isTabletWidth(width: number): boolean {
  return width >= TABLET_BREAKPOINT;
}

export function contentMaxWidth(width: number): number {
  return isTabletWidth(width) ? CONTENT_MAX_WIDTH_TABLET : CONTENT_MAX_WIDTH_PHONE;
}

/** Product grid columns: 2 phone, 3 mid, 4 tablet+. */
export function productGridColumns(width: number): number {
  if (width >= 900) return 4;
  if (width >= TABLET_BREAKPOINT) return 3;
  return 2;
}

/** Category grid columns: 3 phone, 4 mid, 5 tablet+. */
export function categoryGridColumns(width: number): number {
  if (width >= 900) return 5;
  if (width >= TABLET_BREAKPOINT) return 4;
  return 3;
}

export function productCardWidth(
  screenWidth: number,
  columns: number,
  horizontalPadding: number,
  gap: number,
): number {
  const contentWidth = Math.min(screenWidth, contentMaxWidth(screenWidth));
  return (contentWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;
}
