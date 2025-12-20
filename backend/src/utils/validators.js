import { z } from 'zod';

export const loginSchema = z.object({
  tenantId: z.number().int(),
  dni: z.string().min(3),
  password: z.string().min(6)
});

export const createUserSchema = z.object({
  dni: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'STAFF', 'USER']),
  password: z.string().min(6)
});

export const createOrderSchema = z.object({
  userId: z.number().int(),
  statusId: z.number().int(),
  items: z.array(z.object({
    productName: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive()
  })).min(1)
});

export const createPaymentSchema = z.object({
  userId: z.number().int(),
  orderId: z.number().int().optional(),
  amount: z.number().positive(),
  methodId: z.number().int(),
  paidAt: z.string().min(8)
});

export const createInvoiceSchema = z.object({
  userId: z.number().int(),
  orderId: z.number().int(),
  templateVersion: z.number().int(),
  issuedAt: z.string().min(8),
  fields: z.array(z.object({
    fieldKey: z.string().min(1),
    fieldType: z.enum(['text', 'number', 'date']),
    value: z.union([z.string(), z.number()])
  })).min(1)
});

export const createInvoiceTemplateSchema = z.object({
  version: z.number().int(),
  fields: z.array(z.object({
    fieldKey: z.string().min(1),
    label: z.string().min(1),
    fieldType: z.enum(['text', 'number', 'date']),
    requiredFlag: z.boolean(),
    sortOrder: z.number().int()
  })).min(1)
});

export const createCashMovementSchema = z.object({
  categoryId: z.number().int(),
  methodId: z.number().int(),
  amount: z.number().positive(),
  occurredAt: z.string().min(8),
  note: z.string().min(1),
  categoryType: z.enum(['INCOME', 'EXPENSE'])
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});
