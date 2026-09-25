import { z } from "zod";

export const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).nullish(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isSpecialty: z.boolean().default(false),
  capacityWeight: z.number().int().min(0).max(5).default(1),
  sizes: z
    .array(z.object({ id: z.string().optional(), label: z.string().trim().min(1).max(30), priceCents: z.number().int().min(0).max(100000) }))
    .min(1, "Au moins une taille / un prix."),
  ingredientIds: z.array(z.string()).max(40).default([]),
});

export const categorySchema = z.object({ name: z.string().trim().min(1).max(60) });

export const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(60),
  isSupplement: z.boolean().default(false),
  priceCents: z.number().int().min(0).max(10000).default(0),
  allergenTags: z.array(z.string().max(30)).max(14).default([]),
});
