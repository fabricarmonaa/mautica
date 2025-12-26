import { pool } from '../db/pool.js';
import { fetchPendingEvents, markEventProcessed } from '../repositories/outbox-repository.js';
import { updateCashReadModel, updateOrderReadModel, updatePaymentReadModel, upsertUserReadModel } from '../read-models/read-model-repository.js';

const handlers = {
  USER_CREATED: async (connection, event) => {
    await upsertUserReadModel(connection, event.payload);
  },
  ORDER_CREATED: async (connection, event) => {
    await updateOrderReadModel(connection, event.payload);
  },
  PAYMENT_REGISTERED: async (connection, event) => {
    await updatePaymentReadModel(connection, event.payload);
  },
  CASH_MOVEMENT_CREATED: async (connection, event) => {
    await updateCashReadModel(connection, {
      tenantId: event.payload.tenantId,
      dateKey: event.payload.occurredAt,
      categoryId: event.payload.categoryId,
      categoryType: event.payload.categoryType,
      amount: event.payload.amount
    });
  }
};

const run = async () => {
  const connection = await pool.getConnection();
  try {
    const events = await fetchPendingEvents(connection, 50);
    for (const event of events) {
      const payload = JSON.parse(event.payload);
      const handler = handlers[event.event_type];
      if (handler) {
        await handler(connection, { ...event, payload });
      }
      await markEventProcessed(connection, event.id);
    }
  } finally {
    connection.release();
  }
};

setInterval(() => {
  run().catch((error) => console.error('Outbox worker error', error));
}, 2000);

console.log('Outbox worker running');
