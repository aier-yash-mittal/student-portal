import { z } from "zod";

// Zod schema for login validation
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Zod schema for signup validation with strict password requirements
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),
  role: z.enum(["student", "faculty"] as const),
  department: z.string().max(100, "Department cannot exceed 100 characters").trim().optional(),
  enrollmentNo: z
    .string()
    .max(50, "Enrollment number cannot exceed 50 characters")
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .trim()
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Zod schema for profile updating with sanitization
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name cannot exceed 100 characters")
    .trim(),
  phone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(100, "Department cannot exceed 100 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  enrollmentNo: z
    .string()
    .max(50, "Enrollment number cannot exceed 50 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().trim().optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
