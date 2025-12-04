# 按钮样式迁移状态

## ✅ 已完成

### 1. 统一样式系统
- ✅ 创建 `src/styles/buttons.css` - 统一按钮样式
- ✅ 在 `src/main.tsx` 中引入样式文件
- ✅ 创建文档 `docs/BUTTON-STYLES.md`

### 2. 已迁移的按钮
- ✅ ConversationView - 添加联系人按钮 → `btn-success btn-sm btn-rounded`
- ✅ ConversationView - 发送按钮 → `btn-primary`
- ✅ ConversationView - 返回按钮 → `btn-back`
- ✅ ConversationListPanel - 新建聊天按钮 → `btn-icon`
- ✅ ContactSelector - 返回按钮 → `btn-back`
- ✅ App.tsx - Profile 返回按钮 → `btn-back`

## 📋 待迁移组件

### 高优先级（用户常用）

#### ConversationView.tsx
- [ ] `.back-button` → `.btn-back`
- [x] `.add-contact-button` → 已使用自定义样式（绿色，醒目）
- [ ] `.send-button` → `.btn-primary`

#### ConversationListPanel.tsx
- [ ] `.new-chat-button` → `.btn-icon`

#### ContactSelector.tsx
- [ ] `.contact-selector-back-button` → `.btn-back`

#### NavSidebar.tsx
- [ ] `.nav-button` → `.btn-icon`
- [ ] `.user-avatar-button` → `.btn-icon`

#### Profile.tsx
- [ ] `.upload-button` → `.btn-primary`
- [ ] `.edit-button` → `.btn-text`
- [ ] `.save-button` → `.btn-primary`
- [ ] `.cancel-button` → `.btn-secondary`

### 中优先级

#### ContactCard.tsx
- [ ] `.contact-card-message-button` → `.btn-icon`
- [ ] `.contact-card-delete-button` → `.btn-danger`
- [ ] `.contact-card-dialog-button` → `.btn-primary` / `.btn-secondary`

#### UserCard.tsx
- [ ] `.user-card-button` → `.btn-primary`

#### ContactsPage.tsx
- [ ] `.contacts-back-button` → `.btn-back`

#### MessagesPage.tsx
- [ ] `.messages-header .back-button` → `.btn-back`
- [ ] `.retry-button` → `.btn-primary`

### 低优先级

#### App.tsx
- [ ] `.back-button` → `.btn-back`

## 🎯 迁移策略

### 方案 A：渐进式迁移（推荐）
逐个组件更新，保持向后兼容：
1. 保留旧样式
2. 添加新 class
3. 测试无问题后移除旧样式

### 方案 B：一次性迁移
直接替换所有按钮样式：
1. 全局搜索替换
2. 统一测试
3. 一次性部署

## 📝 注意事项

1. **add-contact-button** 已经有很好的自定义样式，建议保持
2. **send-button** 可能需要特殊处理（深绿色 #075e54）
3. 图标按钮需要确保图标大小一致
4. 移动端触摸目标已在统一样式中处理

## 🚀 下一步

建议优先迁移用户最常用的按钮：
1. ConversationView 的发送按钮
2. Profile 的保存/取消按钮
3. 各种返回按钮

## 估计工作量

- 高优先级：~30分钟
- 中优先级：~20分钟
- 低优先级：~10分钟
- 总计：~1小时
