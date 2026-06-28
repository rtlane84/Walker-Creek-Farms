import { useState } from "react";
import {
  useListBlockedDates,
  useCreateBlockedDate,
  useDeleteBlockedDate,
  useListRentals,
  getListBlockedDatesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getMutationErrorMessage } from "@/lib/admin-api";

type BlockForm = {
  rentalId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

const emptyForm = (): BlockForm => ({ rentalId: "", startDate: "", endDate: "", reason: "" });

export default function AdminBlockedDates() {
  const { data: blockedDates, isLoading } = useListBlockedDates();
  const { data: rentals } = useListRentals();
  const createDate = useCreateBlockedDate();
  const deleteDate = useDeleteBlockedDate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BlockForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBlockedDatesQueryKey() });

  const rentalList = Array.isArray(rentals) ? rentals : [];
  const rentalName = (id: number) => rentalList.find((r) => r.id === id)?.name ?? `#${id}`;

  const handleSave = async () => {
    if (!form.rentalId || !form.startDate || !form.endDate) {
      toast({ title: "Property and dates are required", variant: "destructive" });
      return;
    }
    if (form.endDate <= form.startDate) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }
    try {
      await createDate.mutateAsync({
        data: {
          rentalId: Number(form.rentalId),
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim() || undefined,
        },
      });
      invalidate();
      toast({ title: "Dates blocked" });
      setOpen(false);
      setForm(emptyForm());
    } catch (err) {
      toast({ title: "Failed to block dates", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to unblock these dates?")) return;
    deleteDate.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Dates unblocked" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(blockedDates) ? blockedDates : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Blocked Dates</h1>
        <Button onClick={() => { setForm(emptyForm()); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Block Dates
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Property</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Start Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">End Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No blocked dates</td></tr>
                ) : list.map((bd) => (
                  <tr key={bd.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{rentalName(bd.rentalId)}</td>
                    <td className="p-4 align-middle">{formatDate(bd.startDate)}</td>
                    <td className="p-4 align-middle">{formatDate(bd.endDate)}</td>
                    <td className="p-4 align-middle">{bd.reason || "N/A"}</td>
                    <td className="p-4 align-middle text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(bd.id)}
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
            <DialogTitle>Block Dates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Property *</Label>
              <Select value={form.rentalId} onValueChange={(v) => setForm({ ...form, rentalId: v })}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {rentalList.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="Maintenance, private event, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createDate.isPending}>
              {createDate.isPending ? "Saving..." : "Block Dates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
