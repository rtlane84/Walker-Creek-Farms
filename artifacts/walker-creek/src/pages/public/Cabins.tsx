import { Link } from "wouter";
import { useListRentals } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BedDouble, Bath } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { motion } from "framer-motion";

export default function Cabins() {
  const { data: rentals, isLoading } = useListRentals();

  return (
    <div className="flex flex-col w-full py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Cabins & Yurts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our hand-built cabins and unique yurts. Each offers a different way to experience the quiet beauty of Walker Creek Farms.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl h-[450px] shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rentals?.map((rental, index) => (
              <motion.div
                key={rental.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group h-full flex flex-col border-border/50 hover:shadow-lg transition-shadow">
                  <div className="relative h-64 overflow-hidden bg-muted">
                    {rental.coverPhoto ? (
                      <img
                        src={rental.coverPhoto}
                        alt={rental.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif">
                        No Photo
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur font-semibold">
                        {rental.type.charAt(0).toUpperCase() + rental.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl font-bold mb-2">{rental.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {rental.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {rental.guestCount} Guests</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {rental.bedrooms} Bed</span>
                      <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {rental.bathrooms} Bath</span>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold">{formatCurrency(rental.weekdayPrice)}</span>
                        <span className="text-muted-foreground text-sm"> / night</span>
                      </div>
                      <Button asChild>
                        <Link href={`/cabins/${rental.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
