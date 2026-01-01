import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, Users, DollarSign, Target, Award, AlertCircle, Calendar } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function InfluencerAnalyticsEnhanced() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all_time">("month");
  const [trendPeriod, setTrendPeriod] = useState<"day" | "week" | "month">("day");
  const [trendDays, setTrendDays] = useState(30);

  const { data: ranking, isLoading: rankingLoading } = trpc.influencer.getRanking.useQuery({
    period,
    limit: 20,
  });

  const { data: campaigns } = trpc.influencer.listCampaigns.useQuery();

  const { data: trends, isLoading: trendsLoading } = trpc.influencer.getTrends.useQuery({
    period: trendPeriod,
    days: trendDays,
  });

  const { data: overallStats } = trpc.influencer.getOverallStats.useQuery();

  // 计算总体统计数据
  const totalStats = campaigns?.reduce(
    (acc, campaign) => ({
      totalRevenue: acc.totalRevenue + parseFloat(campaign.totalRevenue || "0"),
      totalCommission: acc.totalCommission + parseFloat(campaign.totalCommission || "0"),
      totalOrders: acc.totalOrders + (campaign.totalOrders || 0),
      totalParticipants: acc.totalParticipants + (campaign.totalParticipants || 0),
    }),
    { totalRevenue: 0, totalCommission: 0, totalOrders: 0, totalParticipants: 0 }
  );

  const averageOrderValue = totalStats && totalStats.totalOrders > 0
    ? totalStats.totalRevenue / totalStats.totalOrders
    : 0;

  const roi = totalStats && totalStats.totalCommission > 0
    ? ((totalStats.totalRevenue - totalStats.totalCommission) / totalStats.totalCommission) * 100
    : 0;

  const conversionRate = totalStats && totalStats.totalParticipants > 0
    ? (totalStats.totalOrders / totalStats.totalParticipants) * 100
    : 0;

  // 准备图表数据
  const revenueChartData = trends?.orderTrends.map((item) => ({
    date: item.date,
    revenue: parseFloat(item.total_revenue),
    commission: parseFloat(item.total_commission),
    orders: item.order_count,
  })) || [];

  const influencerChartData = trends?.influencerTrends.map((item) => ({
    date: item.date,
    newInfluencers: item.new_influencers,
  })) || [];

  const clickChartData = trends?.clickTrends.map((item) => ({
    date: item.date,
    clicks: item.click_count,
    uniqueLinks: item.unique_links,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">达人数据分析（增强版）</h1>
        <p className="text-muted-foreground mt-2">查看达人营销系统的关键指标、趋势图表和排行榜</p>
      </div>

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              总销售额
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{overallStats?.totalRevenue || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              来自 {overallStats?.totalOrders || 0} 个订单
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              总佣金支出
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{overallStats?.totalCommission || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ROI: {roi.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              活跃达人数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalInfluencers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              转化率: {conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              平均订单价值
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{overallStats?.avgOrderValue || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              每个订单的平均金额
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                数据趋势分析
              </CardTitle>
              <CardDescription>查看销售额、订单数和达人增长趋势</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="day">按天</option>
                <option value="week">按周</option>
                <option value="month">按月</option>
              </select>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="7">最近 7 天</option>
                <option value="30">最近 30 天</option>
                <option value="90">最近 90 天</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revenue">销售额 & 佣金</TabsTrigger>
                <TabsTrigger value="orders">订单数</TabsTrigger>
                <TabsTrigger value="influencers">新增达人</TabsTrigger>
                <TabsTrigger value="clicks">链接点击</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="销售额 (₽)"
                    />
                    <Line
                      type="monotone"
                      dataKey="commission"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="佣金 (₽)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="orders" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" name="订单数" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="influencers" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={influencerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newInfluencers" fill="#8b5cf6" name="新增达人" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="clicks" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clickChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      name="总点击数"
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueLinks"
                      stroke="#ec4899"
                      strokeWidth={2}
                      name="独立链接数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* 活动列表和排行榜 */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">活动概览</TabsTrigger>
          <TabsTrigger value="ranking">达人排行榜</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {!campaigns || campaigns.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>暂无活动数据</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((campaign) => {
                const campaignROI = parseFloat(campaign.totalCommission || "0") > 0
                  ? ((parseFloat(campaign.totalRevenue || "0") - parseFloat(campaign.totalCommission || "0")) / parseFloat(campaign.totalCommission || "0")) * 100
                  : 0;

                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{campaign.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">ROI</div>
                          <div className="text-2xl font-bold text-green-600">{campaignROI.toFixed(1)}%</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">参与达人</div>
                          <div className="text-xl font-bold">{campaign.totalParticipants}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">订单数</div>
                          <div className="text-xl font-bold">{campaign.totalOrders}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">销售额</div>
                          <div className="text-xl font-bold">₽{campaign.totalRevenue}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">佣金支出</div>
                          <div className="text-xl font-bold">₽{campaign.totalCommission}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">时间范围：</span>
            <div className="flex gap-2">
              {[
                { value: "today", label: "今日" },
                { value: "week", label: "本周" },
                { value: "month", label: "本月" },
                { value: "all_time", label: "全部" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value as any)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    period === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {rankingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !ranking || ranking.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>暂无排行榜数据</AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  达人排行榜
                </CardTitle>
                <CardDescription>根据销售额排名</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ranking.map((influencer, index) => (
                    <div
                      key={influencer.userId}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold text-lg">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">用户 #{influencer.userId}</div>
                        <div className="text-sm text-muted-foreground">
                          {influencer.totalOrders} 个订单 • 转化率 {influencer.conversionRate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">₽{influencer.totalRevenue}</div>
                        <div className="text-sm text-muted-foreground">佣金 ₽{influencer.totalCommission}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
