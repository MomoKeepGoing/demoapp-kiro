# Messages Components

This directory contains components for the messaging feature of LinkUp.

## Components

### MessageBubble

Displays a single message in a chat conversation with WhatsApp-style design.

**Features:**
- Multi-line text support
- Timestamp display
- Message status indicators (sending/sent/failed)
- Different styles for sent vs received messages
- Retry functionality for failed messages

**Usage:**
```tsx
import { MessageBubble } from './components/messages/MessageBubble';

<MessageBubble
  message={{
    id: 'msg-1',
    content: '你好！',
    createdAt: '2024-12-04T10:30:00Z',
    status: 'sent',
    senderId: 'user-123'
  }}
  currentUserId="user-123"
  showTimestamp={true}
  onRetry={(messageId) => console.log('Retry:', messageId)}
/>
```

### ConversationListItem

Displays a single conversation in the conversation list with WhatsApp-style design.

**Features:**
- Display other user's avatar (with Storage API integration)
- Display other user's name
- Display last message preview (truncated to 100 characters)
- Display last message time (formatted)
- Display unread message count badge
- Click interaction support
- Keyboard navigation (Enter/Space)

**Usage:**
```tsx
import { ConversationListItem } from './components/messages/ConversationListItem';

<ConversationListItem
  conversation={{
    id: 'conv-1',
    otherUserId: 'user-456',
    otherUserName: '张三',
    otherUserAvatar: 'profile-pictures/456/avatar.jpg',
    lastMessageContent: '你好，最近怎么样？',
    lastMessageAt: '2024-12-04T10:30:00Z',
    unreadCount: 3
  }}
  onClick={() => console.log('Open conversation')}
/>
```

### ConversationView

Displays a one-on-one chat conversation with WhatsApp-style design.

**Features:**
- Conversation header with user info (name and avatar)
- Message list using MessageBubble components
- Auto-scroll to latest message
- Infinite scroll for loading message history
- Fixed bottom input box
- Send button (Enter to send, Shift+Enter for newline)
- Auto-adjusting input height (max 4 lines)
- Real-time message subscription
- Auto-mark as read when viewing conversation
- Loading and empty states
- Optimistic updates for sent messages
- Retry functionality for failed messages

**Usage:**
```tsx
import { ConversationView } from './components/messages/ConversationView';

<ConversationView
  conversationId="user-123_user-456"
  otherUserId="user-456"
  otherUserName="张三"
  otherUserAvatar="profile-pictures/456/avatar.jpg"
  currentUserId="user-123"
  onBack={() => console.log('Back to conversation list')}
/>
```

**Key Behaviors:**
- **Auto-scroll**: Automatically scrolls to the bottom when new messages arrive
- **Infinite scroll**: Load more messages by scrolling to the top
- **Optimistic updates**: Messages appear immediately when sent, then update with server response
- **Auto-read**: Messages are automatically marked as read when viewing the conversation
- **Keyboard shortcuts**: Enter to send, Shift+Enter for newline
- **Input height**: Textarea automatically adjusts height up to 4 lines

## Styling

All components follow WhatsApp-inspired design principles:
- Green bubbles for sent messages (#dcf8c6)
- White bubbles for received messages
- Subtle shadows and rounded corners
- Responsive design for mobile devices
- Accessibility support (high contrast, reduced motion)
- Dark mode support (optional)

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader support
- High contrast mode support
- Reduced motion support
