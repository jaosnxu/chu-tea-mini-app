import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast as showToast } from "sonner";

export default function InfluencerTaskSubmit() {
  const [, params] = useRoute("/influencer/tasks/:id/submit");
  const [, setLocation] = useLocation();

  const taskId = params?.id ? parseInt(params.id) : null;

  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tasks, isLoading } = trpc.influencer.getMyTasks.useQuery();
  const submitTaskMutation = trpc.influencer.submitTask.useMutation();

  const task = tasks?.find((t) => t.id === taskId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskId) return;

    if (!contentUrl.trim()) {
      showToast.error("请输入作品链接");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitTaskMutation.mutateAsync({
        taskId,
        content: contentUrl.trim(),
      });

      showToast.success("您的作品已提交，等待审核");

      setLocation("/influencer/tasks");
    } catch (error: any) {
      showToast.error(error.message || "提交作品时出错");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container max-w-2xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>任务不存在或您没有权限访问此任务</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/influencer/tasks")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回任务列表
        </Button>
      </div>
    );
  }

  if (task.status !== "in_progress") {
    return (
      <div className="container max-w-2xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            此任务当前状态为 {task.status}，无法提交作品
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/influencer/tasks")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回任务列表
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/influencer/tasks")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回任务列表
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            提交任务作品
          </CardTitle>
          <CardDescription>
            活动 ID: {task.campaignId} • 任务 ID: {task.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contentUrl">作品链接 *</Label>
              <Input
                id="contentUrl"
                type="url"
                placeholder="https://example.com/your-content"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                请输入您发布的推广内容的链接（例如：社交媒体帖子、视频、文章等）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">作品描述（可选）</Label>
              <Textarea
                id="description"
                placeholder="简要描述您的推广内容和创意亮点..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                提交后，管理员将审核您的作品。审核通过后，您将开始获得佣金收益。
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    提交作品
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/influencer/tasks")}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
