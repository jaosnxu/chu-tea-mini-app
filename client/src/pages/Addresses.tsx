import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, Plus, MapPin, Trash2, Check } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';

export default function Addresses() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', postalCode: '' });

  const { data: addresses = [], refetch } = trpc.address.list.useQuery();
  const addMutation = trpc.address.add.useMutation();
  const deleteMutation = trpc.address.delete.useMutation();
  const setDefaultMutation = trpc.address.setDefault.useMutation();

  const handleAdd = async () => {
    try {
      await addMutation.mutateAsync(form);
      toast.success(t('address.added'));
      setIsOpen(false);
      setForm({ name: '', phone: '', address: '', city: '', postalCode: '' });
      refetch();
    } catch { toast.error(t('common.error')); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteMutation.mutateAsync({ id }); toast.success(t('address.deleted')); refetch(); } catch { toast.error(t('common.error')); }
  };

  const handleSetDefault = async (id: number) => {
    try { await setDefaultMutation.mutateAsync({ id }); refetch(); } catch { toast.error(t('common.error')); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('address.myAddresses')}</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><button className="p-1"><Plus className="w-6 h-6 text-teal-600" /></button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('address.addAddress')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t('address.name')}</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>{t('address.phone')}</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>{t('address.address')}</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div><Label>{t('address.city')}</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                <div><Label>{t('address.postalCode')}</Label><Input value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} /></div>
                <Button className="w-full" onClick={handleAdd}>{t('common.save')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="p-4 space-y-3">
        {addresses.length === 0 ? <div className="flex flex-col items-center py-20"><MapPin className="w-16 h-16 text-gray-300 mb-4" /><p className="text-gray-500">{t('address.noAddress')}</p></div> :
         addresses.map((addr: any) => (
           <Card key={addr.id} className="p-4">
             <div className="flex items-start justify-between">
               <div className="flex items-start gap-3">
                 <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                 <div>
                   <div className="flex items-center gap-2"><p className="font-medium">{addr.name}</p><span className="text-gray-500">{addr.phone}</span>{addr.isDefault && <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded">{t('address.default')}</span>}</div>
                   <p className="text-sm text-gray-500 mt-1">{addr.address}, {addr.city} {addr.postalCode}</p>
                 </div>
               </div>
               <div className="flex gap-2">
                 {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id)} className="text-teal-600"><Check className="w-5 h-5" /></button>}
                 <button onClick={() => handleDelete(addr.id)} className="text-red-500"><Trash2 className="w-5 h-5" /></button>
               </div>
             </div>
           </Card>
         ))}
      </div>
    </div>
  );
}
