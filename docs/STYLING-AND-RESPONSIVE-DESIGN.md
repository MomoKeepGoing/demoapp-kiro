# 样式和响应式设计文档

## 概述

本文档描述了 LinkUp 消息功能的样式系统和响应式设计实现，确保在所有设备和屏幕尺寸上提供一致、优质的用户体验。

## 设计系统

### WhatsApp 风格设计

消息功能采用 WhatsApp 风格的设计语言，包括：

#### 颜色方案
- **主色调**: `#075e54` (深绿色) - 用于头部和主要按钮
- **强调色**: `#25d366` (亮绿色) - 用于未读标记和成功状态
- **发送消息**: `#dcf8c6` (浅绿色) - 发送的消息气泡
- **接收消息**: `#ffffff` (白色) - 接收的消息气泡
- **背景色**: `#e5ddd5` (米色) - 对话背景，带有微妙的纹理
- **文本色**: `#111b21` (深灰色) - 主要文本
- **次要文本**: `#667781` (中灰色) - 时间戳和提示文本

#### 排版
- **主要字体**: 系统默认字体 (inherit)
- **消息内容**: 14-15px，行高 1.5
- **标题**: 16-20px，字重 500-600
- **时间戳**: 11-12px

#### 间距
- **组件间距**: 8-16px
- **内边距**: 8-20px (根据组件大小)
- **消息气泡**: 8-12px 内边距
- **列表项**: 12-16px 内边距

### 组件样式

#### MessageBubble (消息气泡)
- **发送消息**: 右对齐，绿色背景 (#dcf8c6)，右下角圆角较小
- **接收消息**: 左对齐，白色背景，左下角圆角较小
- **状态图标**: 
  - 发送中: 🕐 (时钟)
  - 已发送: ✓ (单勾)
  - 失败: ⚠ (警告)
- **动画**: 滑入动画 (slideIn)，0.2s ease-out
- **失败消息**: 红色边框，可点击重试

#### ConversationListItem (对话列表项)
- **布局**: 头像 + 内容 (名称/时间 + 预览/未读)
- **头像**: 48px 圆形，带占位符
- **未读标记**: 绿色圆形徽章 (#25d366)
- **非联系人标记**: 黄色警告图标 (⚠)
- **悬停效果**: 背景色变化 (#f5f6f6)

#### ConversationView (对话视图)
- **头部**: 固定在顶部，深绿色背景
- **消息区域**: 可滚动，米色背景带纹理
- **输入框**: 固定在底部，自动调整高度 (最多4行)
- **发送按钮**: 绿色，圆角

#### MessagesPage (消息页面)
- **头部**: 浅灰色背景 (#f0f2f5)
- **搜索栏**: 圆角输入框，带搜索图标
- **对话列表**: 白色背景，带分隔线

## 响应式设计

### 断点系统

```css
--breakpoint-xs: 320px   /* 超小屏幕 (小手机) */
--breakpoint-sm: 480px   /* 小屏幕 (手机横屏) */
--breakpoint-md: 768px   /* 中等屏幕 (平板) */
--breakpoint-lg: 1024px  /* 大屏幕 (桌面) */
--breakpoint-xl: 1280px  /* 超大屏幕 */
```

### 移动端优化

#### 触摸目标 (Touch Targets)
- **最小尺寸**: 44x44px (iOS 推荐标准)
- **按钮**: 增加内边距确保易于点击
- **列表项**: 最小高度 72px (触摸设备)

#### 字体大小
- **输入框**: 16px (防止 iOS 自动缩放)
- **消息内容**: 14-15px (移动端略大)
- **标题**: 响应式调整 (15-20px)

#### 布局调整
- **消息气泡**: 移动端最大宽度 80-85%
- **头像**: 移动端略小 (36-44px)
- **间距**: 移动端减少内边距

#### 横屏模式
- **减少垂直间距**: 适应较小的垂直空间
- **头部高度**: 减小到 48px
- **输入区域**: 减小内边距

### 平板优化

- **保持桌面布局**: 768px 以上使用完整布局
- **适度调整**: 字体和间距介于移动和桌面之间
- **触摸优化**: 保留较大的触摸目标

### 桌面优化

- **最大宽度**: 消息气泡最大 65%
- **悬停效果**: 显示悬停状态
- **键盘导航**: 完整的焦点指示器

## 动画系统

### 核心动画

#### slideIn (滑入)
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- **用途**: 新消息进入
- **时长**: 0.2s
- **缓动**: ease-out

#### slideDown (下滑)
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- **用途**: 通知和状态提示
- **时长**: 0.3s
- **缓动**: ease-out

#### shimmer (闪烁)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
- **用途**: 加载骨架屏
- **时长**: 1.5s
- **循环**: 无限

#### spin (旋转)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```
- **用途**: 加载指示器
- **时长**: 0.8-1s
- **循环**: 无限

### 交互动画

#### 触摸反馈
- **按钮点击**: scale(0.95-0.98)
- **列表项点击**: scale(0.99)
- **时长**: 0.1s

#### 悬停效果
- **背景色变化**: 0.2s transition
- **阴影提升**: transform translateY(-2px)

### 性能优化

- **使用 transform**: 而非 top/left (GPU 加速)
- **will-change**: 谨慎使用，仅在必要时
- **减少重绘**: 使用 opacity 和 transform

## 无障碍访问 (Accessibility)

### ARIA 标签

#### MessageBubble
```tsx
<div role="article" aria-label="已发送消息">
  <div className="message-content" aria-label="消息内容">
    {content}
  </div>
  <span aria-label="发送时间: 14:30">{time}</span>
  <span aria-label="消息状态: 已发送">{status}</span>
</div>
```

#### ConversationListItem
```tsx
<div 
  role="button" 
  tabIndex={0}
  aria-label="与 Alice 的对话，最后消息：你好，3 条未读消息"
>
  {/* 内容 */}
</div>
```

#### ConversationView
```tsx
<div 
  className="messages-container"
  role="log"
  aria-live="polite"
  aria-label="消息历史"
>
  {/* 消息列表 */}
</div>

<textarea aria-label="消息输入框" />
<button aria-label="发送消息">发送</button>
```

### 键盘导航

#### 焦点管理
- **Tab 顺序**: 逻辑顺序 (头部 → 消息 → 输入)
- **焦点指示器**: 2px 绿色轮廓 (#00a884)
- **焦点可见**: 使用 :focus-visible

#### 键盘快捷键
- **Enter**: 发送消息
- **Shift+Enter**: 换行
- **Escape**: 关闭对话 (如果有返回按钮)
- **Space/Enter**: 激活按钮和列表项

### 屏幕阅读器支持

- **语义化 HTML**: 使用正确的元素 (button, article, etc.)
- **ARIA 角色**: role="button", role="log", role="alert"
- **实时区域**: aria-live="polite" 用于消息更新
- **状态通知**: role="alert" 用于错误和警告

### 减少动画 (Reduced Motion)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- **禁用动画**: 所有动画和过渡
- **保留功能**: 不影响核心功能
- **即时反馈**: 状态变化立即显示

### 高对比度模式

```css
@media (prefers-contrast: high) {
  .message-bubble {
    border: 2px solid #000;
  }
  
  .focus-ring:focus {
    outline: 3px solid currentColor;
  }
}
```

- **增强边框**: 2-3px 实线边框
- **更明显的焦点**: 3px 轮廓
- **高对比度颜色**: 黑白为主

## 暗色模式支持

### 颜色调整

```css
@media (prefers-color-scheme: dark) {
  .conversation-view {
    background-color: #0b141a;
  }
  
  .message-bubble.sent {
    background-color: #005c4b;
  }
  
  .message-bubble.received {
    background-color: #202c33;
  }
}
```

- **背景**: 深色 (#0b141a, #111b21)
- **文本**: 浅色 (#e9edef)
- **发送消息**: 深绿色 (#005c4b)
- **接收消息**: 深灰色 (#202c33)

## 性能优化

### CSS 优化

1. **避免昂贵的属性**
   - 使用 transform 而非 top/left
   - 使用 opacity 而非 visibility
   - 避免 box-shadow 动画

2. **减少重排**
   - 固定元素尺寸
   - 使用 will-change (谨慎)
   - 批量 DOM 操作

3. **优化选择器**
   - 避免深层嵌套
   - 使用类选择器
   - 避免通配符

### 图片优化

- **头像**: 48x48px (移动端 44x44px)
- **懒加载**: 使用 loading="lazy"
- **占位符**: 显示首字母占位符

### 滚动性能

```css
.messages-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  scroll-behavior: smooth;
}
```

- **平滑滚动**: scroll-behavior: smooth
- **iOS 优化**: -webkit-overflow-scrolling: touch
- **虚拟滚动**: 考虑用于超长列表 (未实现)

## 浏览器兼容性

### 支持的浏览器

- **Chrome/Edge**: 最新版本 + 前两个版本
- **Firefox**: 最新版本 + 前两个版本
- **Safari**: 最新版本 + 前两个版本
- **iOS Safari**: iOS 14+
- **Android Chrome**: Android 8+

### 渐进增强

1. **基础功能**: 所有浏览器
2. **动画**: 现代浏览器
3. **高级特性**: 最新浏览器
   - CSS Grid
   - CSS Custom Properties
   - backdrop-filter

### Polyfills

- **不需要**: 使用现代 CSS 特性
- **降级方案**: 提供基础样式

## 测试清单

### 视觉测试

- [ ] 消息气泡样式正确 (发送/接收)
- [ ] 头像显示正确 (图片/占位符)
- [ ] 未读标记显示正确
- [ ] 时间格式化正确
- [ ] 状态图标显示正确

### 响应式测试

- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13)
- [ ] 414px (iPhone 12 Pro Max)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro)
- [ ] 1920px (桌面)

### 交互测试

- [ ] 点击对话打开
- [ ] 发送消息动画
- [ ] 滚动加载历史
- [ ] 输入框自动调整
- [ ] 失败消息重试

### 无障碍测试

- [ ] 键盘导航
- [ ] 屏幕阅读器
- [ ] 焦点指示器
- [ ] ARIA 标签
- [ ] 高对比度模式
- [ ] 减少动画模式

### 性能测试

- [ ] 首次渲染时间 < 1s
- [ ] 滚动流畅 (60fps)
- [ ] 动画流畅
- [ ] 内存使用合理
- [ ] 网络请求优化

## 已知问题和限制

### 当前限制

1. **虚拟滚动**: 未实现，长列表可能影响性能
2. **图片预览**: 未实现消息中的图片预览
3. **表情符号**: 使用系统表情，无自定义表情包
4. **主题切换**: 仅支持系统主题，无手动切换

### 未来改进

1. **虚拟滚动**: 实现长列表优化
2. **自定义主题**: 支持手动切换主题
3. **更多动画**: 添加更丰富的交互动画
4. **PWA 支持**: 添加离线支持和安装提示

## 参考资源

### 设计参考
- WhatsApp Web 设计
- Material Design 指南
- iOS Human Interface Guidelines

### 技术参考
- MDN Web Docs
- CSS-Tricks
- Web.dev

### 无障碍参考
- WCAG 2.1 Guidelines
- WAI-ARIA Authoring Practices
- A11y Project

## 维护指南

### 添加新样式

1. **遵循命名约定**: BEM 或语义化命名
2. **使用 CSS 变量**: 定义在 :root
3. **考虑响应式**: 添加移动端样式
4. **测试无障碍**: 确保可访问

### 修改现有样式

1. **检查影响范围**: 避免破坏其他组件
2. **测试所有断点**: 确保响应式正常
3. **验证无障碍**: 不影响可访问性
4. **更新文档**: 记录重要变更

### 性能监控

1. **使用 Chrome DevTools**: 检查性能
2. **Lighthouse 审计**: 定期运行
3. **真机测试**: 在实际设备上测试
4. **用户反馈**: 收集使用体验

---

**最后更新**: 2024-12-04
**维护者**: LinkUp 开发团队
