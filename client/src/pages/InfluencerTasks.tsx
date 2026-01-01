import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trophy, Target, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function InfluencerTasks() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("available");

  const { data: influencerInfo, isLoading: infoLoading } = trpc.influencer.getMyInfo.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: activeCampaigns, isLoading: campaignsLoading } =
    trpc.influencer.getActiveCampaigns.useQuery();

  const { data: myTasks, isLoading: tasksLoading } = trpc.influencer.getMyTasks.useQuery(
    undefined,
    { enabled: !!user }
  );

  const acceptTaskMutation = trpc.influencer.acceptTask.useMutation({
    onSuccess: () => {
      // 刷新任务列表
      trpc.useUtils().influencer.getMyTasks.invalidate();
    },
  });

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

  if (infoLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!influencerInfo) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            您还不是达人，
            <Button
              variant="link"
              className="ml-1 p-0 h-auto"
              onClick={() => setLocation("/influencer/register")}
            >
              立即申请
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "待开始", variant: "secondary" },
      in_progress: { label: "进行中", variant: "default" },
      submitted: { label: "已提交", variant: "outline" },
      approved: { label: "已通过", variant: "default" },
      rejected: { label: "已拒绝", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "submitted":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* 达人信息卡片 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>达人中心</CardTitle>
              <CardDescription>
                欢迎回来，{user.name || "达人"} • 等级：
                <Badge className="ml-2" variant="outline">
                  {influencerInfo.influencerLevel === "bronze" && "青铜"}
                  {influencerInfo.influencerLevel === "silver" && "白银"}
                  {influencerInfo.influencerLevel === "gold" && "黄金"}
                  {influencerInfo.influencerLevel === "diamond" && "钻石"}
                </Badge>
              </CardDescription>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{influencerInfo.totalEarnings || "0.00"}</div>
              <div className="text-sm text-muted-foreground">总收益 (₽)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{influencerInfo.availableBalance || "0.00"}</div>
              <div className="text-sm text-muted-foreground">可提现 (₽)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{myTasks?.length || 0}</div>
              <div className="text-sm text-muted-foreground">进行中任务</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{influencerInfo.conversionRate || "0.00"}%</div>
              <div className="text-sm text-muted-foreground">转化率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">可接取活动</TabsTrigger>
          <TabsTrigger value="my-tasks">我的任务</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-6">
          {campaignsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !activeCampaigns || activeCampaigns.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>暂无可接取的活动</AlertDescription>
            </Alert>
          ) : (
            activeCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription className="mt-2">{campaign.description}</CardDescription>
                    </div>
                    {campaign.coverImage && (
                      <img
                        src={campaign.coverImage}
                        alt={campaign.name}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">活动时间：</span>
                        {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">参与人数：</span>
                        {campaign.totalParticipants}
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="font-medium mb-2">佣金配置</div>
                      <div className="text-sm">
                        {campaign.commissionConfig.type === "percentage"
                          ? `订单金额的 ${campaign.commissionConfig.value}%`
                          : `每单固定 ₽${campaign.commissionConfig.value}`}
                        {campaign.commissionConfig.minOrder && (
                          <span className="text-muted-foreground ml-2">
                            （最低订单金额 ₽{campaign.commissionConfig.minOrder}）
                          </span>
                        )}
                      </div>
                    </div>

                    {campaign.taskRequirements && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="font-medium mb-2">任务要求</div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {campaign.taskRequirements.minOrders && (
                            <li>• 最少完成 {campaign.taskRequirements.minOrders} 单</li>
                          )}
                          {campaign.taskRequirements.minRevenue && (
                            <li>• 最低销售额 ₽{campaign.taskRequirements.minRevenue}</li>
                          )}
                          {campaign.taskRequirements.contentRequirements &&
                            campaign.taskRequirements.contentRequirements.map((req, idx) => (
                              <li key={idx}>• {req}</li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => acceptTaskMutation.mutate({ campaignId: campaign.id })}
                      disabled={acceptTaskMutation.isPending}
                    >
                      {acceptTaskMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          接取中...
                        </>
                      ) : (
                        "接取任务"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my-tasks" className="space-y-4 mt-6">
          {tasksLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !myTasks || myTasks.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>您还没有接取任何任务</AlertDescription>
            </Alert>
          ) : (
            myTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>任务 #{task.id}</CardTitle>
                      <CardDescription>活动 ID: {task.campaignId}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">当前订单数</div>
                        <div className="text-2xl font-bold">{task.currentOrders || 0}</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">当前销售额</div>
                        <div className="text-2xl font-bold">₽{task.currentRevenue || "0.00"}</div>
                      </div>
                    </div>

                    {task.status === "in_progress" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/influencer/tasks/${task.id}/submit`)}
                      >
                        提交作品
                      </Button>
                    )}

                    {task.status === "rejected" && task.reviewNotes && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>拒绝原因：</strong>
                          {task.reviewNotes}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
