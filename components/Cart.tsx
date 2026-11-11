'use client';

import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { inr } from '@/utils/format';
import { optimizeBasket, CartOptimizationRequest } from '@/actions'; 

export type CartItem = {
  id: string; 
  productKey: string;
  sizeKey: string;
  title: string;
  variantLabel: string;
  sizeLabel: string;
  price: number;
  storeName: string;
  storeUrl: string; 
  listingTitle: string; 
  imageUrl: string;
  qty: number;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bazariyaa_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('bazariyaa_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, 'qty'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id);
      if (existing) {
        return prev.map(i => i.id === newItem.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...newItem, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) return { ...i, qty: Math.max(1, i.qty + delta) };
      return i;
    }));
  };

  const removeFromCart = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  
  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, setItems, isCartOpen, setCartOpen, totalItems }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

function CartDrawer() {
  const { items, isCartOpen, setCartOpen, updateQty, removeFromCart, clearCart, setItems } = useCart();
  
  const [isClosing, setIsClosing] = useState(false);
  const [renderOpen, setRenderOpen] = useState(false);
  
  const [itemToRemove, setItemToRemove] = useState<string | null>(null); 
  const [isClearingCart, setIsClearingCart] = useState(false);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedOptions, setOptimizedOptions] = useState<any[] | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      setRenderOpen(true);
      setIsClosing(false);
    } else if (renderOpen) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRenderOpen(false);
        setIsClosing(false);
        setOptimizedOptions(null); 
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [isCartOpen, renderOpen]);

  const handleMinus = (item: CartItem) => {
    if (item.qty === 1) {
      setItemToRemove(item.id); 
    } else {
      updateQty(item.id, -1);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const req: CartOptimizationRequest[] = items.map(i => ({
      key: i.productKey || i.title.toLowerCase(), 
      brand: i.variantLabel.split(' ')[0], 
      sizeKey: i.sizeKey || i.sizeLabel.replace(/\s+/g, ''),
      qty: i.qty
    }));
    
    const res = await optimizeBasket(req);
    if (res.options) setOptimizedOptions(res.options);
    setIsOptimizing(false);
  };

  const applyOptimization = (optItems: CartItem[]) => {
    setItems(optItems);
    setOptimizedOptions(null);
  };

  const groupedCart = useMemo(() => {
    const groups: Record<string, { items: CartItem[], total: number }> = {};
    items.forEach(item => {
      if (!groups[item.storeName]) groups[item.storeName] = { items: [], total: 0 };
      groups[item.storeName].items.push(item);
      groups[item.storeName].total += item.price * item.qty;
    });
    return groups;
  }, [items]);

  if (!renderOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
      
      <div 
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9998, animation: isClosing ? 'fadeOut 0.3s forwards' : 'fadeIn 0.3s forwards' }} 
        onClick={() => setCartOpen(false)} 
      />
      
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 400,
        backgroundColor: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', overflow: 'hidden',
        animation: isClosing ? 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>Your Basket</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {items.length > 0 && !optimizedOptions && (
              <button 
                onClick={() => setIsClearingCart(true)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red, #E22028)', fontSize: 16, display: 'flex', alignItems: 'center', padding: 4 }}
                title="Clear Cart"
              >
                🗑
              </button>
            )}
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, position: 'relative' }}>
          
          {itemToRemove && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 300, border: '1px solid var(--divider)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Remove item?</h3>
                <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--faint)' }}>Do you want to drop this item from your basket?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setItemToRemove(null)} style={{ flex: 1, padding: '10px 0', border: '1px solid var(--divider)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Keep</button>
                  <button onClick={() => { removeFromCart(itemToRemove); setItemToRemove(null); }} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: 'var(--red, #E22028)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                </div>
              </div>
            </div>
          )}

          {isClearingCart && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 300, border: '1px solid var(--divider)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Clear entire cart?</h3>
                <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--faint)' }}>This will remove all items from your basket.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setIsClearingCart(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid var(--divider)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button onClick={() => { clearCart(); setIsClearingCart(false); }} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: 'var(--red, #E22028)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--faint)', marginTop: 40 }}>Your cart is empty.</div>
          ) : (
            <>
              {!optimizedOptions ? (
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--violet-light, #F3F0FE)', borderRadius: 12, border: '1px solid var(--violet)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }}>Save on delivery fees?</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 12 }}>We can bundle your items to find the absolute cheapest total.</div>
                  <button 
                    onClick={handleOptimize} 
                    disabled={isOptimizing}
                    className="btn btn--primary btn--block" 
                    style={{ padding: '10px 0', borderRadius: 8 }}
                  >
                    {isOptimizing ? 'Calculating math...' : 'Optimize'}
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Select a smart basket:</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {optimizedOptions.map((opt, idx) => (
                      <div key={idx} style={{ padding: 16, border: '2px solid var(--violet)', borderRadius: 12, background: '#fff', cursor: 'pointer' }} onClick={() => applyOptimization(opt.items)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {opt.stores.map((storeName: string) => (
                              <div key={storeName} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--canvas)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                                  🏪
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--violet)', textTransform: 'capitalize', fontSize: 16 }}>{storeName}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ fontWeight: 800, fontSize: 16 }}>{inr(opt.price)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--faint)' }}>
                          Found {opt.found} of {opt.totalRequested} items
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOptimizedOptions(null)} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--faint)', fontSize: 12, cursor: 'pointer', width: '100%' }}>Cancel optimization</button>
                </div>
              )}

              {Object.entries(groupedCart).map(([store, data]) => (
                <div key={store} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--violet)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{store}</span>
                    <span>{inr(data.total)}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gap: 16 }}>
                    {data.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img src={item.imageUrl} alt={item.title} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--divider)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--faint)' }}>{item.variantLabel} · {item.sizeLabel}</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{inr(item.price)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--divider)', borderRadius: 8, overflow: 'hidden' }}>
                          <button onClick={() => handleMinus(item)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                          <span style={{ fontSize: 13, width: 20, textAlign: 'center', fontWeight: 600 }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a 
                    href={data.items[0]?.storeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn--primary btn--block" 
                    style={{ marginTop: 16, borderRadius: 8, padding: '10px 0', textDecoration: 'none' }}
                  >
                    Checkout at {store} ({inr(data.total)})
                  </a>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}