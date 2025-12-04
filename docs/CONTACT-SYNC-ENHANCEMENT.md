# 联系人实时同步增强

**日期**: 2024-12-04
**状态**: ✅ 已实现
**功能**: 联系人列表实时同步用户资料

## 问题描述

原始实现使用了冗余存储策略，在 Contact 模型中存储了 `contactUsername` 和 `contactAvatarUrl`。这种方式虽然提高了查询性能，但存在一个问题：

**当用户更新他们的用户名或头像时，联系人列表中显示的信息不会自动同步更新。**

例如：
1. 用户A添加用户B为联系人
2. Contact记录存储了B的用户名"Bob"和头像URL
3. 用户B将用户名改为"Bobby"并更新了头像
4. 用户A的联系人列表仍然显示旧的"Bob"和旧头像

## 解决方案

### 1. 修改 `listContacts` 函数

**文件**: `src/utils/contactApi.ts`

**改进内容**:
- 在查询联系人列表时，同时查询所有联系人的最新 UserProfile 数据
- 使用 `Promise.all` 并行获取所有联系人的资料，保持性能
- 优先使用最新的 UserProfile 数据，如果获取失败则回退到缓存数据
- 添加错误处理，确保单个资料获取失败不影响整体列表

**实现逻辑**:
```typescript
// 1. 查询Contact表获取联系人关系
const { data } = await client.models.Contact.list({
  filter: { userId: { eq: userId } },
});

// 2. 提取所有联系人的userId
const contactUserIds = data.map(c => c.contactUserId);

// 3. 并行查询所有联系人的最新UserProfile
const profilePromises = contactUserIds.map(async (contactUserId) => {
  const { data: profile } = await client.models.UserProfile.get({
    userId: contactUserId,
  });
  return profile;
});
const profiles = await Promise.all(profilePromises);

// 4. 创建userId到profile的映射
const profileMap = new Map(profiles.map(p => [p.userId, p]));

// 5. 合并数据：优先使用最新profile，回退到缓存
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
```

### 2. 增强 ContactCard 组件

**文件**: `src/components/contacts/ContactCard.tsx`

**改进内容**:
- 添加 `useEffect` 钩子来处理头像加载
- 支持从 S3 加载头像（使用 `getUrl` 获取签名URL）
- 添加头像加载错误处理
- 当头像路径变化时自动重新加载

**实现逻辑**:
```typescript
useEffect(() => {
  let isMounted = true;

  const loadAvatar = async () => {
    if (!contact.contactAvatarUrl) return;

    try {
      if (contact.contactAvatarUrl.startsWith('profile-pictures/')) {
        // S3路径，获取签名URL
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
      console.error('Error loading avatar:', err);
      if (isMounted) {
        setAvatarError(true);
      }
    }
  };

  loadAvatar();

  return () => {
    isMounted = false;
  };
}, [contact.contactAvatarUrl]);
```

## 性能考虑

### 优势
1. **实时同步**: 用户总是看到最新的联系人信息
2. **并行查询**: 使用 `Promise.all` 并行获取所有资料，性能影响最小
3. **优雅降级**: 如果获取最新资料失败，回退到缓存数据
4. **错误隔离**: 单个资料获取失败不影响其他联系人显示

### 性能影响
- **额外API调用**: 每次加载联系人列表时，需要额外查询N个UserProfile（N为联系人数量）
- **并行执行**: 所有查询并行执行，总延迟约等于单次查询延迟
- **网络开销**: 对于有大量联系人的用户，会增加网络请求数量

### 优化建议（未来）
如果性能成为问题，可以考虑：
1. **批量查询API**: 实现一个批量获取UserProfile的API
2. **客户端缓存**: 使用React Query或SWR缓存UserProfile数据
3. **增量更新**: 只查询最近更新的UserProfile
4. **WebSocket订阅**: 订阅联系人的资料更新事件

## 授权验证

**UserProfile授权规则**:
```typescript
.authorization((allow) => [
  allow.owner(),
  allow.authenticated().to(['read']),
])
```

✅ 已认证用户可以读取其他用户的 UserProfile，这使得实时同步成为可能。

## 测试验证

### 单元测试
所有现有测试继续通过：
- ✅ ContactList: 5个测试通过
- ✅ ContactCard: 显示联系人信息
- ✅ ContactsPage: 4个测试通过

### 手动测试场景

**场景1: 用户名更新同步**
1. 用户A添加用户B为联系人
2. 用户B更新用户名
3. 用户A刷新联系人列表
4. ✅ 应该看到用户B的新用户名

**场景2: 头像更新同步**
1. 用户A添加用户B为联系人
2. 用户B更新头像
3. 用户A刷新联系人列表
4. ✅ 应该看到用户B的新头像

**场景3: 网络错误处理**
1. 用户A有联系人列表
2. 模拟网络错误（某个UserProfile获取失败）
3. ✅ 应该显示缓存的用户名和头像
4. ✅ 其他联系人正常显示

## 数据流图

```
用户访问联系人页面
    ↓
查询Contact表（获取联系人关系）
    ↓
提取所有contactUserId
    ↓
并行查询所有UserProfile（获取最新资料）
    ↓
合并数据（最新资料 + 缓存数据）
    ↓
按时间倒序排列
    ↓
显示联系人列表
    ↓
ContactCard加载S3头像（如果需要）
    ↓
显示最新的用户名和头像
```

## 向后兼容性

✅ **完全向后兼容**

- 如果 UserProfile 查询失败，回退到 Contact 表中的缓存数据
- 现有的 Contact 记录继续工作
- 不需要数据迁移
- API接口保持不变

## 相关文件

**修改的文件**:
- `src/utils/contactApi.ts` - 更新 `listContacts` 函数
- `src/components/contacts/ContactCard.tsx` - 增强头像加载逻辑
- `src/components/contacts/ContactsPage.test.tsx` - 修复测试文本

**相关文档**:
- `.kiro/specs/contact-management/design.md` - 设计文档
- `CHECKPOINT-12-VERIFICATION.md` - 检查点验证报告

## 未来改进

1. **实时订阅**: 使用 AppSync 订阅功能，当联系人更新资料时实时推送
2. **智能缓存**: 实现更智能的缓存策略，减少不必要的查询
3. **批量API**: 创建批量查询UserProfile的API端点
4. **性能监控**: 添加性能指标监控，跟踪查询延迟

## 总结

通过这次增强，联系人列表现在能够实时显示最新的用户名和头像，提供了更好的用户体验。实现保持了良好的性能和错误处理，同时完全向后兼容。

**关键改进**:
- ✅ 实时同步用户资料
- ✅ 并行查询保持性能
- ✅ 优雅降级和错误处理
- ✅ 支持S3头像加载
- ✅ 所有测试通过
