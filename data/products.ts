import type { Faq, PhoneSpec, Product, RetailerOffer, Review } from '@/types';

export const PRODUCTS: Product[] = [
  { id: 'iphone17pro', slug: 'apple-iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple', category: 'Mobiles', price: 68999, mrp: 74999, rating: 4.7, reviews: '12.4k', recommended: 96, trust: 94, value: 8.6, trend: 'down', history: [75, 74, 73, 71, 72, 70, 69], icon: '📱' },
  { id: 'nova', slug: 'nova-edge-5g', name: 'Nova Edge 5G', brand: 'Nova', category: 'Mobiles', price: 31499, mrp: 33999, rating: 4.5, reviews: '8.1k', recommended: 91, trust: 90, value: 9.2, trend: 'down', history: [34, 34, 33, 33, 32, 32, 31], icon: '📱' },
  { id: 'forge', slug: 'forge-14-ultrabook', name: 'Forge 14 Ultrabook', brand: 'Forge', category: 'Laptops', price: 74999, mrp: 82999, rating: 4.6, reviews: '3.9k', recommended: 93, trust: 91, value: 8.9, trend: 'down', history: [83, 82, 80, 79, 78, 76, 75], icon: '💻' },
  { id: 'cadbuds', slug: 'cadence-studio-buds', name: 'Cadence Studio Buds', brand: 'Cadence', category: 'Audio', price: 8999, mrp: 11999, rating: 4.4, reviews: '22.6k', recommended: 89, trust: 88, value: 8.7, trend: 'down', history: [12, 11, 11, 10, 10, 9, 9], icon: '🎧' },
  { id: 'orbit', slug: 'orbit-pro-watch', name: 'Orbit Pro Watch', brand: 'Orbit', category: 'Wearables', price: 24999, mrp: 27999, rating: 4.5, reviews: '6.7k', recommended: 90, trust: 89, value: 8.5, trend: 'stable', history: [28, 27, 27, 26, 26, 25, 25], icon: '⌚' },
  { id: 'vista', slug: 'vista-mirrorless-x', name: 'Vista Mirrorless X', brand: 'Vista', category: 'Cameras', price: 104999, mrp: 109999, rating: 4.8, reviews: '1.8k', recommended: 97, trust: 95, value: 8.2, trend: 'up', history: [102, 103, 103, 104, 104, 105, 105], icon: '📷' },
  { id: 'breeze', slug: 'breeze-air-fryer-5l', name: 'Breeze Air Fryer 5L', brand: 'Breeze', category: 'Home', price: 6499, mrp: 8499, rating: 4.6, reviews: '31.2k', recommended: 95, trust: 90, value: 9.1, trend: 'down', history: [8, 8, 7, 7, 7, 6, 6], icon: '🏠' },
  { id: 'lumen', slug: 'lumen-x2', name: 'Lumen X2', brand: 'Lumen', category: 'Mobiles', price: 42999, mrp: 45999, rating: 4.6, reviews: '9.9k', recommended: 92, trust: 92, value: 8.8, trend: 'down', history: [46, 45, 45, 44, 44, 43, 43], icon: '📱' },
];

export const PHONES: Record<string, PhoneSpec> = {
  iphone17pro: { id: 'iphone17pro', name: 'iPhone 17 Pro', brand: 'Apple', price: 68999, buy: 92, value: 8.6, trust: 94, display: '6.7" LTPO AMOLED · 120Hz', processor: 'A19 Pro', ramStorage: '12GB · 256GB', battery: 5000, camera: '50MP + 48MP + 12MP', charging: '100W wired · 50W wireless', warranty: '2 years' },
  nova: { id: 'nova', name: 'Nova Edge 5G', brand: 'Nova', price: 31499, buy: 84, value: 9.2, trust: 90, display: '6.5" AMOLED · 120Hz', processor: 'Dimensity 7300', ramStorage: '8GB · 128GB', battery: 5200, camera: '64MP + 8MP', charging: '67W wired', warranty: '1 year' },
  zenith: { id: 'zenith', name: 'Zenith Ultra', brand: 'Zenith', price: 89999, buy: 95, value: 8.1, trust: 96, display: '6.8" QHD+ AMOLED · 120Hz', processor: 'Snapdragon 8 Gen 3', ramStorage: '16GB · 512GB', battery: 5400, camera: '200MP + 50MP + 10MP', charging: '80W wired · 50W wireless', warranty: '2 years' },
  pulse: { id: 'pulse', name: 'Pulse Neo', brand: 'Pulse', price: 18999, buy: 79, value: 9.0, trust: 87, display: '6.6" IPS LCD · 90Hz', processor: 'Dimensity 6300', ramStorage: '6GB · 128GB', battery: 6000, camera: '50MP + 2MP', charging: '33W wired', warranty: '1 year' },
  lumen: { id: 'lumen', name: 'Lumen X2', brand: 'Lumen', price: 42999, buy: 88, value: 8.8, trust: 92, display: '6.7" AMOLED · 144Hz', processor: 'Snapdragon 7+ Gen 3', ramStorage: '12GB · 256GB', battery: 5500, camera: '50MP + 50MP + 8MP', charging: '80W wired', warranty: '2 years' },
};

export const PDP_OFFERS: RetailerOffer[] = [
  { retailer: 'Flipkart', price: 68999, delivery: 'Free delivery by Tue', inStock: true },
  { retailer: 'Amazon', price: 69499, delivery: 'Free delivery by Wed', inStock: true },
  { retailer: 'Croma', price: 70999, delivery: 'Delivery in 3–4 days', inStock: true },
  { retailer: 'Reliance Digital', price: 71499, delivery: 'Store pickup available', inStock: true },
];

export const PDP_SPECS: Array<[string, string]> = [
  ['Display', '6.7" LTPO AMOLED · 120Hz'], ['Processor', 'A19 Pro'],
  ['RAM', '12GB LPDDR5X'], ['Storage', '256GB UFS 4.0'],
  ['Battery', '5000 mAh'], ['Charging', '100W wired · 50W wireless'],
  ['Rear camera', '50MP + 48MP UW + 12MP tele'], ['Front camera', '32MP'],
  ['OS', 'iOS 19'], ['Weight', '198 g'],
  ['Water resistance', 'IP68'], ['Warranty', '2 years'],
];

export const PROS = ['All-day battery even under heavy use', 'Genuinely fast 100W charging (0–60% in 15 min)', 'Bright, colour-accurate 120Hz display', 'Flagship chip at an upper-mid price'];
export const CONS = ['Ultrawide camera is only average', 'No microSD expansion', 'Ships with a modest charger in some regions'];

export const REVIEWS: Review[] = [
  { name: 'Ananya Rao', initials: 'AR', avatar: '#5433EB', badge: 'Expert', meta: 'Tech reviewer · 8 yrs', stars: 5, helpful: 421, date: '12 Jul 2026', text: 'Finally nails the fundamentals — battery lasts a full heavy day and 100W charging is no gimmick. At this price it undercuts everything with a flagship chip.' },
  { name: 'Rohit Mehta', initials: 'RM', avatar: '#332F2D', badge: 'Verified', meta: 'Bought Jun 2026 · Bengaluru', stars: 4, helpful: 198, date: '3 Jul 2026', platform: 'Amazon', text: 'Great screen for the money. The only weak spot is the ultrawide camera — Bazariyaa flagged it upfront so no surprises.' },
  { name: 'Priya Nair', initials: 'PN', avatar: '#1F7A5A', badge: 'Verified', meta: 'Bought Jun 2026 · Kochi', stars: 5, helpful: 312, date: '28 Jun 2026', platform: 'Flipkart', text: 'Switched from a two-year-old flagship and the difference in speed and battery is night and day. Worth every rupee at the current price.' },
  { name: 'TechDesk India', initials: 'TD', avatar: '#5433EB', badge: 'Expert', meta: 'Editorial review', stars: 4, helpful: 156, date: '21 Jun 2026', text: 'A confident recommendation in the ₹65–70k bracket. Loses half a point only for the average ultrawide and a plasticky mid-frame.' },
];

export const TESTIMONIALS: Review[] = [
  { name: 'Ananya Rao', initials: 'AR', avatar: '#5433EB', badge: 'Verified', meta: 'Mumbai, MH', stars: 5, helpful: 421, date: '12 Jul 2026', platform: 'Flipkart', product: 'iPhone 17 Pro', text: 'I researched for three weeks before landing here. The price-history graph proved the festive drop was real, and the score matched my month of real-world use exactly. Zero regrets.' },
  { name: 'Rohit Mehta', initials: 'RM', avatar: '#332F2D', badge: 'Verified', meta: 'Bengaluru, KA', stars: 4, helpful: 198, date: '3 Jul 2026', platform: 'Amazon', product: 'Nova Edge 5G', text: 'Bought on the strength of the Value Score and it was spot on. Bazariyaa flagged the weaker second camera upfront, so no nasty surprises.' },
  { name: 'Priya Nair', initials: 'PN', avatar: '#1F7A5A', badge: 'Verified', meta: 'Kochi, KL', stars: 5, helpful: 312, date: '28 Jun 2026', platform: 'Tata CLiQ', product: 'Breeze Air Fryer 5L', text: 'The price timeline made an inflated “sale” obvious and helped me wait two weeks for the genuine low.' },
  { name: 'Karan Shah', initials: 'KS', avatar: '#787574', badge: 'Verified', meta: 'Ahmedabad, GJ', stars: 5, helpful: 156, date: '21 Jun 2026', platform: 'Croma', product: 'Forge 14 Ultrabook', text: 'Compared four laptops in the matrix in about a minute. Seeing the winner highlighted per row removed all my second-guessing.' },
];

export const LANDING_FAQS: Faq[] = [
  { q: 'How is the recommendation score calculated?', a: 'It blends verified review sentiment, value-for-money against similar products, price fairness versus history, warranty and reliability signals. Weights are published and identical for every product — brands cannot buy a better score.' },
  { q: 'Do brands pay to rank higher?', a: 'Never. Rankings are driven purely by data and verified reviews. We may earn a small affiliate commission if you buy through a store link, but it never changes a score or verdict.' },
  { q: 'How do you detect fake reviews?', a: 'Our Review Trust Score flags coordinated posting patterns, unverified purchases and language anomalies. Only reviews that clear the check count toward a rating.' },
  { q: 'Where does the price history come from?', a: 'We track prices across major Indian retailers multiple times a day and store the full history. That powers the “best time to buy” verdict and price-drop alerts.' },
  { q: 'Is Bazariyaa free to use?', a: 'Yes, completely free. Search, compare, read reviews and set price alerts without paying or creating an account.' },
];

export const PDP_FAQS: Faq[] = [
  { q: 'Does it support Indian 5G bands?', a: 'Yes — it supports all major Indian 5G bands (n1, n3, n5, n8, n28, n78) and has been tested on Jio and Airtel 5G networks.' },
  { q: 'Is the charger included in the box?', a: 'A 100W charger is included in India. Some international variants ship with a lower-wattage brick.' },
  { q: 'How does the 2-year warranty work?', a: 'The first year is the standard manufacturer warranty; the second is an extended warranty registered automatically when you buy from an authorised retailer.' },
  { q: 'Will the price drop during festive sales?', a: 'Our 30-day forecast is flat. Historically this model dropped ~4% during Diwali — set a price alert and we’ll notify you.' },
];

export const VIDEOS = [
  { title: 'iPhone 17 Pro — 2 weeks later, honest review', creator: 'TechDesk India', duration: '12:41', views: '842K' },
  { title: 'iPhone 17 Pro vs Zenith Ultra: which to buy?', creator: 'GadgetGuru', duration: '9:08', views: '1.2M' },
  { title: 'Real battery & charging test (100W)', creator: 'Mint Mobiles', duration: '7:22', views: '318K' },
  { title: 'Camera deep-dive: is the ultrawide a dealbreaker?', creator: 'ShotOnReview', duration: '14:55', views: '196K' },
];

export const TICKERS = [
  'Someone in Pune just checked iPhone 17 Pro',
  'Nova Edge 5G price dropped ₹1,500 — 2 minutes ago',
  '312 people are comparing smartphones right now',
  'A verified reviewer in Jaipur rated Lumen X2 ★4.6',
  'Vista Mirrorless X hit its lowest price in 90 days',
];

export const LANDING_CATEGORIES = [
  { name: 'Mobiles & Wearables', icon: '📱', count: '184k', key: 'Mobiles' },
  { name: 'Computers', icon: '💻', count: '96k', key: 'Laptops' },
  { name: 'Audio', icon: '🎧', count: '52k', key: 'Audio' },
  { name: 'Cameras', icon: '📷', count: '31k', key: 'Cameras' },
  { name: 'Home & Kitchen', icon: '🏠', count: '210k', key: 'Home' },
  { name: 'Watches', icon: '⌚', count: '19k', key: 'Wearables' },
  { name: 'Grocery', icon: '🛒', count: '48k', key: 'grocery' },
  { name: 'Beauty & Care', icon: '🧴', count: '128k', key: 'All' },
] as const;

export const productBySlug = (slug?: string): Product => PRODUCTS.find(p => p.slug === slug) ?? PRODUCTS[0];
