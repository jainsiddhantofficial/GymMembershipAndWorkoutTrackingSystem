import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Apple,
  Calendar,
  DollarSign,
  Settings,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/trainers", label: "Trainers", icon: UserCircle },
  { href: "/plans", label: "Plans", icon: CreditCard },
  { href: "/subscriptions", label: "Subscriptions", icon: CalendarCheck },
  { href: "/attendance", label: "Attendance", icon: Activity },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/diet", label: "Diet Plans", icon: Apple },
  { href: "/classes", label: "Classes", icon: Calendar },
  { href: "/payments", label: "Payments", icon: DollarSign },
  { href: "/equipment", label: "Equipment", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border bg-sidebar h-full flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-sidebar-foreground tracking-tight">GYM<span className="text-primary">CORE</span></span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
            <span className="text-xs font-bold">AD</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">Admin User</span>
            <span className="text-xs text-muted-foreground mt-1">admin@gymcore.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
