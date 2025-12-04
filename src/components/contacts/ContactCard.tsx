import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { Contact } from '../../utils/contactApi';
import './ContactCard.css';

interface ContactCardProps {
  contact: Contact;
  onDeleteContact: (contact: Contact) => void;
  onSendMessage?: (contact: Contact) => void;
  isDeleting?: boolean;
}

/**
 * ContactCard component for displaying contact information in contact list
 * Requirements: 3.3, 4.1, 4.2, 6.2, 6.3
 * 
 * Features:
 * - Display contact avatar and username (with real-time sync)
 * - Delete contact button
 * - Delete confirmation dialog
 * - WhatsApp-style design
 * - Responsive layout
 * - Load avatar from S3 with signed URLs
 */
export function ContactCard({ contact, onDeleteContact, onSendMessage, isDeleting = false }: ContactCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.contactUsername ?? '');

  // Load avatar from S3 if contactAvatarUrl is provided
  useEffect(() => {
    let isMounted = true;

    const loadAvatar = async () => {
      // Reset state when contact changes
      setAvatarUrl(null);
      setAvatarError(false);
      
      console.log('[ContactCard] Loading avatar for:', contact.contactUsername);
      console.log('[ContactCard] Avatar URL:', contact.contactAvatarUrl);
      
      if (!contact.contactAvatarUrl) {
        console.log('[ContactCard] No avatar URL provided, will use default');
        return;
      }

      try {
        if (contact.contactAvatarUrl.startsWith('profile-pictures/')) {
          // This is an S3 path, need to get signed URL
          console.log('[ContactCard] Fetching S3 signed URL for:', contact.contactAvatarUrl);
          const result = await getUrl({ path: contact.contactAvatarUrl });
          console.log('[ContactCard] Got signed URL:', result.url.toString().substring(0, 100) + '...');
          if (isMounted) {
            setAvatarUrl(result.url.toString());
            setAvatarError(false);
          }
        } else {
          // Direct URL (e.g., https://... or data:...)
          console.log('[ContactCard] Using direct URL');
          if (isMounted) {
            setAvatarUrl(contact.contactAvatarUrl);
            setAvatarError(false);
          }
        }
      } catch (err) {
        console.error('[ContactCard] Error loading contact avatar:', err);
        if (isMounted) {
          setAvatarError(true);
        }
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [contact.contactUserId, contact.contactAvatarUrl, contact.contactUsername]);

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmDialog(false);
    onDeleteContact(contact);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
  };

  const displayAvatar = avatarError ? defaultAvatar : (avatarUrl || defaultAvatar);

  return (
    <>
      <div className="contact-card">
        <img 
          src={displayAvatar} 
          alt={contact.contactUsername ?? ''}
          className="contact-card-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
            setAvatarError(true);
          }}
        />
        <div className="contact-card-info">
          <h3 className="contact-card-username">{contact.contactUsername}</h3>
        </div>
        <div className="contact-card-actions">
          {onSendMessage && (
            <button 
              className="contact-card-message-button"
              onClick={() => onSendMessage(contact)}
              aria-label="发送消息"
              title="发送消息"
            >
              💬
            </button>
          )}
          <button 
            className="contact-card-delete-button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            aria-label="删除联系人"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="contact-card-dialog-overlay" onClick={handleCancelDelete}>
          <div className="contact-card-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="contact-card-dialog-title">确认删除</h3>
            <p className="contact-card-dialog-message">
              确定要删除联系人 <strong>{contact.contactUsername}</strong> 吗？
            </p>
            <div className="contact-card-dialog-actions">
              <button 
                className="contact-card-dialog-button contact-card-dialog-button-cancel"
                onClick={handleCancelDelete}
              >
                取消
              </button>
              <button 
                className="contact-card-dialog-button contact-card-dialog-button-confirm"
                onClick={handleConfirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
