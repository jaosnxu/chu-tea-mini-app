import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import {
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Ticket,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from "lucide-react";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [paymentPeriod, setPaymentPeriod] = useState<'today' | 'week' | 'month'>('today');

  // 获取支付统计数据
  const { data: paymentStats, isLoading: paymentStatsLoading } = trpc.payment.getStatistics.useQuery({
    period: paymentPeriod,
  });

  // Mock data - 实际应从 API 获取
  const stats = {
    todayGmv: 125680,
    todayOrders: 342,
    todayUsers: 89,
    todayNewMembers: 23,
    gmvChange: 12.5,
    ordersChange: 8.3,
    usersChange: -2.1,
    membersChange: 15.7,
  };

  const recentOrders = [
    { id: "CHU20251231001", customer: "Иван П.", amount: 890, status: "preparing" },
    { id: "CHU20251231002", customer: "Мария К.", amount: 1250, status: "paid" },
    { id: "CHU20251231003", customer: "Алексей С.", amount: 560, status: "completed" },
    { id: "CHU20251231004", customer: "Елена В.", amount: 2100, status: "delivering" },
    { id: "CHU20251231005", customer: "Дмитрий Н.", amount: 780, status: "pending" },
  ];

  const alerts = [
    { type: "warning", message: t("admin.dashboard.alerts.lowStock"), count: 5 },
    { type: "info", message: t("admin.dashboard.alerts.pendingApproval"), count: 3 },
    { type: "error", message: t("admin.dashboard.alerts.paymentFailed"), count: 2 },
  ];

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ElementType;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </div>
        <div className="flex items-center text-xs mt-1">
          {change >= 0 ? (
            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
            {Math.abs(change)}%
          </span>
          <span className="text-gray-400 ml-1">{t("admin.dashboard.vsYesterday")}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-gray-500">{t("admin.dashboard.subtitle")}</p>
      </div>

      {/* 支付统计卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('admin.dashboard.paymentStats')}
            </CardTitle>
            <select
              value={paymentPeriod}
              onChange={(e) => setPaymentPeriod(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="today">{t('admin.dashboard.period.today')}</option>
              <option value="week">{t('admin.dashboard.period.week')}</option>
              <option value="month">{t('admin.dashboard.period.month')}</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {paymentStatsLoading ? (
            <div className="text-center py-4 text-gray-500">加载中...</div>
          ) : paymentStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">₽{paymentStats.totalAmount}</p>
                <p className="text-xs text-gray-500">{t('admin.dashboard.totalAmount')}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{paymentStats.successCount}</p>
                <p className="text-xs text-gray-500">{t('admin.dashboard.successCount')}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{paymentStats.successRate}%</p>
                <p className="text-xs text-gray-500">{t('admin.dashboard.successRate')}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{paymentStats.refundRate}%</p>
                <p className="text-xs text-gray-500">{t('admin.dashboard.refundRate')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">无数据</div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.dashboard.stats.todayGmv")}
          value={stats.todayGmv}
          change={stats.gmvChange}
          icon={DollarSign}
          prefix="₽"
        />
        <StatCard
          title={t("admin.dashboard.stats.todayOrders")}
          value={stats.todayOrders}
          change={stats.ordersChange}
          icon={ShoppingCart}
        />
        <StatCard
          title={t("admin.dashboard.stats.activeUsers")}
          value={stats.todayUsers}
          change={stats.usersChange}
          icon={Users}
        />
        <StatCard
          title={t("admin.dashboard.stats.newMembers")}
          value={stats.todayNewMembers}
          change={stats.membersChange}
          icon={TrendingUp}
        />
      </div>

      {/* Tabs for TeaBot and Mall */}
      <Tabs defaultValue="teabot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teabot">TeaBot</TabsTrigger>
          <TabsTrigger value="mall">TG-Mall</TabsTrigger>
        </TabsList>

        <TabsContent value="teabot" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t("admin.dashboard.recentOrders")}
                </CardTitle>
                <CardDescription>{t("admin.dashboard.recentOrdersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₽{order.amount}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "preparing"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "delivering"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "pending"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {t(`admin.orders.status.${order.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t("admin.dashboard.systemAlerts")}
                </CardTitle>
                <CardDescription>{t("admin.dashboard.systemAlertsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        alert.type === "error"
                          ? "bg-red-50 dark:bg-red-900/20"
                          : alert.type === "warning"
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      <span className="text-sm">{alert.message}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.type === "error"
                            ? "bg-red-100 text-red-700"
                            : alert.type === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Package className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.activeProducts")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2,340</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.activeCoupons")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12,580</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.totalMembers")}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.conversionRate")}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.mallStats")}</CardTitle>
              <CardDescription>{t("admin.dashboard.mallStatsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">₽45,230</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.stats.todayGmv")}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">128</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.stats.todayOrders")}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.pendingShipment")}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-gray-500">{t("admin.dashboard.returnRequests")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
