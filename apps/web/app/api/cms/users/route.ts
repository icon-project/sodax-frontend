import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/auth";
import type { CMSPermission } from "@/lib/permissions";
import { ObjectId } from "mongodb";

/**
 * GET /api/cms/users - List all users
 */
export async function GET() {
  try {
    await requireAdmin();

    const usersCollection = db.collection("user");
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
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
    const { email, role, permissions } = body as {
      email: string;
      role: string;
      permissions: CMSPermission[];
    };

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate role
    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 });
    }

    // Validate permissions
    const validPermissions: CMSPermission[] = ["news", "articles", "glossary"];
    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions must be an array" }, { status: 400 });
    }
    if (permissions && !permissions.every(p => validPermissions.includes(p))) {
      return NextResponse.json(
        { error: "Invalid permissions. Must be: news, articles, glossary" },
        { status: 400 }
      );
    }

    const usersCollection = db.collection("user");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user entry
    const result = await usersCollection.insertOne({
      email,
      role: role || "user",
      permissions: JSON.stringify(permissions || []),
      createdAt: new Date(),
      // Note: 'name' and other fields will be populated by Better Auth on first login
    });

    // Fetch the created user to return with all fields including _id
    const createdUser = await usersCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: "User added to whitelist. They must sign in once to activate their account.",
      user: { ...createdUser, id: createdUser?._id?.toString() || "" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add user" },
      { status: 500 }
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
    const { userId, permissions } = body as {
      userId: string;
      permissions: CMSPermission[];
    };

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "userId and permissions array required" },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions: CMSPermission[] = ["news", "articles", "glossary"];
    const isValid = permissions.every(p => validPermissions.includes(p));
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid permissions. Must be: news, articles, glossary" },
        { status: 400 }
      );
    }

    const usersCollection = db.collection("user");
    const result = await usersCollection.updateOne(
      { id: userId },
      { $set: { permissions: JSON.stringify(permissions) } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const usersCollection = db.collection("user");
    
    // Try to find and delete user by id, _id (as ObjectId), or email
    const deleteQuery: { $or: Array<{ id?: string; email?: string; _id?: ObjectId }> } = {
      $or: [
        { id: userId },
        { email: userId }
      ]
    };

    // If userId looks like a MongoDB ObjectId, add it to the query
    if (ObjectId.isValid(userId)) {
      deleteQuery.$or.push({ _id: new ObjectId(userId) });
    }

    const result = await usersCollection.deleteOne(deleteQuery);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
