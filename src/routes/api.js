import { Router } from 'express';
import { requirePluginToken, requireAdmin } from '../middleware/auth.js';
import { signPayload } from '../services/crypto.js';
import {
  verifyLicense,
  createLicense,
  revokeLicense,
  resetHwid,
  listLicenses,
  deleteLicense,
  findById,
} from '../services/license-logic.js';

export function createApiRouter() {
  const r = Router();

  r.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'secureauth-license',
      storage: process.env.UPSTASH_REDIS_REST_URL ? 'upstash' : 'file',
    });
  });

  r.post('/v1/verify', requirePluginToken, async (req, res) => {
    try {
      const key = String(req.body?.key || '').trim();
      const hwid = String(req.body?.hwid || '').trim();
      const plugin = String(req.body?.plugin || 'SecureAuth').trim();
      const version = String(req.body?.version || '').trim();
      const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || '';

      if (!key || !hwid) {
        return res.status(400).json({ ok: false, reason: 'missing_key_or_hwid' });
      }

      const result = await verifyLicense({ key, hwid, plugin, version, ip });
      const payload = { ...result, serverTime: Date.now(), plugin };
      const signed = signPayload(payload);
      res.status(result.ok ? 200 : 403).json({ ...signed.body, signature: signed.signature });
    } catch (e) {
      console.error('verify error', e);
      res.status(500).json({ ok: false, reason: 'internal' });
    }
  });

  r.get('/admin/licenses', requireAdmin, async (_req, res) => {
    res.json({ licenses: await listLicenses() });
  });

  r.post('/admin/licenses', requireAdmin, async (req, res) => {
    const lic = await createLicense({
      customer: req.body?.customer,
      hwid: req.body?.hwid || '',
      plugin: req.body?.plugin || 'SecureAuth',
      days: req.body?.days,
      expiresAt: req.body?.expiresAt,
      note: req.body?.note,
    });
    res.status(201).json(lic);
  });

  r.post('/admin/licenses/:id/revoke', requireAdmin, async (req, res) => {
    const lic = await revokeLicense(req.params.id);
    if (!lic) return res.status(404).json({ error: 'not_found' });
    res.json(lic);
  });

  r.post('/admin/licenses/:id/reset-hwid', requireAdmin, async (req, res) => {
    const lic = await resetHwid(req.params.id);
    if (!lic) return res.status(404).json({ error: 'not_found' });
    res.json(lic);
  });

  r.delete('/admin/licenses/:id', requireAdmin, async (req, res) => {
    if (!(await deleteLicense(req.params.id))) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  });

  r.get('/admin/licenses/:id', requireAdmin, async (req, res) => {
    const lic = await findById(req.params.id);
    if (!lic) return res.status(404).json({ error: 'not_found' });
    res.json(lic);
  });

  return r;
}
