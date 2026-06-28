import { useListBlockedDates, useDeleteBlockedDate, getListBlockedDatesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminBlockedDates() {
  const { data: blockedDates, isLoading } = useListBlockedDates();
  const deleteDate = useDeleteBlockedDate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to unblock these dates?")) {
      deleteDate.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBlockedDatesQueryKey() });
            toast({ title: "Dates unblocked" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Blocked Dates</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Block Dates
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rental ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Start Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">End Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : blockedDates?.map((bd) => (
                  <tr key={bd.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">#{bd.rentalId}</td>
                    <td className="p-4 align-middle">{formatDate(bd.startDate)}</td>
                    <td className="p-4 align-middle">{formatDate(bd.endDate)}</td>
                    <td className="p-4 align-middle">{bd.reason || "N/A"}</td>
                    <td className="p-4 align-middle text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(bd.id)}
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
    </div>
  );
}
