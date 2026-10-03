import crypto from 'node:crypto';
import { config } from '../config.js';
import { timingSafeEqualStr } from '../services/crypto.js';

const sessions = new Map(); // token -> exp

function parseBasic(hdr) {
  if (!hdr || !hdr.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(hdr.slice(6), 'base64').toString('utf8');
    const i = decoded.indexOf(':');
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

function validAdmin(user, pass) {
  return timingSafeEqualStr(user, config.adminUser) && timingSafeEqualStr(pass, config.adminPass);
}

export function createSession() {
  const token = crypto.randomBytes(24).toString('base64url');
  sessions.set(token, Date.now() + 12 * 3600_000);
  return token;
}

export function validSession(token) {
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp || Date.now() > exp) {
    sessions.delete(token);
    return false;
  }
  return true;
}

/** Basic OR session cookie */
export function requireAdmin(req, res, next) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)sa_lic_sess=([^;]+)/);
  if (m && validSession(m[1])) return next();

  const basic = parseBasic(req.headers.authorization);
  if (basic && validAdmin(basic.user, basic.pass)) {
    const token = createSession();
    res.setHeader('Set-Cookie', `sa_lic_sess=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="SecureAuth License"');
  return res.status(401).send('Auth required');
}

export function requirePluginToken(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1].trim() : '';
  if (!timingSafeEqualStr(token, config.pluginToken)) {
    return res.status(401).json({ ok: false, reason: 'unauthorized' });
  }
  next();
}
