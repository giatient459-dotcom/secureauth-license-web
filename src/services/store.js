import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Storage:
 * - Production (Vercel): Upstash Redis REST nếu có UPSTASH_REDIS_REST_URL + TOKEN
 * - Local: file data/licenses.json
 */

const REDIS_KEY = 'secureauth:licenses';

function useRedis() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisGet() {
  const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const res = await fetch(`${url}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) throw new Error('Redis GET failed: ' + res.status);
  const data = await res.json();
  // Upstash returns { result: "json-string" | null }
  if (data.result == null) return { licenses: [] };
  try {
    const parsed = JSON.parse(data.result);
    if (!Array.isArray(parsed.licenses)) parsed.licenses = [];
    return parsed;
  } catch {
    return { licenses: [] };
  }
}

async function redisSet(obj) {
  const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const value = JSON.stringify(obj);
  // SET key value
  const res = await fetch(`${url}/set/${REDIS_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
  // Upstash REST path form: /set/key/value  — simpler:
  // Actually official: POST /set/key with body as value in path encoding
  // Use pipeline-compatible: 
  // fetch(`${url}/set/${REDIS_KEY}/${encodeURIComponent(value)}`) 
  return res;
}

// Prefer path-style Upstash REST which is reliable:
async function redisSetPath(obj) {
  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const value = encodeURIComponent(JSON.stringify(obj));
  const res = await fetch(`${base}/set/${REDIS_KEY}/${value}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Redis SET failed: ' + res.status + ' ' + t);
  }
}

function fileEnsure() {
  const dir = path.dirname(config.dataFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(config.dataFile)) {
    fs.writeFileSync(config.dataFile, JSON.stringify({ licenses: [] }, null, 2));
  }
}

function fileLoad() {
  fileEnsure();
  try {
    const data = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
    if (!Array.isArray(data.licenses)) data.licenses = [];
    return data;
  } catch {
    return { licenses: [] };
  }
}

function fileSave(data) {
  fileEnsure();
  const tmp = config.dataFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, config.dataFile);
}

export async function load() {
  if (useRedis()) return redisGet();
  return fileLoad();
}

export async function save(data) {
  if (useRedis()) return redisSetPath(data);
  return fileSave(data);
}

export async function listLicenses() {
  return (await load()).licenses;
}

export async function findByKey(key) {
  const k = String(key || '').trim();
  return (await load()).licenses.find((x) => x.key === k) || null;
}

export async function findById(id) {
  return (await load()).licenses.find((x) => x.id === id) || null;
}

export async function upsertLicense(lic) {
  const data = await load();
  const idx = data.licenses.findIndex((x) => x.id === lic.id);
  if (idx >= 0) data.licenses[idx] = lic;
  else data.licenses.push(lic);
  await save(data);
  return lic;
}

export async function deleteLicense(id) {
  const data = await load();
  const before = data.licenses.length;
  data.licenses = data.licenses.filter((x) => x.id !== id);
  await save(data);
  return data.licenses.length < before;
}
