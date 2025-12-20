import { readJson, sendJson } from '../http/http-utils.js';
import { fetchSettings, saveSettings } from '../services/tenant-service.js';

export const getSettingsHandler = async (req, res, requestId) => {
  const settings = await fetchSettings(req.auth.tenant_id);
  return sendJson(res, 200, settings, requestId);
};

export const updateSettingsHandler = async (req, res, requestId) => {
  const body = await readJson(req);
  await saveSettings(req.auth.tenant_id, {
    timezone: body.timezone || 'UTC',
    currency: body.currency || 'USD',
    invoiceTemplateVersion: body.invoiceTemplateVersion || 1
  });
  return sendJson(res, 200, { status: 'ok' }, requestId);
};
