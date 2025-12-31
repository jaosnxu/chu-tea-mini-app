import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Send, Settings, Check, Filter, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import AdminLayout from '@/components/AdminLayout';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-600',
  sent: 'bg-blue-100 text-blue-600',
  delivered: 'bg-green-100 text-green-600',
  failed: 'bg-red-100 text-red-600',
  read: 'bg-gray-100 text-gray-600',
};

export default function NotificationsManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('history');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testContent, setTestContent] = useState('');
  const [testChannel, setTestChannel] = useState<'system' | 'telegram'>('system');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 获取通知历史
  const { data: notifications = [], isLoading, refetch } = trpc.adminNotifications.list.useQuery({
    channel: filterChannel !== 'all' ? filterChannel as any : undefined,
    status: filterStatus !== 'all' ? filterStatus as any : undefined,
    limit: 50,
  });

  // 获取 Telegram 绑定状态
  const { data: telegramBinding } = trpc.adminNotifications.getTelegramBinding.useQuery();

  // 发送测试通知
  const sendTestMutation = trpc.adminNotifications.sendTest.useMutation({
    onSuccess: () => {
      setIsTestDialogOpen(false);
      setTestTitle('');
      setTestContent('');
      refetch();
    },
  });

  // 更新通知设置
  const updateSettingsMutation = trpc.adminNotifications.updateSettings.useMutation();

  // 绑定 Telegram
  const bindTelegramMutation = trpc.adminNotifications.bindTelegram.useMutation({
    onSuccess: () => {
      refetchTelegramBinding();
    },
  });

  // 验证 Telegram
  const verifyTelegramMutation = trpc.adminNotifications.verifyTelegram.useMutation({
    onSuccess: () => {
      setVerificationCode('');
      refetchTelegramBinding();
    },
  });

  const { refetch: refetchTelegramBinding } = trpc.adminNotifications.getTelegramBinding.useQuery();

  const handleBindTelegram = () => {
    if (!telegramChatId) return;
    bindTelegramMutation.mutate({
      telegramChatId,
      telegramUsername: telegramUsername || undefined,
    });
  };

  const handleVerifyTelegram = () => {
    if (!verificationCode) return;
    verifyTelegramMutation.mutate({ code: verificationCode });
  };

  const handleSendTest = () => {
    if (!testTitle || !testContent) return;
    sendTestMutation.mutate({
      channel: testChannel,
      title: testTitle,
      content: testContent,
    });
  };

  const handleToggleSetting = (setting: string, value: boolean) => {
    updateSettingsMutation.mutate({ [setting]: value });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.notifications.management')}</h1>
            <p className="text-gray-500">{t('admin.notifications.managementDesc')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  {t('admin.notifications.sendTest')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin.notifications.sendTest')}</DialogTitle>
                  <DialogDescription>
                    {t('admin.notifications.sendTestDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.channel')}</Label>
                    <Select value={testChannel} onValueChange={(v) => setTestChannel(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">{t('admin.notifications.channels.system')}</SelectItem>
                        <SelectItem value="telegram">{t('admin.notifications.channels.telegram')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.titleLabel')}</Label>
                    <Input 
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      placeholder={t('admin.notifications.titlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.content')}</Label>
                    <Textarea 
                      value={testContent}
                      onChange={(e) => setTestContent(e.target.value)}
                      placeholder={t('admin.notifications.contentPlaceholder')}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSendTest} disabled={sendTestMutation.isPending}>
                    {sendTestMutation.isPending ? t('common.sending') : t('common.send')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="history">
              <Bell className="h-4 w-4 mr-2" />
              {t('admin.notifications.history')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              {t('admin.notifications.settings')}
            </TabsTrigger>
            <TabsTrigger value="telegram">
              <MessageSquare className="h-4 w-4 mr-2" />
              Telegram
            </TabsTrigger>
          </TabsList>

          {/* 通知历史 */}
          <TabsContent value="history" className="space-y-4">
            {/* 筛选器 */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.channel')}</Label>
                    <Select value={filterChannel} onValueChange={setFilterChannel}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="system">{t('admin.notifications.channels.system')}</SelectItem>
                        <SelectItem value="telegram">{t('admin.notifications.channels.telegram')}</SelectItem>
                        <SelectItem value="email">{t('admin.notifications.channels.email')}</SelectItem>
                        <SelectItem value="sms">{t('admin.notifications.channels.sms')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.status')}</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="pending">{t('admin.notifications.statuses.pending')}</SelectItem>
                        <SelectItem value="sent">{t('admin.notifications.statuses.sent')}</SelectItem>
                        <SelectItem value="delivered">{t('admin.notifications.statuses.delivered')}</SelectItem>
                        <SelectItem value="failed">{t('admin.notifications.statuses.failed')}</SelectItem>
                        <SelectItem value="read">{t('admin.notifications.statuses.read')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 通知列表 */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.notifications.titleLabel')}</TableHead>
                    <TableHead>{t('admin.notifications.channel')}</TableHead>
                    <TableHead>{t('admin.notifications.priority.label')}</TableHead>
                    <TableHead>{t('admin.notifications.status')}</TableHead>
                    <TableHead>{t('admin.notifications.createdAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                        {t('admin.notifications.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification: any) => {
                      const title = getLocalizedText({
                        zh: notification.titleZh,
                        ru: notification.titleRu,
                        en: notification.titleEn,
                      });
                      return (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-[300px]">
                                {getLocalizedText({
                                  zh: notification.contentZh,
                                  ru: notification.contentRu,
                                  en: notification.contentEn,
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t(`admin.notifications.channels.${notification.channel}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[notification.priority]}>
                              {t(`admin.notifications.priority.${notification.priority}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[notification.status]}>
                              {t(`admin.notifications.statuses.${notification.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(notification.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* 通知设置 */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.notifications.notifySettings')}</CardTitle>
                <CardDescription>{t('admin.notifications.notifySettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('admin.notifications.notifyNewOrder')}</p>
                    <p className="text-sm text-gray-500">{t('admin.notifications.notifyNewOrderDesc')}</p>
                  </div>
                  <Switch 
                    checked={telegramBinding?.notifyNewOrder ?? true}
                    onCheckedChange={(v) => handleToggleSetting('notifyNewOrder', v)}
                    disabled={!telegramBinding}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('admin.notifications.notifyPaymentFailed')}</p>
                    <p className="text-sm text-gray-500">{t('admin.notifications.notifyPaymentFailedDesc')}</p>
                  </div>
                  <Switch 
                    checked={telegramBinding?.notifyPaymentFailed ?? true}
                    onCheckedChange={(v) => handleToggleSetting('notifyPaymentFailed', v)}
                    disabled={!telegramBinding}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('admin.notifications.notifyLowStock')}</p>
                    <p className="text-sm text-gray-500">{t('admin.notifications.notifyLowStockDesc')}</p>
                  </div>
                  <Switch 
                    checked={telegramBinding?.notifyLowStock ?? true}
                    onCheckedChange={(v) => handleToggleSetting('notifyLowStock', v)}
                    disabled={!telegramBinding}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('admin.notifications.notifySystemAlert')}</p>
                    <p className="text-sm text-gray-500">{t('admin.notifications.notifySystemAlertDesc')}</p>
                  </div>
                  <Switch 
                    checked={telegramBinding?.notifySystemAlert ?? true}
                    onCheckedChange={(v) => handleToggleSetting('notifySystemAlert', v)}
                    disabled={!telegramBinding}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Telegram 绑定 */}
          <TabsContent value="telegram" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.notifications.telegramBinding')}</CardTitle>
                <CardDescription>{t('admin.notifications.telegramBindingDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {telegramBinding?.isVerified ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span>{t('admin.notifications.telegramConnected')}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Chat ID:</strong> {telegramBinding.telegramChatId}</p>
                      {telegramBinding.telegramUsername && (
                        <p><strong>Username:</strong> @{telegramBinding.telegramUsername}</p>
                      )}
                      <p><strong>{t('admin.notifications.verifiedAt')}:</strong> {formatDate(telegramBinding.verifiedAt!)}</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setTelegramChatId('');
                      setTelegramUsername('');
                    }}>
                      {t('admin.notifications.rebind')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-yellow-800">{t('admin.notifications.telegramNotConnected')}</p>
                    </div>
                    
                    {/* 绑定步骤 */}
                    <div className="space-y-2">
                      <p className="font-medium">{t('admin.notifications.howToConnect')}</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>{t('admin.notifications.step1')}</li>
                        <li>{t('admin.notifications.step2')}</li>
                        <li>{t('admin.notifications.step3')}</li>
                      </ol>
                    </div>

                    {/* 绑定表单 */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Chat ID *</Label>
                        <Input
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder={t('admin.notifications.chatIdPlaceholder')}
                        />
                        <p className="text-xs text-gray-500">{t('admin.notifications.chatIdHint')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Username ({t('common.optional')})</Label>
                        <Input
                          value={telegramUsername}
                          onChange={(e) => setTelegramUsername(e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                      <Button 
                        onClick={handleBindTelegram}
                        disabled={!telegramChatId || bindTelegramMutation.isPending}
                      >
                        {bindTelegramMutation.isPending ? t('common.loading') : t('admin.notifications.startBinding')}
                      </Button>
                    </div>

                    {/* 验证码 */}
                    {telegramBinding?.verificationCode && !telegramBinding.isVerified && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <p className="text-sm text-blue-800 mb-2">{t('admin.notifications.verificationCode')}:</p>
                          <p className="font-mono text-2xl font-bold text-blue-600">{telegramBinding.verificationCode}</p>
                          <p className="text-xs text-blue-600 mt-2">{t('admin.notifications.sendCodeToBot')}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('admin.notifications.enterCode')}</Label>
                          <div className="flex gap-2">
                            <Input
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                              placeholder="ABC123"
                              maxLength={6}
                              className="font-mono"
                            />
                            <Button 
                              onClick={handleVerifyTelegram}
                              disabled={!verificationCode || verifyTelegramMutation.isPending}
                            >
                              {verifyTelegramMutation.isPending ? t('common.loading') : t('admin.notifications.verify')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bot 信息 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.notifications.botInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Bot:</strong> @CHUTeaBot</p>
                  <p><strong>Webhook URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">/api/telegram/webhook</code></p>
                  <p className="text-gray-500">{t('admin.notifications.botInfoDesc')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
