import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useStore } from '@/contexts/StoreContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, MapPin, Navigation, Search, Clock, Check } from 'lucide-react';

export default function StoreSelector() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { currentStore, setCurrentStore } = useStore();
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: stores = [], isLoading } = trpc.store.list.useQuery();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const filteredStores = stores.filter((store: any) => {
    const name = getLocalizedText({ zh: store.nameZh, ru: store.nameRu, en: store.nameEn }).toLowerCase();
    const address = getLocalizedText({ zh: store.addressZh, ru: store.addressRu, en: store.addressEn }).toLowerCase();
    return name.includes(search.toLowerCase()) || address.includes(search.toLowerCase());
  });

  const handleSelect = (store: any) => {
    setCurrentStore(store);
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => window.history.back()} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('store.selectStore')}</h1>
          <div className="w-6" />
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder={t('store.searchStore')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
      </header>
      <div className="p-4 space-y-3">
        {isLoading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div> :
         filteredStores.length === 0 ? <div className="text-center py-10 text-gray-400">{t('common.noData')}</div> :
         filteredStores.map((store: any) => {
           const name = getLocalizedText({ zh: store.nameZh, ru: store.nameRu, en: store.nameEn });
           const address = getLocalizedText({ zh: store.addressZh, ru: store.addressRu, en: store.addressEn });
           const isSelected = currentStore?.id === store.id;
           return (
             <Card key={store.id} className={`p-4 cursor-pointer transition-colors ${isSelected ? 'border-teal-600 bg-teal-50' : 'hover:bg-gray-50'}`} onClick={() => handleSelect(store)}>
               <div className="flex items-start justify-between">
                 <div className="flex items-start gap-3">
                   <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                   <div>
                     <div className="flex items-center gap-2">
                       <p className="font-medium">{name}</p>
                       {store.isOpen ? <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">{t('store.open')}</Badge> : <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">{t('store.closed')}</Badge>}
                     </div>
                     <p className="text-sm text-gray-500 mt-1">{address}</p>
                     <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{store.openTime}-{store.closeTime}</span>
                       {store.phone && <span>{store.phone}</span>}
                     </div>
                   </div>
                 </div>
                 {isSelected && <Check className="w-5 h-5 text-teal-600" />}
               </div>
             </Card>
           );
         })}
      </div>
    </div>
  );
}
