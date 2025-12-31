import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import TelegramBotGuide from "@/components/TelegramBotGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Settings,
  CreditCard,
  Truck,
  Server,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ApiConfigManagement() {
  const { t, i18n } = useTranslation();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  const utils = trpc.useUtils();

  const { data: configs, isLoading } = trpc.adminApiConfig.list.useQuery();

  const updateMutation = trpc.adminApiConfig.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminApiConfig.list.invalidate();
      setEditingConfig(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const testMutation = trpc.adminApiConfig.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("admin.api.connectionSuccess", "Подключение успешно"));
      } else {
        toast.error(result.error || t("admin.api.connectionFailed", "Ошибка подключения"));
      }
      utils.adminApiConfig.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment":
        return <CreditCard className="h-5 w-5" />;
      case "logistics":
        return <Truck className="h-5 w-5" />;
      case "pos":
        return <Server className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      payment: t("admin.api.payment"),
      logistics: t("admin.api.logistics"),
      pos: t("admin.api.iiko"),
      notification: t("admin.api.notification", "Уведомления"),
      other: t("admin.api.other", "Прочее"),
    };
    return labels[category] || category;
  };

  const getConfigName = (config: any) => {
    if (i18n.language === 'zh') return config.nameZh;
    if (i18n.language === 'ru') return config.nameRu;
    return config.nameEn;
  };

  const toggleShowSecret = (id: number) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const groupedConfigs = configs?.reduce((acc: Record<string, any[]>, config: any) => {
    const category = config.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(config);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.api.title")}</h1>
          <p className="text-muted-foreground">{t("admin.api.subtitle", "Настройка API (IIKO, оплата, логистика)")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowTelegramGuide(true)}
        >
          {t("admin.telegram.guide.howToCreate", "Как создать Telegram Bot")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="pos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pos">{t("admin.api.iiko")}</TabsTrigger>
            <TabsTrigger value="payment">{t("admin.api.payment")}</TabsTrigger>
            <TabsTrigger value="logistics">{t("admin.api.logistics")}</TabsTrigger>
            <TabsTrigger value="notification">{t("admin.api.notification", "Уведомления")}</TabsTrigger>
          </TabsList>

          {["pos", "payment", "logistics", "notification"].map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {groupedConfigs[category]?.length > 0 ? (
                groupedConfigs[category].map((config: any) => (
                  <Card key={config.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getCategoryIcon(config.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{getConfigName(config)}</CardTitle>
                          <CardDescription>{config.provider}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />{t("admin.api.connected")}</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />{t("admin.api.disconnected")}</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {config.config && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(config.config).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-muted-foreground">{key}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">
                                  {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                                    ? (showSecrets[config.id] ? String(value) : '••••••••')
                                    : String(value)}
                                </span>
                                {(key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleShowSecret(config.id)}
                                  >
                                    {showSecrets[config.id] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {config.lastTestAt && (
                            <span>
                              {t("admin.api.lastTest")}: {new Date(config.lastTestAt).toLocaleString("zh-CN")}
                              {config.lastTestResult && (
                                <Badge variant={config.lastTestResult === "success" ? "default" : "destructive"} className="ml-2">
                                  {config.lastTestResult === "success" ? t("admin.api.success", "Успешно") : t("admin.api.failed", "Ошибка")}
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testMutation.mutate({ id: config.id })}
                            disabled={testMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${testMutation.isPending ? 'animate-spin' : ''}`} />
                            {t("admin.api.testConnection")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingConfig(config)}
                          >
                            {t("admin.api.configure", "Настроить")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("admin.api.noConfig", { category: getCategoryLabel(category), defaultValue: `Нет настроек ${getCategoryLabel(category)}` })}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Telegram Bot 指南 */}
      <TelegramBotGuide open={showTelegramGuide} onOpenChange={setShowTelegramGuide} />

      {/* 编辑对话框 */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.api.configure", "Настроить")} {editingConfig?.provider}</DialogTitle>
            <DialogDescription>{t("admin.api.updateConfig", "Обновить настройки API")}</DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <ApiConfigForm
              config={editingConfig}
              onSubmit={(data) => updateMutation.mutate({ id: editingConfig.id, ...data })}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ApiConfigFormProps {
  config: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function ApiConfigForm({ config, onSubmit, isLoading, onCancel }: ApiConfigFormProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    apiKey: "",
    apiSecret: "",
    endpoint: config.config?.endpoint || "",
    isEnabled: config.isActive,
    settings: JSON.stringify(config.config || {}, null, 2),
  });
  const [botToken, setBotToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(config.config?.webhookUrl || "");
  
  const isTelegramConfig = config.provider === 'telegram';

  const setWebhookMutation = trpc.adminApiConfig.setWebhook.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("admin.telegram.webhookSet", "Webhook установлен успешно"));
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTelegramConfig && botToken) {
      // Telegram 配置：保存 Bot Token 并自动设置 Webhook
      const currentUrl = window.location.origin;
      const webhookUrl = `${currentUrl}/api/telegram/webhook`;
      
      onSubmit({
        apiKey: botToken,
        endpoint: webhookUrl,
        isEnabled: formData.isEnabled,
        settings: JSON.stringify({ webhookUrl }, null, 2),
      });
      
      // 自动设置 Webhook
      if (formData.isEnabled) {
        setWebhookMutation.mutate({ webhookUrl });
      }
    } else {
      onSubmit({
        ...formData,
        isEnabled: formData.isEnabled,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTelegramConfig ? (
        // Telegram 特殊配置表单
        <>
          <div className="space-y-2">
            <Label>{t("admin.telegram.botToken", "Bot Token")}</Label>
            <Input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={t("admin.telegram.botTokenPlaceholder", "从 @BotFather 获取的 Bot Token")}
            />
            <p className="text-sm text-muted-foreground">
              {t("admin.telegram.botTokenHint", "格式：123456789:ABCdefGHIjklMNOpqrsTUVwxyz")}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>{t("admin.telegram.webhookUrl", "Webhook URL")}</Label>
            <Input
              value={`${window.location.origin}/api/telegram/webhook`}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              {t("admin.telegram.webhookHint", "保存后将自动配置此 Webhook")}
            </p>
          </div>
        </>
      ) : (
        // 通用 API 配置表单
        <>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="输入新的 API Key（留空则不更新）"
            />
          </div>

          <div className="space-y-2">
            <Label>API Secret</Label>
            <Input
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              placeholder="输入新的 API Secret（留空则不更新）"
            />
          </div>

          <div className="space-y-2">
            <Label>API Endpoint</Label>
            <Input
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isEnabled}
          onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
        />
        <Label>启用此 API</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("admin.common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("admin.common.loading") : t("admin.common.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
