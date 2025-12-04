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

const client = generateClient<Schema>()

type ViewType = 'welcome' | 'profile'

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
              <div className="welcome-icon">💬</div>
              <h1 className="welcome-title">欢迎来到 LinkUp</h1>
              <p className="welcome-subtitle">
                开始与朋友和家人保持联系
              </p>
              
              <div className="welcome-features">
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3>端到端加密</h3>
                  <p>您的消息和通话都经过加密保护</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>实时通讯</h3>
                  <p>即时发送和接收消息</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3>跨平台同步</h3>
                  <p>在所有设备上无缝使用</p>
                </div>
              </div>

              <div className="welcome-actions">
                <button 
                  className="action-button primary"
                  onClick={() => setCurrentView('profile')}
                >
                  查看个人资料
                </button>
                <p className="coming-soon-text">
                  💡 聊天功能即将推出，敬请期待！
                </p>
              </div>
            </div>
          </div>
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
      components={{
        Header() {
          return (
            <View textAlign="center" padding="xl">
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>💬</div>
              <Heading level={3} color="#075e54">
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
              <Heading level={4} textAlign="center" padding="medium" color="#075e54">
                登录您的账户
              </Heading>
            )
          },
          Footer() {
            return (
              <View textAlign="center" padding="medium">
                <Text fontSize="small" color="gray">
                  还没有账户？点击上方"创建账户"注册
                </Text>
              </View>
            )
          },
        },
        SignUp: {
          Header() {
            return (
              <Heading level={4} textAlign="center" padding="medium" color="#075e54">
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
              <Heading level={4} textAlign="center" padding="medium" color="#075e54">
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
                      color: '#075e54',
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
