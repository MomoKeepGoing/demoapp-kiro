# Technology Stack

## Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Library**: AWS Amplify UI React
- **Styling**: CSS (custom WhatsApp-style design system)
- **Testing**: Vitest + Testing Library + fast-check (property-based testing)

## Backend (AWS Amplify Gen2)
- **Authentication**: Amazon Cognito (email/password with verification codes)
- **Data**: AWS AppSync + DynamoDB (GraphQL API)
- **Storage**: Amazon S3 (user avatars with entity-based access control)

## Key Libraries
- `aws-amplify`: AWS services integration
- `@aws-amplify/ui-react`: Pre-built auth UI components
- `browser-image-compression`: Client-side image optimization
- `fast-check`: Property-based testing framework

## Common Commands

### Development
```bash
# Start Amplify sandbox (backend)
npx ampx sandbox

# Start dev server (run in separate terminal)
npm run dev
```

### Testing
```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
npm run test:coverage # With coverage
```

### Build & Deploy
```bash
npm run build    # TypeScript compilation + Vite build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Code Splitting
- Vendor chunks: `react-vendor`, `amplify-vendor`
- Lazy loading: Profile component uses React.lazy()
- Chunk size limit: 1000KB

## Performance Optimizations
- Image compression before upload (browser-image-compression)
- Code splitting with manual chunks
- Lazy component loading with Suspense
