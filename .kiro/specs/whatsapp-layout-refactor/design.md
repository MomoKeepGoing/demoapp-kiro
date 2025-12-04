# WhatsApp 布局重构设计文档

## 概述

本设计文档描述如何将当前的两栏布局重构为 WhatsApp 风格的三栏布局。重构将保持现有功能不变，仅调整 UI 结构和交互流程，以提供更符合 WhatsApp 使用习惯的体验。

## 架构

### 当前架构（两栏布局）
```
┌─────────────────────┬────────────────────────┐
│                     │                        │
│   左侧边栏          │      右侧主内容区      │
│   (420px)           │      (flex: 1)         │
│                     │                        │
│  - Header           │  - Welcome             │
│  - Search           │  - ContactsPage        │
│  - Navigation       │  - MessagesPage        │
│  - User Info        │  - Profile             │
│                     │                        │
└─────────────────────┴────────────────────────┘
```

### 目标架构（三栏布局）
```
┌──────────┬─────────────────────┬────────────────────────┐
│          │                     │                        │
│  左侧栏  │      中间栏         │       右侧栏           │
│  (80px)  │     (400px)         │      (flex: 1)         │
│          │                     │                        │
│  - Logo  │  - Header + 新建    │  - Welcome             │
│  - 消息  │  - Search           │  - ConversationView    │
│  - 设置  │  - ConversationList │  - ContactSelector     │
│  - 头像  │                     │  - Profile             │
│          │                     │                        │
└──────────┴─────────────────────┴────────────────────────┘
```

## 组件和接口

### 1. 主应用组件 (App.tsx)

#### 状态管理
```typescript
type ViewType = 'messages' | 'profile' | 'newChat'
type MiddlePanelView = 'conversations' | 'hidden'

interface AppState {
  // 当前视图
  currentView: ViewType
  
  // 中间栏视图
  middlePanelView: MiddlePanelView
  
  // 选中的对话
  selectedConversationId: string | null
  
  // 用户资料
  userProfile: UserProfile | null
  avatarPreview: string | null
  
  // 未读消息总数
  totalUnreadMessages: number
}
```

#### 布局结构
```tsx
<div className="main-app">
  {/* 左侧导航栏 */}
  <aside className="app-nav-sidebar">
    <NavSidebar 
      currentView={currentView}
      totalUnread={totalUnreadMessages}
      userProfile={userProfile}
      avatarPreview={avatarPreview}
      onViewChange={handleViewChange}
      onSignOut={signOut}
    />
  </aside>

  {/* 中间消息列表栏 */}
  {middlePanelView === 'conversations' && (
    <aside className="app-middle-panel">
      <ConversationListPanel
        currentUserId={user.userId}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
      />
    </aside>
  )}

  {/* 右侧内容区 */}
  <main className="app-content-panel">
    {renderContentPanel()}
  </main>
</div>
```

### 2. 左侧导航栏组件 (NavSidebar)

#### 接口定义
```typescript
interface NavSidebarProps {
  currentView: ViewType
  totalUnread: number
  userProfile: UserProfile | null
  avatarPreview: string | null
  onViewChange: (view: ViewType) => void
  onSignOut: () => void
}
```

#### 组件结构
```tsx
<div className="nav-sidebar">
  {/* Logo */}
  <div className="nav-logo">
    <div className="logo-icon">💬</div>
    <span className="logo-text">LinkUp</span>
  </div>

  {/* 导航按钮 */}
  <nav className="nav-buttons">
    <button 
      className={`nav-button ${currentView === 'messages' ? 'active' : ''}`}
      onClick={() => onViewChange('messages')}
    >
      <span className="nav-button-icon">💬</span>
      {totalUnread > 0 && (
        <span className="nav-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
      )}
    </button>
    
    <button 
      className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
      onClick={() => onViewChange('settings')}
    >
      <span className="nav-button-icon">⚙️</span>
    </button>
  </nav>

  {/* 用户头像 */}
  <div className="nav-user">
    <button 
      className="user-avatar-button"
      onClick={() => onViewChange('profile')}
    >
      {avatarPreview ? (
        <img src={avatarPreview} alt="用户头像" />
      ) : (
        <div className="avatar-placeholder">
          {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
    </button>
  </div>
</div>
```

### 3. 中间消息列表面板 (ConversationListPanel)

#### 接口定义
```typescript
interface ConversationListPanelProps {
  currentUserId: string
  selectedConversationId: string | null
  onConversationSelect: (conversationId: string) => void
  onNewChat: () => void
}
```

#### 组件结构
```tsx
<div className="conversation-list-panel">
  {/* Header */}
  <div className="panel-header">
    <h2 className="panel-title">消息</h2>
    <button 
      className="new-chat-button"
      onClick={onNewChat}
      title="新建聊天"
    >
      <span className="button-icon">➕</span>
    </button>
  </div>

  {/* Search */}
  <div className="panel-search">
    <input 
      type="text"
      placeholder="搜索对话"
      className="search-input"
    />
  </div>

  {/* Conversation List */}
  <div className="conversation-list">
    {conversations.map(conv => (
      <ConversationListItem
        key={conv.id}
        conversation={conv}
        isSelected={conv.id === selectedConversationId}
        onClick={() => onConversationSelect(conv.id)}
      />
    ))}
  </div>
</div>
```

### 4. 右侧内容面板

#### 视图类型
1. **欢迎页面** (WelcomeView)
   - 默认显示，未选中任何对话时
   - 显示使用说明和引导

2. **聊天界面** (ConversationView)
   - 选中对话时显示
   - 复用现有的 `ConversationView` 组件
   - 移除返回按钮（桌面端）

3. **联系人选择器** (ContactSelector)
   - 点击"新建聊天"时显示
   - 基于现有 `ContactsPage` 组件改造
   - 添加返回按钮
   - 点击联系人后创建/打开对话

4. **个人资料** (Profile)
   - 点击用户头像时显示
   - 复用现有的 `Profile` 组件
   - 添加返回按钮

## 数据模型

### 视图状态模型
```typescript
// 主视图类型
type ViewType = 'messages' | 'profile' | 'newChat'

// 中间栏显示状态
type MiddlePanelView = 'conversations' | 'hidden'

// 右侧内容类型
type ContentPanelType = 
  | { type: 'welcome' }
  | { type: 'conversation'; conversationId: string }
  | { type: 'contactSelector' }
  | { type: 'profile' }
```

### 导航状态转换
```typescript
// 状态转换规则
const viewTransitions = {
  // 点击"消息"按钮
  messages: {
    middlePanel: 'conversations',
    contentPanel: 'welcome',
  },
  
  // 点击"新建聊天"
  newChat: {
    middlePanel: 'conversations',
    contentPanel: 'contactSelector',
  },
  
  // 点击用户头像
  profile: {
    middlePanel: 'conversations',
    contentPanel: 'profile',
  },
  
  // 选中对话
  selectConversation: {
    middlePanel: 'conversations',
    contentPanel: 'conversation',
  },
}
```

## 错误处理

### 1. 布局渲染错误
- 使用 React Error Boundary 捕获组件错误
- 显示友好的错误提示
- 提供重新加载选项

### 2. 状态同步错误
- 确保三个面板的状态一致性
- 使用 useEffect 监听状态变化
- 提供状态重置机制

### 3. 响应式布局错误
- 使用 CSS media queries 处理不同屏幕尺寸
- 提供移动端降级方案（单栏显示）
- 测试各种屏幕尺寸

## 测试策略

### 单元测试
1. **NavSidebar 组件测试**
   - 测试导航按钮点击
   - 测试激活状态显示
   - 测试未读数角标显示

2. **ConversationListPanel 组件测试**
   - 测试对话列表渲染
   - 测试搜索功能
   - 测试"新建聊天"按钮

3. **布局响应式测试**
   - 测试桌面端三栏布局
   - 测试平板端布局调整
   - 测试移动端单栏布局

### 集成测试
1. **导航流程测试**
   - 测试从欢迎页到聊天界面的流程
   - 测试新建聊天流程
   - 测试查看个人资料流程

2. **状态同步测试**
   - 测试选中对话时的状态更新
   - 测试未读数更新
   - 测试多面板状态一致性

### 视觉回归测试
1. **布局快照测试**
   - 对比重构前后的视觉效果
   - 确保 WhatsApp 风格一致性
   - 测试各种状态下的显示

## 性能优化

### 1. 组件懒加载
```typescript
// 延迟加载大型组件
const ContactSelector = lazy(() => 
  import('./components/ContactSelector')
)
const Profile = lazy(() => 
  import('./components/Profile')
)
```

### 2. 虚拟滚动
- 对话列表使用虚拟滚动
- 仅渲染可见区域的对话项
- 提升大量对话时的性能

### 3. 状态优化
- 使用 useMemo 缓存计算结果
- 使用 useCallback 避免不必要的重渲染
- 合理拆分组件避免过度渲染

## 可访问性

### 1. 键盘导航
- 支持 Tab 键在面板间切换
- 支持方向键在列表中导航
- 支持 Enter 键选中项目
- 支持 Esc 键返回

### 2. 屏幕阅读器
- 为所有交互元素添加 aria-label
- 使用语义化 HTML 标签
- 提供状态变化的语音反馈

### 3. 焦点管理
- 切换视图时正确管理焦点
- 打开对话时焦点移到输入框
- 返回时恢复之前的焦点位置

## 迁移策略

### 阶段 1：创建新组件
1. 创建 `NavSidebar` 组件
2. 创建 `ConversationListPanel` 组件
3. 创建 `ContactSelector` 组件（基于 ContactsPage）
4. 创建 `WelcomeView` 组件

### 阶段 2：重构 App.tsx
1. 更新状态管理逻辑
2. 实现三栏布局结构
3. 实现视图切换逻辑
4. 保持现有功能不变

### 阶段 3：样式调整
1. 创建新的 CSS 文件
2. 实现 WhatsApp 风格样式
3. 实现响应式设计
4. 测试各种屏幕尺寸

### 阶段 4：测试和优化
1. 运行单元测试
2. 运行集成测试
3. 性能测试和优化
4. 可访问性测试

## 回滚计划

### 回滚触发条件
- 关键功能失效
- 性能严重下降
- 用户体验严重受损

### 回滚步骤
1. 恢复 App.tsx 到重构前版本
2. 恢复 App.css 到重构前版本
3. 删除新创建的组件文件
4. 运行测试确保功能正常

## 技术债务

### 需要后续优化的项目
1. **虚拟滚动实现**
   - 当前使用简单的列表渲染
   - 大量对话时可能影响性能
   - 建议使用 react-window 或 react-virtualized

2. **状态管理优化**
   - 当前使用 useState 管理状态
   - 复杂状态可能难以维护
   - 考虑引入 Context API 或状态管理库

3. **动画效果**
   - 当前使用简单的 CSS 过渡
   - 可以添加更流畅的动画效果
   - 考虑使用 Framer Motion

## 依赖关系

### 现有依赖
- React 19
- TypeScript
- AWS Amplify UI React
- CSS Modules

### 新增依赖
- 无（保持依赖最小化）

### 可选依赖（未来优化）
- react-window（虚拟滚动）
- framer-motion（动画效果）

## 部署注意事项

### 1. 构建配置
- 确保代码分割正常工作
- 检查 bundle 大小
- 优化资源加载

### 2. 浏览器兼容性
- 测试主流浏览器（Chrome, Firefox, Safari, Edge）
- 测试移动浏览器（iOS Safari, Chrome Mobile）
- 提供降级方案

### 3. 性能监控
- 监控首屏加载时间
- 监控交互响应时间
- 监控内存使用情况

## 文档更新

### 需要更新的文档
1. **README.md**
   - 更新应用截图
   - 更新功能说明

2. **组件文档**
   - 添加新组件的文档
   - 更新组件使用示例

3. **用户指南**
   - 更新使用说明
   - 添加新功能介绍
