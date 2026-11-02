import type { Category, Product as UiProduct } from '../types';

const CATEGORY_RULES: Array<[RegExp, Category]> = [
  [/phone|mobile|smartphone|tablet/i, 'Mobiles'],
  [/laptop|computer|notebook|monitor|pc\b/i, 'Laptops'],
  [/headphone|earbud|earphone|speaker|audio|sound/i, 'Audio'],
  [/watch|wearable|band|fitness/i, 'Wearables'],
  [/camera|lens|photo/i, 'Cameras'],
];

const ICONS: Record<Category, string> = { 
  Mobiles: '📱', Laptops: '💻', Audio: '🎧', Wearables: '⌚', Cameras: '📸', Home: '🍳', All: '✨', grocery: '🛒' 
};

function toCategory(cat: string): Category {
  return CATEGORY_RULES.find(([re]) => re.test(cat))?.[1] ?? 'Home';
}

export function toUiProduct(p: any): UiProduct & { images?: string[] } {
  const category = toCategory(p.category || '');
  
  const historyPrices = Array.isArray(p.history) ? p.history : [];
  const lastPrice = historyPrices.length > 0 ? historyPrices[historyPrices.length - 1] : p.price;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPct = 0;
  
  if (lastPrice > 0 && p.price !== lastPrice) {
    trendPct = Math.round(((p.price - lastPrice) / lastPrice) * 100);
    if (trendPct > 0) trend = 'up';
    if (trendPct < 0) trend = 'down';
  }

  const discount = p.mrp > p.price ? ((p.mrp - p.price) / p.mrp) * 100 : 0;
  const buyScore = Math.min(99, Math.max(70, Math.round(75 + (p.rating * 3.5) + (discount * 0.2))));
  
  const parsedReviews = parseInt(String(p.reviews).replace(/,/g, '')) || 0;
  const trustScore = parsedReviews > 100 ? 95 : (parsedReviews > 10 ? 85 : 75);

  const [brand, ...rest] = (p.name || '').split(' ');

  return {
    id: p.id,
    slug: encodeURIComponent(p.id),
    name: rest.join(' ') || p.name,
    brand: p.brand !== 'Unknown' ? p.brand : brand,
    category,
    price: Number(p.price) || 0,
    mrp: Math.max(Number(p.mrp) || 0, Number(p.price) || 0),
    rating: Number(p.rating) || 0,
    reviews: String(p.reviews || '0'),
    recommended: buyScore,
    trust: trustScore,
    value: 8.5, 
    trend,
    trendPct: Math.abs(trendPct),
    history: historyPrices.length >= 2 ? historyPrices : [Number(p.price), Number(p.price)],
    icon: ICONS[category] || '✨',
    currency: p.currency || 'AED',
    image: p.image || null,
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
  };
}