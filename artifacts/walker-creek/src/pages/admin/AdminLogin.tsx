import { useAdminLogin, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const login = useAdminLogin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login.mutate(
      { data: { password: data.password } },
      {
        onSuccess: async (res) => {
          if (res.success) {
            await queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
            setLocation("/admin/dashboard");
          } else {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: res.message || "Invalid password",
            });
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred during login.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Walker Creek Farms Admin</h1>
        </div>
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Sign In</CardTitle>
            <CardDescription>Enter the admin password to access the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending ? "Authenticating..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
