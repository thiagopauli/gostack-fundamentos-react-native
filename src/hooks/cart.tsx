import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('@GoMarketplace:products');
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveCart(): Promise<void> {
      await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    }

    saveCart();
  }, [products]);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(currentProduct => currentProduct.id === id);

      if (productIndex === -1) {
        throw Error('Produto não encontrado!');
      }

      const newProducts = [...products];
      newProducts[productIndex].quantity += 1;

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(currentProduct => currentProduct.id === id);

      if (productIndex === -1) {
        throw Error('Produto não encontrado!');
      }

      const newProducts = [...products];
      newProducts[productIndex].quantity -= 1;

      if (newProducts[productIndex].quantity < 1) {
        newProducts.splice(productIndex, 1);
      }

      setProducts(newProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExistInCart = products.find(currentProduct => currentProduct.id === product.id);
      if (productExistInCart) {
        increment(productExistInCart.id);
      } else {
        const newProducts = [...products, { ...product, quantity: 1 }];

        setProducts(newProducts);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(() => ({ addToCart, increment, decrement, products }), [
    products,
    addToCart,
    increment,
    decrement,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
