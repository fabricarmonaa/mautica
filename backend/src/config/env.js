import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  db: {
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME')
  }
};
