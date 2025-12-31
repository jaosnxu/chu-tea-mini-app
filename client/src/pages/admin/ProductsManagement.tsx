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
  Filter,
  Upload,
  Package,
  FolderTree,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ProductsManagement() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch data from API
  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery({});
  const { data: categories } = trpc.category.list.useQuery({});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.products.title")}</h1>
          <p className="text-gray-500">{t("admin.products.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            {t("admin.products.tabs.products")}
          </TabsTrigger>
          <TabsTrigger value="categories">
            <FolderTree className="h-4 w-4 mr-2" />
            {t("admin.products.tabs.categories")}
          </TabsTrigger>
          <TabsTrigger value="options">
            <Settings2 className="h-4 w-4 mr-2" />
            {t("admin.products.tabs.options")}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.products.listTitle")}</CardTitle>
                <CardDescription>{t("admin.products.listDesc")}</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("admin.products.addProduct")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("admin.products.addProduct")}</DialogTitle>
                    <DialogDescription>{t("admin.products.addProductDesc")}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-medium">{t("admin.products.form.basicInfo")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.sku")}</Label>
                          <Input placeholder="TEA-001" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.category")}</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.products.form.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.nameZh}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.nameZh")}</Label>
                          <Input placeholder="经典珍珠奶茶" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.nameRu")}</Label>
                          <Input placeholder="Классический молочный чай" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.nameEn")}</Label>
                          <Input placeholder="Classic Pearl Milk Tea" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.descZh")}</Label>
                          <Textarea placeholder="商品描述（中文）" rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.descRu")}</Label>
                          <Textarea placeholder="Описание товара" rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.descEn")}</Label>
                          <Textarea placeholder="Product description" rows={3} />
                        </div>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                      <h3 className="font-medium">{t("admin.products.form.images")}</h3>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">{t("admin.products.form.uploadHint")}</p>
                        <Button variant="outline" className="mt-2">
                          {t("admin.products.form.selectFiles")}
                        </Button>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                      <h3 className="font-medium">{t("admin.products.form.pricing")}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.basePrice")}</Label>
                          <Input type="number" placeholder="299" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.originalPrice")}</Label>
                          <Input type="number" placeholder="349" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.costPrice")}</Label>
                          <Input type="number" placeholder="150" />
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="space-y-4">
                      <h3 className="font-medium">{t("admin.products.form.points")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.earnPoints")}</Label>
                          <Input type="number" placeholder="29" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.redeemPoints")}</Label>
                          <Input type="number" placeholder="2990" />
                        </div>
                      </div>
                    </div>

                    {/* IIKO Integration */}
                    <div className="space-y-4">
                      <h3 className="font-medium">{t("admin.products.form.iikoIntegration")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.iikoId")}</Label>
                          <Input placeholder="IIKO 商品 ID" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.products.form.iikoCategoryId")}</Label>
                          <Input placeholder="IIKO 分类 ID" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={() => {
                      toast.success(t("admin.products.added"));
                      setIsAddDialogOpen(false);
                    }}>
                      {t("common.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t("admin.products.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("admin.products.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("admin.products.allCategories")}</SelectItem>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nameZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("admin.products.moreFilters")}
                </Button>
              </div>

              {/* Products Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("admin.products.table.image")}</TableHead>
                    <TableHead>{t("admin.products.table.name")}</TableHead>
                    <TableHead>{t("admin.products.table.sku")}</TableHead>
                    <TableHead>{t("admin.products.table.category")}</TableHead>
                    <TableHead>{t("admin.products.table.price")}</TableHead>
                    <TableHead>{t("admin.products.table.stock")}</TableHead>
                    <TableHead>{t("admin.products.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.products.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : products?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("admin.products.noProducts")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products?.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.nameEn || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.nameZh}</p>
                            <p className="text-xs text-gray-500">{product.nameRu}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.categoryId}</TableCell>
                        <TableCell>₽{product.basePrice}</TableCell>
                        <TableCell>
                          {product.stockQuantity !== null ? (
                            <span className={product.stockQuantity < 10 ? "text-red-500" : ""}>
                              {product.stockQuantity}
                            </span>
                          ) : (
                            <span className="text-gray-400">∞</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
                          </Badge>
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

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.products.categoriesTitle")}</CardTitle>
                <CardDescription>{t("admin.products.categoriesDesc")}</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.products.addCategory")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("admin.products.table.icon")}</TableHead>
                    <TableHead>{t("admin.products.table.name")}</TableHead>
                    <TableHead>{t("admin.products.table.type")}</TableHead>
                    <TableHead>{t("admin.products.table.productCount")}</TableHead>
                    <TableHead>{t("admin.products.table.sort")}</TableHead>
                    <TableHead>{t("admin.products.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.products.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          {cat.iconUrl ? (
                            <img src={cat.iconUrl} alt="" className="w-6 h-6" />
                          ) : (
                            <FolderTree className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cat.nameZh}</p>
                          <p className="text-xs text-gray-500">{cat.nameRu}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cat.type === "teabot" ? "TeaBot" : "Mall"}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{cat.sortOrder}</TableCell>
                      <TableCell>
                        <Switch checked={cat.isActive} />
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.products.optionsTitle")}</CardTitle>
                <CardDescription>{t("admin.products.optionsDesc")}</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.products.addOption")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sugar Level */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("admin.products.options.sugarLevel")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["无糖", "三分糖", "五分糖", "七分糖", "全糖"].map((level, index) => (
                        <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                          <span className="text-sm">{level}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">+₽0</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ice Level */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("admin.products.options.iceLevel")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["热饮", "去冰", "少冰", "正常冰", "多冰"].map((level, index) => (
                        <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                          <span className="text-sm">{level}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">+₽0</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Toppings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("admin.products.options.toppings")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { name: "珍珠", price: 10 },
                        { name: "椰果", price: 10 },
                        { name: "芋圆", price: 15 },
                        { name: "红豆", price: 10 },
                        { name: "布丁", price: 15 },
                        { name: "芝士奶盖", price: 20 },
                      ].map((topping, index) => (
                        <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                          <span className="text-sm">{topping.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">+₽{topping.price}</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
