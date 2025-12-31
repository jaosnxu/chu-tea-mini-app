import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductConfig() {
  const { t } = useTranslation();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.productConfig.list.useQuery();
  
  const initDefaults = trpc.productConfig.initDefaults.useMutation({
    onSuccess: () => {
      toast.success(t('config.initSuccess'));
      utils.productConfig.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateConfig = trpc.productConfig.update.useMutation({
    onSuccess: () => {
      toast.success(t('config.updateSuccess'));
      utils.productConfig.list.invalidate();
      setEditingConfig(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteConfig = trpc.productConfig.delete.useMutation({
    onSuccess: () => {
      toast.success(t('config.deleteSuccess'));
      utils.productConfig.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleSaveConfig = (config: any) => {
    updateConfig.mutate({
      id: config.id,
      configValue: config.configValue,
      isActive: config.isActive,
    });
  };
  
  const handleToggleOption = (config: any, optionIndex: number) => {
    const newConfig = { ...config };
    newConfig.configValue.options[optionIndex].isActive = !newConfig.configValue.options[optionIndex].isActive;
    handleSaveConfig(newConfig);
  };
  
  const handleEditOption = (config: any, optionIndex: number) => {
    setEditingConfig(config);
    setEditingOption({ ...config.configValue.options[optionIndex], index: optionIndex });
    setIsDialogOpen(true);
  };
  
  const handleSaveOption = () => {
    if (!editingConfig || editingOption === null) return;
    
    const newConfig = { ...editingConfig };
    newConfig.configValue.options[editingOption.index] = {
      ...editingOption,
    };
    delete newConfig.configValue.options[editingOption.index].index;
    
    handleSaveConfig(newConfig);
    setIsDialogOpen(false);
    setEditingOption(null);
  };
  
  const handleAddOption = (config: any) => {
    setEditingConfig(config);
    setEditingOption({
      name: '',
      nameZh: '',
      nameRu: '',
      nameEn: '',
      value: '',
      isDefault: false,
      isActive: true,
      sortOrder: (config.configValue.options?.length || 0) + 1,
      priceAdjust: 0,
      weight: 0,
      index: config.configValue.options?.length || 0,
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteOption = (config: any, optionIndex: number) => {
    if (!confirm(t('config.confirmDeleteOption'))) return;
    
    const newConfig = { ...config };
    newConfig.configValue.options.splice(optionIndex, 1);
    handleSaveConfig(newConfig);
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!configs || configs.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">{t('config.noConfig')}</h2>
          <p className="text-gray-500 mb-6">{t('config.noConfigDesc')}</p>
          <Button onClick={() => initDefaults.mutate()} disabled={initDefaults.isPending}>
            {initDefaults.isPending ? t('common.loading') : t('config.initDefaults')}
          </Button>
        </Card>
      </div>
    );
  }
  
  const sugarConfig = configs.find(c => c.configType === 'sugar');
  const iceConfig = configs.find(c => c.configType === 'ice');
  const sizeConfig = configs.find(c => c.configType === 'size');
  const toppingConfig = configs.find(c => c.configType === 'topping');
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('config.productConfig')}</h1>
        <Button variant="outline" onClick={() => initDefaults.mutate()} disabled={initDefaults.isPending}>
          {t('config.resetDefaults')}
        </Button>
      </div>
      
      <Tabs defaultValue="sugar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sugar">{t('config.sugar')}</TabsTrigger>
          <TabsTrigger value="ice">{t('config.ice')}</TabsTrigger>
          <TabsTrigger value="size">{t('config.size')}</TabsTrigger>
          <TabsTrigger value="topping">{t('config.topping')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sugar">
          {sugarConfig && <ConfigPanel config={sugarConfig} onSave={handleSaveConfig} onToggleOption={handleToggleOption} onEditOption={handleEditOption} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} />}
        </TabsContent>
        
        <TabsContent value="ice">
          {iceConfig && <ConfigPanel config={iceConfig} onSave={handleSaveConfig} onToggleOption={handleToggleOption} onEditOption={handleEditOption} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} />}
        </TabsContent>
        
        <TabsContent value="size">
          {sizeConfig && <ConfigPanel config={sizeConfig} onSave={handleSaveConfig} onToggleOption={handleToggleOption} onEditOption={handleEditOption} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} />}
        </TabsContent>
        
        <TabsContent value="topping">
          {toppingConfig && <ConfigPanel config={toppingConfig} onSave={handleSaveConfig} onToggleOption={handleToggleOption} onEditOption={handleEditOption} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} />}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('config.editOption')}</DialogTitle>
          </DialogHeader>
          {editingOption && (
            <div className="space-y-4">
              <div>
                <Label>{t('config.nameZh')}</Label>
                <Input value={editingOption.nameZh} onChange={(e) => setEditingOption({ ...editingOption, nameZh: e.target.value })} />
              </div>
              <div>
                <Label>{t('config.nameRu')}</Label>
                <Input value={editingOption.nameRu} onChange={(e) => setEditingOption({ ...editingOption, nameRu: e.target.value })} />
              </div>
              <div>
                <Label>{t('config.nameEn')}</Label>
                <Input value={editingOption.nameEn} onChange={(e) => setEditingOption({ ...editingOption, nameEn: e.target.value })} />
              </div>
              <div>
                <Label>{t('config.value')}</Label>
                <Input value={editingOption.value} onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })} />
              </div>
              {editingConfig?.configType === 'size' || editingConfig?.configType === 'topping' ? (
                <div>
                  <Label>{t('config.priceAdjust')}</Label>
                  <Input type="number" value={editingOption.priceAdjust || 0} onChange={(e) => setEditingOption({ ...editingOption, priceAdjust: parseFloat(e.target.value) })} />
                </div>
              ) : null}
              {editingConfig?.configType === 'topping' ? (
                <div>
                  <Label>{t('config.weight')}</Label>
                  <Input type="number" value={editingOption.weight || 0} onChange={(e) => setEditingOption({ ...editingOption, weight: parseFloat(e.target.value) })} />
                </div>
              ) : null}
              <div className="flex items-center space-x-2">
                <Switch checked={editingOption.isDefault} onCheckedChange={(checked) => setEditingOption({ ...editingOption, isDefault: checked })} />
                <Label>{t('config.isDefault')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={editingOption.isActive} onCheckedChange={(checked) => setEditingOption({ ...editingOption, isActive: checked })} />
                <Label>{t('config.isActive')}</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleSaveOption}>{t('common.save')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigPanel({ config, onSave, onToggleOption, onEditOption, onAddOption, onDeleteOption }: any) {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState(config);
  
  const handleToggleEnabled = () => {
    const newConfig = { ...localConfig };
    newConfig.configValue.enabled = !newConfig.configValue.enabled;
    setLocalConfig(newConfig);
    onSave(newConfig);
  };
  
  const handleToggleRequired = () => {
    const newConfig = { ...localConfig };
    newConfig.configValue.isRequired = !newConfig.configValue.isRequired;
    setLocalConfig(newConfig);
    onSave(newConfig);
  };
  
  const handleToggleMultiple = () => {
    const newConfig = { ...localConfig };
    newConfig.configValue.isMultiple = !newConfig.configValue.isMultiple;
    setLocalConfig(newConfig);
    onSave(newConfig);
  };
  
  const handleMaxSelectChange = (value: number) => {
    const newConfig = { ...localConfig };
    newConfig.configValue.maxSelect = value;
    setLocalConfig(newConfig);
    onSave(newConfig);
  };
  
  return (
    <Card className="p-6 mt-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{localConfig.nameZh}</h3>
            <p className="text-sm text-gray-500">{localConfig.nameRu} / {localConfig.nameEn}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch checked={localConfig.configValue.enabled} onCheckedChange={handleToggleEnabled} />
              <Label>{t('config.enabled')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={localConfig.configValue.isRequired} onCheckedChange={handleToggleRequired} />
              <Label>{t('config.required')}</Label>
            </div>
            {localConfig.configType === 'topping' && (
              <div className="flex items-center space-x-2">
                <Switch checked={localConfig.configValue.isMultiple} onCheckedChange={handleToggleMultiple} />
                <Label>{t('config.multiple')}</Label>
              </div>
            )}
          </div>
        </div>
        
        {localConfig.configValue.isMultiple && (
          <div>
            <Label>{t('config.maxSelect')}</Label>
            <Input 
              type="number" 
              value={localConfig.configValue.maxSelect || 1} 
              onChange={(e) => handleMaxSelectChange(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t('config.options')}</Label>
            <Button size="sm" onClick={() => onAddOption(localConfig)}>
              <Plus className="w-4 h-4 mr-1" />
              {t('config.addOption')}
            </Button>
          </div>
          
          <div className="space-y-2">
            {localConfig.configValue.options?.map((option: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{option.nameZh}</div>
                  <div className="text-sm text-gray-500">{option.nameRu} / {option.nameEn}</div>
                  {(option.priceAdjust || option.weight) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {option.priceAdjust ? `+₽${option.priceAdjust}` : ''}
                      {option.weight ? ` | ${option.weight}g` : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {option.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{t('config.default')}</span>
                  )}
                  <Switch checked={option.isActive} onCheckedChange={() => onToggleOption(localConfig, index)} />
                  <Button size="sm" variant="ghost" onClick={() => onEditOption(localConfig, index)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDeleteOption(localConfig, index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
