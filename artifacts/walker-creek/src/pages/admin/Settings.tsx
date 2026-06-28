import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, BadgeCheck, ClipboardList, Loader2 } from "lucide-react";

const MODES = [
  {
    value: "full",
    icon: CreditCard,
    label: "Full Payment Required",
    description: "Guests pay the full amount at booking via Stripe Checkout. Dates are immediately blocked.",
  },
  {
    value: "deposit",
    icon: BadgeCheck,
    label: "50% Deposit Required",
    description: "Guests pay a 50% deposit now. The remaining balance is collected at check-in.",
  },
  {
    value: "request",
    icon: ClipboardList,
    label: "Request Only (Manual Approval)",
    description: "Guests submit a request with no payment. You review and confirm manually. Good for off-season flexibility.",
  },
];

export default function Settings() {
  const { toast } = useToast();
  const [mode, setMode] = useState<string>("full");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/payment-mode")
      .then((r) => r.json())
      .then((d) => setMode(d.mode ?? "full"))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch("/api/settings/payment-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await resp.json();
      if (data.mode) {
        toast({ title: "Settings saved", description: `Payment mode set to: ${MODES.find((m) => m.value === data.mode)?.label}` });
      } else {
        throw new Error(data.error ?? "Save failed");
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure how guests book and pay for their stay.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Payment Mode</CardTitle>
          <CardDescription>
            Choose how guests complete their booking. This affects all new bookings immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <RadioGroup value={mode} onValueChange={setMode} className="space-y-4">
              {MODES.map(({ value, icon: Icon, label, description }) => (
                <div
                  key={value}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    mode === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setMode(value)}
                >
                  <RadioGroupItem value={value} id={value} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <Label htmlFor={value} className="font-semibold cursor-pointer">{label}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Email notifications are sent automatically when bookings are confirmed. Configure SMTP settings via environment variables:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 text-muted-foreground">
            <p>SMTP_HOST=smtp.gmail.com</p>
            <p>SMTP_PORT=587</p>
            <p>SMTP_USER=your@email.com</p>
            <p>SMTP_PASS=your-app-password</p>
            <p>FROM_EMAIL=noreply@walkercreekfarms.com</p>
            <p>OWNER_EMAIL=owner@walkercreekfarms.com</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Set these in the Replit Secrets panel. Without SMTP configured, no emails are sent but bookings still work normally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
