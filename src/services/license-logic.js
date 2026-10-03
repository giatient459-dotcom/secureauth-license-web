import crypto from 'node:crypto';
import { findByKey, upsertLicense, listLicenses, deleteLicense, findById } from './store.js';
import { generateLicenseKey } from './crypto.js';

export async function verifyLicense({ key, hwid, plugin, version, ip }) {
  const lic = await findByKey(key);
  if (!lic) return { ok: false, reason: 'key_not_found' };
  if (!lic.active) return { ok: false, reason: 'revoked' };

  const now = Date.now();
  if (lic.expiresAt && now > lic.expiresAt) {
    return { ok: false, reason: 'expired', expiresAt: lic.expiresAt };
  }

  if (lic.plugin && plugin && lic.plugin !== plugin) {
    return { ok: false, reason: 'plugin_mismatch' };
  }

  if (!lic.hwid || lic.hwid === '') {
    lic.hwid = String(hwid || '').trim();
    lic.lastCheckAt = now;
    lic.lastCheckIp = ip || '';
    await upsertLicense(lic);
  } else if (hwid && lic.hwid !== String(hwid).trim()) {
    return { ok: false, reason: 'hwid_mismatch', boundHwid: lic.hwid };
  } else {
    lic.lastCheckAt = now;
    lic.lastCheckIp = ip || '';
    await upsertLicense(lic);
  }

  return {
    ok: true,
    premium: true,
    customer: lic.customer,
    expiresAt: lic.expiresAt || null,
    hwid: lic.hwid,
  };
}

export async function createLicense({ customer, hwid, plugin, expiresAt, note, days }) {
  let exp = expiresAt || null;
  if (!exp && days) exp = Date.now() + Number(days) * 86400000;
  const lic = {
    id: crypto.randomUUID(),
    key: generateLicenseKey(),
    customer: customer || 'customer',
    hwid: hwid || '',
    plugin: plugin || 'SecureAuth',
    expiresAt: exp,
    active: true,
    note: note || '',
    createdAt: Date.now(),
    lastCheckAt: null,
    lastCheckIp: '',
  };
  await upsertLicense(lic);
  return lic;
}

export async function revokeLicense(id) {
  const lic = await findById(id);
  if (!lic) return null;
  lic.active = false;
  await upsertLicense(lic);
  return lic;
}

export async function resetHwid(id) {
  const lic = await findById(id);
  if (!lic) return null;
  lic.hwid = '';
  await upsertLicense(lic);
  return lic;
}

export { listLicenses, deleteLicense, findById };
