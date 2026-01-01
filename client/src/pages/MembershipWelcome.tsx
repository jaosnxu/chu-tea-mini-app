import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, Sparkles, Ticket, Coins, ChevronRight, Check } from 'lucide-react';

export default function MembershipWelcome() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const benefits = [
    {
      icon: <Coins className="w-12 h-12 text-orange-500" />,
      title: '100 积分',
      description: '立即到账，可用于兑换商品',
      gradient: 'from-orange-100 to-orange-50',
    },
    {
      icon: <Ticket className="w-12 h-12 text-purple-500" />,
      title: '2 张优惠券',
      description: '满 300 减 50，全场通用',
      gradient: 'from-purple-100 to-purple-50',
    },
  ];

  const features = [
    '专属会员折扣',
    '生日特权礼遇',
    '积分翻倍奖励',
    '优先配送服务',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white flex flex-col">
      {/* Hero Section */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 py-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Gift className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-3 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
          欢迎来到 CHU TEA
        </h1>
        <p className="text-lg text-gray-600 text-center mb-2">
          新人专享大礼包
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-12">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>注册即刻领取</span>
        </div>

        {/* Benefits Cards */}
        <div className="w-full max-w-md space-y-4 mb-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className={`p-6 bg-gradient-to-br ${benefit.gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : 'none',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
                <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>

        {/* Features List */}
        <div className="w-full max-w-md mb-8">
          <p className="text-sm font-medium text-gray-700 mb-4 text-center">
            更多会员专属权益
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-2xl"
          onClick={() => navigate('/membership/register')}
        >
          <span>立即注册领取</span>
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        
        <button
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
          onClick={() => navigate('/')}
        >
          暂时跳过
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
