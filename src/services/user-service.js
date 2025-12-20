import { withTransaction, pool } from '../db/pool.js';
import { createOutboxEvent } from '../repositories/outbox-repository.js';
import { createUser, createUserPassword, getUserById, getUserProfile, listUsers } from '../repositories/user-repository.js';
import { hashPassword } from '../utils/auth.js';

export const createUserWithPassword = async ({ tenantId, dni, firstName, lastName, role, password }) => {
  return withTransaction(async (connection) => {
    const userId = await createUser(connection, {
      tenantId,
      dni,
      firstName,
      lastName,
      role,
      status: 'ACTIVE'
    });
    const passwordHash = await hashPassword(password);
    await createUserPassword(connection, { userId, passwordHash, mustChange: 1 });
    await createOutboxEvent(connection, {
      tenantId,
      aggregateType: 'user',
      aggregateId: userId,
      eventType: 'USER_CREATED',
      payload: {
        userId,
        tenantId,
        dni,
        fullName: `${firstName} ${lastName}`,
        status: 'ACTIVE'
      }
    });
    return userId;
  });
};

export const listUsersPaged = async ({ tenantId, limit, offset, search }) => {
  const connection = await pool.getConnection();
  try {
    return await listUsers(connection, tenantId, { limit, offset, search });
  } finally {
    connection.release();
  }
};

export const getUser = async ({ tenantId, userId }) => {
  const connection = await pool.getConnection();
  try {
    return await getUserById(connection, tenantId, userId);
  } finally {
    connection.release();
  }
};

export const getUserReadProfile = async ({ tenantId, userId }) => {
  const connection = await pool.getConnection();
  try {
    return await getUserProfile(connection, tenantId, userId);
  } finally {
    connection.release();
  }
};
