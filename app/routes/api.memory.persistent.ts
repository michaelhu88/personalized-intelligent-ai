import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { PersonalizationService } from '~/lib/services/personalizationService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.memory.persistent');

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const { userId, action, content, userInfo } = await request.json<{
      userId: string;
      action: 'get' | 'set' | 'append';
      content?: string;
      userInfo?: {
        email?: string;
        name?: string;
      };
    }>();

    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    const personalizationService = new PersonalizationService({
      DATABASE_URL: context.cloudflare?.env?.DATABASE_URL,
      OPENAI_API_KEY: context.cloudflare?.env?.OPENAI_API_KEY,
    });

    if (!personalizationService.isEnabled()) {
      return json({ error: 'Personalization service is not available' }, { status: 503 });
    }

    // Ensure user exists
    await personalizationService.ensureUser(
      userId,
      userInfo?.email,
      userInfo?.name
    );

    if (action === 'get') {
      const persistentMemory = await personalizationService.getPersistentMemory(userId);
      return json({ content: persistentMemory });
    } else if (action === 'set') {
      if (typeof content !== 'string') {
        return json({ error: 'Content is required for set action' }, { status: 400 });
      }

      await personalizationService.setPersistentMemory(userId, content);
      logger.debug(`Updated persistent memory for user ${userId}`);
      
      return json({ success: true });
    } else if (action === 'append') {
      if (typeof content !== 'string') {
        return json({ error: 'Content is required for append action' }, { status: 400 });
      }

      // Get existing memory
      const existingMemory = await personalizationService.getPersistentMemory(userId);
      
      // Append new content with proper spacing
      const updatedMemory = existingMemory 
        ? `${existingMemory}\n\n${content}`
        : content;
      
      await personalizationService.setPersistentMemory(userId, updatedMemory);
      logger.debug(`Appended to persistent memory for user ${userId}`);
      
      return json({ success: true });
    } else {
      return json({ error: 'Invalid action. Use "get", "set", or "append"' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to handle persistent memory request:', error);
    return json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}