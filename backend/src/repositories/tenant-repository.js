export const getTenantSettings = async (connection, tenantId) => {
  const [rows] = await connection.execute(
    `SELECT * FROM tenant_settings WHERE tenant_id = ?`,
    [tenantId]
  );
  return rows[0] || null;
};

export const updateTenantSettings = async (connection, tenantId, settings) => {
  await connection.execute(
    `UPDATE tenant_settings SET timezone = ?, currency = ?, invoice_template_version = ?, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = ?`,
    [settings.timezone, settings.currency, settings.invoiceTemplateVersion, tenantId]
  );
};
