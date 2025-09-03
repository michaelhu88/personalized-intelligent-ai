import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GoogleAuthCallback');

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    logger.error('OAuth error:', error);
    return redirect('/?auth_error=' + encodeURIComponent(error));
  }

  if (!code) {
    logger.error('No authorization code received');
    return redirect('/?auth_error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    // Get user info
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    // Create session and redirect with user data
    const userData = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
    };

    // In a real app, you'd store this in a secure session
    // For now, we'll pass it via URL params (not recommended for production)
    const userParam = encodeURIComponent(JSON.stringify(userData));
    
    return redirect(`/?auth_success=true&user=${userParam}`);
    
  } catch (error) {
    logger.error('OAuth callback error:', error);
    return redirect('/?auth_error=' + encodeURIComponent('Failed to authenticate'));
  }
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173'}/api/auth/callback`,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Token exchange failed:', errorText);
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('User info fetch failed:', errorText);
    throw new Error('Failed to fetch user info');
  }

  return response.json() as Promise<GoogleUserInfo>;
}