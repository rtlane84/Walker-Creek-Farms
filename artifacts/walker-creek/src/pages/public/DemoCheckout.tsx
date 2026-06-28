import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface BookingSummary {
  id: number;
  guestName: string;
  rentalName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  paymentMode: string;
}

export default function DemoCheckout() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking reference.");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setBooking(data);
      })
      .catch(() => setError("Could not load booking details."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePay = async () => {
    if (!bookingId) return;
    setPaying(true);
    setError(null);
    try {
      const resp = await fetch("/api/stripe/demo-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: Number(bookingId) }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Payment failed");
      setLocation(`/booking-success?booking_id=${bookingId}&mode=demo`);
    } catch (err: any) {
      setError(err.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button asChild><Link href="/cabins">Browse Cabins</Link></Button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const chargeAmount =
    booking.paymentMode === "deposit" ? booking.totalPrice * 0.5 : booking.totalPrice;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4" />
            Demo checkout — no real charges
          </div>
          <h1 className="font-serif text-3xl font-bold">Complete Your Booking</h1>
          <p className="text-muted-foreground mt-2">
            {booking.rentalName} · {booking.checkIn} to {booking.checkOut}
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            Demo payment details
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="card">Card number</Label>
              <Input id="card" defaultValue="4242 4242 4242 4242" readOnly className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" defaultValue="12/28" readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" defaultValue="123" readOnly className="bg-muted/50" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">
              {booking.paymentMode === "deposit" ? "Deposit (50%)" : "Total due today"}
            </span>
            <span className="text-xl font-bold">{formatCurrency(chargeAmount)}</span>
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <Button className="w-full" size="lg" onClick={handlePay} disabled={paying}>
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              "Pay with demo card"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            This is a demonstration. No payment processor is connected.
          </p>
        </Card>
      </div>
    </div>
  );
}
