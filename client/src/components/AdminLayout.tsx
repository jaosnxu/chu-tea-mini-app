import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Image,
  Package,
  Ticket,
  Coins,
  Users,
  Megaphone,
  ShoppingCart,
  Store,
  Settings,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Globe,
  AlertTriangle,
  Plug,
  Cpu,
  CreditCard,
  TrendingUp,
  BarChart3,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  permission?: string;
  badge?: number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "admin.nav.dashboard", path: "/admin" },
  { icon: Image, labelKey: "admin.nav.ads", path: "/admin/ads" },
  { icon: Package, labelKey: "admin.nav.products", path: "/admin/products" },
  { icon: Ticket, labelKey: "admin.nav.coupons", path: "/admin/coupons" },
  { icon: ShoppingCart, labelKey: "admin.nav.orders", path: "/admin/orders" },
  { icon: Megaphone, labelKey: "admin.nav.marketing", path: "/admin/marketing" },
  { icon: TrendingUp, labelKey: "admin.nav.marketingDashboard", path: "/admin/marketing-dashboard" },
  { icon: FlaskConical, labelKey: "admin.nav.abTest", path: "/admin/ab-test" },
  { icon: Store, labelKey: "admin.nav.stores", path: "/admin/stores" },
  { icon: Users, labelKey: "admin.nav.users", path: "/admin/users" },
  { icon: Bell, labelKey: "admin.nav.notifications", path: "/admin/notifications" },
  { icon: Plug, labelKey: "admin.nav.api", path: "/admin/api" },
  { icon: Cpu, labelKey: "admin.nav.iiko", path: "/admin/iiko" },
  { icon: BarChart3, labelKey: "admin.nav.iikoMonitor", path: "/admin/iiko-monitor" },
  { icon: CreditCard, labelKey: "admin.nav.yookassa", path: "/admin/yookassa" },
  { icon: Coins, labelKey: "admin.nav.payments", path: "/admin/payments" },
  { icon: Settings, labelKey: "admin.nav.productConfig", path: "/admin/product-config" },
  { icon: Settings, labelKey: "admin.nav.deliverySettings", path: "/admin/delivery-settings" },
  { icon: Coins, labelKey: "admin.nav.pointsRules", path: "/admin/points-rules" },
  { icon: BarChart3, labelKey: "admin.nav.analytics", path: "/admin/analytics" },
  { icon: FileText, labelKey: "admin.nav.logs", path: "/admin/logs" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-lg">CHU TEA</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || location.startsWith(item.path + "/");
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">
                        {t(item.labelKey)}
                      </span>
                    )}
                    {!collapsed && item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>{user?.name?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <Avatar className="h-8 w-8 mx-auto">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback>{user?.name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("zh")}>
                  🇨🇳 中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ru")}>
                  🇷🇺 Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>{user?.name?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">
                    {user?.name || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("admin.user.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">{t("admin.user.settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("admin.user.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
