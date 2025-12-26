import { Router } from '../http/router.js';
import { rateLimit, requireAuth } from '../http/middleware.js';
import { loginHandler, changePasswordHandler } from '../handlers/auth-handlers.js';
import { createUserHandler, getUserHandler, listUsersHandler, getUserProfileHandler } from '../handlers/user-handlers.js';
import { createOrderHandler, getOrderHandler, listOrdersHandler, listMyOrdersHandler } from '../handlers/order-handlers.js';
import { createPaymentHandler, listPaymentsHandler } from '../handlers/payment-handlers.js';
import { createInvoiceHandler, createTemplateHandler, getTemplateHandler, listInvoicesHandler } from '../handlers/invoice-handlers.js';
import { createCashMovementHandler, listCashMovementsHandler } from '../handlers/cash-handlers.js';
import { getSettingsHandler, updateSettingsHandler } from '../handlers/tenant-handlers.js';

export const buildRouter = () => {
  const router = new Router();
  const limited = rateLimit({ windowMs: 60000, max: 100 });

  router.register('POST', '/auth/login', limited(loginHandler));
  router.register('POST', '/auth/change-password', requireAuth()(limited(changePasswordHandler)));

  router.register('POST', '/admin/users', requireAuth(['OWNER', 'ADMIN'])(createUserHandler));
  router.register('GET', '/admin/users', requireAuth(['OWNER', 'ADMIN'])(listUsersHandler));
  router.register('GET', '/admin/users/:userId', requireAuth(['OWNER', 'ADMIN'])(getUserHandler));

  router.register('POST', '/admin/orders', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(createOrderHandler));
  router.register('GET', '/admin/orders', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(listOrdersHandler));
  router.register('GET', '/admin/orders/:orderId', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(getOrderHandler));

  router.register('POST', '/admin/payments', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(createPaymentHandler));
  router.register('GET', '/admin/payments/:userId', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(listPaymentsHandler));

  router.register('POST', '/admin/invoices/templates', requireAuth(['OWNER', 'ADMIN'])(createTemplateHandler));
  router.register('GET', '/admin/invoices/templates/:version', requireAuth(['OWNER', 'ADMIN'])(getTemplateHandler));
  router.register('POST', '/admin/invoices', requireAuth(['OWNER', 'ADMIN'])(createInvoiceHandler));
  router.register('GET', '/admin/invoices/:userId', requireAuth(['OWNER', 'ADMIN'])(listInvoicesHandler));

  router.register('POST', '/admin/cash/movements', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(createCashMovementHandler));
  router.register('GET', '/admin/cash/movements', requireAuth(['OWNER', 'ADMIN', 'STAFF'])(listCashMovementsHandler));

  router.register('GET', '/admin/settings', requireAuth(['OWNER', 'ADMIN'])(getSettingsHandler));
  router.register('PUT', '/admin/settings', requireAuth(['OWNER', 'ADMIN'])(updateSettingsHandler));

  router.register('GET', '/me/profile', requireAuth(['USER', 'OWNER', 'ADMIN', 'STAFF'])(getUserProfileHandler));
  router.register('GET', '/me/orders', requireAuth(['USER'])(listMyOrdersHandler));
  router.register('GET', '/me/payments', requireAuth(['USER'])(listPaymentsHandler));
  router.register('GET', '/me/invoices', requireAuth(['USER'])(listInvoicesHandler));

  return router;
};
