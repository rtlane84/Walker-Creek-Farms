import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useListRentals } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BedDouble, Bath } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function Home() {
  const { data: rentals, isLoading } = useListRentals();

  const featuredRentals = Array.isArray(rentals) ? rentals.slice(0, 3) : [];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="/assets/hero-cabin.png"
          alt="Appalachian wilderness cabin"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="container relative z-20 px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Walker Creek Farms <br /> & Cabins
            </h1>
            <p className="text-lg md:text-2xl font-light max-w-2xl mx-auto mb-10 text-white/90">
              A secluded retreat nestled on 250+ acres of Appalachian wilderness in Nebo, West Virginia.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:scale-105 transition-transform">
              <Link href="/cabins">Explore Cabins & Yurts</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-8 text-foreground">
            Find Your Quiet Place
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Leave the noise behind. Our hand-built cabins and yurts offer a sanctuary where time slows down. 
            Surrounded by warm oak, creek stones, and firelight, experience the deep rest that only nature can provide. 
            Whether you're looking for a romantic getaway, a family adventure, or a solitary retreat, 
            Walker Creek Farms is your home in the woods.
          </p>
        </div>
      </section>

      {/* Featured Rentals */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Featured Stays</h2>
              <p className="text-muted-foreground text-lg">Choose your perfect wilderness escape.</p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link href="/cabins">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-card rounded-xl h-[400px] shadow-sm" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRentals.map((rental, index) => (
                <motion.div
                  key={rental.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
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
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif text-2xl font-bold">{rental.name}</h3>
                      </div>
                      
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
          
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/cabins">View All Stays</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
