import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { PersonalizationService } from '~/lib/services/personalizationService';
import { googleAuthService } from '~/lib/services/googleAuthService';
import { SessionService } from '~/lib/services/sessionService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.chats');

// GET /api/chats - Get all chat sessions for the user
export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    // Get user ID from session/auth
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const chatSessions = await personalizationService.getChatSessions(userId);
    
    return json({
      chatSessions: chatSessions.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessageAt: session.lastMessageAt,
      }))
    });

  } catch (error) {
    logger.error('Failed to get chat sessions:', error);
    return json({ error: 'Failed to load chat sessions' }, { status: 500 });
  }
}

// POST /api/chats - Create a new chat session
export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, title } = body;

    if (!userId) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Ensure user exists
    await personalizationService.ensureUser(userId);

    // Create new chat session
    const chatSession = await personalizationService.createChatSession(userId, title);
    
    if (!chatSession) {
      return json({ error: 'Failed to create chat session' }, { status: 500 });
    }

    return json({
      chatSession: {
        id: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        lastMessageAt: chatSession.lastMessageAt,
      }
    });

  } catch (error) {
    logger.error('Failed to create chat session:', error);
    return json({ error: 'Failed to create chat session' }, { status: 500 });
  }
}