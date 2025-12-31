import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

export function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // 获取未读通知数量
  const { data: unreadData } = trpc.adminNotifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 获取最近通知
  const { data: notifications = [], refetch } = trpc.adminNotifications.myNotifications.useQuery({
    limit: 10,
  });

  // 标记单个通知为已读
  const markAsReadMutation = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  // 标记所有通知为已读
  const markAllAsReadMutation = trpc.adminNotifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const unreadCount = unreadData || 0;

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('admin.notifications.justNow');
    if (minutes < 60) return t('admin.notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('admin.notifications.hoursAgo', { count: hours });
    if (days < 7) return t('admin.notifications.daysAgo', { count: days });
    return d.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{t('admin.notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              {t('admin.notifications.markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Bell className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">{t('admin.notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => {
                const title = getLocalizedText({
                  zh: notification.titleZh,
                  ru: notification.titleRu,
                  en: notification.titleEn,
                });
                const content = getLocalizedText({
                  zh: notification.contentZh,
                  ru: notification.contentRu,
                  en: notification.contentEn,
                });
                const isRead = notification.status === 'read';

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${priorityColors[notification.priority]}`}>
                            {t(`admin.notifications.priority.${notification.priority}`)}
                          </Badge>
                          {!isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            className="w-full text-sm"
            onClick={() => {
              setIsOpen(false);
              window.location.href = '/admin/notifications';
            }}
          >
            {t('admin.notifications.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
