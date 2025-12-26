export const createOutboxEvent = async (connection, event) => {
  const sql = `
    INSERT INTO outbox_events
      (tenant_id, aggregate_type, aggregate_id, event_type, payload, status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `;
  await connection.execute(sql, [
    event.tenantId,
    event.aggregateType,
    event.aggregateId,
    event.eventType,
    JSON.stringify(event.payload)
  ]);
};

export const fetchPendingEvents = async (connection, limit = 50) => {
  const [rows] = await connection.execute(
    `SELECT * FROM outbox_events WHERE status = 'PENDING' ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  return rows;
};

export const markEventProcessed = async (connection, eventId) => {
  await connection.execute(
    `UPDATE outbox_events SET status = 'PROCESSED', processed_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [eventId]
  );
};
