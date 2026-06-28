import { useState } from "react";
import {
  useListFaqItems,
  useCreateFaqItem,
  useUpdateFaqItem,
  useDeleteFaqItem,
  getListFaqItemsQueryKey,
  type FaqItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getMutationErrorMessage } from "@/lib/admin-api";

type FaqForm = {
  question: string;
  answer: string;
  sortOrder: string;
};

const emptyForm = (): FaqForm => ({ question: "", answer: "", sortOrder: "0" });

export default function Faqs() {
  const { data: items, isLoading } = useListFaqItems();
  const createItem = useCreateFaqItem();
  const updateItem = useUpdateFaqItem();
  const deleteItem = useDeleteFaqItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListFaqItemsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditing(item);
    setForm({
      question: item.question,
      answer: item.answer,
      sortOrder: String(item.sortOrder ?? 0),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Question and answer are required", variant: "destructive" });
      return;
    }
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "FAQ updated" });
      } else {
        await createItem.mutateAsync({ data: payload });
        toast({ title: "FAQ created" });
      }
      invalidate();
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "FAQ deleted" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(items) ? items : [];
  const saving = createItem.isPending || updateItem.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage FAQs</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add FAQ
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Question</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={2} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No FAQs yet</td></tr>
                ) : list.map((item) => (
                  <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{item.question}</td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Question *</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div>
              <Label>Answer *</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
