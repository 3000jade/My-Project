import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import cmsService from '@/services/cmsService';
import { LiveEditProvider, LiveEditFloatingBar, LiveEditableText } from '@/components/cms/LiveCmsEditor';

export default function GuidesPage() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (slug) {
      cmsService
        .getPublicContentBySlug('article', slug)
        .then((item) => {
          if (mounted) setActiveArticle(item);
        })
        .catch(() => {
          if (mounted) setActiveArticle(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      cmsService
        .getPublicContents('article')
        .then((items) => {
          if (mounted) setArticles(items);
        })
        .catch(() => {
          if (mounted) setArticles([]);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [slug]);

  const saveArticleField = async (field, val) => {
    if (!activeArticle?.id) return;
    const updated = await cmsService.updateContent(activeArticle.id, { [field]: val });
    setActiveArticle(updated);
  };

  if (slug) {
    return (
      <LiveEditProvider>
        <div className="bg-[#F8FAFC] min-h-screen py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link to="/guides">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Guides
            </Button>
          </Link>

          {loading ? (
            <p className="text-sm text-[#64748B]">Loading guide...</p>
          ) : !activeArticle ? (
            <Card className="bg-white border border-[#E2E8F0] rounded-xl">
              <CardContent className="py-12">
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Guide not found</EmptyTitle>
                    <EmptyDescription>This guide may be unpublished or moved.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
              <CardHeader className="space-y-2">
                {activeArticle.payload?.category && (
                  <span className="text-xs font-medium uppercase tracking-wider text-[#0F766E]">
                    {activeArticle.payload.category}
                  </span>
                )}
                <CardTitle className="text-3xl font-bold tracking-tight text-[#1E293B]">
                  <LiveEditableText value={activeArticle.title} onSave={(val) => saveArticleField('title', val)} />
                </CardTitle>
                {(activeArticle.summary || activeArticle.id) && (
                  <CardDescription className="text-base text-[#64748B]">
                    <LiveEditableText
                      value={activeArticle.summary || ''}
                      placeholder="Add summary..."
                      onSave={(val) => saveArticleField('summary', val)}
                    />
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
                {activeArticle.media_url && (
                  <img
                    src={activeArticle.media_url}
                    alt={activeArticle.title}
                    className="w-full h-64 object-cover rounded-lg border border-[#E2E8F0]"
                  />
                )}
                <p>
                  <LiveEditableText
                    value={activeArticle.body || ''}
                    placeholder="Add guide content..."
                    onSave={(val) => saveArticleField('body', val)}
                  />
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <LiveEditFloatingBar />
      </div>
      </LiveEditProvider>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E293B]">
            Buying Guides & Market Updates
          </h1>
          <p className="text-base text-[#64748B] mt-2">
            Practical advice from our licensed Philippine real estate team.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#64748B]">Loading guides...</p>
        ) : articles.length === 0 ? (
          <Card className="bg-white border border-[#E2E8F0] rounded-xl">
            <CardContent className="py-12">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No guides published yet</EmptyTitle>
                  <EmptyDescription>Check back soon for new property buying articles.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`/guides/${article.slug}`} className="group">
                <Card className="h-full bg-white border border-[#E2E8F0] rounded-xl shadow-xs group-hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#0F766E]">
                      <BookOpen className="size-4" />
                      <span>{article.payload?.category || 'Guide'}</span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-[#1E293B] mt-2">
                      {article.title}
                    </CardTitle>
                    {article.summary && (
                      <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
