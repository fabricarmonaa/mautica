INSERT INTO tenants (name, status) VALUES ('Demo Tenant', 'ACTIVE');
INSERT INTO tenant_settings (tenant_id, timezone, currency, invoice_template_version) VALUES (1, 'America/Argentina/Buenos_Aires', 'ARS', 1);

INSERT INTO users (tenant_id, dni, first_name, last_name, role, status)
VALUES (1, '30000000', 'Owner', 'Demo', 'OWNER', 'ACTIVE');

INSERT INTO user_passwords (user_id, password_hash, must_change)
VALUES (1, '$2b$12$N9qo8uLOickgx2ZMRZo4i.eY/6W7G1G86CkCeJpW2Y07DDuU3bI5e', 1);

INSERT INTO payment_methods (tenant_id, name, active)
VALUES (1, 'Efectivo', 1);

INSERT INTO cash_categories (tenant_id, name, category_type, active)
VALUES (1, 'Ventas', 'INCOME', 1);

INSERT INTO cash_methods (tenant_id, name, active)
VALUES (1, 'Efectivo', 1);

INSERT INTO order_statuses (tenant_id, name, is_final)
VALUES (1, 'CREADO', 0), (1, 'PAGADO', 1);

INSERT INTO invoice_template_versions (tenant_id, version, created_by)
VALUES (1, 1, 1);

INSERT INTO invoice_template_fields (tenant_id, template_version, field_key, label, field_type, required_flag, sort_order)
VALUES (1, 1, 'concepto', 'Concepto', 'text', 1, 1),
       (1, 1, 'monto', 'Monto', 'number', 1, 2);
