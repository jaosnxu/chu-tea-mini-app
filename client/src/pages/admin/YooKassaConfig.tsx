import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, TestTube2, Check, X, CreditCard } from "lucide-react";

export default function YooKassaConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.yookassa.list.useQuery();

  const createMutation = trpc.yookassa.create.useMutation({
    onSuccess: () => {
      toast.success("YooKassa 配置创建成功");
      utils.yookassa.list.invalidate();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.yookassa.update.useMutation({
    onSuccess: () => {
      toast.success("YooKassa 配置更新成功");
      utils.yookassa.list.invalidate();
      setIsDialogOpen(false);
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.yookassa.delete.useMutation({
    onSuccess: () => {
      toast.success("YooKassa 配置删除成功");
      utils.yookassa.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const testConnectionMutation = trpc.yookassa.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      setTestingConnection(false);
    },
    onError: (error: any) => {
      toast.error(`测试失败: ${error.message}`);
      setTestingConnection(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      shopId: formData.get("shopId") as string,
      secretKey: formData.get("secretKey") as string,
      isActive: formData.get("isActive") === "on",
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTestConnection = () => {
    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const shopId = formData.get("shopId") as string;
    const secretKey = formData.get("secretKey") as string;

    if (!shopId || !secretKey) {
      toast.error("请填写 Shop ID 和 Secret Key");
      return;
    }

    setTestingConnection(true);
    testConnectionMutation.mutate({ shopId, secretKey });
  };

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此配置吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setIsDialogOpen(false);
    setTimeout(() => setIsDialogOpen(true), 0);
  };

  const editingConfig = editingId ? configs?.find((c: any) => c.id === editingId) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">YooKassa 支付配置</h1>
          <p className="text-gray-500 mt-1">管理 YooKassa 支付网关配置</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          添加配置
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : configs && configs.length > 0 ? (
        <div className="grid gap-4">
          {configs.map((config: any) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <div>
                      <CardTitle>Shop ID: {config.shopId}</CardTitle>
                      <CardDescription>
                        创建时间: {new Date(config.createdAt).toLocaleString('zh-CN')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isActive ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        已启用
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <X className="w-4 h-4" />
                        已禁用
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Secret Key: {config.secretKey.substring(0, 20)}...</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无 YooKassa 配置</p>
            <p className="text-sm mt-2">点击右上角"添加配置"按钮创建新配置</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑 YooKassa 配置" : "添加 YooKassa 配置"}</DialogTitle>
            <DialogDescription>
              配置 YooKassa 支付网关，获取 Shop ID 和 Secret Key 请访问{" "}
              <a href="https://yookassa.ru" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                yookassa.ru
              </a>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shopId">Shop ID *</Label>
              <Input
                id="shopId"
                name="shopId"
                placeholder="例如: 123456"
                defaultValue={editingConfig?.shopId || ""}
                required
              />
              <p className="text-sm text-gray-500 mt-1">在 YooKassa 控制台中找到您的 Shop ID</p>
            </div>

            <div>
              <Label htmlFor="secretKey">Secret Key *</Label>
              <Input
                id="secretKey"
                name="secretKey"
                type="password"
                placeholder="例如: live_..."
                defaultValue={editingConfig?.secretKey || ""}
                required
              />
              <p className="text-sm text-gray-500 mt-1">在 YooKassa 控制台中生成 Secret Key</p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isActive">启用此配置</Label>
                <p className="text-sm text-gray-500">启用后将使用此配置处理支付</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={editingConfig?.isActive ?? true}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <TestTube2 className="w-4 h-4 mr-2" />
                    测试连接
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
