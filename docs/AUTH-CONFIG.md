# 身份验证配置

## 密码策略

### 当前配置

应用使用 Amazon Cognito 的默认密码策略：

- **最小长度**: 8 个字符
- **必须包含小写字母**: 是
- **必须包含大写字母**: 是
- **必须包含数字**: 是
- **必须包含特殊字符**: 是

### 配置说明

Amplify Gen2 的 `defineAuth` 不支持直接在配置中设置 `passwordFormat` 或 `passwordPolicy` 属性。密码策略由 Cognito 的默认设置管理。

如需自定义密码策略，需要：

1. 使用 CDK 的 `UserPool` 构造函数直接配置
2. 或在 AWS Console 中手动修改 Cognito User Pool 设置

### 相关文件

- `amplify/auth/resource.ts` - 身份验证资源定义
- `src/App.tsx` - 前端密码要求提示文本

### 用户界面提示

前端在注册和重置密码表单中显示密码要求：

```
密码要求：至少8个字符，包含大小写字母、数字和特殊字符
```

这些提示与 Cognito 的默认策略保持一致。

## 邮箱验证

### 验证流程

1. 用户注册时提供邮箱地址
2. Cognito 发送包含6位验证码的邮件
3. 用户在应用中输入验证码
4. 验证成功后账户激活

### 邮件配置

```typescript
email: {
  verificationEmailStyle: 'CODE',
  verificationEmailSubject: '验证您的账户',
  verificationEmailBody: (createCode) => 
    `您的验证码是: ${createCode()}。请在应用中输入此验证码以完成注册。`,
}
```

### 重新发送验证码

用户可以在验证页面点击"重新发送验证码"按钮，使用 `resendSignUpCode` API 重新获取验证码。

## 账户恢复

### 配置

```typescript
accountRecovery: 'EMAIL_ONLY'
```

用户只能通过邮箱重置密码，不支持短信恢复。

### 密码重置流程

1. 用户点击"忘记密码"
2. 输入注册邮箱
3. 收到包含验证码的邮件
4. 输入验证码和新密码
5. 密码重置成功

## 用户属性

### 自定义属性

```typescript
userAttributes: {
  profilePicture: {
    mutable: true,
    required: false,
  },
  preferredUsername: {
    mutable: true,
    required: false,
  },
}
```

- `profilePicture`: 用户头像 URL（可选）
- `preferredUsername`: 用户显示名称（可选）

这些属性在用户注册后可以修改。

## 会话管理

### 存储策略

应用使用混合存储策略（在 `src/main.tsx` 中配置）：

- **标签页隔离**: 每个标签页有唯一的 TAB_ID（存储在 sessionStorage）
- **令牌持久化**: 认证令牌存储在 localStorage，使用 TAB_ID 前缀
- **刷新保持**: 页面刷新后保持登录状态
- **多账户支持**: 不同标签页可以登录不同账户

这种策略平衡了用户体验和安全性。详见 `docs/PERFORMANCE.md` 的混合存储部分。

## 文件存储授权

### 头像访问控制

配置文件：`amplify/storage/resource.ts`

```typescript
'profile-pictures/{entity_id}/*': [
  allow.entity('identity').to(['read', 'write', 'delete']),
  allow.authenticated.to(['read']),
]
```

**访问规则**:
- 用户只能上传、修改和删除自己的头像（entity-based）
- 所有已认证用户可以读取任何头像（用于联系人列表显示）
- 路径格式：`profile-pictures/{identityId}/filename`

**使用场景**:
- 个人资料页面：用户上传和管理自己的头像
- 联系人列表：显示联系人的头像
- 搜索结果：显示搜索到的用户头像

## 参考资料

- [Amplify Gen2 Auth Documentation](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Cognito Password Policies](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-policies.html)
