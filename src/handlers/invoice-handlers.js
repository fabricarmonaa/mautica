import { readJson, sendJson } from '../http/http-utils.js';
import { createInvoiceSchema, createInvoiceTemplateSchema } from '../utils/validators.js';
import { createInvoice, createTemplate, getTemplateFields, listInvoicesByUser } from '../services/invoice-service.js';

export const createTemplateHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createInvoiceTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  await createTemplate({ tenantId: req.auth.tenant_id, createdBy: req.auth.user_id, ...parsed.data });
  return sendJson(res, 201, { status: 'ok' }, requestId);
};

export const getTemplateHandler = async (req, res, requestId) => {
  const version = Number(req.params.version);
  const fields = await getTemplateFields({ tenantId: req.auth.tenant_id, version });
  return sendJson(res, 200, { data: fields }, requestId);
};

export const createInvoiceHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const invoiceId = await createInvoice({ tenantId: req.auth.tenant_id, createdBy: req.auth.user_id, ...parsed.data });
  return sendJson(res, 201, { invoiceId }, requestId);
};

export const listInvoicesHandler = async (req, res, requestId) => {
  const userId = Number(req.params.userId || req.auth.user_id);
  const invoices = await listInvoicesByUser({ tenantId: req.auth.tenant_id, userId });
  return sendJson(res, 200, { data: invoices }, requestId);
};
