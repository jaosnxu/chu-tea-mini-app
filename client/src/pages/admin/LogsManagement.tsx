import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  FileText,
  User,
  Package,
  Ticket,
  Settings,
  Shield,
} from "lucide-react";

export default function LogsManagement() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const { data: logs, isLoading, refetch } = trpc.adminLogs.list.useQuery({
    module: moduleFilter === "all" ? undefined : moduleFilter,
    limit: 100,
  });

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "product":
        return <Package className="h-4 w-4" />;
      case "coupon":
        return <Ticket className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "order":
        return <FileText className="h-4 w-4" />;
      case "api":
        return <Settings className="h-4 w-4" />;
      case "permission":
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      product: t("admin.logs.modules.product"),
      coupon: t("admin.logs.modules.coupon"),
      user: t("admin.logs.modules.user"),
      order: t("admin.logs.modules.order"),
      api: t("admin.logs.modules.api"),
      permission: t("admin.logs.modules.permission"),
      store: t("admin.logs.modules.store", "Магазины"),
      marketing: t("admin.logs.modules.marketing", "Маркетинг"),
      ad: t("admin.logs.modules.ad", "Реклама"),
    };
    return labels[module] || module;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: t("admin.logs.actions.create"),
      update: t("admin.logs.actions.update"),
      delete: t("admin.logs.actions.delete"),
      login: t("admin.logs.actions.login", "Вход"),
      logout: t("admin.logs.actions.logout", "Выход"),
      enable: t("admin.logs.actions.enable", "Включить"),
      disable: t("admin.logs.actions.disable", "Выключить"),
      send: t("admin.logs.actions.send", "Отправить"),
      batch_send: t("admin.logs.actions.batchSend", "Массовая отправка"),
    };
    return labels[action] || action;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "login":
      case "logout":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = logs?.filter((log: any) => {
    if (!searchQuery) return true;
    return (
      log.operatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.logs.title")}</h1>
          <p className="text-muted-foreground">{t("admin.logs.subtitle", "Просмотр системных операций")}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("admin.common.refresh")}
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.logs.searchPlaceholder", "Поиск по оператору или описанию...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={moduleFilter}
              onValueChange={setModuleFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择模块" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.common.all")}</SelectItem>
                <SelectItem value="product">{t("admin.logs.modules.product")}</SelectItem>
                <SelectItem value="coupon">{t("admin.logs.modules.coupon")}</SelectItem>
                <SelectItem value="order">{t("admin.logs.modules.order")}</SelectItem>
                <SelectItem value="user">{t("admin.logs.modules.user")}</SelectItem>
                <SelectItem value="store">{t("admin.logs.modules.store", "Магазины")}</SelectItem>
                <SelectItem value="marketing">{t("admin.logs.modules.marketing", "Маркетинг")}</SelectItem>
                <SelectItem value="api">{t("admin.logs.modules.api")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.logs.logList", "Журнал операций")}</CardTitle>
          <CardDescription>{t("admin.logs.totalLogs", { count: filteredLogs?.length || 0, defaultValue: `Всего ${filteredLogs?.length || 0} записей` })}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.logs.time")}</TableHead>
                  <TableHead>{t("admin.logs.operator")}</TableHead>
                  <TableHead>{t("admin.logs.module")}</TableHead>
                  <TableHead>{t("admin.logs.action")}</TableHead>
                  <TableHead>{t("admin.logs.description")}</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.operatorName || t("admin.logs.system", "Система")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getModuleIcon(log.module)}
                        <span>{getModuleLabel(log.module)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.description || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.common.noData")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
