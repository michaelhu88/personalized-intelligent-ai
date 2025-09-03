import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export async function loader() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173'}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return redirect(authUrl);
}

export async function action({ request }: ActionFunctionArgs) {
  return loader();
}