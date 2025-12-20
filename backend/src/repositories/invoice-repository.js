export const createTemplateVersion = async (connection, { tenantId, version, createdBy }) => {
  await connection.execute(
    `INSERT INTO invoice_template_versions (tenant_id, version, created_by)
     VALUES (?, ?, ?)` ,
    [tenantId, version, createdBy]
  );
};

export const createTemplateField = async (connection, field) => {
  await connection.execute(
    `INSERT INTO invoice_template_fields (tenant_id, template_version, field_key, label, field_type, required_flag, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [field.tenantId, field.templateVersion, field.fieldKey, field.label, field.fieldType, field.requiredFlag, field.sortOrder]
  );
};

export const listTemplateFields = async (connection, tenantId, version) => {
  const [rows] = await connection.execute(
    `SELECT * FROM invoice_template_fields WHERE tenant_id = ? AND template_version = ? ORDER BY sort_order ASC`,
    [tenantId, version]
  );
  return rows;
};

export const createInvoiceDocument = async (connection, doc) => {
  const [result] = await connection.execute(
    `INSERT INTO invoice_documents (tenant_id, user_id, order_id, template_version, issued_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [doc.tenantId, doc.userId, doc.orderId, doc.templateVersion, doc.issuedAt, doc.createdBy]
  );
  return result.insertId;
};

export const addInvoiceFieldValue = async (connection, invoiceId, field) => {
  const table = field.fieldType === 'number'
    ? 'invoice_field_values_number'
    : field.fieldType === 'date'
      ? 'invoice_field_values_date'
      : 'invoice_field_values_text';
  const column = field.fieldType === 'number' ? 'value_number' : field.fieldType === 'date' ? 'value_date' : 'value_text';
  await connection.execute(
    `INSERT INTO ${table} (invoice_id, field_key, ${column}) VALUES (?, ?, ?)` ,
    [invoiceId, field.fieldKey, field.value]
  );
};

export const listInvoices = async (connection, tenantId, userId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM invoice_documents WHERE tenant_id = ? AND user_id = ? ORDER BY issued_at DESC`,
    [tenantId, userId]
  );
  return rows;
};
