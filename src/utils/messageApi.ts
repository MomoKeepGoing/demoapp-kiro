// Message API utility functions
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Type definitions
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  status: 'sending' | 'sent' | 'failed';
  isRead: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessageContent: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MessageError {
  type: 'VALIDATION' | 'AUTHORIZATION' | 'BUSINESS' | 'SYSTEM';
  message: string;
  originalError?: any;
}

// Error handling utility
function handleMessageError(error: any, operation: string): MessageError {
  console.error(`Message API Error (${operation}):`, error);

  // Check for GraphQL errors
  if (error.errors && Array.isArray(error.errors)) {
    const firstError = error.errors[0];
    
    if (firstError?.errorType === 'Unauthorized') {
      return {
        type: 'AUTHORIZATION',
        message: '您没有权限执行此操作',
        originalError: error,
      };
    }
    
    if (firstError?.errorType === 'ValidationException') {
      return {
        type: 'VALIDATION',
        message: '输入数据无效',
        originalError: error,
      };
    }
  }

  // Network or system errors
  if (error.message?.includes('Network') || error.message?.includes('network')) {
    return {
      type: 'SYSTEM',
      message: '网络连接失败，请检查网络',
      originalError: error,
    };
  }

  // Default error
  return {
    type: 'SYSTEM',
    message: '操作失败，请稍后重试',
    originalError: error,
  };
}

/**
 * Generate message conversation ID from two user IDs
 * 生成消息对话ID（确保唯一性）
 * 
 * IMPORTANT: For Message records, the conversation ID must be the same regardless of who sends.
 * We sort the user IDs to ensure consistency so both users see the same messages.
 * 
 * @param userId - Current user's ID
 * @param otherUserId - Other user's ID
 * @returns Message conversation ID (always in sorted order)
 */
export function generateMessageConversationId(userId: string, otherUserId: string): string {
  // Sort user IDs to ensure the same conversation ID regardless of who sends first
  const sortedIds = [userId, otherUserId].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}

/**
 * Generate user-specific conversation ID
 * 生成用户特定的对话ID
 * 
 * For Conversation records, each user has their own record with their userId first.
 * This allows proper authorization and querying.
 * 
 * @param userId - Current user's ID
 * @param otherUserId - Other user's ID
 * @returns User-specific conversation ID (userId_otherUserId)
 */
export function generateUserConversationId(userId: string, otherUserId: string): string {
  return `${userId}_${otherUserId}`;
}

/**
 * Validate message content
 * 验证消息内容
 * 
 * Requirements: 1.2, 1.3
 * 
 * @param content - Message content to validate
 * @returns true if valid, throws error if invalid
 */
function validateMessageContent(content: string): boolean {
  // Requirement 1.2: WHEN 用户输入的消息内容为空或仅包含空白字符 THEN 消息系统 SHALL 拒绝发送
  if (!content || content.trim().length === 0) {
    throw {
      type: 'VALIDATION',
      message: '消息内容不能为空',
    };
  }

  // Requirement 1.3: WHEN 用户输入的消息内容超过5000个字符 THEN 消息系统 SHALL 拒绝发送
  if (content.length > 5000) {
    throw {
      type: 'VALIDATION',
      message: '消息内容不能超过5000个字符',
    };
  }

  return true;
}

/**
 * Get or create a conversation
 * 获取或创建对话
 * 
 * Requirements: 4.1, 10.1
 * 
 * @param currentUserId - Current user's ID
 * @param otherUserId - Other user's ID
 * @param otherUserName - Other user's name
 * @returns Conversation record
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  otherUserName: string
): Promise<Conversation> {
  try {
    const conversationId = generateUserConversationId(currentUserId, otherUserId);

    // Try to get existing conversation
    const { data: existing, errors: getErrors } = await client.models.Conversation.get({
      id: conversationId,
    });

    if (existing && !getErrors) {
      return {
        id: existing.id,
        userId: existing.userId,
        otherUserId: existing.otherUserId,
        otherUserName: existing.otherUserName,
        lastMessageContent: existing.lastMessageContent,
        lastMessageAt: existing.lastMessageAt,
        unreadCount: existing.unreadCount ?? 0,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    // Create new conversation if it doesn't exist
    // Requirement 10.1: WHEN 用户接收来自非联系人的消息 THEN 消息系统 SHALL 在对话列表中创建新对话
    const now = new Date().toISOString();
    const { data, errors } = await client.models.Conversation.create({
      id: conversationId,
      userId: currentUserId,
      otherUserId: otherUserId,
      otherUserName: otherUserName,
      lastMessageContent: '',
      lastMessageAt: now,
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      throw new Error('Failed to create conversation');
    }

    return {
      id: data.id,
      userId: data.userId,
      otherUserId: data.otherUserId,
      otherUserName: data.otherUserName,
      lastMessageContent: data.lastMessageContent,
      lastMessageAt: data.lastMessageAt,
      unreadCount: data.unreadCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      throw error;
    }
    const messageError = handleMessageError(error, 'getOrCreateConversation');
    throw messageError;
  }
}

/**
 * Send a message
 * 发送消息
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.7
 * 
 * @param receiverId - Receiver's user ID
 * @param content - Message content
 * @param currentUserId - Current user's ID
 * @param receiverName - Receiver's name (for conversation creation)
 * @returns Created message record
 */
export async function sendMessage(
  receiverId: string,
  content: string,
  currentUserId: string,
  receiverName: string
): Promise<Message> {
  try {
    // Validate message content
    validateMessageContent(content);

    // Use sorted conversation ID for messages so both users see the same messages
    const messageConversationId = generateMessageConversationId(currentUserId, receiverId);
    const now = new Date().toISOString();

    // Requirement 1.1: WHEN 用户输入消息内容并点击发送按钮 THEN 消息系统 SHALL 创建消息记录并发送给接收者
    // Requirement 2.7: WHEN 接收到新消息 THEN 消息系统 SHALL 将消息存储到数据库
    const { data, errors } = await client.models.Message.create({
      senderId: currentUserId,
      receiverId: receiverId,
      conversationId: messageConversationId,
      content: content,
      status: 'sent',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      throw new Error('Failed to create message');
    }

    // Update sender's conversation (user-specific ID)
    const senderConvId = generateUserConversationId(currentUserId, receiverId);
    await updateConversationAfterMessage(
      senderConvId,
      currentUserId,
      receiverId,
      receiverName,
      content,
      now,
      0 // Sender doesn't increment unread count
    );

    // NOTE: We cannot update receiver's conversation here because of authorization rules.
    // The receiver's conversation will be created/updated when they receive the message
    // through the subscription in MessagesPage.

    return {
      id: data.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      conversationId: data.conversationId,
      content: data.content,
      status: data.status as 'sending' | 'sent' | 'failed',
      isRead: data.isRead ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      throw error;
    }
    const messageError = handleMessageError(error, 'sendMessage');
    throw messageError;
  }
}

/**
 * Update conversation after sending/receiving a message
 * 更新对话记录（在发送/接收消息后）
 * 
 * @param conversationId - Conversation ID
 * @param userId - Current user's ID
 * @param otherUserId - Other user's ID
 * @param otherUserName - Other user's name
 * @param otherUserAvatar - Other user's avatar URL
 * @param lastMessageContent - Last message content
 * @param lastMessageAt - Last message timestamp
 * @param unreadIncrement - Increment for unread count (0 for sender, 1 for receiver)
 */
async function updateConversationAfterMessage(
  conversationId: string,
  userId: string,
  otherUserId: string,
  otherUserName: string,
  lastMessageContent: string,
  lastMessageAt: string,
  unreadIncrement: number
): Promise<void> {
  try {
    console.log('[updateConversationAfterMessage] Updating conversation:', {
      conversationId,
      userId,
      otherUserId,
      unreadIncrement
    });
    
    // Try to get existing conversation
    const { data: existing, errors: getErrors } = await client.models.Conversation.get({
      id: conversationId,
    });

    if (getErrors) {
      console.error('[updateConversationAfterMessage] Error getting conversation:', getErrors);
    }

    if (existing) {
      console.log('[updateConversationAfterMessage] Found existing conversation, current unreadCount:', existing.unreadCount);
      const newUnreadCount = (existing.unreadCount ?? 0) + unreadIncrement;
      console.log('[updateConversationAfterMessage] New unreadCount will be:', newUnreadCount);
      
      // Update existing conversation
      const { data: updated, errors: updateErrors } = await client.models.Conversation.update({
        id: conversationId,
        lastMessageContent: lastMessageContent.substring(0, 100), // Truncate to 100 chars
        lastMessageAt: lastMessageAt,
        unreadCount: newUnreadCount,
        updatedAt: lastMessageAt,
      });
      
      if (updateErrors) {
        console.error('[updateConversationAfterMessage] Error updating conversation:', updateErrors);
      } else {
        console.log('[updateConversationAfterMessage] Successfully updated conversation:', updated);
      }
    } else {
      console.log('[updateConversationAfterMessage] Creating new conversation with unreadCount:', unreadIncrement);
      
      // Create new conversation
      const { data: created, errors: createErrors } = await client.models.Conversation.create({
        id: conversationId,
        userId: userId,
        otherUserId: otherUserId,
        otherUserName: otherUserName,
        lastMessageContent: lastMessageContent.substring(0, 100),
        lastMessageAt: lastMessageAt,
        unreadCount: unreadIncrement,
        createdAt: lastMessageAt,
        updatedAt: lastMessageAt,
      });
      
      if (createErrors) {
        console.error('[updateConversationAfterMessage] Error creating conversation:', createErrors);
      } else {
        console.log('[updateConversationAfterMessage] Successfully created conversation:', created);
      }
    }
  } catch (error) {
    console.error('[updateConversationAfterMessage] Exception:', error);
    // Don't throw - conversation update is not critical for message sending
  }
}

/**
 * List conversations for current user
 * 获取对话列表
 * 
 * Requirements: 4.1, 4.2
 * 
 * @param currentUserId - Current user's ID
 * @param limit - Maximum number of conversations to return
 * @param nextToken - Pagination token
 * @returns Conversations and next token
 */
export async function listConversations(
  currentUserId: string,
  limit: number = 50,
  nextToken?: string
): Promise<{ conversations: Conversation[]; nextToken?: string }> {
  try {
    // Requirement 4.1: WHEN 用户访问消息页面 THEN 消息系统 SHALL 显示所有对话列表
    // Requirement 4.2: WHEN 显示对话列表 THEN 消息系统 SHALL 按最后消息时间倒序排列
    const { data, errors, nextToken: newNextToken } = await client.models.Conversation.list({
      filter: { userId: { eq: currentUserId } },
      limit: limit,
      nextToken: nextToken,
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      return { conversations: [] };
    }

    // Sort by lastMessageAt descending (newest first)
    const sortedConversations = [...data].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt).getTime();
      const timeB = new Date(b.lastMessageAt).getTime();
      return timeB - timeA;
    });

    const conversations: Conversation[] = sortedConversations.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      otherUserId: conv.otherUserId,
      otherUserName: conv.otherUserName,
      lastMessageContent: conv.lastMessageContent,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount ?? 0,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return {
      conversations,
      nextToken: newNextToken || undefined,
    };
  } catch (error) {
    const messageError = handleMessageError(error, 'listConversations');
    throw messageError;
  }
}

/**
 * List messages for a conversation
 * 获取消息历史
 * 
 * Requirements: 3.1, 3.2, 3.4
 * 
 * @param conversationId - Conversation ID
 * @param limit - Maximum number of messages to return
 * @param nextToken - Pagination token
 * @returns Messages and next token
 */
export async function listMessages(
  conversationId: string,
  limit: number = 50,
  nextToken?: string
): Promise<{ messages: Message[]; nextToken?: string }> {
  try {
    // Requirement 3.1: WHEN 用户打开与联系人的对话 THEN 消息系统 SHALL 加载并显示最近的消息历史
    // Requirement 3.2: WHEN 消息历史超过50条 THEN 消息系统 SHALL 仅加载最近50条消息
    const { data, errors, nextToken: newNextToken } = await client.models.Message.list({
      filter: { conversationId: { eq: conversationId } },
      limit: limit,
      nextToken: nextToken,
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      return { messages: [] };
    }

    // Requirement 3.4: WHEN 显示消息 THEN 消息系统 SHALL 按时间顺序从旧到新排列
    const sortedMessages = [...data].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    const messages: Message[] = sortedMessages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      conversationId: msg.conversationId,
      content: msg.content,
      status: msg.status as 'sending' | 'sent' | 'failed',
      isRead: msg.isRead ?? false,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return {
      messages,
      nextToken: newNextToken || undefined,
    };
  } catch (error) {
    const messageError = handleMessageError(error, 'listMessages');
    throw messageError;
  }
}

/**
 * Mark all messages in a conversation as read
 * 标记对话为已读
 * 
 * Requirements: 11.4
 * 
 * Optimized for performance:
 * - Executes asynchronously without blocking UI
 * - Batch updates messages in parallel
 * - Fails gracefully without affecting user experience
 * 
 * @param userConversationId - User-specific conversation ID (for updating Conversation record)
 * @param currentUserId - Current user's ID (receiver)
 * @param otherUserId - Other user's ID (for generating message conversation ID)
 */
export async function markConversationAsRead(
  userConversationId: string,
  currentUserId: string,
  otherUserId?: string
): Promise<void> {
  // Requirement 11.4: WHEN 用户查看对话 THEN 消息系统 SHALL 将该对话的消息标记为已读
  
  // Execute asynchronously without blocking (fire and forget pattern)
  // This optimization ensures marking as read doesn't block message display
  setTimeout(async () => {
    try {
      // Generate message conversation ID (sorted)
      let messageConversationId = userConversationId;
      if (otherUserId) {
        const sortedIds = [currentUserId, otherUserId].sort();
        messageConversationId = `${sortedIds[0]}_${sortedIds[1]}`;
      }
      
      // Get all unread messages in this conversation where current user is the receiver
      const { data: unreadMessages, errors: listErrors } = await client.models.Message.list({
        filter: {
          conversationId: { eq: messageConversationId },
          receiverId: { eq: currentUserId },
          isRead: { eq: false },
        },
      });

      if (listErrors) {
        console.error('Error listing unread messages:', listErrors);
        return;
      }

      if (!unreadMessages || unreadMessages.length === 0) {
        // No unread messages, just reset conversation unread count
        await client.models.Conversation.update({
          id: userConversationId,
          unreadCount: 0,
        });
        return;
      }

      // Batch update all unread messages to read (parallel execution)
      const updatePromises = unreadMessages.map((msg) =>
        client.models.Message.update({
          id: msg.id,
          isRead: true,
          updatedAt: new Date().toISOString(),
        }).catch((err) => {
          console.error(`Error updating message ${msg.id}:`, err);
          return null; // Continue with other updates even if one fails
        })
      );

      await Promise.all(updatePromises);

      // Reset conversation unread count (use user-specific conversation ID)
      await client.models.Conversation.update({
        id: userConversationId,
        unreadCount: 0,
      });
    } catch (error) {
      // Log error but don't throw - marking as read is not critical for UX
      console.error('Error marking conversation as read:', error);
    }
  }, 0);
}

/**
 * Subscribe to new messages for current user
 * 订阅新消息
 * 
 * Requirements: 2.1, 11.2
 * 
 * @param currentUserId - Current user's ID (receiver)
 * @param onMessage - Callback function when new message arrives
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  currentUserId: string,
  onMessage: (message: Message) => void
): () => void {
  // Requirement 2.1: WHEN 其他用户发送消息给用户 THEN 消息系统 SHALL 实时推送消息到用户的对话界面
  console.log('[subscribeToMessages] Setting up subscription for user:', currentUserId);
  
  // NOTE: We don't use filter here because Amplify's authorization system automatically
  // filters based on ownerDefinedIn fields (senderId and receiverId).
  // Adding our own filter would cause "subscription filter uses same fieldName multiple time" error.
  const subscription = client.models.Message.onCreate().subscribe({
    next: (data) => {
      console.log('[subscribeToMessages] Received message from subscription:', data);
      if (data) {
        // Only process messages where current user is the receiver
        // (We'll receive both sent and received messages due to authorization rules)
        if (data.receiverId === currentUserId) {
          const message: Message = {
            id: data.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            conversationId: data.conversationId,
            content: data.content,
            status: data.status as 'sending' | 'sent' | 'failed',
            isRead: data.isRead ?? false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          console.log('[subscribeToMessages] Calling onMessage callback with:', message);
          onMessage(message);
        } else {
          console.log('[subscribeToMessages] Ignoring message where user is sender');
        }
      }
    },
    error: (error) => {
      console.error('[subscribeToMessages] Subscription error:', error);
    },
  });
  
  console.log('[subscribeToMessages] Subscription created successfully');

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}
