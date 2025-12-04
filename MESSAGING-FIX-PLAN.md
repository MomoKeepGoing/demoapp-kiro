# 消息系统修复方案

## 问题总结

1. **新消息不能实时显示** - 订阅收到消息但没有添加到对话中
2. **未读数不正确** - Conversation 的 unreadCount 更新逻辑有问题
3. **对话列表不更新** - 新消息到达时对话列表没有正确更新

## 根本原因

**conversationId 设计混乱：**
- Message 应该使用排序后的 conversationId（共享）
- Conversation 应该使用用户特定的 ID（单向）
- 但是代码中多处混用，导致查询和匹配失败

## 已完成的修复

✅ 1. 创建了两个独立的 ID 生成函数
✅ 2. Message 创建时使用排序后的 ID
✅ 3. Conversation 创建时使用用户特定的 ID
✅ 4. ConversationView 查询消息时使用排序后的 ID
✅ 5. 订阅逻辑中正确比较 conversationId

## 剩余问题

### 问题 1：控制台日志过多
当前代码中添加了很多 console.log，需要在确认修复后删除。

### 问题 2：可能的权限问题
需要确认 Amplify sandbox 已经重新部署，权限更新已生效。

### 问题 3：订阅可能没有正确触发
需要检查浏览器控制台，确认：
- 订阅是否成功建立
- 收到消息时是否有日志输出
- conversationId 比较是否匹配

## 测试步骤

### 步骤 1：确认 Amplify 部署
```bash
# 确保 sandbox 正在运行
npx ampx sandbox
```

### 步骤 2：清除浏览器缓存
1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 步骤 3：测试实时消息
1. 打开两个浏览器窗口（或使用隐身模式）
2. 分别登录用户 A 和用户 B
3. 用户 B 打开与用户 A 的对话
4. 用户 A 发送消息
5. 检查用户 B 的对话框是否实时显示消息
6. 查看控制台输出

### 步骤 4：测试未读数
1. 用户 A 发送多条消息给用户 B
2. 用户 B 不打开对话
3. 检查用户 B 的对话列表中未读数是否正确
4. 用户 B 打开对话
5. 检查未读数是否清零

## 预期的控制台输出

当用户 B 收到消息时，应该看到：
```
ConversationView received message: {id: "...", senderId: "...", ...}
Comparing conversationIds: {
  messageConversationId: "userA_userB",
  expectedConversationId: "userA_userB",
  match: true
}
Adding new message to conversation
```

## 如果还是不行

### 检查 1：数据库中的 conversationId
在 AWS Console 中查看 DynamoDB Message 表，确认：
- conversationId 是否是排序后的格式
- 例如：如果 userA < userB，则应该是 "userA_userB"

### 检查 2：Conversation 表
确认两个用户都有各自的 Conversation 记录：
- 用户 A：id = "A_B", userId = "A", otherUserId = "B"
- 用户 B：id = "B_A", userId = "B", otherUserId = "A"

### 检查 3：订阅过滤器
确认订阅是基于 receiverId 的：
```typescript
subscribeToMessages(currentUserId, handler)
// 应该订阅 receiverId = currentUserId 的消息
```

## 紧急回退方案

如果修复后问题更严重，可以回退到简化设计：

### 方案：统一使用排序后的 ID

1. Conversation 也使用排序后的 ID
2. 修改授权规则，允许两个用户都能访问同一个 Conversation
3. 每个用户在前端维护自己的未读状态

这样可以避免 ID 混乱，但会增加授权复杂度。
