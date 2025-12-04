# 消息系统调试指南

## 当前问题
1. 新收到的消息不能实时在对话框显示
2. 消息列表的未读数展示不对

## 数据模型设计（正确的）

### Message
- `conversationId`: **排序后的 ID**（如 `userA_userB`，其中 userA < userB）
- 两个用户看到相同的消息列表

### Conversation  
- `id`: **用户特定的 ID**（如用户 A 的是 `A_B`，用户 B 的是 `B_A`）
- 每个用户维护自己的对话记录

## 关键函数

### 1. generateMessageConversationId (messageApi.ts)
```typescript
// 用于 Message 记录
export function generateMessageConversationId(userId: string, otherUserId: string): string {
  const sortedIds = [userId, otherUserId].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}
```

### 2. generateUserConversationId (messageApi.ts)
```typescript
// 用于 Conversation 记录
export function generateUserConversationId(userId: string, otherUserId: string): string {
  return `${userId}_${otherUserId}`;
}
```

## 需要检查的地方

### ✅ 已修复
1. Message 创建时使用排序后的 conversationId
2. Conversation 创建时使用用户特定的 ID
3. ConversationView 查询消息时使用排序后的 ID
4. markConversationAsRead 同时处理两种 ID

### ❌ 可能的问题

1. **订阅逻辑**
   - ConversationView 的订阅是否正确接收消息？
   - 订阅的 conversationId 比较逻辑是否正确？

2. **对话列表更新**
   - MessagesPage 的 handleNewMessage 是否正确更新对话列表？
   - Conversation 订阅是否正常工作？

3. **未读数更新**
   - 发送消息时是否正确更新接收方的 unreadCount？
   - 查看对话时是否正确清零 unreadCount？

## 调试步骤

### 1. 检查浏览器控制台
打开浏览器控制台（F12），查看：
- 是否有 GraphQL 错误？
- 订阅是否成功建立？
- 收到消息时的 console.log 输出

### 2. 检查数据库
在 AWS Console 中查看 DynamoDB 表：
- Message 表中的 conversationId 是否正确（排序后的）？
- Conversation 表中的 ID 是否正确（用户特定的）？
- unreadCount 是否正确更新？

### 3. 测试场景

#### 场景 1：发送消息
1. 用户 A 发送消息给用户 B
2. 检查：
   - Message 的 conversationId 是否是排序后的？
   - 用户 A 的 Conversation 是否更新？
   - 用户 B 的 Conversation 是否创建/更新？
   - 用户 B 的 unreadCount 是否 +1？

#### 场景 2：实时接收
1. 用户 B 打开对话
2. 用户 A 发送消息
3. 检查：
   - 用户 B 的对话框是否实时显示新消息？
   - 控制台是否有 "ConversationView received message" 日志？
   - conversationId 比较是否匹配？

#### 场景 3：未读数
1. 用户 A 发送多条消息给用户 B
2. 用户 B 未打开对话
3. 检查：
   - 对话列表中用户 B 看到的未读数是否正确？
4. 用户 B 打开对话
5. 检查：
   - 未读数是否清零？
   - 消息是否标记为已读？

## 可能的修复方案

### 方案 1：简化 conversationId 设计
统一使用排序后的 ID，包括 Conversation 表。这样可以避免混淆。

### 方案 2：保持当前设计，修复订阅逻辑
确保所有地方都正确使用两种不同的 ID。

### 方案 3：添加更多日志
在关键位置添加 console.log，帮助定位问题。
