import { useCallback, useEffect, useState } from 'react';
import { googleAuthService, type AuthState } from '~/lib/services/googleAuthService';
import { createScopedLogger } from '~/utils/logger';
import { classNames } from '~/utils/classNames';

const logger = createScopedLogger('ChatHistoryPanel');

export interface ChatHistoryItem {
  id: string;
  title?: string;
  createdAt: string;
  lastMessageAt: string;
}

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatHistoryPanel({ isOpen, onClose, onSelectChat, onNewChat }: ChatHistoryPanelProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(() => googleAuthService.getAuthState());

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = googleAuthService.addListener((newAuthState) => {
      setAuthState(newAuthState);
    });

    // Set initial state
    setAuthState(googleAuthService.getAuthState());

    return unsubscribe;
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chats?userId=${encodeURIComponent(authState.user.id)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();
      setChatHistory(data.chatSessions || []);
    } catch (err) {
      logger.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [authState.isAuthenticated, authState.user]);

  useEffect(() => {
    if (isOpen && authState.isAuthenticated) {
      loadChatHistory();
    }
  }, [isOpen, authState.isAuthenticated, loadChatHistory]);

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="fixed left-0 top-0 h-full w-80 bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor shadow-lg transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Chat History</h2>
          <button
            onClick={onClose}
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            <div className="i-ph:x text-xl" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-bolt-elements-borderColor">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors"
          >
            <div className="i-ph:plus text-lg" />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {!authState.isAuthenticated ? (
            <div className="p-4 text-center text-bolt-elements-textSecondary">
              <div className="i-ph:sign-in text-2xl mb-2" />
              <p>Sign in to view your chat history</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-bolt-elements-textSecondary">Loading chats...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <div className="i-ph:warning text-2xl mb-2" />
              <p>{error}</p>
              <button
                onClick={loadChatHistory}
                className="mt-2 px-3 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
              >
                Retry
              </button>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="p-4 text-center text-bolt-elements-textSecondary">
              <div className="i-ph:chat-circle text-2xl mb-2" />
              <p>No chats yet</p>
              <p className="text-sm mt-1">Start a new conversation!</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={classNames(
                    'flex flex-col gap-1 p-3 rounded-md cursor-pointer transition-colors',
                    'hover:bg-bolt-elements-background-depth-2 border border-transparent hover:border-bolt-elements-borderColor'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-bolt-elements-textPrimary truncate">
                        {chat.title || 'Untitled Chat'}
                      </h3>
                    </div>
                    <span className="text-xs text-bolt-elements-textSecondary flex-shrink-0">
                      {formatDate(chat.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-bolt-elements-textSecondary">
                    <div className="i-ph:chat-circle text-sm" />
                    <span>
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}