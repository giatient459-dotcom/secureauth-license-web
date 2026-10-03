import app from './app.js';
import { config } from './config.js';

app.listen(config.port, config.host, () => {
  console.log(`SecureAuth License Web on http://${config.host}:${config.port}`);
  console.log(`Admin: http://127.0.0.1:${config.port}/admin/`);
});
