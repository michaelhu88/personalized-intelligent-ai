import { useState } from 'react';
import { googleAuthService } from '~/lib/services/googleAuthService';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';

interface GoogleSignInButtonProps {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function GoogleSignInButton({ 
  variant = 'default', 
  size = 'md',
  showText = true 
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await googleAuthService.signIn();
    } catch (error) {
      console.error('Sign-in failed:', error);
      toast.error('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={classNames(
        'flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variant === 'outline'
          ? 'border border-bolt-elements-borderColor bg-white dark:bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
          : 'bg-[#4285f4] text-white hover:bg-[#3367d6] shadow-sm'
      )}
    >
      {isLoading ? (
        <div className={classNames('border-2 border-current border-t-transparent rounded-full animate-spin', iconSizes[size])} />
      ) : (
        <svg
          className={iconSizes[size]}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {showText && (
        <span>
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </span>
      )}
    </button>
  );
}