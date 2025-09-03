import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { getDatabase, type Database } from '../database/connection';
import { memoryEmbeddings, toolExecutions, users, apps, userPersistentMemory, chatSessions, chatMessages } from '../database/schema';
import type { NewMemoryEmbedding, NewToolExecution, User, App, UserPersistentMemory, NewUserPersistentMemory, ChatSession, NewChatSession, ChatMessage, NewChatMessage } from '../database/schema';
import { EmbeddingService } from './embeddingService';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PersonalizationService');

export interface MemorySearchResult {
  content: string;
  metadata?: any;
  similarity: number;
  timestamp: Date;
}

export class PersonalizationService {
  private db: Database | null = null;
  private embeddingService: EmbeddingService;

  constructor(env?: { DATABASE_URL?: string; OPENAI_API_KEY?: string }) {
    this.db = getDatabase(env);
    this.embeddingService = new EmbeddingService(env?.OPENAI_API_KEY);
  }

  async ensureUser(userId: string, email?: string, name?: string): Promise<User | null> {
    if (!this.db) return null;

    try {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user with new information if provided
        if (email || name) {
          const updateData: Partial<typeof users.$inferInsert> = {};
          if (email) updateData.email = email;
          if (name) updateData.name = name;
          updateData.updatedAt = new Date();

          const [updatedUser] = await this.db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

          return updatedUser;
        }
        return existingUser[0];
      }

      // Create new user
      const [newUser] = await this.db
        .insert(users)
        .values({
          id: userId,
          email,
          name,
          settings: {
            isGoogleUser: userId.startsWith('google_'),
          },
        })
        .returning();

      logger.debug(`Created new user: ${userId} (${email || 'no email'})`);
      return newUser;
    } catch (error) {
      logger.error('Failed to ensure user:', error);
      return null;
    }
  }

  async createApp(userId: string, name: string, config?: any): Promise<App | null> {
    if (!this.db) return null;

    try {
      const [app] = await this.db
        .insert(apps)
        .values({
          userId,
          name,
          config: config || {},
        })
        .returning();

      return app;
    } catch (error) {
      logger.error('Failed to create app:', error);
      return null;
    }
  }

  async getUserApps(userId: string): Promise<App[]> {
    if (!this.db) return [];

    try {
      return await this.db
        .select()
        .from(apps)
        .where(eq(apps.userId, userId))
        .orderBy(desc(apps.updatedAt));
    } catch (error) {
      logger.error('Failed to get user apps:', error);
      return [];
    }
  }

  async storeMemory(userId: string, content: string, appId?: string, metadata?: any): Promise<void> {
    if (!this.db) {
      logger.warn('Database not available - memory will not be persisted');
      return;
    }

    try {
      const embedding = await this.embeddingService.createEmbedding(content);

      await this.db.insert(memoryEmbeddings).values({
        userId,
        appId: appId || null,
        content,
        embedding, // Now using native vector type
        metadata,
      });

      logger.debug(`Stored memory for user ${userId}${appId ? ` in app ${appId}` : ''}`);
    } catch (error) {
      logger.error('Failed to store memory:', error);
    }
  }

  async searchMemories(
    userId: string,
    query: string,
    appId?: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    if (!this.db) return [];

    try {
      const queryEmbedding = await this.embeddingService.createEmbedding(query);
      const queryVector = `[${queryEmbedding.join(',')}]`;

      let whereClause = eq(memoryEmbeddings.userId, userId);
      if (appId) {
        whereClause = and(whereClause, eq(memoryEmbeddings.appId, appId)) || whereClause;
      }

      // Use native vector similarity search with PostgreSQL
      const results = await this.db
        .select({
          content: memoryEmbeddings.content,
          metadata: memoryEmbeddings.metadata,
          timestamp: memoryEmbeddings.timestamp,
          similarity: sql<number>`1 - (embedding <=> ${queryVector}::vector)`.as('similarity'),
        })
        .from(memoryEmbeddings)
        .where(whereClause)
        .orderBy(sql`embedding <=> ${queryVector}::vector`)
        .limit(limit);

      return results
        .map(result => ({
          content: result.content,
          metadata: result.metadata,
          similarity: result.similarity || 0,
          timestamp: result.timestamp || new Date(),
        }))
        .filter(m => m.similarity > 0.7); // Threshold for relevance

    } catch (error) {
      logger.error('Failed to search memories:', error);
      return [];
    }
  }

  async recordToolExecution(
    userId: string,
    toolName: string,
    args: any,
    result: any,
    success: boolean,
    appId?: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.insert(toolExecutions).values({
        userId,
        appId,
        toolName,
        args,
        result,
        success: success ? 'success' : 'error',
      });

      // Also store as memory for learning
      const executionSummary = `Used ${toolName} with args: ${JSON.stringify(args)}. Result: ${success ? 'success' : 'error'}`;
      await this.storeMemory(userId, executionSummary, appId, {
        type: 'tool_execution',
        toolName,
        success,
      });
    } catch (error) {
      logger.error('Failed to record tool execution:', error);
    }
  }

  // Persistent Memory Management (Claude.md-style)
  async setPersistentMemory(userId: string, content: string): Promise<void> {
    if (!this.db) return;

    try {
      // Delete existing persistent memory for this user
      await this.db.delete(userPersistentMemory).where(eq(userPersistentMemory.userId, userId));

      // Insert new persistent memory
      await this.db.insert(userPersistentMemory).values({
        userId,
        content,
      });

      logger.debug(`Updated persistent memory for user ${userId}`);
    } catch (error) {
      logger.error('Failed to set persistent memory:', error);
    }
  }

  async getPersistentMemory(userId: string): Promise<string | null> {
    if (!this.db) return null;

    try {
      const result = await this.db
        .select()
        .from(userPersistentMemory)
        .where(eq(userPersistentMemory.userId, userId))
        .limit(1);

      return result.length > 0 ? result[0].content : null;
    } catch (error) {
      logger.error('Failed to get persistent memory:', error);
      return null;
    }
  }

  async getPersonalizedContext(userId: string, query: string, appId?: string): Promise<string> {
    let context = '';

    // First, always include persistent memory if it exists
    const persistentMemory = await this.getPersistentMemory(userId);
    if (persistentMemory) {
      context += `## Persistent User Context\n${persistentMemory}\n\n`;
    }

    // Then add relevant memories from past interactions
    const memories = await this.searchMemories(userId, query, appId, 3);
    
    if (memories.length > 0) {
      const contextParts = memories.map(memory => 
        `- ${memory.content} (similarity: ${memory.similarity.toFixed(2)})`
      );

      context += `## Recent Relevant Context\nBased on previous interactions:\n${contextParts.join('\n')}\n`;
    }

    return context ? `\n${context}\n` : '';
  }

  // Chat Session Management
  async createChatSession(userId: string, title?: string): Promise<ChatSession | null> {
    if (!this.db) return null;

    try {
      const [chatSession] = await this.db
        .insert(chatSessions)
        .values({
          userId,
          title: title || null,
        })
        .returning();

      logger.debug(`Created new chat session ${chatSession.id} for user ${userId}`);
      return chatSession;
    } catch (error) {
      logger.error('Failed to create chat session:', error);
      return null;
    }
  }

  async getChatSessions(userId: string, limit: number = 50): Promise<ChatSession[]> {
    if (!this.db) return [];

    try {
      return await this.db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId))
        .orderBy(desc(chatSessions.lastMessageAt))
        .limit(limit);
    } catch (error) {
      logger.error('Failed to get chat sessions:', error);
      return [];
    }
  }

  async getChatSession(userId: string, chatSessionId: string): Promise<ChatSession | null> {
    if (!this.db) return null;

    try {
      const result = await this.db
        .select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, chatSessionId),
          eq(chatSessions.userId, userId)
        ))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Failed to get chat session:', error);
      return null;
    }
  }

  async updateChatSessionTitle(userId: string, chatSessionId: string, title: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db
        .update(chatSessions)
        .set({ 
          title,
          updatedAt: new Date()
        })
        .where(and(
          eq(chatSessions.id, chatSessionId),
          eq(chatSessions.userId, userId)
        ));

      return true;
    } catch (error) {
      logger.error('Failed to update chat session title:', error);
      return false;
    }
  }

  async deleteChatSession(userId: string, chatSessionId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db
        .delete(chatSessions)
        .where(and(
          eq(chatSessions.id, chatSessionId),
          eq(chatSessions.userId, userId)
        ));

      logger.debug(`Deleted chat session ${chatSessionId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete chat session:', error);
      return false;
    }
  }

  // Chat Message Management
  async saveChatMessage(
    userId: string,
    chatSessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageIndex: string,
    metadata?: any
  ): Promise<ChatMessage | null> {
    if (!this.db) return null;

    try {
      const [message] = await this.db
        .insert(chatMessages)
        .values({
          chatSessionId,
          userId,
          role,
          content,
          messageIndex,
          metadata,
        })
        .returning();

      // Update lastMessageAt on chat session
      await this.db
        .update(chatSessions)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(chatSessions.id, chatSessionId));

      logger.debug(`Saved message ${message.id} to chat session ${chatSessionId}`);
      return message;
    } catch (error) {
      logger.error('Failed to save chat message:', error);
      return null;
    }
  }

  async getChatMessages(userId: string, chatSessionId: string): Promise<ChatMessage[]> {
    if (!this.db) return [];

    try {
      return await this.db
        .select()
        .from(chatMessages)
        .where(and(
          eq(chatMessages.chatSessionId, chatSessionId),
          eq(chatMessages.userId, userId)
        ))
        .orderBy(asc(chatMessages.timestamp));
    } catch (error) {
      logger.error('Failed to get chat messages:', error);
      return [];
    }
  }

  async generateChatTitle(userId: string, chatSessionId: string): Promise<string | null> {
    if (!this.db) return null;

    try {
      // Get first few messages from the chat
      const messages = await this.db
        .select()
        .from(chatMessages)
        .where(and(
          eq(chatMessages.chatSessionId, chatSessionId),
          eq(chatMessages.userId, userId)
        ))
        .orderBy(asc(chatMessages.timestamp))
        .limit(3);

      if (messages.length === 0) return null;

      // Use first user message to generate title
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (!firstUserMessage) return null;

      // Simple title generation - use first 50 chars of first message
      let title = firstUserMessage.content.trim().substring(0, 50);
      if (firstUserMessage.content.length > 50) {
        title += '...';
      }

      // Update the chat session with the generated title
      await this.updateChatSessionTitle(userId, chatSessionId, title);
      
      return title;
    } catch (error) {
      logger.error('Failed to generate chat title:', error);
      return null;
    }
  }

  isEnabled(): boolean {
    return this.db !== null;
  }
}