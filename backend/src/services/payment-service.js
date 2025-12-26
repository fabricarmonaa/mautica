import { withTransaction, pool } from '../db/pool.js';
import { createOutboxEvent } from '../repositories/outbox-repository.js';
import { createPayment, linkPaymentOrder, listPayments } from '../repositories/payment-repository.js';

export const registerPayment = async ({ tenantId, userId, orderId, amount, methodId, paidAt, createdBy }) => {
  return withTransaction(async (connection) => {
    const paymentId = await createPayment(connection, { tenantId, userId, amount, methodId, paidAt, createdBy });
    if (orderId) {
      await linkPaymentOrder(connection, paymentId, orderId);
    }
    await createOutboxEvent(connection, {
      tenantId,
      aggregateType: 'payment',
      aggregateId: paymentId,
      eventType: 'PAYMENT_REGISTERED',
      payload: { tenantId, userId, amount, paidAt }
    });
    return paymentId;
  });
};

export const listPaymentsByUser = async ({ tenantId, userId }) => {
  const connection = await pool.getConnection();
  try {
    return await listPayments(connection, tenantId, userId);
  } finally {
    connection.release();
  }
};
