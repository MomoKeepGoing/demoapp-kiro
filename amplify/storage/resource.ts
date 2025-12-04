import { defineStorage } from '@aws-amplify/backend';

/**
 * Define and configure storage resource for user profile pictures
 * @see https://docs.amplify.aws/gen2/build-a-backend/storage
 * 
 * Access rules:
 * - Users can read, write, and delete their own profile pictures
 * - Files are stored under profile-pictures/{entity_id}/* path
 * - Entity-based access control ensures users can only access their own files
 * 
 * Requirements:
 * - 3.3: WHEN 用户上传新头像 THEN 用户管理系统 SHALL 存储头像文件并更新用户资料
 * - 5.3: WHEN 用户上传头像 THEN 用户管理系统 SHALL 仅允许用户访问自己的头像文件
 * - 5.4: WHEN 用户尝试访问其他用户的头像 THEN 用户管理系统 SHALL 根据文件访问权限控制访问
 */
export const storage = defineStorage({
  name: 'userProfileStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
