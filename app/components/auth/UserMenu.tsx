import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { googleAuthService, type AuthState } from '~/lib/services/googleAuthService';
import { classNames } from '~/utils/classNames';
import { GoogleSignInButton } from './GoogleSignInButton';

export function UserMenu() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial state
    setAuthState(googleAuthService.getAuthState());

    // Listen for auth state changes
    const unsubscribe = googleAuthService.addListener(setAuthState);
    return unsubscribe;
  }, []);

  const handleSignOut = () => {
    googleAuthService.signOut();
  };

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div className="w-5 h-5 border-2 border-bolt-elements-borderColor border-t-bolt-elements-textSecondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authState.isAuthenticated || !authState.user) {
    return <GoogleSignInButton />;
  }

  const { user } = authState;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bolt-elements-background-depth-2 transition-colors focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus">
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-bolt-elements-borderColor"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-bolt-elements-textPrimary truncate max-w-[120px]">
              {user.name}
            </span>
            <span className="text-xs text-bolt-elements-textSecondary truncate max-w-[120px]">
              {user.email}
            </span>
          </div>
          <div className="i-ph:caret-down text-bolt-elements-textSecondary" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={classNames(
            'min-w-[220px] z-[300]',
            'bg-white dark:bg-bolt-elements-background-depth-1',
            'rounded-lg shadow-lg border border-bolt-elements-borderColor',
            'animate-in fade-in-0 zoom-in-95',
            'py-2'
          )}
          sideOffset={8}
          align="end"
        >
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-3">
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-bolt-elements-borderColor"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-bolt-elements-textPrimary">
                  {user.name}
                </span>
                <span className="text-xs text-bolt-elements-textSecondary">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <DropdownMenu.Item className="flex items-center px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 cursor-pointer outline-none">
            <div className="i-ph:user mr-3 text-bolt-elements-textSecondary" />
            Profile Settings
          </DropdownMenu.Item>

          <DropdownMenu.Item className="flex items-center px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 cursor-pointer outline-none">
            <div className="i-ph:brain mr-3 text-bolt-elements-textSecondary" />
            AI Memory
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />

          <DropdownMenu.Item
            className="flex items-center px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 cursor-pointer outline-none"
            onClick={handleSignOut}
          >
            <div className="i-ph:sign-out mr-3 text-bolt-elements-textSecondary" />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}