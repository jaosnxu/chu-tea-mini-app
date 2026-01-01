import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InfluencerCampaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  const { data: campaigns, isLoading, refetch } = trpc.influencer.listCampaigns.useQuery();

  const createCampaignMutation = trpc.influencer.createCampaign.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      refetch();
      // 重置表单
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setCommissionValue("");
      setMinOrder("");
    },
  });

  const deleteCampaignMutation = trpc.influencer.deleteCampaign.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateCampaign = () => {
    if (!name || !startDate || !endDate || !commissionValue) {
      alert("请填写所有必填字段");
      return;
    }

    createCampaignMutation.mutate({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      commissionConfig: {
        type: commissionType,
        value: parseFloat(commissionValue),
        minOrder: minOrder ? parseFloat(minOrder) : undefined,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "草稿", variant: "secondary" },
      active: { label: "进行中", variant: "default" },
      paused: { label: "已暂停", variant: "outline" },
      ended: { label: "已结束", variant: "destructive" },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">达人活动管理</h1>
          <p className="text-muted-foreground mt-2">创建和管理达人营销活动</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建活动
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建达人活动</DialogTitle>
              <DialogDescription>填写活动信息并设置佣金规则</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">活动名称 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入活动名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">活动描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入活动描述"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">开始时间 *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">结束时间 *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionType">佣金类型 *</Label>
                <Select value={commissionType} onValueChange={(value: any) => setCommissionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">百分比</SelectItem>
                    <SelectItem value="fixed">固定金额</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionValue">
                    {commissionType === "percentage" ? "佣金比例 (%) *" : "佣金金额 (₽) *"}
                  </Label>
                  <Input
                    id="commissionValue"
                    type="number"
                    step="0.01"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    placeholder={commissionType === "percentage" ? "例如：10" : "例如：50"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrder">最低订单金额 (₽)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    step="0.01"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="可选"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateCampaign}
                className="w-full"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "创建活动"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>暂无活动，点击"创建活动"开始</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription className="mt-2">{campaign.description}</CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">参与人数</div>
                      <div className="text-2xl font-bold">{campaign.totalParticipants}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">总订单数</div>
                      <div className="text-2xl font-bold">{campaign.totalOrders}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">总销售额</div>
                      <div className="text-2xl font-bold">₽{campaign.totalRevenue}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">总佣金</div>
                      <div className="text-2xl font-bold">₽{campaign.totalCommission}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">活动时间：</span>
                      {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">佣金配置：</span>
                      {campaign.commissionConfig.type === "percentage"
                        ? `${campaign.commissionConfig.value}%`
                        : `₽${campaign.commissionConfig.value}`}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("确定要删除这个活动吗？")) {
                          deleteCampaignMutation.mutate({ id: campaign.id });
                        }
                      }}
                      disabled={deleteCampaignMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
