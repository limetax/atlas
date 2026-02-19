import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import type { Chat, ChatMessage } from '@chat/domain/chat.entity';
import { ChatRepository } from '@chat/domain/chat.repository';
import { ChatContext, ChatMessageMetadata, MessageRole } from '@atlas/shared';
import { ChatPersistenceMapper } from './chat-persistence.mapper';

/**
 * Supabase Chat Repository - Infrastructure implementation for chat data access
 * Extends ChatRepository using Supabase client with service role key
 */
@Injectable()
export class SupabaseChatRepository extends ChatRepository {
  private readonly logger = new Logger(SupabaseChatRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly mapper: ChatPersistenceMapper
  ) {
    super();
  }

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

    return (data ?? []).map((row) => this.mapper.chatToDomain(row));
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

    return this.mapper.chatToDomain(data);
  }

  async create(advisorId: string, title: string, context?: ChatContext): Promise<Chat> {
    const { data, error } = await this.supabase.db
      .from('chats')
      .insert(this.mapper.chatToPersistence(advisorId, title, context))
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create chat:', error);
      throw new Error(`Failed to create chat: ${error.message}`);
    }

    return this.mapper.chatToDomain(data);
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

    return this.mapper.chatToDomain(data);
  }

  async updateContext(
    chatId: string,
    advisorId: string,
    context: ChatContext
  ): Promise<Chat | null> {
    const insertData = this.mapper.chatToPersistence(advisorId, '', context);
    const { data, error } = await this.supabase.db
      .from('chats')
      .update({ context: insertData.context, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('advisor_id', advisorId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error(`Failed to update chat context ${chatId}:`, error);
      throw new Error(`Failed to update chat context: ${error.message}`);
    }

    return this.mapper.chatToDomain(data);
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
    // Lightweight ownership check — only fetches the ID, skips full domain mapping
    const { data: chatExists } = await this.supabase.db
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('advisor_id', advisorId)
      .single();
    if (!chatExists) return [];

    const { data, error } = await this.supabase.db
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch messages for chat ${chatId}:`, error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data ?? []).map((row) => this.mapper.messageToDomain(row));
  }

  async addMessage(
    chatId: string,
    role: MessageRole,
    content: string,
    metadata?: ChatMessageMetadata
  ): Promise<ChatMessage> {
    const { data, error } = await this.supabase.db
      .from('chat_messages')
      .insert(this.mapper.messageToPersistence(chatId, role, content, metadata))
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to add message to chat ${chatId}:`, error);
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return this.mapper.messageToDomain(data);
  }
}
