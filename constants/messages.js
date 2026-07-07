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
    MISSING:           'You are not logged in. Please log in to continue.',
    INVALID_OR_EXPIRED:'Your session has expired. Please log in again.',
    REVOKED:           'You have been signed out from another session. Please log in again.',
    REFRESHED:         'Access token refreshed successfully.',
  },

  USER: {
    FETCH_SUCCESS: 'User details fetched successfully.',
  },

  MEMBERS: {
    IMPORT_SUCCESS:          'Members imported successfully.',
    NO_FILE:                 'No file was uploaded. Please attach an Excel file.',
    INVALID_FILE_TYPE:       'Invalid file type. Please upload a valid .xlsx or .xls file.',
    PARSE_ERROR:             'Failed to read the uploaded file. Ensure it is a valid Excel sheet.',
    EMPTY_SHEET:             'The uploaded sheet contains no data rows.',
    MISSING_REQUIRED_FIELDS: 'Some rows are missing required fields (name, email). No records were saved.',
    DUPLICATE_IN_SHEET:      'The sheet contains duplicate email addresses. No records were saved.',
    DUPLICATE_EMAILS:        'Some emails already exist in the database. No records were saved.',
  },

  EVENTS: {
    CREATE_SUCCESS:  'Event created successfully.',
    FETCH_SUCCESS:   'Events fetched successfully.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
  },

  ADMIN: {
    TOKEN_MISSING: 'Admin access token is missing. Please log in again.',
    UNAUTHORIZED:  'You are not authorized to access admin resources.',
  },

};
