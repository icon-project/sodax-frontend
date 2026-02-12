'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, ExternalLink } from 'lucide-react';
import type { NewsArticle } from '@/lib/mongodb-types';
import { format } from 'date-fns';

export function NewsListView() {
  const router = useRouter();
  const [articles, setArticles] = useState<(NewsArticle & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/cms/news');
      const data = await response.json();
      setArticles(data.data || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/cms/news/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setArticles(articles.filter(a => a._id.toString() !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete article');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[var(--vibrant-white)] via-[var(--cream-white)] to-[var(--almost-white)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/cms/dashboard')}
              className="text-[var(--clay)] hover:text-[var(--espresso)] hover:bg-transparent px-2 !outline-0 !border-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--espresso)]">News Articles</h1>
              <p className="text-[var(--clay)] mt-1">{articles.length} articles</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/cms/news/new')}
            className="bg-gradient-to-r from-[var(--cherry-dark)] to-[var(--cherry-soda)] hover:opacity-90 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>

        {/* Content */}
        <Card className="border-2 border-[var(--cherry-grey)] shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-[var(--clay)]">
              <div className="w-8 h-8 border-4 border-[var(--cherry-soda)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading articles...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--clay)] mb-4">No articles yet</p>
              <Button
                onClick={() => router.push('/cms/news/new')}
                variant="outline"
                className="border-[var(--cherry-soda)] text-[var(--cherry-soda)] hover:bg-[var(--cherry-soda)] hover:text-white"
              >
                Create your first article
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--cream-white)] hover:bg-[var(--cream-white)]">
                  <TableHead className="font-bold text-[var(--espresso)]">Title</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)]">Status</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)]">Author</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)]">Date</TableHead>
                  <TableHead className="font-bold text-[var(--espresso)] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map(article => (
                  <TableRow key={article._id.toString()} className="hover:bg-[var(--cream)]/30 transition-colors">
                    <TableCell className="font-medium text-[var(--espresso)]">
                      <div>
                        <div className="flex items-center gap-2">
                          {article.published ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[var(--clay)]" />
                          )}
                          {article.title}
                        </div>
                        <div className="text-xs text-[var(--clay)] mt-1">/{article.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={article.published ? 'default' : 'secondary'}
                        className={
                          article.published
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-[var(--clay-light)] text-white'
                        }
                      >
                        {article.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--clay)]">{article.authorName || 'Unknown'}</TableCell>
                    <TableCell className="text-[var(--clay)]">
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), 'MMM d, yyyy')
                        : format(new Date(article.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!article.published && (
                          <button
                            type="button"
                            onClick={() => window.open(`/news/preview/${article._id.toString()}`, '_blank')}
                            className="inline-flex items-center justify-center h-8 px-2 gap-1 rounded-md bg-transparent text-[var(--clay)] hover:bg-[var(--cream)] hover:text-[var(--cherry-soda)] transition-colors cursor-pointer border border-[var(--cherry-grey)] hover:border-[var(--cherry-soda)] text-xs font-medium"
                            title="Preview article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/cms/news/${article._id.toString()}`)}
                          className="inline-flex items-center justify-center h-8 w-8 px-0 rounded-md bg-transparent text-[var(--espresso)] hover:bg-[var(--cream)] hover:text-[var(--espresso)] transition-colors cursor-pointer border-0 outline-none"
                          style={{ border: 'none', outline: 'none' }}
                          title="Edit article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(article._id.toString())}
                          disabled={deleting === article._id.toString()}
                          className="inline-flex items-center justify-center h-8 w-8 px-0 rounded-md bg-transparent text-red-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ border: 'none', outline: 'none' }}
                          title="Delete article"
                        >
                          {deleting === article._id.toString() ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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
