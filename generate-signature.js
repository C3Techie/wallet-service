
const crypto = require('crypto');
require('dotenv').config();

// Your Paystack secret key from .env
const secret = process.env.PAYSTACK_SECRET_KEY;

// The exact request body you want to send (must match exactly, including whitespace)
// Usage: node generate-signature.js [reference] [status] [amount]
// Or:    node generate-signature.js '{"event":"charge.success",...}'

let body;
if (process.argv.length === 3) {
  // Full body as first argument
  body = process.argv[2];
} else {
  // Build body from reference, status, amount
  const reference = process.argv[2] || 'TXN_1234567890_test';
  const status = process.argv[3] || 'success';
  const amount = process.argv[4] || 500000;
  body = JSON.stringify({
    event: 'charge.success',
    data: {
      reference,
      status,
      amount: Number(amount)
    }
  });
}

// Generate HMAC SHA512 signature
const signature = crypto.createHmac('sha512', secret).update(body).digest('hex');

console.log('\nGenerated Paystack Signature:');
console.log(signature);
console.log('\nUse this in your curl command:');
console.log(`\ncurl -X POST https://1a94e08c0fab.ngrok-free.app/api/v1/wallet/paystack/webhook \\
  -H "Content-Type: application/json" \\
  -H "x-paystack-signature: ${signature}" \\
  -d '${body}'`);
