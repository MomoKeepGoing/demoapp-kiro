import { useState, useEffect } from 'react';
import { ConversationListItem } from '../messages/ConversationListItem';
import { ConversationSkeleton } from '../messages/ConversationSkeleton';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './ConversationListPanel.css';

const client = generateClient<Schema>();

export interface Conversation {
  id: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessageContent: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ConversationListPanelProps {
  currentUserId: string;
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string, conversation: Conversation) => void;
  onNewChat: () => void;
  isNewChatActive?: boolean;
  onUnreadCountChange?: (count: number) => void; // 通知父组件未读数变化
}

/**
 * ConversationListPanel - 消息列表面板
 * 
 * 重写版本，确保：
 * - 用户名正确显示
 * - 头像正确加载
 * - 未读数准确更新
 * - 实时同步对话状态
 */
export function ConversationListPanel({
  currentUserId,
  selectedConversationId,
  onConversationSelect,
  onNewChat,
  isNewChatActive = false,
  onUnreadCountChange,
}: ConversationListPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 计算并通知总未读数
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    console.log('[ConversationList] Total unread count:', totalUnread);
    if (onUnreadCountChange) {
      onUnreadCountChange(totalUnread);
    }
  }, [conversations, onUnreadCountChange]);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // 订阅对话更新 - 不使用 filter，由客户端过滤
  useEffect(() => {
    console.log('[ConversationList] Setting up conversation update subscription');
    
    const updateSub = client.models.Conversation.onUpdate().subscribe({
      next: (data) => {
        console.log('[ConversationList] Conversation updated:', data);
        // 客户端过滤：只处理当前用户的对话
        if (data && data.userId === currentUserId) {
          setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === data.id);
            
            // 如果这个对话正在被查看，强制未读数为0
            const isViewing = data.id === selectedConversationId;
            const finalUnreadCount = isViewing ? 0 : (data.unreadCount ?? 0);
            
            if (index >= 0) {
              // 更新现有对话
              const updated = [...prev];
              updated[index] = {
                id: data.id,
                userId: data.userId,
                otherUserId: data.otherUserId,
                otherUserName: data.otherUserName,
                lastMessageContent: data.lastMessageContent,
                lastMessageAt: data.lastMessageAt,
                unreadCount: finalUnreadCount,
                createdAt: data.createdAt ?? null,
                updatedAt: data.updatedAt ?? null,
              };
              console.log('[ConversationList] Updated existing conversation, unreadCount:', finalUnreadCount);
              return sortByTime(updated);
            } else {
              // 对话不在列表中，可能是新创建的，添加它
              console.log('[ConversationList] Conversation not found in list, adding it');
              const newConv: Conversation = {
                id: data.id,
                userId: data.userId,
                otherUserId: data.otherUserId,
                otherUserName: data.otherUserName,
                lastMessageContent: data.lastMessageContent,
                lastMessageAt: data.lastMessageAt,
                unreadCount: finalUnreadCount,
                createdAt: data.createdAt ?? null,
                updatedAt: data.updatedAt ?? null,
              };
              return sortByTime([...prev, newConv]);
            }
          });
        }
      },
      error: (err) => console.error('[ConversationList] Update subscription error:', err),
    });

    return () => {
      console.log('[ConversationList] Cleaning up update subscription');
      updateSub.unsubscribe();
    };
  }, [currentUserId, selectedConversationId]);

  // 订阅新对话创建 - 不使用 filter，由客户端过滤
  useEffect(() => {
    console.log('[ConversationList] Setting up conversation create subscription');
    
    const createSub = client.models.Conversation.onCreate().subscribe({
      next: (data) => {
        console.log('[ConversationList] New conversation created:', data);
        // 客户端过滤：只处理当前用户的对话
        if (data && data.userId === currentUserId) {
          // 如果这个对话正在被查看，强制未读数为0
          const isViewing = data.id === selectedConversationId;
          const finalUnreadCount = isViewing ? 0 : (data.unreadCount ?? 0);
          
          const newConv: Conversation = {
            id: data.id,
            userId: data.userId,
            otherUserId: data.otherUserId,
            otherUserName: data.otherUserName,
            lastMessageContent: data.lastMessageContent,
            lastMessageAt: data.lastMessageAt,
            unreadCount: finalUnreadCount,
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
          };
          
          console.log('[ConversationList] New conversation unreadCount:', finalUnreadCount);
          
          setConversations((prev) => {
            if (prev.some((c) => c.id === newConv.id)) {
              return prev;
            }
            return sortByTime([...prev, newConv]);
          });
        }
      },
      error: (err) => console.error('[ConversationList] Create subscription error:', err),
    });

    return () => {
      console.log('[ConversationList] Cleaning up create subscription');
      createSub.unsubscribe();
    };
  }, [currentUserId, selectedConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('[ConversationList] Loading conversations for user:', currentUserId);
      
      const { data: convList } = await client.models.Conversation.list({
        filter: { userId: { eq: currentUserId } },
      });

      console.log('[ConversationList] Loaded conversations:', convList);

      const conversations: Conversation[] = convList.map((c) => ({
        id: c.id,
        userId: c.userId,
        otherUserId: c.otherUserId,
        otherUserName: c.otherUserName,
        lastMessageContent: c.lastMessageContent,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount ?? 0,
        createdAt: c.createdAt ?? null,
        updatedAt: c.updatedAt ?? null,
      }));

      setConversations(sortByTime(conversations));
    } catch (err) {
      console.error('[ConversationList] Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortByTime = (convs: Conversation[]): Conversation[] => {
    return [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt).getTime();
      const timeB = new Date(b.lastMessageAt).getTime();
      return timeB - timeA;
    });
  };

  // 搜索过滤
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) =>
        conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="conversation-list-panel">
      {/* 头部 */}
      <div className="conv-header">
        <h2 className="conv-title">消息</h2>
        <button
          className={`btn-icon ${isNewChatActive ? 'active' : ''}`}
          onClick={onNewChat}
          title="新建聊天"
        >
          ➕
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="conv-search">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索对话"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 对话列表 */}
      <div className="conv-list-container">
        {loading ? (
          <div className="conv-loading">
            <ConversationSkeleton count={8} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="conv-empty">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <p className="empty-title">未找到匹配的对话</p>
                <p className="empty-hint">尝试使用不同的关键词</p>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <p className="empty-title">暂无对话</p>
                <p className="empty-hint">点击右上角 ➕ 开始聊天</p>
              </>
            )}
          </div>
        ) : (
          <div className="conv-list">
            {filteredConversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                currentUserId={currentUserId}
                isSelected={conv.id === selectedConversationId}
                onClick={() => onConversationSelect(conv.id, conv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
