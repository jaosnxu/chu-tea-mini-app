import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Image as ImageIcon, Link2, RefreshCw } from "lucide-react";

interface ProductFormData {
  id?: number;
  categoryId: number;
  type: "tea" | "mall";
  code: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  descriptionZh?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  image?: string;
  basePrice: string;
  originalPrice?: string;
  pointsEarn?: number;
  pointsRedeem?: number;
  stock?: number;
  iikoId?: string;
  isActive: boolean;
}

export default function ProductManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);

  // Queries
  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  
  // IIKO 同步
  const syncMenu = trpc.iiko.triggerMenuSync.useMutation({
    onSuccess: (result) => {
      setIsSyncing(false);
      if (result.succeeded > 0) {
        const totalProducts = result.results.reduce((sum, r) => sum + r.created + r.updated, 0);
        toast.success(`菜单同步成功！同步了 ${totalProducts} 个商品（${result.succeeded}/${result.total} 个门店）`);
        refetchProducts();
      } else if (result.failed > 0) {
        toast.error(`同步失败: ${result.failed} 个门店同步失败`);
      } else {
        toast.info('没有找到激活的 IIKO 配置');
      }
    },
    onError: (error) => {
      setIsSyncing(false);
      toast.error(`同步失败: ${error.message}`);
    },
  });

  // Mutations
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("商品创建成功");
      refetchProducts();
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("商品更新成功");
      refetchProducts();
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("商品删除成功");
      refetchProducts();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // Handlers
  const handleCreate = () => {
    setEditingProduct({
      categoryId: 0,
      type: "tea",
      code: "",
      nameZh: "",
      nameRu: "",
      nameEn: "",
      basePrice: "0",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      categoryId: product.categoryId,
      type: product.type,
      code: product.code,
      nameZh: product.nameZh,
      nameRu: product.nameRu,
      nameEn: product.nameEn,
      descriptionZh: product.descriptionZh || "",
      descriptionRu: product.descriptionRu || "",
      descriptionEn: product.descriptionEn || "",
      image: product.image || "",
      basePrice: product.basePrice,
      originalPrice: product.originalPrice || "",
      pointsEarn: product.pointsEarn || 0,
      pointsRedeem: product.pointsRedeem || 0,
      stock: product.stock || 999,
      iikoId: product.iikoId || "",
      isActive: product.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个商品吗？")) {
      deleteProduct.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const baseData = {
      ...editingProduct,
      basePrice: parseFloat(editingProduct.basePrice),
      originalPrice: editingProduct.originalPrice ? parseFloat(editingProduct.originalPrice) : undefined,
    };

    if (editingProduct.id) {
      // 更新商品，必须包含 id
      updateProduct.mutate({ ...baseData, id: editingProduct.id });
    } else {
      // 创建商品，不包含 id
      const { id, ...createData } = baseData;
      createProduct.mutate(createData);
    }
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.nameZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameRu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === parseInt(selectedCategory);
    const matchesType = selectedType === "all" || product.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">商品管理</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsSyncing(true);
              syncMenu.mutate();
            }}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '同步中...' : '同步 IIKO 菜单'}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            创建商品
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>搜索</Label>
              <Input
                placeholder="搜索商品名称或代码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>分类</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nameZh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>类型</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="tea">茶饮</SelectItem>
                  <SelectItem value="mall">积分商城</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.nameZh}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{product.nameRu}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.nameZh}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              )}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">价格:</span>
                  <span className="font-semibold">₽{product.basePrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">库存:</span>
                  <span>{product.stock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">代码:</span>
                  <span className="text-sm font-mono">{product.code}</span>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <Badge variant={product.type === "tea" ? "default" : "secondary"}>
                    {product.type === "tea" ? "茶饮" : "积分商城"}
                  </Badge>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "上架" : "下架"}
                  </Badge>
                  {product.iikoId && (
                    <Badge variant="outline">
                      <Link2 className="h-3 w-3 mr-1" />
                      IIKO
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? "编辑商品" : "创建商品"}</DialogTitle>
            <DialogDescription>
              填写商品信息。带 * 的字段为必填项。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">类型 *</Label>
                <Select
                  value={editingProduct?.type}
                  onValueChange={(value: "tea" | "mall") =>
                    setEditingProduct((prev) => prev && { ...prev, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tea">茶饮</SelectItem>
                    <SelectItem value="mall">积分商城</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="categoryId">分类 *</Label>
                <Select
                  value={editingProduct?.categoryId.toString()}
                  onValueChange={(value) =>
                    setEditingProduct((prev) => prev && { ...prev, categoryId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nameZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="code">商品代码 *</Label>
              <Input
                id="code"
                value={editingProduct?.code || ""}
                onChange={(e) =>
                  setEditingProduct((prev) => prev && { ...prev, code: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nameZh">中文名称 *</Label>
                <Input
                  id="nameZh"
                  value={editingProduct?.nameZh || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, nameZh: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameRu">俄文名称 *</Label>
                <Input
                  id="nameRu"
                  value={editingProduct?.nameRu || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, nameRu: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameEn">英文名称 *</Label>
                <Input
                  id="nameEn"
                  value={editingProduct?.nameEn || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, nameEn: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="descriptionZh">中文描述</Label>
                <Textarea
                  id="descriptionZh"
                  value={editingProduct?.descriptionZh || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, descriptionZh: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="descriptionRu">俄文描述</Label>
                <Textarea
                  id="descriptionRu"
                  value={editingProduct?.descriptionRu || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, descriptionRu: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="descriptionEn">英文描述</Label>
                <Textarea
                  id="descriptionEn"
                  value={editingProduct?.descriptionEn || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, descriptionEn: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">图片 URL</Label>
              <Input
                id="image"
                value={editingProduct?.image || ""}
                onChange={(e) =>
                  setEditingProduct((prev) => prev && { ...prev, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">售价 (₽) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={editingProduct?.basePrice || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, basePrice: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="originalPrice">原价 (₽)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={editingProduct?.originalPrice || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, originalPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock">库存</Label>
                <Input
                  id="stock"
                  type="number"
                  value={editingProduct?.stock || 999}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, stock: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="pointsEarn">赠送积分</Label>
                <Input
                  id="pointsEarn"
                  type="number"
                  value={editingProduct?.pointsEarn || 0}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, pointsEarn: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="pointsRedeem">兑换积分</Label>
                <Input
                  id="pointsRedeem"
                  type="number"
                  value={editingProduct?.pointsRedeem || 0}
                  onChange={(e) =>
                    setEditingProduct((prev) => prev && { ...prev, pointsRedeem: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="iikoId">IIKO ID (关联 IIKO 商品)</Label>
              <Input
                id="iikoId"
                value={editingProduct?.iikoId || ""}
                onChange={(e) =>
                  setEditingProduct((prev) => prev && { ...prev, iikoId: e.target.value })
                }
                placeholder="留空表示不关联 IIKO"
              />
              <p className="text-sm text-muted-foreground mt-1">
                关联后订单会自动同步到 IIKO 系统
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editingProduct?.isActive || false}
                onChange={(e) =>
                  setEditingProduct((prev) => prev && { ...prev, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isActive">上架销售</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProduct?.id ? "更新" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
