import { useState, useMemo } from "react";
import { useGetRental, useGetRentalAvailability, useCreateBooking } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Users, BedDouble, Bath, ArrowLeft, CalendarX, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useToast } from "@/hooks/use-toast";

type BookingStep = "dates" | "details" | "confirm";

function formatDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(d: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut + "T00:00:00Z").getTime() - new Date(checkIn + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function CabinDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: rental, isLoading } = useGetRental(Number(id), { query: { enabled: !!id } });
  const { data: availability } = useGetRentalAvailability(Number(id), { query: { enabled: !!id } });
  const createBooking = useCreateBooking();

  const [step, setStep] = useState<BookingStep>("dates");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guestCount, setGuestCount] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMode, setPaymentMode] = useState<string | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const unavailableDates = useMemo(() => {
    if (!availability?.unavailableDates) return new Set<string>();
    return new Set(availability.unavailableDates);
  }, [availability]);

  const disabledDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Add past days
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    // Add unavailable dates
    unavailableDates.forEach((dateStr) => {
      days.push(new Date(dateStr + "T12:00:00Z"));
    });
    return days;
  }, [unavailableDates]);

  const pricing = useMemo(() => {
    if (!rental || !checkIn || !checkOut) return null;
    const nights = calcNights(checkIn, checkOut);
    if (nights <= 0) return null;

    let nightlyTotal = 0;
    const start = new Date(checkIn + "T12:00:00Z");
    for (let i = 0; i < nights; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const dow = d.getUTCDay();
      nightlyTotal += dow === 0 || dow === 5 || dow === 6 ? rental.weekendPrice : rental.weekdayPrice;
    }
    const cleaningFee = rental.cleaningFee;
    const taxAmount = (nightlyTotal + cleaningFee) * (rental.taxRate / 100);
    const totalPrice = nightlyTotal + cleaningFee + taxAmount;
    return { nights, nightlyTotal, cleaningFee, taxAmount, totalPrice };
  }, [rental, checkIn, checkOut]);

  const handleDayClick = (day: Date) => {
    const str = formatDateStr(day);
    if (unavailableDates.has(str)) return;
    if (!checkIn || selectingEnd === false) {
      setCheckIn(str);
      setCheckOut("");
      setSelectingEnd(true);
    } else {
      if (str <= checkIn) {
        setCheckIn(str);
        setCheckOut("");
        setSelectingEnd(true);
      } else {
        // Check if any unavailable date is between checkIn and this day
        let hasConflict = false;
        const cursor = new Date(checkIn + "T12:00:00Z");
        const end = new Date(str + "T12:00:00Z");
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        while (cursor < end) {
          if (unavailableDates.has(formatDateStr(cursor))) { hasConflict = true; break; }
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        if (hasConflict) {
          toast({ title: "Date range contains unavailable dates", variant: "destructive" });
          setCheckIn(str);
          setCheckOut("");
        } else {
          setCheckOut(str);
          setSelectingEnd(false);
        }
      }
    }
  };

  const handleRequestBooking = async () => {
    if (!rental || !checkIn || !checkOut || !pricing) return;
    try {
      const booking = await createBooking.mutateAsync({
        body: {
          rentalId: Number(id),
          guestName, guestEmail, guestPhone,
          checkIn, checkOut, guestCount,
          specialRequests: specialRequests || undefined,
        },
      });

      if (paymentMode === "request") {
        setLocation("/booking-success?booking_id=" + booking.id + "&mode=request");
        return;
      }

      // Go to Stripe checkout
      const resp = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    }
  };

  // Fetch payment mode on mount
  useMemo(() => {
    fetch("/api/settings/payment-mode")
      .then((r) => r.json())
      .then((d) => setPaymentMode(d.mode))
      .catch(() => setPaymentMode("full"));
  }, []);

  if (isLoading || !rental) {
    return (
      <div className="container mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-8" />
        <div className="h-[400px] bg-muted rounded-xl w-full mb-8" />
        <div className="h-64 bg-muted rounded-xl w-full" />
      </div>
    );
  }

  const amenities = rental.amenities ? rental.amenities.split(",").map((a) => a.trim()) : [];

  const selectedRange = checkIn && checkOut
    ? { from: new Date(checkIn + "T12:00:00Z"), to: new Date(checkOut + "T12:00:00Z") }
    : checkIn
    ? { from: new Date(checkIn + "T12:00:00Z"), to: undefined }
    : undefined;

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Header Image */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-muted">
        {rental.coverPhoto ? (
          <img src={rental.coverPhoto} alt={rental.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-muted-foreground">
            No Photo Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full container mx-auto px-4 pb-8">
          <Button variant="outline" asChild className="mb-6 bg-background/50 backdrop-blur border-border/50">
            <Link href="/cabins"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Cabins</Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
              {rental.type}
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">{rental.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex flex-wrap gap-6 py-6 border-y border-border/50 text-muted-foreground">
              <div className="flex items-center gap-2 text-lg"><Users className="w-5 h-5" /> Up to {rental.guestCount} Guests</div>
              <div className="flex items-center gap-2 text-lg"><BedDouble className="w-5 h-5" /> {rental.bedrooms} Bedroom{rental.bedrooms !== 1 ? "s" : ""}</div>
              <div className="flex items-center gap-2 text-lg"><Bath className="w-5 h-5" /> {rental.bathrooms} Bathroom{rental.bathrooms !== 1 ? "s" : ""}</div>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-muted-foreground">
              <p className="whitespace-pre-wrap">{rental.description}</p>
            </div>
            {amenities.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-6">Amenities</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amenities.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Booking Widget */}
          <div>
            <Card className="sticky top-24 shadow-xl border-border/50 bg-card/50 backdrop-blur overflow-hidden">
              {/* Pricing header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatCurrency(rental.weekdayPrice)}</span>
                  <span className="text-muted-foreground">/ night</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Fri–Sun: {formatCurrency(rental.weekendPrice)} / night
                </div>
              </div>

              {/* Step: Date selection */}
              {step === "dates" && (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    {!checkIn ? "Select your check-in date" : !checkOut ? "Now select your check-out date" : `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)}`}
                  </p>
                  <div className="flex justify-center">
                    <DayPicker
                      mode="range"
                      selected={selectedRange as any}
                      onDayClick={handleDayClick}
                      disabled={disabledDays}
                      modifiers={{ unavailable: disabledDays }}
                      modifiersStyles={{
                        unavailable: { textDecoration: "line-through", color: "#aaa" },
                      }}
                      fromDate={new Date()}
                      numberOfMonths={1}
                      styles={{
                        root: { fontSize: "0.85rem" },
                      }}
                    />
                  </div>

                  {checkIn && checkOut && pricing && (
                    <div className="mt-4 space-y-2 text-sm border-t border-border/50 pt-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{pricing.nights} night{pricing.nights !== 1 ? "s" : ""}</span>
                        <span>{formatCurrency(pricing.nightlyTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cleaning fee</span>
                        <span>{formatCurrency(pricing.cleaningFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes ({rental.taxRate}%)</span>
                        <span>{formatCurrency(pricing.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(pricing.totalPrice)}</span>
                      </div>

                      <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="guests" className="text-muted-foreground whitespace-nowrap">Guests</Label>
                          <Input
                            id="guests"
                            type="number"
                            min={1}
                            max={rental.guestCount}
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-xs text-muted-foreground">max {rental.guestCount}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-2 py-5 font-bold"
                        onClick={() => setStep("details")}
                        disabled={guestCount < 1 || guestCount > rental.guestCount}
                      >
                        Continue to Book
                      </Button>

                      {paymentMode === "deposit" && (
                        <p className="text-xs text-muted-foreground text-center">
                          50% deposit ({formatCurrency(pricing.totalPrice * 0.5)}) charged now. Balance due at check-in.
                        </p>
                      )}
                      {paymentMode === "request" && (
                        <p className="text-xs text-muted-foreground text-center">
                          Request only — no payment until owner confirms.
                        </p>
                      )}
                    </div>
                  )}

                  {(!checkIn || !checkOut) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground justify-center">
                      <CalendarX className="w-3 h-3" />
                      <span>Strikethrough dates are unavailable</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Guest details */}
              {step === "details" && (
                <div className="p-6 space-y-4">
                  <button
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setStep("dates")}
                  >
                    ← Back
                  </button>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-center">
                    {formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)} · {pricing?.nights} night{pricing?.nights !== 1 ? "s" : ""} · {guestCount} guest{guestCount !== 1 ? "s" : ""}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Jane Smith" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="jane@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="(555) 555-5555" />
                    </div>
                    <div>
                      <Label htmlFor="requests">Special Requests</Label>
                      <Textarea
                        id="requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Pets, accessibility needs, late check-in, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full py-5 font-bold"
                    onClick={() => setStep("confirm")}
                    disabled={!guestName || !guestEmail || !guestPhone}
                  >
                    Review Booking
                  </Button>
                </div>
              )}

              {/* Step: Confirm & Pay */}
              {step === "confirm" && pricing && (
                <div className="p-6 space-y-4">
                  <button
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setStep("details")}
                  >
                    ← Back
                  </button>
                  <div className="space-y-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium">{rental.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{formatDisplayDate(checkIn)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{formatDisplayDate(checkOut)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span>{guestCount}</span></div>
                    </div>
                    <div className="space-y-2 border-t border-border/50 pt-3">
                      <div className="flex justify-between"><span className="text-muted-foreground">{pricing.nights} night{pricing.nights !== 1 ? "s" : ""}</span><span>{formatCurrency(pricing.nightlyTotal)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Cleaning fee</span><span>{formatCurrency(pricing.cleaningFee)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>{formatCurrency(pricing.taxAmount)}</span></div>
                      <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(pricing.totalPrice)}</span>
                      </div>
                      {paymentMode === "deposit" && (
                        <div className="flex justify-between text-primary font-medium">
                          <span>Due now (50% deposit)</span>
                          <span>{formatCurrency(pricing.totalPrice * 0.5)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full py-5 font-bold"
                    onClick={handleRequestBooking}
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : paymentMode === "request" ? (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Submit Request</>
                    ) : (
                      <>Proceed to Payment →</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {paymentMode === "request"
                      ? "No payment charged until owner confirms your request."
                      : "Secure payment via Stripe. Your card info never touches our servers."}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
