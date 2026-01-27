"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { CMSPermission } from "@/lib/permissions";

interface User {
  id?: string;
  _id?: { toString: () => string };
  email: string;
  name: string;
  role: string;
  permissions: string;
  createdAt: string;
}

export function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<CMSPermission[]>([]);
  
  // New user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [newPermissions, setNewPermissions] = useState<CMSPermission[]>([]);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/cms/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (user: User): CMSPermission[] => {
    if (user.role === "admin") return ["news", "articles", "glossary"];
    try {
      return JSON.parse(user.permissions || "[]");
    } catch {
      return [];
    }
  };

  const startEditing = (user: User) => {
    const userId = user.id || user._id?.toString() || user.email;
    setEditingUser(userId);
    setSelectedPermissions(getUserPermissions(user));
  };

  const togglePermission = (permission: CMSPermission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const savePermissions = async (userId: string) => {
    try {
      const response = await fetch("/api/cms/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, permissions: selectedPermissions }),
      });

      if (response.ok) {
        await loadUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user's access?")) return;

    try {
      const response = await fetch(`/api/cms/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  const toggleNewPermission = (permission: CMSPermission) => {
    setNewPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const addUser = async () => {
    setAddUserError(null);

    if (!newEmail) {
      setAddUserError("Email is required");
      return;
    }

    try {
      const response = await fetch("/api/cms/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          permissions: newPermissions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers();
        // Reset form
        setNewEmail("");
        setNewRole("user");
        setNewPermissions([]);
        setShowAddUser(false);
        setAddUserError(null);
      } else {
        setAddUserError(data.error || "Failed to add user");
      }
    } catch (error) {
      setAddUserError("Failed to add user");
      console.error("Failed to add user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[var(--cherry-soda)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/cms/dashboard")}
          className="mb-4 text-[var(--clay)] hover:text-[var(--espresso)] hover:bg-transparent px-2 !outline-0 !border-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--espresso)] mb-2">User Management</h1>
            <p className="text-[var(--clay)]">Manage team access and permissions</p>
          </div>
          <Button
            onClick={() => setShowAddUser(true)}
            className="bg-[var(--cherry-soda)] hover:bg-[var(--cherry-soda)]/90"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <Card className="mb-6 border-2 border-[var(--cherry-soda)]">
          <CardHeader>
            <CardTitle>Add New User to Whitelist</CardTitle>
            <CardDescription>
              User must sign in with this email to activate their account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-email">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Role</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={newRole === "user"}
                    onChange={() => setNewRole("user")}
                  />
                  <span>User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={newRole === "admin"}
                    onChange={() => setNewRole("admin")}
                  />
                  <span>Admin (full access)</span>
                </label>
              </div>
            </div>

            {newRole === "user" && (
              <div>
                <Label>Permissions</Label>
                <div className="flex gap-6 mt-2">
                  {(["news", "articles", "glossary"] as CMSPermission[]).map(permission => (
                    <label key={permission} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newPermissions.includes(permission)}
                        onCheckedChange={() => toggleNewPermission(permission)}
                      />
                      <span className="capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {addUserError && (
              <div className="text-red-600 text-sm">{addUserError}</div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={addUser}
                className="bg-[var(--cherry-soda)] hover:bg-[var(--cherry-soda)]/90"
              >
                Add User
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUser(false);
                  setNewEmail("");
                  setNewRole("user");
                  setNewPermissions([]);
                  setAddUserError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Control which content types each user can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => {
              const isEditing = editingUser === user.id;
              const isAdmin = user.role === "admin";
              const permissions = getUserPermissions(user);
              const userId = user.id || user._id?.toString() || user.email;

              return (
                <div
                  key={userId}
                  className="border border-[var(--clay-light)] rounded-lg p-4 hover:border-[var(--cherry-soda)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--espresso)]">
                          {user.name || user.email}
                        </h3>
                        {isAdmin && (
                          <span className="px-2 py-0.5 bg-[var(--cherry-soda)] text-white text-xs rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--clay)] mb-3">{user.email}</p>

                      {!isEditing ? (
                        <div className="flex gap-2">
                          {permissions.length === 0 ? (
                            <span className="text-sm text-[var(--clay)]">No permissions</span>
                          ) : (
                            permissions.map(permission => (
                              <span
                                key={permission}
                                className="px-2 py-1 bg-[var(--cream)] text-[var(--espresso)] text-xs rounded border border-[var(--clay-light)]"
                              >
                                {permission}
                              </span>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(["news", "articles", "glossary"] as CMSPermission[]).map(
                            permission => (
                              <div key={permission} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${user.id}-${permission}`}
                                  checked={selectedPermissions.includes(permission)}
                                  onCheckedChange={() => togglePermission(permission)}
                                />
                                <label
                                  htmlFor={`${user.id}-${permission}`}
                                  className="text-sm capitalize cursor-pointer"
                                >
                                  {permission}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[var(--negative)] hover:text-[var(--negative)]"
                              onClick={() => removeUser(userId)}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => savePermissions(userId)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center py-12 text-[var(--clay)]">
                No users found. Users will appear here after they sign in.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
