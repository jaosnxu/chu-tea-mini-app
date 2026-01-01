import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function InfluencerRegister() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [influencerCode, setInfluencerCode] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const applyMutation = trpc.influencer.applyInfluencer.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setLocation("/influencer/tasks");
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || "申请失败，请稍后重试");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!influencerCode.trim()) {
      setError("请输入达人代码");
      return;
    }

    if (influencerCode.length < 3 || influencerCode.length > 32) {
      setError("达人代码长度应在 3-32 个字符之间");
      return;
    }

    applyMutation.mutate({
      influencerCode: influencerCode.trim(),
      followerCount: followerCount ? parseInt(followerCount) : undefined,
    });
  };

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>请先登录后再申请成为达人</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user.isInfluencer) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            您已经是达人了！
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => setLocation("/influencer/tasks")}
            >
              前往任务中心
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>申请成为 CHU TEA 达人</CardTitle>
          <CardDescription>
            加入我们的达人计划，通过推广 CHU TEA 产品赚取佣金
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                恭喜！您已成功成为 CHU TEA 达人，正在跳转到任务中心...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="influencerCode">
                  达人代码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="influencerCode"
                  placeholder="请输入您的专属达人代码（3-32个字符）"
                  value={influencerCode}
                  onChange={(e) => setInfluencerCode(e.target.value)}
                  disabled={applyMutation.isPending}
                  maxLength={32}
                />
                <p className="text-sm text-muted-foreground">
                  这将是您的专属标识，用于生成推广链接和追踪订单
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followerCount">粉丝数量（可选）</Label>
                <Input
                  id="followerCount"
                  type="number"
                  placeholder="请输入您的粉丝数量"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  disabled={applyMutation.isPending}
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  填写您在社交媒体平台的粉丝数量，有助于我们为您匹配合适的活动
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">达人权益</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 参与专属营销活动，赚取高额佣金</li>
                  <li>• 获得专属推广链接，追踪订单转化</li>
                  <li>• 实时查看收益统计和提现记录</li>
                  <li>• 优先获得新品试用和推广机会</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交申请"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
