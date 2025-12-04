# Contacts Components

This directory contains the contact management feature components for LinkUp.

## Components

### SearchBar
**File**: `SearchBar.tsx`
**Status**: ✅ Completed (Task 4)

Search input component with debounce functionality.

**Features**:
- Search input with placeholder
- 300ms debounce delay
- Loading state indicator
- WhatsApp-style design
- Responsive layout

**Props**:
- `value: string` - Current search value
- `onChange: (value: string) => void` - Callback when search value changes
- `isSearching: boolean` - Loading state

**Requirements**: 1.1-1.7, 6.1, 6.3, 6.6, 7.2, 7.3

---

### UserCard
**File**: `UserCard.tsx`
**Status**: ✅ Completed (Task 5 - implemented with Task 6)

User card component for displaying user information in search results.

**Features**:
- Display user avatar, username, and email
- Add contact button
- "已添加" badge for existing contacts
- Loading state during add operation
- Responsive layout
- WhatsApp-style design

**Props**:
- `user: UserProfile` - User information to display
- `isContact: boolean` - Whether user is already a contact
- `onAddContact: (user: UserProfile) => void` - Callback when add button clicked
- `isAdding?: boolean` - Loading state during add operation

**Requirements**: 1.7, 2.1, 2.4, 6.2, 6.3

---

### SearchResults
**File**: `SearchResults.tsx`
**Status**: ✅ Completed (Task 6)

Search results list component that displays user search results.

**Features**:
- Display search results list
- Empty state message ("未找到匹配的用户")
- Loading state with spinner
- Error state display
- Integrates UserCard component
- Marks existing contacts automatically
- Result count display
- Scrollable list (max 400px)
- Responsive layout

**Props**:
- `results: UserProfile[]` - Array of search results
- `contacts: Contact[]` - Array of current user's contacts
- `onAddContact: (user: UserProfile) => void` - Callback when add button clicked
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message to display
- `addingUserId?: string | null` - ID of user currently being added

**Requirements**: 1.1-1.7, 6.2, 6.6

**States**:
1. **Loading**: Shows spinner and "搜索中..." message
2. **Error**: Shows error icon and error message
3. **Empty**: Shows search icon and "未找到匹配的用户" message
4. **Results**: Shows list of users with count header

---

### ContactCard
**File**: `ContactCard.tsx`
**Status**: ✅ Completed (Task 7)

Contact card component for displaying contact information in the contact list.

**Features**:
- Display contact avatar and username (real-time synced)
- Delete contact button
- Delete confirmation dialog with overlay
- Loading state during delete operation
- S3 avatar loading with signed URLs
- Avatar loading error handling
- WhatsApp-style design
- Responsive layout
- Smooth animations

**Props**:
- `contact: Contact` - Contact information to display
- `onDeleteContact: (contact: Contact) => void` - Callback when delete is confirmed
- `isDeleting?: boolean` - Loading state during delete operation

**Requirements**: 3.3, 4.1, 4.2, 6.2, 6.3

**Real-Time Profile Sync**:
- Automatically displays latest username from UserProfile
- Loads avatar from S3 with signed URLs
- Handles avatar path changes dynamically
- Falls back to initials if avatar unavailable

**Storage Permissions**:
- Configured in `amplify/storage/resource.ts`
- All authenticated users can read any profile picture
- Only file owners can write/delete their own avatars
- Enables contact avatar display while maintaining security

**Dialog Features**:
- Modal overlay with backdrop
- Confirmation message with contact name
- Cancel and Delete buttons
- Click outside to close
- Smooth fade-in and slide-up animations

---

### ContactList
**File**: `ContactList.tsx`
**Status**: ✅ Completed (Task 8)

Contact list component for displaying all user contacts.

**Features**:
- Display all contacts in a list with real-time profile data
- Contact count badge in header
- Empty state message ("暂无联系人")
- Loading state with spinner
- Integrates ContactCard component
- Sorted by creation time (newest first, handled by API)
- WhatsApp-style design
- Responsive layout

**Props**:
- `contacts: Contact[]` - Array of user's contacts (with latest profile data)
- `isLoading: boolean` - Loading state
- `onDeleteContact: (contact: Contact) => void` - Callback when delete is confirmed
- `deletingContactId?: string | null` - ID of contact currently being deleted

**Requirements**: 3.1-3.5, 6.2, 6.6

**Real-Time Profile Sync**:
- Contact data includes latest username and avatar from UserProfile
- Automatically reflects profile updates made by contacts
- Handled by `listContacts()` API function

**States**:
1. **Loading**: Shows spinner and "加载联系人..." message
2. **Empty**: Shows icon and "暂无联系人" message with helpful text
3. **List**: Shows header with count and list of contacts

---

## Styling

All components follow WhatsApp-inspired design principles:

- **Colors**:
  - Primary green: `#25d366`
  - Background: `#f0f2f5`
  - Text primary: `#111b21`
  - Text secondary: `#667781`
  - Border: `#e9edef`

- **Typography**:
  - Base font size: 0.875rem - 1rem
  - Font weight: 400 (normal), 500 (medium)

- **Spacing**:
  - Padding: 0.5rem - 1rem
  - Gap: 0.75rem - 1rem
  - Border radius: 8px (cards), 20px (buttons)

- **Responsive Breakpoints**:
  - Desktop: > 768px
  - Tablet: 481px - 768px
  - Mobile: ≤ 480px

---

## Testing

Each component has comprehensive unit tests:

- **SearchBar.test.tsx**: Tests debounce, loading state, input handling
- **UserCard.test.tsx**: Tests display, button states, click handling
- **SearchResults.test.tsx**: Tests all states (loading, error, empty, results)
- **ContactList.test.tsx**: Tests all states (loading, empty, list), contact count, delete state

Run tests:
```bash
npm test
```

---

## Usage Example

```tsx
import { SearchBar } from './components/contacts/SearchBar';
import { SearchResults } from './components/contacts/SearchResults';
import { searchUsers } from './utils/contactApi';

function ContactsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const users = await searchUsers(searchQuery, currentUserId);
      setResults(users);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (user: UserProfile) => {
    // Add contact logic
  };

  return (
    <div>
      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          handleSearch(value);
        }}
        isSearching={isSearching}
      />
      
      {query && (
        <SearchResults
          results={results}
          contacts={contacts}
          onAddContact={handleAddContact}
          isLoading={isSearching}
        />
      )}
    </div>
  );
}
```

---

### ContactsPage
**File**: `ContactsPage.tsx`
**Status**: ✅ Completed (Task 9)

Main integration component for contact management functionality.

**Props**:
- `onBack?: () => void` - Optional callback for back button navigation

**Features**:
- Integrates SearchBar, SearchResults, and ContactList components
- Complete state management for search, contacts, and UI states
- User search with debounce (300ms via SearchBar)
- Add contact with validation and error handling
- Delete contact with confirmation dialog
- Toast notifications for all operations
- Load contacts on mount
- Comprehensive error handling
- Built-in header with optional back button
- WhatsApp-style design
- Responsive layout

**State Management**:
- `searchQuery: string` - Current search input
- `searchResults: UserProfile[]` - Search results
- `contacts: Contact[]` - User's contact list
- `isSearching: boolean` - Search loading state
- `isLoadingContacts: boolean` - Contacts loading state
- `searchError: string | null` - Search error message
- `addingUserId: string | null` - Currently adding contact ID
- `deletingContactId: string | null` - Currently deleting contact ID
- `toast: ToastState` - Toast notification state

**Core Functions**:
- `loadContacts()` - Load user's contact list on mount
- `handleSearch(query)` - Search users with debounce
- `handleAddContact(user)` - Add user as contact with validation
- `handleDeleteContact(contact)` - Delete contact with confirmation
- `showToast(message, type)` - Display toast notification
- `hideToast()` - Hide toast notification

**Requirements**: All requirements (1.1-7.3)

**Error Handling**:
- Validation errors: "不能添加自己为联系人"
- Business errors: "该用户已是您的联系人"
- Authorization errors: Permission denied messages
- System errors: Network failures, timeout errors

**Toast Notifications**:
- Success: "已添加 [username] 为联系人"
- Success: "已删除联系人 [username]"
- Warning: "该用户已是您的联系人"
- Warning: "不能添加自己为联系人"
- Error: "添加联系人失败，请稍后重试"
- Error: "删除联系人失败，请稍后重试"
- Error: "加载联系人失败"

---

## Next Steps

Remaining tasks:
- [x] Task 8: ContactList component ✅
- [x] Task 9: ContactsPage main component ✅
- [ ] Task 10: Add routing to App.tsx
- [ ] Task 11: Styling and responsive design refinements (if needed)
