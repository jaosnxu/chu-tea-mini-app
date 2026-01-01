import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';
import { 
  Star, 
  ThumbsUp, 
  Image as ImageIcon, 
  ChevronDown,
  Filter,
  Clock,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

type SortOption = 'latest' | 'helpful' | 'highest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1' | 'withImages';

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAllImages, setShowAllImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 获取评价统计
  const { data: stats } = trpc.review.getProductStats.useQuery({ productId });

  // 获取评价列表
  const { data: reviews, isLoading, fetchNextPage, hasNextPage } = 
    trpc.review.getProductReviews.useInfiniteQuery(
      {
        productId,
        minRating: filterBy !== 'all' && filterBy !== 'withImages' ? parseInt(filterBy) : undefined,
        withImages: filterBy === 'withImages',
        sortBy,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // 点赞评价
  const likeMutation = trpc.review.like.useMutation({
    onSuccess: () => {
      toast.success('点赞成功！');
    },
  });

  const allReviews = reviews?.pages.flatMap((page) => page.reviews) || [];
  const allImages = allReviews
    .flatMap((review) => review.images || [])
    .filter(Boolean);

  // 评分分布
  const ratingDistribution = stats?.ratingDistribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  const totalReviews = stats?.totalReviews || 0;
  const averageRating = stats?.averageRating || 0;
  const goodReviewRate = totalReviews > 0 
    ? ((ratingDistribution[5] + ratingDistribution[4]) / totalReviews * 100).toFixed(1)
    : '0.0';

  // 渲染星星
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 筛选按钮
  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: '5', label: '5星' },
    { value: '4', label: '4星' },
    { value: '3', label: '3星' },
    { value: '2', label: '2星' },
    { value: '1', label: '1星' },
    { value: 'withImages', label: '有图' },
  ];

  // 排序按钮
  const sortOptions: { value: SortOption; label: string; icon: any }[] = [
    { value: 'latest', label: '最新', icon: Clock },
    { value: 'helpful', label: '最热', icon: TrendingUp },
    { value: 'highest', label: '好评优先', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      {/* 评分统计卡片 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 总评分 */}
          <div className="text-center md:border-r">
            <div className="text-5xl font-bold text-teal-600 mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), 'lg')}
            <p className="text-sm text-gray-500 mt-2">
              {totalReviews} 条评价
            </p>
          </div>

          {/* 评分分布 */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-600">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                好评率：<span className="text-teal-600 font-bold">{goodReviewRate}%</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 图片墙 */}
      {allImages.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              买家秀 ({allImages.length})
            </h3>
            {allImages.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllImages(!showAllImages)}
              >
                {showAllImages ? '收起' : '查看全部'}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllImages ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {(showAllImages ? allImages : allImages.slice(0, 8)).map((image, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`评价图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 筛选和排序 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 筛选 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterBy === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy(option.value)}
              className="h-8"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2 ml-auto">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(option.value)}
                className="h-8"
              >
                <Icon className="w-3 h-3 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 评价列表 */}
      <div className="space-y-4">
        {isLoading && (
          <Card className="p-6 text-center text-gray-500">
            加载中...
          </Card>
        )}

        {!isLoading && allReviews.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-2">
              <Star className="w-12 h-12 mx-auto mb-3" />
              <p>暂无评价</p>
              <p className="text-sm mt-1">快来成为第一个评价的人吧！</p>
            </div>
          </Card>
        )}

        {allReviews.map((review) => (
          <Card key={review.id} className="p-4">
            {/* 用户信息 */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar>
                <AvatarImage src={review.user?.avatar || undefined} />
                <AvatarFallback>
                  {review.isAnonymous ? '匿' : review.user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {review.isAnonymous ? '匿名用户' : review.user?.name || '用户'}
                  </span>
                  {review.user?.memberLevel && review.user.memberLevel !== 'normal' && (
                    <Badge variant="secondary" className="text-xs">
                      {review.user.memberLevel === 'diamond' ? '💎钻石' :
                       review.user.memberLevel === 'gold' ? '🥇金卡' :
                       review.user.memberLevel === 'silver' ? '🥈银卡' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.overallRating, 'sm')}
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 评价内容 */}
            <div className="space-y-3">
              {/* 标签 */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 评价文字 */}
              {review.content && (
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              )}

              {/* 评价图片 */}
              {review.images && review.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {review.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`评价图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 商家回复 */}
              {review.merchantReply && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">商家回复：</p>
                  <p className="text-sm text-gray-600">{review.merchantReply}</p>
                  {review.merchantReplyAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.merchantReplyAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* 点赞 */}
              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => likeMutation.mutate({ reviewId: review.id, type: 'like' })}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  有用 ({review.likeCount || 0})
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* 加载更多 */}
        {hasNextPage && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isLoading}
            >
              加载更多
            </Button>
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="预览"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
}
