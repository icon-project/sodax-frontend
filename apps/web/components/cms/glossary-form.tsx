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
import { ArrowLeft, Save } from "lucide-react";
import type { GlossaryTerm } from "@/lib/mongodb-types";
import { ObjectId } from "mongodb";

interface GlossaryFormProps {
  term?: GlossaryTerm & { _id: ObjectId };
}

export function GlossaryForm({ term }: GlossaryFormProps) {
  const router = useRouter();
  const isEditing = !!term;

  const [formData, setFormData] = useState({
    term: term?.term || "",
    slug: term?.slug || "",
    definition: term?.definition || "",
    excerpt: term?.excerpt || "",
    metaTitle: term?.metaTitle || "",
    metaDescription: term?.metaDescription || "",
    published: term?.published || false,
    relatedTerms: term?.relatedTerms?.join(", ") || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.term || !formData.definition) {
      alert("Term and definition are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        relatedTerms: formData.relatedTerms.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const url = isEditing ? `/api/cms/glossary/${term._id.toString()}` : "/api/cms/glossary";
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

      router.push("/cms/glossary");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Failed to save term");
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
              {isEditing ? "Edit Glossary Term" : "New Glossary Term"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Main Content Card */}
            <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
              <CardHeader className="bg-[var(--cream-white)]">
                <CardTitle className="text-[var(--espresso)]">Term Definition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Title/Term */}
                <div className="space-y-2">
                  <Label htmlFor="term" className="text-[var(--espresso)] font-medium">
                    Term *
                  </Label>
                  <Input
                    id="term"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="Enter term (e.g., DeFi, Liquidity Pool)"
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
                    placeholder="auto-generated-from-term"
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)] font-mono text-sm"
                  />
                  <p className="text-xs text-[var(--clay)]">
                    Leave empty to auto-generate from term
                  </p>
                </div>

                {/* Short Definition */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-[var(--espresso)] font-medium">
                    Short Definition
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief one-sentence definition"
                    rows={2}
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                  />
                </div>

                {/* Full Definition */}
                <div className="space-y-2">
                  <Label className="text-[var(--espresso)] font-medium">Full Definition *</Label>
                  <TiptapEditor
                    content={formData.definition}
                    onChange={(definition) => setFormData({ ...formData, definition })}
                    placeholder="Write the complete definition and explanation..."
                  />
                </div>

                {/* Related Terms */}
                <div className="space-y-2">
                  <Label htmlFor="relatedTerms" className="text-[var(--espresso)] font-medium">
                    Related Terms
                  </Label>
                  <Input
                    id="relatedTerms"
                    value={formData.relatedTerms}
                    onChange={(e) => setFormData({ ...formData, relatedTerms: e.target.value })}
                    placeholder="DeFi, Smart Contract, Blockchain"
                    className="border-[var(--cherry-grey)] focus:border-[var(--cherry-soda)]"
                  />
                  <p className="text-xs text-[var(--clay)]">Comma-separated list of related terms</p>
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
                    placeholder="SEO title (defaults to term)"
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
                    placeholder="SEO description (defaults to short definition)"
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
                      Publish Term
                    </Label>
                    <p className="text-sm text-[var(--clay)] mt-1">
                      Make this term visible in the glossary
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
                className="bg-gradient-to-r from-[var(--orange-sonic)] to-[var(--yellow-soda)] hover:opacity-90 text-white shadow-lg"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? "Update Term" : "Create Term"}
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
