import { useState } from "react";
import {
  useListGiftCertificates,
  useCreateGiftCertificate,
  useUpdateGiftCertificate,
  useDeleteGiftCertificate,
  getListGiftCertificatesQueryKey,
  type GiftCertificate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getMutationErrorMessage } from "@/lib/admin-api";

type CertForm = {
  name: string;
  description: string;
  amount: string;
  isActive: boolean;
};

const emptyForm = (): CertForm => ({ name: "", description: "", amount: "", isActive: true });

export default function AdminGiftCertificates() {
  const { data: certificates, isLoading } = useListGiftCertificates();
  const createCert = useCreateGiftCertificate();
  const updateCert = useUpdateGiftCertificate();
  const deleteCert = useDeleteGiftCertificate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCertificate | null>(null);
  const [form, setForm] = useState<CertForm>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListGiftCertificatesQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (cert: GiftCertificate) => {
    setEditing(cert);
    setForm({
      name: cert.name,
      description: cert.description,
      amount: String(cert.amount),
      isActive: cert.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.amount) {
      toast({ title: "Name, description, and amount are required", variant: "destructive" });
      return;
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount)) {
      toast({ title: "Amount must be a number", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await updateCert.mutateAsync({
          id: editing.id,
          data: {
            name: form.name.trim(),
            description: form.description.trim(),
            amount,
            isActive: form.isActive,
          },
        });
        toast({ title: "Gift certificate updated" });
      } else {
        await createCert.mutateAsync({
          data: {
            name: form.name.trim(),
            description: form.description.trim(),
            amount,
          },
        });
        toast({ title: "Gift certificate created" });
      }
      invalidate();
      setOpen(false);
    } catch (err) {
      toast({ title: "Save failed", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this gift certificate?")) return;
    deleteCert.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Gift certificate deleted" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(certificates) ? certificates : [];
  const saving = createCert.isPending || updateCert.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage Gift Certificates</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Certificate
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No gift certificates yet</td></tr>
                ) : list.map((cert) => (
                  <tr key={cert.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{cert.name}</td>
                    <td className="p-4 align-middle">{formatCurrency(cert.amount)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={cert.isActive ? "default" : "secondary"}>
                        {cert.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cert)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(cert.id)}
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
            <DialogTitle>{editing ? "Edit Gift Certificate" : "Add Gift Certificate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Amount *</Label>
              <Input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
