import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function InfluencerEarnings() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.influencer.getMyEarningsStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: earnings, isLoading: earningsLoading } = trpc.influencer.getMyEarnings.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>请先登录</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (statsLoading || earningsLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "待确认", variant: "secondary" },
      confirmed: { label: "已确认", variant: "default" },
      paid: { label: "已支付", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">收益统计</h1>
        <p className="text-muted-foreground mt-2">查看您的收益明细和统计数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总收益</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">₽{stats?.totalEarnings || "0.00"}</div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>待确认</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">₽{stats?.pendingAmount || "0.00"}</div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已确认</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">₽{stats?.confirmedAmount || "0.00"}</div>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已支付</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">₽{stats?.paidAmount || "0.00"}</div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 收益明细列表 */}
      <Card>
        <CardHeader>
          <CardTitle>收益明细</CardTitle>
          <CardDescription>查看您的所有收益记录</CardDescription>
        </CardHeader>
        <CardContent>
          {!earnings || earnings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>暂无收益记录</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {earning.earningType === "commission" && "佣金收益"}
                        {earning.earningType === "bonus" && "奖金收益"}
                        {earning.earningType === "referral" && "推荐收益"}
                      </span>
                      {getStatusBadge(earning.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {earning.orderId && `订单 #${earning.orderId}`}
                      {earning.orderAmount && ` • 订单金额 ₽${earning.orderAmount}`}
                      {earning.commissionRate && ` • 佣金率 ${earning.commissionRate}%`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(earning.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">+₽{earning.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
