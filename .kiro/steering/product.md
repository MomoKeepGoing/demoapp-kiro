---
inclusion: always
---

# Product Overview

**LinkUp (联络)** is a WhatsApp-style instant messaging application built on AWS Amplify Gen2.

## Core Product Principles

### Design Language
- Follow WhatsApp's visual design patterns (colors, spacing, interactions)
- Maintain clean, minimal interface with focus on messaging
- Use familiar messaging app conventions (chat bubbles, timestamps, read receipts)

### User Experience
- Prioritize real-time responsiveness and instant feedback
- Show loading states and progress indicators for all async operations
- Use toast notifications for non-blocking feedback
- Handle offline scenarios gracefully

### Localization
- **Primary Language**: Chinese (Simplified)
- All user-facing text MUST be in Chinese: UI labels, buttons, error messages, placeholders, notifications
- Code comments and technical documentation can be in English
- When generating new UI text, always use Chinese unless explicitly told otherwise

## Feature Status

### Production Features
- Email/password authentication with verification codes
- User profile management (username, avatar upload)
- Contact management (add/remove contacts, search users)
- One-on-one messaging with real-time updates
- Message history and conversation list
- Avatar display with S3 storage integration
- Responsive design (mobile-first)

### Known Limitations
- Group chat not yet implemented
- No message read receipts
- No typing indicators
- No file/media sharing beyond avatars
- No message search functionality

## Product Conventions

### Messaging Behavior
- Messages sync in real-time via GraphQL subscriptions
- Conversations auto-create when first message is sent
- Support messaging non-contacts (any registered user)
- Display user info even for non-contacts in conversations

### Data Ownership
- Users own their profile data (owner-based authorization)
- Messages are accessible to both sender and recipient
- Contacts are bidirectional (both users must add each other)

### Error Handling Philosophy
- Show user-friendly Chinese error messages
- Never expose technical details to end users
- Provide actionable guidance when errors occur
- Log technical details to console for debugging
