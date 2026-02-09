import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { IChatRepository, Chat, ChatMessage } from '@chat/domain/chat.entity';
import { ChatContext, ChatMessageMetadata, MessageRole, Json } from '@atlas/shared';
import { ChatRow, ChatMessageRow } from '@atlas/shared';

/**
 * Supabase Chat Repository - Infrastructure implementation for chat data access
 * Implements IChatRepository using Supabase client with service role key
 */
@Injectable()
export class SupabaseChatRepository implements IChatRepository {
  private readonly logger = new Logger(SupabaseChatRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  async findAllByAdvisorId(advisorId: string): Promise<Chat[]> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch chats:', error);
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }

    return (data ?? []).map(this.mapRowToChat);
  }

  async findById(chatId: string, advisorId: string): Promise<Chat | null> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('advisor_id', advisorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.logger.error(`Failed to fetch chat ${chatId}:`, error);
      throw new Error(`Failed to fetch chat: ${error.message}`);
    }

    return this.mapRowToChat(data);
  }

  async create(advisorId: string, title: string, context?: ChatContext): Promise<Chat> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .insert({
        advisor_id: advisorId,
        title,
        context: (context ?? {}) as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create chat:', error);
      throw new Error(`Failed to create chat: ${error.message}`);
    }

    return this.mapRowToChat(data);
  }

  async updateTitle(chatId: string, advisorId: string, title: string): Promise<Chat | null> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('advisor_id', advisorId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error(`Failed to update chat title ${chatId}:`, error);
      throw new Error(`Failed to update chat title: ${error.message}`);
    }

    return this.mapRowToChat(data);
  }

  async updateContext(
    chatId: string,
    advisorId: string,
    context: ChatContext
  ): Promise<Chat | null> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .update({ context: context as unknown as Json, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('advisor_id', advisorId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error(`Failed to update chat context ${chatId}:`, error);
      throw new Error(`Failed to update chat context: ${error.message}`);
    }

    return this.mapRowToChat(data);
  }

  async delete(chatId: string, advisorId: string): Promise<boolean> {
    const { error } = await this.supabase.db
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('advisor_id', advisorId);

    if (error) {
      this.logger.error(`Failed to delete chat ${chatId}:`, error);
      throw new Error(`Failed to delete chat: ${error.message}`);
    }

    return true;
  }

  async findMessagesByChatId(chatId: string, advisorId: string): Promise<ChatMessage[]> {
    // Verify chat ownership first
    const chat = await this.findById(chatId, advisorId);
    if (!chat) return [];

    const { data, error } = await this.supabase.db
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch messages for chat ${chatId}:`, error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data ?? []).map(this.mapRowToMessage);
  }

  async addMessage(
    chatId: string,
    role: MessageRole,
    content: string,
    metadata?: ChatMessageMetadata
  ): Promise<ChatMessage> {
    const { data, error } = await this.supabase.db
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        role,
        content,
        metadata: (metadata ?? {}) as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to add message to chat ${chatId}:`, error);
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return this.mapRowToMessage(data);
  }

  private mapRowToChat(row: ChatRow): Chat {
    return {
      id: row.id,
      advisorId: row.advisor_id,
      title: row.title,
      context: (row.context ?? {}) as ChatContext,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToMessage(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      chatId: row.chat_id,
      role: row.role,
      content: row.content,
      metadata: (row.metadata ?? {}) as ChatMessageMetadata,
      createdAt: row.created_at,
    };
  }
}
