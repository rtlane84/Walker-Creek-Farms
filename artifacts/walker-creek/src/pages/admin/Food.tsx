import { useState } from "react";
import {
  useListFoodItems,
  useCreateFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
  getListFoodItemsQueryKey,
  type FoodItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getMutationErrorMessage } from "@/lib/admin-api";

type FoodForm = {
  category: string;
  name: string;
  description: string;
  price: string;
  servingSize: string;
  sortOrder: string;
  isAvailable: boolean;
};

const emptyForm = (): FoodForm => ({
  category: "",
  name: "",
  description: "",
  price: "",
  servingSize: "",
  sortOrder: "0",
  isAvailable: true,
});

export default function Food() {
  const { data: items, isLoading } = useListFoodItems();
  const createItem = useCreateFoodItem();
  const updateItem = useUpdateFoodItem();
  const deleteItem = useDeleteFoodItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [form, setForm] = useState<FoodForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListFoodItemsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (item: FoodItem) => {
    setEditing(item);
    setForm({
      category: item.category,
      name: item.name,
      description: item.description,
      price: String(item.price),
      servingSize: item.servingSize ?? "",
      sortOrder: String(item.sortOrder ?? 0),
      isAvailable: item.isAvailable,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.category.trim() || !form.name.trim() || !form.description.trim() || !form.price) {
      toast({ title: "Category, name, description, and price are required", variant: "destructive" });
      return;
    }
    const price = Number(form.price);
    if (Number.isNaN(price)) {
      toast({ title: "Price must be a number", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await updateItem.mutateAsync({
          id: editing.id,
          data: {
            category: form.category.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            price,
            servingSize: form.servingSize.trim() || undefined,
            sortOrder: Number(form.sortOrder) || 0,
            isAvailable: form.isAvailable,
          },
        });
        toast({ title: "Food item updated" });
      } else {
        await createItem.mutateAsync({
          data: {
            category: form.category.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            price,
            servingSize: form.servingSize.trim() || undefined,
            sortOrder: Number(form.sortOrder) || 0,
          },
        });
        toast({ title: "Food item created" });
      }
      invalidate();
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Item deleted" });
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
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage Food</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Available</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No food items yet</td></tr>
                ) : list.map((item) => (
                  <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{item.name}</td>
                    <td className="p-4 align-middle">{item.category}</td>
                    <td className="p-4 align-middle">{formatCurrency(item.price)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={item.isAvailable ? "default" : "secondary"}>
                        {item.isAvailable ? "Yes" : "No"}
                      </Badge>
                    </td>
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
            <DialogTitle>{editing ? "Edit Food Item" : "Add Food Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Breakfast" />
              </div>
              <div>
                <Label>Price *</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Serving Size</Label>
                <Input value={form.servingSize} onChange={(e) => setForm({ ...form, servingSize: e.target.value })} placeholder="Serves 2" />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>Available</Label>
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
