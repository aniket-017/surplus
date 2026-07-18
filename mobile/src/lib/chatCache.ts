import type { ChatMessage, ConversationSummary } from '@/src/lib/conversationsApi';

export type ThreadConversation = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  otherParty: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  product: {
    id: string;
    title: string;
    images: string[];
  } | null;
};

export type CachedThread = {
  messages: ChatMessage[];
  conversation: ThreadConversation;
  fetchedAt: number;
  hasMoreOlder: boolean;
};

type ConversationsCache = {
  conversations: ConversationSummary[];
  fetchedAt: number;
};

const threads = new Map<string, CachedThread>();
let conversationsCache: ConversationsCache | null = null;

type ThreadRefreshListener = (conversationId: string) => void;
const threadRefreshListeners = new Set<ThreadRefreshListener>();

let activeThreadId: string | null = null;
let activeThreadRefresh: (() => void) | null = null;

export function getCachedConversations(): ConversationSummary[] | null {
  return conversationsCache?.conversations ?? null;
}

export function setCachedConversations(conversations: ConversationSummary[]) {
  conversationsCache = {
    conversations,
    fetchedAt: Date.now(),
  };
}

export function invalidateConversations() {
  conversationsCache = null;
}

export function getCachedThread(conversationId: string): CachedThread | null {
  return threads.get(conversationId) ?? null;
}

export function setCachedThread(
  conversationId: string,
  data: {
    messages: ChatMessage[];
    conversation: ThreadConversation;
    hasMoreOlder?: boolean;
  },
) {
  threads.set(conversationId, {
    messages: data.messages,
    conversation: data.conversation,
    fetchedAt: Date.now(),
    hasMoreOlder: data.hasMoreOlder ?? false,
  });
}

export function mergeThreadMessages(
  conversationId: string,
  incoming: ChatMessage[],
  options?: { prepend?: boolean; hasMoreOlder?: boolean; conversation?: ThreadConversation },
): CachedThread | null {
  const existing = threads.get(conversationId);
  if (!existing && !options?.conversation) {
    return null;
  }

  const baseMessages = existing?.messages ?? [];
  const byId = new Map<string, ChatMessage>();

  if (options?.prepend) {
    for (const message of incoming) byId.set(message.id, message);
    for (const message of baseMessages) byId.set(message.id, message);
  } else {
    for (const message of baseMessages) byId.set(message.id, message);
    for (const message of incoming) byId.set(message.id, message);
  }

  const messages = Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const next: CachedThread = {
    messages,
    conversation: options?.conversation ?? existing!.conversation,
    fetchedAt: Date.now(),
    hasMoreOlder:
      typeof options?.hasMoreOlder === 'boolean'
        ? options.hasMoreOlder
        : (existing?.hasMoreOlder ?? false),
  };

  threads.set(conversationId, next);
  return next;
}

export function replaceOptimisticMessage(
  conversationId: string,
  tempId: string,
  confirmed: ChatMessage,
) {
  const existing = threads.get(conversationId);
  if (!existing) return;

  const messages = existing.messages.map((message) =>
    message.id === tempId ? confirmed : message,
  );
  threads.set(conversationId, {
    ...existing,
    messages,
    fetchedAt: Date.now(),
  });
}

export function removeMessage(conversationId: string, messageId: string) {
  const existing = threads.get(conversationId);
  if (!existing) return;

  threads.set(conversationId, {
    ...existing,
    messages: existing.messages.filter((message) => message.id !== messageId),
    fetchedAt: Date.now(),
  });
}

export function appendThreadMessage(conversationId: string, message: ChatMessage) {
  mergeThreadMessages(conversationId, [message]);
}

export function invalidateThread(conversationId: string) {
  threads.delete(conversationId);
}

export function setActiveThread(conversationId: string | null, refresh?: (() => void) | null) {
  activeThreadId = conversationId;
  activeThreadRefresh = refresh ?? null;
}

export function notifyActiveThreadRefresh(conversationId: string) {
  if (activeThreadId === conversationId && activeThreadRefresh) {
    activeThreadRefresh();
  }
  for (const listener of threadRefreshListeners) {
    listener(conversationId);
  }
}

export function subscribeThreadRefresh(listener: ThreadRefreshListener) {
  threadRefreshListeners.add(listener);
  return () => {
    threadRefreshListeners.delete(listener);
  };
}
