import { withTransaction, pool } from '../db/pool.js';
import { createOrder, createOrderItem, getOrderById, listOrderItems, listOrders, listOrdersByUser } from '../repositories/order-repository.js';
import { createOutboxEvent } from '../repositories/outbox-repository.js';

export const createOrderWithItems = async ({ tenantId, userId, statusId, items }) => {
  return withTransaction(async (connection) => {
    const orderId = await createOrder(connection, { tenantId, userId, statusId });
    let totalAmount = 0;
    for (const item of items) {
      await createOrderItem(connection, { orderId, ...item });
      totalAmount += item.quantity * item.unitPrice;
    }
    const [statusRows] = await connection.execute(
      `SELECT name FROM order_statuses WHERE id = ?`,
      [statusId]
    );
    const [userRows] = await connection.execute(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [userId]
    );
    const statusName = statusRows[0]?.name || 'CREADO';
    const userName = `${userRows[0]?.first_name || ''} ${userRows[0]?.last_name || ''}`.trim();
    await createOutboxEvent(connection, {
      tenantId,
      aggregateType: 'order',
      aggregateId: orderId,
      eventType: 'ORDER_CREATED',
      payload: {
        tenantId,
        orderId,
        userId,
        userName,
        statusName,
        totalAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    return orderId;
  });
};

export const listOrdersPaged = async ({ tenantId, limit, offset }) => {
  const connection = await pool.getConnection();
  try {
    return await listOrders(connection, tenantId, { limit, offset });
  } finally {
    connection.release();
  }
};

export const listOrdersForUser = async ({ tenantId, userId }) => {
  const connection = await pool.getConnection();
  try {
    return await listOrdersByUser(connection, tenantId, userId);
  } finally {
    connection.release();
  }
};

export const getOrderDetail = async ({ tenantId, orderId }) => {
  const connection = await pool.getConnection();
  try {
    const order = await getOrderById(connection, tenantId, orderId);
    if (!order) {
      return null;
    }
    const items = await listOrderItems(connection, orderId);
    return { ...order, items };
  } finally {
    connection.release();
  }
};
