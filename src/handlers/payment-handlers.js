import { readJson, sendJson } from '../http/http-utils.js';
import { createPaymentSchema } from '../utils/validators.js';
import { listPaymentsByUser, registerPayment } from '../services/payment-service.js';

export const createPaymentHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const paymentId = await registerPayment({
    tenantId: req.auth.tenant_id,
    createdBy: req.auth.user_id,
    ...parsed.data
  });
  return sendJson(res, 201, { paymentId }, requestId);
};

export const listPaymentsHandler = async (req, res, requestId) => {
  const userId = Number(req.params.userId || req.auth.user_id);
  const payments = await listPaymentsByUser({ tenantId: req.auth.tenant_id, userId });
  return sendJson(res, 200, { data: payments }, requestId);
};
