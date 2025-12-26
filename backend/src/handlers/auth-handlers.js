import { readJson, sendJson } from '../http/http-utils.js';
import { loginSchema, changePasswordSchema } from '../utils/validators.js';
import { login, changePassword } from '../services/auth-service.js';

export const loginHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const result = await login(parsed.data);
  if (!result) {
    return sendJson(res, 401, { error: 'invalid_credentials' }, requestId);
  }
  return sendJson(res, 200, result, requestId);
};

export const changePasswordHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, { error: 'invalid_payload', details: parsed.error.flatten() }, requestId);
  }
  const success = await changePassword({
    userId: req.auth.user_id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword
  });
  if (!success) {
    return sendJson(res, 400, { error: 'invalid_password' }, requestId);
  }
  return sendJson(res, 200, { status: 'ok' }, requestId);
};
