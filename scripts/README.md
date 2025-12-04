# 验证脚本

本目录包含用于验证 LinkUp 应用后端配置的自动化脚本。

## 可用脚本

### verify-backend.ts
验证基础后端配置（Auth, Data, Storage）。

**运行**:
```bash
npx tsx scripts/verify-backend.ts
```

**验证内容**:
- GraphQL API 端点
- 认证配置（Cognito）
- 存储配置（S3）
- UserProfile 和 Contact 模型

---

### verify-messaging.ts
验证消息系统后端配置。

**运行**:
```bash
npx tsx scripts/verify-messaging.ts
```

**验证内容**:
- GraphQL API 端点配置
- DynamoDB 表创建
  - Message 表
  - Conversation 表
  - UserProfile 表
  - Contact 表
- 数据模型字段完整性
  - Message 模型（9 个字段）
  - Conversation 模型（10 个字段）
- GSI 索引配置
  - Message.bySender
  - Message.byReceiver
  - Message.byConversation
  - Conversation.byUser
- 授权规则配置
  - Message: owner-based（senderId, receiverId）
  - Conversation: owner-based（userId）

**输出示例**:
```
🚀 开始验证消息系统后端配置...

🌐 验证 GraphQL API 端点...
✅ GraphQL API 端点: API 端点已配置

💾 验证 DynamoDB 表...
✅ DynamoDB 表: Message
✅ DynamoDB 表: Conversation
✅ DynamoDB 表: UserProfile
✅ DynamoDB 表: Contact

📋 验证数据模型配置...
✅ Message 模型字段
✅ Conversation 模型字段

🔍 验证 GSI 索引配置...
✅ GSI: Message.bySender
✅ GSI: Message.byReceiver
✅ GSI: Message.byConversation
✅ GSI: Conversation.byUser

🔐 验证授权规则配置...
✅ Message 授权规则
✅ Conversation 授权规则

============================================================
📊 验证摘要
============================================================

✅ 通过: 13
❌ 失败: 0
⏭️  跳过: 0
📝 总计: 13

🎉 所有验证测试通过！消息系统后端已正确配置。
```

---

## 使用场景

### 1. 部署后验证
在部署 Amplify sandbox 或生产环境后，运行验证脚本确保配置正确。

```bash
# 启动 sandbox
npx ampx sandbox

# 等待部署完成后，运行验证
npx tsx scripts/verify-messaging.ts
```

### 2. 故障排查
当遇到后端相关问题时，运行验证脚本快速定位配置问题。

### 3. CI/CD 集成
将验证脚本集成到 CI/CD 流程中，自动验证部署结果。

---

## 前置要求

- Node.js 18+
- tsx（TypeScript 执行器）
- Amplify sandbox 已部署
- `amplify_outputs.json` 文件存在

---

## 故障排查

### 问题: "Cannot find module '../amplify_outputs.json'"
**原因**: Amplify sandbox 未部署或配置文件未生成

**解决**:
```bash
npx ampx sandbox
```

### 问题: "API 端点未找到"
**原因**: amplify_outputs.json 中缺少 data 配置

**解决**: 检查 `amplify/data/resource.ts` 配置并重新部署

### 问题: 验证失败
**原因**: 后端配置不完整或有错误

**解决**: 
1. 检查错误详情
2. 修复 `amplify/data/resource.ts` 中的配置
3. 重新部署 sandbox
4. 再次运行验证

---

## 相关文档

- [消息系统部署验证报告](../docs/MESSAGING-DEPLOYMENT-VERIFICATION.md)
- [端到端测试指南](../docs/E2E-MESSAGING-TEST-GUIDE.md)
- [消息系统需求文档](../.kiro/specs/messaging/requirements.md)
- [消息系统设计文档](../.kiro/specs/messaging/design.md)
