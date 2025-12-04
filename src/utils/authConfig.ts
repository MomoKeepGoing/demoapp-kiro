// Authentication configuration and utilities
import { translations } from '@aws-amplify/ui-react'

// Custom Chinese translations for Authenticator
export const customTranslations = {
  zh: {
    'Sign In': '登录',
    'Sign Up': '注册',
    'Sign Out': '登出',
    'Sign in': '登录',
    'Sign up': '注册',
    'Sign in to your account': '登录您的账户',
    'Create a new account': '创建新账户',
    'Reset your password': '重置密码',
    'Enter your Email': '请输入您的邮箱',
    'Enter your Password': '请输入密码',
    'Please confirm your Password': '请确认密码',
    'Email': '邮箱地址',
    'Password': '密码',
    'Confirm Password': '确认密码',
    'Code': '验证码',
    'Confirmation Code': '验证码',
    'New Password': '新密码',
    'Username': '邮箱地址',
    'Enter your username': '请输入您的邮箱',
    'Forgot your password?': '忘记密码？',
    'Reset Password': '重置密码',
    'Send code': '发送验证码',
    'Back to Sign In': '返回登录',
    'Resend Code': '重新发送验证码',
    'Submit': '提交',
    'Confirm': '确认',
    'Verify': '验证',
    'Skip': '跳过',
    'Verify Contact': '验证联系方式',
    'Code *': '验证码 *',
    'New password': '新密码',
    'Confirm Password *': '确认密码 *',
    'Password must have at least 8 characters': '密码必须至少8个字符',
    'Password must have numbers': '密码必须包含数字',
    'Password must have special characters': '密码必须包含特殊字符',
    'Password must have upper case letters': '密码必须包含大写字母',
    'Password must have lower case letters': '密码必须包含小写字母',
    'Passwords must match': '两次输入的密码必须一致',
    
    // Error messages
    'User does not exist.': '用户不存在',
    'Incorrect username or password.': '邮箱或密码错误',
    'User is not confirmed.': '账户未激活。如果您之前注册过但未完成验证，请点击"创建账户"重新获取验证码',
    'User already exists': '该邮箱已被注册',
    'Invalid verification code provided, please try again.': '验证码错误，请重试',
    'Invalid password format': '密码格式不正确',
    'An account with the given email already exists.': '该邮箱已被注册',
    'Username cannot be empty': '邮箱不能为空',
    'Custom auth lambda trigger is not configured for the user pool.': '认证配置错误',
    'Password did not conform with policy: Password must have uppercase characters': '密码必须包含大写字母',
    'Password did not conform with policy: Password must have lowercase characters': '密码必须包含小写字母',
    'Password did not conform with policy: Password must have numeric characters': '密码必须包含数字',
    'Password did not conform with policy: Password must have symbol characters': '密码必须包含特殊字符',
    'Password did not conform with policy: Password not long enough': '密码长度不足',
    '1 validation error detected: Value at \'password\' failed to satisfy constraint: Member must have length greater than or equal to 8': '密码必须至少8个字符',
    'Invalid email address format.': '邮箱格式不正确',
    'Network error': '网络连接失败，请检查网络后重试',
    
    // Success messages
    'Your code is on the way. To log in, enter the code we sent you. It may take a minute to arrive.': '验证码已发送到您的邮箱，请查收并输入。可能需要几分钟才能收到。',
    'Account recovery requires verified contact information': '账户恢复需要已验证的联系方式',
    
    // Additional messages
    'We Sent A Code': '我们已发送验证码',
    'We Texted You': '我们已发送短信',
    'We Emailed You': '我们已发送邮件',
    'Your code is on the way. To log in, enter the code we emailed to': '验证码已发送。请输入我们发送到以下邮箱的验证码：',
    'It may take a minute to arrive.': '可能需要几分钟才能收到。',
    'Lost your code?': '没收到验证码？',
    'Resend a new code': '重新发送验证码',
    'or': '或',
    'Confirm Sign Up': '确认注册',
    'Confirming Sign Up': '正在确认注册',
    'Enter your code': '请输入验证码',
    'Confirm SMS Code': '确认短信验证码',
    'Confirm TOTP Code': '确认验证码',
  },
}

// Merge custom translations with default translations
export const getTranslations = () => {
  return {
    ...translations,
    zh: {
      ...translations.zh,
      ...customTranslations.zh,
    },
  }
}

// Error message mapping for better user experience
export const getErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.toString() || ''
  
  // Map common error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'UsernameExistsException': '该邮箱已被注册。如果是您的账户但未完成验证，请点击"创建账户"并使用相同邮箱重新获取验证码',
    'InvalidPasswordException': '密码必须至少8个字符，包含大小写字母、数字和特殊字符',
    'CodeMismatchException': '验证码错误，请检查后重试',
    'ExpiredCodeException': '验证码已过期，请点击"重新发送验证码"',
    'NotAuthorizedException': '邮箱或密码错误',
    'UserNotConfirmedException': '账户未激活。请点击"创建账户"并使用相同邮箱重新获取验证码',
    'UserNotFoundException': '用户不存在',
    'InvalidParameterException': '输入参数无效',
    'TooManyRequestsException': '请求过于频繁，请稍后再试',
    'LimitExceededException': '超出请求限制，请稍后再试',
    'NetworkError': '网络连接失败，请检查网络后重试',
  }
  
  // Check if error code exists in map
  if (error?.name && errorMap[error.name]) {
    return errorMap[error.name]
  }
  
  // Check if error message contains known patterns
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value
    }
  }
  
  // Check for specific error patterns in message
  if (errorMessage.includes('already exists')) {
    return '该邮箱已被注册。如果是您的账户但未完成验证，请点击"创建账户"并使用相同邮箱重新获取验证码'
  }
  if (errorMessage.includes('password') && errorMessage.includes('policy')) {
    return '密码不符合安全要求：必须至少8个字符，包含大小写字母、数字和特殊字符'
  }
  if (errorMessage.includes('verification code')) {
    return '验证码错误或已过期，请点击"重新发送验证码"'
  }
  if (errorMessage.includes('not confirmed')) {
    return '账户未激活。请点击"创建账户"并使用相同邮箱重新获取验证码'
  }
  
  // Return original message if no mapping found
  return errorMessage || '操作失败，请稍后重试'
}

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: '密码必须至少8个字符' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' }
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符' }
  }
  return { valid: true }
}
