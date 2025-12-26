# SaaS Multi-tenant Gestión (Mautica)

## Modelo de dominio
- **Tenant**: empresa cliente; campos: id, nombre, estado, fechas de alta/baja, configuración IA y plantillas de factura.
- **UserAccount**: credenciales y rol (SUPER_ADMIN, ADMIN/OWNER, USER/CLIENT) ligados a tenant_id.
- **CustomerProfile**: datos de usuario final (DNI único por tenant, contacto, campos extra configurables).
- **Order**: vinculado a usuario final y tenant; contiene items, estado y notas (internas y visibles).
- **Payment**: pagos asociados a pedidos o a cuenta corriente con método de pago normalizado.
- **Invoice**: instancia generada a partir de plantilla configurable por tenant.
- **CashMovement**: ingresos/egresos con categoría y método.
- **AIConfig**: contexto/plantillas/embedding store por tenant.
- **AuditEvent**: eventos de dominio para CQRS y refresco de read models.

## Diagrama de base de datos (BCNF)
Tablas principales (sin NULL lógicos):
- tenants(id PK, name, status, created_at)
- tenant_status_history(id PK, tenant_id FK, status, changed_at)
- tenant_ai_configs(tenant_id PK/FK, provider, model, vector_store_ref)
- users(id PK, tenant_id FK, dni UNIQUE(tenant_id,dni), role, password_hash, created_at, active)
- user_profiles(user_id PK/FK, first_name, last_name, email, phone)
- extra_fields(field_id PK, tenant_id FK, name, type, required)
- user_extra_values(user_id FK, field_id FK, value)
- order_statuses(id PK, tenant_id FK, name, code, sort_order)
- orders(id PK, tenant_id FK, user_id FK, status_id FK, created_at, updated_at, internal_notes, user_notes)
- order_items(id PK, order_id FK, sku, description, quantity, price)
- payment_methods(id PK, tenant_id FK, name, code)
- payments(id PK, tenant_id FK, user_id FK, method_id FK, amount, paid_at)
- payment_orders(payment_id FK, order_id FK)
- invoice_templates(id PK, tenant_id FK, name)
- invoice_template_fields(id PK, template_id FK, label, type, required, position)
- invoices(id PK, tenant_id FK, user_id FK, template_id FK, issued_at, total)
- invoice_orders(invoice_id FK, order_id FK)
- invoice_field_values(id PK, invoice_id FK, field_id FK, value)
- cash_categories(id PK, tenant_id FK, name, type)
- cash_movements(id PK, tenant_id FK, category_id FK, method_id FK, amount, occurred_at, note)
- audit_events(id PK, tenant_id FK, aggregate_id, type, payload, created_at)
- ai_command_logs(id PK, tenant_id FK, user_id FK, command_text, parsed_payload, status, created_at)

Read models (materializadas):
- users_read(id, tenant_id, dni, name, last_payment DEFAULT 1970-01-01, balance)
- orders_read(id, tenant_id, user_id, status, total, last_update)
- payments_read(id, tenant_id, user_id, amount, method, paid_at)
- cashbox_read(id, tenant_id, category, method, amount, occurred_at)

## Arquitectura
- **CQRS**: comandos crean eventos (audit_events) y consultan modelos de lectura users_read, orders_read, etc.
- **Node.js**: servidor HTTP nativo con router propio (sin frameworks pesados). Capa de dominio separada de interfaces HTTP. JWT incluye tenant_id, user_id, role, session_id.
- **Comunicación Node ↔ Python**: Node envía comandos de voz estructurados al microservicio de IA mediante HTTP POST `/commands`. Python devuelve acciones y datos estructurados que el backend puede mapear a comandos de dominio.
- **Multi-tenant IA**: microservicio carga `TenantConfig` por tenant (vector store y plantillas). Nunca comparte contexto entre tenants.

## Iteración 3 - estado actual
- Persistencia real para tenants, usuarios, pedidos (con items y estados), pagos (N:N con pedidos), facturas y caja. Métodos de pago/categorías se esperan existentes o se crean on-demand en caja.
- JWT incluye tenant_id, user_id, role, session_id; middleware de autorización valida rol y rechaza tenants suspendidos.
- Panel SUPER_ADMIN: crear/listar tenants, cambiar estado y registrar en tenant_status_history.
- Panel ADMIN: ABM de usuarios, pedidos (crear/listar/actualizar estado), pagos, facturas y caja; eventos USER_CREATED/UPDATED, ORDER_CREATED/STATUS_CHANGED, PAYMENT_REGISTERED, CASH_MOVEMENT_CREATED y actualizaciones inmediatas de `users_read`, `orders_read`, `payments_read`, `cashbox_read`.
- IA por voz: `/admin/ai/command` guarda comandos estructurados en `ai_command_logs` como `PENDING` y devuelve resumen; `/admin/ai/command/:id/confirm` aplica CREATE_ORDER (con pago opcional), REGISTER_PAYMENT, CREATE_CASH_MOVEMENT o CREATE_USER; `/admin/ai/command/:id/reject` descarta.
- Frontend RN: login real y stubs para listados de tenants, usuarios, pedidos, pagos, caja y flujo de confirmación IA.

## Endpoints principales
### Auth
- `POST /auth/login` (dni, password, tenant_id) → token JWT.
- `POST /auth/refresh` → nuevo token.
- Refresh actual: se reemite un JWT corto siempre que el token vigente siga siendo válido y el tenant esté activo (no se almacena refresh token separado todavía).

### Panel dueño del software (SUPER_ADMIN)
- `GET /super/tenants`
- `POST /super/tenants`
- `PATCH /super/tenants/status`

### Panel empresa (ADMIN/OWNER)
> Nota: el SUPER_ADMIN ahora puede invocar estos endpoints para un tenant específico usando `?tenant_id=<id>` en la query, útil para crear el primer ADMIN de un tenant recién dado de alta.
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/orders` / `POST /admin/orders` / `PATCH /admin/orders/:id/status`
- `GET /admin/payments` / `POST /admin/payments`
- `GET /admin/cash` / `POST /admin/cash`
- `GET /admin/invoices` / `POST /admin/invoices`
- `POST /admin/ai/command` (registro PENDING)
- `POST /admin/ai/command/:id/confirm` / `POST /admin/ai/command/:id/reject`

### Panel usuario final
- `GET /me/profile`
- `POST /me/password`
- `GET /me/orders`
- `GET /me/payments`

### IA (Python)
- `POST /commands` (tenant_id, command | audio_base64, user_context) → intent estructurado (action + data), summary y transcript.

## Cómo levantar
1. Copiar `.env.example` a `.env` y completar credenciales. Ejemplo solicitado:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=Orbia
   DB_POOL_SIZE=10
   JWT_SECRET=sasasa
   JWT_EXPIRES_IN=3600
   BCRYPT_ROUNDS=10
   AI_SERVICE_URL=http://localhost:8000
   SUPER_ADMIN_TENANT_ID=root-tenant
   SUPER_ADMIN_DNI=00000000
   SUPER_ADMIN_PASSWORD=admin123
   ```
2. Backend Node:
   ```bash
   cd backend && npm install && npm run dev
   ```
3. Servicio IA:
   ```bash
   cd services/ai && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Frontend:
   - React Native: usar CLI/Expo apuntando al backend (stubs en `frontend/`).
   - SPA React web: `cd frontend/spa && npm install && npm run dev` (Vite en puerto 5173 por defecto).

### Pruebas rápidas (PowerShell / curl)
```powershell
# Login SUPER_ADMIN (tenant_id opcional gracias al fallback root-tenant)
$body = '{"tenant_id":"root-tenant","dni":"00000000","password":"admin123"}'
$login = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -ContentType "application/json" -Body $body
$TOKEN = $login.access_token

# Crear tenant
$tenantBody = '{"name":"Empresa Demo 1"}'
Invoke-RestMethod -Uri "http://localhost:3000/super/tenants" -Method Post -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType "application/json" -Body $tenantBody

# Crear primer ADMIN para ese tenant desde SUPER_ADMIN (nuevo soporte tenant_id en query)
$userBody = '{"dni":"1001","first_name":"Fabricio","last_name":"Admin","email":"admin@empresa.com","phone":"123456","role":"ADMIN","password":"admin123"}'
Invoke-RestMethod -Uri "http://localhost:3000/admin/users?tenant_id=<TENANT_ID_NUEVO>" -Method Post -Headers @{ Authorization = "Bearer $TOKEN" } -ContentType "application/json" -Body $userBody
```

### Bootstrap inicial (SUPER_ADMIN listo para usar)
- Al iniciar el backend se crea automáticamente un tenant raíz y un usuario SUPER_ADMIN si no existen.
- Variables de entorno clave (definidas en `.env.example`):
  - `SUPER_ADMIN_TENANT_ID`, `SUPER_ADMIN_TENANT_NAME`
  - `SUPER_ADMIN_DNI`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_FIRST_NAME`, `SUPER_ADMIN_LAST_NAME`
- Inicio de sesión inicial (si no cambiaste variables):
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"tenant_id":"root-tenant","dni":"00000000","password":"admin123"}'
  ```
  Con el token obtenido puedes crear tenants (`/super/tenants`) y luego administrarlos.

## Ejemplos de peticiones
```bash
curl -X POST http://localhost:3000/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"tenant_id":"t1","dni":"123","password":"secret"}'

curl -X POST http://localhost:3000/admin/ai/command \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"command":"crea un pedido para Nadia"}'
```
