import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GoogleAuthService');

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  isLoading: boolean;
}

type AuthStateListener = (state: AuthState) => void;

export class GoogleAuthService {
  private static instance: GoogleAuthService | null = null;
  private readonly STORAGE_KEY = 'google_auth_user';
  
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
  };
  
  private listeners: AuthStateListener[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Load stored user data
    this.loadStoredUser();
    
    // Check for OAuth callback parameters
    this.checkForAuthCallback();
    
    logger.debug('Google Auth Service initialized successfully');
  }

  private loadStoredUser(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as GoogleUser;
        this.updateAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
        logger.debug('Loaded stored user:', user.email);
      }
    } catch (error) {
      logger.error('Failed to load stored user:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private checkForAuthCallback(): void {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const userData = urlParams.get('user');
    const authError = urlParams.get('auth_error');

    if (authError) {
      logger.error('OAuth authentication error:', authError);
      this.updateAuthState({ isLoading: false });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (authSuccess && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData)) as GoogleUser;
        
        // Store user data
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        
        this.updateAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });

        logger.debug('User signed in successfully via OAuth:', user.email);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        logger.error('Failed to parse OAuth user data:', error);
        this.updateAuthState({ isLoading: false });
      }
    }
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        logger.error('Error in auth state listener:', error);
      }
    });
  }

  // Public API
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  addListener(listener: AuthStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signIn(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Sign-in not available on server-side');
    }

    try {
      this.updateAuthState({ isLoading: true });
      
      // Redirect to server-side OAuth route
      window.location.href = '/api/auth/google';
    } catch (error) {
      logger.error('Failed to initiate sign-in:', error);
      this.updateAuthState({ isLoading: false });
      throw error;
    }
  }

  signOut(): void {
    if (typeof window === 'undefined') return;

    try {
      // Clear stored data
      localStorage.removeItem(this.STORAGE_KEY);

      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });

      logger.debug('User signed out successfully');
    } catch (error) {
      logger.error('Failed to sign out:', error);
    }
  }

  getCurrentUser(): GoogleUser | null {
    return this.authState.user;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getUserId(): string | null {
    return this.authState.user?.id || null;
  }
}


// Export singleton instance
export const googleAuthService = GoogleAuthService.getInstance();