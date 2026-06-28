import { useListContactMessages, useUpdateContactMessage, useDeleteContactMessage, getListContactMessagesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { Trash2, MailOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getMutationErrorMessage } from "@/lib/admin-api";

export default function AdminContact() {
  const { data: messages, isLoading } = useListContactMessages();
  const updateMessage = useUpdateContactMessage();
  const deleteMessage = useDeleteContactMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkRead = (id: number) => {
    updateMessage.mutate(
      { id, data: { isRead: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
          toast({ title: "Marked as read" });
        },
        onError: (err) => {
          toast({ title: "Update failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    deleteMessage.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
          toast({ title: "Message deleted" });
        },
        onError: (err) => {
          toast({ title: "Delete failed", description: getMutationErrorMessage(err), variant: "destructive" });
        },
      },
    );
  };

  const list = Array.isArray(messages) ? messages : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Contact Messages</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">From</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : list.map((msg) => (
                  <tr key={msg.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{msg.name}</div>
                      <div className="text-xs text-muted-foreground">{msg.email}</div>
                    </td>
                    <td className="p-4 align-middle font-medium">{msg.subject}</td>
                    <td className="p-4 align-middle">{formatDate(msg.createdAt)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={msg.isRead ? "secondary" : "default"}>
                        {msg.isRead ? "Read" : "Unread"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {!msg.isRead && (
                        <Button variant="ghost" size="icon" title="Mark as Read" onClick={() => handleMarkRead(msg.id)}>
                          <MailOpen className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(msg.id)}
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
