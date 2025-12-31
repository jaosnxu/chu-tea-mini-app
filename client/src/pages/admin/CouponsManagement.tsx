import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Ticket,
  Gift,
  Percent,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function CouponsManagement() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  // Fetch coupon templates
  const { data: templates, isLoading } = trpc.adminCoupons.listTemplates.useQuery();

  // Mock approval data
  const pendingApprovals = [
    {
      id: 1,
      templateName: "新年满100减20",
      requestedBy: "Marketing Team",
      quantity: 1000,
      reason: "新年促销活动",
      requestedAt: "2025-12-30",
    },
    {
      id: 2,
      templateName: "VIP专属9折券",
      requestedBy: "VIP Manager",
      quantity: 500,
      reason: "VIP会员回馈",
      requestedAt: "2025-12-29",
    },
  ];

  const couponTypeOptions = [
    { value: "discount", label: t("admin.coupons.types.discount"), icon: Percent },
    { value: "fixed", label: t("admin.coupons.types.fixed"), icon: DollarSign },
    { value: "gift", label: t("admin.coupons.types.gift"), icon: Gift },
    { value: "shipping", label: t("admin.coupons.types.shipping"), icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.coupons.title")}</h1>
          <p className="text-gray-500">{t("admin.coupons.subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Ticket className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
                <p className="text-xs text-gray-500">{t("admin.coupons.stats.templates")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12,580</p>
                <p className="text-xs text-gray-500">{t("admin.coupons.stats.issued")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8,234</p>
                <p className="text-xs text-gray-500">{t("admin.coupons.stats.used")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                <p className="text-xs text-gray-500">{t("admin.coupons.stats.pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">{t("admin.coupons.tabs.templates")}</TabsTrigger>
          <TabsTrigger value="issued">{t("admin.coupons.tabs.issued")}</TabsTrigger>
          <TabsTrigger value="approvals">
            {t("admin.coupons.tabs.approvals")}
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">{t("admin.coupons.tabs.rules")}</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.coupons.templatesTitle")}</CardTitle>
                <CardDescription>{t("admin.coupons.templatesDesc")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      {t("admin.coupons.batchSend")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("admin.coupons.batchSend")}</DialogTitle>
                      <DialogDescription>{t("admin.coupons.batchSendDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>{t("admin.coupons.form.selectTemplate")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder={t("admin.coupons.form.selectTemplatePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {templates?.map((tpl: any) => (
                              <SelectItem key={tpl.id} value={tpl.id.toString()}>
                                {tpl.nameZh}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.coupons.form.targetUsers")}</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder={t("admin.coupons.form.selectUsers")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("admin.coupons.targets.all")}</SelectItem>
                            <SelectItem value="new">{t("admin.coupons.targets.new")}</SelectItem>
                            <SelectItem value="vip">{t("admin.coupons.targets.vip")}</SelectItem>
                            <SelectItem value="inactive">{t("admin.coupons.targets.inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.coupons.form.reason")}</Label>
                        <Textarea placeholder={t("admin.coupons.form.reasonPlaceholder")} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button onClick={() => {
                        toast.success(t("admin.coupons.sendSuccess"));
                        setIsSendDialogOpen(false);
                      }}>
                        {t("admin.coupons.send")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("admin.coupons.addTemplate")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("admin.coupons.addTemplate")}</DialogTitle>
                      <DialogDescription>{t("admin.coupons.addTemplateDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                      {/* Basic Info */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.nameZh")}</Label>
                          <Input placeholder="新用户9折券" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.nameRu")}</Label>
                          <Input placeholder="Скидка 10% для новых" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.nameEn")}</Label>
                          <Input placeholder="10% Off for New Users" />
                        </div>
                      </div>

                      {/* Type and Value */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.type")}</Label>
                          <Select defaultValue="discount">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {couponTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <opt.icon className="h-4 w-4" />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.value")}</Label>
                          <Input type="number" placeholder="10" />
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.minAmount")}</Label>
                          <Input type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.maxDiscount")}</Label>
                          <Input type="number" placeholder="100" />
                        </div>
                      </div>

                      {/* Validity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.validFrom")}</Label>
                          <Input type="datetime-local" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.validTo")}</Label>
                          <Input type="datetime-local" />
                        </div>
                      </div>

                      {/* Limits */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.totalLimit")}</Label>
                          <Input type="number" placeholder="1000" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.perUserLimit")}</Label>
                          <Input type="number" placeholder="1" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.coupons.form.dailyLimit")}</Label>
                          <Input type="number" placeholder="100" />
                        </div>
                      </div>

                      {/* Applicable Scope */}
                      <div className="space-y-2">
                        <Label>{t("admin.coupons.form.scope")}</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("admin.coupons.scopes.all")}</SelectItem>
                            <SelectItem value="teabot">{t("admin.coupons.scopes.teabot")}</SelectItem>
                            <SelectItem value="mall">{t("admin.coupons.scopes.mall")}</SelectItem>
                            <SelectItem value="category">{t("admin.coupons.scopes.category")}</SelectItem>
                            <SelectItem value="product">{t("admin.coupons.scopes.product")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button onClick={() => {
                        toast.success(t("admin.coupons.templateAdded"));
                        setIsAddDialogOpen(false);
                      }}>
                        {t("common.save")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.coupons.table.name")}</TableHead>
                    <TableHead>{t("admin.coupons.table.type")}</TableHead>
                    <TableHead>{t("admin.coupons.table.value")}</TableHead>
                    <TableHead>{t("admin.coupons.table.minAmount")}</TableHead>
                    <TableHead>{t("admin.coupons.table.validity")}</TableHead>
                    <TableHead>{t("admin.coupons.table.issued")}</TableHead>
                    <TableHead>{t("admin.coupons.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.coupons.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : templates?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("admin.coupons.noTemplates")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates?.map((tpl: any) => (
                      <TableRow key={tpl.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tpl.nameZh}</p>
                            <p className="text-xs text-gray-500">{tpl.nameRu}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`admin.coupons.types.${tpl.type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tpl.type === "discount" ? `${tpl.discountValue}%` : `₽${tpl.discountValue}`}
                        </TableCell>
                        <TableCell>₽{tpl.minOrderAmount || 0}</TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {tpl.validFrom ? new Date(tpl.validFrom).toLocaleDateString() : "-"} ~{" "}
                            {tpl.validTo ? new Date(tpl.validTo).toLocaleDateString() : "-"}
                          </span>
                        </TableCell>
                        <TableCell>{tpl.issuedCount || 0} / {tpl.totalLimit || "∞"}</TableCell>
                        <TableCell>
                          <Switch checked={tpl.isActive} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.coupons.approvalsTitle")}</CardTitle>
              <CardDescription>{t("admin.coupons.approvalsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.coupons.table.template")}</TableHead>
                    <TableHead>{t("admin.coupons.table.requestedBy")}</TableHead>
                    <TableHead>{t("admin.coupons.table.quantity")}</TableHead>
                    <TableHead>{t("admin.coupons.table.reason")}</TableHead>
                    <TableHead>{t("admin.coupons.table.requestedAt")}</TableHead>
                    <TableHead className="text-right">{t("admin.coupons.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">{approval.templateName}</TableCell>
                      <TableCell>{approval.requestedBy}</TableCell>
                      <TableCell>{approval.quantity.toLocaleString()}</TableCell>
                      <TableCell>{approval.reason}</TableCell>
                      <TableCell>{approval.requestedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => toast.success(t("admin.coupons.approved"))}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("admin.coupons.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => toast.error(t("admin.coupons.rejected"))}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t("admin.coupons.reject")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.coupons.rulesTitle")}</CardTitle>
                <CardDescription>{t("admin.coupons.rulesDesc")}</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.coupons.addRule")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* New User Rule */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t("admin.coupons.rules.newUser")}</h4>
                        <p className="text-sm text-gray-500">{t("admin.coupons.rules.newUserDesc")}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{t("admin.coupons.rules.trigger")}: {t("admin.coupons.triggers.register")}</span>
                      <span>{t("admin.coupons.rules.coupon")}: 新用户9折券</span>
                      <span>{t("admin.coupons.rules.triggered")}: 1,234</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Birthday Rule */}
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t("admin.coupons.rules.birthday")}</h4>
                        <p className="text-sm text-gray-500">{t("admin.coupons.rules.birthdayDesc")}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{t("admin.coupons.rules.trigger")}: {t("admin.coupons.triggers.birthday")}</span>
                      <span>{t("admin.coupons.rules.coupon")}: 生日免费饮品券</span>
                      <span>{t("admin.coupons.rules.triggered")}: 567</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Inactive User Rule */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t("admin.coupons.rules.inactive")}</h4>
                        <p className="text-sm text-gray-500">{t("admin.coupons.rules.inactiveDesc")}</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{t("admin.coupons.rules.trigger")}: {t("admin.coupons.triggers.inactive30")}</span>
                      <span>{t("admin.coupons.rules.coupon")}: 回归专属8折券</span>
                      <span>{t("admin.coupons.rules.triggered")}: 89</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issued Tab */}
        <TabsContent value="issued" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.coupons.issuedTitle")}</CardTitle>
              <CardDescription>{t("admin.coupons.issuedDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder={t("admin.coupons.searchUser")} className="pl-10" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("admin.coupons.status.all")}</SelectItem>
                    <SelectItem value="unused">{t("admin.coupons.status.unused")}</SelectItem>
                    <SelectItem value="used">{t("admin.coupons.status.used")}</SelectItem>
                    <SelectItem value="expired">{t("admin.coupons.status.expired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-center py-8 text-gray-500">{t("admin.coupons.noIssuedCoupons")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
