import type { ObjectId } from "mongodb";

// CMS Content Types
export interface NewsArticle {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string; // Rich HTML from Tiptap
  excerpt: string;
  image?: string; // Vercel Blob URL
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  authorName: string;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string; // Rich HTML from Tiptap
  excerpt: string;
  image?: string; // Vercel Blob URL
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  authorName: string;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlossaryTerm {
  _id?: ObjectId;
  term: string;
  slug: string;
  definition: string; // Rich HTML from Tiptap
  excerpt: string;
  image?: string; // Vercel Blob URL
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  authorName: string;
  tags: string[];
  category?: string;
  relatedTerms: string[]; // Array of slugs
  createdAt: Date;
  updatedAt: Date;
}

// Helper to generate slug from title
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
