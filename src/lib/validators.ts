import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^(\+233|0)[2-9]\d{8}$/, "Enter a valid Ghanaian phone number");

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export const bookingSchema = z.object({
  shopId: z.string().uuid(),
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true, local: true }),
  notes: z.string().max(500).optional(),
  customerName: z.string().min(2).optional(),
  customerPhone: phoneSchema.optional(),
});

export const queueJoinSchema = z.object({
  shopId: z.string().uuid(),
  barberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  isPremium: z.boolean().default(false),
  customerName: z.string().min(2).optional(),
  customerPhone: phoneSchema.optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive(),
});

export const shopSchema = z.object({
  name: z.string().min(2),
  phone: phoneSchema,
  address: z.string().min(5),
  city: z.string().min(2),
  region: z.string().min(2),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export const paymentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  amount: z.number().positive(),
  provider: z.enum(["MTN_MOMO", "TELECEL_CASH", "AT_MONEY"]),
  phoneNumber: phoneSchema,
});
