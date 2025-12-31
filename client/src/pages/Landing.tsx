import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { Gift, ChevronRight, MapPin } from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  
  const { data: landingPage, isLoading } = trpc.landing.getBySlug.useQuery(
    { slug: params.slug || '' },
    { enabled: !!params.slug }
  );

  // 记录访问
  const trackMutation = trpc.landing.trackView.useMutation();
  useEffect(() => {
    if (params.slug) {
      trackMutation.mutate({ slug: params.slug });
    }
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{t('error.notFound')}</p>
        <Button onClick={() => navigate('/')}>{t('common.back')}</Button>
      </div>
    );
  }

  const title = getLocalizedText({ zh: landingPage.titleZh || '', ru: landingPage.titleRu || '', en: landingPage.titleEn || '' });
  const subtitle = getLocalizedText({ zh: landingPage.contentZh || '', ru: landingPage.contentRu || '', en: landingPage.contentEn || '' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* 头部图片 */}
      {landingPage.heroImage && (
        <div className="relative h-64 bg-teal-600">
          <img 
            src={landingPage.heroImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-white/80 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-4">
        {/* 优惠券领取 */}
        <Card className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8" />
              <div>
                <p className="font-bold">{t('landing.newUserGift')}</p>
                <p className="text-sm text-white/80">{t('coupon.getCoupon')}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-orange-500"
              onClick={() => navigate('/coupons')}
            >
              {t('landing.getCoupon')}
            </Button>
          </div>
        </Card>

        {/* 开始点单按钮 */}
        <Button 
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg"
          onClick={() => navigate('/menu')}
        >
          {t('landing.startOrder')}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
