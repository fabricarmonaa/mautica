import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class AICommandLogsRepository {
  async insert({ tenant_id, user_id, command_text, parsed_payload, status = 'PENDING' }) {
    const executor = getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO ai_command_logs (id, tenant_id, user_id, command_text, parsed_payload, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, user_id, command_text, JSON.stringify(parsed_payload), status]
    );
    return { id, tenant_id, user_id, status };
  }

  async findById(id, tenant_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM ai_command_logs WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] ? { ...rows[0], parsed_payload: JSON.parse(rows[0].parsed_payload) } : null;
  }

  async updateStatus(id, tenant_id, status) {
    await getPool().execute(
      'UPDATE ai_command_logs SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, id, tenant_id]
    );
  }
}

export const aiCommandLogsRepository = new AICommandLogsRepository();
