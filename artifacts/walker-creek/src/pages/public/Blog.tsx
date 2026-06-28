import { useListBlogPosts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Link } from "wouter";

export default function Blog() {
  const { data: posts, isLoading } = useListBlogPosts({ published: true });

  return (
    <div className="flex flex-col w-full py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Notes from the Creek
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stories, updates, and reflections from life on the farm.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl h-[400px] shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts?.map((post) => (
              <Card key={post.id} className="overflow-hidden group flex flex-col hover:shadow-lg transition-shadow border-border/50">
                {post.coverImage && (
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-8 flex flex-col flex-1">
                  <div className="text-sm text-muted-foreground mb-3 font-medium">
                    {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-4 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <Button variant="link" asChild className="p-0 h-auto self-start font-semibold text-primary">
                    <Link href={`/blog/${post.slug}`}>Read Full Story &rarr;</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
