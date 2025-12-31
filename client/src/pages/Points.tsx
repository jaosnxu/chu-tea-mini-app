import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

export default function Points() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { data: member } = trpc.member.info.useQuery();
  const { data: history = [], isLoading } = trpc.points.history.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('points.myPoints')}</h1>
          <div className="w-6" />
        </div>
        <div className="px-4 pb-6 text-center">
          <p className="text-4xl font-bold">{member?.availablePoints || 0}</p>
          <p className="text-white/80 mt-1">{t('points.availablePoints')}</p>
        </div>
      </header>
      <div className="p-4">
        <Card className="p-4">
          <h3 className="font-bold mb-4">{t('points.history')}</h3>
          {isLoading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div> :
           history.length === 0 ? <div className="text-center py-10 text-gray-400">{t('common.noData')}</div> :
           <div className="space-y-4">
             {history.map((item: any) => (
               <div key={item.id} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${item.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>{item.points > 0 ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-600" />}</div>
                   <div><p className="font-medium">{item.description || t(`points.type.${item.type}`)}</p><p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p></div>
                 </div>
                 <span className={`font-bold ${item.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.points > 0 ? '+' : ''}{item.points}</span>
               </div>
             ))}
           </div>}
        </Card>
      </div>
    </div>
  );
}
