import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InfluencerWithdrawals() {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data: withdrawals, isLoading, refetch } = trpc.influencer.listWithdrawals.useQuery();

  const reviewMutation = trpc.influencer.reviewWithdrawal.useMutation({
    onSuccess: () => {
      setIsReviewDialogOpen(false);
      setReviewNotes("");
      refetch();
    },
  });

  const completeMutation = trpc.influencer.completeWithdrawal.useMutation({
    onSuccess: () => {
      setIsCompleteDialogOpen(false);
      setTransactionId("");
      refetch();
    },
  });

  const handleReview = (approved: boolean) => {
    if (!selectedWithdrawal) return;

    reviewMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      approved,
      notes: reviewNotes || undefined,
    });
  };

  const handleComplete = () => {
    if (!selectedWithdrawal || !transactionId) {
      alert("请填写交易ID");
      return;
    }

    completeMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      transactionId,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "待审核", variant: "secondary" },
      processing: { label: "处理中", variant: "default" },
      completed: { label: "已完成", variant: "outline" },
      rejected: { label: "已拒绝", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">提现审核</h1>
        <p className="text-muted-foreground mt-2">审核和处理达人的提现申请</p>
      </div>

      {!withdrawals || withdrawals.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>暂无提现申请</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>提现申请 #{withdrawal.id}</CardTitle>
                    <CardDescription>
                      用户 ID: {withdrawal.userId} • 申请时间：{" "}
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">提现金额</div>
                      <div className="text-2xl font-bold">₽{withdrawal.amount}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">提现方式</div>
                      <div className="text-lg font-medium">
                        {withdrawal.withdrawalMethod === "bank_card" && "银行卡"}
                        {withdrawal.withdrawalMethod === "alipay" && "支付宝"}
                        {withdrawal.withdrawalMethod === "wechat" && "微信"}
                        {withdrawal.withdrawalMethod === "paypal" && "PayPal"}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg col-span-2">
                      <div className="text-sm text-muted-foreground">账户信息</div>
                      <div className="text-sm">
                        {withdrawal.accountInfo.bankName && `${withdrawal.accountInfo.bankName} • `}
                        {withdrawal.accountInfo.accountName} • {withdrawal.accountInfo.accountNumber}
                      </div>
                    </div>
                  </div>

                  {withdrawal.reviewNotes && (
                    <Alert>
                      <AlertDescription>
                        <strong>备注：</strong>
                        {withdrawal.reviewNotes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {withdrawal.transactionId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">交易ID：</span>
                      {withdrawal.transactionId}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {withdrawal.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          审核
                        </Button>
                      </>
                    )}

                    {withdrawal.status === "processing" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setIsCompleteDialogOpen(true);
                        }}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        完成打款
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 审核对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核提现申请</DialogTitle>
            <DialogDescription>
              提现金额：₽{selectedWithdrawal?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">审核备注（可选）</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="填写审核意见..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleReview(true)}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                通过
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleReview(false)}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                拒绝
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 完成打款对话框 */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完成打款</DialogTitle>
            <DialogDescription>
              提现金额：₽{selectedWithdrawal?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">交易ID *</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="请输入交易ID"
              />
            </div>

            <Button
              onClick={handleComplete}
              className="w-full"
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认完成"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
