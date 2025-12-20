import { withTransaction, pool } from '../db/pool.js';
import { createOutboxEvent } from '../repositories/outbox-repository.js';
import { createCashMovement, listCashMovements } from '../repositories/cash-repository.js';

export const registerMovement = async ({ tenantId, categoryId, methodId, amount, occurredAt, note, createdBy, categoryType }) => {
  return withTransaction(async (connection) => {
    const movementId = await createCashMovement(connection, {
      tenantId,
      categoryId,
      methodId,
      amount,
      occurredAt,
      note,
      createdBy
    });
    await createOutboxEvent(connection, {
      tenantId,
      aggregateType: 'cash',
      aggregateId: movementId,
      eventType: 'CASH_MOVEMENT_CREATED',
      payload: { tenantId, categoryId, categoryType, amount, occurredAt }
    });
    return movementId;
  });
};

export const listMovements = async ({ tenantId, fromDate, toDate }) => {
  const connection = await pool.getConnection();
  try {
    return await listCashMovements(connection, tenantId, fromDate, toDate);
  } finally {
    connection.release();
  }
};
