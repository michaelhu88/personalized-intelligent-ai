import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { SessionService } from '~/lib/services/sessionService';
import { googleAuthService, type AuthState } from '~/lib/services/googleAuthService';

const MemoryTab = () => {
  const [persistentMemory, setPersistentMemory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);

  // Initialize user ID and info, preferring Google auth
  useEffect(() => {
    // Initialize userId with session ID (fallback for anonymous users)
    const sessionId = SessionService.getUserId();
    setUserId(sessionId);

    // Listen for Google auth state changes and prefer Google user ID
    const unsubscribe = googleAuthService.addListener((authState: AuthState) => {
      if (authState.isAuthenticated && authState.user) {
        // Use Google user ID when authenticated
        setUserId(`google_${authState.user.id}`);
        setUserInfo({
          email: authState.user.email,
          name: authState.user.name,
        });
      } else {
        // Fall back to session ID when not authenticated
        setUserId(sessionId);
        setUserInfo(null);
      }
    });

    // Check initial Google auth state
    const initialAuthState = googleAuthService.getAuthState();
    if (initialAuthState.isAuthenticated && initialAuthState.user) {
      setUserId(`google_${initialAuthState.user.id}`);
      setUserInfo({
        email: initialAuthState.user.email,
        name: initialAuthState.user.name,
      });
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userId) {
      loadPersistentMemory();
    }
  }, [userId]);

  const loadPersistentMemory = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/memory/persistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'get',
          ...(userInfo && { userInfo })
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content?: string };
        setPersistentMemory(data.content || '');
      }
    } catch (error) {
      console.error('Failed to load persistent memory:', error);
      toast.error('Failed to load persistent memory');
    } finally {
      setIsLoading(false);
    }
  };

  const savePersistentMemory = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/memory/persistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action: 'set', 
          content: persistentMemory,
          ...(userInfo && { userInfo })
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast.success('Persistent memory saved successfully');
      } else {
        toast.error('Failed to save persistent memory');
      }
    } catch (error) {
      console.error('Failed to save persistent memory:', error);
      toast.error('Failed to save persistent memory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (value: string) => {
    setPersistentMemory(value);
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      savePersistentMemory();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-bolt-elements-background-depth-3 rounded w-3/4"></div>
          <div className="h-32 bg-bolt-elements-background-depth-3 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
            AI Memory
          </h2>
          <p className="text-bolt-elements-textSecondary text-sm">
            Configure your persistent AI memory that will be read before every interaction.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-3">
              Persistent Context
            </h3>
            <p className="text-bolt-elements-textSecondary text-sm mb-4">
              This information will always be included in your AI conversations, similar to a Claude.md file. 
              Use this space to tell the AI about your preferences, coding style, project context, or anything 
              else you want it to remember across all sessions.
            </p>

            <div className="relative">
              <textarea
                value={persistentMemory}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Example:

My name is Alex and I'm a full-stack developer working on React/Node.js projects.

Preferences:
- I prefer TypeScript over JavaScript
- Use functional components with hooks
- I like clean, minimal code with good comments
- Please explain complex concepts step by step

Current Project:
Working on a personalized AI assistant with vector database integration.

Communication Style:
- Be concise but thorough
- Ask clarifying questions when unsure
- Provide code examples when helpful"
                className="w-full h-96 p-4 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:border-transparent"
              />
              
              {hasChanges && (
                <div className="absolute top-2 right-2">
                  <div className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded">
                    Unsaved changes
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-bolt-elements-textTertiary text-sm">
                {persistentMemory.length} characters • Cmd/Ctrl+S to save
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPersistentMemory('');
                    setHasChanges(true);
                  }}
                  className="px-3 py-1.5 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-md hover:border-bolt-elements-focus transition-colors"
                >
                  Clear
                </button>
                
                <button
                  onClick={savePersistentMemory}
                  disabled={!hasChanges || isSaving}
                  className="px-4 py-1.5 text-sm bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-md hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-bolt-elements-borderColor pt-4">
            <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
              How it works
            </h4>
            <ul className="text-bolt-elements-textSecondary text-sm space-y-1 list-disc list-inside">
              <li>This memory is automatically included in every AI conversation</li>
              <li>The AI will read this context first before responding to your messages</li>
              <li>Updates are saved to your persistent profile and survive browser sessions</li>
              <li>You can edit this anytime to refine how the AI understands your needs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryTab;