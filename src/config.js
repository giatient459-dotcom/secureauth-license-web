import 'dotenv/config';

function req(name, fallback = '') {
  const v = process.env[name];
  if (v !== undefined && String(v).trim() !== '') return String(v).trim();
  return fallback;
}

export const config = {
  port: Number(process.env.PORT || 3080),
  host: req('HOST', '0.0.0.0'),
  adminUser: req('ADMIN_USER', 'admin'),
  adminPass: req('ADMIN_PASS', 'change_me_strong'),
  signingSecret: req('API_SIGNING_SECRET', 'CHANGE_ME_SIGNING_SECRET_32CHARS_MIN'),
  pluginToken: req('PLUGIN_API_TOKEN', 'CHANGE_ME_PLUGIN_TOKEN'),
  dataFile: req('DATA_FILE', new URL('../data/licenses.json', import.meta.url).pathname),
};
