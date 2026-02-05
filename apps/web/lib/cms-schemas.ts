import { z } from 'zod';

/**
 * Zod validation schemas for CMS API endpoints
 * Ensures all user input is properly validated before processing
 */

// Common URL validation that allows empty strings or valid URLs
const optionalUrl = z.union([z.literal(''), z.string().url()]).optional();

// News article creation/update schema
export const NewsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be 500 characters or less').optional(),
  image: optionalUrl,
  metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  published: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  categories: z.array(z.string().max(50)).default([]),
});

// Article creation/update schema
export const ArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be 500 characters or less').optional(),
  image: optionalUrl,
  metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  published: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  category: z.string().max(50).optional(),
});

// User creation schema
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['user', 'admin']).default('user'),
  permissions: z.array(z.enum(['news', 'articles', 'glossary'])).default([]),
});

// User update schema
export const UpdateUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  permissions: z.array(z.enum(['news', 'articles', 'glossary'])),
});

// Partial schemas for PATCH operations (all fields optional)
export const NewsArticlePatchSchema = NewsArticleSchema.partial();
export const ArticlePatchSchema = ArticleSchema.partial();

// Helper to format Zod errors for API responses
export function formatZodError(error: z.ZodError): string {
  return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
