import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class PaymentMethodsRepository {
  async findByCode(tenant_id, code) {
    const [rows] = await getPool().execute(
      'SELECT * FROM payment_methods WHERE tenant_id = ? AND code = ? LIMIT 1',
      [tenant_id, code]
    );
    return rows[0] || null;
  }

  async ensureMethod({ tenant_id, name, code }) {
    const existing = await this.findByCode(tenant_id, code);
    if (existing) return existing;
    const id = generateId();
    await getPool().execute(
      'INSERT INTO payment_methods (id, tenant_id, name, code) VALUES (?, ?, ?, ?)',
      [id, tenant_id, name, code]
    );
    return { id, tenant_id, name, code };
  }
}

export const paymentMethodsRepository = new PaymentMethodsRepository();
