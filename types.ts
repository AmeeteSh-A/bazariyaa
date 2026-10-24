export type Retailer = 
  | 'Amazon' 
  | 'Flipkart' 
  | 'Croma' 
  | 'Reliance Digital' 
  | 'Tata CLiQ' 
  | 'Blinkit' 
  | 'Zepto' 
  | 'Instamart' 
  | 'BigBasket'
  | 'Amazon AE'
  | 'Sharaf DG'
  | 'Noon'
  | 'Carrefour'
  | (string & {});

export interface RetailerOffer {
  retailer: Retailer;
  price: number;
  delivery: string;
  inStock: boolean;
}

export type Category = 'Mobiles' | 'Laptops' | 'Audio' | 'Wearables' | 'Cameras' | 'Home';

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  mrp: number;
  rating: number;
  reviews: string;
  recommended: number;
  trust: number;
  value: number;
  trend: 'down' | 'up' | 'stable';
  trendPct: number;
  history: number[];
  icon: string;
  currency?: string;
  image?: string;
  images?: string[];
}

export interface PhoneSpec {
  id: string;
  name: string;
  brand: string;
  price: number;
  buy: number;
  value: number;
  trust: number;
  display: string;
  processor: string;
  ramStorage: string;
  battery: number;
  camera: string;
  charging: string;
  warranty: string;
}

export interface Review {
  name: string;
  initials: string;
  avatar: string;
  badge: 'Expert' | 'Verified';
  meta: string;
  stars: number;
  helpful: number;
  date: string;
  platform?: Retailer;
  text: string;
  product?: string;
}

export interface Faq { q: string; a: string; }

export type Unit = 'L' | 'ml' | 'kg' | 'g' | 'pc';

export interface GroceryCategory {
  id: string;
  name: string;
  icon: string;
  tint: string;
  count: number;
  subs: string[];
}

export interface GroceryCategory {
  cat: string;
  name: string;
  icon: string;
  tint: string;
  count: number;
}

export interface GroceryProduct {
  id: string;
  retailer: string;
  product_url: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  regular_price: number;
  currency: string;
  size_value: number;
  size_unit: string;
  in_stock: boolean;
  image_url: string;
}
