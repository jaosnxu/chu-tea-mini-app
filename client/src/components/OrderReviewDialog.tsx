import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Upload, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface OrderReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  storeId: number;
  onSuccess?: () => void;
}

const RATING_LABELS = {
  overall: { zh: '总体评分', ru: 'Общая оценка', en: 'Overall Rating' },
  taste: { zh: '口味', ru: 'Вкус', en: 'Taste' },
  service: { zh: '服务', ru: 'Сервис', en: 'Service' },
  speed: { zh: '速度', ru: 'Скорость', en: 'Speed' },
  packaging: { zh: '包装', ru: 'Упаковка', en: 'Packaging' },
};

const POSITIVE_TAGS = [
  { zh: '味道很好', ru: 'Вкусно', en: 'Delicious' },
  { zh: '分量足', ru: 'Большая порция', en: 'Good Portion' },
  { zh: '配送快', ru: 'Быстрая доставка', en: 'Fast Delivery' },
  { zh: '包装精美', ru: 'Красивая упаковка', en: 'Nice Packaging' },
  { zh: '服务好', ru: 'Хороший сервис', en: 'Good Service' },
  { zh: '性价比高', ru: 'Хорошее соотношение цены и качества', en: 'Good Value' },
];

const NEGATIVE_TAGS = [
  { zh: '味道一般', ru: 'Обычный вкус', en: 'Average Taste' },
  { zh: '分量少', ru: 'Маленькая порция', en: 'Small Portion' },
  { zh: '配送慢', ru: 'Медленная доставка', en: 'Slow Delivery' },
  { zh: '包装简陋', ru: 'Простая упаковка', en: 'Simple Packaging' },
  { zh: '服务差', ru: 'Плохой сервис', en: 'Poor Service' },
];

export function OrderReviewDialog({
  open,
  onOpenChange,
  orderId,
  storeId,
  onSuccess,
}: OrderReviewDialogProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [ratings, setRatings] = useState({
    overall: 5,
    taste: 5,
    service: 5,
    speed: 5,
    packaging: 5,
  });
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploading, setUploading] = useState(false);

  const createReview = trpc.review.create.useMutation({
    onSuccess: () => {
      toast.success(t('review.submitSuccess'));
      onOpenChange(false);
      onSuccess?.();
      // 重置表单
      setRatings({ overall: 5, taste: 5, service: 5, speed: 5, packaging: 5 });
      setContent('');
      setSelectedTags([]);
      setImages([]);
      setIsAnonymous(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: 实现图片上传到 S3
      // 这里暂时使用模拟 URL
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages].slice(0, 9)); // 最多 9 张图片
      toast.success(t('review.imageUploadSuccess'));
    } catch (error) {
      toast.error(t('review.imageUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (ratings.overall < 1) {
      toast.error(t('review.pleaseRate'));
      return;
    }

    createReview.mutate({
      orderId,
      storeId,
      overallRating: ratings.overall,
      tasteRating: ratings.taste,
      serviceRating: ratings.service,
      speedRating: ratings.speed,
      packagingRating: ratings.packaging,
      content: content.trim() || undefined,
      images: images.length > 0 ? images : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      isAnonymous,
    });
  };

  const RatingStars = ({
    category,
    value,
  }: {
    category: keyof typeof ratings;
    value: number;
  }) => (
    <div className="flex items-center gap-2">
      <Label className="w-20 text-sm">
        {RATING_LABELS[category][language as keyof typeof RATING_LABELS.overall]}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500 ml-2">{value}.0</span>
    </div>
  );

  const availableTags = ratings.overall >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('review.writeReview')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 评分区域 */}
          <div className="space-y-3">
            <RatingStars category="overall" value={ratings.overall} />
            <RatingStars category="taste" value={ratings.taste} />
            <RatingStars category="service" value={ratings.service} />
            <RatingStars category="speed" value={ratings.speed} />
            <RatingStars category="packaging" value={ratings.packaging} />
          </div>

          {/* 标签选择 */}
          <div className="space-y-2">
            <Label>{t('review.selectTags')}</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const tagText = tag[language as keyof typeof tag];
                return (
                  <button
                    key={tagText}
                    type="button"
                    onClick={() => handleTagToggle(tagText)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tagText)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tagText}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 文字评价 */}
          <div className="space-y-2">
            <Label>{t('review.writeComment')}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('review.commentPlaceholder')}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {content.length}/500
            </div>
          </div>

          {/* 图片上传 */}
          <div className="space-y-2">
            <Label>{t('review.uploadImages')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Review ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-600 hover:bg-teal-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">
                    {t('review.addImage')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {t('review.imageLimit', { count: images.length, max: 9 })}
            </div>
          </div>

          {/* 匿名选项 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <Label htmlFor="anonymous" className="cursor-pointer">
              {t('review.anonymous')}
            </Label>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createReview.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={createReview.isPending || uploading}
            >
              {createReview.isPending ? t('common.submitting') : t('common.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
