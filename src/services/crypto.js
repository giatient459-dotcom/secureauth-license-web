import crypto from 'node:crypto';
import { config } from '../config.js';

/** Sinh license key ngẫu nhiên (hiển thị cho khách). */
export function generateLicenseKey() {
  return crypto.randomBytes(24).toString('base64url');
}

/** Ký response verify — plugin so HMAC với cùng secret. */
export function signPayload(obj) {
  const body = JSON.stringify(obj);
  const sig = crypto
    .createHmac('sha256', config.signingSecret)
    .update(body)
    .digest('base64url');
  return { body: obj, signature: sig };
}

export function timingSafeEqualStr(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) {
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}
