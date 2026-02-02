import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { db } from '@/lib/auth';
import { CreateUserSchema, UpdateUserSchema, formatZodError } from '@/lib/cms-schemas';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';

/**
 * GET /api/cms/users - List all users
 */
export async function GET() {
  try {
    await requireAdmin();

    const usersCollection = db.collection('user');
    const users = await usersCollection
      .find({})
      .project({
        id: 1,
        email: 1,
        name: 1,
        role: 1,
        permissions: 1,
        createdAt: 1,
      })
      .toArray();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/cms/users error:', error);
    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to fetch users' },
      { status: isForbidden ? 403 : 401 },
    );
  }
}

/**
 * POST /api/cms/users - Add new user to whitelist
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Validate input with Zod schema
    const validated = CreateUserSchema.parse(body);

    const usersCollection = db.collection('user');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: validated.email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Create new user entry
    const result = await usersCollection.insertOne({
      email: validated.email,
      role: validated.role,
      permissions: JSON.stringify(validated.permissions),
      createdAt: new Date(),
      // Note: 'name' and other fields will be populated by Better Auth on first login
    });

    // Fetch the created user to return with all fields including _id
    const createdUser = await usersCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'User added to whitelist. They must sign in once to activate their account.',
      user: { ...createdUser, id: createdUser?._id?.toString() || '' },
    });
  } catch (error) {
    console.error('POST /api/cms/users error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    }

    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to add user' },
      { status: isForbidden ? 403 : 500 },
    );
  }
}

/**
 * PATCH /api/cms/users - Update user permissions
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Validate input with Zod schema
    const validated = UpdateUserSchema.parse(body);

    const usersCollection = db.collection('user');
    const result = await usersCollection.updateOne(
      { id: validated.userId },
      { $set: { permissions: JSON.stringify(validated.permissions) } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/cms/users error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    }

    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to update user' },
      { status: isForbidden ? 403 : 401 },
    );
  }
}

/**
 * DELETE /api/cms/users - Remove user access
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const usersCollection = db.collection('user');

    // Try to find and delete user by id, _id (as ObjectId), or email
    const deleteQuery: { $or: Array<{ id?: string; email?: string; _id?: ObjectId }> } = {
      $or: [{ id: userId }, { email: userId }],
    };

    // If userId looks like a MongoDB ObjectId, add it to the query
    if (ObjectId.isValid(userId)) {
      deleteQuery.$or.push({ _id: new ObjectId(userId) });
    }

    const result = await usersCollection.deleteOne(deleteQuery);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cms/users error:', error);
    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to delete user' },
      { status: isForbidden ? 403 : 500 },
    );
  }
}
