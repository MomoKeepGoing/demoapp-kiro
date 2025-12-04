import './NavSidebar.css';

export type ViewType = 'messages' | 'profile';

export interface NavSidebarProps {
  currentView: ViewType;
  totalUnread: number;
  userProfile: { username: string } | null;
  avatarPreview: string | null;
  onViewChange: (view: ViewType) => void;
}

/**
 * NavSidebar - 左侧导航栏
 * 
 * 简化版设计：
 * - 顶部：Logo
 * - 中间：消息按钮（带未读数）
 * - 底部：用户头像按钮
 */
export function NavSidebar({
  currentView,
  totalUnread,
  userProfile,
  avatarPreview,
  onViewChange,
}: NavSidebarProps) {
  return (
    <div className="nav-sidebar">
      {/* 顶部 Logo */}
      <div className="nav-top">
        <div className="nav-logo">
          <div className="logo-icon">💬</div>
          <div className="logo-text">LinkUp</div>
        </div>
      </div>

      {/* 中间导航按钮 */}
      <div className="nav-middle">
        <button
          className={`nav-btn ${currentView === 'messages' ? 'nav-btn-active' : ''}`}
          onClick={() => onViewChange('messages')}
          title="消息"
        >
          <span className="nav-btn-icon">💬</span>
          {totalUnread > 0 && (
            <span className="nav-btn-badge">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* 底部用户头像 */}
      <div className="nav-bottom">
        <button
          className={`nav-avatar-btn ${currentView === 'profile' ? 'nav-avatar-active' : ''}`}
          onClick={() => onViewChange('profile')}
          title="个人资料"
        >
          {avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="" 
              className="nav-avatar-img"
            />
          ) : (
            <div className="nav-avatar-placeholder">
              {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
