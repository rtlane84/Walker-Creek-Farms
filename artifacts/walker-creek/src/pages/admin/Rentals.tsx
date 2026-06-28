import { useState } from "react";
import {
  useListRentals,
  useCreateRental,
  useUpdateRental,
  useDeleteRental,
  getListRentalsQueryKey,
  type Rental,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getMutationErrorMessage } from "@/lib/admin-api";

type RentalForm = {
  name: string;
  type: string;
  description: string;
  guestCount: string;
  bedrooms: string;
  bathrooms: string;
  weekdayPrice: string;
  weekendPrice: string;
  cleaningFee: string;
  taxRate: string;
  amenities: string;
  coverPhoto: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm = (): RentalForm => ({
  name: "",
  type: "cabin",
  description: "",
  guestCount: "2",
  bedrooms: "1",
  bathrooms: "1",
  weekdayPrice: "",
  weekendPrice: "",
  cleaningFee: "0",
  taxRate: "0",
  amenities: "",
  coverPhoto: "",
  sortOrder: "0",
  isActive: true,
});

export default function Rentals() {
  const { data: rentals, isLoading } = useListRentals();
  const createRental = useCreateRental();
  const updateRental = useUpdateRental();
  const deleteRental = useDeleteRental();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [form, setForm] = useState<RentalForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListRentalsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rental: Rental) => {
    setEditing(rental);
    setForm({
      name: rental.name,
      type: rental.type,
      description: rental.description,
      guestCount: String(rental.guestCount),
      bedrooms: String(rental.bedrooms),
      bathrooms: String(rental.bathrooms),
      weekdayPrice: String(rental.weekdayPrice),
      weekendPrice: String(rental.weekendPrice),
      cleaningFee: String(rental.cleaningFee),
      taxRate: String(rental.taxRate),
      amenities: rental.amenities ?? "",
      coverPhoto: rental.coverPhoto ?? "",
      sortOrder: String(rental.sortOrder ?? 0),
      isActive: rental.isActive,
    });
    setOpen(true);
  };

  const parseNumbers = () => {
    const guestCount = Number(form.guestCount);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    const weekdayPrice = Number(form.weekdayPrice);
    const weekendPrice = Number(form.weekendPrice);
    const cleaningFee = Number(form.cleaningFee) || 0;
    const taxRate = Number(form.taxRate) || 0;
    const sortOrder = Number(form.sortOrder) || 0;
    if ([guestCount, bedrooms, bathrooms, weekdayPrice, weekendPrice].some(Number.isNaN)) {
      return null;
    }
    return { guestCount, bedrooms, bathrooms, weekdayPrice, weekendPrice, cleaningFee, taxRate, sortOrder };
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.weekdayPrice || !form.weekendPrice) {
      toast({ title: "Name, description, and prices are required", variant: "destructive" });
      return;
    }
    const nums = parseNumbers();
    if (!nums) {
      toast({ title: "Check numeric fields", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await updateRental.mutateAsync({
          id: editing.id,
          data: {
            name: form.name.trim(),
            type: form.type,
            description: form.description.trim(),
            ...nums,
            amenities: form.amenities.trim() || undefined,
            coverPhoto: form.coverPhoto.trim() || undefined,
            isActive: form.isActive,
          },
        });
        toast({ title: "Rental updated" });
      } else {
        await createRental.mutateAsync({
          data: {
            name: form.name.trim(),
            type: form.type,
            description: form.description.trim(),
            ...nums,
            amenities: form.amenities.trim() || undefined,
            coverPhoto: form.coverPhoto.trim() || undefined,
          },
        });
        toast({ title: "Rental created" });
      }
      invalidate();
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this rental?")) return;
    deleteRental.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Rental deleted" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(rentals) ? rentals : [];
  const saving = createRental.isPending || updateRental.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage Rentals</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Rental
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Capacity</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No rentals yet</td></tr>
                ) : list.map((rental) => (
                  <tr key={rental.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{rental.name}</td>
                    <td className="p-4 align-middle capitalize">{rental.type}</td>
                    <td className="p-4 align-middle">{rental.guestCount} Guests</td>
                    <td className="p-4 align-middle">{formatCurrency(rental.weekdayPrice)} / night</td>
                    <td className="p-4 align-middle">
                      <Badge variant={rental.isActive ? "default" : "secondary"}>
                        {rental.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rental)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(rental.id)}
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
            <DialogTitle>{editing ? "Edit Rental" : "Add Rental"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cabin">Cabin</SelectItem>
                    <SelectItem value="yurt">Yurt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Guests *</Label>
                <Input type="number" min={1} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} />
              </div>
              <div>
                <Label>Bedrooms *</Label>
                <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
              </div>
              <div>
                <Label>Bathrooms *</Label>
                <Input type="number" min={0} step="0.5" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Weekday Price *</Label>
                <Input type="number" min={0} step="0.01" value={form.weekdayPrice} onChange={(e) => setForm({ ...form, weekdayPrice: e.target.value })} />
              </div>
              <div>
                <Label>Weekend Price *</Label>
                <Input type="number" min={0} step="0.01" value={form.weekendPrice} onChange={(e) => setForm({ ...form, weekendPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Cleaning Fee</Label>
                <Input type="number" min={0} step="0.01" value={form.cleaningFee} onChange={(e) => setForm({ ...form, cleaningFee: e.target.value })} />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input type="number" min={0} step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Amenities</Label>
              <Textarea value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} rows={2} placeholder="Comma-separated or short list" />
            </div>
            <div>
              <Label>Cover Photo URL</Label>
              <Input value={form.coverPhoto} onChange={(e) => setForm({ ...form, coverPhoto: e.target.value })} placeholder="https://..." />
            </div>
            {editing && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Rental"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
