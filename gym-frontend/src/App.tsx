import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Trainers from "@/pages/trainers";
import Plans from "@/pages/plans";
import Subscriptions from "@/pages/subscriptions";
import Attendance from "@/pages/attendance";
import Workouts from "@/pages/workouts";
import Diet from "@/pages/diet";
import Classes from "@/pages/classes";
import Payments from "@/pages/payments";
import Equipment from "@/pages/equipment";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/trainers" component={Trainers} />
        <Route path="/plans" component={Plans} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/diet" component={Diet} />
        <Route path="/classes" component={Classes} />
        <Route path="/payments" component={Payments} />
        <Route path="/equipment" component={Equipment} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
