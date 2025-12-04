import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.id().required(),
      username: a.string().required(),
      avatarUrl: a.string(),
      email: a.email().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']), // Allow authenticated users to search
    ])
    .identifier(['userId']), // Use userId as the primary key to prevent duplicates
  
  Contact: a
    .model({
      userId: a.id().required(), // Current user ID (partition key)
      contactUserId: a.id().required(), // Contact user ID (sort key)
      contactUsername: a.string(), // Redundant storage for performance
      contactAvatarUrl: a.string(), // Redundant storage for performance
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(), // Only owner can access their contacts
    ])
    .identifier(['userId', 'contactUserId']), // Composite primary key
  
  Message: a
    .model({
      senderId: a.id().required(),
      receiverId: a.id().required(),
      conversationId: a.id().required(),
      content: a.string().required(),
      status: a.enum(['sending', 'sent', 'failed']),
      isRead: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // Sender can create, read and update their sent messages
      allow.ownerDefinedIn('senderId').to(['create', 'read', 'update']),
      // Receiver can read and update (mark as read) received messages
      allow.ownerDefinedIn('receiverId').to(['read', 'update']),
    ])
    .secondaryIndexes((index) => [
      index('senderId').sortKeys(['createdAt']).name('bySender'),
      index('receiverId').sortKeys(['createdAt']).name('byReceiver'),
      index('conversationId').sortKeys(['createdAt']).name('byConversation'),
    ]),
  
  Conversation: a
    .model({
      userId: a.id().required(),
      otherUserId: a.id().required(),
      otherUserName: a.string().required(),
      otherUserAvatar: a.string(),
      lastMessageContent: a.string().required(),
      lastMessageAt: a.datetime().required(),
      unreadCount: a.integer().default(0),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId').to(['create', 'read', 'update', 'delete']), // Full access to own conversations
    ])
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['lastMessageAt']).name('byUser'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
