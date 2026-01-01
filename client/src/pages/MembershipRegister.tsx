import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function MembershipRegister() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    day: '',
    month: '',
    year: '',
    city: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = trpc.member.register.useMutation({
    onSuccess: () => {
      toast.success('🎉 注册成功！新人礼包已发放');
      navigate('/member');
    },
    onError: (error: any) => {
      toast.error(error.message || '注册失败，请稍后重试');
    },
  });

  // 生成日期选项
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: '1', label: 'Январь (1月)' },
    { value: '2', label: 'Февраль (2月)' },
    { value: '3', label: 'Март (3月)' },
    { value: '4', label: 'Апрель (4月)' },
    { value: '5', label: 'Май (5月)' },
    { value: '6', label: 'Июнь (6月)' },
    { value: '7', label: 'Июль (7月)' },
    { value: '8', label: 'Август (8月)' },
    { value: '9', label: 'Сентябрь (9月)' },
    { value: '10', label: 'Октябрь (10月)' },
    { value: '11', label: 'Ноябрь (11月)' },
    { value: '12', label: 'Декабрь (12月)' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const cities = [
    'Москва',
    'Санкт-Петербург',
    'Новосибирск',
    'Екатеринбург',
    'Казань',
    'Нижний Новгород',
    'Челябинск',
    'Самара',
    'Омск',
    'Ростов-на-Дону',
    'Уфа',
    'Красноярск',
    'Воронеж',
    'Пермь',
    'Волгоград',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Пожалуйста, введите ваше имя';
    }

    if (!formData.day || !formData.month || !formData.year) {
      newErrors.birthday = 'Пожалуйста, выберите дату рождения';
    }

    if (!formData.city) {
      newErrors.city = 'Пожалуйста, выберите город';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 构造生日字符串（YYYY-MM-DD）
      const birthday = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;
      
      await registerMutation.mutateAsync({
        name: formData.name,
        birthday,
        city: formData.city,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (confirm('确定要跳过注册吗？您将错过新人大礼包（100 积分 + 2 张优惠券）')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate('/membership/welcome')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">会员注册</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
            <Check className="w-5 h-5" />
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500"></div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
            2
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            完善个人信息
          </h2>
          <p className="text-sm text-gray-600">
            填写信息后即可领取新人大礼包
          </p>
        </div>

        {/* Name Field */}
        <div className="mb-6">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
            Имя *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Введите ваше имя"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            className={`h-12 rounded-xl border-2 transition-all duration-200 ${
              errors.name 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-200 focus:border-orange-500'
            }`}
          />
          {errors.name && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Birthday Field (Russian Format: Day / Month / Year) */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Дата рождения *
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Select value={formData.day} onValueChange={(value) => {
                setFormData({ ...formData, day: value });
                if (errors.birthday) setErrors({ ...errors, birthday: '' });
              }}>
                <SelectTrigger className={`h-12 rounded-xl border-2 ${
                  errors.birthday 
                    ? 'border-red-300' 
                    : 'border-gray-200'
                }`}>
                  <SelectValue placeholder="День" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={formData.month} onValueChange={(value) => {
                setFormData({ ...formData, month: value });
                if (errors.birthday) setErrors({ ...errors, birthday: '' });
              }}>
                <SelectTrigger className={`h-12 rounded-xl border-2 ${
                  errors.birthday 
                    ? 'border-red-300' 
                    : 'border-gray-200'
                }`}>
                  <SelectValue placeholder="Месяц" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={formData.year} onValueChange={(value) => {
                setFormData({ ...formData, year: value });
                if (errors.birthday) setErrors({ ...errors, birthday: '' });
              }}>
                <SelectTrigger className={`h-12 rounded-xl border-2 ${
                  errors.birthday 
                    ? 'border-red-300' 
                    : 'border-gray-200'
                }`}>
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {errors.birthday && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.birthday}</span>
            </div>
          )}
        </div>

        {/* City Field */}
        <div className="mb-8">
          <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
            Город *
          </Label>
          <Select value={formData.city} onValueChange={(value) => {
            setFormData({ ...formData, city: value });
            if (errors.city) setErrors({ ...errors, city: '' });
          }}>
            <SelectTrigger className={`h-12 rounded-xl border-2 ${
              errors.city 
                ? 'border-red-300' 
                : 'border-gray-200'
            }`}>
              <SelectValue placeholder="Выберите город" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.city}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '注册中...' : '完成注册'}
        </Button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors py-3"
        >
          暂时跳过（可稍后填写）
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
          注册即表示您同意我们的
          <a href="/terms" className="text-orange-600 hover:underline">服务条款</a>
          和
          <a href="/privacy" className="text-orange-600 hover:underline">隐私政策</a>
        </p>
      </form>
    </div>
  );
}
