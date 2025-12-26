# Mautica SaaS Multi-tenant

## Modelo de dominio y módulos

**Módulos principales**
- **Identidad & Acceso:** tenants, usuarios, roles, sesiones y autenticación.
- **Clientes/Usuarios:** perfiles, contactos, campos extra versionados.
- **Pedidos:** pedidos, items, estados y notas.
- **Pagos / Cuenta corriente:** pagos vinculados a pedidos y saldo del usuario.
- **Facturación:** plantillas versionadas y documentos emitidos.
- **Caja:** categorías, métodos, movimientos y reportes.
- **Configuración tenant:** moneda, zona horaria, versión de plantilla activa.
- **Auditoría:** cambios y actores.
- **CQRS / Read models:** `users_read`, `orders_read`, `cash_read`.

**Bounded Contexts / Carpetas backend**
- `src/domain`: reglas de dominio (liviano).
- `src/commands`: comandos de escritura.
- `src/queries`: queries de lectura.
- `src/handlers`: handlers HTTP.
- `src/repositories`: acceso MySQL.
- `src/read-models`: proyecciones para lecturas.
- `src/workers`: worker outbox.

## Diagrama de tablas (texto)

**Core**
- `tenants` 1---1 `tenant_settings`
- `tenants` 1---n `users`
- `users` 1---1 `user_passwords`
- `users` 1---0/1 `user_contacts`
- `tenants` 1---n `profile_field_defs` (versionado)
- `profile_field_defs` 1---n `profile_field_values_*`

**Pedidos**
- `tenants` 1---n `order_statuses`
- `users` 1---n `orders`
- `orders` 1---n `order_items`
- `orders` 1---n `order_notes`

**Pagos**
- `tenants` 1---n `payment_methods`
- `users` 1---n `payments`
- `payments` n---n `orders` (via `payment_order_links`)

**Facturación**
- `tenants` 1---n `invoice_template_versions`
- `invoice_template_versions` 1---n `invoice_template_fields`
- `users` 1---n `invoice_documents`
- `invoice_documents` 1---n `invoice_field_values_*`

**Caja**
- `tenants` 1---n `cash_categories`
- `tenants` 1---n `cash_methods`
- `cash_movements` 1---0/1 `cash_movement_order_refs`
- `cash_movements` 1---0/1 `cash_movement_invoice_refs`

**Auditoría + CQRS**
- `audit_logs` (cambios)
- `outbox_events` -> worker -> `users_read`, `orders_read`, `cash_read`

## Read models
- `users_read`: totales, deuda, último pedido/pago.
- `orders_read`: resumen por pedido + usuario.
- `cash_read`: agregados por fecha y categoría.

## Endpoints (MVP)

**Auth**
- `POST /auth/login`
- `POST /auth/change-password`

**Admin (OWNER/ADMIN/STAFF)**
- `POST /admin/users`
- `GET /admin/users`
- `GET /admin/users/:userId`
- `POST /admin/orders`
- `GET /admin/orders`
- `GET /admin/orders/:orderId`
- `POST /admin/payments`
- `GET /admin/payments/:userId`
- `POST /admin/invoices/templates`
- `GET /admin/invoices/templates/:version`
- `POST /admin/invoices`
- `GET /admin/invoices/:userId`
- `POST /admin/cash/movements`
- `GET /admin/cash/movements`
- `GET /admin/settings`
- `PUT /admin/settings`

**Usuario final**
- `GET /me/profile`
- `GET /me/orders`
- `GET /me/payments`
- `GET /me/invoices`

## Flujos principales
1. **Dueño crea usuario -> setea contraseña -> usuario entra -> cambia contraseña**
2. **Dueño crea pedido -> usuario lo ve -> dueño registra pago -> se refleja en historial**
3. **Dueño configura plantilla de factura -> genera factura -> lista por fecha**
4. **Movimientos de caja -> reporte mensual**

## SQL
- `sql/schema.sql` (schema + índices)
- `sql/seeds.sql` (seed mínimo)

## Backend (Node.js nativo)

```bash
cd backend
cp .env.example .env
npm install
npm run start
```

Worker CQRS:
```bash
npm run worker
```

## Frontend (React Native)

```bash
cd frontend
npm install
npm run start
```

## Requests de ejemplo

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":1,"dni":"30000000","password":"password"}'
```

```bash
curl -X POST http://localhost:3000/admin/users \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"dni":"40000000","firstName":"Ana","lastName":"Lopez","role":"USER","password":"TempPass123"}'
```
