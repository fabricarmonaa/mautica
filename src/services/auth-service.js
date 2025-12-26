import { pool } from '../db/pool.js';
import { findUserByDni, updateUserPassword } from '../repositories/user-repository.js';
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword } from '../utils/auth.js';

export const login = async ({ tenantId, dni, password }) => {
  const connection = await pool.getConnection();
  try {
    const user = await findUserByDni(connection, tenantId, dni);
    if (!user) {
      return null;
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return null;
    }
    const sessionId = `${user.id}-${Date.now()}`;
    const payload = {
      tenant_id: user.tenant_id,
      role: user.role,
      user_id: user.id,
      session_id: sessionId
    };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      mustChange: Boolean(user.must_change)
    };
  } finally {
    connection.release();
  }
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT password_hash FROM user_passwords WHERE user_id = ?`,
      [userId]
    );
    const row = rows[0];
    if (!row) {
      return false;
    }
    const valid = await verifyPassword(currentPassword, row.password_hash);
    if (!valid) {
      return false;
    }
    const newHash = await hashPassword(newPassword);
    await updateUserPassword(connection, userId, newHash, 0);
    return true;
  } finally {
    connection.release();
  }
};
