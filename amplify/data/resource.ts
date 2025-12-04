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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
