import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

const DEFAULT_STATUSES = [
  { code: 'PENDING', name: 'Pendiente', sort_order: 1 },
  { code: 'IN_PROGRESS', name: 'En progreso', sort_order: 2 },
  { code: 'COMPLETED', name: 'Completado', sort_order: 3 }
];

class OrderStatusesRepository {
  async seedDefaults(tenant_id) {
    const pool = getPool();
    for (const status of DEFAULT_STATUSES) {
      await pool.execute(
        `INSERT IGNORE INTO order_statuses (id, tenant_id, name, code, sort_order) VALUES (?, ?, ?, ?, ?)`
        , [generateId(), tenant_id, status.name, status.code, status.sort_order]
      );
    }
  }

  async findByCode(tenant_id, code) {
    const [rows] = await getPool().execute(
      'SELECT * FROM order_statuses WHERE tenant_id = ? AND code = ? LIMIT 1',
      [tenant_id, code]
    );
    return rows[0] || null;
  }
}

export const orderStatusesRepository = new OrderStatusesRepository();
