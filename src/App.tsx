import { useState, useEffect, lazy, Suspense } from 'react'
import { Authenticator, useAuthenticator, View, Text, Heading } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import './App.css'
import { Loading } from './components/Loading'
import { generateClient } from 'aws-amplify/data'
import { getUrl } from 'aws-amplify/storage'
import { resendSignUpCode } from 'aws-amplify/auth'
import type { Schema } from '../amplify/data/resource'

// Lazy load Profile component for code splitting
// Performance optimization: Only load Profile when needed
const Profile = lazy(() => import('./components/Profile').then(module => ({ default: module.Profile })))
const ContactsPage = lazy(() => import('./components/contacts/ContactsPage').then(module => ({ default: module.ContactsPage })))

const client = generateClient<Schema>()

type ViewType = 'welcome' | 'profile' | 'contacts'

interface UserProfile {
  userId: string
  username: string
  avatarUrl?: string
  email: string
}

// Main application component shown after authentication
function MainApp() {
  const { signOut, user } = useAuthenticator((context) => [context.user])
  const [currentView, setCurrentView] = useState<ViewType>('welcome')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data: profile } = await client.models.UserProfile.get({
        userId: user.userId,
      })

      if (profile) {
        setUserProfile(profile as UserProfile)

        // Load avatar if exists
        if (profile.avatarUrl) {
          try {
            const urlResult = await getUrl({
              path: profile.avatarUrl,
            })
            setAvatarPreview(urlResult.url.toString())
          } catch (err) {
            console.error('Error loading avatar:', err)
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  return (
    <div className="main-app">
      {/* Left sidebar - WhatsApp style */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <div className="logo-icon">💬</div>
            <span className="app-name">LinkUp</span>
          </div>
          <button onClick={signOut} className="sign-out-button" title="登出">
            <span className="sign-out-icon">⎋</span>
          </button>
        </div>

        <div className="sidebar-search">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索或开始新对话"
              className="search-input"
              disabled
            />
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'welcome' ? 'active' : ''}`}
            onClick={() => setCurrentView('welcome')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">首页</span>
          </button>
          <button
            className={`nav-item ${currentView === 'contacts' ? 'active' : ''}`}
            onClick={() => setCurrentView('contacts')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">联系人</span>
          </button>
          <button
            className="nav-item disabled"
            disabled
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">聊天</span>
            <span className="coming-soon-badge">即将推出</span>
          </button>
        </nav>

        <div className="sidebar-content">
          <div className="chat-list-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>聊天功能即将推出</h3>
            <p>我们正在开发实时聊天功能，敬请期待！</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <button 
            className="user-info"
            onClick={() => setCurrentView('profile')}
            title="查看个人资料"
          >
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="用户头像" 
                className="user-avatar-small user-avatar-image"
              />
            ) : (
              <div className="user-avatar-small">
                {userProfile?.username?.charAt(0).toUpperCase() || 
                 user?.signInDetails?.loginId?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="user-details">
              <span className="user-name">
                {userProfile?.username || user?.signInDetails?.loginId || '新用户'}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="app-main">
        {currentView === 'welcome' ? (
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
                  <p className="step-text">点击左侧"联系人"添加好友</p>
                </div>
                <div className="step-item">
                  <span className="step-number">2</span>
                  <p className="step-text">管理您的个人资料信息</p>
                </div>
                <div className="step-item">
                  <span className="step-number">3</span>
                  <p className="step-text">等待聊天功能上线</p>
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
        ) : currentView === 'contacts' ? (
          <Suspense fallback={<Loading text="加载中..." />}>
            <ContactsPage onBack={() => setCurrentView('welcome')} />
          </Suspense>
        ) : (
          <>
            <div className="main-header">
              <button 
                className="back-button"
                onClick={() => setCurrentView('welcome')}
                title="返回"
              >
                ←
              </button>
              <div className="header-content">
                <h2>个人资料</h2>
                <p className="header-subtitle">管理您的个人信息</p>
              </div>
            </div>
            <div className="main-content">
              <Suspense fallback={<Loading text="加载中..." />}>
                <Profile onProfileUpdate={loadUserProfile} />
              </Suspense>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function App() {
  // Custom form fields configuration
  const formFields = {
    signUp: {
      email: {
        label: '邮箱地址',
        placeholder: '请输入您的邮箱',
        isRequired: true,
        order: 1,
      },
      password: {
        label: '密码',
        placeholder: '至少8个字符，包含大小写字母、数字和特殊字符',
        isRequired: true,
        order: 2,
      },
      confirm_password: {
        label: '确认密码',
        placeholder: '请再次输入密码',
        isRequired: true,
        order: 3,
      },
    },
    signIn: {
      username: {
        label: '邮箱地址',
        placeholder: '请输入您的邮箱',
        isRequired: true,
      },
      password: {
        label: '密码',
        placeholder: '请输入密码',
        isRequired: true,
      },
    },
    confirmSignUp: {
      confirmation_code: {
        label: '验证码',
        placeholder: '请输入邮箱中收到的6位验证码',
        isRequired: true,
      },
    },
    resetPassword: {
      username: {
        label: '邮箱地址',
        placeholder: '请输入您的邮箱',
        isRequired: true,
      },
    },
    confirmResetPassword: {
      confirmation_code: {
        label: '验证码',
        placeholder: '请输入邮箱中收到的验证码',
        isRequired: true,
      },
      password: {
        label: '新密码',
        placeholder: '至少8个字符，包含大小写字母、数字和特殊字符',
        isRequired: true,
      },
      confirm_password: {
        label: '确认新密码',
        placeholder: '请再次输入新密码',
        isRequired: true,
      },
    },
  }

  return (
    <Authenticator
      formFields={formFields}
      loginMechanisms={['email']}
      signUpAttributes={['email']}
      components={{
        Header() {
          return (
            <View textAlign="center" padding="xl">
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>💬</div>
              <Heading level={3} color="#008069">
                LinkUp
              </Heading>
              <Text fontSize="small" color="gray" marginTop="xs">
                使用邮箱注册或登录
              </Text>
            </View>
          )
        },
        SignIn: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#008069">
                登录您的账户
              </Heading>
            )
          },
          Footer() {
            const { toForgotPassword } = useAuthenticator();
            return (
              <View textAlign="center" padding="medium">
                <Text fontSize="small" color="gray" marginBottom="xs">
                  还没有账户？点击上方"创建账户"注册
                </Text>
                <button
                  onClick={toForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00a884',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '8px',
                    marginTop: '8px',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#008069';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#00a884';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  忘记密码？
                </button>
              </View>
            )
          },
        },
        ForgotPassword: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#008069">
                重置密码
              </Heading>
            )
          },
          Footer() {
            return (
              <View textAlign="center" padding="medium">
                <Text fontSize="small" color="gray">
                  输入您的邮箱地址，我们将发送验证码
                </Text>
                <Text fontSize="small" color="gray" marginTop="xs">
                  请检查您的收件箱和垃圾邮件文件夹
                </Text>
              </View>
            )
          },
        },
        ConfirmResetPassword: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#008069">
                设置新密码
              </Heading>
            )
          },
          Footer() {
            const { user } = useAuthenticator((context) => [context.user]);
            // Get the username from the hidden input field
            const usernameInput = typeof document !== 'undefined' 
              ? document.querySelector('input[name="username"]') as HTMLInputElement
              : null;
            const email = usernameInput?.value || user?.username || '';
            
            return (
              <View textAlign="center" padding="medium">
                {email && (
                  <Text fontSize="small" color="#008069" fontWeight="500" marginBottom="xs">
                    正在为 {email} 重置密码
                  </Text>
                )}
                <Text fontSize="small" color="gray">
                  请输入邮箱中收到的验证码和新密码
                </Text>
              </View>
            )
          },
        },
        SignUp: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#008069">
                创建新账户
              </Heading>
            )
          },
          Footer() {
            return (
              <View textAlign="center" padding="medium">
                <Text fontSize="small" color="gray">
                  已有账户？点击上方"登录"
                </Text>
                <Text fontSize="small" color="gray" marginTop="xs">
                  密码要求：至少8个字符，包含大小写字母、数字和特殊字符
                </Text>
              </View>
            )
          },
        },
        ConfirmSignUp: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#008069">
                验证您的邮箱
              </Heading>
            )
          },
          Footer() {
            const handleResendCode = async () => {
              // Get email from the hidden input field that Authenticator uses
              const emailInput = document.querySelector('input[name="username"]') as HTMLInputElement
              const email = emailInput?.value
              
              if (email) {
                try {
                  await resendSignUpCode({ username: email })
                  alert('验证码已重新发送到您的邮箱')
                } catch (error: any) {
                  console.error('重新发送验证码失败:', error)
                  alert('重新发送失败，请稍后重试')
                }
              } else {
                alert('无法获取邮箱地址，请返回重新注册')
              }
            }

            return (
              <View textAlign="center" padding="medium">
                <Text fontSize="small" color="gray">
                  我们已向您的邮箱发送了验证码
                </Text>
                <Text fontSize="small" color="gray" marginTop="xs">
                  请查收并输入验证码以完成注册
                </Text>
                <Text fontSize="small" color="gray" marginTop="xs">
                  没收到？请检查垃圾邮件文件夹或点击下方按钮
                </Text>
                <View marginTop="small">
                  <button
                    onClick={handleResendCode}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#008069',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      padding: '8px',
                    }}
                  >
                    重新发送验证码
                  </button>
                </View>
              </View>
            )
          },
        },

      }}
    >
      <MainApp />
    </Authenticator>
  )
}

export default App
