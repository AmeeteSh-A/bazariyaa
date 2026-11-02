import { getSearchResults } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

export const revalidate = 0; 

const FILTER_CATEGORIES = ['All', 'Mobiles', 'Laptops', 'Audio', 'Wearables', 'Cameras', 'Home', 'Health, Fitness & Beauty'];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; min?: string; max?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || 'All';
  const minPrice = parseInt(params.min || '0');
  const maxPrice = parseInt(params.max || '999999');

  // Simply call the abstracted API service
  const results = await getSearchResults({ q, category, minPrice, maxPrice });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* FILTER SIDEBAR */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <form method="GET" action="/search" className="sticky top-24 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
          <input type="hidden" name="q" value={q} />
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Category</h3>
            <div className="space-y-3">
              {FILTER_CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat} 
                    defaultChecked={category === cat}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Price Range (AED)</h3>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                name="min" 
                placeholder="Min" 
                defaultValue={minPrice > 0 ? minPrice : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="number" 
                name="max" 
                placeholder="Max" 
                defaultValue={maxPrice < 999999 ? maxPrice : ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
            Apply Filters
          </button>
        </form>
      </aside>

      {/* RESULTS GRID */}
      <main className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {q ? `Results for "${q}"` : 'All Products'}
          </h1>
          <span className="text-gray-500 text-sm">{results.length} products found</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(product => (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <ProductCard p={product} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your filters or searching for a broader term.</p>
          </div>
        )}
      </main>
    </div>
  );
}