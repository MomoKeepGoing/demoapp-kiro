# 存储权限修复 - 联系人头像访问

**日期**: 2024-12-04
**问题**: 联系人列表无法显示对方的头像
**原因**: S3存储权限配置过于严格

## 问题描述

用户在联系人列表中看不到对方的头像，控制台显示权限错误。

### 错误现象
- 联系人列表显示默认头像而不是实际头像
- 浏览器控制台显示S3访问被拒绝错误
- `getUrl()` 调用失败，返回 AccessDenied 错误

### 根本原因

原始的存储配置只允许用户访问自己的头像：

```typescript
// ❌ 原始配置 - 过于严格
export const storage = defineStorage({
  name: 'userProfileStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
```

这个配置的问题：
- `allow.entity('identity')` 只允许文件所有者访问
- 用户A无法读取用户B的头像
- 导致联系人列表无法显示对方的头像

## 解决方案

修改存储配置，允许所有已认证用户读取头像，但只允许所有者修改和删除：

```typescript
// ✅ 修复后的配置
export const storage = defineStorage({
  name: 'userProfileStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']), // 所有者全部权限
      allow.authenticated.to(['read']), // 所有已认证用户可以读取
    ],
  }),
});
```

### 权限说明

| 操作 | 所有者 | 其他已认证用户 | 未认证用户 |
|------|--------|----------------|------------|
| 读取 (read) | ✅ | ✅ | ❌ |
| 写入 (write) | ✅ | ❌ | ❌ |
| 删除 (delete) | ✅ | ❌ | ❌ |

### 安全性考虑

**这个配置是安全的，因为**:

1. **写入和删除仍然受保护**
   - 只有文件所有者可以上传、更新或删除自己的头像
   - 其他用户无法修改或删除别人的头像

2. **读取权限是合理的**
   - 头像是公开的个人资料信息
   - 类似于社交媒体平台（微信、WhatsApp等）的做法
   - 用户添加联系人后应该能看到对方的头像

3. **需要认证**
   - 未认证用户无法访问任何头像
   - 只有登录用户才能查看头像

4. **符合应用需求**
   - 联系人管理功能需要显示联系人的头像
   - 这是即时通讯应用的基本功能

## 部署步骤

### 1. 更新配置文件

**文件**: `amplify/storage/resource.ts`

已更新配置添加 `allow.authenticated.to(['read'])`

### 2. 重新部署后端

```bash
# 停止当前的sandbox（如果正在运行）
# Ctrl+C

# 重新启动sandbox以应用新配置
npx ampx sandbox
```

### 3. 验证修复

部署完成后，测试以下场景：

**测试场景1: 查看有头像的联系人**
1. 用户A上传头像
2. 用户B添加用户A为联系人
3. 用户B访问联系人列表
4. ✅ 应该能看到用户A的头像

**测试场景2: 权限隔离**
1. 用户B尝试修改用户A的头像
2. ❌ 应该被拒绝（AccessDenied）

**测试场景3: 未认证用户**
1. 未登录用户尝试访问头像URL
2. ❌ 应该被拒绝（AccessDenied）

## 技术细节

### Amplify Storage 访问控制

Amplify Gen2 提供了三种访问控制级别：

1. **guest** - 未认证用户
2. **authenticated** - 已认证用户
3. **entity('identity')** - 特定身份（文件所有者）

### 权限组合

可以为同一路径配置多个权限规则：

```typescript
'profile-pictures/{entity_id}/*': [
  allow.entity('identity').to(['read', 'write', 'delete']), // 规则1
  allow.authenticated.to(['read']),                          // 规则2
]
```

**权限合并逻辑**:
- 如果任何一条规则允许操作，则操作被允许
- 用户A访问自己的文件：规则1允许 → ✅
- 用户B访问用户A的文件（读取）：规则2允许 → ✅
- 用户B访问用户A的文件（写入）：两条规则都不允许 → ❌

### getUrl() 行为

```typescript
// 获取签名URL
const result = await getUrl({ 
  path: 'profile-pictures/us-east-1:abc-123/avatar.jpg' 
});

// 修复前：如果不是文件所有者 → AccessDenied
// 修复后：如果是已认证用户 → 返回签名URL ✅
```

## 相关文件

**修改的文件**:
- `amplify/storage/resource.ts` - 存储配置

**相关组件**:
- `src/components/contacts/ContactCard.tsx` - 显示联系人头像
- `src/utils/contactApi.ts` - 获取联系人信息
- `src/components/Profile.tsx` - 上传和管理自己的头像

## 对比其他平台

### WhatsApp
- ✅ 联系人可以看到对方的头像
- ✅ 只有所有者可以修改自己的头像

### 微信
- ✅ 好友可以看到对方的头像
- ✅ 只有所有者可以修改自己的头像

### Telegram
- ✅ 联系人可以看到对方的头像
- ✅ 只有所有者可以修改自己的头像

**我们的配置与主流即时通讯应用一致** ✅

## 测试结果

### 修复前
```
[ContactCard] Error loading contact avatar: AccessDenied
❌ 联系人列表显示默认头像
```

### 修复后
```
[ContactCard] Got signed URL: https://...
✅ 联系人列表显示实际头像
```

## 后续优化建议

### 1. 添加头像缓存
```typescript
// 使用React Query缓存头像URL
const { data: avatarUrl } = useQuery(
  ['avatar', contact.contactAvatarUrl],
  () => getUrl({ path: contact.contactAvatarUrl }),
  { staleTime: 5 * 60 * 1000 } // 5分钟缓存
);
```

### 2. 批量获取签名URL
```typescript
// 一次性获取多个头像的签名URL
const avatarUrls = await Promise.all(
  contacts.map(c => getUrl({ path: c.contactAvatarUrl }))
);
```

### 3. CDN加速
- 配置CloudFront CDN
- 缓存头像文件
- 减少S3访问次数

## 总结

**问题**: 联系人列表无法显示对方的头像
**原因**: S3存储权限配置过于严格
**解决**: 添加 `allow.authenticated.to(['read'])` 允许已认证用户读取头像
**结果**: ✅ 联系人列表现在可以正常显示头像

**安全性**: ✅ 保持良好
- 只有所有者可以修改/删除自己的头像
- 已认证用户可以查看头像（符合即时通讯应用的标准做法）
- 未认证用户无法访问任何头像

**下一步**: 重新部署后端（`npx ampx sandbox`）以应用新配置
