import { pool } from '../db/pool.js';
import { getTenantSettings, updateTenantSettings } from '../repositories/tenant-repository.js';

export const fetchSettings = async (tenantId) => {
  const connection = await pool.getConnection();
  try {
    return await getTenantSettings(connection, tenantId);
  } finally {
    connection.release();
  }
};

export const saveSettings = async (tenantId, settings) => {
  const connection = await pool.getConnection();
  try {
    await updateTenantSettings(connection, tenantId, settings);
  } finally {
    connection.release();
  }
};
