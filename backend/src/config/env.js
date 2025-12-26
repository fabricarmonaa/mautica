import dotenv from 'dotenv';

export function loadEnv() {
  dotenv.config();
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter(key => process.env[key] === undefined);
  if (missing.length) {
    console.warn(`Missing env keys: ${missing.join(', ')}`);
  }
}
