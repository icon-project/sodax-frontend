"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import type { GlossaryTerm } from "@/lib/mongodb-types";

export function GlossaryListView() {
  const router = useRouter();
  const [terms, setTerms] = useState<(GlossaryTerm & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/cms/glossary");
      const data = await response.json();
      setTerms(data.data || []);
    } catch (error) {
      console.error("Failed to fetch glossary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/cms/glossary/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      setTerms(terms.filter(t => t._id.toString() !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete term");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vibrant-white)] via-[var(--cream-white)] to-[var(--almost-white)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/cms/dashboard")}
              className="text-[var(--clay)] hover:text-[var(--espresso)] hover:bg-transparent px-2 !outline-0 !border-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--espresso)]">Glossary</h1>
              <p className="text-[var(--clay)] mt-1">{terms.length} terms</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/cms/glossary/new")}
            className="bg-gradient-to-r from-[var(--orange-sonic)] to-[var(--yellow-soda)] hover:opacity-90 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Term
          </Button>
        </div>

        {/* Content */}
        <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-[var(--clay)]">
              <div className="w-8 h-8 border-4 border-[var(--orange-sonic)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading terms...
            </div>
          ) : terms.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--clay)] mb-4">No terms yet</p>
              <Button
                onClick={() => router.push("/cms/glossary/new")}
                variant="outline"
                className="border-[var(--orange-sonic)] text-[var(--orange-sonic)] hover:bg-[var(--orange-sonic)] hover:text-white"
              >
                Create your first term
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--cream-white)] hover:bg-[var(--cream-white)]">
                  <TableHead className="font-bold text-[var(--espresso)]">Term</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)]">Definition</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)]">Status</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow key={term._id.toString()} className="hover:bg-[var(--cream)]/30 transition-colors">
                    <TableCell className="font-medium text-[var(--espresso)]">
                      <div>
                        <div className="flex items-center gap-2">
                          {term.published ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[var(--clay)]" />
                          )}
                          {term.term}
                        </div>
                        <div className="text-xs text-[var(--clay)] mt-1">/{term.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--clay)] max-w-md truncate">
                      {term.excerpt || term.definition?.substring(0, 100) || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={term.published ? "default" : "secondary"}
                        className={
                          term.published
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-[var(--clay-light)] text-white"
                        }
                      >
                        {term.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/cms/glossary/${term._id.toString()}`)}
                          className="hover:bg-[var(--cream)]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(term._id.toString())}
                          disabled={deleting === term._id.toString()}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          {deleting === term._id.toString() ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
