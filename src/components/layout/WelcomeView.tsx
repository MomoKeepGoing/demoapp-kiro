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
        
        <h1 className="welcome-title">👋 欢迎使用 LinkUp！</h1>
        <p className="welcome-subtitle">
          开始你的聊天之旅，随时随地保持联系 ✨
        </p>
        
        <div className="welcome-steps">
          <div className="step-item">
            <span className="step-number">➕</span>
            <p className="step-text">点击中间面板右上角的 ➕ 开始新聊天</p>
          </div>
          <div className="step-item">
            <span className="step-number">💬</span>
            <p className="step-text">在中间面板选择对话，继续聊天</p>
          </div>
          <div className="step-item">
            <span className="step-number">👤</span>
            <p className="step-text">点击左下角头像，设置个人资料</p>
          </div>
        </div>
        
        <div className="welcome-tips">
          <p className="tip-text">💡 更多功能即将上线！</p>
        </div>


      </div>
    </div>
  );
}
