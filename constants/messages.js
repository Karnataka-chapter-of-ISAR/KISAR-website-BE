export const MESSAGES = {

  GENERAL: {
    SERVER_OK:      'Server is up and running.',
    INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  },

  OTP: {
    SENT:              'A 6-digit verification code has been sent to your email. Please check your inbox.',
    INVALID_EMAIL:     'Please enter a valid email address.',
    INVALID_OR_EXPIRED:'The code you entered is invalid or has expired. Please request a new one.',
    TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Your code has been invalidated. Please request a new one.',
    RATE_LIMITED:      'You have requested too many codes. Please wait 15 minutes before trying again.',
  },

  AUTH: {
    LOGIN_SUCCESS:  'You have logged in successfully. Welcome back!',
    LOGOUT_SUCCESS: 'You have been logged out successfully. See you next time!',
  },

  TOKEN: {
    MISSING:          'You are not logged in. Please log in to continue.',
    INVALID_OR_EXPIRED:'Your session has expired. Please log in again.',
    REVOKED:          'You have been signed out from another session. Please log in again.',
  },

  USER: {
    FETCH_SUCCESS: 'User details fetched successfully.',
  },

};
