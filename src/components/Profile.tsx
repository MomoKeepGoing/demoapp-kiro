import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { Toast } from './Toast';
import type { ToastType } from './Toast';
import { Loading } from './Loading';
import { compressImage } from '../utils/imageCompression';
import './Profile.css';

const client = generateClient<Schema>();

interface UserProfile {
  userId: string;
  username: string;
  avatarUrl?: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Check if an error is an authorization error
 * Requirements 5.1-5.4: Detect authorization failures for friendly error messages
 */
const isAuthorizationError = (err: any): boolean => {
  // Check for GraphQL authorization errors
  if (err.errors) {
    return err.errors.some(
      (e: any) => e.errorType === 'Unauthorized' || e.errorType === 'UnauthorizedException'
    );
  }
  // Check for Storage authorization errors
  if (err.name === 'AccessDeniedException' || err.message?.includes('Access Denied')) {
    return true;
  }
  return false;
};

/**
 * Get user-friendly error message for authorization failures
 * Requirement 5.2: Provide friendly error messages for authorization failures
 */
const getAuthorizationErrorMessage = (context: 'profile' | 'storage'): string => {
  if (context === 'profile') {
    return '您没有权限访问或修改此资料。只能访问和修改自己的个人资料。';
  }
  return '您没有权限访问此文件。只能访问自己的头像文件。';
};

interface ToastMessage {
  message: string;
  type: ToastType;
}

interface ProfileProps {
  onProfileUpdate?: () => void;
  onSignOut?: () => void;
}

export function Profile({ onProfileUpdate, onSignOut }: ProfileProps = {}) {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get profile by userId (now the primary key)
      // Requirement 5.1: Users can only access their own profile
      const { data: existingProfile, errors } = await client.models.UserProfile.get({
        userId: user.userId,
      });

      // Requirement 5.1, 5.2: Check for authorization errors
      if (errors && errors.length > 0 && isAuthorizationError({ errors })) {
        setError(getAuthorizationErrorMessage('profile'));
        return;
      }

      if (existingProfile) {
        setProfile(existingProfile as UserProfile);
        setUsername(existingProfile.username || '');

        // Load avatar URL if exists
        // Requirement 5.3: Users can only access their own avatar files
        if (existingProfile.avatarUrl) {
          try {
            const urlResult = await getUrl({
              path: existingProfile.avatarUrl,
            });
            setAvatarPreview(urlResult.url.toString());
          } catch (err: any) {
            console.error('Error loading avatar:', err);
            // Requirement 5.3, 5.4: Check if it's an authorization error
            if (isAuthorizationError(err)) {
              setError(getAuthorizationErrorMessage('storage'));
            }
          }
        }
      } else {
        // Create new profile if doesn't exist
        const newProfile = await client.models.UserProfile.create({
          userId: user.userId,
          username: user.signInDetails?.loginId?.split('@')[0] || 'User',
          email: user.signInDetails?.loginId || '',
        });

        if (newProfile.data) {
          setProfile(newProfile.data as UserProfile);
          setUsername(newProfile.data.username || '');
        } else if (newProfile.errors && isAuthorizationError({ errors: newProfile.errors })) {
          setError('您没有权限创建个人资料。请联系管理员。');
          return;
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      // Requirement 5.2: Handle authorization errors with friendly messages
      if (isAuthorizationError(err)) {
        setError(getAuthorizationErrorMessage('profile'));
        return;
      }
      setError('加载个人资料失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (name: string): string | null => {
    // Requirement 3.4: Empty or whitespace-only usernames should be rejected
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return '用户名不能为空或仅包含空白字符';
    }
    if (trimmed.length > 50) {
      return '用户名长度不能超过50个字符';
    }
    return null;
  };

  const validateAvatarFile = (file: File): string | null => {
    // Requirement 3.5: File size limit of 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return '文件大小不能超过5MB';
    }

    // Requirement 3.6: Only image files are allowed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '仅支持JPG、PNG、GIF和WebP格式的图片';
    }

    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError(null);
  };

  const handleSaveUsername = async () => {
    if (!profile) return;

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      setToast(null);

      // Requirement 3.2: Update username
      // Requirement 5.1: Users can only modify their own profile
      const result = await client.models.UserProfile.update({
        userId: profile.userId,
        username: username.trim(),
      });

      // Requirement 5.1, 5.2: Check for authorization errors in response
      if (result.errors && result.errors.length > 0) {
        if (isAuthorizationError({ errors: result.errors })) {
          setError(getAuthorizationErrorMessage('profile'));
          return;
        }
        // Other errors
        setError('更新用户名失败，请重试');
        return;
      }

      if (result.data) {
        setProfile(result.data as UserProfile);
        setIsEditing(false);
        setToast({ message: '用户名更新成功！', type: 'success' });
        // Notify parent component to refresh
        onProfileUpdate?.();
      }
    } catch (err: any) {
      console.error('Error updating username:', err);
      // Requirement 5.2: Handle authorization errors with friendly messages
      if (isAuthorizationError(err)) {
        setError(getAuthorizationErrorMessage('profile'));
        return;
      }
      setError('更新用户名失败，请重试');
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    setError(null);

    try {
      // Compress image before setting it
      // Performance optimization: Reduce file size before upload
      const compressedFile = await compressImage(file);
      setAvatarFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error processing image:', err);
      // If compression fails, use original file
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !profile) return;

    try {
      setIsUploading(true);
      setError(null);
      setToast(null);
      setUploadProgress(0);

      // Get identity ID for storage path
      const session = await fetchAuthSession();
      const identityId = session.identityId;

      if (!identityId) {
        throw new Error('无法获取用户身份信息');
      }

      // Requirement 3.3: Upload avatar to S3
      // Requirement 5.3: Users can only upload to their own storage path
      const fileName = `avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const path = `profile-pictures/${identityId}/${fileName}`;

      try {
        await uploadData({
          path,
          data: avatarFile,
          options: {
            contentType: avatarFile.type,
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                const progress = Math.round((transferredBytes / totalBytes) * 100);
                setUploadProgress(progress);
              }
            },
          },
        }).result;
      } catch (uploadErr: any) {
        console.error('Storage upload error:', uploadErr);
        // Requirement 5.3, 5.4: Handle storage authorization errors
        if (isAuthorizationError(uploadErr)) {
          setError(getAuthorizationErrorMessage('storage'));
          return;
        }
        throw uploadErr;
      }

      // Update profile with new avatar URL
      // Requirement 5.1: Users can only modify their own profile
      const updateResult = await client.models.UserProfile.update({
        userId: profile.userId,
        avatarUrl: path,
      });

      // Requirement 5.1, 5.2: Check for authorization errors in response
      if (updateResult.errors && updateResult.errors.length > 0) {
        if (isAuthorizationError({ errors: updateResult.errors })) {
          setError(getAuthorizationErrorMessage('profile'));
          return;
        }
        setError('更新头像信息失败，请重试');
        return;
      }

      if (updateResult.data) {
        setProfile(updateResult.data as UserProfile);
        setAvatarFile(null);
        setToast({ message: '头像上传成功！', type: 'success' });
        // Notify parent component to refresh
        onProfileUpdate?.();

        // Load the new avatar URL
        try {
          const urlResult = await getUrl({ path });
          setAvatarPreview(urlResult.url.toString());
        } catch (urlErr: any) {
          console.error('Error getting avatar URL:', urlErr);
          // Requirement 5.3, 5.4: Handle storage access errors
          if (isAuthorizationError(urlErr)) {
            setError(getAuthorizationErrorMessage('storage'));
          }
        }
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      // Requirement 5.2: Handle authorization errors with friendly messages
      if (isAuthorizationError(err)) {
        // Determine if it's a profile or storage error based on error type
        const context = err.errors ? 'profile' : 'storage';
        setError(getAuthorizationErrorMessage(context));
        return;
      }
      setError('上传头像失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <Loading text="加载个人资料中..." />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="error-message" role="alert">
            无法加载个人资料
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="profile-container">
        <div className="profile-card">
          <h2 className="profile-title">个人资料</h2>

          {/* Error message */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

        {/* Avatar section */}
        <div className="avatar-section">
          <div className="avatar-container">
            {avatarPreview ? (
              <img src={avatarPreview} alt="用户头像" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="avatar-upload">
            <input
              type="file"
              id="avatar-input"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarFileChange}
              className="file-input"
              disabled={isUploading}
            />
            <label htmlFor="avatar-input" className="file-label">
              选择头像
            </label>

            {avatarFile && (
              <div className="upload-actions">
                <button
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                  className="upload-button"
                >
                  {isUploading ? `上传中 ${uploadProgress}%` : '上传头像'}
                </button>
                {isUploading && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Username section */}
        <div className="profile-field">
          <label className="field-label">用户名</label>
          {isEditing ? (
            <div className="edit-field">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="field-input"
                placeholder="请输入用户名"
                maxLength={50}
              />
              <div className="edit-actions">
                <button onClick={handleSaveUsername} className="save-button">
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(profile.username);
                    setError(null);
                  }}
                  className="cancel-button"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="view-field">
              <span className="field-value">{profile.username}</span>
              <button onClick={() => setIsEditing(true)} className="edit-button">
                编辑
              </button>
            </div>
          )}
        </div>

        {/* Email section (read-only) */}
        <div className="profile-field">
          <label className="field-label">邮箱地址</label>
          <div className="view-field">
            <span className="field-value">{profile.email}</span>
          </div>
        </div>

        {/* User ID section (read-only) */}
        <div className="profile-field">
          <label className="field-label">用户ID</label>
          <div className="view-field">
            <span className="field-value field-value-small">{profile.userId}</span>
          </div>
        </div>

        {/* Sign out section */}
        <div className="profile-actions">
          <button 
            onClick={onSignOut || signOut} 
            className="sign-out-button-profile"
          >
            <span className="sign-out-icon">⎋</span>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
