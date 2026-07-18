import type { ChatMessage } from '@/src/lib/conversationsApi';

export type MessageListItem =
  | { type: 'date'; id: string; label: string }
  | {
      type: 'message';
      id: string;
      message: ChatMessage;
      isMine: boolean;
      isGrouped: boolean;
    };

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMessageInfoTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateSeparator(iso: string) {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const messageDay = startOfDay(date);
  const diffDays = Math.round((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatConversationTime(iso: string) {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const messageDay = startOfDay(date);
  const diffDays = Math.round((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return formatMessageTime(iso);
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function isSameDay(a: string, b: string) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function buildMessageListItems(messages: ChatMessage[], currentUserId?: string) {
  const items: MessageListItem[] = [];
  let lastDateKey = '';

  messages.forEach((message, index) => {
    const dateKey = message.createdAt.slice(0, 10);
    if (dateKey !== lastDateKey) {
      items.push({
        type: 'date',
        id: `date-${dateKey}`,
        label: formatDateSeparator(message.createdAt),
      });
      lastDateKey = dateKey;
    }

    const prev = messages[index - 1];
    const isMine = message.senderId === currentUserId;
    const isGrouped =
      !!prev &&
      prev.senderId === message.senderId &&
      isSameDay(prev.createdAt, message.createdAt);

    items.push({
      type: 'message',
      id: message.id,
      message,
      isMine,
      isGrouped,
    });
  });

  return items;
}
