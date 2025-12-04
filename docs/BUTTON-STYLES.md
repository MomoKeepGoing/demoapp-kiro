# 按钮样式指南

统一的 WhatsApp 风格按钮设计系统。

## 按钮类型

### 1. 主要操作按钮 (Primary)
用于最重要的操作，如"发送"、"保存"、"确认"。

```tsx
<button className="btn-primary">发送消息</button>
<button className="btn-primary" disabled>发送中...</button>
```

**样式：** 绿色背景 (#00a884)，白色文字

---

### 2. 次要操作按钮 (Secondary)
用于次要操作，如"取消"、"返回"。

```tsx
<button className="btn-secondary">取消</button>
```

**样式：** 灰色背景 (#f0f2f5)，深色文字

---

### 3. 危险操作按钮 (Danger)
用于删除、移除等危险操作。

```tsx
<button className="btn-danger">删除联系人</button>
```

**样式：** 红色背景 (#dc3545)，白色文字

---

### 4. 成功操作按钮 (Success)
用于积极的操作，如"添加联系人"、"完成"。

```tsx
<button className="btn-success">添加联系人</button>
```

**样式：** 亮绿色背景 (#25d366)，白色文字

---

### 5. 文本按钮 (Text)
用于不太重要的操作，透明背景。

```tsx
<button className="btn-text">了解更多</button>
```

**样式：** 透明背景，绿色文字

---

### 6. 图标按钮 (Icon)
用于只有图标的按钮，圆形。

```tsx
<button className="btn-icon">🔍</button>
<button className="btn-icon">➕</button>
```

**样式：** 圆形，透明背景

---

### 7. 返回按钮 (Back)
专门用于返回操作。

```tsx
<button className="btn-back">←</button>
```

**样式：** 圆形，透明背景

---

## 尺寸修饰符

### 小尺寸
```tsx
<button className="btn-primary btn-sm">小按钮</button>
```

### 大尺寸
```tsx
<button className="btn-primary btn-lg">大按钮</button>
```

---

## 形状修饰符

### 圆角按钮
```tsx
<button className="btn-primary btn-rounded">圆角按钮</button>
```

### 全宽按钮
```tsx
<button className="btn-primary btn-block">全宽按钮</button>
```

---

## 组合使用

```tsx
{/* 小尺寸圆角主要按钮 */}
<button className="btn-primary btn-sm btn-rounded">发送</button>

{/* 全宽大尺寸成功按钮 */}
<button className="btn-success btn-lg btn-block">完成注册</button>
```

---

## 状态

### 禁用状态
所有按钮都支持 `disabled` 属性：

```tsx
<button className="btn-primary" disabled>处理中...</button>
```

### 悬停和点击
所有按钮都有内置的悬停和点击效果：
- 悬停：颜色变深，轻微上移（主要按钮）
- 点击：颜色更深，下压效果

---

## 响应式

- 移动端自动增加最小触摸目标尺寸（44px）
- 支持无障碍访问
- 支持减少动画偏好设置

---

## 迁移指南

### 旧样式 → 新样式

| 旧 Class | 新 Class |
|---------|---------|
| `.upload-button` | `.btn-primary` |
| `.save-button` | `.btn-primary` |
| `.cancel-button` | `.btn-secondary` |
| `.contact-card-delete-button` | `.btn-danger` |
| `.add-contact-button` | `.btn-success` |
| `.back-button` | `.btn-back` |
| `.user-card-button` | `.btn-primary` |
| `.send-button` | `.btn-primary` |

---

## 最佳实践

1. **一致性** - 相同功能使用相同样式
2. **层级** - 一个页面只有一个主要按钮
3. **对比** - 确保按钮与背景有足够对比度
4. **间距** - 按钮之间保持适当间距（8-12px）
5. **文字** - 使用清晰的动词，如"发送"而不是"确定"

---

## 颜色参考

- **主绿色**: #00a884 (WhatsApp 主色)
- **亮绿色**: #25d366 (WhatsApp 亮色)
- **深绿色**: #075e54 (WhatsApp 深色)
- **灰色**: #f0f2f5 (背景灰)
- **红色**: #dc3545 (危险操作)
