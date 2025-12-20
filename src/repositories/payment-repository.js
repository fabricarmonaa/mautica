export const createPayment = async (connection, payment) => {
  const [result] = await connection.execute(
    `INSERT INTO payments (tenant_id, user_id, amount, method_id, paid_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [payment.tenantId, payment.userId, payment.amount, payment.methodId, payment.paidAt, payment.createdBy]
  );
  return result.insertId;
};

export const linkPaymentOrder = async (connection, paymentId, orderId) => {
  await connection.execute(
    `INSERT INTO payment_order_links (payment_id, order_id) VALUES (?, ?)` ,
    [paymentId, orderId]
  );
};

export const listPayments = async (connection, tenantId, userId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM payments WHERE tenant_id = ? AND user_id = ? ORDER BY paid_at DESC`,
    [tenantId, userId]
  );
  return rows;
};
