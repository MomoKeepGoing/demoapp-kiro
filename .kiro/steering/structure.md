---
inclusion: always
---

# Project Structure & Architecture Patterns

## Directory Organization

### Frontend (`src/`)
- `components/` - React components organized by feature
  - `contacts/` - Contact management UI (ContactsPage, ContactList, ContactCard, SearchBar, UserCard)
  - `messages/` - Messaging UI (MessagesPage, ConversationView, ConversationListItem, MessageBubble)
  - `layout/` - Layout components
  - Root level: Shared components (Profile, Toast, Loading)
- `utils/` - Business logic and API integrations
  - `contactApi.ts` - Contact CRUD operations
  - `messageApi.ts` - Message CRUD and subscriptions
  - `messageHelpers.ts` - Message formatting utilities
  - `authConfig.ts` - Cognito configuration
  - `imageCompression.ts` - Client-side image optimization
- `hooks/` - Custom React hooks
  - `useSubscription.ts` - GraphQL subscription management
  - `useToast.ts` - Toast notification hook
- `test/` - Test utilities (setup, helpers, generators)
- `styles/` - Shared CSS (buttons.css)

### Backend (`amplify/`)
- `auth/resource.ts` - Cognito user pool configuration
- `data/resource.ts` - GraphQL schema with models: UserProfile, Contact, Conversation, Message
- `storage/resource.ts` - S3 bucket with entity-based access control
- `backend.ts` - Amplify backend definition

## Code Organization Rules

### File Placement
- Place new components in feature-specific folders (`contacts/`, `messages/`)
- Co-locate component CSS files (e.g., `ContactCard.tsx` + `ContactCard.css`)
- Put shared utilities in `src/utils/`, not in component folders
- Test files go alongside source files with `.test.tsx` suffix

### Component Patterns
- Use React.lazy() for heavy components (Profile)
- Wrap lazy components with Suspense and Loading fallback
- Extract reusable logic into custom hooks in `src/hooks/`
- Keep components focused on UI, move business logic to `utils/`

### Styling Conventions
- Use CSS files, not inline styles or CSS-in-JS
- Follow WhatsApp-style design system (see product.md)
- Shared button styles in `src/styles/buttons.css`
- Component-specific styles co-located with components
- Use responsive design with mobile-first approach

## Data Architecture

### GraphQL Models
- **UserProfile**: `userId`, `username`, `avatarUrl`, `email`, `createdAt`, `updatedAt`
- **Contact**: `userId`, `contactUserId`, `contactUsername`, `contactAvatarUrl`, `createdAt`
- **Conversation**: `id`, `participant1Id`, `participant2Id`, `lastMessageAt`, `lastMessagePreview`
- **Message**: `id`, `conversationId`, `senderId`, `recipientId`, `content`, `createdAt`, `isRead`

### Authorization Patterns
- UserProfile: Owner-based (users access only their own profile)
- Contact: Owner-based (users manage their own contacts)
- Message: Custom rules (sender and recipient can read/write)
- Conversation: Custom rules (both participants can access)

### Storage Structure
- S3 path: `profile-pictures/{entity_id}/*`
- Access: Entity-based isolation (users access only their own uploads)
- Image optimization: Client-side compression before upload

## API Integration Patterns

### Data Fetching
- Use `client.models.ModelName.list()` for queries
- Use `client.models.ModelName.create()` for mutations
- Handle errors with try-catch and show Chinese error messages via toast

### Real-time Updates
- Use `useSubscription` hook for GraphQL subscriptions
- Subscribe to message creates/updates in ConversationView
- Subscribe to conversation updates in MessagesPage
- Clean up subscriptions in useEffect cleanup

### Error Handling
- Catch authorization errors and show user-friendly Chinese messages
- Validate input client-side before API calls
- Use toast notifications for non-blocking feedback
- Log technical errors to console for debugging

## Testing Conventions

### Test Organization
- Unit tests: Co-located with source files (`.test.tsx`)
- Test utilities: `src/test/helpers.ts`, `src/test/generators.ts`
- Property-based tests: Use fast-check generators from `generators.ts`
- Setup: Vitest config in `vitest.config.ts`, setup in `src/test/setup.ts`

### Testing Patterns
- Mock Amplify client in tests using `src/test/helpers.ts`
- Use Testing Library for component tests
- Use fast-check for property-based testing
- Test user interactions, not implementation details

## Documentation Locations
- Feature specs: `.kiro/specs/amplify-im-app/`
- Component docs: `src/components/README.md`, `src/components/*/README.md`
- Technical guides: `docs/` (AUTH-CONFIG.md, TESTING.md, PERFORMANCE.md, etc.)
- Deployment verification: `docs/MESSAGING-DEPLOYMENT-VERIFICATION.md`
