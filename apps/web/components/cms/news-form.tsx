"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TiptapEditor } from "./tiptap-editor";
import { ArrowLeft, Save, Upload } from "lucide-react";
import type { NewsArticle } from "@/lib/mongodb-types";
import { ObjectId } from "mongodb";

interface NewsFormProps {
  article?: NewsArticle & { _id: ObjectId };
}

export function NewsForm({ article }: NewsFormProps) {
  const router = useRouter();
  const isEditing = !!article;

  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    image: article?.image || "",
    metaTitle: article?.metaTitle || "",
    metaDescription: article?.metaDescription || "",
    published: article?.published || false,
    tags: article?.tags?.join(", ") || "",
    category: article?.category || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, image: url }));
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      alert("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const url = isEditing ? `/api/cms/news/${article._id.toString()}` : "/api/cms/news";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      router.push("/cms/news");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vibrant-white)] via-[var(--cream-white)] to-[var(--almost-white)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-[var(--cream)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-[var(--espresso)]">
              {isEditing ? "Edit News Article" : "New News Article"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Main Content Card */}
            <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
              <CardHeader className="bg-[var(--cream-white)]">
                <CardTitle className="text-[var(--espresso)]">Article Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[var(--espresso)] font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title"
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-[var(--espresso)] font-medium">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)] font-mono text-sm"
                  />
                  <p className="text-xs text-[var(--clay)]">
                    Leave empty to auto-generate from title
                  </p>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-[var(--espresso)] font-medium">
                    Excerpt
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the article"
                    rows={3}
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label className="text-[var(--espresso)] font-medium">Content *</Label>
                  <TiptapEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your article content here..."
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-[var(--espresso)] font-medium">
                    Featured Image
                  </Label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                      />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => document.getElementById("image-upload")?.click()}
                        className="border-[var(--cherry-soda)] text-[var(--cherry-soda)] hover:bg-[var(--cherry-soda)] hover:text-white"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload
                      </Button>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-2">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="max-w-xs rounded-lg border-2 border-[var(--cherry-grey)]"
                      />
                    </div>
                  )}
                </div>

                {/* Tags and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[var(--espresso)] font-medium">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="defi, news, announcement"
                      className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                    />
                    <p className="text-xs text-[var(--clay)]">Comma-separated</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[var(--espresso)] font-medium">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="News"
                      className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Card */}
            <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
              <CardHeader className="bg-[var(--cream-white)]">
                <CardTitle className="text-[var(--espresso)]">SEO Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-[var(--espresso)] font-medium">
                    Meta Title
                  </Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (defaults to article title)"
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-[var(--espresso)] font-medium">
                    Meta Description
                  </Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="SEO description (defaults to excerpt)"
                    rows={2}
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publishing Card */}
            <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="published" className="text-[var(--espresso)] font-medium">
                      Publish Article
                    </Label>
                    <p className="text-sm text-[var(--clay)] mt-1">
                      Make this article visible to the public
                    </p>
                  </div>
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-[var(--clay-light)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[var(--cherry-dark)] to-[var(--cherry-soda)] hover:opacity-90 text-white shadow-lg"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? "Update Article" : "Create Article"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
