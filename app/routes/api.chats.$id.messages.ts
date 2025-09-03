import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { PersonalizationService } from '~/lib/services/personalizationService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.chats.$id.messages');

// GET /api/chats/:id/messages - Get messages for a specific chat
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

    // Verify chat session belongs to user
    const chatSession = await personalizationService.getChatSession(userId, chatSessionId);
    if (!chatSession) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get messages
    const messages = await personalizationService.getChatMessages(userId, chatSessionId);

    return json({
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }))
    });

  } catch (error) {
    logger.error('Failed to get chat messages:', error);
    return json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// POST /api/chats/:id/messages - Add a new message to the chat
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
    const { userId, role, content, messageIndex, metadata } = body;

    if (!userId) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!role || !content || !messageIndex) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify chat session belongs to user
    const chatSession = await personalizationService.getChatSession(userId, chatSessionId);
    if (!chatSession) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    // Save message
    const message = await personalizationService.saveChatMessage(
      userId,
      chatSessionId,
      role,
      content,
      messageIndex,
      metadata
    );

    if (!message) {
      return json({ error: 'Failed to save message' }, { status: 500 });
    }

    // If this is the first user message and chat has no title, generate one
    if (role === 'user' && !chatSession.title) {
      await personalizationService.generateChatTitle(userId, chatSessionId);
    }

    return json({
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      }
    });

  } catch (error) {
    logger.error('Failed to save chat message:', error);
    return json({ error: 'Failed to save message' }, { status: 500 });
  }
}