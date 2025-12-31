/**
 * Telegram Bot 设置指南组件
 */
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TelegramBotGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TelegramBotGuide({ open, onOpenChange }: TelegramBotGuideProps) {
  const { t } = useTranslation();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      number: 1,
      title: t("admin.telegram.guide.step1Title", "Откройте @BotFather в Telegram"),
      description: t("admin.telegram.guide.step1Desc", "Найдите и откройте официального бота @BotFather в Telegram"),
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://t.me/BotFather", "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t("admin.telegram.guide.openBotFather", "Открыть @BotFather")}
        </Button>
      ),
    },
    {
      number: 2,
      title: t("admin.telegram.guide.step2Title", "Создайте нового бота"),
      description: t("admin.telegram.guide.step2Desc", "Отправьте команду /newbot боту @BotFather"),
      command: "/newbot",
    },
    {
      number: 3,
      title: t("admin.telegram.guide.step3Title", "Введите имя бота"),
      description: t("admin.telegram.guide.step3Desc", "Введите отображаемое имя вашего бота, например: CHU TEA Notifications"),
      example: "CHU TEA Notifications",
    },
    {
      number: 4,
      title: t("admin.telegram.guide.step4Title", "Введите username бота"),
      description: t("admin.telegram.guide.step4Desc", "Введите уникальный username, который должен заканчиваться на 'bot', например: chutea_notifications_bot"),
      example: "chutea_notifications_bot",
    },
    {
      number: 5,
      title: t("admin.telegram.guide.step5Title", "Скопируйте Bot Token"),
      description: t("admin.telegram.guide.step5Desc", "@BotFather отправит вам токен. Скопируйте его и вставьте в поле 'API Key' на странице настроек API."),
      note: t("admin.telegram.guide.step5Note", "Токен выглядит так: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"),
    },
    {
      number: 6,
      title: t("admin.telegram.guide.step6Title", "Настройте бота (необязательно)"),
      description: t("admin.telegram.guide.step6Desc", "Вы можете настроить описание, аватар и команды бота через @BotFather"),
      commands: [
        { command: "/setdescription", desc: t("admin.telegram.guide.setDescription", "Установить описание бота") },
        { command: "/setuserpic", desc: t("admin.telegram.guide.setUserpic", "Установить аватар бота") },
        { command: "/setcommands", desc: t("admin.telegram.guide.setCommands", "Установить команды бота") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("admin.telegram.guide.title", "Как создать Telegram Bot")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.telegram.guide.description", "Следуйте этим шагам, чтобы создать бота для получения уведомлений")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  {step.number}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {step.command && (
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1 bg-muted rounded font-mono text-sm">
                      {step.command}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(step.command!, step.number)}
                    >
                      {copiedStep === step.number ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                {step.example && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {step.example}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(step.example!, step.number)}
                    >
                      {copiedStep === step.number ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                {step.note && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200">{step.note}</p>
                  </div>
                )}

                {step.commands && (
                  <div className="space-y-2">
                    {step.commands.map((cmd, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{cmd.command}</code>
                          <span className="text-sm text-muted-foreground">- {cmd.desc}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(cmd.command, step.number * 10 + idx)}
                        >
                          {copiedStep === step.number * 10 + idx ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {step.action && (
                  <div className="pt-2">
                    {step.action}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
