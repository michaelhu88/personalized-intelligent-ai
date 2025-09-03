import { useEffect, useState } from 'react';
import { googleAuthService, type AuthState } from '~/lib/services/googleAuthService';
import { GoogleSignInButton } from '~/components/auth/GoogleSignInButton';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGate({ children, fallback }: AuthGateProps) {
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

  if (!authState.isAuthenticated) {
    return fallback || <AuthRequired />;
  }

  return <>{children}</>;
}

function AuthRequired() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
          <div className="i-ph:sign-in text-3xl text-accent" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">
            Sign in to start chatting
          </h2>
          <p className="text-bolt-elements-textSecondary">
            Authentication is required to use the AI assistant and save your conversations.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="i-ph:check text-xs text-green-500" />
            </div>
            <span className="text-sm text-bolt-elements-textSecondary">
              Access your chat history across devices
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="i-ph:check text-xs text-green-500" />
            </div>
            <span className="text-sm text-bolt-elements-textSecondary">
              Personalized AI responses based on your preferences
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="i-ph:check text-xs text-green-500" />
            </div>
            <span className="text-sm text-bolt-elements-textSecondary">
              Secure and private conversation storage
            </span>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="pt-4">
          <GoogleSignInButton />
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-bolt-elements-textTertiary">
          Your conversations are stored securely and are only accessible by you.
        </p>
      </div>
    </div>
  );
}