import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";
import { StoreProvider } from "./contexts/StoreContext";
import { CartProvider } from "./contexts/CartContext";
import { useTelegramTheme } from "./hooks/useTelegramTheme";

// 页面组件
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Menu from "./pages/Menu";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Mall from "./pages/Mall";
import MallProductDetail from "./pages/MallProductDetail";
import MallCart from "./pages/MallCart";
import MallCheckout from "./pages/MallCheckout";
import Profile from "./pages/Profile";
import MemberCenter from "./pages/MemberCenter";
import Coupons from "./pages/Coupons";
import Points from "./pages/Points";
import Addresses from "./pages/Addresses";
import InfluencerCenter from "./pages/InfluencerCenter";
import Settings from "./pages/Settings";
import DisplayScreen from "./pages/DisplayScreen";
import StoreSelector from "./pages/StoreSelector";
import Payment from "./pages/Payment";
import PaymentCallback from "./pages/PaymentCallback";

// 后台管理页面
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAds from "./pages/admin/AdsManagement";
import AdminProducts from "./pages/admin/ProductsManagement";
import AdminCoupons from "./pages/admin/CouponsManagement";
import AdminOrders from "./pages/admin/OrdersManagement";
import AdminMarketing from "./pages/admin/MarketingManagement";
import AdminStores from "./pages/admin/StoresManagement";
import AdminUsers from "./pages/admin/UsersManagement";
import AdminApiConfig from "./pages/admin/ApiConfigManagement";
import AdminLogs from "./pages/admin/LogsManagement";
import AdminNotifications from "./pages/admin/NotificationsManagement";
import AdminIikoConfig from "./pages/admin/IikoConfig";
import AdminIikoMonitor from "./pages/admin/IikoMonitor";
import AdminYooKassaConfig from "./pages/admin/YooKassaConfig";
import AdminPaymentHistory from "./pages/admin/PaymentHistory";

function Router() {
  return (
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
      <Route path="/mall/checkout" component={MallCheckout} />
      
      {/* 显示屏 */}
      <Route path="/display" component={DisplayScreen} />
      
      {/* 个人中心 */}
      <Route path="/profile" component={Profile} />
      <Route path="/member" component={MemberCenter} />
      <Route path="/coupons" component={Coupons} />
      <Route path="/points" component={Points} />
      <Route path="/addresses" component={Addresses} />
      <Route path="/influencer" component={InfluencerCenter} />
      <Route path="/settings" component={Settings} />
      
{/* 后台管理 */}
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/ads" component={() => <AdminLayout><AdminAds /></AdminLayout>} />
      <Route path="/admin/products" component={() => <AdminLayout><AdminProducts /></AdminLayout>} />
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
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // 监听 Telegram 主题变化
  useTelegramTheme();
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TelegramProvider>
          <StoreProvider>
            <CartProvider>
              <TooltipProvider>
                <Router />
              </TooltipProvider>
            </CartProvider>
          </StoreProvider>
        </TelegramProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
