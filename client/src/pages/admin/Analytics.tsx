/**
 * 管理员数据分析仪表板
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Award, ShoppingCart, Package, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [salesDays, setSalesDays] = useState(30);
  const [userGrowthDays, setUserGrowthDays] = useState(30);

  // 查询数据
  const { data: salesStats } = trpc.analytics.getSalesStats.useQuery({});
  const { data: salesTrend } = trpc.analytics.getSalesTrend.useQuery({ days: salesDays });
  const { data: userStats } = trpc.analytics.getUserStats.useQuery();
  const { data: userGrowthTrend } = trpc.analytics.getUserGrowthTrend.useQuery({ days: userGrowthDays });
  const { data: pointsStats } = trpc.analytics.getPointsStats.useQuery();
  const { data: topProducts } = trpc.analytics.getTopProducts.useQuery({ limit: 10 });
  const { data: orderStatusDist } = trpc.analytics.getOrderStatusDistribution.useQuery();
  const { data: deliveryTypeDist } = trpc.analytics.getDeliveryTypeDistribution.useQuery();

  // 格式化会员等级分布数据
  const memberLevelData = userStats?.memberLevelDistribution
    ? [
        { name: '普通会员', value: userStats.memberLevelDistribution.normal },
        { name: '白银会员', value: userStats.memberLevelDistribution.silver },
        { name: '黄金会员', value: userStats.memberLevelDistribution.gold },
        { name: '钻石会员', value: userStats.memberLevelDistribution.diamond },
      ]
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">数据分析</h1>
        <p className="text-muted-foreground">实时业务数据和趋势分析</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="sales">销售分析</TabsTrigger>
          <TabsTrigger value="users">用户分析</TabsTrigger>
          <TabsTrigger value="points">积分分析</TabsTrigger>
          <TabsTrigger value="products">商品分析</TabsTrigger>
        </TabsList>

        {/* 概览 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 关键指标卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总销售额</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₽{salesStats?.totalRevenue.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  平均订单: ₽{salesStats?.avgOrderValue.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">订单总数</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesStats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  优惠券折扣: ₽{salesStats?.totalCouponDiscount.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">用户总数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  活跃用户: {userStats?.activeUsers || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">积分发放</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pointsStats?.totalPointsIssued || 0}</div>
                <p className="text-xs text-muted-foreground">
                  已使用: {pointsStats?.totalPointsUsed || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 订单状态分布 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>订单状态分布</CardTitle>
                <CardDescription>各状态订单数量统计</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusDist}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {orderStatusDist?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>配送类型分布</CardTitle>
                <CardDescription>自提 vs 配送订单统计</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deliveryTypeDist}
                      dataKey="count"
                      nameKey="deliveryType"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {deliveryTypeDist?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 销售分析 */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>销售趋势</CardTitle>
                  <CardDescription>订单数量和销售额变化</CardDescription>
                </div>
                <Select value={salesDays.toString()} onValueChange={(v) => setSalesDays(parseInt(v))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">最近 7 天</SelectItem>
                    <SelectItem value="30">最近 30 天</SelectItem>
                    <SelectItem value="90">最近 90 天</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="订单数" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="销售额 (₽)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户分析 */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>用户增长趋势</CardTitle>
                    <CardDescription>新用户注册数量变化</CardDescription>
                  </div>
                  <Select value={userGrowthDays.toString()} onValueChange={(v) => setUserGrowthDays(parseInt(v))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">最近 7 天</SelectItem>
                      <SelectItem value="30">最近 30 天</SelectItem>
                      <SelectItem value="90">最近 90 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowthTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#8884d8" name="新用户" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>会员等级分布</CardTitle>
                <CardDescription>各等级会员数量统计</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={memberLevelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {memberLevelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 积分分析 */}
        <TabsContent value="points" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>总发放积分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pointsStats?.totalPointsIssued || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>总使用积分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pointsStats?.totalPointsUsed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>可用积分总额</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pointsStats?.totalAvailablePoints || 0}</div>
                <p className="text-sm text-muted-foreground">
                  人均: {pointsStats?.avgPointsPerUser.toFixed(0) || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 商品分析 */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>热门商品 Top 10</CardTitle>
              <CardDescription>按销量排序</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="productName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalQuantity" fill="#8884d8" name="销量" />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" name="销售额 (₽)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
