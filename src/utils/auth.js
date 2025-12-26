import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


export const hashPassword = async (password) => bcrypt.hash(password, 12);
export const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
