import { useListGiftCertificates } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Link } from "wouter";

export default function GiftCertificates() {
  const { data: certificates, isLoading } = useListGiftCertificates();

  return (
    <div className="flex flex-col w-full py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Gift Certificates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Give the gift of deep rest and Appalachian wilderness. Perfect for weddings, anniversaries, or just because.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-card rounded-xl h-[300px] shadow-sm" />
            ))}
          </div>
        ) : !Array.isArray(certificates) || certificates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Gift certificates are not available at the moment. Contact us to learn more.</p>
            <Button asChild className="mt-4">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-8 flex flex-col h-full bg-gradient-to-br from-card to-muted/30">
                  <div className="mb-6 border-b border-border/50 pb-6">
                    <h3 className="font-serif text-3xl font-bold mb-2 text-primary">{cert.name}</h3>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(cert.amount)}</div>
                  </div>
                  <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                    {cert.description}
                  </p>
                  <Button asChild size="lg" className="w-full text-lg">
                    <Link href="/contact">Contact to Purchase</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
