import { readJson, sendJson } from '../http/http-utils.js';
import { createUserSchema } from '../utils/validators.js';
import { createUserWithPassword, getUser, getUserReadProfile, listUsersPaged } from '../services/user-service.js';

export const createUserHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const userId = await createUserWithPassword({ tenantId: req.auth.tenant_id, ...parsed.data });
  return sendJson(res, 201, { userId }, requestId);
};

export const listUsersHandler = async (req, res, requestId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const limit = Number(url.searchParams.get('limit') || 20);
  const offset = Number(url.searchParams.get('offset') || 0);
  const search = url.searchParams.get('search') || '';
  const users = await listUsersPaged({ tenantId: req.auth.tenant_id, limit, offset, search });
  return sendJson(res, 200, { data: users }, requestId);
};

export const getUserHandler = async (req, res, requestId) => {
  const user = await getUser({ tenantId: req.auth.tenant_id, userId: Number(req.params.userId) });
  if (!user) {
    return sendJson(res, 404, { error: 'not_found' }, requestId);
  }
  return sendJson(res, 200, user, requestId);
};

export const getUserProfileHandler = async (req, res, requestId) => {
  const profile = await getUserReadProfile({ tenantId: req.auth.tenant_id, userId: req.auth.user_id });
  if (!profile) {
    return sendJson(res, 404, { error: 'not_found' }, requestId);
  }
  return sendJson(res, 200, profile, requestId);
};
