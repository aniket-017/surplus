let messageUnread = 0;
let adminUnread = 0;

export function setMessageUnreadForBadge(count: number) {
  messageUnread = Math.max(0, count);
  return messageUnread + adminUnread;
}

export function setAdminUnreadForBadge(count: number) {
  adminUnread = Math.max(0, count);
  return messageUnread + adminUnread;
}

export function getCombinedBadgeCount() {
  return messageUnread + adminUnread;
}
