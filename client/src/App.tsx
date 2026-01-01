import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";
import { StoreProvider } from "./contexts/StoreContext";
import { CartProvider } from "./contexts/CartContext";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import PageSkeleton from "./components/PageSkeleton";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { useAuth } from "./_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { usePreloadPages } from "./hooks/usePreloadPages";
import { useLocation } from "wouter";
import ResourcePreloader from "./components/ResourcePreloader";
import { OfflineIndicator } from "./components/OfflineIndicator";

// 首屏页面（不懒加载）
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import NotFound from "@/pages/NotFound";

// 懒加载页面组件
const Menu = lazy(() => import("./pages/Menu"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Mall = lazy(() => import("./pages/Mall"));
const MallProductDetail = lazy(() => import("./pages/MallProductDetail"));
const MallCart = lazy(() => import("./pages/MallCart"));
const MallCheckout = lazy(() => import("./pages/MallCheckout"));
const Profile = lazy(() => import("./pages/Profile"));
const MemberCenter = lazy(() => import("./pages/MemberCenter"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Points = lazy(() => import("./pages/Points"));
const Addresses = lazy(() => import("./pages/Addresses"));
const InfluencerRegister = lazy(() => import("./pages/InfluencerRegister"));
const InfluencerTasks = lazy(() => import("./pages/InfluencerTasks"));
const InfluencerTaskSubmit = lazy(() => import("./pages/InfluencerTaskSubmit"));
const InfluencerEarnings = lazy(() => import("./pages/InfluencerEarnings"));
const InfluencerWithdraw = lazy(() => import('@/pages/InfluencerWithdraw'));
const OfflineDrafts = lazy(() => import('@/pages/OfflineDrafts'));
const MembershipWelcome = lazy(() => import('@/pages/MembershipWelcome'));
const MembershipRegister = lazy(() => import('@/pages/MembershipRegister'));
const InfluencerProfile = lazy(() => import("./pages/InfluencerProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const DisplayScreen = lazy(() => import("./pages/DisplayScreen"));
const StoreSelector = lazy(() => import("./pages/StoreSelector"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));

// 后台管理页面（懒加载）
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminAds = lazy(() => import("./pages/admin/AdsManagement"));
const AdminProducts = lazy(() => import("./pages/admin/ProductsManagement"));
const AdminCoupons = lazy(() => import("./pages/admin/CouponsManagement"));
const AdminOrders = lazy(() => import("./pages/admin/OrdersManagement"));
const AdminMarketing = lazy(() => import("./pages/admin/MarketingManagement"));
const AdminStores = lazy(() => import("./pages/admin/StoresManagement"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/UsersManagement"));
const AdminApiConfig = lazy(() => import("./pages/admin/ApiConfigManagement"));
const AdminLogs = lazy(() => import("./pages/admin/LogsManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/NotificationsManagement"));
const AdminIikoConfig = lazy(() => import("./pages/admin/IikoConfig"));
const AdminIikoMonitor = lazy(() => import("./pages/admin/IikoMonitor"));
const AdminYooKassaConfig = lazy(() => import("./pages/admin/YooKassaConfig"));
const AdminPaymentHistory = lazy(() => import("./pages/admin/PaymentHistory"));
const AdminProductConfig = lazy(() => import("./pages/admin/ProductConfig"));
const AdminMarketingTriggers = lazy(() => import("./pages/admin/MarketingTriggers"));
const AdminTriggerExecutionHistory = lazy(() => import("./pages/admin/TriggerExecutionHistory"));
const AdminMarketingDashboard = lazy(() => import("./pages/admin/MarketingDashboard"));
const AdminTriggerTemplates = lazy(() => import("./pages/admin/TriggerTemplates"));
const AdminABTestComparison = lazy(() => import("./pages/admin/ABTestComparison"));
const AdminDeliverySettings = lazy(() => import("./pages/admin/DeliverySettings"));
const AdminPointsRules = lazy(() => import("./pages/admin/PointsRules"));
const AdminProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const AdminMemberTagsManagement = lazy(() => import("./pages/admin/MemberTagsManagement"));
const AdminInfluencerCampaigns = lazy(() => import("./pages/admin/InfluencerCampaigns"));
const AdminInfluencerWithdrawals = lazy(() => import("./pages/admin/InfluencerWithdrawals"));
const AdminInfluencerAnalytics = lazy(() => import("./pages/admin/InfluencerAnalyticsEnhanced"));

function Router() {
  // 预加载常用页面
  usePreloadPages();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
      {/* 首页/落地页 */}
      <Route path="/" component={Home} />
      <Route path="/landing/:slug" component={Landing} />
      
      {/* 茶饮点单 */}
      <Route path="/menu" component={Menu} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/store-selector" component={StoreSelector} />
      
      {/* 订单 */}
      <Route path="/orders" component={Orders} />
      <Route path="/order/:id" component={OrderDetail} />
      
      {/* 支付 */}
      <Route path="/payment/:orderId" component={Payment} />
      <Route path="/payment/callback/:orderId" component={PaymentCallback} />
      
      {/* 商城 */}
      <Route path="/mall" component={Mall} />
      <Route path="/mall/product/:id" component={MallProductDetail} />
      <Route path="/mall/cart" component={MallCart} />
      
      {/* 达人系统 */}
      <Route path="/influencer/register" component={InfluencerRegister} />
      <Route path="/influencer/tasks" component={InfluencerTasks} />
      <Route path="/influencer/tasks/:id/submit" component={InfluencerTaskSubmit} />
      <Route path="/influencer/earnings" component={InfluencerEarnings} />
        <Route path="/influencer/withdraw" component={InfluencerWithdraw} />
        <Route path="/offline-drafts" component={OfflineDrafts} />
        <Route path="/membership/welcome" component={MembershipWelcome} />
        <Route path="/membership/register" component={MembershipRegister} />
      <Route path="/influencer/profile" component={InfluencerProfile} />
      <Route path="/mall/checkout" component={MallCheckout} />
      
      {/* 显示屏 */}
      <Route path="/display" component={DisplayScreen} />
      
      {/* 个人中心 */}
      <Route path="/profile" component={Profile} />
      <Route path="/member" component={MemberCenter} />
      <Route path="/coupons" component={Coupons} />
      <Route path="/points" component={Points} />
      <Route path="/addresses" component={Addresses} />
      {/* <Route path="/influencer" component={InfluencerCenter} /> */}
      <Route path="/settings" component={Settings} />
      <Route path="/notification-settings" component={NotificationSettings} />
      
{/* 后台管理 */}
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/ads" component={() => <AdminLayout><AdminAds /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><AdminProducts /></AdminLayout>} />
      <Route path="/admin/product-management" component={() => <AdminLayout><AdminProductManagement /></AdminLayout>} />
      <Route path="/admin/member-tags" component={() => <AdminLayout><AdminMemberTagsManagement /></AdminLayout>} />
      <Route path="/admin/coupons" component={() => <AdminLayout><AdminCoupons /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminOrders /></AdminLayout>} />
      <Route path="/admin/marketing" component={() => <AdminLayout><AdminMarketing /></AdminLayout>} />
      <Route path="/admin/stores" component={() => <AdminLayout><AdminStores /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/api" component={() => <AdminLayout><AdminApiConfig /></AdminLayout>} />
      <Route path="/admin/logs" component={() => <AdminLayout><AdminLogs /></AdminLayout>} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/iiko" component={() => <AdminLayout><AdminIikoConfig /></AdminLayout>} />
      <Route path="/admin/iiko-monitor" component={() => <AdminLayout><AdminIikoMonitor /></AdminLayout>} />
      <Route path="/admin/yookassa" component={() => <AdminLayout><AdminYooKassaConfig /></AdminLayout>} />
      <Route path="/admin/payments" component={() => <AdminLayout><AdminPaymentHistory /></AdminLayout>} />
      <Route path="/admin/product-config" component={() => <AdminLayout><AdminProductConfig /></AdminLayout>} />
      <Route path="/admin/delivery-settings" component={() => <AdminLayout><AdminDeliverySettings /></AdminLayout>} />
      <Route path="/admin/analytics" component={() => <AdminLayout><AdminAnalytics /></AdminLayout>} />
      <Route path="/admin/points-rules" component={() => <AdminLayout><AdminPointsRules /></AdminLayout>} />
      <Route path="/admin/marketing-triggers" component={() => <AdminLayout><AdminMarketingTriggers /></AdminLayout>} />
      <Route path="/admin/trigger-executions/:id" component={() => <AdminLayout><AdminTriggerExecutionHistory /></AdminLayout>} />
      <Route path="/admin/marketing-dashboard" component={() => <AdminLayout><AdminMarketingDashboard /></AdminLayout>} />
      <Route path="/admin/trigger-templates" component={() => <AdminLayout><AdminTriggerTemplates /></AdminLayout>} />
      <Route path="/admin/ab-test" component={() => <AdminLayout><AdminABTestComparison /></AdminLayout>} />
      <Route path="/admin/influencer-campaigns" component={() => <AdminLayout><AdminInfluencerCampaigns /></AdminLayout>} />
      <Route path="/admin/influencer-withdrawals" component={() => <AdminLayout><AdminInfluencerWithdrawals /></AdminLayout>} />
      <Route path="/admin/influencer-analytics" component={() => <AdminLayout><AdminInfluencerAnalytics /></AdminLayout>} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  // 监听 Telegram 主题变化
  useTelegramTheme();
  
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // 检查用户是否需要完善信息，跳转到欢迎页面
  useEffect(() => {
    if (user && !user.profileCompleted) {
      navigate('/membership/welcome');
    }
  }, [user, navigate]);
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TelegramProvider>
          <StoreProvider>
            <CartProvider>
              <ResourcePreloader />
              <OfflineIndicator />
              <TooltipProvider>
                <Router />
              </TooltipProvider>
            </CartProvider>
          </StoreProvider>
        </TelegramProvider>
      </ThemeProvider>
      
      {/* PWA 安装提示 */}
      <PWAInstallPrompt />
    </ErrorBoundary>
  );
}

export default App;
