import { readJson, sendJson } from '../http/http-utils.js';
import { createOrderSchema } from '../utils/validators.js';
import { createOrderWithItems, getOrderDetail, listOrdersPaged, listOrdersForUser } from '../services/order-service.js';

export const createOrderHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const orderId = await createOrderWithItems({ tenantId: req.auth.tenant_id, ...parsed.data });
  return sendJson(res, 201, { orderId }, requestId);
};

export const listOrdersHandler = async (req, res, requestId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Number(url.searchParams.get('limit') || 20);
  const offset = Number(url.searchParams.get('offset') || 0);
  const orders = await listOrdersPaged({ tenantId: req.auth.tenant_id, limit, offset });
  return sendJson(res, 200, { data: orders }, requestId);
};

export const listMyOrdersHandler = async (req, res, requestId) => {
  const orders = await listOrdersForUser({ tenantId: req.auth.tenant_id, userId: req.auth.user_id });
  return sendJson(res, 200, { data: orders }, requestId);
};

export const getOrderHandler = async (req, res, requestId) => {
  const order = await getOrderDetail({ tenantId: req.auth.tenant_id, orderId: Number(req.params.orderId) });
  if (!order) {
    return sendJson(res, 404, { error: 'not_found' }, requestId);
  }
  return sendJson(res, 200, order, requestId);
};
