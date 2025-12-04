import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { ContactList } from './ContactList';
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
import './ContactsPage.css';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ContactsPageProps {
  onBack?: () => void;
  onSendMessage?: (userId: string, username: string) => void;
}

/**
 * ContactsPage - Main component for contact management
 * 联系人页面主组件
 * 
 * Requirements: All requirements (1.1-7.3)
 * 
 * Features:
 * - User search with debounce
 * - Add contacts with validation and error handling
 * - View contact list
 * - Delete contacts with confirmation
 * - Toast notifications for user feedback
 * - State management for search, results, and contacts
 */
export function ContactsPage({ onBack, onSendMessage }: ContactsPageProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // State management
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

  /**
   * Load user's contact list
   * Requirement 3.1: Display all added contacts
   */
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

  /**
   * Search users by query
   * Requirements: 1.1-1.7
   * Debounce is handled by SearchBar component
   */
  const handleSearch = async (query: string) => {
    if (!user?.userId) return;

    // Requirement 1.4: Empty or whitespace-only queries return empty results
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Requirement 1.1-1.3: Search by username or email
      // Requirement 1.5: Limit to 20 results
      // Requirement 1.6: Exclude current user
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

  /**
   * Add a user as contact
   * Requirements: 2.1-2.5
   */
  const handleAddContact = async (targetUser: UserProfile) => {
    if (!user?.userId) return;

    // Requirement 2.3: Cannot add self as contact (validated in API)
    if (targetUser.userId === user.userId) {
      showToast('不能添加自己为联系人', 'warning');
      return;
    }

    // Check if already a contact
    // Requirement 1.7: Mark existing contacts
    const alreadyContact = contacts.some(
      (c) => c.contactUserId === targetUser.userId
    );
    if (alreadyContact) {
      showToast('该用户已是您的联系人', 'warning');
      return;
    }

    try {
      setAddingUserId(targetUser.userId);
      
      // Requirement 2.1: Create contact relationship record
      // Requirement 2.5: Record creation timestamp
      const newContact = await createContact(user.userId, targetUser);
      
      // Requirement 2.4: Update UI to show user as added
      setContacts([newContact, ...contacts]);
      
      // Requirement 6.4: Display success toast notification
      showToast(`已添加 ${targetUser.username} 为联系人`, 'success');
    } catch (error) {
      console.error('Error adding contact:', error);
      const contactError = error as ContactError;
      
      // Requirement 2.2: Handle duplicate contact error
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

  /**
   * Delete a contact
   * Requirements: 4.1-4.4
   */
  const handleDeleteContact = async (contact: Contact) => {
    if (!user?.userId) return;

    // Requirement 4.1: Show confirmation dialog
    const confirmed = window.confirm(
      `确定要删除联系人 ${contact.contactUsername || '此用户'} 吗？`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setDeletingContactId(contact.contactUserId);
      
      // Requirement 4.2: Delete contact relationship record
      await deleteContact(user.userId, contact.contactUserId);
      
      // Requirement 4.3: Remove from contact list
      setContacts(contacts.filter((c) => c.contactUserId !== contact.contactUserId));
      
      // Requirement 4.4: Update search results if visible
      // (Search results will automatically reflect the change on next search)
      
      // Requirement 6.4: Display success toast notification
      showToast(`已删除联系人 ${contact.contactUsername || '此用户'}`, 'success');
    } catch (error) {
      console.error('Error deleting contact:', error);
      const contactError = error as ContactError;
      showToast(contactError.message || '删除联系人失败，请稍后重试', 'error');
    } finally {
      setDeletingContactId(null);
    }
  };

  /**
   * Show toast notification
   * Requirement 6.4: Display toast notifications for operations
   */
  const showToast = (message: string, type: ToastType) => {
    setToast({
      message,
      type,
      visible: true,
    });
  };

  /**
   * Hide toast notification
   */
  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  /**
   * Handle send message to contact
   */
  const handleSendMessage = (contact: Contact) => {
    if (onSendMessage) {
      onSendMessage(contact.contactUserId, contact.contactUsername || '');
    }
  };

  return (
    <div className="contacts-page">
      {/* Page header */}
      <div className="contacts-page-header">
        {onBack && (
          <button className="contacts-back-button" onClick={onBack} title="返回">
            ←
          </button>
        )}
        <div className="contacts-header-content">
          <h1 className="contacts-page-title">联系人</h1>
          <p className="contacts-page-subtitle">搜索和管理您的联系人</p>
        </div>
      </div>

      {/* Search section */}
      <div className="contacts-page-search">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            handleSearch(value);
          }}
          isSearching={isSearching}
        />
      </div>

      {/* Search results section - only show when there's a search query */}
      {searchQuery && (
        <div className="contacts-page-results">
          <SearchResults
            results={searchResults}
            contacts={contacts}
            onAddContact={handleAddContact}
            isLoading={isSearching}
            error={searchError}
            addingUserId={addingUserId}
          />
        </div>
      )}

      {/* Contacts list section */}
      <div className="contacts-page-list">
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
