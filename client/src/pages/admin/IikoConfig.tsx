import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, TestTube2, Check, X } from "lucide-react";

export default function IikoConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.iiko.list.useQuery();
  const { data: stores } = trpc.store.list.useQuery();

  const createMutation = trpc.iiko.create.useMutation({
    onSuccess: () => {
      toast.success("IIKO 配置创建成功");
      utils.iiko.list.invalidate();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.iiko.update.useMutation({
    onSuccess: () => {
      toast.success("IIKO 配置更新成功");
      utils.iiko.list.invalidate();
      setIsDialogOpen(false);
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.iiko.delete.useMutation({
    onSuccess: () => {
      toast.success("IIKO 配置删除成功");
      utils.iiko.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const testConnectionMutation = trpc.iiko.testConnection.useMutation({
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
      configName: formData.get("configName") as string,
      storeId: formData.get("storeId") ? Number(formData.get("storeId")) : null,
      apiUrl: formData.get("apiUrl") as string,
      apiLogin: formData.get("apiLogin") as string,
      organizationId: formData.get("organizationId") as string,
      organizationName: (formData.get("organizationName") as string) || null,
      terminalGroupId: (formData.get("terminalGroupId") as string) || null,
      terminalGroupName: (formData.get("terminalGroupName") as string) || null,
      syncIntervalMinutes: Number(formData.get("syncIntervalMinutes")) || 30,
      autoSyncMenu: formData.get("autoSyncMenu") === "on",
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
    const apiUrl = formData.get("apiUrl") as string;
    const apiLogin = formData.get("apiLogin") as string;

    if (!apiUrl || !apiLogin) {
      toast.error("请先填写 API URL 和 API Login");
      return;
    }

    setTestingConnection(true);
    testConnectionMutation.mutate({ apiUrl, apiLogin });
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个 IIKO 配置吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">IIKO 系统配置</h1>
          <p className="text-muted-foreground mt-2">
            管理 IIKO POS 系统集成配置，支持多门店独立配置
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          添加配置
        </Button>
      </div>

      <div className="grid gap-4">
        {configs?.map((config: any) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{config.configName}</CardTitle>
                  <CardDescription>
                    组织 ID: {config.organizationId}
                    {config.organizationName && ` (${config.organizationName})`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {config.isActive ? '启用' : '禁用'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(config.id)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">API URL:</span>
                  <p className="font-mono">{config.apiUrl}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">API Login:</span>
                  <p className="font-mono">{config.apiLogin}</p>
                </div>
                {config.terminalGroupId && (
                  <div>
                    <span className="text-muted-foreground">终端组 ID:</span>
                    <p className="font-mono">{config.terminalGroupId}</p>
                  </div>
                )}
                {config.terminalGroupName && (
                  <div>
                    <span className="text-muted-foreground">终端组名称:</span>
                    <p>{config.terminalGroupName}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">自动同步菜单:</span>
                  <p>{config.autoSyncMenu ? '是' : '否'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">同步间隔:</span>
                  <p>{config.syncIntervalMinutes} 分钟</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!configs || configs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">还没有配置 IIKO 系统</p>
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                添加第一个配置
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑 IIKO 配置" : "添加 IIKO 配置"}</DialogTitle>
            <DialogDescription>
              配置 IIKO POS 系统的 API 凭证和同步选项
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="configName">配置名称 *</Label>
                <Input
                  id="configName"
                  name="configName"
                  placeholder="例如：莫斯科总店 IIKO"
                  required
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.configName : ""}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="storeId">关联门店</Label>
                <Select name="storeId" defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.storeId?.toString() : ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不关联门店</SelectItem>
                    {stores?.map((store: any) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="apiUrl">API URL *</Label>
                <Input
                  id="apiUrl"
                  name="apiUrl"
                  type="url"
                  placeholder="https://api-ru.iiko.services"
                  required
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.apiUrl : "https://api-ru.iiko.services"}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="apiLogin">API Login *</Label>
                <Input
                  id="apiLogin"
                  name="apiLogin"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  required
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.apiLogin : ""}
                />
              </div>

              <div className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      测试连接中...
                    </>
                  ) : (
                    <>
                      <TestTube2 className="w-4 h-4 mr-2" />
                      测试连接
                    </>
                  )}
                </Button>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="organizationId">组织 ID *</Label>
                <Input
                  id="organizationId"
                  name="organizationId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  required
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.organizationId : ""}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="organizationName">组织名称</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="组织名称（可选）"
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.organizationName || "" : ""}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="terminalGroupId">终端组 ID</Label>
                <Input
                  id="terminalGroupId"
                  name="terminalGroupId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.terminalGroupId || "" : ""}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="terminalGroupName">终端组名称</Label>
                <Input
                  id="terminalGroupName"
                  name="terminalGroupName"
                  placeholder="终端组名称（可选）"
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.terminalGroupName || "" : ""}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="syncIntervalMinutes">同步间隔（分钟）</Label>
                <Input
                  id="syncIntervalMinutes"
                  name="syncIntervalMinutes"
                  type="number"
                  min="5"
                  placeholder="30"
                  defaultValue={editingId ? configs?.find((c: any) => c.id === editingId)?.syncIntervalMinutes || 30 : 30}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between">
                <Label htmlFor="autoSyncMenu">自动同步菜单</Label>
                <Switch
                  id="autoSyncMenu"
                  name="autoSyncMenu"
                  defaultChecked={editingId ? configs?.find((c: any) => c.id === editingId)?.autoSyncMenu : false}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between">
                <Label htmlFor="isActive">启用配置</Label>
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingId ? configs?.find((c: any) => c.id === editingId)?.isActive : true}
                />
              </div>
            </div>

            <DialogFooter>
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
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
