# LinkUp 💬

现代化的即时通讯应用，采用 WhatsApp 风格设计，基于 AWS Amplify Gen2 构建。

## 功能特性

### ✅ 已实现
- 用户注册和邮箱验证
- 用户登录和会话管理
- 个人资料管理（用户名、头像）
- WhatsApp 风格的 UI 设计
- 响应式布局（移动端和桌面端）
- 实时上传进度显示
- Toast 通知系统
- 完善的错误处理

### 🚧 开发中
- 实时聊天功能
- 一对一消息
- 群组聊天
- 消息通知

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI 组件**: AWS Amplify UI React
- **后端**: AWS Amplify Gen2
  - 身份验证: Amazon Cognito
  - 数据存储: AWS AppSync + DynamoDB
  - 文件存储: Amazon S3
- **样式**: CSS (WhatsApp 风格设计系统)

## 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- AWS 账户

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd linkup

# 安装依赖
npm install

# 启动 Amplify 沙箱环境
npx ampx sandbox

# 在另一个终端启动开发服务器
npm run dev
```

### 构建

```bash
npm run build
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Profile.tsx     # 个人资料管理
│   ├── Toast.tsx       # 通知组件
│   ├── Loading.tsx     # 加载组件
│   └── README.md       # 组件文档
├── utils/              # 工具函数
│   └── authConfig.ts   # 认证配置
├── App.tsx             # 主应用组件
├── App.css             # 全局样式
├── main.tsx            # 应用入口
└── index.css           # 基础样式

amplify/
├── auth/               # 身份验证资源
├── data/               # 数据模型
├── storage/            # 文件存储
└── backend.ts          # 后端配置
```

## 设计系统

### 配色方案 (WhatsApp 主题)
- 主色: `#25d366` (WhatsApp 绿)
- 深色: `#075e54` (深青色)
- 背景: `#f0f2f5` (浅灰)
- 文字: `#111b21` (深色文字)

### 布局特点
- 左侧边栏：聊天列表（即将推出）和用户信息
- 主内容区：欢迎页面（默认）和个人资料管理
- 点击底部用户信息可查看个人资料
- 响应式设计：移动端自适应

## 开发指南

详细的开发文档请参考：
- [需求文档](.kiro/specs/amplify-im-app/requirements.md)
- [设计文档](.kiro/specs/amplify-im-app/design.md)
- [任务列表](.kiro/specs/amplify-im-app/tasks.md)
- [组件文档](src/components/README.md)

## React + TypeScript + Vite

This project uses Vite for fast development and building.

Available plugins:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# demoapp-kiro
