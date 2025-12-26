CREATE TABLE tenants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tenant_settings (
  tenant_id BIGINT UNSIGNED NOT NULL,
  timezone VARCHAR(40) NOT NULL DEFAULT 'UTC',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  invoice_template_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id),
  CONSTRAINT fk_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  dni VARCHAR(40) NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  role VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_dni (tenant_id, dni),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE user_passwords (
  user_id BIGINT UNSIGNED NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  must_change TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_password_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE user_contacts (
  user_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address_line VARCHAR(140) NOT NULL,
  city VARCHAR(80) NOT NULL,
  state VARCHAR(80) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(80) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_contact_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE profile_field_defs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(60) NOT NULL,
  label VARCHAR(80) NOT NULL,
  field_type VARCHAR(20) NOT NULL,
  required_flag TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profile_field (tenant_id, field_key, version),
  CONSTRAINT fk_profile_field_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE profile_field_values_text (
  user_id BIGINT UNSIGNED NOT NULL,
  field_def_id BIGINT UNSIGNED NOT NULL,
  value_text VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, field_def_id),
  CONSTRAINT fk_profile_value_text_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_profile_value_text_def FOREIGN KEY (field_def_id) REFERENCES profile_field_defs(id)
) ENGINE=InnoDB;

CREATE TABLE profile_field_values_number (
  user_id BIGINT UNSIGNED NOT NULL,
  field_def_id BIGINT UNSIGNED NOT NULL,
  value_number DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (user_id, field_def_id),
  CONSTRAINT fk_profile_value_number_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_profile_value_number_def FOREIGN KEY (field_def_id) REFERENCES profile_field_defs(id)
) ENGINE=InnoDB;

CREATE TABLE profile_field_values_date (
  user_id BIGINT UNSIGNED NOT NULL,
  field_def_id BIGINT UNSIGNED NOT NULL,
  value_date DATE NOT NULL,
  PRIMARY KEY (user_id, field_def_id),
  CONSTRAINT fk_profile_value_date_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_profile_value_date_def FOREIGN KEY (field_def_id) REFERENCES profile_field_defs(id)
) ENGINE=InnoDB;

CREATE TABLE order_statuses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(40) NOT NULL,
  is_final TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_order_status (tenant_id, name),
  CONSTRAINT fk_order_status_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_status FOREIGN KEY (status_id) REFERENCES order_statuses(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE order_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  visible_to_user TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_notes_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_notes_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_payment_method (tenant_id, name),
  CONSTRAINT fk_payment_method_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method_id BIGINT UNSIGNED NOT NULL,
  paid_at DATE NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_payments_method FOREIGN KEY (method_id) REFERENCES payment_methods(id),
  CONSTRAINT fk_payments_actor FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payment_order_links (
  payment_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (payment_id, order_id),
  CONSTRAINT fk_payment_order_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_payment_order_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_template_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_template (tenant_id, version),
  CONSTRAINT fk_invoice_template_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_invoice_template_actor FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_template_fields (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  template_version INT NOT NULL,
  field_key VARCHAR(60) NOT NULL,
  label VARCHAR(80) NOT NULL,
  field_type VARCHAR(20) NOT NULL,
  required_flag TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_invoice_field (tenant_id, template_version, field_key),
  CONSTRAINT fk_invoice_field_template FOREIGN KEY (tenant_id, template_version)
    REFERENCES invoice_template_versions(tenant_id, version)
) ENGINE=InnoDB;

CREATE TABLE invoice_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  template_version INT NOT NULL,
  issued_at DATE NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_doc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_invoice_doc_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_invoice_doc_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_invoice_doc_template FOREIGN KEY (tenant_id, template_version)
    REFERENCES invoice_template_versions(tenant_id, version)
) ENGINE=InnoDB;

CREATE TABLE invoice_field_values_text (
  invoice_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(60) NOT NULL,
  value_text VARCHAR(255) NOT NULL,
  PRIMARY KEY (invoice_id, field_key),
  CONSTRAINT fk_invoice_value_text_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_documents(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_field_values_number (
  invoice_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(60) NOT NULL,
  value_number DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (invoice_id, field_key),
  CONSTRAINT fk_invoice_value_number_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_documents(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_field_values_date (
  invoice_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(60) NOT NULL,
  value_date DATE NOT NULL,
  PRIMARY KEY (invoice_id, field_key),
  CONSTRAINT fk_invoice_value_date_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_documents(id)
) ENGINE=InnoDB;

CREATE TABLE cash_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  category_type VARCHAR(10) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cash_category (tenant_id, name),
  CONSTRAINT fk_cash_category_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE cash_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cash_method (tenant_id, name),
  CONSTRAINT fk_cash_method_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE cash_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  method_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  occurred_at DATE NOT NULL,
  note VARCHAR(255) NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cash_movement_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_cash_movement_category FOREIGN KEY (category_id) REFERENCES cash_categories(id),
  CONSTRAINT fk_cash_movement_method FOREIGN KEY (method_id) REFERENCES cash_methods(id),
  CONSTRAINT fk_cash_movement_actor FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE cash_movement_order_refs (
  movement_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (movement_id),
  CONSTRAINT fk_cash_ref_order_movement FOREIGN KEY (movement_id) REFERENCES cash_movements(id),
  CONSTRAINT fk_cash_ref_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE cash_movement_invoice_refs (
  movement_id BIGINT UNSIGNED NOT NULL,
  invoice_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (movement_id),
  CONSTRAINT fk_cash_ref_invoice_movement FOREIGN KEY (movement_id) REFERENCES cash_movements(id),
  CONSTRAINT fk_cash_ref_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_documents(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE outbox_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  aggregate_type VARCHAR(40) NOT NULL,
  aggregate_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  payload TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:01',
  CONSTRAINT fk_outbox_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE users_read (
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  dni VARCHAR(40) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  status VARCHAR(20) NOT NULL,
  total_orders INT NOT NULL DEFAULT 0,
  total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_order_at TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:01',
  last_payment_at TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:01',
  PRIMARY KEY (tenant_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE orders_read (
  tenant_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  user_name VARCHAR(160) NOT NULL,
  status_name VARCHAR(40) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (tenant_id, order_id)
) ENGINE=InnoDB;

CREATE TABLE cash_read (
  tenant_id BIGINT UNSIGNED NOT NULL,
  date_key DATE NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, date_key, category_id)
) ENGINE=InnoDB;

CREATE INDEX idx_orders_tenant_user ON orders (tenant_id, user_id);
CREATE INDEX idx_payments_tenant_user ON payments (tenant_id, user_id);
CREATE INDEX idx_invoice_doc_tenant_user ON invoice_documents (tenant_id, user_id);
