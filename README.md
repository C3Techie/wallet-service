# Wallet Service

A secure backend wallet service built with NestJS that enables users to deposit money using Paystack, manage wallet balances, view transaction history, and transfer funds to other users.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google
- **JWT Token Management** - Session management via JWT tokens
- **API Key System** - Service-to-service authentication with up to 5 active keys per user
- **Paystack Integration** - Deposit money via Paystack payment gateway
- **Wallet Management** - Check balance, view transaction history
- **Fund Transfers** - Transfer funds between wallets atomically
- **Webhook Handling** - Secure Paystack webhook processing with signature verification

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Passport (Google OAuth 2.0, JWT)
- **Payment Gateway**: Paystack
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Paystack account
- Google OAuth 2.0 credentials

## Installation

1. Clone the repository:
```bash
git clone [<repository-url>](https://github.com/C3Techie/wallet-service)
cd wallet-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=wallet_service
DB_SSL=false

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=1d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_CALLBACK_URL=http://localhost:3000/api/v1/wallet/paystack/callback

# Server
PORT=3000
NODE_ENV=development
```

4. Create the database:
```bash
createdb wallet_service
```

5. Run migrations:
```bash
npm run migration:run
```

6. Start the development server:
```bash
npm run start:dev
```

## Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## API Documentation

Once the server is running, visit `http://localhost:3000/docs` for interactive API documentation.

## API Endpoints

### Authentication

**GET** `/api/v1/auth/google` - Initiate Google OAuth login
**GET** `/api/v1/auth/google/callback` - Google OAuth callback

### API Keys

**POST** `/api/v1/keys/create` - Create a new API key (max 5 active keys)
**POST** `/api/v1/keys/rollover` - Rollover an expired API key

### Wallet Operations

**POST** `/api/v1/wallet/deposit` - Initialize a deposit via Paystack
**GET** `/api/v1/wallet/balance` - Get current wallet balance
**POST** `/api/v1/wallet/transfer` - Transfer funds to another wallet
**GET** `/api/v1/wallet/transactions` - Get transaction history
**GET** `/api/v1/wallet/deposit/:reference/status` - Check deposit status
**POST** `/api/v1/wallet/paystack/webhook` - Paystack webhook handler (internal)

## Authentication Methods

All protected endpoints support two authentication methods:

1. **JWT Bearer Token** (for users):
```bash
Authorization: Bearer <jwt_token>
```

2. **API Key** (for services):
```bash
x-api-key: sk_<your_api_key>
```

## Usage Examples

### 1. Google Sign-In

Navigate to `GET /api/v1/auth/google` in your browser to initiate OAuth flow.

### 2. Create API Key

```bash
curl -X POST http://localhost:3000/api/v1/keys/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Service",
    "permissions": ["wallet:read", "wallet:transfer"],
    "expires_in": "1Y"
  }'
```

### 3. Initialize Deposit

```bash
curl -X POST http://localhost:3000/api/v1/wallet/deposit \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000
  }'
```

Response:
```json
{
  "message": "Deposit initialized successfully",
  "data": {
    "reference": "TXN_1234567890",
    "authorization_url": "https://checkout.paystack.com/..."
  }
}
```

### 4. Check Balance

```bash
curl -X GET http://localhost:3000/api/v1/wallet/balance \
  -H "Authorization: Bearer <jwt_token>"
```

### 5. Transfer Funds

```bash
curl -X POST http://localhost:3000/api/v1/wallet/transfer \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_number": "4566678954356",
    "amount": 3000
  }'
```

### 6. Get Transaction History

```bash
curl -X GET http://localhost:3000/api/v1/wallet/transactions \
  -H "x-api-key: sk_your_api_key"
```

## Webhook Setup

Configure your Paystack webhook URL to:
```
https://your-domain.com/api/v1/wallet/paystack/webhook
```

The webhook handler:
- Verifies Paystack signature
- Ensures idempotent processing
- Updates wallet balance atomically
- Handles duplicate events gracefully

## Code Structure

```
src/
├── common/
│   ├── base/
│   │   └── abstract-model-action.ts    # Base CRUD operations
│   ├── decorators/
│   │   └── skip-wrap.decorator.ts      # Response wrapper skip
│   ├── guards/
│   │   └── jwt-or-apikey.guard.ts      # Combined auth guard
│   └── interceptors/
│       ├── logging.interceptor.ts      # Request/response logging
│       └── response-transform.interceptor.ts
├── constants/
│   └── system.messages.ts              # Centralized messages
├── modules/
│   ├── auth/                           # Google OAuth + JWT
│   ├── apikey/                         # API key management
│   ├── wallet/                         # Wallet operations
│   ├── transaction/                    # Transaction entities
│   └── paystack/                       # Paystack integration
└── database/
    └── migrations/                     # TypeORM migrations
```

## Key Features

### API Key Management
- Maximum 5 active keys per user
- Flexible expiration: 1H, 1D, 1M, 1Y
- Rollover expired keys
- Permission-based access control

### Wallet Operations
- Auto-create wallet on first deposit
- Unique wallet numbers (13 digits)
- Atomic transfers with balance validation
- Transaction reference tracking
- Idempotent webhook processing

### Security
- HMAC signature verification for webhooks
- JWT token expiration
- API key validation
- Database transactions for atomicity
- Input validation and sanitization

## Response Format

All API responses (except webhooks) follow this format:

```json
{
  "message": "Operation successful",
  "data": {
    // Response data in snake_case
  }
}
```

## Error Handling

Errors return appropriate HTTP status codes with descriptive messages:

```json
{
  "statusCode": 400,
  "message": "Insufficient wallet balance",
  "error": "Bad Request"
}
```

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
