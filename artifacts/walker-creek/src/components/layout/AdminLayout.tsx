import { Link, useLocation } from "wouter";
import { useGetAdminMe, useAdminLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Home,
  Calendar,
  Ban,
  UtensilsCrossed,
  MessageCircleQuestion,
  Gift,
  FileText,
  Mail,
  LogOut,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin, isLoading, error } = useGetAdminMe();
  const logout = useAdminLogout();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (error || !admin)) {
      setLocation("/admin/login");
    }
  }, [admin, isLoading, error, setLocation]);

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 animate-spin" />
          <p className="text-muted-foreground">Loading admin...</p>
        </div>
      </div>
    );
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/rentals", label: "Rentals", icon: Home },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/blocked-dates", label: "Blocked Dates", icon: Ban },
    { href: "/admin/food", label: "Food Options", icon: UtensilsCrossed },
    { href: "/admin/faqs", label: "FAQs", icon: MessageCircleQuestion },
    { href: "/admin/gift-certificates", label: "Gift Certificates", icon: Gift },
    { href: "/admin/blog", label: "Blog Posts", icon: FileText },
    { href: "/admin/contact", label: "Messages", icon: Mail },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/admin/login"),
    });
  };

  const NavLinks = () => (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b font-serif text-lg font-bold">
          Admin Portal
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-card flex items-center px-4 justify-between z-50">
        <div className="font-serif text-lg font-bold">Admin Portal</div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <div className="h-16 flex items-center px-6 border-b font-serif text-lg font-bold">
              Admin Portal
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks />
            </div>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:pt-0 pt-16 min-w-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
