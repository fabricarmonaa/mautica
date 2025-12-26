export const createOrder = async (connection, order) => {
  const [result] = await connection.execute(
    `INSERT INTO orders (tenant_id, user_id, status_id)
     VALUES (?, ?, ?)` ,
    [order.tenantId, order.userId, order.statusId]
  );
  return result.insertId;
};

export const createOrderItem = async (connection, item) => {
  await connection.execute(
    `INSERT INTO order_items (order_id, product_name, quantity, unit_price)
     VALUES (?, ?, ?, ?)` ,
    [item.orderId, item.productName, item.quantity, item.unitPrice]
  );
};

export const listOrders = async (connection, tenantId, { limit, offset }) => {
  const [rows] = await connection.execute(
    `SELECT * FROM orders_read WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [tenantId, limit, offset]
  );
  return rows;
};

export const listOrdersByUser = async (connection, tenantId, userId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM orders_read WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC`,
    [tenantId, userId]
  );
  return rows;
};

export const getOrderById = async (connection, tenantId, orderId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM orders WHERE tenant_id = ? AND id = ?`,
    [tenantId, orderId]
  );
  return rows[0] || null;
};

export const listOrderItems = async (connection, orderId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  return rows;
};
