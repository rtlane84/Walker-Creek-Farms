import { useListFoodItems } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default function Food() {
  const { data: foodItems, isLoading } = useListFoodItems();

  const groupedFood = foodItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof foodItems>);

  return (
    <div className="flex flex-col w-full py-16 md:py-24 bg-muted/30 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Local Provisions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enhance your stay with fresh, locally-sourced food options. Pre-order before your arrival and we'll have it ready in your cabin.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="animate-pulse bg-card rounded-xl h-[200px] shadow-sm" />
            <div className="animate-pulse bg-card rounded-xl h-[200px] shadow-sm" />
          </div>
        ) : (
          <div className="space-y-12">
            {groupedFood && Object.entries(groupedFood).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-serif text-2xl font-bold mb-6 text-primary border-b pb-2">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <Card key={item.id} className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <span className="font-semibold text-primary">{formatCurrency(item.price)}</span>
                        </div>
                        {item.servingSize && (
                          <span className="text-sm text-muted-foreground mb-3 inline-block">
                            Serves: {item.servingSize}
                          </span>
                        )}
                        <p className="text-muted-foreground text-sm mt-auto pt-4 border-t border-border/50">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-card border p-8 rounded-xl text-center shadow-sm">
          <h3 className="font-serif text-xl font-bold mb-2">How to Order</h3>
          <p className="text-muted-foreground">
            Food orders can be added during your cabin booking process, or requested via email up to 48 hours before your arrival.
          </p>
        </div>
      </div>
    </div>
  );
}
