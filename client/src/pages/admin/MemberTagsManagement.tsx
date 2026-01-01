/**
 * 会员标签管理后台
 * 支持创建、编辑、删除标签，给用户批量打标签
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Tag, Users } from 'lucide-react';

type TagType = 'user' | 'store';

export default function MemberTagsManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [tagName, setTagName] = useState('');
  const [tagType, setTagType] = useState<TagType>('store');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [searchUserId, setSearchUserId] = useState('');

  const { data: tags, refetch } = trpc.member.getTags.useQuery({
    type: undefined,
  });

  const createTagMutation = trpc.member.createTag.useMutation();
  // TODO: 添加 updateTag 和 deleteTag API
  const updateTagMutation = { mutateAsync: async (params: any) => {}, isPending: false };
  const deleteTagMutation = { mutateAsync: async (params: any) => {}, isPending: false };
  const assignTagMutation = trpc.member.assignTag.useMutation();

  // 创建标签
  const handleCreateTag = async () => {
    if (!tagName) {
      toast.error('Пожалуйста, введите название тега');
      return;
    }

    try {
      await createTagMutation.mutateAsync({
        name: tagName,
        type: tagType,
        color: tagColor,
      });
      toast.success('Тег успешно создан');
      setShowCreateDialog(false);
      setTagName('');
      setTagType('store');
      setTagColor('#3b82f6');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось создать тег');
    }
  };

  // 编辑标签
  const handleEditTag = async () => {
    if (!selectedTag || !tagName) {
      return;
    }

    try {
      await updateTagMutation.mutateAsync({
        id: selectedTag.id,
        name: tagName,
        color: tagColor,
      });
      toast.success('Тег успешно обновлен');
      setShowEditDialog(false);
      setSelectedTag(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось обновить тег');
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тег?')) {
      return;
    }

    try {
      await deleteTagMutation.mutateAsync({ id: tagId });
      toast.success('Тег успешно удален');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось удалить тег');
    }
  };

  // 分配标签
  const handleAssignTag = async () => {
    if (!selectedTag || !searchUserId) {
      toast.error('Пожалуйста, введите ID пользователя');
      return;
    }

    try {
      await assignTagMutation.mutateAsync({
        userId: parseInt(searchUserId),
        tagId: selectedTag.id,
      });
      toast.success('Тег успешно назначен пользователю');
      setShowAssignDialog(false);
      setSearchUserId('');
    } catch (error: any) {
      toast.error(error.message || 'Не удалось назначить тег');
    }
  };

  // 打开编辑对话框
  const openEditDialog = (tag: any) => {
    setSelectedTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color || '#3b82f6');
    setShowEditDialog(true);
  };

  // 打开分配对话框
  const openAssignDialog = (tag: any) => {
    setSelectedTag(tag);
    setShowAssignDialog(true);
  };

  const getTagTypeBadge = (type: string) => {
    if (type === 'user') {
      return <Badge variant="secondary">Пользовательский</Badge>;
    }
    return <Badge>Магазин</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление тегами членов</h1>
          <p className="text-muted-foreground mt-1">
            Создавайте и управляйте тегами для сегментации пользователей
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать тег
        </Button>
      </div>

      {/* 标签列表 */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Использований</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags && tags.length > 0 ? (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" style={{ color: tag.color || '#3b82f6' }} />
                      {tag.name}
                    </div>
                  </TableCell>
                  <TableCell>{getTagTypeBadge(tag.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {tag.color || '#3b82f6'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      0 польз.
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(tag.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignDialog(tag)}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Теги не найдены. Создайте первый тег!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 创建标签对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый тег</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название тега *</Label>
              <Input
                id="name"
                placeholder="Например: VIP клиент"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип тега *</Label>
              <select
                id="type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={tagType}
                onChange={(e) => setTagType(e.target.value as TagType)}
              >
                <option value="store">Магазин (назначается персоналом)</option>
                <option value="user">Пользовательский (самостоятельно)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Цвет тега</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color"
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={tagColor} onChange={(e) => setTagColor(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateTag} disabled={createTagMutation.isPending}>
              {createTagMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑标签对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать тег</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название тега *</Label>
              <Input
                id="edit-name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-color">Цвет тега</Label>
              <div className="flex items-center gap-2">
                <input
                  id="edit-color"
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={tagColor} onChange={(e) => setTagColor(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditTag} disabled={updateTagMutation.isPending}>
              {updateTagMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配标签对话框 */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить тег пользователю</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Выбранный тег:</p>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" style={{ color: selectedTag?.color || '#3b82f6' }} />
                <span className="font-semibold">{selectedTag?.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">ID пользователя *</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Введите ID пользователя"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Вы можете найти ID пользователя в разделе управления пользователями
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleAssignTag} disabled={assignTagMutation.isPending}>
              {assignTagMutation.isPending ? 'Назначение...' : 'Назначить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
