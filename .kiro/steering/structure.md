# Project Structure

## Frontend (`src/`)
```
src/
├── components/          # React components
│   ├── Profile.tsx     # User profile management
│   ├── Toast.tsx       # Notification system
│   ├── Loading.tsx     # Loading indicator
│   └── README.md       # Component documentation
├── utils/              # Utility functions
│   ├── authConfig.ts   # Auth configuration
│   └── imageCompression.ts  # Image optimization
├── test/               # Test utilities and tests
│   ├── setup.ts        # Vitest setup
│   ├── helpers.ts      # Test helpers
│   ├── generators.ts   # Property-based test generators
│   └── *.test.ts       # Test files
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── *.css               # Component and global styles
```

## Backend (`amplify/`)
```
amplify/
├── auth/               # Cognito authentication
│   └── resource.ts     # Auth configuration
├── data/               # GraphQL API + DynamoDB
│   └── resource.ts     # Data schema (UserProfile model)
├── storage/            # S3 file storage
│   └── resource.ts     # Storage configuration
└── backend.ts          # Backend integration
```

## Key Patterns

### Data Model
- **UserProfile**: `userId`, `username`, `avatarUrl`, `email`, `createdAt`, `updatedAt`
- Authorization: Owner-based (users can only access their own data)

### Storage Structure
- Path: `profile-pictures/{entity_id}/*`
- Access: Entity-based (identity-level isolation)

### Component Organization
- Lazy load heavy components (Profile)
- Co-locate styles with components (`.css` files)
- Separate concerns: components, utils, tests

### Error Handling
- Authorization errors: Friendly Chinese messages
- Validation: Client-side before API calls
- Toast notifications for user feedback

## Documentation
- Spec files: `.kiro/specs/amplify-im-app/`
- Component docs: `src/components/README.md`
- Performance notes: `docs/PERFORMANCE.md`
- Testing guide: `docs/TESTING.md`
