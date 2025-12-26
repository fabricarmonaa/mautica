import { withTransaction, pool } from '../db/pool.js';
import { createInvoiceDocument, createTemplateField, createTemplateVersion, listInvoices, listTemplateFields, addInvoiceFieldValue } from '../repositories/invoice-repository.js';

export const createTemplate = async ({ tenantId, version, fields, createdBy }) => {
  return withTransaction(async (connection) => {
    await createTemplateVersion(connection, { tenantId, version, createdBy });
    for (const field of fields) {
      await createTemplateField(connection, { tenantId, templateVersion: version, ...field });
    }
  });
};

export const getTemplateFields = async ({ tenantId, version }) => {
  const connection = await pool.getConnection();
  try {
    return await listTemplateFields(connection, tenantId, version);
  } finally {
    connection.release();
  }
};

export const createInvoice = async ({ tenantId, userId, orderId, templateVersion, issuedAt, fields, createdBy }) => {
  return withTransaction(async (connection) => {
    const invoiceId = await createInvoiceDocument(connection, {
      tenantId,
      userId,
      orderId,
      templateVersion,
      issuedAt,
      createdBy
    });
    for (const field of fields) {
      await addInvoiceFieldValue(connection, invoiceId, field);
    }
    return invoiceId;
  });
};

export const listInvoicesByUser = async ({ tenantId, userId }) => {
  const connection = await pool.getConnection();
  try {
    return await listInvoices(connection, tenantId, userId);
  } finally {
    connection.release();
  }
};
