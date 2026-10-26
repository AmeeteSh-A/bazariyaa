import type { Product as DbProduct } from './adapter';
import type { Category, Product as UiProduct } from '../types';

const CATEGORY_RULES: Array<[RegExp, Category]> = [
  [/phone|mobile|smartphone|tablet/i, 'Mobiles'],
  [/laptop|computer|notebook|monitor|pc\b/i, 'Laptops'],
  [/headphone|earbud|earphone|speaker|audio|sound/i, 'Audio'],
  [/watch|wearable|band|fitness/i, 'Wearables'],
  [/camera|lens|photo/i, 'Cameras'],
];

const ICONS: Record<Category, string> = { Mobiles: '📱', Laptops: '💻', Audio: '🎧', Wearables: '⌚', Cameras: '📷', Home: '🏠' };

function toCategory(cat: string): Category {
  return CATEGORY_RULES.find(([re]) => re.test(cat))?.[1] ?? 'Home';
}

export function toUiProduct(p: DbProduct): UiProduct & { images?: string[] } {
  const category = toCategory(p.cat);
  
  const currency = p.price.split(' ')[0] || 'AED'; 
  const mrp = p.was ? parseFloat(p.was.replace(/[^0-9.]/g, '')) || p.numericPrice : p.numericPrice;
  const prices = p.history.map(h => h.price).filter(n => n > 0);
  const history = prices.length >= 2 ? prices : [p.numericPrice, p.numericPrice];
  
  const [brand, ...rest] = p.name.split(' ');
  
  return {
    id: p.id,
    
    slug: encodeURIComponent(p.id), 
    
    name: rest.join(' ') || p.name,
    brand,
    category,
    price: p.numericPrice,
    mrp: Math.max(mrp, p.numericPrice),
    rating: p.rating,
    reviews: p.reviews,
    recommended: p.buy,
    trust: parseInt(p.real, 10) || 90,
    value: 8.5,
    trend: p.trend === 'flat' || !p.trend ? 'stable' : p.trend,
    trendPct: p.trendPct || 0, 
    history,
    icon: ICONS[category],
    currency,
    image: p.images[0], 
    images: p.images,
  };
}