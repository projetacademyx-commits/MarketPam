import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères"),
  lastName: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères"),
  email: z.string().trim().email("Adresse email invalide").toLowerCase(),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").toLowerCase(),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Token de réinitialisation invalide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères"),
  lastName: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères"),
  email: z.string().trim().email("Adresse email invalide").toLowerCase(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel obligatoire"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères"),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet obligatoire"),
  street: z.string().trim().min(5, "Adresse de rue obligatoire"),
  city: z.string().trim().min(2, "Ville obligatoire"),
  postalCode: z.string().trim().min(3, "Code postal obligatoire"),
  country: z.string().trim().min(2, "Pays obligatoire").default("France"),
  phone: z.string().trim().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string(),
        quantity: z.number().int().min(1).max(99),
        variant: z.string().optional(),
      }),
    )
    .min(1, "Votre panier est vide"),
  shippingMethod: z.enum(["standard", "express", "overnight"]).default("standard"),
  fullName: z.string().trim().min(2, "Nom complet requis"),
  email: z.string().trim().email("Email requis").toLowerCase(),
  address: z.string().trim().min(4, "Adresse requise"),
  city: z.string().trim().min(2, "Ville requise"),
  postalCode: z.string().trim().min(2, "Code postal requis"),
  country: z.string().trim().min(2, "Pays requis").default("France"),
});

export const updateAdminOrderSchema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"]).optional(),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().trim().optional(),
  estimatedDelivery: z.string().optional(), // ISO date string
  statusMessage: z.string().trim().optional(),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(2, "Nom du produit requis"),
  slug: z.string().trim().min(2, "Slug requis"),
  brand: z.string().trim().default("MarketPam"),
  categorySlug: z.string().trim().min(2, "Catégorie requise"),
  summary: z.string().trim().default(""),
  description: z.string().trim().default(""),
  price: z.number().int().min(0, "Le prix doit être positif"),
  compareAtPrice: z.number().int().nullable().optional(),
  images: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(25),
  featured: z.boolean().default(false),
  badge: z.string().nullable().optional(),
});
