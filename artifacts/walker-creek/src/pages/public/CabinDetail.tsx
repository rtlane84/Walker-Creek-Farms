import { useGetRental } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, BedDouble, Bath, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";

export default function CabinDetail() {
  const { id } = useParams();
  const { data: rental, isLoading } = useGetRental(Number(id), { query: { enabled: !!id } });

  if (isLoading || !rental) {
    return (
      <div className="container mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-8" />
        <div className="h-[400px] bg-muted rounded-xl w-full mb-8" />
        <div className="h-64 bg-muted rounded-xl w-full" />
      </div>
    );
  }

  const amenities = rental.amenities ? rental.amenities.split(',').map(a => a.trim()) : [];

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Header Image */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-muted">
        {rental.coverPhoto ? (
          <img 
            src={rental.coverPhoto} 
            alt={rental.name}
            className="w-full h-full object-cover"
          />
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
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            {rental.name}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 py-6 border-y border-border/50 text-muted-foreground">
              <div className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" /> <span>Up to {rental.guestCount} Guests</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <BedDouble className="w-5 h-5" /> <span>{rental.bedrooms} Bedroom{rental.bedrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Bath className="w-5 h-5" /> <span>{rental.bathrooms} Bathroom{rental.bathrooms !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-muted-foreground">
              <p className="whitespace-pre-wrap">{rental.description}</p>
            </div>

            {/* Amenities */}
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

          {/* Booking Sidebar / Pricing */}
          <div>
            <Card className="sticky top-24 p-6 shadow-xl border-border/50 bg-card/50 backdrop-blur">
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{formatCurrency(rental.weekdayPrice)}</span>
                  <span className="text-muted-foreground">/ night (weekday)</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Weekend rate: {formatCurrency(rental.weekendPrice)} / night
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {rental.cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cleaning Fee</span>
                    <span>{formatCurrency(rental.cleaningFee)}</span>
                  </div>
                )}
                {rental.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax Rate</span>
                    <span>{rental.taxRate}%</span>
                  </div>
                )}
              </div>

              <Button className="w-full py-6 text-lg font-bold" asChild>
                <Link href="/contact">Contact to Book</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Booking functionality coming soon. Please contact us directly to reserve this property.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
