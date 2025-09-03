import { pgTable, text, timestamp, uuid, jsonb, index, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  name: text('name'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const apps = pgTable('apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config'),
  framework: text('framework'), // react, vue, vanilla, etc.
  template: text('template'), // starter template used
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('apps_user_id_idx').on(table.userId),
}));

export const memoryEmbeddings = pgTable('memory_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  appId: uuid('app_id').references(() => apps.id),
  content: text('content').notNull(),
  embedding: vector('embedding'), // Native vector type for pgvector
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  userIdIdx: index('memory_embeddings_user_id_idx').on(table.userId),
  appIdIdx: index('memory_embeddings_app_id_idx').on(table.appId),
  // Vector indexes created via migration: cosine and L2 distance
}));

export const toolExecutions = pgTable('tool_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  appId: uuid('app_id').references(() => apps.id),
  toolName: text('tool_name').notNull(),
  args: jsonb('args').notNull(),
  result: jsonb('result'),
  success: text('success').notNull(), // 'success' | 'error'
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  userIdIdx: index('tool_executions_user_id_idx').on(table.userId),
  appIdIdx: index('tool_executions_app_id_idx').on(table.appId),
  timestampIdx: index('tool_executions_timestamp_idx').on(table.timestamp),
}));

export const userPersistentMemory = pgTable('user_persistent_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('user_persistent_memory_user_id_idx').on(table.userId),
}));

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('chat_sessions_user_id_idx').on(table.userId),
  lastMessageIdx: index('chat_sessions_last_message_idx').on(table.lastMessageAt),
}));

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatSessionId: uuid('chat_session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  messageIndex: text('message_index').notNull(), // Order within the chat
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  chatSessionIdx: index('chat_messages_session_idx').on(table.chatSessionId),
  userIdIdx: index('chat_messages_user_id_idx').on(table.userId),
  timestampIdx: index('chat_messages_timestamp_idx').on(table.timestamp),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect;
export type NewMemoryEmbedding = typeof memoryEmbeddings.$inferInsert;
export type ToolExecution = typeof toolExecutions.$inferSelect;
export type NewToolExecution = typeof toolExecutions.$inferInsert;
export type UserPersistentMemory = typeof userPersistentMemory.$inferSelect;
export type NewUserPersistentMemory = typeof userPersistentMemory.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;