export const createCashMovement = async (connection, movement) => {
  const [result] = await connection.execute(
    `INSERT INTO cash_movements (tenant_id, category_id, method_id, amount, occurred_at, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [movement.tenantId, movement.categoryId, movement.methodId, movement.amount, movement.occurredAt, movement.note, movement.createdBy]
  );
  return result.insertId;
};

export const listCashMovements = async (connection, tenantId, fromDate, toDate) => {
  const [rows] = await connection.execute(
    `SELECT * FROM cash_movements WHERE tenant_id = ? AND occurred_at BETWEEN ? AND ? ORDER BY occurred_at DESC`,
    [tenantId, fromDate, toDate]
  );
  return rows;
};
