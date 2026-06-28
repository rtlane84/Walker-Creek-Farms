import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/cabins", label: "Cabins & Yurts" },
    { href: "/food", label: "Food" },
    { href: "/faqs", label: "FAQs" },
    { href: "/gift-certificates", label: "Gift Certificates" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Walker Creek Farms
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="font-semibold" variant="default">
              <Link href="/cabins">Book a Stay</Link>
            </Button>
          </nav>

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden border-t border-border/50 bg-background px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-lg font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="w-full mt-4" variant="default">
              <Link href="/cabins" onClick={() => setIsOpen(false)}>Book a Stay</Link>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-4">Walker Creek Farms & Cabins</h3>
              <p className="text-sidebar-foreground/80 leading-relaxed max-w-sm">
                A rustic-modern retreat nestled on 250+ acres of Appalachian wilderness in Nebo, West Virginia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Contact Us</h4>
              <ul className="space-y-3 text-sidebar-foreground/80">
                <li>230 Nebo Walker Road</li>
                <li>Nebo, WV 25141</li>
                <li><a href="tel:304-421-4392" className="hover:text-primary transition-colors">304-421-4392</a></li>
                <li><a href="mailto:wcfcabins@gmail.com" className="hover:text-primary transition-colors">wcfcabins@gmail.com</a></li>
                <li>8AM - 8PM, 7 Days a week</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sidebar-foreground/80 hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-sidebar-border/50 text-center text-sidebar-foreground/60 text-sm">
            <p>&copy; {new Date().getFullYear()} Walker Creek Farms & Cabins. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
