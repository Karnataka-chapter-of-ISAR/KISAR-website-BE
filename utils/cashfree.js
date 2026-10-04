import crypto from 'crypto';
import { AppError } from './AppError.js';
import logger from './logger.js';
import { MESSAGES } from '../constants/messages.js';

const BASE_URLS = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};
const DEFAULT_API_VERSION = '2023-08-01';
const REQUEST_TIMEOUT_MS = 15000;

export const ORDER_STATUS = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
};

export const cashfreeEnvironment = () => (process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox');

function assertConfigured() {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    logger.error('[cashfree] CASHFREE_APP_ID / CASHFREE_SECRET_KEY are not set');
    throw new AppError(MESSAGES.PAYMENTS.NOT_CONFIGURED, 503);
  }
}

async function request(method, path, body) {
  assertConfigured();

  let response;
  try {
    response = await fetch(`${BASE_URLS[cashfreeEnvironment()]}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': process.env.CASHFREE_API_VERSION || DEFAULT_API_VERSION,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    logger.error(`[cashfree] ${method} ${path} failed: ${err.message}`);
    throw new AppError(MESSAGES.PAYMENTS.GATEWAY_ERROR, 502);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    logger.error(`[cashfree] ${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`);
    throw new AppError(MESSAGES.PAYMENTS.GATEWAY_ERROR, 502);
  }
  return payload;
}

export function createOrder({ orderId, amount, currency, customer, returnUrl, notifyUrl, expiresAt }) {
  return request('POST', '/orders', {
    order_id: orderId,
    order_amount: amount,
    order_currency: currency,
    customer_details: {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
    },
    order_meta: {
      return_url: returnUrl,
      ...(notifyUrl && { notify_url: notifyUrl }),
    },
    order_expiry_time: expiresAt.toISOString(),
  });
}

export function getOrder(orderId) {
  return request('GET', `/orders/${encodeURIComponent(orderId)}`);
}

export function getOrderPayments(orderId) {
  return request('GET', `/orders/${encodeURIComponent(orderId)}/payments`);
}

export function terminateOrder(orderId) {
  return request('PATCH', `/orders/${encodeURIComponent(orderId)}`, { order_status: ORDER_STATUS.TERMINATED });
}

export function createRefund({ orderId, refundId, amount, note }) {
  return request('POST', `/orders/${encodeURIComponent(orderId)}/refunds`, {
    refund_id: refundId,
    refund_amount: amount,
    refund_note: note,
  });
}

export function getRefund(orderId, refundId) {
  return request('GET', `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`);
}

// Cashfree signs `timestamp + rawBody` with the account secret key (HMAC-SHA256, base64).
export function verifyWebhookSignature({ rawBody, signature, timestamp }) {
  if (!process.env.CASHFREE_SECRET_KEY || !rawBody || !signature || !timestamp) return false;

  const expected = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
    .update(timestamp + rawBody)
    .digest('base64');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
