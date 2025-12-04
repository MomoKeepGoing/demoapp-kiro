import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * Backend configuration for the user management application
 * 
 * This file integrates all backend resources:
 * - Auth: User authentication with email/password and verification codes
 * - Data: GraphQL API with DynamoDB for user profiles
 * - Storage: S3 storage for user profile pictures
 * 
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 * 
 * Requirements: Foundation for all requirements (1.1-5.4)
 */
defineBackend({
  auth,
  data,
  storage,
});
