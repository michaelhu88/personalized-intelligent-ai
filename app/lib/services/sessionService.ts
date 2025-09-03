import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SessionService');

export class SessionService {
  private static readonly USER_ID_KEY = 'bolt_user_id';
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  /**
   * Get or create a user ID for the current session
   * This creates a persistent identifier that survives browser restarts
   * Returns null during SSR to prevent hydration mismatches
   */
  static getUserId(): string | null {
    if (typeof window === 'undefined') {
      // Server-side: return null to prevent SSR issues
      return null;
    }

    try {
      // Try to get existing user ID from localStorage
      const stored = localStorage.getItem(this.USER_ID_KEY);
      if (stored) {
        const { userId, timestamp } = JSON.parse(stored);
        
        // Check if session is still valid
        if (Date.now() - timestamp < this.SESSION_DURATION) {
          logger.debug(`Retrieved existing user ID: ${userId}`);
          return userId;
        } else {
          logger.debug('Session expired, creating new user ID');
          localStorage.removeItem(this.USER_ID_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to retrieve stored user ID:', error);
      localStorage.removeItem(this.USER_ID_KEY);
    }

    // Generate new user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      localStorage.setItem(this.USER_ID_KEY, JSON.stringify({
        userId,
        timestamp: Date.now(),
      }));
      logger.debug(`Created new user ID: ${userId}`);
    } catch (error) {
      logger.error('Failed to store user ID:', error);
    }

    return userId;
  }

  /**
   * Clear the current user session (for logout)
   */
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_ID_KEY);
      logger.debug('User session cleared');
    }
  }

  /**
   * Check if user has an active session
   */
  static hasActiveSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(this.USER_ID_KEY);
      if (!stored) return false;

      const { timestamp } = JSON.parse(stored);
      return Date.now() - timestamp < this.SESSION_DURATION;
    } catch {
      return false;
    }
  }

  /**
   * Refresh the current session timestamp
   */
  static refreshSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.USER_ID_KEY);
      if (stored) {
        const { userId } = JSON.parse(stored);
        localStorage.setItem(this.USER_ID_KEY, JSON.stringify({
          userId,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      logger.warn('Failed to refresh session:', error);
    }
  }
}