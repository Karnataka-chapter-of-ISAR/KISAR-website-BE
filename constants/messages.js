export const MESSAGES = {

  GENERAL: {
    SERVER_OK:      'Server is up and running.',
    INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  },

  UPLOAD: {
    FILE_TOO_LARGE: 'The uploaded file exceeds the 5MB size limit.',
    UPLOAD_ERROR:   'The file could not be uploaded. Please try again.',
  },

  OTP: {
    SENT:              'A 6-digit verification code has been sent to your email. Please check your inbox.',
    INVALID_EMAIL:     'Please enter a valid email address.',
    INVALID_OR_EXPIRED:'The code you entered is invalid or has expired. Please request a new one.',
    TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Your code has been invalidated. Please request a new one.',
    RATE_LIMITED:      'You have requested too many codes. Please wait 15 minutes before trying again.',
    NOT_A_MEMBER:      'This email is not registered as a member. Please contact your administrator.',
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
    FETCH_SUCCESS:                'Members fetched successfully.',
    IMPORT_SUCCESS:              'Members imported successfully.',
    NO_FILE:                     'No file was uploaded. Please attach an Excel file.',
    INVALID_FILE_TYPE:           'Invalid file type. Please upload a valid .xlsx or .xls file.',
    PARSE_ERROR:                 'Failed to read the uploaded file. Ensure it is a valid Excel sheet.',
    EMPTY_SHEET:                 'The uploaded sheet contains no data rows.',
    VALIDATION_REJECTED:         'Upload rejected — conflicts found. Fix the rows below and re-upload.',
    VALIDATION_PASSED:           'Validation passed — ready to onboard.',
    BATCH_NOT_FOUND_OR_EXPIRED:  'This validated batch was not found or has expired. Please re-upload and validate again.',
    BATCH_CONFLICT_ON_CONFIRM:   'Some emails were added to the system after validation. Please re-upload and validate again.',
  },

  EVENTS: {
    CREATE_SUCCESS:     'Event created successfully.',
    UPDATE_SUCCESS:     'Event updated successfully.',
    DELETE_SUCCESS:     'Event deleted successfully.',
    FETCH_SUCCESS:      'Events fetched successfully.',
    VALIDATION_ERROR:   'Please fix the highlighted fields and try again.',
    REGISTER_SUCCESS:   'You have been registered for this event.',
    NOT_A_MEMBER:       'This email is not registered as a member. Please contact your administrator.',
    NOT_FOUND:          'Event not found.',
    ALREADY_REGISTERED: 'You are already registered for this event.',
    EVENT_FULL:         'This event has reached its capacity.',
  },

  NEWS: {
    CREATE_SUCCESS:   'Article created successfully.',
    UPDATE_SUCCESS:   'Article updated successfully.',
    DELETE_SUCCESS:   'Article deleted successfully.',
    FETCH_SUCCESS:    'Articles fetched successfully.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
    NOT_FOUND:        'Article not found.',
  },

  ADMIN: {
    TOKEN_MISSING: 'Admin access token is missing. Please log in again.',
    UNAUTHORIZED:  'You are not authorized to access admin resources.',
  },

};
