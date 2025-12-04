# 联系人头像显示功能

**日期**: 2024-12-04
**功能**: 联系人列表实时显示对方头像

## 功能概述

联系人列表现在能够：
1. **实时显示联系人的头像**：从UserProfile获取最新的头像URL
2. **自动同步头像更新**：当联系人更新头像时，列表会显示最新头像
3. **支持S3存储的头像**：自动获取S3签名URL并显示
4. **优雅降级**：头像加载失败时显示默认头像

## 实现细节

### 1. 数据流

```
用户访问联系人列表
    ↓
listContacts() 查询Contact表
    ↓
并行查询所有联系人的UserProfile
    ↓
获取最新的username和avatarUrl
    ↓
ContactCard组件接收contact数据
    ↓
useEffect检测avatarUrl
    ↓
如果是S3路径 → 调用getUrl获取签名URL
如果是直接URL → 直接使用
    ↓
显示头像（或默认头像）
```

### 2. ContactCard组件头像加载逻辑

**文件**: `src/components/contacts/ContactCard.tsx`

```typescript
useEffect(() => {
  let isMounted = true;

  const loadAvatar = async () => {
    // 重置状态
    setAvatarUrl(null);
    setAvatarError(false);
    
    if (!contact.contactAvatarUrl) {
      return; // 使用默认头像
    }

    try {
      if (contact.contactAvatarUrl.startsWith('profile-pictures/')) {
        // S3路径：获取签名URL
        const result = await getUrl({ path: contact.contactAvatarUrl });
        if (isMounted) {
          setAvatarUrl(result.url.toString());
        }
      } else {
        // 直接URL
        if (isMounted) {
          setAvatarUrl(contact.contactAvatarUrl);
        }
      }
    } catch (err) {
      console.error('Error loading contact avatar:', err);
      if (isMounted) {
        setAvatarError(true); // 使用默认头像
      }
    }
  };

  loadAvatar();

  return () => {
    isMounted = false;
  };
}, [contact.contactUserId, contact.contactAvatarUrl]);
```

**关键点**:
- 依赖 `contact.contactUserId` 和 `contact.contactAvatarUrl`
- 当联系人或头像URL变化时重新加载
- 使用 `isMounted` 标志防止内存泄漏
- 错误处理：加载失败时使用默认头像

### 3. 头像显示逻辑

```typescript
const defaultAvatar = 'https://ui-avatars.com/api/?name=' + 
  encodeURIComponent(contact.contactUsername ?? '');

const displayAvatar = avatarError 
  ? defaultAvatar 
  : (avatarUrl || defaultAvatar);

<img 
  src={displayAvatar} 
  alt={contact.contactUsername ?? ''}
  className="contact-card-avatar"
  onError={(e) => {
    (e.target as HTMLImageElement).src = defaultAvatar;
    setAvatarError(true);
  }}
/>
```

**优先级**:
1. 如果有错误 → 使用默认头像
2. 如果有avatarUrl → 使用avatarUrl
3. 否则 → 使用默认头像

**默认头像**:
- 使用 `ui-avatars.com` API
- 基于用户名生成彩色头像
- 格式：`https://ui-avatars.com/api/?name=用户名`

### 4. listContacts函数增强

**文件**: `src/utils/contactApi.ts`

```typescript
export async function listContacts(userId: string): Promise<Contact[]> {
  // 1. 查询Contact表
  const { data } = await client.models.Contact.list({
    filter: { userId: { eq: userId } },
  });

  // 2. 并行查询所有联系人的UserProfile
  const contactUserIds = data.map(c => c.contactUserId);
  const profilePromises = contactUserIds.map(async (contactUserId) => {
    const { data: profile } = await client.models.UserProfile.get({
      userId: contactUserId,
    });
    return profile;
  });
  const profiles = await Promise.all(profilePromises);

  // 3. 创建userId到profile的映射
  const profileMap = new Map(
    profiles
      .filter(p => p !== null)
      .map(p => [p.userId, p])
  );

  // 4. 合并数据：优先使用最新profile
  return sortedContacts.map((contact) => {
    const latestProfile = profileMap.get(contact.contactUserId);
    return {
      userId: contact.userId,
      contactUserId: contact.contactUserId,
      contactUsername: latestProfile?.username ?? contact.contactUsername,
      contactAvatarUrl: latestProfile?.avatarUrl ?? contact.contactAvatarUrl,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  });
}
```

## 头像存储格式

### UserProfile中的avatarUrl格式

1. **S3路径格式**:
   ```
   profile-pictures/{identityId}/{filename}
   ```
   例如：`profile-pictures/us-east-1:abc-123/avatar-1234567890.jpg`

2. **直接URL格式**:
   ```
   https://...
   ```
   或
   ```
   data:image/...
   ```

### 头像上传流程（Profile组件）

```typescript
// 1. 上传到S3
const path = `profile-pictures/${identityId}/${fileName}`;
await uploadData({ path, data: avatarFile }).result;

// 2. 更新UserProfile
await client.models.UserProfile.update({
  userId: profile.userId,
  avatarUrl: path, // 存储S3路径
});
```

## CSS样式

**文件**: `src/components/contacts/ContactCard.css`

```css
.contact-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background-color: #dfe5e7;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.contact-card:hover .contact-card-avatar {
  transform: scale(1.05);
}
```

**响应式设计**:
- 桌面端：48px × 48px
- 平板端：44px × 44px
- 手机端：40px × 40px

## 错误处理

### 1. S3签名URL获取失败
```typescript
try {
  const result = await getUrl({ path: contact.contactAvatarUrl });
  setAvatarUrl(result.url.toString());
} catch (err) {
  console.error('Error loading contact avatar:', err);
  setAvatarError(true); // 使用默认头像
}
```

### 2. 图片加载失败
```typescript
<img 
  onError={(e) => {
    (e.target as HTMLImageElement).src = defaultAvatar;
    setAvatarError(true);
  }}
/>
```

### 3. UserProfile查询失败
```typescript
const profilePromises = contactUserIds.map(async (contactUserId) => {
  try {
    const { data: profile } = await client.models.UserProfile.get({
      userId: contactUserId,
    });
    return profile;
  } catch (err) {
    console.error(`Error fetching profile for ${contactUserId}:`, err);
    return null; // 回退到缓存数据
  }
});
```

## 性能优化

### 1. 并行查询
- 使用 `Promise.all` 并行获取所有UserProfile
- 总延迟 ≈ 单次查询延迟

### 2. 懒加载头像
- 头像在组件挂载后异步加载
- 不阻塞列表渲染

### 3. 内存泄漏防护
```typescript
useEffect(() => {
  let isMounted = true;
  
  // ... 异步操作
  
  if (isMounted) {
    setAvatarUrl(...);
  }
  
  return () => {
    isMounted = false;
  };
}, [dependencies]);
```

### 4. 缓存回退
- 如果UserProfile查询失败，使用Contact表中的缓存数据
- 确保即使网络问题也能显示头像

## 测试验证

### 单元测试
```bash
✓ src/components/contacts/ContactCard.test.tsx (6 tests)
✓ src/components/contacts/ContactList.test.tsx (5 tests)
✓ src/components/contacts/ContactsPage.test.tsx (4 tests)

Test Files: 7 passed (7)
Tests: 40 passed (40)
```

### 手动测试场景

**场景1: 显示有头像的联系人**
1. 用户A上传头像
2. 用户B添加用户A为联系人
3. ✅ 用户B的联系人列表应显示用户A的头像

**场景2: 显示无头像的联系人**
1. 用户A没有上传头像
2. 用户B添加用户A为联系人
3. ✅ 用户B的联系人列表应显示默认头像（基于用户名）

**场景3: 头像更新同步**
1. 用户A上传头像
2. 用户B添加用户A为联系人
3. 用户A更新头像
4. 用户B刷新联系人列表
5. ✅ 应显示用户A的新头像

**场景4: 头像加载失败**
1. 用户A的头像URL无效或S3访问失败
2. 用户B查看联系人列表
3. ✅ 应显示默认头像，不应崩溃

## 授权验证

### UserProfile读取权限
```typescript
UserProfile: a.model({...})
  .authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read']), // ✅ 允许读取
  ])
```

### Storage访问权限
```typescript
// amplify/storage/resource.ts
export const storage = defineStorage({
  name: 'userProfileStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']), // ✅ 允许所有已认证用户读取头像
    ],
  }),
});
```

**访问控制说明**:
- **Entity-based (identity)**: 用户只能写入和删除自己的头像文件
- **Authenticated read**: 所有已认证用户可以读取任何头像（用于联系人列表显示）
- **路径格式**: `profile-pictures/{entity_id}/*` 其中 `{entity_id}` 是用户的 Cognito Identity ID

**验证**:
- ✅ 已认证用户可以读取其他用户的UserProfile
- ✅ 已认证用户可以通过getUrl获取其他用户的头像签名URL
- ✅ Storage配置允许所有已认证用户读取profile-pictures路径
- ✅ 用户只能修改和删除自己的头像文件（entity-based控制）

## 已知限制

### 1. 性能影响
- 每次加载联系人列表时需要额外查询N个UserProfile
- 对于有大量联系人的用户，可能增加加载时间

### 2. 缓存策略
- 当前没有客户端缓存
- 每次访问联系人页面都会重新查询

### 3. 实时更新
- 不支持WebSocket实时推送
- 需要刷新页面才能看到最新头像

## 未来改进

### 1. 客户端缓存
```typescript
// 使用React Query或SWR
const { data: contacts } = useQuery(
  ['contacts', userId],
  () => listContacts(userId),
  {
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  }
);
```

### 2. 批量查询API
```typescript
// 创建批量获取UserProfile的API
async function batchGetUserProfiles(userIds: string[]): Promise<UserProfile[]> {
  // 单次API调用获取多个UserProfile
}
```

### 3. WebSocket订阅
```typescript
// 订阅联系人的资料更新
const subscription = client.models.UserProfile.onUpdate({
  filter: { userId: { in: contactUserIds } }
}).subscribe({
  next: (data) => {
    // 实时更新头像
    updateContactAvatar(data.userId, data.avatarUrl);
  }
});
```

### 4. 图片预加载
```typescript
// 预加载下一批联系人的头像
const preloadAvatars = (contacts: Contact[]) => {
  contacts.forEach(contact => {
    if (contact.contactAvatarUrl) {
      const img = new Image();
      img.src = contact.contactAvatarUrl;
    }
  });
};
```

### 5. CDN缓存
- 配置CloudFront CDN缓存头像
- 减少S3访问次数
- 提高加载速度

## 相关文档

- `docs/CONTACT-SYNC-ENHANCEMENT.md` - 联系人实时同步功能
- `.kiro/specs/contact-management/design.md` - 设计文档
- `CHECKPOINT-12-VERIFICATION.md` - 检查点验证报告

## 总结

联系人列表现在能够：
- ✅ 实时显示联系人的最新头像
- ✅ 支持S3存储的头像（自动获取签名URL）
- ✅ 优雅降级（加载失败时显示默认头像）
- ✅ 自动同步头像更新
- ✅ 良好的错误处理
- ✅ 所有测试通过

用户体验得到显著提升，联系人列表更加直观和美观！
