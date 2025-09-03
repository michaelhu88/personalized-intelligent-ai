import { useCallback, useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import type { Message } from 'ai';
import { googleAuthService } from '~/lib/services/googleAuthService';
import { createScopedLogger } from '~/utils/logger';
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';

const logger = createScopedLogger('PostgreSQLChatHistory');

export const currentChatId = atom<string | undefined>(undefined);
export const chatTitle = atom<string | undefined>(undefined);

export interface PostgreSQLChatHistoryResult {
  ready: boolean;
  initialMessages: Message[];
  currentChatId: string | undefined;
  storeMessage: (message: Message) => Promise<void>;
  createNewChat: () => Promise<string | null>;
  loadChat: (chatId: string) => Promise<void>;
}

export function usePostgreSQLChatHistory(): PostgreSQLChatHistoryResult {
  const navigate = useNavigate();
  const { id: urlChatId } = useLoaderData<{ id?: string }>();
  const authState = useStore(googleAuthService.getAuthState);

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);

  // Load chat messages from PostgreSQL
  const loadChat = useCallback(async (chatId: string) => {
    if (!authState.isAuthenticated || !authState.user) {
      logger.warn('Attempted to load chat without authentication');
      return;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}?userId=${encodeURIComponent(authState.user.id)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chat');
      }

      const data = await response.json();
      
      // Convert database messages to AI SDK format
      const messages: Message[] = data.messages.map((msg: any) => ({
        id: msg.messageIndex,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.timestamp),
      }));

      setInitialMessages(messages);
      currentChatId.set(chatId);
      chatTitle.set(data.chatSession.title);
      
      logger.debug(`Loaded ${messages.length} messages for chat ${chatId}`);
    } catch (error) {
      logger.error('Failed to load chat:', error);
      setInitialMessages([]);
    }
  }, [authState.isAuthenticated, authState.user]);

  // Store a single message in PostgreSQL
  const storeMessage = useCallback(async (message: Message) => {
    if (!authState.isAuthenticated || !authState.user) {
      logger.warn('Cannot store message - user not authenticated');
      return;
    }

    let chatId = currentChatId.get();

    // Create new chat session if none exists
    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) {
        logger.error('Failed to create new chat session');
        return;
      }
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authState.user.id,
          role: message.role,
          content: message.content,
          messageIndex: message.id,
          metadata: {
            timestamp: message.createdAt?.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      logger.debug(`Stored message ${message.id} in chat ${chatId}`);
    } catch (error) {
      logger.error('Failed to store message:', error);
    }
  }, [authState.isAuthenticated, authState.user]);

  // Create new chat session
  const createNewChat = useCallback(async (): Promise<string | null> => {
    if (!authState.isAuthenticated || !authState.user) {
      logger.warn('Cannot create chat - user not authenticated');
      return null;
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authState.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      const newChatId = data.chatSession.id;

      currentChatId.set(newChatId);
      chatTitle.set(data.chatSession.title);
      setInitialMessages([]);

      logger.debug(`Created new chat session: ${newChatId}`);
      return newChatId;
    } catch (error) {
      logger.error('Failed to create new chat:', error);
      return null;
    }
  }, [authState.isAuthenticated, authState.user]);

  // Initialize on mount and when authentication changes
  useEffect(() => {
    const initializeChat = async () => {
      if (!authState.isAuthenticated) {
        setReady(true);
        setInitialMessages([]);
        currentChatId.set(undefined);
        chatTitle.set(undefined);
        return;
      }

      if (urlChatId) {
        // Load specific chat from URL
        await loadChat(urlChatId);
      } else {
        // New chat - clear everything
        setInitialMessages([]);
        currentChatId.set(undefined);
        chatTitle.set(undefined);
      }

      setReady(true);
    };

    initializeChat();
  }, [authState.isAuthenticated, urlChatId, loadChat]);

  return {
    ready,
    initialMessages,
    currentChatId: currentChatId.get(),
    storeMessage,
    createNewChat,
    loadChat,
  };
}