import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";
import { StoreProvider } from "./contexts/StoreContext";
import { CartProvider } from "./contexts/CartContext";

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
import StoreSelector from "./pages/StoreSelector";

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
      
      {/* 商城 */}
      <Route path="/mall" component={Mall} />
      <Route path="/mall/product/:id" component={MallProductDetail} />
      <Route path="/mall/cart" component={MallCart} />
      <Route path="/mall/checkout" component={MallCheckout} />
      
      {/* 个人中心 */}
      <Route path="/profile" component={Profile} />
      <Route path="/member" component={MemberCenter} />
      <Route path="/coupons" component={Coupons} />
      <Route path="/points" component={Points} />
      <Route path="/addresses" component={Addresses} />
      <Route path="/influencer" component={InfluencerCenter} />
      <Route path="/settings" component={Settings} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TelegramProvider>
          <StoreProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
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
