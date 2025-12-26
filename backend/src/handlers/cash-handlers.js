import { readJson, sendJson } from '../http/http-utils.js';
import { createCashMovementSchema } from '../utils/validators.js';
import { listMovements, registerMovement } from '../services/cash-service.js';

export const createCashMovementHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createCashMovementSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const movementId = await registerMovement({
    tenantId: req.auth.tenant_id,
    createdBy: req.auth.user_id,
    ...parsed.data
  });
  return sendJson(res, 201, { movementId }, requestId);
};

export const listCashMovementsHandler = async (req, res, requestId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fromDate = url.searchParams.get('from') || '1970-01-01';
  const toDate = url.searchParams.get('to') || '2100-01-01';
  const movements = await listMovements({ tenantId: req.auth.tenant_id, fromDate, toDate });
  return sendJson(res, 200, { data: movements }, requestId);
};
