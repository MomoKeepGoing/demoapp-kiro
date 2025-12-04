# ContactsPage Component

## Overview
The main component for contact management that integrates all contact-related functionality.

## Features Implemented

### 1. Component Integration
- **SearchBar**: Integrated with debounce handling (300ms)
- **SearchResults**: Displays search results with add contact functionality
- **ContactList**: Shows all user contacts with delete functionality
- **Toast**: Provides user feedback for all operations

### 2. State Management
```typescript
- searchQuery: string              // Current search input
- searchResults: UserProfile[]     // Search results
- contacts: Contact[]              // User's contact list
- isSearching: boolean             // Search loading state
- isLoadingContacts: boolean       // Contacts loading state
- searchError: string | null       // Search error message
- addingUserId: string | null      // Currently adding contact
- deletingContactId: string | null // Currently deleting contact
- toast: ToastState                // Toast notification state
```

### 3. Core Functionality

#### Search Users (Requirements 1.1-1.7)
- Searches by username or email
- Debounced input (300ms delay via SearchBar)
- Excludes current user from results
- Limits results to 20 users
- Handles empty/whitespace queries
- Marks existing contacts in results

#### Add Contact (Requirements 2.1-2.5)
- Validates user is not adding themselves
- Checks for duplicate contacts
- Creates contact relationship with timestamp
- Updates UI immediately (optimistic update)
- Shows success/error toast notifications
- Handles all error types (validation, business, system)

#### Delete Contact (Requirements 4.1-4.4)
- Shows confirmation dialog before deletion
- Deletes contact relationship
- Updates contact list immediately
- Shows success/error toast notifications
- Handles authorization and system errors

#### Load Contacts (Requirements 3.1-3.5)
- Loads on component mount
- Displays loading state
- Sorts by creation time (newest first)
- Shows empty state when no contacts
- Handles loading errors gracefully

### 4. Error Handling
All operations include comprehensive error handling:
- **Validation errors**: User-friendly messages (e.g., "不能添加自己为联系人")
- **Business errors**: Duplicate contact, contact not found
- **Authorization errors**: Permission denied messages
- **System errors**: Network failures, timeout errors

### 5. User Feedback
Toast notifications for all operations:
- ✅ Success: "已添加 [username] 为联系人"
- ✅ Success: "已删除联系人 [username]"
- ⚠️ Warning: "该用户已是您的联系人"
- ⚠️ Warning: "不能添加自己为联系人"
- ❌ Error: "添加联系人失败，请稍后重试"
- ❌ Error: "删除联系人失败，请稍后重试"

### 6. UI/UX Features
- **Responsive design**: Adapts to mobile and desktop
- **Loading states**: Visual feedback during operations
- **Empty states**: Helpful messages when no data
- **Confirmation dialogs**: Prevents accidental deletions
- **Smooth animations**: Fade-in transitions
- **WhatsApp-style design**: Consistent with app theme

## Requirements Coverage

### All Requirements Met:
- ✅ 1.1-1.7: User search functionality
- ✅ 2.1-2.5: Add contact functionality
- ✅ 3.1-3.5: Contact list management
- ✅ 4.1-4.4: Delete contact functionality
- ✅ 5.1-5.4: Data authorization (handled by API)
- ✅ 6.1-6.6: UI design and feedback
- ✅ 7.1-7.3: Search performance (debounce)

## Usage Example

```typescript
import { ContactsPage } from './components/contacts/ContactsPage';

function App() {
  return (
    <Authenticator>
      <ContactsPage />
    </Authenticator>
  );
}
```

## Testing
Basic unit tests included in `ContactsPage.test.tsx`:
- Renders page header correctly
- Loads contacts on mount
- Displays search bar
- Displays contact list section

## Files Created
1. `ContactsPage.tsx` - Main component (220 lines)
2. `ContactsPage.css` - Styling (150 lines)
3. `ContactsPage.test.tsx` - Unit tests (70 lines)
4. `ContactsPage.md` - Documentation (this file)

## Next Steps
To integrate into the main app:
1. Add route in `App.tsx`
2. Add navigation menu item
3. Test complete user flow
4. Run property-based tests (optional tasks)
