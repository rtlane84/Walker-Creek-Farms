import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Home from "@/pages/public/Home";
import Cabins from "@/pages/public/Cabins";
import CabinDetail from "@/pages/public/CabinDetail";
import Food from "@/pages/public/Food";
import Faqs from "@/pages/public/Faqs";
import GiftCertificates from "@/pages/public/GiftCertificates";
import Contact from "@/pages/public/Contact";
import Blog from "@/pages/public/Blog";
import BlogPost from "@/pages/public/BlogPost";

import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import Rentals from "@/pages/admin/Rentals";
import Bookings from "@/pages/admin/Bookings";
import AdminFood from "@/pages/admin/Food";
import AdminFaqs from "@/pages/admin/Faqs";
import AdminBlog from "@/pages/admin/Blog";
import AdminGiftCertificates from "@/pages/admin/GiftCertificates";
import AdminContact from "@/pages/admin/Contact";
import AdminBlockedDates from "@/pages/admin/BlockedDates";

const queryClient = new QueryClient();

function Router() {
  const [location, setLocation] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    if (location === "/admin/login") {
       return (
         <Switch>
           <Route path="/admin/login" component={AdminLogin} />
           <Route component={NotFound} />
         </Switch>
       )
    }

    return (
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={() => { setLocation("/admin/dashboard"); return null; }} />
          <Route path="/admin/dashboard" component={Dashboard} />
          <Route path="/admin/rentals" component={Rentals} />
          <Route path="/admin/bookings" component={Bookings} />
          <Route path="/admin/food" component={AdminFood} />
          <Route path="/admin/faqs" component={AdminFaqs} />
          <Route path="/admin/blog" component={AdminBlog} />
          <Route path="/admin/gift-certificates" component={AdminGiftCertificates} />
          <Route path="/admin/contact" component={AdminContact} />
          <Route path="/admin/blocked-dates" component={AdminBlockedDates} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    );
  }

  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/cabins" component={Cabins} />
        <Route path="/cabins/:id" component={CabinDetail} />
        <Route path="/food" component={Food} />
        <Route path="/faqs" component={Faqs} />
        <Route path="/gift-certificates" component={GiftCertificates} />
        <Route path="/contact" component={Contact} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
