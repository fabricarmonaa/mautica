import { superAdminController } from '../controllers/superAdminController.js';
import { adminController } from '../controllers/adminController.js';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';
import { aiProxyController } from '../controllers/aiProxyController.js';

function buildRouteRegex(path) {
  const parts = path.split('/').filter(Boolean);
  const names = [];
  const regexParts = parts.map(p => {
    if (p.startsWith(':')) {
      names.push(p.slice(1));
      return '([^/]+)';
    }
    return p;
  });
  const regex = new RegExp(`^/${regexParts.join('/')}$`);
  return { regex, names };
}

export function createRouter() {
  const routes = [];

  function register(method, path, handler) {
    const { regex, names } = buildRouteRegex(path);
    routes.push({ method, regex, names, handler });
  }

  function matchRoute(method, path) {
    return routes.find(r => r.method === method && r.regex.test(path));
  }

  register('POST', '/auth/login', authController.login);
  register('POST', '/auth/refresh', authController.refresh);

  register('GET', '/super/tenants', superAdminController.listTenants);
  register('POST', '/super/tenants', superAdminController.createTenant);
  register('PATCH', '/super/tenants/status', superAdminController.updateTenantStatus);

  register('GET', '/admin/users', adminController.listUsers);
  register('POST', '/admin/users', adminController.createUser);
  register('PATCH', '/admin/users/:id', adminController.updateUser);
  register('GET', '/admin/orders', adminController.listOrders);
  register('POST', '/admin/orders', adminController.createOrder);
  register('PATCH', '/admin/orders/:id/status', adminController.updateOrderStatus);
  register('GET', '/admin/payments', adminController.listPayments);
  register('POST', '/admin/payments', adminController.registerPayment);
  register('GET', '/admin/cash', adminController.listCash);
  register('POST', '/admin/cash', adminController.createCash);
  register('GET', '/admin/invoices', adminController.listInvoices);
  register('POST', '/admin/invoices', adminController.createInvoice);

  register('POST', '/admin/ai/command', aiProxyController.handleVoiceCommand);
  register('POST', '/admin/ai/command/:id/confirm', aiProxyController.confirmCommand);
  register('POST', '/admin/ai/command/:id/reject', aiProxyController.rejectCommand);

  register('GET', '/me/profile', userController.profile);
  register('POST', '/me/password', userController.changePassword);
  register('GET', '/me/orders', userController.myOrders);
  register('GET', '/me/payments', userController.myPayments);

  return {
    handle: async context => {
      const route = matchRoute(context.method, context.url.pathname);
      if (!route) {
        throw Object.assign(new Error('Not Found'), { statusCode: 404 });
      }
      const match = context.url.pathname.match(route.regex);
      if (match) {
        route.names.forEach((name, index) => {
          context.params[name] = match[index + 1];
        });
      }
      await route.handler(context);
    }
  };
}
