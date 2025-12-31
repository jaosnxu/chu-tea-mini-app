import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook for optimistic UI updates with automatic rollback on error
 * 
 * @example
 * const { optimisticUpdate } = useOptimisticUpdate();
 * 
 * const handleLike = async () => {
 *   await optimisticUpdate({
 *     onMutate: () => setLiked(true),
 *     mutation: () => likeMutation.mutateAsync({ id }),
 *     onError: () => setLiked(false),
 *   });
 * };
 */
export function useOptimisticUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const utils = trpc.useUtils();

  const optimisticUpdate = useCallback(
    async <T>({
      onMutate,
      mutation,
      onError,
      onSuccess,
      invalidateQueries,
    }: {
      onMutate: () => void;
      mutation: () => Promise<T>;
      onError?: (error: Error) => void;
      onSuccess?: (data: T) => void;
      invalidateQueries?: string[];
    }) => {
      setIsUpdating(true);
      
      // Apply optimistic update immediately
      onMutate();

      try {
        // Execute actual mutation
        const result = await mutation();
        
        // Invalidate queries to refetch data
        if (invalidateQueries) {
          for (const query of invalidateQueries) {
            await utils.invalidate(query as any);
          }
        }
        
        onSuccess?.(result);
        return result;
      } catch (error) {
        // Rollback on error
        onError?.(error as Error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [utils]
  );

  return { optimisticUpdate, isUpdating };
}

/**
 * Hook for optimistic list operations (add, remove, update)
 */
export function useOptimisticList<T extends { id: number | string }>(
  initialData: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialData);

  const addItem = useCallback((item: T) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback((id: number | string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback((id: number | string, updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const reset = useCallback((newData: T[]) => {
    setItems(newData);
  }, []);

  return { items, addItem, removeItem, updateItem, reset };
}
