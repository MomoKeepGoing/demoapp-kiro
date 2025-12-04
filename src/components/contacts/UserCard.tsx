import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { UserProfile } from '../../utils/contactApi';
import './UserCard.css';

interface UserCardProps {
  user: UserProfile;
  isContact: boolean;
  onAddContact: (user: UserProfile) => void;
  isAdding?: boolean;
}

/**
 * UserCard component for displaying user information in search results
 * Requirements: 1.7, 2.1, 2.4, 6.2, 6.3
 * 
 * Features:
 * - Display user avatar, username, and email
 * - Add contact button
 * - Show "已添加" badge for existing contacts
 * - Responsive layout
 * - WhatsApp-style design
 */
export function UserCard({ user, isContact, onAddContact, isAdding = false }: UserCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username);

  // Load avatar from S3
  useEffect(() => {
    let mounted = true;
    
    const loadAvatar = async () => {
      if (!user.avatarUrl) {
        setAvatarUrl(null);
        return;
      }
      
      try {
        const result = await getUrl({
          path: user.avatarUrl,
        });
        
        if (mounted) {
          setAvatarUrl(result.url.toString());
        }
      } catch (error) {
        console.error('[UserCard] Error loading avatar:', error);
        if (mounted) {
          setAvatarUrl(null);
        }
      }
    };
    
    loadAvatar();
    
    return () => {
      mounted = false;
    };
  }, [user.avatarUrl]);

  return (
    <div className="user-card">
      <img 
        src={avatarUrl || defaultAvatar} 
        alt={user.username}
        className="user-card-avatar"
        onError={(e) => {
          (e.target as HTMLImageElement).src = defaultAvatar;
        }}
      />
      <div className="user-card-info">
        <h3 className="user-card-username">{user.username}</h3>
        <p className="user-card-email">{user.email}</p>
      </div>
      {isContact ? (
        <span className="user-card-badge">已添加</span>
      ) : (
        <button 
          className="user-card-button"
          onClick={() => onAddContact(user)}
          disabled={isAdding}
        >
          {isAdding ? '添加中...' : '添加联系人'}
        </button>
      )}
    </div>
  );
}
