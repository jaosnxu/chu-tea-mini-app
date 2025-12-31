import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { trpc } from '../lib/trpc';

// 购物车项类型
export interface CartItem {
  id: number;
  productId: number;
  skuId: number | null;
  quantity: number;
  selectedOptions: Array<{ optionId: number; itemId: number; name: string; price: string }> | null;
  unitPrice: string;
  cartType: 'tea' | 'mall';
  storeId: number | null;
  product: {
    id: number;
    nameZh: string;
    nameRu: string;
    nameEn: string;
    image: string | null;
  } | null;
}

// Context 类型
interface CartContextType {
  teaCartItems: CartItem[];
  mallCartItems: CartItem[];
  teaCartCount: number;
  mallCartCount: number;
  teaCartTotal: number;
  mallCartTotal: number;
  isLoading: boolean;
  addToCart: (item: {
    productId: number;
    skuId?: number;
    quantity: number;
    selectedOptions?: Array<{ optionId: number; itemId: number; name: string; price: string }>;
    unitPrice: string;
    cartType: 'tea' | 'mall';
    storeId?: number;
  }) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: (cartType?: 'tea' | 'mall') => Promise<void>;
  refreshCart: () => void;
}

// 创建 Context
const CartContext = createContext<CartContextType | null>(null);

// Provider 组件
export function CartProvider({ children }: { children: ReactNode }) {
  const [teaCartItems, setTeaCartItems] = useState<CartItem[]>([]);
  const [mallCartItems, setMallCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取茶饮购物车
  const teaCartQuery = trpc.cart.list.useQuery({ cartType: 'tea' });

  // 获取商城购物车
  const mallCartQuery = trpc.cart.list.useQuery({ cartType: 'mall' });

  // 更新购物车数据
  useEffect(() => {
    if (teaCartQuery.data) {
      setTeaCartItems(teaCartQuery.data as CartItem[]);
    }
  }, [teaCartQuery.data]);

  useEffect(() => {
    if (mallCartQuery.data) {
      setMallCartItems(mallCartQuery.data as CartItem[]);
    }
  }, [mallCartQuery.data]);

  // 添加到购物车
  const addMutation = trpc.cart.add.useMutation();
  const updateMutation = trpc.cart.update.useMutation();
  const removeMutation = trpc.cart.remove.useMutation();
  const clearMutation = trpc.cart.clear.useMutation();

  const addToCart = useCallback(async (item: {
    productId: number;
    skuId?: number;
    quantity: number;
    selectedOptions?: Array<{ optionId: number; itemId: number; name: string; price: string }>;
    unitPrice: string;
    cartType: 'tea' | 'mall';
    storeId?: number;
  }) => {
    setIsLoading(true);
    try {
      await addMutation.mutateAsync(item);
      if (item.cartType === 'tea') {
        teaCartQuery.refetch();
      } else {
        mallCartQuery.refetch();
      }
    } finally {
      setIsLoading(false);
    }
  }, [addMutation, teaCartQuery, mallCartQuery]);

  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({ id, quantity });
      teaCartQuery.refetch();
      mallCartQuery.refetch();
    } finally {
      setIsLoading(false);
    }
  }, [updateMutation, teaCartQuery, mallCartQuery]);

  const removeItem = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      await removeMutation.mutateAsync({ id });
      teaCartQuery.refetch();
      mallCartQuery.refetch();
    } finally {
      setIsLoading(false);
    }
  }, [removeMutation, teaCartQuery, mallCartQuery]);

  const clearCart = useCallback(async (cartType?: 'tea' | 'mall') => {
    setIsLoading(true);
    try {
      await clearMutation.mutateAsync({ cartType });
      if (!cartType || cartType === 'tea') {
        teaCartQuery.refetch();
      }
      if (!cartType || cartType === 'mall') {
        mallCartQuery.refetch();
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearMutation, teaCartQuery, mallCartQuery]);

  const refreshCart = useCallback(() => {
    teaCartQuery.refetch();
    mallCartQuery.refetch();
  }, [teaCartQuery, mallCartQuery]);

  // 计算数量和总价
  const teaCartCount = teaCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const mallCartCount = mallCartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const teaCartTotal = teaCartItems.reduce((sum, item) => {
    return sum + parseFloat(item.unitPrice) * item.quantity;
  }, 0);
  
  const mallCartTotal = mallCartItems.reduce((sum, item) => {
    return sum + parseFloat(item.unitPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        teaCartItems,
        mallCartItems,
        teaCartCount,
        mallCartCount,
        teaCartTotal,
        mallCartTotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 使用 Context 的 Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
