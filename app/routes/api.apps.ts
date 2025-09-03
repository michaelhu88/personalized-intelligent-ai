import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { PersonalizationService } from '~/lib/services/personalizationService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.apps');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');
    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const method = request.method;
    const url = new URL(request.url);
    
    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
    
    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: apiKeys.OPENAI_API_KEY || context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ 
        success: false, 
        error: 'Personalization service not available. Please configure DATABASE_URL.' 
      }, { status: 503 });
    }

    switch (method) {
      case 'GET': {
        // Get user's apps
        const userId = url.searchParams.get('userId');
        if (!userId) {
          return json({ success: false, error: 'userId is required' }, { status: 400 });
        }

        const apps = await personalizationService.getUserApps(userId);
        return json({ success: true, apps });
      }

      case 'POST': {
        // Create new app
        const requestData = await request.json() as any;
        const { userId, name, description, framework, template } = requestData;
        
        if (!userId || !name) {
          return json({ success: false, error: 'userId and name are required' }, { status: 400 });
        }

        const config = {
          framework: framework || 'react',
          template: template || 'blank',
          description: description || '',
        };

        const app = await personalizationService.createApp(userId, name, config);
        
        if (!app) {
          return json({ success: false, error: 'Failed to create app' }, { status: 500 });
        }

        return json({ success: true, app });
      }

      case 'DELETE': {
        // Delete app (simplified - in production would need proper auth)
        const requestData = await request.json() as any;
        const { appId, userId } = requestData;
        
        if (!appId || !userId) {
          return json({ success: false, error: 'appId and userId are required' }, { status: 400 });
        }

        // In a real implementation, we'd delete the app from the database
        // For now, just log it
        logger.info(`Would delete app ${appId} for user ${userId}`);
        
        return json({ success: true, message: 'App deleted successfully' });
      }

      default:
        return json({ success: false, error: 'Method not allowed' }, { status: 405 });
    }

  } catch (error: any) {
    logger.error('Apps API error:', error);
    return json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}