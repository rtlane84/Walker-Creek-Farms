import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, Calendar, Users, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface BookingData {
  id: number;
  guestName: string;
  rentalName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  nightlyTotal: number;
  cleaningFee: number;
  taxAmount: number;
  paymentMode: string;
  status: string;
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function BookingSuccess() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !bookingId) {
      setError("Invalid confirmation link.");
      setLoading(false);
      return;
    }

    fetch(`/api/stripe/session-status?session_id=${sessionId}&booking_id=${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booking) setBooking(data.booking);
        else setError("Could not load booking details.");
      })
      .catch(() => setError("Could not load booking details."))
      .finally(() => setLoading(false));
  }, [sessionId, bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
          <div className="h-6 w-48 bg-muted rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error ?? "Something went wrong."}</p>
          <Button asChild><Link href="/cabins">Browse Cabins</Link></Button>
        </div>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOut + "T00:00:00Z").getTime() - new Date(booking.checkIn + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
            {booking.paymentMode === "request" ? "Request Submitted!" : "Booking Confirmed!"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {booking.paymentMode === "request"
              ? "We'll review your request and get back to you within 24 hours."
              : "A confirmation email has been sent to you. We can't wait to welcome you!"}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-border/50 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">#{booking.id}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{booking.rentalName}</p>
              <p className="text-sm text-muted-foreground">Booking reference #{booking.id}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Check-in</p>
                <p className="text-muted-foreground">{formatDate(booking.checkIn)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Check-out</p>
                <p className="text-muted-foreground">{formatDate(booking.checkOut)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Guests</p>
                <p className="text-muted-foreground">{booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">230 Nebo Walker Road, Clay County, WV</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{nights} night{nights !== 1 ? "s" : ""}</span>
              <span>{formatCurrency(booking.nightlyTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span>{formatCurrency(booking.cleaningFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes</span>
              <span>{formatCurrency(booking.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border/50">
              <span>Total</span>
              <span>{formatCurrency(booking.totalPrice)}</span>
            </div>
            {booking.paymentMode === "deposit" && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                50% deposit charged. Balance due at check-in.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
          <h3 className="font-semibold mb-2">What's next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check your email for a detailed confirmation</li>
            <li>• Check-in time is 3:00 PM, check-out is 11:00 AM</li>
            <li>• WiFi password and directions will be sent closer to your arrival</li>
            <li>• Questions? Email <a href="mailto:info@walkercreekfarms.com" className="text-primary underline">info@walkercreekfarms.com</a></li>
          </ul>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild>
            <Link href="/cabins">
              Explore More Cabins <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
