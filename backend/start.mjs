// server-starter.mjs — starts the server, does NOT test
import { init } from './src/services/dbService.js';
import dotenv from 'dotenv';
dotenv.config();

// Set env for seed
process.env.ADMIN_EMAIL = 'admin@prisha.app';
process.env.ADMIN_PASSWORD = 'admin123456';

init();
console.log('DB initialized');

import('./index.js').then(mod => {
  console.log('Server started');
});
