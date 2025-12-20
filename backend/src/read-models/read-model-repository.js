export const upsertUserReadModel = async (connection, payload) => {
  await connection.execute(
    `INSERT INTO users_read (tenant_id, user_id, dni, full_name, status, total_orders, total_paid, total_due, last_order_at, last_payment_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       dni = VALUES(dni),
       full_name = VALUES(full_name),
       status = VALUES(status)`,
    [
      payload.tenantId,
      payload.userId,
      payload.dni,
      payload.fullName,
      payload.status,
      0,
      0,
      0,
      '1970-01-01 00:00:01',
      '1970-01-01 00:00:01'
    ]
  );
};

export const updateOrderReadModel = async (connection, payload) => {
  await connection.execute(
    `INSERT INTO orders_read (tenant_id, order_id, user_id, user_name, status_name, total_amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status_name = VALUES(status_name),
       total_amount = VALUES(total_amount),
       updated_at = VALUES(updated_at)`,
    [
      payload.tenantId,
      payload.orderId,
      payload.userId,
      payload.userName,
      payload.statusName,
      payload.totalAmount,
      payload.createdAt,
      payload.updatedAt
    ]
  );

  await connection.execute(
    `UPDATE users_read SET total_orders = total_orders + 1, last_order_at = ?
     WHERE tenant_id = ? AND user_id = ?`,
    [payload.createdAt, payload.tenantId, payload.userId]
  );
};

export const updatePaymentReadModel = async (connection, payload) => {
  await connection.execute(
    `UPDATE users_read SET total_paid = total_paid + ?, last_payment_at = ?
     WHERE tenant_id = ? AND user_id = ?`,
    [payload.amount, payload.paidAt, payload.tenantId, payload.userId]
  );
};

export const updateCashReadModel = async (connection, payload) => {
  const income = payload.categoryType === 'INCOME' ? payload.amount : 0;
  const expense = payload.categoryType === 'EXPENSE' ? payload.amount : 0;
  await connection.execute(
    `INSERT INTO cash_read (tenant_id, date_key, category_id, total_income, total_expense)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_income = total_income + VALUES(total_income),
       total_expense = total_expense + VALUES(total_expense)`,
    [payload.tenantId, payload.dateKey, payload.categoryId, income, expense]
  );
};
