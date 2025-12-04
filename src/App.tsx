import { useState, useEffect, lazy, Suspense } from 'react'
import { Authenticator, useAuthenticator, View, Text, Heading } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import './App.css'
import { Loading } from './components/Loading'
import { NavSidebar, type ViewType } from './components/layout/NavSidebar'
import { ConversationListPanel, type Conversation } from './components/layout/ConversationListPanel'
import { WelcomeView } from './components/layout/WelcomeView'
import { ContactSelector } from './components/layout/ContactSelector'
import { ConversationView } from './components/messages/ConversationView'
import { generateClient } from 'aws-amplify/data'
import { getUrl } from 'aws-amplify/storage'
import { resendSignUpCode } from 'aws-amplify/auth'
import type { Schema } from '../amplify/data/resource'

// Lazy load Profile component for code splitting
const Profile = lazy(() => import('./components/Profile').then(module => ({ default: module.Profile })))

const client = generateClient<Schema>()

type ContentPanelType = 'welcome' | 'conversation' | 'contactSelector' | 'profile'

interface UserProfile {
  userId: string
  username: string
  avatarUrl?: string
  email: string
}

// Main application component shown after authentication
function MainApp() {
  const { signOut, user } = useAuthenticator((context) => [context.user])
  
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>('messages')
  const [contentPanel, setContentPanel] = useState<ContentPanelType>('welcome')
  
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  // Conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile()
    // Note: 不再需要 loadUnreadCount()，由 ConversationListPanel 负责
  }, [user])

  // Subscribe to new messages to keep unread count in sync
  useEffect(() => {
    if (!user) return

    console.log('[App] Setting up message subscription for user:', user.userId)

    // NOTE: Don't use filter here because Amplify's authorization system automatically
    // filters based on ownerDefinedIn fields (senderId and receiverId).
    const messageSubscription = client.models.Message.onCreate().subscribe({
      next: async (data) => {
        console.log('[App] Received new message:', data)
        // Only process messages where current user is the receiver
        if (data && data.receiverId === user.userId) {
          console.log('[App] Message is for current user, updating conversation')
          
          // Update receiver's conversation
          const userConversationId = `${user.userId}_${data.senderId}`
          
          // 检查用户是否正在查看这个对话
          const isViewingThisConversation = selectedConversationId === userConversationId && contentPanel === 'conversation'
          console.log('[App] Is viewing this conversation:', isViewingThisConversation)
          
          try {
            const { data: existing } = await client.models.Conversation.get({
              id: userConversationId,
            })
            
            if (existing) {
              console.log('[App] Updating existing conversation, current unreadCount:', existing.unreadCount)
              // 如果用户正在查看对话，不增加未读数；否则 +1
              const newUnreadCount = isViewingThisConversation ? 0 : (existing.unreadCount ?? 0) + 1
              await client.models.Conversation.update({
                id: userConversationId,
                lastMessageContent: data.content.substring(0, 100),
                lastMessageAt: data.createdAt || new Date().toISOString(),
                unreadCount: newUnreadCount,
                updatedAt: new Date().toISOString(),
              })
              console.log('[App] Updated conversation, new unreadCount:', newUnreadCount)
            } else {
              console.log('[App] Creating new conversation')
              // Create new conversation - need to get sender's profile
              const { data: senderProfile } = await client.models.UserProfile.get({
                userId: data.senderId,
              })
              
              // 新对话：如果用户正在查看，未读数为0；否则为1
              const initialUnreadCount = isViewingThisConversation ? 0 : 1
              await client.models.Conversation.create({
                id: userConversationId,
                userId: user.userId,
                otherUserId: data.senderId,
                otherUserName: senderProfile?.username || `User_${data.senderId.substring(0, 8)}`,
                lastMessageContent: data.content.substring(0, 100),
                lastMessageAt: data.createdAt || new Date().toISOString(),
                unreadCount: initialUnreadCount,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              console.log('[App] Created new conversation with unreadCount:', initialUnreadCount)
            }
            
            // Note: 未读数由 ConversationListPanel 自动更新，不需要手动刷新
          } catch (err) {
            console.error('[App] Error updating conversation:', err)
          }
        }
      },
      error: (err) => console.error('[App] Message subscription error:', err),
    })

    return () => messageSubscription.unsubscribe()
  }, [user])

  // Note: 总未读数现在由 ConversationListPanel 通过 onUnreadCountChange 回调更新
  // 不再需要订阅对话更新来重新计算

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



  // Handle view changes from nav sidebar
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    
    if (view === 'messages') {
      // Show welcome if no conversation selected
      if (!selectedConversationId) {
        setContentPanel('welcome')
      }
    } else if (view === 'profile') {
      setContentPanel('profile')
      setSelectedConversationId(null)
    }
  }

  // Handle new chat button click
  const handleNewChat = () => {
    setContentPanel('contactSelector')
    setSelectedConversationId(null)
  }

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string, conversation: Conversation) => {
    setSelectedConversationId(conversationId)
    setSelectedConversation(conversation)
    setContentPanel('conversation')
  }

  // Handle contact selection (from ContactSelector)
  const handleContactSelect = async (userId: string, username: string) => {
    // Check if conversation already exists
    const conversationId = `${user.userId}_${userId}`
    
    try {
      const { data: existing } = await client.models.Conversation.get({
        id: conversationId,
      })
      
      if (existing) {
        // Open existing conversation
        const conversation: Conversation = {
          id: existing.id,
          userId: existing.userId,
          otherUserId: existing.otherUserId,
          otherUserName: existing.otherUserName,
          lastMessageContent: existing.lastMessageContent,
          lastMessageAt: existing.lastMessageAt,
          unreadCount: existing.unreadCount ?? 0,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        }
        setSelectedConversationId(conversationId)
        setSelectedConversation(conversation)
      } else {
        // Create new conversation object for first-time chat
        const newConversation: Conversation = {
          id: conversationId,
          userId: user.userId,
          otherUserId: userId,
          otherUserName: username,
          lastMessageContent: '',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setSelectedConversationId(conversationId)
        setSelectedConversation(newConversation)
      }
      
      setContentPanel('conversation')
    } catch (err) {
      console.error('Error checking conversation:', err)
      // Still open conversation view even if check fails
      const newConversation: Conversation = {
        id: conversationId,
        userId: user.userId,
        otherUserId: userId,
        otherUserName: username,
        lastMessageContent: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSelectedConversationId(conversationId)
      setSelectedConversation(newConversation)
      setContentPanel('conversation')
    }
  }

  // Handle back from content panels
  const handleBackToWelcome = () => {
    setContentPanel('welcome')
    setSelectedConversationId(null)
    setSelectedConversation(null)
    // Note: 未读数由 ConversationListPanel 自动更新
  }

  return (
    <div className="main-app">
      {/* Left navigation sidebar */}
      <aside className="app-nav-sidebar">
        <NavSidebar
          currentView={currentView}
          totalUnread={totalUnreadMessages}
          userProfile={userProfile}
          avatarPreview={avatarPreview}
          onViewChange={handleViewChange}
        />
      </aside>

      {/* Middle conversation list panel */}
      <aside className="app-middle-panel">
        <ConversationListPanel
          currentUserId={user.userId}
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
          isNewChatActive={contentPanel === 'contactSelector'}
          onUnreadCountChange={setTotalUnreadMessages}
        />
      </aside>

      {/* Right content panel */}
      <main className="app-content-panel">
        {contentPanel === 'welcome' && <WelcomeView />}
        
        {contentPanel === 'conversation' && selectedConversation && (
          <ConversationView
            conversationId={selectedConversation.id}
            otherUserId={selectedConversation.otherUserId}
            otherUserName={selectedConversation.otherUserName}
            currentUserId={user.userId}
            onBack={handleBackToWelcome}
            registerMessageHandler={() => {}}
          />
        )}
        
        {contentPanel === 'contactSelector' && (
          <ContactSelector
            onBack={handleBackToWelcome}
            onSelectContact={handleContactSelect}
          />
        )}
        
        {contentPanel === 'profile' && (
          <div className="profile-wrapper">
            <div className="profile-header">
              <button 
                className="btn-back"
                onClick={handleBackToWelcome}
                title="返回"
                aria-label="返回"
              >
                ←
              </button>
              <div className="header-content">
                <h2>个人资料</h2>
                <p className="header-subtitle">管理您的个人信息</p>
              </div>
            </div>
            <div className="profile-content">
              <Suspense fallback={<Loading text="加载中..." />}>
                <Profile onProfileUpdate={loadUserProfile} onSignOut={signOut} />
              </Suspense>
            </div>
          </div>
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
