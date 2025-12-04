// Contact API utility functions
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Type definitions
export interface UserProfile {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  email: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Contact {
  userId: string;
  contactUserId: string;
  contactUsername?: string | null;
  contactAvatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ContactError {
  type: 'VALIDATION' | 'AUTHORIZATION' | 'BUSINESS' | 'SYSTEM';
  message: string;
  originalError?: any;
}

// Error handling utility
function handleContactError(error: any, operation: string): ContactError {
  console.error(`Contact API Error (${operation}):`, error);

  // Check for GraphQL errors
  if (error.errors && Array.isArray(error.errors)) {
    const firstError = error.errors[0];
    
    if (firstError?.errorType === 'Unauthorized') {
      return {
        type: 'AUTHORIZATION',
        message: '您没有权限执行此操作',
        originalError: error,
      };
    }
    
    if (firstError?.errorType === 'ConditionalCheckFailedException') {
      if (operation === 'add') {
        return {
          type: 'BUSINESS',
          message: '该用户已是您的联系人',
          originalError: error,
        };
      } else if (operation === 'delete') {
        return {
          type: 'BUSINESS',
          message: '联系人不存在',
          originalError: error,
        };
      }
    }
    
    if (firstError?.errorType === 'ValidationException') {
      return {
        type: 'VALIDATION',
        message: '输入数据无效',
        originalError: error,
      };
    }
  }

  // Network or system errors
  if (error.message?.includes('Network') || error.message?.includes('network')) {
    return {
      type: 'SYSTEM',
      message: '网络连接失败，请检查网络',
      originalError: error,
    };
  }

  // Default error
  return {
    type: 'SYSTEM',
    message: '操作失败，请稍后重试',
    originalError: error,
  };
}

/**
 * Search users by username or email
 * 搜索用户（通过用户名或邮箱）
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * @param query - Search keyword
 * @param currentUserId - Current user's ID (to exclude from results)
 * @returns Array of matching users (max 20, excluding current user)
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<UserProfile[]> {
  try {
    // Validate input - empty or whitespace-only queries return empty results
    // Requirement 1.4: WHEN 搜索关键词为空或仅包含空白字符 THEN 联系人管理系统 SHALL 返回空结果列表
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();

    // Query UserProfile with filter for username or email containing the query
    // Requirements 1.1, 1.2, 1.3: Search by username or email
    const { data, errors } = await client.models.UserProfile.list({
      filter: {
        or: [
          { username: { contains: trimmedQuery } },
          { email: { contains: trimmedQuery } },
        ],
      },
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      return [];
    }

    // Filter out current user and limit to 20 results
    // Requirement 1.6: Exclude current user from results
    // Requirement 1.5: Limit to 20 results
    const filteredResults = data
      .filter((user) => user.userId !== currentUserId)
      .slice(0, 20)
      .map((user) => ({
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

    return filteredResults;
  } catch (error) {
    const contactError = handleContactError(error, 'search');
    throw contactError;
  }
}

/**
 * Create a contact relationship
 * 添加联系人
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 * 
 * @param userId - Current user's ID
 * @param targetUser - User to add as contact
 * @returns Created contact record
 */
export async function createContact(
  userId: string,
  targetUser: UserProfile
): Promise<Contact> {
  try {
    // Validate: Cannot add self as contact
    // Requirement 2.3: WHEN 用户尝试添加自己为联系人 THEN 联系人管理系统 SHALL 拒绝操作
    if (userId === targetUser.userId) {
      throw {
        type: 'VALIDATION',
        message: '不能添加自己为联系人',
      };
    }

    // Check if contact already exists
    // Requirement 2.2: WHEN 用户添加已存在的联系人 THEN 联系人管理系统 SHALL 拒绝操作
    const existingContact = await isContact(userId, targetUser.userId);
    if (existingContact) {
      throw {
        type: 'BUSINESS',
        message: '该用户已是您的联系人',
      };
    }

    // Create contact with timestamp
    // Requirement 2.1: Create contact relationship record
    // Requirement 2.5: Record creation timestamp
    const { data, errors } = await client.models.Contact.create({
      userId: userId,
      contactUserId: targetUser.userId,
      contactUsername: targetUser.username,
      contactAvatarUrl: targetUser.avatarUrl || null,
      createdAt: new Date().toISOString(),
    });

    if (errors) {
      throw { errors };
    }

    if (!data) {
      throw new Error('Failed to create contact');
    }

    return {
      userId: data.userId,
      contactUserId: data.contactUserId,
      contactUsername: data.contactUsername,
      contactAvatarUrl: data.contactAvatarUrl,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    // If error already has type and message, throw it directly
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      throw error;
    }
    const contactError = handleContactError(error, 'add');
    throw contactError;
  }
}

/**
 * List all contacts for a user with real-time profile data
 * 查询联系人列表（实时同步用户资料）
 * 
 * Requirements: 3.1, 3.3, 3.4
 * 
 * @param userId - Current user's ID
 * @returns Array of contacts sorted by creation time (descending) with latest profile data
 */
export async function listContacts(userId: string): Promise<Contact[]> {
  try {
    // Query contacts for the user
    // Requirement 3.1: Display all added contacts
    const { data, errors } = await client.models.Contact.list({
      filter: { userId: { eq: userId } },
    });

    if (errors) {
      throw { errors };
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch latest UserProfile data for all contacts to ensure real-time sync
    // This ensures we always show the latest username and avatar
    const contactUserIds = data.map(c => c.contactUserId);
    console.log('[listContacts] Found', data.length, 'contacts');
    console.log('[listContacts] Fetching profiles for userIds:', contactUserIds);
    
    const profilePromises = contactUserIds.map(async (contactUserId) => {
      try {
        const { data: profile } = await client.models.UserProfile.get({
          userId: contactUserId,
        });
        console.log('[listContacts] Profile for', contactUserId, ':', {
          username: profile?.username,
          avatarUrl: profile?.avatarUrl,
        });
        return profile;
      } catch (err) {
        console.error(`[listContacts] Error fetching profile for ${contactUserId}:`, err);
        return null;
      }
    });

    const profiles = await Promise.all(profilePromises);
    const profileMap = new Map(
      profiles
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map(p => [p.userId, p])
    );
    console.log('[listContacts] Created profile map with', profileMap.size, 'profiles');

    // Sort by creation time descending (newest first)
    // Requirement 3.4: Sort by creation time descending
    const sortedContacts = [...data].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // Map to Contact interface with latest profile data
    // Requirement 3.3: Include username and avatar (with real-time sync)
    return sortedContacts.map((contact) => {
      const latestProfile = profileMap.get(contact.contactUserId);
      return {
        userId: contact.userId,
        contactUserId: contact.contactUserId,
        // Use latest profile data if available, fallback to cached data
        contactUsername: latestProfile?.username ?? contact.contactUsername,
        contactAvatarUrl: latestProfile?.avatarUrl ?? contact.contactAvatarUrl,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      };
    });
  } catch (error) {
    const contactError = handleContactError(error, 'list');
    throw contactError;
  }
}

/**
 * Delete a contact relationship
 * 删除联系人
 * 
 * Requirements: 4.2, 4.3
 * 
 * @param userId - Current user's ID
 * @param contactUserId - Contact user's ID to delete
 */
export async function deleteContact(
  userId: string,
  contactUserId: string
): Promise<void> {
  try {
    // Delete contact using composite key
    // Requirement 4.2: Delete contact relationship record
    // Requirement 4.3: Remove from contact list
    const { errors } = await client.models.Contact.delete({
      userId: userId,
      contactUserId: contactUserId,
    });

    if (errors) {
      throw { errors };
    }
  } catch (error) {
    const contactError = handleContactError(error, 'delete');
    throw contactError;
  }
}

/**
 * Check if a user is already a contact
 * 检查是否已是联系人
 * 
 * Requirements: 1.7, 2.2
 * 
 * @param userId - Current user's ID
 * @param targetUserId - Target user's ID to check
 * @returns true if already a contact, false otherwise
 */
export async function isContact(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Query for specific contact using composite key
    const { data, errors } = await client.models.Contact.get({
      userId: userId,
      contactUserId: targetUserId,
    });

    if (errors) {
      // If error is "not found", return false
      const notFoundError = errors.find(
        (e: any) => e.errorType === 'NotFound' || e.message?.includes('not found')
      );
      if (notFoundError) {
        return false;
      }
      throw { errors };
    }

    return data !== null && data !== undefined;
  } catch (error) {
    // For "not found" errors, return false instead of throwing
    if (error && typeof error === 'object' && 'errors' in error) {
      const errors = (error as any).errors;
      if (Array.isArray(errors)) {
        const notFoundError = errors.find(
          (e: any) => e.errorType === 'NotFound' || e.message?.includes('not found')
        );
        if (notFoundError) {
          return false;
        }
      }
    }
    
    const contactError = handleContactError(error, 'check');
    throw contactError;
  }
}
