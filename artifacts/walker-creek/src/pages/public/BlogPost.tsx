import { useListBlogPosts } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BlogPost() {
  const { id: slug } = useParams();
  const { data: posts, isLoading } = useListBlogPosts({ published: true });
  
  // Note: Finding post by slug on the client side since we don't have a get-by-slug hook,
  // or we could use the API. In a real app we'd fetch by slug.
  const post = posts?.find(p => p.slug === slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-16 bg-muted rounded w-3/4" />
          <div className="h-[400px] bg-muted rounded-xl w-full" />
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <h1 className="font-serif text-3xl font-bold mb-4">Post not found</h1>
        <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/blog">Return to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="pb-24">
      <div className="container mx-auto px-4 pt-12 pb-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-8 -ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>
        </Button>
        <div className="text-sm font-medium text-primary mb-4">
          {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-8 leading-tight">
          {post.title}
        </h1>
      </div>

      {post.coverImage && (
        <div className="w-full max-w-5xl mx-auto px-4 mb-12">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full aspect-[21/9] object-cover rounded-2xl shadow-sm"
          />
        </div>
      )}

      <div className="container mx-auto px-4 max-w-3xl">
        <div 
          className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-a:text-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
}
