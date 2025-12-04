import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * 
 * Password policy defaults (already configured by Amplify):
 * - MinLength: 8 characters
 * - requireLowercase: true
 * - requireUppercase: true
 * - requireNumbers: true
 * - requireSymbols: true
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: '验证您的账户',
      verificationEmailBody: (createCode) => 
        `您的验证码是: ${createCode()}。请在应用中输入此验证码以完成注册。`,
    },
  },
  userAttributes: {
    profilePicture: {
      mutable: true,
      required: false,
    },
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});
