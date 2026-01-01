import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Award, 
  TrendingUp, 
  Target, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2,
  Trophy,
  Star,
  Zap,
  Crown,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function InfluencerProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const { data: influencerInfo, isLoading: infoLoading } = trpc.influencer.getMyInfo.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: upgradeProgress, isLoading: progressLoading } = trpc.influencer.getMyUpgradeProgress.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: levelRules } = trpc.influencer.getLevelRules.useQuery();

  const [linkData, setLinkData] = useState<{ linkCode: string; link: string } | null>(null);
  
  const generateLinkMutation = trpc.influencer.generateLink.useMutation({
    onSuccess: (data) => {
      setLinkData(data);
    },
  });

  // 自动生成链接
  if (user && !linkData && !generateLinkMutation.isPending) {
    generateLinkMutation.mutate({});
  }

  const { data: earnings } = trpc.influencer.getMyEarnings.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: orderAttributions } = trpc.influencer.getMyOrderAttributions.useQuery(
    undefined,
    { enabled: !!user }
  );

  // 生成二维码
  const generateQRCode = async (url: string) => {
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  // 当链接数据加载完成时生成二维码
  if (linkData?.link && !qrCodeUrl) {
    generateQRCode(linkData.link);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>请先登录</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (infoLoading || progressLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!influencerInfo) {
    return (
      <div className="container max-w-6xl mx-auto py-12">
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

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "bronze":
        return <Award className="h-6 w-6 text-orange-600" />;
      case "silver":
        return <Star className="h-6 w-6 text-gray-400" />;
      case "gold":
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case "diamond":
        return <Crown className="h-6 w-6 text-blue-500" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getLevelName = (level: string) => {
    const names: Record<string, string> = {
      bronze: "青铜达人",
      silver: "白银达人",
      gold: "黄金达人",
      diamond: "钻石达人",
    };
    return names[level] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      bronze: "bg-gradient-to-r from-orange-500 to-orange-700",
      silver: "bg-gradient-to-r from-gray-400 to-gray-600",
      gold: "bg-gradient-to-r from-yellow-400 to-yellow-600",
      diamond: "bg-gradient-to-r from-blue-400 to-blue-600",
    };
    return colors[level] || "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  // 计算成就
  const achievements = [
    {
      id: "first_order",
      name: "首单达成",
      description: "完成第一笔订单",
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
      achieved: (orderAttributions?.length || 0) >= 1,
    },
    {
      id: "ten_orders",
      name: "十单里程碑",
      description: "累计完成 10 笔订单",
      icon: <Target className="h-6 w-6 text-blue-500" />,
      achieved: (orderAttributions?.length || 0) >= 10,
    },
    {
      id: "hundred_orders",
      name: "百单大师",
      description: "累计完成 100 笔订单",
      icon: <Trophy className="h-6 w-6 text-yellow-500" />,
      achieved: (orderAttributions?.length || 0) >= 100,
    },
    {
      id: "silver_level",
      name: "白银晋升",
      description: "达到白银等级",
      icon: <Star className="h-6 w-6 text-gray-400" />,
      achieved: ["silver", "gold", "diamond"].includes(influencerInfo.influencerLevel || "bronze"),
    },
    {
      id: "gold_level",
      name: "黄金荣耀",
      description: "达到黄金等级",
      icon: <Trophy className="h-6 w-6 text-yellow-500" />,
      achieved: ["gold", "diamond"].includes(influencerInfo.influencerLevel || "bronze"),
    },
    {
      id: "diamond_level",
      name: "钻石传奇",
      description: "达到钻石等级",
      icon: <Crown className="h-6 w-6 text-blue-500" />,
      achieved: influencerInfo.influencerLevel === "diamond",
    },
  ];

  const achievedCount = achievements.filter((a) => a.achieved).length;

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* 等级卡片 */}
      <Card className={`${getLevelColor(influencerInfo.influencerLevel || "bronze")} text-white`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-full">
                {getLevelIcon(influencerInfo.influencerLevel || "bronze")}
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {getLevelName(influencerInfo.influencerLevel || "bronze")}
                </CardTitle>
                <CardDescription className="text-white/80 mt-1">
                  {user.name || "达人"} • 达人编号 #{user.id}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">佣金加成</div>
              <div className="text-3xl font-bold">
                {levelRules?.[influencerInfo.influencerLevel || "bronze"]?.commissionMultiplier || 1.0}x
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-white/80">累计收益</div>
              <div className="text-2xl font-bold">₽{influencerInfo.totalEarnings || "0.00"}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-white/80">可提现</div>
              <div className="text-2xl font-bold">₽{influencerInfo.availableBalance || "0.00"}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-white/80">累计订单</div>
              <div className="text-2xl font-bold">{orderAttributions?.length || 0}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-white/80">转化率</div>
              <div className="text-2xl font-bold">{influencerInfo.conversionRate || "0.00"}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 升级进度 */}
        {upgradeProgress && upgradeProgress.nextLevel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                升级进度
              </CardTitle>
              <CardDescription>
                距离 {getLevelName(upgradeProgress.nextLevel)} 还需努力
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">销售额进度</span>
                  <span className="text-sm text-muted-foreground">
                    ₽{upgradeProgress.progress.revenue.current.toFixed(2)} / ₽
                    {upgradeProgress.progress.revenue.required}
                  </span>
                </div>
                <Progress value={upgradeProgress.progress.revenue.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {upgradeProgress.progress.revenue.percentage.toFixed(1)}% 完成
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">订单数进度</span>
                  <span className="text-sm text-muted-foreground">
                    {upgradeProgress.progress.orders.current} / {upgradeProgress.progress.orders.required} 单
                  </span>
                </div>
                <Progress value={upgradeProgress.progress.orders.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {upgradeProgress.progress.orders.percentage.toFixed(1)}% 完成
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  升级到 {getLevelName(upgradeProgress.nextLevel)} 后，佣金加成将提升至{" "}
                  <strong>
                    {levelRules?.[upgradeProgress.nextLevel]?.commissionMultiplier || 1.0}x
                  </strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* 专属推广链接 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              专属推广链接
            </CardTitle>
            <CardDescription>分享您的专属链接，赚取佣金</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkData?.link && (
              <>
                <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
                  {linkData.link}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(linkData.link)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制链接
                </Button>

                {qrCodeUrl && (
                  <div className="flex flex-col items-center gap-3 pt-4 border-t">
                    <div className="text-sm font-medium">推广二维码</div>
                    <img src={qrCodeUrl} alt="推广二维码" className="w-48 h-48 border rounded-lg" />
                    <p className="text-xs text-muted-foreground text-center">
                      扫描二维码或分享图片给好友
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成就系统 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                成就徽章
              </CardTitle>
              <CardDescription>
                已解锁 {achievedCount} / {achievements.length} 个成就
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {achievedCount}/{achievements.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg transition-all ${
                  achievement.achieved
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/50 border-muted opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={achievement.achieved ? "" : "grayscale"}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.achieved && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 快速导航 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-20"
          onClick={() => setLocation("/influencer/tasks")}
        >
          <div className="flex flex-col items-center gap-2">
            <Target className="h-5 w-5" />
            <span>任务中心</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-20"
          onClick={() => setLocation("/influencer/earnings")}
        >
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>收益统计</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-20"
          onClick={() => setLocation("/influencer/withdraw")}
        >
          <div className="flex flex-col items-center gap-2">
            <Award className="h-5 w-5" />
            <span>提现管理</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-20"
          onClick={() => setLocation("/admin/influencer-analytics")}
        >
          <div className="flex flex-col items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span>数据分析</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
