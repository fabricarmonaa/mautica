import { tenantService } from '../../application/tenantService.js';

export async function requireAuth(context, roles = []) {
  if (!context.user) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  if (roles.length && !roles.includes(context.user.role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  if (context.user.role !== 'SUPER_ADMIN') {
    await tenantService.ensureActiveTenant(context.user.tenant_id);
  }
}
