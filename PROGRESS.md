# Estado del proyecto (Iteración 3)

## Entregado en esta iteración
- **Pedidos/Pagos/Facturas/Caja**: repositorios MySQL y comandos de aplicación para crear pedidos con items, registrar pagos (N:N con pedidos), generar facturas desde plantillas y movimientos de caja con categorías y métodos normalizados.
- **CQRS**: refresco inline de `orders_read`, `payments_read`, `cashbox_read` y actualización ampliada de `users_read` tras comandos de dominio; eventos auditables en `audit_events` para todos los cambios.
- **IA con confirmación**: `/admin/ai/command` registra comandos estructurados de IA en `ai_command_logs` con estado `PENDING`, y `/admin/ai/command/:id/confirm|reject` aplican o descartan acciones (soportadas: CREATE_ORDER + pago opcional, REGISTER_PAYMENT, CREATE_CASH_MOVEMENT, CREATE_USER).
- **Endpoints ADMIN**: ABM básico de pedidos (`/admin/orders`), pagos (`/admin/payments`), caja (`/admin/cash`), facturas (`/admin/invoices`); actualizaciones de estado de pedido y listados basados en read models.
- **Endpoints USER**: historial de pedidos y pagos del usuario autenticado (`/me/orders`, `/me/payments`).
- **Frontend RN**: stubs de listado para pedidos, pagos y caja, más flujo de comando IA con confirmación/rechazo simulados.

## Cobertura funcional actual
- Endpoints funcionales: auth (`/auth/login`, `/auth/refresh`), panel SUPER_ADMIN (tenants alta/listado/cambio de estado), panel ADMIN para usuarios, pedidos, pagos, caja, facturas, IA (confirm/reject), panel USER para perfil, cambio de password y read de pedidos/pagos.
- CQRS: read models actualizados inmediatamente en users/orders/payments/cash a partir de los comandos que registran eventos en `audit_events`.
- IA: microservicio Python devuelve intent estructurado y resumen; backend aplica acciones solo tras confirmación humana (estado `PENDING` → `APPLIED`/`REJECTED`).

## Pendiente próxima iteración
- CRUD completo de templates de factura y campos extra vía frontend, gestión de métodos de pago/categorías desde UI.
- Aplicar más acciones IA (actualización de estado de pedido, generación de facturas avanzadas) y worker async de proyecciones.
- Tests automatizados, seeds iniciales de métodos de pago/categorías y UI más rica para usuario final.
