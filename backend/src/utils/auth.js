import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export const hashPassword = async (password) => bcrypt.hash(password, 12);
export const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.refreshExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
