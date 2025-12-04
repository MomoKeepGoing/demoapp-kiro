import { ContactCard } from './ContactCard';
import { Loading } from '../Loading';
import type { Contact } from '../../utils/contactApi';
import './ContactList.css';

interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  onDeleteContact: (contact: Contact) => void;
  deletingContactId?: string | null;
}

/**
 * ContactList component for displaying all user contacts
 * Requirements: 3.1-3.5, 6.2, 6.6
 * 
 * Features:
 * - Display all contacts in a list
 * - Empty state when no contacts
 * - Loading state during data fetch
 * - Integration with ContactCard component
 * - WhatsApp-style design
 * - Responsive layout
 */
export function ContactList({ 
  contacts, 
  isLoading, 
  onDeleteContact,
  deletingContactId 
}: ContactListProps) {
  // Requirement 6.6: Display loading indicator during data loading
  if (isLoading) {
    return (
      <div className="contact-list-loading">
        <Loading size="medium" text="加载联系人..." />
      </div>
    );
  }

  // Requirement 3.2: Display empty state when no contacts
  if (contacts.length === 0) {
    return (
      <div className="contact-list-empty">
        <div className="contact-list-empty-icon">
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="contact-list-empty-title">暂无联系人</h3>
        <p className="contact-list-empty-message">
          使用上方搜索框查找并添加联系人
        </p>
      </div>
    );
  }

  // Requirement 3.1: Display all added contacts
  // Requirement 3.3: Display contact username and avatar (via ContactCard)
  // Requirement 3.4: Contacts are sorted by time descending (handled by API)
  // Requirement 6.2: Display contacts in card/list format
  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h2 className="contact-list-title">我的联系人</h2>
        <span className="contact-list-count">{contacts.length}</span>
      </div>
      <div className="contact-list-items">
        {contacts.map((contact) => (
          <ContactCard
            key={`${contact.userId}-${contact.contactUserId}`}
            contact={contact}
            onDeleteContact={onDeleteContact}
            isDeleting={deletingContactId === contact.contactUserId}
          />
        ))}
      </div>
    </div>
  );
}
