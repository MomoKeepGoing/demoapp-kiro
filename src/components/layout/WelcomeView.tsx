import './WelcomeView.css';

/**
 * WelcomeView - Welcome screen component
 * 欢迎页面组件
 * 
 * Requirements: AC3
 * 
 * Features:
 * - WhatsApp-style welcome icon
 * - Application title and subtitle
 * - Usage instructions
 * - End-to-end encryption notice
 */
export function WelcomeView() {
  return (
    <div className="welcome-view">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg viewBox="0 0 303 172" width="360" height="205" preserveAspectRatio="xMidYMid meet">
            <path fill="#DFE5E7" d="M64.8 172.6c-3.2 0-6.3-.9-9.1-2.7L9.4 145.6c-6.2-3.9-8-12.1-4.1-18.3 3.9-6.2 12.1-8 18.3-4.1l46.3 24.3c6.2 3.9 8 12.1 4.1 18.3-2.4 3.9-6.6 6.1-11 6.1z"/>
            <path fill="#DFE5E7" d="M238.2 172.6c-4.4 0-8.6-2.2-11-6.1-3.9-6.2-2.1-14.4 4.1-18.3l46.3-24.3c6.2-3.9 14.4-2.1 18.3 4.1 3.9 6.2 2.1 14.4-4.1 18.3l-46.3 24.3c-2.8 1.8-5.9 2.7-9.1 2.7z"/>
            <path fill="#DFE5E7" d="M151.5 0C67.8 0 0 67.8 0 151.5S67.8 303 151.5 303 303 235.2 303 151.5 235.2 0 151.5 0zm0 286C77.2 286 17 225.8 17 151.5S77.2 17 151.5 17 286 77.2 286 151.5 225.8 286 151.5 286z"/>
            <path fill="#00A884" d="M151.5 34c-64.9 0-117.5 52.6-117.5 117.5 0 25.4 8.1 49 21.9 68.3l-14.4 52.6c-.8 2.9.7 6 3.6 7.1.9.3 1.8.5 2.7.5 2 0 3.9-.9 5.2-2.5l37.5-45c15.8 8.6 33.8 13.5 53 13.5 64.9 0 117.5-52.6 117.5-117.5S216.4 34 151.5 34z"/>
          </svg>
        </div>
        
        <h1 className="welcome-title">LinkUp Web</h1>
        <p className="welcome-subtitle">
          在电脑上发送和接收消息
        </p>
        
        <div className="welcome-steps">
          <div className="step-item">
            <span className="step-number">1</span>
            <p className="step-text">点击左上角"新建聊天"开始对话</p>
          </div>
          <div className="step-item">
            <span className="step-number">2</span>
            <p className="step-text">选择左侧对话继续聊天</p>
          </div>
          <div className="step-item">
            <span className="step-number">3</span>
            <p className="step-text">管理您的个人资料信息</p>
          </div>
        </div>

        <div className="welcome-footer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
            <path d="M8 4c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1s1-.4 1-1V5c0-.6-.4-1-1-1zm0 6c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"/>
          </svg>
          <span>端到端加密保护您的隐私</span>
        </div>
      </div>
    </div>
  );
}
