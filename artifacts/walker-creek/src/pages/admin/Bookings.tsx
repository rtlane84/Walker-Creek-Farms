import { useState } from "react";
import { useListBookings, useDeleteBooking, useUpdateBooking, useCreateBooking, useListRentals, getListBookingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Trash2, CheckCircle, XCircle, RefreshCw, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getMutationErrorMessage } from "@/lib/admin-api";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  pending: "secondary",
  cancelled: "destructive",
};

export default function Bookings() {
  const { data: bookings, isLoading } = useListBookings();
  const { data: rentals } = useListRentals();
  const deleteBooking = useDeleteBooking();
  const updateBooking = useUpdateBooking();
  const createBooking = useCreateBooking();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundId, setRefundId] = useState<number | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [form, setForm] = useState({
    rentalId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkIn: "",
    checkOut: "",
    guestCount: "2",
    specialRequests: "",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
  const rentalsList = Array.isArray(rentals) ? rentals : [];

  const handleCancel = (id: number) => {
    if (!confirm("Cancel this booking? Dates will be freed up.")) return;
    deleteBooking.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Booking cancelled" }); },
      onError: (err) => toast({ title: "Cancel failed", description: getMutationErrorMessage(err), variant: "destructive" }),
    });
  };

  const handleConfirm = (id: number) => {
    updateBooking.mutate({ id, data: { status: "confirmed" } }, {
      onSuccess: () => { invalidate(); toast({ title: "Booking confirmed" }); },
      onError: (err) => toast({ title: "Confirm failed", description: getMutationErrorMessage(err), variant: "destructive" }),
    });
  };

  const handleRefundOpen = (id: number) => {
    setRefundId(id);
    setRefundNote("");
    setRefundOpen(true);
  };

  const handleRefundSave = () => {
    if (!refundId) return;
    updateBooking.mutate({ id: refundId, data: { status: "cancelled", refundNote } }, {
      onSuccess: () => {
        invalidate();
        toast({ title: "Refund noted", description: "Booking cancelled with refund note." });
        setRefundOpen(false);
      },
      onError: (err) => toast({ title: "Update failed", description: getMutationErrorMessage(err), variant: "destructive" }),
    });
  };

  const handleAdd = async () => {
    if (!form.rentalId || !form.guestName || !form.guestEmail || !form.guestPhone || !form.checkIn || !form.checkOut) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await createBooking.mutateAsync({
        data: {
          rentalId: Number(form.rentalId),
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guestCount: Number(form.guestCount),
          specialRequests: form.specialRequests || undefined,
          isAdminCreated: true,
        },
      });
      invalidate();
      toast({ title: "Phone booking added" });
      setAddOpen(false);
      setForm({ rentalId: "", guestName: "", guestEmail: "", guestPhone: "", checkIn: "", checkOut: "", guestCount: "2", specialRequests: "" });
    } catch (err) {
      toast({ title: "Failed to add booking", description: getMutationErrorMessage(err), variant: "destructive" });
    }
  };

  const filtered = (Array.isArray(bookings) ? bookings : []).filter((b) => statusFilter === "all" || b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Manage Bookings</h1>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Phone className="w-4 h-4 mr-2" /> Add Phone Booking
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Guest</th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Rental</th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Dates</th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Total</th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bookings found</td></tr>
                ) : filtered.map((booking) => (
                  <tr key={booking.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{booking.guestName}</div>
                      <div className="text-xs text-muted-foreground">{booking.guestEmail}</div>
                      <div className="text-xs text-muted-foreground">{booking.guestPhone}</div>
                      {(booking as any).isAdminCreated && (
                        <Badge variant="outline" className="text-xs mt-1">Phone</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle">{(booking as any).rentalName || `#${booking.rentalId}`}</td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div>{formatDate(booking.checkIn)}</div>
                      <div className="text-xs text-muted-foreground">→ {formatDate(booking.checkOut)}</div>
                      <div className="text-xs text-muted-foreground">{booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}</div>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div>{formatCurrency(booking.totalPrice)}</div>
                      {(booking as any).refundNote && (
                        <div className="text-xs text-destructive mt-1">Refund: {(booking as any).refundNote}</div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="text-xs">
                        {(booking as any).paymentMode === "deposit" ? "Deposit" :
                         (booking as any).paymentMode === "request" ? "Request" :
                         (booking as any).paymentMode === "manual" ? "Manual" : "Full"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={STATUS_COLORS[booking.status] ?? "outline"}>{booking.status}</Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {booking.status === "pending" && (
                          <Button
                            variant="ghost" size="icon"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Confirm booking"
                            onClick={() => handleConfirm(booking.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.status !== "cancelled" && (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="text-amber-600 hover:text-amber-600 hover:bg-amber-50"
                              title="Mark refund / cancel"
                              onClick={() => handleRefundOpen(booking.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Cancel booking"
                              onClick={() => handleCancel(booking.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Phone Booking Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Phone Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Property *</Label>
              <Select value={form.rentalId} onValueChange={(v) => setForm({ ...form, rentalId: v })}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {rentalsList.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-In *</Label>
                <Input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
              </div>
              <div>
                <Label>Check-Out *</Label>
                <Input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Guest Name *</Label>
              <Input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} placeholder="jane@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone *</Label>
                <Input type="tel" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} placeholder="(555) 555-5555" />
              </div>
              <div>
                <Label>Guests</Label>
                <Input type="number" min={1} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Special Requests</Label>
              <Textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createBooking.isPending}>
              {createBooking.isPending ? "Adding..." : "Add Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund / Cancel Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Refund & Cancel</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">This will cancel the booking. Add a note about the refund for your records.</p>
            <div>
              <Label>Refund Note</Label>
              <Textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="e.g. Full refund issued via Stripe dashboard on 7/4/2026" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefundSave} disabled={updateBooking.isPending}>
              {updateBooking.isPending ? "Saving..." : "Cancel & Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
