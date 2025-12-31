export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-800" />
      
      {/* Content Skeleton */}
      <div className="container py-6 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
