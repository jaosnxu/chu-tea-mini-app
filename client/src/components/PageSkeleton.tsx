export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center">
      {/* Brand Logo Skeleton */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/30 animate-pulse" />
        </div>
        <div className="h-6 w-32 bg-amber-200 rounded animate-pulse" />
      </div>
      
      {/* Content Skeleton with shimmer effect */}
      <div className="w-full max-w-md px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        ))}
      </div>
      
      {/* Loading indicator */}
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
