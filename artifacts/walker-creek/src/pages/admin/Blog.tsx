import { useState } from "react";
import {
  useListBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  getListBlogPostsQueryKey,
  type BlogPost,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getMutationErrorMessage, slugify } from "@/lib/admin-api";

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
};

const emptyForm = (): BlogForm => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  isPublished: false,
});

export default function Blog() {
  const { data: posts, isLoading } = useListBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBlogPostsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage ?? "",
      isPublished: post.isPublished,
    });
    setOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editing ? prev.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast({ title: "Title, slug, excerpt, and content are required", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      coverImage: form.coverImage.trim() || undefined,
      isPublished: form.isPublished,
    };
    try {
      if (editing) {
        await updatePost.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "Blog post updated" });
      } else {
        await createPost.mutateAsync({ data: payload });
        toast({ title: "Blog post created" });
      }
      invalidate();
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    deletePost.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Post deleted" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(posts) ? posts : [];
  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage Blog</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No blog posts yet</td></tr>
                ) : list.map((post) => (
                  <tr key={post.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{post.title}</td>
                    <td className="p-4 align-middle">{formatDate(post.createdAt)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={post.isPublished ? "default" : "secondary"}>
                        {post.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Excerpt *</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} />
            </div>
            <div>
              <Label>Cover Image URL</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
