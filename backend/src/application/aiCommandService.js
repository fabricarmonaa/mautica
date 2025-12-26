import { aiCommandLogsRepository } from '../domain/repositories/aiCommandLogsRepository.js';
import { userService } from './userService.js';
import { orderService } from './orderService.js';
import { paymentService } from './paymentService.js';
import { cashService } from './cashService.js';
import { usersRepository } from '../domain/repositories/usersRepository.js';

async function resolveUserIdByDni(tenant_id, user_dni) {
  const user = await usersRepository.findByDniWithinTenant(tenant_id, user_dni);
  if (!user) {
    const error = new Error('User not found for DNI');
    error.statusCode = 404;
    throw error;
  }
  return user.id;
}

async function applyAction(tenant_id, payload) {
  const action = payload.action;
  if (action === 'CREATE_ORDER') {
    const user_id = payload.data.user_id || (payload.data.user_dni
      ? await resolveUserIdByDni(tenant_id, payload.data.user_dni)
      : null);
    if (!user_id) {
      const error = new Error('Missing user for order');
      error.statusCode = 400;
      throw error;
    }
    const order = await orderService.createOrder({
      tenant_id,
      user_id,
      status_code: payload.data.status_code || 'PENDING',
      items: payload.data.items || [],
      internal_notes: payload.data.internal_notes || '',
      user_notes: payload.data.user_notes || ''
    });
    if (payload.data.payment) {
      await paymentService.registerPayment({
        tenant_id,
        user_id,
        method_code: payload.data.payment.method_code,
        amount: payload.data.payment.amount,
        order_ids: payload.data.payment.order_ids || [order.id]
      });
    }
    return order;
  }
  if (action === 'REGISTER_PAYMENT') {
    const user_id = payload.data.user_id || (payload.data.user_dni
      ? await resolveUserIdByDni(tenant_id, payload.data.user_dni)
      : null);
    if (!user_id) {
      const error = new Error('Missing user for payment');
      error.statusCode = 400;
      throw error;
    }
    return paymentService.registerPayment({
      tenant_id,
      user_id,
      method_code: payload.data.method_code,
      amount: payload.data.amount,
      order_ids: payload.data.order_ids || []
    });
  }
  if (action === 'CREATE_CASH_MOVEMENT') {
    return cashService.createMovement({
      tenant_id,
      category_id: payload.data.category_id,
      category_name: payload.data.category_name,
      type: payload.data.type,
      method_code: payload.data.method_code,
      amount: payload.data.amount,
      note: payload.data.note || ''
    });
  }
  if (action === 'CREATE_USER') {
    return userService.createUser({ tenant_id, payload: payload.data });
  }
  const error = new Error('Unsupported action');
  error.statusCode = 400;
  throw error;
}

export const aiCommandService = {
  async logPending({ tenant_id, user_id, command_text, parsed_payload }) {
    const record = await aiCommandLogsRepository.insert({
      tenant_id,
      user_id,
      command_text,
      parsed_payload,
      status: 'PENDING'
    });
    return record;
  },

  async confirm({ tenant_id, command_id }) {
    const log = await aiCommandLogsRepository.findById(command_id, tenant_id);
    if (!log) {
      const error = new Error('Command not found');
      error.statusCode = 404;
      throw error;
    }
    if (log.status !== 'PENDING') {
      const error = new Error('Command already handled');
      error.statusCode = 400;
      throw error;
    }
    const result = await applyAction(tenant_id, log.parsed_payload);
    await aiCommandLogsRepository.updateStatus(command_id, tenant_id, 'APPLIED');
    return result;
  },

  async reject({ tenant_id, command_id }) {
    const log = await aiCommandLogsRepository.findById(command_id, tenant_id);
    if (!log) {
      const error = new Error('Command not found');
      error.statusCode = 404;
      throw error;
    }
    if (log.status !== 'PENDING') {
      const error = new Error('Command already handled');
      error.statusCode = 400;
      throw error;
    }
    await aiCommandLogsRepository.updateStatus(command_id, tenant_id, 'REJECTED');
    return { rejected: true };
  }
};
