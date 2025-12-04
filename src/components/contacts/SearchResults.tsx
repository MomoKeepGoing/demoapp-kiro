import type { UserProfile, Contact } from '../../utils/contactApi';
import { UserCard } from './UserCard';
import './SearchResults.css';

interface SearchResultsProps {
  results: UserProfile[];
  contacts: Contact[];
  onAddContact: (user: UserProfile) => void;
  isLoading?: boolean;
  error?: string | null;
  addingUserId?: string | null;
}

/**
 * SearchResults component for displaying user search results
 * Requirements: 1.1-1.7, 6.2, 6.6
 * 
 * Features:
 * - Display search results list
 * - Empty state message
 * - Integrate UserCard component
 * - Handle loading state
 * - Handle error state
 * - Mark existing contacts
 */
export function SearchResults({ 
  results, 
  contacts, 
  onAddContact,
  isLoading = false,
  error = null,
  addingUserId = null
}: SearchResultsProps) {
  // Check if a user is already a contact
  const isContact = (userId: string): boolean => {
    return contacts.some(contact => contact.contactUserId === userId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="search-results">
        <div className="search-results-loading">
          <div className="search-results-spinner"></div>
          <p>搜索中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="search-results">
        <div className="search-results-error">
          <span className="search-results-error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="search-results">
        <div className="search-results-empty">
          <span className="search-results-empty-icon">🔍</span>
          <p>未找到匹配的用户</p>
          <span className="search-results-empty-hint">
            尝试搜索用户名或邮箱地址
          </span>
        </div>
      </div>
    );
  }

  // Results list
  return (
    <div className="search-results">
      <div className="search-results-header">
        <span className="search-results-count">
          找到 {results.length} 个用户
        </span>
      </div>
      <div className="search-results-list">
        {results.map((user) => (
          <UserCard
            key={user.userId}
            user={user}
            isContact={isContact(user.userId)}
            onAddContact={onAddContact}
            isAdding={addingUserId === user.userId}
          />
        ))}
      </div>
    </div>
  );
}
