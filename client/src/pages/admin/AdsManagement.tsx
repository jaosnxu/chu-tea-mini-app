import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  Plus,
  Edit,
  Trash2,
  Image,
  Video,
  Eye,
  MousePointer,
  ArrowUpDown,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface AdMaterial {
  id: number;
  slotId: number;
  type: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  linkType: "none" | "product" | "category" | "page" | "external";
  linkValue?: string;
  titleZh?: string;
  titleRu?: string;
  titleEn?: string;
  sortOrder: number;
  isActive: boolean;
  clicks: number;
  views: number;
}

interface HomeEntry {
  id: number;
  position: "left" | "right";
  entryType: "order" | "mall" | "coupons" | "points" | "member" | "custom";
  nameZh?: string;
  nameRu?: string;
  nameEn?: string;
  iconUrl?: string;
  linkPath?: string;
  bgColor?: string;
  isActive: boolean;
}

export default function AdsManagement() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("home_top");

  // Mock data
  const [adMaterials, setAdMaterials] = useState<AdMaterial[]>([
    {
      id: 1,
      slotId: 1,
      type: "image",
      mediaUrl: "/products/milk-tea.png",
      linkType: "category",
      linkValue: "1",
      titleZh: "招牌奶茶",
      titleRu: "Фирменный молочный чай",
      titleEn: "Signature Milk Tea",
      sortOrder: 1,
      isActive: true,
      clicks: 1250,
      views: 8500,
    },
    {
      id: 2,
      slotId: 1,
      type: "image",
      mediaUrl: "/products/fruit-tea.png",
      linkType: "category",
      linkValue: "2",
      titleZh: "鲜果茶",
      titleRu: "Фруктовый чай",
      titleEn: "Fresh Fruit Tea",
      sortOrder: 2,
      isActive: true,
      clicks: 980,
      views: 7200,
    },
  ]);

  const [homeEntries, setHomeEntries] = useState<HomeEntry[]>([
    {
      id: 1,
      position: "left",
      entryType: "order",
      nameZh: "点餐",
      nameRu: "Заказать",
      nameEn: "Order",
      bgColor: "#FCD34D",
      isActive: true,
    },
    {
      id: 2,
      position: "right",
      entryType: "mall",
      nameZh: "商城",
      nameRu: "Магазин",
      nameEn: "Mall",
      bgColor: "#34D399",
      isActive: true,
    },
  ]);

  const handleToggleActive = (id: number, type: "ad" | "entry") => {
    if (type === "ad") {
      setAdMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
      );
    } else {
      setHomeEntries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
      );
    }
    toast.success(t("admin.ads.statusUpdated"));
  };

  const handleDeleteAd = (id: number) => {
    setAdMaterials((prev) => prev.filter((item) => item.id !== id));
    toast.success(t("admin.ads.deleted"));
  };

  const slotOptions = [
    { value: "home_top", label: t("admin.ads.slots.homeTop") },
    { value: "home_bottom", label: t("admin.ads.slots.homeBottom") },
    { value: "menu_banner", label: t("admin.ads.slots.menuBanner") },
    { value: "mall_banner", label: t("admin.ads.slots.mallBanner") },
    { value: "popup", label: t("admin.ads.slots.popup") },
  ];

  const entryTypeOptions = [
    { value: "order", label: t("admin.ads.entryTypes.order") },
    { value: "mall", label: t("admin.ads.entryTypes.mall") },
    { value: "coupons", label: t("admin.ads.entryTypes.coupons") },
    { value: "points", label: t("admin.ads.entryTypes.points") },
    { value: "member", label: t("admin.ads.entryTypes.member") },
    { value: "custom", label: t("admin.ads.entryTypes.custom") },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.ads.title")}</h1>
          <p className="text-gray-500">{t("admin.ads.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="carousel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carousel">{t("admin.ads.tabs.carousel")}</TabsTrigger>
          <TabsTrigger value="entries">{t("admin.ads.tabs.entries")}</TabsTrigger>
        </TabsList>

        {/* Carousel Ads Tab */}
        <TabsContent value="carousel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.ads.carouselTitle")}</CardTitle>
                <CardDescription>{t("admin.ads.carouselDesc")}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slotOptions.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("admin.ads.addMaterial")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("admin.ads.addMaterial")}</DialogTitle>
                      <DialogDescription>{t("admin.ads.addMaterialDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.type")}</Label>
                          <Select defaultValue="image">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">
                                <div className="flex items-center gap-2">
                                  <Image className="h-4 w-4" />
                                  {t("admin.ads.form.image")}
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  {t("admin.ads.form.video")}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.slot")}</Label>
                          <Select defaultValue={selectedSlot}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {slotOptions.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.ads.form.media")}</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">{t("admin.ads.form.uploadHint")}</p>
                          <Button variant="outline" className="mt-2">
                            {t("admin.ads.form.selectFile")}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.titleZh")}</Label>
                          <Input placeholder="中文标题" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.titleRu")}</Label>
                          <Input placeholder="Заголовок на русском" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.titleEn")}</Label>
                          <Input placeholder="English Title" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.linkType")}</Label>
                          <Select defaultValue="none">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t("admin.ads.linkTypes.none")}</SelectItem>
                              <SelectItem value="product">{t("admin.ads.linkTypes.product")}</SelectItem>
                              <SelectItem value="category">{t("admin.ads.linkTypes.category")}</SelectItem>
                              <SelectItem value="page">{t("admin.ads.linkTypes.page")}</SelectItem>
                              <SelectItem value="external">{t("admin.ads.linkTypes.external")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.linkValue")}</Label>
                          <Input placeholder={t("admin.ads.form.linkValuePlaceholder")} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.startAt")}</Label>
                          <Input type="datetime-local" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.endAt")}</Label>
                          <Input type="datetime-local" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button onClick={() => {
                        toast.success(t("admin.ads.added"));
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
                    <TableHead className="w-20">{t("admin.ads.table.preview")}</TableHead>
                    <TableHead>{t("admin.ads.table.title")}</TableHead>
                    <TableHead>{t("admin.ads.table.type")}</TableHead>
                    <TableHead>{t("admin.ads.table.link")}</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" />
                        {t("admin.ads.table.views")}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MousePointer className="h-4 w-4" />
                        {t("admin.ads.table.clicks")}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <ArrowUpDown className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead>{t("admin.ads.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.ads.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adMaterials.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={ad.mediaUrl}
                            alt={ad.titleEn || ""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ad.titleZh}</p>
                          <p className="text-xs text-gray-500">{ad.titleRu}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {ad.type === "image" ? (
                            <Image className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          {ad.type === "image" ? t("admin.ads.form.image") : t("admin.ads.form.video")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {ad.linkType === "none"
                            ? "-"
                            : `${t(`admin.ads.linkTypes.${ad.linkType}`)}: ${ad.linkValue}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{ad.views.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{ad.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{ad.sortOrder}</TableCell>
                      <TableCell>
                        <Switch
                          checked={ad.isActive}
                          onCheckedChange={() => handleToggleActive(ad.id, "ad")}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAd(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

        {/* Home Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ads.entriesTitle")}</CardTitle>
              <CardDescription>{t("admin.ads.entriesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {homeEntries.map((entry) => (
                  <Card key={entry.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">
                          {entry.position === "left"
                            ? t("admin.ads.position.left")
                            : t("admin.ads.position.right")}
                        </span>
                        <Switch
                          checked={entry.isActive}
                          onCheckedChange={() => handleToggleActive(entry.id, "entry")}
                        />
                      </div>

                      <div
                        className="w-full h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: entry.bgColor }}
                      >
                        {entry.nameZh}
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.entryType")}</Label>
                          <Select defaultValue={entry.entryType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {entryTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t("admin.ads.form.bgColor")}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              defaultValue={entry.bgColor}
                              className="w-12 h-10 p-1"
                            />
                            <Input defaultValue={entry.bgColor} className="flex-1" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{t("admin.ads.form.titleZh")}</Label>
                            <Input defaultValue={entry.nameZh} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("admin.ads.form.titleRu")}</Label>
                            <Input defaultValue={entry.nameRu} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("admin.ads.form.titleEn")}</Label>
                            <Input defaultValue={entry.nameEn} className="text-sm" />
                          </div>
                        </div>
                      </div>

                      <Button className="w-full mt-4" variant="outline">
                        {t("common.save")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
