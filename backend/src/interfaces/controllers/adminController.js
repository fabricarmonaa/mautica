import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { userService } from '../../application/userService.js';
import { usersReadRepository } from '../../domain/repositories/usersReadRepository.js';
import { usersRepository } from '../../domain/repositories/usersRepository.js';
import { orderService } from '../../application/orderService.js';
import { ordersReadRepository } from '../../domain/repositories/ordersReadRepository.js';
import { paymentService } from '../../application/paymentService.js';
import { paymentsReadRepository } from '../../domain/repositories/paymentsReadRepository.js';
import { cashService } from '../../application/cashService.js';
import { cashboxReadRepository } from '../../domain/repositories/cashboxReadRepository.js';
import { invoiceService } from '../../application/invoiceService.js';
import { invoicesRepository } from '../../domain/repositories/invoicesRepository.js';

const createUserSchema = z.object({
  dni: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  password: z.string(),
  extra_fields: z.record(z.string()).optional()
});

const updateUserSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  active: z.boolean(),
  extra_fields: z.record(z.string()).optional()
});

const createOrderSchema = z.object({
  user_id: z.string(),
  status_code: z.string(),
  internal_notes: z.string().optional(),
  user_notes: z.string().optional(),
  items: z.array(
    z.object({
      sku: z.string(),
      description: z.string(),
      quantity: z.number(),
      price: z.number()
    })
  )
});

const updateOrderStatusSchema = z.object({ status_code: z.string() });

const registerPaymentSchema = z.object({
  user_id: z.string(),
  method_code: z.string(),
  amount: z.number(),
  order_ids: z.array(z.string()).optional()
});

const createCashSchema = z.object({
  category_id: z.string().optional(),
  category_name: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  method_code: z.string(),
  amount: z.number(),
  note: z.string().optional()
});

const createInvoiceSchema = z.object({
  user_id: z.string(),
  template_id: z.string(),
  order_ids: z.array(z.string()),
  field_values: z.record(z.any())
});

export const adminController = {
  listUsers: async context => {
    await requireAuth(context, ['ADMIN']);
    const filters = {
      dni: context.query.get('dni') || undefined,
      name: context.query.get('name') || undefined,
      active: typeof context.query.get('active') !== 'undefined'
        ? context.query.get('active') === 'true'
        : undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const users = await usersReadRepository.list({
      tenant_id: context.user.tenant_id,
      filters,
      page,
      limit
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ users }));
  },

  createUser: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = createUserSchema.parse(context.body || {});
    const user = await userService.createUser({ tenant_id: context.user.tenant_id, payload });
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ user_id: user.id }));
  },

  updateUser: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = updateUserSchema.parse(context.body || {});
    const userId = context.params.id;
    const existing = await usersRepository.findById(userId, context.user.tenant_id);
    if (!existing) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    await userService.updateUser({ tenant_id: context.user.tenant_id, user_id: userId, payload });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ updated: true }));
  },

  listOrders: async context => {
    await requireAuth(context, ['ADMIN']);
    const filters = {
      user_id: context.query.get('user_id') || undefined,
      status: context.query.get('status') || undefined,
      from: context.query.get('from') || undefined,
      to: context.query.get('to') || undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const orders = await ordersReadRepository.list({ tenant_id: context.user.tenant_id, filters, page, limit });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ orders }));
  },

  createOrder: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = createOrderSchema.parse(context.body || {});
    const order = await orderService.createOrder({
      tenant_id: context.user.tenant_id,
      user_id: payload.user_id,
      status_code: payload.status_code,
      items: payload.items,
      internal_notes: payload.internal_notes || '',
      user_notes: payload.user_notes || ''
    });
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ order_id: order.id }));
  },

  updateOrderStatus: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = updateOrderStatusSchema.parse(context.body || {});
    await orderService.updateStatus({
      tenant_id: context.user.tenant_id,
      order_id: context.params.id,
      status_code: payload.status_code
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ updated: true }));
  },

  registerPayment: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = registerPaymentSchema.parse(context.body || {});
    const payment = await paymentService.registerPayment({
      tenant_id: context.user.tenant_id,
      user_id: payload.user_id,
      method_code: payload.method_code,
      amount: payload.amount,
      order_ids: payload.order_ids || []
    });
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ payment_id: payment.id }));
  },

  listPayments: async context => {
    await requireAuth(context, ['ADMIN']);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const user_id = context.query.get('user_id') || undefined;
    const payments = await paymentsReadRepository.list({ tenant_id: context.user.tenant_id, user_id, page, limit });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ payments }));
  },

  createCash: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = createCashSchema.parse(context.body || {});
    const movement = await cashService.createMovement({
      tenant_id: context.user.tenant_id,
      category_id: payload.category_id,
      category_name: payload.category_name,
      type: payload.type,
      method_code: payload.method_code,
      amount: payload.amount,
      note: payload.note || ''
    });
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ movement_id: movement.id }));
  },

  listCash: async context => {
    await requireAuth(context, ['ADMIN']);
    const filters = {
      category: context.query.get('category') || undefined,
      method: context.query.get('method') || undefined,
      from: context.query.get('from') || undefined,
      to: context.query.get('to') || undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const cash = await cashboxReadRepository.list({ tenant_id: context.user.tenant_id, filters, page, limit });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ cash }));
  },

  createInvoice: async context => {
    await requireAuth(context, ['ADMIN']);
    const payload = createInvoiceSchema.parse(context.body || {});
    const invoice = await invoiceService.createInvoice({
      tenant_id: context.user.tenant_id,
      user_id: payload.user_id,
      template_id: payload.template_id,
      order_ids: payload.order_ids,
      field_values: payload.field_values
    });
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ invoice_id: invoice.id }));
  },

  listInvoices: async context => {
    await requireAuth(context, ['ADMIN']);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const invoices = await invoicesRepository.listByTenant(context.user.tenant_id, { page, limit });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ invoices }));
  }
};
