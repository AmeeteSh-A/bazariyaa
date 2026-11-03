export type Retailer =
  | 'Amazon'
  | 'Flipkart'
  | 'Croma'
  | 'Reliance Digital'
  | 'Tata CLiQ'
  | 'Amazon AE'
  | 'Sharaf DG'
  | 'Noon'
  | 'Noon Minutes'
  | 'Talabat Mart'
  | 'Careem Quik'
  | 'Carrefour'
  | 'Lulu'
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

export interface ProductSpec {
  id: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
  buy: number;
  value: number;
  trust: number;
  features: Record<string, string>;
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

export interface Faq {
  q: string;
  a: string;
}

export type Unit = 'L' | 'ml' | 'kg' | 'g' | 'pc';

export interface GroceryCategory {
  id: string;
  name: string;
  icon: string;
  tint: string;
  count: number;
  subs: string[];
}

// --- NEW THREE-LAYER GROCERY SYSTEM ---

export type GroceryForm = 'fresh' | 'juice' | 'dried' | 'frozen' | 'canned' | 'flavored' | 'powder' | (string & {});

export interface GroceryConcept {
  id: string;
  slug: string;
  parent_id: string | null;
  kind: string; 
}

export interface GroceryConceptAlias {
  concept_id: string;
  alias: string;
  lang: string;
  kind: 'synonym' | 'transliteration' | 'misspelling';
}

export interface GroceryProduct {
  id: string;
  brand: string;
  variant: string;
  normalized_size: string;
}

export interface GroceryListing {
  id: string;
  product_id: string;
  concept_id: string;
  retailer: Retailer;
  sku: string;
  title: string; 
  form: GroceryForm;
  variety: string;
  origin: string;
  is_organic: boolean;
  base_qty: number;
  base_unit: Unit;
  price: number; 
  regular_price: number;
  unit_price: number; 
  match_confidence: number;
  in_stock: boolean;
  last_seen_at: string;
  product_url: string;
  image_url: string;
}

export interface PriceHistory {
  listing_id: string;
  price: number;
  seen_at: string;
}