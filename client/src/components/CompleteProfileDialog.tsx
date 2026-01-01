/**
 * 会员信息完善对话框
 * 首次登录强制完善信息
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CompleteProfileDialogProps {
  open: boolean;
  onComplete: () => void;
  allowSkip?: boolean; // 允许跳过（首次可跳过，下单时强制）
}

const RUSSIAN_CITIES = [
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

export function CompleteProfileDialog({ open, onComplete, allowSkip = true }: CompleteProfileDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState<Date>();
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [city, setCity] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [memberId, setMemberId] = useState('');

  const sendCodeMutation = trpc.member.sendVerificationCode.useMutation();
  const completeProfileMutation = trpc.member.completeProfile.useMutation();

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      toast.error('Пожалуйста, введите номер телефона');
      return;
    }

    try {
      await sendCodeMutation.mutateAsync({
        phone,
        purpose: 'bind_phone',
      });
      toast.success('Код подтверждения отправлен');
      setCountdown(60);
    } catch (error: any) {
      toast.error(error.message || 'Не удалось отправить код');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!name || !birthday || !phone || !phoneCode || !city) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const result = await completeProfileMutation.mutateAsync({
        name,
        phone,
        phoneCode,
        birthday: format(birthday, 'yyyy-MM-dd'),
        city,
      });

      setMemberId(result.memberId);
      setStep(3); // 显示完成页面
    } catch (error: any) {
      toast.error(error.message || 'Не удалось завершить регистрацию');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 1 && 'Добро пожаловать в CHU TEA! 🎉'}
            {step === 2 && 'Подтвердите номер телефона'}
            {step === 3 && 'Регистрация завершена! ✨'}
          </DialogTitle>
        </DialogHeader>

        {/* 步骤 1: 基本信息 */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Пожалуйста, заполните информацию о себе, чтобы получить членскую карту
            </p>

            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                placeholder="Введите ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Дата рождения *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthday ? format(birthday, 'PPP', { locale: ru }) : 'Выберите дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={setBirthday}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Город *</Label>
              <select
                id="city"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Выберите город</option>
                {RUSSIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!name || !birthday || !city}
              >
                Далее
              </Button>
              {allowSkip && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onComplete}
                >
                  Пропустить (можно заполнить позже)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 步骤 2: 手机验证 */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Привяжите номер телефона для получения эксклюзивных предложений
            </p>

            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (XXX) XXX-XX-XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Код подтверждения *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="Введите 6-значный код"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || sendCodeMutation.isPending}
                  className="shrink-0"
                >
                  {countdown > 0 ? `${countdown}с` : 'Получить код'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Код действителен 5 минут
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!phone || !phoneCode || completeProfileMutation.isPending}
              >
                {completeProfileMutation.isPending ? 'Загрузка...' : 'Завершить'}
              </Button>
            </div>
          </div>
        )}

        {/* 步骤 3: 完成 */}
        {step === 3 && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Поздравляем!</h3>
              <p className="text-sm text-muted-foreground">
                Вы успешно стали членом CHU TEA
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Ваш ID члена</p>
              <p className="text-2xl font-bold text-primary">{memberId}</p>
            </div>

            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>✨ Накапливайте баллы за каждую покупку</p>
              <p>🎁 Получайте эксклюзивные скидки и предложения</p>
              <p>🎂 Специальный подарок на день рождения</p>
            </div>

            <Button className="w-full" onClick={onComplete}>
              Начать покупки
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
