-- =====================================================
-- TENANTS (EMPRESAS CLIENTES)
-- =====================================================
CREATE TABLE tenants (
  id CHAR(26) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Historial de cambios de estado del tenant (sin NULLs)
CREATE TABLE tenant_status_history (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- Config de IA por tenant
CREATE TABLE tenant_ai_configs (
  tenant_id CHAR(26) PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  model VARCHAR(80) NOT NULL,
  vector_store_ref VARCHAR(255) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- =====================================================
-- USERS (CUENTAS DE SISTEMA)
-- =====================================================
CREATE TABLE users (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  dni VARCHAR(16) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','USER') NOT NULL,
  password_hash VARBINARY(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uniq_tenant_dni (tenant_id, dni),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE user_profiles (
  user_id CHAR(26) PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Campos extra configurables por tenant
CREATE TABLE extra_fields (
  field_id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  type ENUM('TEXT','NUMBER','DATE') NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_extra_field_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE user_extra_values (
  user_id CHAR(26) NOT NULL,
  field_id CHAR(26) NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, field_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (field_id) REFERENCES extra_fields(field_id)
) ENGINE=InnoDB;

-- =====================================================
-- PEDIDOS
-- =====================================================
CREATE TABLE order_statuses (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(60) NOT NULL,
  code VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_order_status_code (tenant_id, code),
  UNIQUE KEY uniq_order_status_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  status_id CHAR(26) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  internal_notes TEXT NOT NULL,
  user_notes TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (status_id) REFERENCES order_statuses(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id CHAR(26) PRIMARY KEY,
  order_id CHAR(26) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- =====================================================
-- PAGOS
-- =====================================================
CREATE TABLE payment_methods (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(60) NOT NULL,
  code VARCHAR(30) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_payment_method_code (tenant_id, code),
  UNIQUE KEY uniq_payment_method_name (tenant_id, name)
) ENGINE=InnoDB;

-- Pagos SIEMPRE existen, y la relación con pedidos es aparte (sin NULL)
CREATE TABLE payments (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  method_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- Vínculo N:N entre pagos y pedidos (pago puede cubrir varios pedidos)
CREATE TABLE payment_orders (
  payment_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  PRIMARY KEY (payment_id, order_id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- =====================================================
-- FACTURAS
-- =====================================================
CREATE TABLE invoice_templates (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_invoice_template_name (tenant_id, name)
) ENGINE=InnoDB;

CREATE TABLE invoice_template_fields (
  id CHAR(26) PRIMARY KEY,
  template_id CHAR(26) NOT NULL,
  label VARCHAR(80) NOT NULL,
  type ENUM('TEXT','NUMBER','DATE') NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  position INT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id),
  UNIQUE KEY uniq_template_field_position (template_id, position)
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  template_id CHAR(26) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id)
) ENGINE=InnoDB;

-- Relación factura ↔ pedido(s) sin NULLs
CREATE TABLE invoice_orders (
  invoice_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  PRIMARY KEY (invoice_id, order_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_field_values (
  id CHAR(26) PRIMARY KEY,
  invoice_id CHAR(26) NOT NULL,
  field_id CHAR(26) NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (field_id) REFERENCES invoice_template_fields(id)
) ENGINE=InnoDB;

-- =====================================================
-- CAJA
-- =====================================================
CREATE TABLE cash_categories (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(80) NOT NULL,
  type ENUM('INCOME','EXPENSE') NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_cash_category (tenant_id, name, type)
) ENGINE=InnoDB;

CREATE TABLE cash_movements (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  category_id CHAR(26) NOT NULL,
  method_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES cash_categories(id),
  FOREIGN KEY (method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- =====================================================
-- AUDITORÍA / EVENTOS DE DOMINIO (CQRS)
-- =====================================================
CREATE TABLE audit_events (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  aggregate_id CHAR(26) NOT NULL,
  type VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

-- (Opcional pero muy útil para IA y depuración)
CREATE TABLE ai_command_logs (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  command_text TEXT NOT NULL,
  parsed_payload JSON NOT NULL,
  status ENUM('PENDING','APPLIED','REJECTED') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================
-- READ MODELS (MATERIALIZADAS)
-- =====================================================
CREATE TABLE users_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  dni VARCHAR(16) NOT NULL,
  name VARCHAR(160) NOT NULL,
  last_payment TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:00',
  balance DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE orders_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  status VARCHAR(60) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  last_update TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payments_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(60) NOT NULL,
  paid_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE cashbox_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  category VARCHAR(80) NOT NULL,
  method VARCHAR(60) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;
