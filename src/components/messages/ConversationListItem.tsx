import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { Schema } from '../../../amplify/data/resource';
import './ConversationListItem.css';

const client = generateClient<Schema>();

export interface ConversationListItemProps {
  conversation: {
    id: string;
    otherUserId: string;
    otherUserName: string;
    lastMessageContent: string;
    lastMessageAt: string;
    unreadCount: number;
  };
  currentUserId: string;
  onClick: () => void;
  isSelected?: boolean;
}

/**
 * ConversationListItem - 对话列表项
 * 
 * 重构版本：
 * - 不依赖 Conversation 表中的 otherUserAvatar 字段
 * - 实时从 UserProfile 获取最新头像
 * - 自动响应用户头像更新
 */
export function ConversationListItem({ 
  conversation, 
  onClick, 
  isSelected = false 
}: ConversationListItemProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(conversation.otherUserName);
  
  // 实时获取对方的用户资料（包括最新头像）
  useEffect(() => {
    let mounted = true;
    
    const loadUserProfile = async () => {
      try {
        // 从 UserProfile 获取最新数据
        const { data: profile } = await client.models.UserProfile.get({
          userId: conversation.otherUserId,
        });
        
        if (!mounted) return;
        
        if (profile) {
          // 更新显示名称
          if (profile.username) {
            setDisplayName(profile.username);
          }
          
          // 加载头像
          if (profile.avatarUrl) {
            try {
              const result = await getUrl({
                path: profile.avatarUrl,
              });
              
              if (mounted) {
                setAvatarUrl(result.url.toString());
              }
            } catch (err) {
              console.error('[ConversationListItem] Error loading avatar:', err);
              if (mounted) {
                setAvatarUrl(null);
              }
            }
          } else {
            setAvatarUrl(null);
          }
        }
      } catch (err) {
        console.error('[ConversationListItem] Error loading user profile:', err);
      }
    };
    
    loadUserProfile();
    
    return () => {
      mounted = false;
    };
  }, [conversation.otherUserId]);
  
  // 截断消息
  const truncatedMessage = conversation.lastMessageContent.length > 50
    ? conversation.lastMessageContent.substring(0, 50) + '...'
    : conversation.lastMessageContent || '暂无消息';
  
  // 格式化时间
  const formattedTime = formatMessageTime(conversation.lastMessageAt);
  
  // 头像占位符
  const avatarPlaceholder = displayName.charAt(0).toUpperCase();
  
  return (
    <div 
      className={`conv-item ${isSelected ? 'conv-item-selected' : ''}`}
      onClick={onClick}
    >
      {/* 头像 */}
      <div className="conv-avatar">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="" 
            className="conv-avatar-img"
            onError={() => setAvatarUrl(null)}
          />
        ) : (
          <div className="conv-avatar-placeholder">
            {avatarPlaceholder}
          </div>
        )}
      </div>
      
      {/* 内容 */}
      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{displayName}</span>
          <span className="conv-time">{formattedTime}</span>
        </div>
        
        <div className="conv-bottom">
          <span className="conv-message">{truncatedMessage}</span>
          {conversation.unreadCount > 0 && (
            <span className="conv-unread">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
