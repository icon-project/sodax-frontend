import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth-utils';

// CMS API routes require authentication - prevent build-time analysis
export const dynamic = 'force-dynamic';

// Allowed image extensions and MIME types
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Allow users with any content permission to upload images
    await requireAnyPermission(['news', 'articles', 'glossary']);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 });
    }

    // Validate file extension
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid file extension. Allowed: jpg, jpeg, png, gif, webp' },
        { status: 400 },
      );
    }

    // Generate a safe filename
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload to Vercel Blob
    const blob = await put(safeFilename, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Upload failed' },
      { status: isForbidden ? 403 : 500 },
    );
  }
}
