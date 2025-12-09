/**
 * System Messages Constants
 * Centralized repository for all system messages used across the wallet service
 */

// ==================== GENERAL MESSAGES ====================
export const INTERNAL_SERVER_ERROR =
  'An unexpected error occurred. Please try again later.';
export const VALIDATION_ERROR = 'Validation failed. Please check your input.';
export const UNAUTHORIZED_ACCESS =
  'You are not authorized to perform this action.';
export const RESOURCE_NOT_FOUND = 'The requested resource was not found.';
export const OPERATION_SUCCESSFUL = 'Operation completed successfully.';

// ==================== AUTHENTICATION MESSAGES ====================
export const USER_REGISTERED = 'User registered successfully.';
export const LOGIN_SUCCESS = 'Login successful.';
export const USER_ALREADY_EXISTS = 'User with this email already exists.';
export const INVALID_CREDENTIALS = 'Invalid credentials.';
export const UNAUTHORIZED = 'Unauthorized access.';
export const USER_NOT_FOUND = 'User not found.';
export const GOOGLE_AUTH_SUCCESS = 'Google authentication successful.';
export const GOOGLE_AUTH_FAILED = 'Google authentication failed.';
export const INVALID_TOKEN = 'Invalid or expired token.';

// ==================== WALLET MESSAGES ====================
export const WALLET_CREATED = 'Wallet created successfully.';
export const WALLET_NOT_FOUND = 'Wallet not found.';
export const WALLET_BALANCE_RETRIEVED =
  'Wallet balance retrieved successfully.';
export const INSUFFICIENT_BALANCE = 'Insufficient wallet balance.';
export const WALLET_ALREADY_EXISTS = 'Wallet already exists for this user.';

// ==================== TRANSACTION MESSAGES ====================
export const TRANSACTION_CREATED = 'Transaction created successfully.';
export const TRANSACTION_NOT_FOUND = 'Transaction not found.';
export const TRANSACTION_HISTORY_RETRIEVED =
  'Transaction history retrieved successfully.';
export const TRANSACTION_STATUS_RETRIEVED =
  'Transaction status retrieved successfully.';
export const DUPLICATE_TRANSACTION_REFERENCE =
  'Transaction with this reference already exists.';

// ==================== TRANSFER MESSAGES ====================
export const TRANSFER_SUCCESSFUL = 'Transfer completed successfully.';
export const TRANSFER_FAILED = 'Transfer failed. Please try again.';
export const INVALID_RECIPIENT = 'Invalid recipient wallet.';
export const CANNOT_TRANSFER_TO_SELF = 'Cannot transfer to your own wallet.';
export const RECIPIENT_WALLET_NOT_FOUND = 'Recipient wallet not found.';

// ==================== PAYSTACK MESSAGES ====================
export const PAYSTACK_INIT_SUCCESS =
  'Paystack deposit initialized successfully.';
export const PAYSTACK_INIT_FAILED =
  'Failed to initialize Paystack transaction.';
export const PAYSTACK_WEBHOOK_VERIFIED =
  'Paystack webhook verified successfully.';
export const PAYSTACK_WEBHOOK_INVALID = 'Invalid Paystack webhook signature.';
export const PAYSTACK_VERIFICATION_FAILED =
  'Failed to verify Paystack transaction.';
export const DEPOSIT_SUCCESSFUL = 'Deposit successful.';
export const DEPOSIT_FAILED = 'Deposit failed.';
export const DEPOSIT_PENDING = 'Deposit pending confirmation.';

// ==================== API KEY MESSAGES ====================
export const API_KEY_CREATED = 'API key created successfully.';
export const API_KEY_LIMIT_REACHED =
  'Maximum of 5 active API keys per user allowed.';
export const API_KEY_NOT_FOUND = 'API key not found.';
export const API_KEY_EXPIRED = 'API key has expired.';
export const API_KEY_REVOKED = 'API key has been revoked.';
export const API_KEY_INVALID = 'Invalid API key.';
export const API_KEY_ROLLED_OVER = 'API key rolled over successfully.';
export const API_KEY_NOT_EXPIRED =
  'API key has not expired yet. Cannot rollover.';
export const INSUFFICIENT_PERMISSIONS =
  'API key does not have required permissions.';
export const INVALID_EXPIRY_FORMAT =
  'Invalid expiry format. Use 1H, 1D, 1M, or 1Y.';
export const API_KEYS_RETRIEVED = 'API keys retrieved successfully.';

// ==================== DATABASE OPERATION MESSAGES ====================
export const DB_CREATE_FAILED = 'Failed to create record in database.';
export const DB_UPDATE_FAILED = 'Failed to update record in database.';
export const DB_GET_FAILED = 'Failed to retrieve record from database.';
export const DB_LIST_FAILED = 'Failed to list records from database.';
export const DB_FIND_FAILED = 'Failed to find records in database.';
export const DB_DELETE_FAILED = 'Failed to delete record from database.';
export const DB_COUNT_FAILED = 'Failed to count records in database.';
