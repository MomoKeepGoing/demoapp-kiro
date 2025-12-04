/**
 * MessagesPage Component
 * 
 * Main messaging page that displays conversation list with WhatsApp-style design.
 * 
 * Features:
 * - Display conversation list (using ConversationListItem component)
 * - Sort conversations by lastMessageAt descending
 * - Display total unread message count (in header)
 * - Subscribe to new messages and update conversation list
 * - Click conversation to open ConversationView
 * - Display loading and empty states
 * - Optional search bar for searching conversations
 * 
 * Validates: Requirements 4.1, 4.2, 4.5, 4.6, 11.5, 11.6
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ConversationListItem } from './ConversationListItem';
import { ConversationView } from './ConversationView';
import { ConversationSkeleton } from './ConversationSkeleton';
import { 
  listConversations, 
  subscribeToMessages,
  type Conversation,
  type Message,
  type MessageError 
} from '../../utils/messageApi';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ToastContainer';
import './MessagesPage.css';

const client = generateClient<Schema>();

export interface MessagesPageProps {
  currentUserId: string;
  initialTargetUserId?: string;
  initialTargetUsername?: string;
  onBack?: () => void;
}

export function MessagesPage({ currentUserId, initialTargetUserId, initialTargetUsername, onBack }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  // Toast notifications
  const { toasts, showError, removeToast } = useToast();

  // Load conversations on mount
  // Requirement 11.2: WHEN 用户重新上线 THEN 消息系统 SHALL 加载所有离线期间的未读消息
  // Requirement 11.5: WHEN 对话有未读消息 THEN 消息系统 SHALL 在对话列表中显示未读消息数量
  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // Auto-open conversation if initialTargetUserId is provided (only once)
  useEffect(() => {
    if (initialTargetUserId && initialTargetUsername && !loading && !hasAutoOpened) {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.otherUserId === initialTargetUserId);
      
      if (existingConv) {
        // Open existing conversation
        setSelectedConversation(existingConv);
      } else {
        // Create a new conversation object for display (for first-time chat)
        const newConv: Conversation = {
          id: `${currentUserId}_${initialTargetUserId}`,
          userId: currentUserId,
          otherUserId: initialTargetUserId,
          otherUserName: initialTargetUsername,
          lastMessageContent: '',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSelectedConversation(newConv);
      }
      // Mark as auto-opened to prevent reopening
      setHasAutoOpened(true);
    }
  }, [initialTargetUserId, initialTargetUsername, conversations, currentUserId, loading, hasAutoOpened]);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(currentUserId, handleNewMessage);
    return () => unsubscribe();
  }, [currentUserId]);

  // Calculate total unread count whenever conversations change
  useEffect(() => {
    // Requirement 11.6: WHEN 用户有未读消息 THEN 消息系统 SHALL 在应用图标或标题栏显示总未读数量
    const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    setTotalUnread(total);
  }, [conversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    // NOTE: Don't use filter here because Amplify's authorization system automatically
    // filters based on ownerDefinedIn field (userId).
    const subscription = client.models.Conversation.onCreate().subscribe({
      next: (data) => {
        console.log('[MessagesPage] Conversation onCreate:', data);
        if (data) {
          // Only process conversations for current user
          if (data.userId === currentUserId) {
            const newConversation: Conversation = {
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
            
            setConversations((prev) => {
              // Check if conversation already exists
              if (prev.some((c) => c.id === newConversation.id)) {
                return prev;
              }
              // Add new conversation and sort
              return sortConversations([...prev, newConversation]);
            });
          }
        }
      },
      error: (err) => console.error('Conversation subscription error:', err),
    });

    return () => subscription.unsubscribe();
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Requirement 4.1: WHEN 用户访问消息页面 THEN 消息系统 SHALL 显示所有对话列表
      // Requirement 11.1: WHEN 用户离线时接收到消息 THEN 消息系统 SHALL 存储消息到数据库
      // Requirement 11.2: WHEN 用户重新上线 THEN 消息系统 SHALL 加载所有离线期间的未读消息
      // This loads all conversations including those with offline messages (unreadCount > 0)
      const result = await listConversations(currentUserId);
      
      // Requirement 4.2: WHEN 显示对话列表 THEN 消息系统 SHALL 按最后消息时间倒序排列
      const sorted = sortConversations(result.conversations);
      setConversations(sorted);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      
      // Requirement 1.6, 1.7: Handle errors with toast notifications
      const error = err as MessageError;
      if (error.type === 'AUTHORIZATION') {
        showError('您没有权限查看对话列表');
      } else if (error.type === 'SYSTEM') {
        showError(error.message || '加载失败，请检查网络连接');
      } else {
        showError(error.message || '加载对话列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const sortConversations = (convs: Conversation[]): Conversation[] => {
    // Requirement 4.2: Sort by lastMessageAt descending (newest first)
    return [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt).getTime();
      const timeB = new Date(b.lastMessageAt).getTime();
      return timeB - timeA;
    });
  };

  // Ref to store callback for updating ConversationView
  const conversationViewMessageHandlerRef = useRef<((message: Message) => void) | null>(null);

  const handleNewMessage = useCallback(async (message: Message) => {
    console.log('[MessagesPage] Received new message:', message);
    
    // If ConversationView is open and this message is for that conversation, notify it
    if (conversationViewMessageHandlerRef.current) {
      conversationViewMessageHandlerRef.current(message);
    }
    
    // Update conversation list when new message arrives
    const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const userConversationId = `${currentUserId}_${otherUserId}`;
    const isReceiver = message.receiverId === currentUserId;
    const isViewingConversation = selectedConversation?.id === userConversationId;
    
    // Update conversation in database if we're the receiver
    if (isReceiver) {
      try {
        const { data: existing } = await client.models.Conversation.get({
          id: userConversationId,
        });
        
        if (existing) {
          // Update existing conversation
          const newUnreadCount = isViewingConversation ? 0 : (existing.unreadCount ?? 0) + 1;
          await client.models.Conversation.update({
            id: userConversationId,
            lastMessageContent: message.content.substring(0, 100),
            lastMessageAt: message.createdAt || new Date().toISOString(),
            unreadCount: newUnreadCount,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Create new conversation - need to get sender's profile
          const { data: senderProfile } = await client.models.UserProfile.get({
            userId: message.senderId,
          });
          
          await client.models.Conversation.create({
            id: userConversationId,
            userId: currentUserId,
            otherUserId: message.senderId,
            otherUserName: senderProfile?.username || `User_${message.senderId.substring(0, 8)}`,
            lastMessageContent: message.content.substring(0, 100),
            lastMessageAt: message.createdAt || new Date().toISOString(),
            unreadCount: isViewingConversation ? 0 : 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[MessagesPage] Error updating conversation:', err);
      }
    }
    
    // Update local state
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === userConversationId);

      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        const conversation = updated[existingIndex];
        
        updated[existingIndex] = {
          ...conversation,
          lastMessageContent: message.content,
          lastMessageAt: message.createdAt || new Date().toISOString(),
          unreadCount: isReceiver && !isViewingConversation 
            ? conversation.unreadCount + 1 
            : conversation.unreadCount,
        };
        
        return sortConversations(updated);
      } else {
        // Conversation doesn't exist - reload conversation list to fetch it
        loadConversations();
        return prev;
      }
    });
  }, [currentUserId, selectedConversation]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Reset unread count for this conversation in local state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleBackFromConversation = () => {
    setSelectedConversation(null);
    // Reload conversations to get updated unread counts
    loadConversations();
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) =>
        conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // If a conversation is selected, show ConversationView
  if (selectedConversation) {
    return (
      <ConversationView
        conversationId={selectedConversation.id}
        otherUserId={selectedConversation.otherUserId}
        otherUserName={selectedConversation.otherUserName}
        currentUserId={currentUserId}
        onBack={handleBackFromConversation}
        registerMessageHandler={(handler) => {
          conversationViewMessageHandlerRef.current = handler;
        }}
      />
    );
  }

  // Show conversation list
  return (
    <div className="messages-page">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Header */}
      <div className="messages-header">
        {onBack && (
          <button
            className="back-button"
            onClick={onBack}
            aria-label="返回"
          >
            ←
          </button>
        )}
        
        <div className="header-content">
          <h2>消息</h2>
          {/* Requirement 11.6: Display total unread count */}
          {totalUnread > 0 && (
            <span className="total-unread-badge" aria-label={`${totalUnread} 条未读消息`}>
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* Search Bar (Optional) */}
      <div className="messages-search">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索对话..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜索对话"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="清除搜索"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="conversations-container">
        {loading ? (
          // Loading state with skeleton
          <div className="loading-state">
            <ConversationSkeleton count={8} />
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty state
          // Requirement 4.5: WHEN 对话列表为空 THEN 消息系统 SHALL 显示空状态提示
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <p className="empty-title">未找到匹配的对话</p>
                <p className="empty-hint">尝试使用不同的关键词搜索</p>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <p className="empty-title">还没有对话</p>
                <p className="empty-hint">从联系人列表开始新对话</p>
              </>
            )}
          </div>
        ) : (
          // Conversation list
          <div className="conversation-list" role="list">
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
