export const createUser = async (connection, user) => {
  const [result] = await connection.execute(
    `INSERT INTO users (tenant_id, dni, first_name, last_name, role, status)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [user.tenantId, user.dni, user.firstName, user.lastName, user.role, user.status]
  );
  return result.insertId;
};

export const createUserPassword = async (connection, { userId, passwordHash, mustChange }) => {
  await connection.execute(
    `INSERT INTO user_passwords (user_id, password_hash, must_change)
     VALUES (?, ?, ?)` ,
    [userId, passwordHash, mustChange]
  );
};

export const findUserByDni = async (connection, tenantId, dni) => {
  const [rows] = await connection.execute(
    `SELECT u.*, up.password_hash, up.must_change
     FROM users u
     JOIN user_passwords up ON up.user_id = u.id
     WHERE u.tenant_id = ? AND u.dni = ?`,
    [tenantId, dni]
  );
  return rows[0] || null;
};

export const listUsers = async (connection, tenantId, { limit, offset, search }) => {
  const searchSql = search ? `AND (u.dni LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)` : '';
  const params = [tenantId];
  if (search) {
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  params.push(limit, offset);
  const [rows] = await connection.execute(
    `SELECT u.*
     FROM users u
     WHERE u.tenant_id = ? ${searchSql}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
  return rows;
};

export const getUserById = async (connection, tenantId, userId) => {
  const [rows] = await connection.execute(
    `SELECT u.* FROM users u WHERE u.tenant_id = ? AND u.id = ?`,
    [tenantId, userId]
  );
  return rows[0] || null;
};

export const updateUserPassword = async (connection, userId, passwordHash, mustChange) => {
  await connection.execute(
    `UPDATE user_passwords SET password_hash = ?, must_change = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [passwordHash, mustChange, userId]
  );
};

export const getUserProfile = async (connection, tenantId, userId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM users_read WHERE tenant_id = ? AND user_id = ?`,
    [tenantId, userId]
  );
  return rows[0] || null;
};
