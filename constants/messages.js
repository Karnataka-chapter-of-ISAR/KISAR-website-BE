export const MESSAGES = {

  GENERAL: {
    SERVER_OK: 'Server is up and running.',
    DB_UNAVAILABLE: 'Server is up, but the database connection is unavailable.',
    INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  },

  UPLOAD: {
    FILE_TOO_LARGE: 'The uploaded file exceeds the 5MB size limit.',
    UPLOAD_ERROR: 'The file could not be uploaded. Please try again.',
    UPLOAD_SUCCESS: 'File uploaded successfully.',
    FILE_REQUIRED: 'Please upload a file.',
  },

  OTP: {
    SENT: 'A 6-digit verification code has been sent to your email. Please check your inbox.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_OR_EXPIRED: 'The code you entered is invalid or has expired. Please request a new one.',
    TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Your code has been invalidated. Please request a new one.',
    RATE_LIMITED: 'You have requested too many codes. Please wait 15 minutes before trying again.',
    SEND_FAILED: 'We could not send the verification code right now. Please try again in a few minutes.',
    VERIFY_RATE_LIMITED: 'Too many verification attempts. Please wait 15 minutes before trying again.',
    RESEND_COOLDOWN: 'A code was sent to this email a moment ago. Please check your inbox, or wait a minute before requesting another.',
    EMAIL_RATE_LIMITED: 'Too many codes have been requested for this email. Please try again in an hour.',
    NOT_A_MEMBER: 'This email is not registered as a member. Please contact your administrator.',
  },

  AUTH: {
    LOGIN_SUCCESS: 'You have logged in successfully. Welcome back!',
    LOGOUT_SUCCESS: 'You have been logged out successfully. See you next time!',
  },

  TOKEN: {
    MISSING: 'You are not logged in. Please log in to continue.',
    INVALID_OR_EXPIRED: 'Your session has expired. Please log in again.',
    REVOKED: 'You have been signed out from another session. Please log in again.',
    REFRESHED: 'Access token refreshed successfully.',
  },

  MEMBERS: {
    FETCH_SUCCESS: 'Members fetched successfully.',
    PROFILE_FETCH_SUCCESS: 'Profile fetched successfully.',
    SESSION_MEMBER_NOT_FOUND: 'Your session is no longer valid. Please log in again.',
    IMPORT_SUCCESS: 'Members imported successfully.',
    NO_FILE: 'No file was uploaded. Please attach an Excel file.',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid .xlsx or .xls file.',
    PARSE_ERROR: 'Failed to read the uploaded file. Ensure it is a valid Excel sheet.',
    EMPTY_SHEET: 'The uploaded sheet contains no data rows.',
    VALIDATION_REJECTED: 'Upload rejected — conflicts found. Fix the rows below and re-upload.',
    VALIDATION_PASSED: 'Validation passed — ready to onboard.',
    BATCH_NOT_FOUND_OR_EXPIRED: 'This validated batch was not found or has expired. Please re-upload and validate again.',
    BATCH_CONFLICT_ON_CONFIRM: 'Some emails were added to the system after validation. Please re-upload and validate again.',
    CREATE_SUCCESS: 'Member added successfully.',
    UPDATE_SUCCESS: 'Member updated successfully.',
    NOT_FOUND: 'Member not found.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
    EMAIL_ALREADY_EXISTS: 'A member with this email already exists.',
    ISAR_MEMBER_ID_ALREADY_EXISTS: 'A member with this ISAR member ID already exists.',
    EDIT_REQUEST_SUBMITTED: 'Your changes have been submitted for review. The affected fields are locked until an admin approves or rejects them.',
    PROFILE_UPDATE_SUCCESS: 'Your profile has been updated.',
    EDIT_REQUEST_APPROVED: 'Edit request approved and applied to the member profile.',
    EDIT_REQUEST_REJECTED: 'Edit request rejected.',
    EDIT_REQUEST_NOT_FOUND: 'This edit request was not found or has already been resolved.',
    EDIT_FIELDS_LOCKED: 'One or more of these fields already have a pending change awaiting approval.',
    EDIT_NO_CHANGES: 'No changes were detected.',
    INVALID_EDIT_REQUEST_STATUS: 'Status must be one of: pending, approved, rejected.',
    REJECTION_REASON_REQUIRED: 'A reason is required when rejecting an edit request.',
    EXPORT_IMPORT_RATE_LIMITED: 'Too many export/import requests. Please wait a while before trying again.',
  },

  EVENTS: {
    CREATE_SUCCESS: 'Event created successfully.',
    UPDATE_SUCCESS: 'Event updated successfully.',
    DELETE_SUCCESS: 'Event deleted successfully.',
    FETCH_SUCCESS: 'Events fetched successfully.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
    REGISTER_SUCCESS: 'You have been registered for this event.',
    NOT_A_MEMBER: 'This email is not registered as a member. Please contact your administrator.',
    NOT_FOUND: 'Event not found.',
    ALREADY_REGISTERED: 'You are already registered for this event.',
    ATTENDEES_FETCH_SUCCESS: 'Attendees fetched successfully.',
    PAST_EVENT_NOT_DELETABLE: 'Past events cannot be deleted.',
    END_DATE_BEFORE_START: 'End date cannot be before the start date.',
    PAID_REGISTRATIONS_EXIST: 'This event still has paid registrations that must be refunded before it can be deleted.',
  },

  REGISTRATION: {
    OTP_SENT: 'A 6-digit verification code has been sent to your email. Please check your inbox.',
    EMAIL_VERIFIED: 'Your email has been verified.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address before registering.',
    MEMBERS_ONLY: 'This event is open to KISAR members only.',
    EVENT_CLOSED: 'Registration is closed because this event has already taken place.',
    REGISTRATIONS_CLOSED: 'Registration for this event is closed.',
    EXTERNAL_REGISTRATION: 'Registration for this event happens on an external site. Please use the registration link.',
    REGISTERED: 'You have been registered for this event.',
    PAYMENT_REQUIRED: 'Registration saved. Complete the payment to confirm your seat.',
    STATUS_FETCH_SUCCESS: 'Registration status fetched successfully.',
    NOT_FOUND: 'Registration not found.',
    INVOICE_NOT_FOUND: 'No invoice exists for this registration.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
  },

  REFUNDS: {
    INITIATED: 'Refunds have been initiated.',
    STATUS_FETCH_SUCCESS: 'Refund status fetched successfully.',
    SINGLE_INITIATED: 'Refund initiated for this registration.',
    NOT_REFUNDABLE: 'This registration has no paid amount that can be refunded.',
    PAST_EVENT: 'Refunds for a whole event can only be started for upcoming events.',
    GATEWAY_FAILED: 'The refund could not be started. You can retry it from the refund status.',
  },

  PAYMENTS: {
    NOT_CONFIGURED: 'Online payments are not available right now. Please try again later.',
    GATEWAY_ERROR: 'We could not reach the payment gateway. Please try again in a few minutes.',
    INVALID_SIGNATURE: 'Invalid webhook signature.',
  },

  NEWS: {
    CREATE_SUCCESS: 'Article created successfully.',
    UPDATE_SUCCESS: 'Article updated successfully.',
    DELETE_SUCCESS: 'Article deleted successfully.',
    FETCH_SUCCESS: 'Articles fetched successfully.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
    NOT_FOUND: 'Article not found.',
  },

  GALLERY: {
    CREATE_SUCCESS: 'Photo added successfully.',
    UPDATE_SUCCESS: 'Photo updated successfully.',
    DELETE_SUCCESS: 'Photo deleted successfully.',
    FETCH_SUCCESS: 'Gallery fetched successfully.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
    NOT_FOUND: 'Photo not found.',
    IMAGE_REQUIRED: 'Please upload an image.',
  },

  ADMIN: {
    TOKEN_MISSING: 'Admin access token is missing. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to access admin resources.',
    VALIDATION_ERROR: 'Please correct the highlighted fields.',
    CREATE_SUCCESS: 'Admin user added successfully. A notification email has been sent.',
    LIST_SUCCESS: 'Admin users fetched successfully.',
    DELETE_SUCCESS: 'Admin user removed successfully.',
    NOT_FOUND: 'Admin user not found.',
    SUPER_ADMIN_REQUIRED: 'Only the super admin can manage admin users.',
    CANNOT_DELETE_SELF: 'You cannot remove your own admin account.',
    EMAIL_ALREADY_EXISTS: 'An admin with this email already exists.',
    OTP_SENT_IF_ADMIN: 'If this email belongs to an administrator, a verification code has been sent.',
  },

  MAILS: {
    SEND_SUCCESS: 'Emails sent successfully.',
    SEND_PARTIAL: 'Some emails could not be sent.',
    SEND_FAILED: 'None of the emails could be sent. Please try again in a few minutes.',
    NO_RECIPIENTS_FOUND: 'None of the selected recipients were found.',
    VALIDATION_ERROR: 'Please fix the highlighted fields and try again.',
  },

  DASHBOARD: {
    KPIS_FETCH_SUCCESS: 'Dashboard KPIs fetched successfully.',
    OVERVIEW_FETCH_SUCCESS: 'Dashboard overview fetched successfully.',
    ACTIVITY_FETCH_SUCCESS: 'Recent activity fetched successfully.',
    NO_ACTIVITY: 'No activities this month yet.',
  },

};
