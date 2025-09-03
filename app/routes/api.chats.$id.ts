import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { PersonalizationService } from '~/lib/services/personalizationService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.chats.$id');

// GET /api/chats/:id - Get a specific chat session with messages
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  try {
    const chatSessionId = params.id;
    if (!chatSessionId) {
      return json({ error: 'Chat ID required' }, { status: 400 });
    }

    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    // Get user ID from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get chat session
    const chatSession = await personalizationService.getChatSession(userId, chatSessionId);
    if (!chatSession) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get chat messages
    const messages = await personalizationService.getChatMessages(userId, chatSessionId);

    return json({
      chatSession: {
        id: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        lastMessageAt: chatSession.lastMessageAt,
      },
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }))
    });

  } catch (error) {
    logger.error('Failed to get chat:', error);
    return json({ error: 'Failed to load chat' }, { status: 500 });
  }
}

// PUT /api/chats/:id - Update chat session (e.g., title)
export async function action({ params, request, context }: ActionFunctionArgs) {
  try {
    const chatSessionId = params.id;
    if (!chatSessionId) {
      return json({ error: 'Chat ID required' }, { status: 400 });
    }

    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, title, action } = body;

    if (!userId) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (action === 'delete') {
      // Delete chat session
      const success = await personalizationService.deleteChatSession(userId, chatSessionId);
      if (!success) {
        return json({ error: 'Failed to delete chat' }, { status: 500 });
      }
      return json({ success: true });
    }

    if (action === 'updateTitle' && title) {
      // Update chat title
      const success = await personalizationService.updateChatSessionTitle(userId, chatSessionId, title);
      if (!success) {
        return json({ error: 'Failed to update chat title' }, { status: 500 });
      }
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    logger.error('Failed to update chat:', error);
    return json({ error: 'Failed to update chat' }, { status: 500 });
  }
}