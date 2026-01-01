import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function InfluencerWithdraw() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank_card" | "alipay" | "wechat" | "paypal">("bank_card");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: influencerInfo } = trpc.influencer.getMyInfo.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: withdrawals, isLoading: withdrawalsLoading } = trpc.influencer.getMyWithdrawals.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createWithdrawalMutation = trpc.influencer.createWithdrawal.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      // 刷新提现列表
      trpc.useUtils().influencer.getMyWithdrawals.invalidate();
      trpc.useUtils().influencer.getMyInfo.invalidate();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(err.message || "提现申请失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("请输入有效的提现金额");
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      setError("请填写完整的账户信息");
      return;
    }

    if (withdrawalMethod === "bank_card" && !bankName.trim()) {
      setError("请填写银行名称");
      return;
    }

    createWithdrawalMutation.mutate({
      amount: amountNum,
      withdrawalMethod,
      accountInfo: {
        bankName: withdrawalMethod === "bank_card" ? bankName : undefined,
        accountNumber,
        accountName,
      },
    });
  };

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { label: "待审核", variant: "secondary", icon: Clock },
      processing: { label: "处理中", variant: "default", icon: Clock },
      completed: { label: "已完成", variant: "outline", icon: CheckCircle2 },
      rejected: { label: "已拒绝", variant: "destructive", icon: XCircle },
    };
    const config = statusMap[status] || { label: status, variant: "secondary", icon: Clock };
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">提现管理</h1>
        <p className="text-muted-foreground mt-2">申请提现并查看提现记录</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 提现申请表单 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>申请提现</CardTitle>
              <CardDescription>
                可提现余额：<span className="text-lg font-bold text-green-600">₽{influencerInfo?.availableBalance || "0.00"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">提现申请已提交，请等待审核</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">提现金额 (₽)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="请输入提现金额"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={createWithdrawalMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawalMethod">提现方式</Label>
                  <Select
                    value={withdrawalMethod}
                    onValueChange={(value: any) => setWithdrawalMethod(value)}
                    disabled={createWithdrawalMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_card">银行卡</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="wechat">微信</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {withdrawalMethod === "bank_card" && (
                  <div className="space-y-2">
                    <Label htmlFor="bankName">银行名称</Label>
                    <Input
                      id="bankName"
                      placeholder="请输入银行名称"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      disabled={createWithdrawalMutation.isPending}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">账号</Label>
                  <Input
                    id="accountNumber"
                    placeholder="请输入账号"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={createWithdrawalMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">账户名</Label>
                  <Input
                    id="accountName"
                    placeholder="请输入账户名"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={createWithdrawalMutation.isPending}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createWithdrawalMutation.isPending}
                >
                  {createWithdrawalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      提交申请
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 提现记录列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>提现记录</CardTitle>
              <CardDescription>查看您的所有提现申请</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>暂无提现记录</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-lg">₽{withdrawal.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {withdrawal.withdrawalMethod === "bank_card" && "银行卡"}
                            {withdrawal.withdrawalMethod === "alipay" && "支付宝"}
                            {withdrawal.withdrawalMethod === "wechat" && "微信"}
                            {withdrawal.withdrawalMethod === "paypal" && "PayPal"}
                            {" • "}
                            {withdrawal.accountInfo.accountName}
                          </div>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        申请时间：{new Date(withdrawal.createdAt).toLocaleString()}
                      </div>

                      {withdrawal.reviewNotes && (
                        <Alert className="mt-2" variant={withdrawal.status === "rejected" ? "destructive" : "default"}>
                          <AlertDescription>
                            <strong>备注：</strong>
                            {withdrawal.reviewNotes}
                          </AlertDescription>
                        </Alert>
                      )}

                      {withdrawal.transactionId && (
                        <div className="text-xs text-muted-foreground mt-2">
                          交易ID：{withdrawal.transactionId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
