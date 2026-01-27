# Custom CMS Implementation Guide

This guide explains how to implement a custom, lightweight CMS in your Next.js project, based on the proven architecture used in the Hana Wallet project. This CMS is designed for managing SEO-optimized content with minimal dependencies.

## Overview

This CMS provides:
- ✍️ Rich text editor with image uploads (Tiptap)
- 🖼️ Cloud-based image storage (Vercel Blob or similar)
- 🚀 Auto-deploys on content changes
- 📄 Static generation for optimal SEO and performance
- 🔒 Admin authentication with JWT
- 📱 Responsive admin interface
- 🏷️ Tags and author support for extensibility

## Prerequisites

- Next.js 14+ with App Router
- Node.js 18+
- MongoDB instance (Atlas recommended)
- Vercel account (for Blob storage and deploy hooks) or equivalent storage service

## Part 1: Environment Setup

### 1.1 Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# MongoDB Connection
DATABASE_URI="mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority"

# Authentication
AUTH_SECRET="your-very-secure-random-string-here"

# Vercel Blob Storage (for article images)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxx"

# Vercel Deploy Hook (optional, for auto-deploys)
VERCEL_DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/prj_xxxxx/xxxxx"

# Admin Creation (ONLY for initial setup, remove after)
ALLOW_ADMIN_CREATION="true"
```

### Environment Variable Details

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URI` | MongoDB connection string with database name | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/myapp` |
| `AUTH_SECRET` | Secret key for JWT signing (use `openssl rand -hex 32`) | Yes | `a1b2c3d4e5f6...` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token from dashboard | Yes | `vercel_blob_rw_...` |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel deploy hook URL (optional) | No | `https://api.vercel.com/...` |
| `ALLOW_ADMIN_CREATION` | Set to `true` only during initial setup | No | `true` |

### MongoDB Setup

1. Create a MongoDB Atlas cluster at [atlas.mongodb.com](https://atlas.mongodb.com)
2. Create a database user with read/write permissions
3. Whitelist your IP address(es)
4. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/yourdb`
5. Append `?retryWrites=true&w=majority` to your connection string

### Vercel Blob Setup

1. Go to Vercel Dashboard → Storage → Create Blob Store
2. Copy the Read/Write token to `BLOB_READ_WRITE_TOKEN`

## Part 2: Database Schema

### 2.1 Install Prisma

```bash
npm install @prisma/client prisma
npx prisma init
```

### 2.2 Configure Prisma

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URI")
}

model AdminUser {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime  @default(now())
  email     String    @unique
  password  String
  role      String    @default("editor")
  updatedAt DateTime  @updatedAt
  articles  Article[]
}

model Article {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  slug        String    @unique
  content     String    // Rich text HTML from editor
  excerpt     String
  image       String?   // Featured image URL
  metaTitle   String?   // SEO meta title
  metaDesc    String?   // SEO meta description
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  authorId    String    @db.ObjectId
  author      AdminUser @relation(fields: [authorId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  // Optional fields for extensibility
  tags        String[]  @default([])
  authorName  String?   // Persona name, falls back to default author
  
  @@index([published, publishedAt])
  @@index([tags])
}

model Variant {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  urlTag    String    @unique
  header    String
  subheader String
  cta       String
  active    Boolean   @default(true)
  locale    String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### 2.3 Generate Prisma Client

```bash
npx prisma generate
```

### 2.4 Create Database Index

After deployment, create indexes for better performance:

```bash
db.articles.createIndex({ "published": 1, "publishedAt": -1 })
db.articles.createIndex({ "tags": 1 })
```

## Part 3: Core Libraries

### 3.1 Install Dependencies

```bash
npm install \
  @prisma/client \
  bcryptjs \
  jose \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/extension-image \
  @tiptap/extension-link \
  @tiptap/extension-placeholder \
  @vercel/blob \
  date-fns \
  clsx \
  lucide-react
```

## Part 4: Core Authentication System

### 4.1 JWT Helper (`lib/adminAuth.ts`)

```typescript
import { SignJWT, jwtVerify } from 'jose';

export const cookieName = 'cms_admin';

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function signAdminJwt(payload: { email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyAdminJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as { email: string; role: string; iat: number; exp: number };
}
```

### 4.2 Prisma Client (`lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;
```

### 4.3 Authentication Middleware (`middleware.ts`)

Add to your existing middleware or create new:

```typescript
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const cookieName = 'cms_admin';

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return false;
  
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || '');
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.includes('/articles/admin')) {
    const isAuthenticated = await verifyAuth(request);
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next).*)'],
};
```

## Part 5: API Routes

### 5.1 Admin Authentication Routes

#### Create Admin User (`app/api/admin/create-user/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
  if (process.env.ALLOW_ADMIN_CREATION !== 'true') {
    return NextResponse.json(
      { error: 'Admin creation is disabled' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });

    return NextResponse.json({
      message: 'Admin user created',
      email: admin.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create admin' },
      { status: 500 }
    );
  }
}
```

#### Login (`app/api/admin/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAdminJwt, cookieName } from '@/lib/adminAuth';
import bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcryptjs.compare(password, admin.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signAdminJwt({
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({ message: 'Logged in successfully' });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
```

#### Logout (`app/api/admin/logout/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { cookieName } from '@/lib/adminAuth';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete(cookieName);
  return response;
}
```

#### Check Auth (`app/api/admin/check-auth/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminJwt, cookieName } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const payload = await verifyAdminJwt(token);
    return NextResponse.json({ authenticated: true, user: payload });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
```

### 5.2 Articles API Routes

#### List/Create Articles (`app/api/articles/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminJwt, cookieName } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  let isAdmin = false;

  if (token) {
    try {
      await verifyAdminJwt(token);
      isAdmin = true;
    } catch (e) {
      // Not admin
    }
  }

  const where = isAdmin ? {} : { published: true };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminJwt(token);
    const admin = await prisma.adminUser.findUnique({
      where: { email: payload.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const {
      title,
      content,
      excerpt,
      image,
      metaTitle,
      metaDesc,
      published,
      tags,
      authorName,
    } = await request.json();

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        image,
        metaTitle,
        metaDesc,
        published,
        publishedAt: published ? new Date() : null,
        authorId: admin.id,
        tags: tags || [],
        authorName,
      },
      include: {
        author: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    revalidateTag('articles');

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create article' },
      { status: 500 }
    );
  }
}
```

#### Get/Update/Delete Article (`app/api/articles/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminJwt, cookieName } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  let isAdmin = false;

  if (token) {
    try {
      await verifyAdminJwt(token);
      isAdmin = true;
    } catch (e) {
      // Not admin
    }
  }

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  if (!article.published && !isAdmin) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyAdminJwt(token);

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      image,
      metaTitle,
      metaDesc,
      published,
      tags,
      authorName,
    } = body;

    const currentArticle = await prisma.article.findUnique({ where: { id } });
    if (!currentArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    let slug = currentArticle.slug;
    if (title && title !== currentArticle.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        image,
        metaTitle,
        metaDesc,
        published,
        publishedAt: published && !currentArticle.published ? new Date() : currentArticle.publishedAt,
        tags: tags || [],
        authorName,
      },
      include: {
        author: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    revalidateTag('articles');

    return NextResponse.json(article);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyAdminJwt(token);

    await prisma.article.delete({ where: { id } });

    revalidateTag('articles');

    return NextResponse.json({ message: 'Article deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}
```

#### Image Upload (`app/api/articles/upload-image/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { cookies } from 'next/headers';
import { verifyAdminJwt, cookieName } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyAdminJwt(token);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const filename = `articles/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
```

## Part 6: Frontend Components

### 6.1 Admin Login Component

Create `app/components/admin/AdminLogin.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">CMS Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 6.2 Admin Dashboard Component

Create `app/components/admin/AdminDashboard.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Articles CMS</h2>
            <p className="text-gray-600 mb-4">
              Manage your published articles, create new content, and track engagement.
            </p>
            <button
              onClick={() => router.push('/articles/admin')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Go to CMS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 6.3 Admin Page Layout

Create `app/admin/page.tsx`:

```typescript
import { cookies } from 'next/headers';
import { cookieName, verifyAdminJwt } from '@/lib/adminAuth';
import AdminLogin from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  let authed = false;

  if (token) {
    try {
      await verifyAdminJwt(token);
      authed = true;
    } catch {
      authed = false;
    }
  }

  return authed ? <AdminDashboard /> : <AdminLogin />;
}
```

## Part 7: Advanced Features (Optional)

### 7.1 Auto-Deploy on Changes

Uncomment the deploy trigger in article endpoints:

```typescript
import { triggerVercelDeploy } from '@/lib/trigger-deploy';

// In create/update/delete endpoints:
if (process.env.VERCEL_DEPLOY_HOOK_URL) {
  await triggerVercelDeploy();
}
```

### 7.2 SEO Metadata

Add to your article pages:

```typescript
export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  
  return {
    title: article.metaTitle || article.title,
    description: article.metaDesc || article.excerpt,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDesc,
      images: article.image ? [article.image] : [],
    },
  };
}
```

### 7.3 Static Generation

Use ISR for optimal performance:

```typescript
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}
```

## Part 8: Deployment Checklist

- [ ] Set all environment variables on production hosting
- [ ] Create first admin user: `node scripts/create-admin.js`
- [ ] Remove `ALLOW_ADMIN_CREATION` from `.env` after creating first admin
- [ ] Set up MongoDB backups
- [ ] Configure Vercel Blob for production
- [ ] Test article creation, publishing, and viewing
- [ ] Verify SEO metadata is generated correctly
- [ ] Set up monitoring/logging for API errors
- [ ] Test image uploads and storage
- [ ] Configure custom domain for admin panel

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local`
2. **Password Security**: Use bcryptjs (10+ salt rounds)
3. **JWT Secret**: Use `openssl rand -hex 32` for generating strong secrets
4. **HTTPS Only**: Always use HTTPS in production
5. **Rate Limiting**: Add rate limiting to login endpoint (consider Upstash)
6. **CORS**: Restrict API endpoints to your domain
7. **Input Validation**: Always validate and sanitize user input
8. **Admin Creation**: Disable `ALLOW_ADMIN_CREATION` immediately after setup

## Troubleshooting

### Database Connection Issues
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Ensure database exists
- Verify credentials are correct

### Image Upload Failures
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check file size limits (max 2MB)
- Ensure file types are supported
- Check Vercel Blob storage quota

### Authentication Issues
- Verify `AUTH_SECRET` is set and consistent
- Check JWT token expiration (7 days)
- Verify cookies are being set (check browser dev tools)
- Ensure admin user exists in database

### Deploy Hook Issues
- Verify `VERCEL_DEPLOY_HOOK_URL` is correct
- Check Vercel project settings
- Ensure deploy hook hasn't expired

## Support & Maintenance

- Monitor MongoDB storage usage
- Clean up unused images in Vercel Blob
- Regular security audits
- Update dependencies monthly
- Back up MongoDB data regularly

---

This CMS implementation provides a solid foundation for content management. For questions or improvements, refer to the original implementation in the Hana Wallet project.
