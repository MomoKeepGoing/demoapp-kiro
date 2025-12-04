# 快速开始测试

## 🚀 5 分钟快速启动

### 1. 验证后端配置（1 分钟）

```bash
npx tsx scripts/verify-messaging.ts
```

预期输出：
```
✅ 通过: 13
❌ 失败: 0
🎉 所有验证测试通过！
```

### 2. 启动测试环境（2 分钟）

**终端 1 - Amplify Sandbox**:
```bash
npx ampx sandbox
```
等待看到 "Watching for file changes..."

**终端 2 - 前端服务器**:
```bash
npm run dev
```
访问 http://localhost:5173

### 3. 创建测试账号（2 分钟）

在浏览器中创建 3 个测试账号：
- 用户 A: test-a@example.com
- 用户 B: test-b@example.com  
- 用户 C: test-c@example.com

## 📋 核心测试流程

### 测试 1: 基本消息发送（5 分钟）

1. 用户 A 登录
2. 添加用户 B 为联系人
3. 发送消息："你好"
4. 用户 B 登录（新窗口）
5. 查看是否收到消息

**预期**: ✅ 消息实时显示

### 测试 2: 离线消息（5 分钟）

1. 用户 B 退出登录
2. 用户 A 发送 3 条消息
3. 用户 B 重新登录
4. 查看消息页面

**预期**: ✅ 显示 3 条未读消息

### 测试 3: 非联系人消息（5 分钟）

1. 用户 C 登录
2. 搜索用户 A
3. 发送消息
4. 用户 A 查看消息

**预期**: ✅ 显示"添加为联系人"按钮

## 📚 完整测试文档

- **详细测试指南**: `docs/E2E-MESSAGING-TEST-GUIDE.md`
- **部署验证报告**: `docs/MESSAGING-DEPLOYMENT-VERIFICATION.md`
- **执行说明**: `docs/E2E-TEST-EXECUTION-INSTRUCTIONS.md`

## 🔧 常用命令

```bash
# 验证后端
npx tsx scripts/verify-messaging.ts

# 运行单元测试
npm test -- --run

# 启动 Amplify Sandbox
npx ampx sandbox

# 启动前端
npm run dev

# 代码检查
npm run lint
```

## ❓ 遇到问题？

### 消息发送失败
- 检查 Amplify sandbox 是否运行
- 检查用户是否已登录
- 查看浏览器控制台错误

### 实时消息不更新
- 刷新页面重新建立连接
- 检查网络连接
- 查看 WebSocket 连接状态

### 授权错误
- 确认用户已登录
- 检查 token 是否过期
- 重新登录

## ✅ 测试完成标准

- [ ] 所有 14 个测试用例通过
- [ ] 无严重或中等 bug
- [ ] 用户体验流畅
- [ ] 错误提示友好

## 📊 测试进度追踪

在 `docs/E2E-MESSAGING-TEST-GUIDE.md` 中记录：
- 测试日期
- 测试结果
- 发现的问题
- 测试结论

---

**预计测试时间**: 2-3 小时  
**建议**: 使用多个浏览器窗口或设备进行测试
