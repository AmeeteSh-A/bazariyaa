import Landing from '@/views/Landing';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 300;

const LANDING_CATEGORIES = [
  { name: 'Mobiles & Wearables', icon: '📱', count: '184k', key: 'Mobiles' },
  { name: 'Computers', icon: '💻', count: '96k', key: 'Laptops' },
  { name: 'Audio', icon: '🎧', count: '52k', key: 'Audio' },
  { name: 'Cameras', icon: '📷', count: '31k', key: 'Cameras' },
  { name: 'Home & Kitchen', icon: '🍳', count: '210k', key: 'Home' },
  { name: 'Watches', icon: '⌚', count: '19k', key: 'Wearables' },
  { name: 'Grocery', icon: '🛒', count: '48k', key: 'grocery' }
];

const TESTIMONIALS = [
  { name: 'Ananya Rao', initials: 'AR', avatar: '#5433EB', badge: 'Verified', meta: 'Mumbai, MH', stars: 5, helpful: 421, date: '12 Jul 2026', platform: 'Flipkart', product: 'iPhone 17 Pro', text: 'I researched for three weeks before landing here. The price-history graph proved the festive drop was real, and the score matched my month of real-world use exactly. Zero regrets.' },
  { name: 'Rohit Mehta', initials: 'RM', avatar: '#332F2D', badge: 'Verified', meta: 'Bengaluru, KA', stars: 4, helpful: 198, date: '3 Jul 2026', platform: 'Amazon', product: 'Nova Edge 5G', text: 'Bought on the strength of the Value Score and it was spot on. Bazariyaa flagged the weaker second camera upfront, so no nasty surprises.' },
  { name: 'Priya Nair', initials: 'PN', avatar: '#1F7A5A', badge: 'Verified', meta: 'Kochi, KL', stars: 5, helpful: 312, date: '28 Jun 2026', platform: 'Tata CLiQ', product: 'Breeze Air Fryer 5L', text: 'The price timeline made an inflated sale obvious and helped me wait two weeks for the genuine low.' }
];

const LANDING_FAQS = [
  { q: 'How is the recommendation score calculated?', a: 'It blends verified review sentiment, value-for-money against similar products, price fairness versus history, warranty and reliability signals. Weights are published and identical for every product — brands cannot buy a better score.' },
  { q: 'Do brands pay to rank higher?', a: 'Never. Rankings are driven purely by data and verified reviews. We may earn a small affiliate commission if you buy through a store link, but it never changes a score or verdict.' },
  { q: 'How do you detect fake reviews?', a: 'Our Review Trust Score flags coordinated posting patterns, unverified purchases and language anomalies. Only reviews that clear the check count toward a rating.' },
  { q: 'Where does the price history come from?', a: 'We track prices across major Indian retailers multiple times a day and store the full history. That powers the best time to buy verdict and price-drop alerts.' },
  { q: 'Is Bazariyaa free to use?', a: 'Yes, completely free. Search, compare, read reviews and set price alerts without paying or creating an account.' }
];

export default async function Page() {
  const supabase = serverSupabase();
  let live: ReturnType<typeof toUiProduct>[] = [];
  
  if (supabase) {
    const { data: rawProducts } = await supabase
      .from('raw_products')
      .select('id, data')
      .limit(100);

    if (rawProducts && rawProducts.length > 0) {
      const ids = rawProducts.map(p => p.id);

      const { data: historyData } = await supabase
        .from('raw_price_history')
        .select('id, data')
        .in('id', ids);

      const historyMap = new Map((historyData || []).map(h => [h.id, h.data]));

      const allNormalized = rawProducts.map(row => {
        const hist = historyMap.get(row.id) || null;
        return normalizeProduct(row.data, hist, row.id);
      });

      allNormalized.sort((a, b) => b.buy - a.buy);

      live = allNormalized.slice(0, 24).map(dbProd => toUiProduct(dbProd));
    }
  }
  
  return (
    <Landing 
      liveProducts={live} 
      categories={LANDING_CATEGORIES}
      testimonials={TESTIMONIALS as any[]}
      faqs={LANDING_FAQS}
    />
  );
}