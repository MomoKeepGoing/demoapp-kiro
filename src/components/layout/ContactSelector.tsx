import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { SearchBar } from '../contacts/SearchBar';
import { SearchResults } from '../contacts/SearchResults';
import { ContactList } from '../contacts/ContactList';
import { Toast, type ToastType } from '../Toast';
import {
  searchUsers,
  createContact,
  listContacts,
  deleteContact,
  type UserProfile,
  type Contact,
  type ContactError,
} from '../../utils/contactApi';
import './ContactSelector.css';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface ContactSelectorProps {
  onBack: () => void;
  onSelectContact: (userId: string, username: string) => void;
}

/**
 * ContactSelector - Contact selection component for new chat
 * 联系人选择器组件
 * 
 * Requirements: AC3, AC5
 * 
 * Features:
 * - Header with back button and title
 * - Search bar for finding users
 * - Contact list display
 * - Add contact functionality
 * - Click contact to start chat
 */
export function ContactSelector({ onBack, onSelectContact }: ContactSelectorProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Load contacts on mount
  useEffect(() => {
    if (user?.userId) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user?.userId) return;

    try {
      setIsLoadingContacts(true);
      const contactList = await listContacts(user.userId);
      setContacts(contactList);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showToast('加载联系人失败', 'error');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!user?.userId) return;

    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const results = await searchUsers(query, user.userId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      const contactError = error as ContactError;
      setSearchError(contactError.message || '搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (targetUser: UserProfile) => {
    if (!user?.userId) return;

    if (targetUser.userId === user.userId) {
      showToast('不能添加自己为联系人', 'warning');
      return;
    }

    const alreadyContact = contacts.some(
      (c) => c.contactUserId === targetUser.userId
    );
    if (alreadyContact) {
      showToast('该用户已是您的联系人', 'warning');
      return;
    }

    try {
      setAddingUserId(targetUser.userId);
      const newContact = await createContact(user.userId, targetUser);
      setContacts([newContact, ...contacts]);
      showToast(`已添加 ${targetUser.username} 为联系人`, 'success');
    } catch (error) {
      console.error('Error adding contact:', error);
      const contactError = error as ContactError;
      
      if (contactError.type === 'BUSINESS') {
        showToast(contactError.message, 'warning');
      } else if (contactError.type === 'VALIDATION') {
        showToast(contactError.message, 'warning');
      } else {
        showToast('添加联系人失败，请稍后重试', 'error');
      }
    } finally {
      setAddingUserId(null);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!user?.userId) return;

    try {
      setDeletingContactId(contact.contactUserId);
      await deleteContact(user.userId, contact.contactUserId);
      setContacts(contacts.filter((c) => c.contactUserId !== contact.contactUserId));
      showToast(`已删除联系人 ${contact.contactUsername || '此用户'}`, 'success');
    } catch (error) {
      console.error('Error deleting contact:', error);
      const contactError = error as ContactError;
      showToast(contactError.message || '删除联系人失败，请稍后重试', 'error');
    } finally {
      setDeletingContactId(null);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({
      message,
      type,
      visible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleSendMessage = (contact: Contact) => {
    onSelectContact(contact.contactUserId, contact.contactUsername || '');
  };

  return (
    <div className="contact-selector">
      {/* Header */}
      <div className="contact-selector-header">
        <button 
          className="btn-back"
          onClick={onBack}
          title="返回"
          aria-label="返回"
        >
          ←
        </button>
        <div className="contact-selector-header-content">
          <h2 className="contact-selector-title">选择联系人</h2>
          <p className="contact-selector-subtitle">搜索或选择联系人开始聊天</p>
        </div>
      </div>

      {/* Search section */}
      <div className="contact-selector-search">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            handleSearch(value);
          }}
          isSearching={isSearching}
          placeholder="搜索或添加联系人"
        />
      </div>

      {/* Content */}
      <div className="contact-selector-content">
        {/* Search results section - only show when there's a search query */}
        {searchQuery && (
          <SearchResults
            results={searchResults}
            contacts={contacts}
            onAddContact={handleAddContact}
            isLoading={isSearching}
            error={searchError}
            addingUserId={addingUserId}
          />
        )}

        {/* Contacts list section */}
        <ContactList
          contacts={contacts}
          isLoading={isLoadingContacts}
          onDeleteContact={handleDeleteContact}
          onSendMessage={handleSendMessage}
          deletingContactId={deletingContactId}
        />
      </div>

      {/* Toast notifications */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
