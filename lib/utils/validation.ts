import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(8, 'Le numéro doit contenir au moins 8 chiffres')
  .max(20, 'Le numéro est trop long')
  .regex(/^[+]?[\d\s\-().]+$/, 'Numéro de téléphone invalide');

export const clientSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: phoneSchema,
  tags: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères'),
  price: z.number().positive('Le prix doit être positif'),
});

export const orderSchema = z.object({
  client_id: z.string().uuid('Client invalide'),
  total_amount: z.number().positive('Le montant doit être positif'),
});

export const paymentSchema = z.object({
  order_id: z.string().uuid('Commande invalide'),
  amount: z.number().positive('Le montant doit être positif'),
  payment_method: z.enum(['cash', 'mobile_money', 'transfer', 'other']),
});

export const reminderSchema = z.object({
  client_id: z.string().uuid('Client invalide'),
  order_id: z.string().uuid('Commande invalide'),
  scheduled_at: z.string(),
});
