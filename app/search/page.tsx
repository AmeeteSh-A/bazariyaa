import { getSearchResults } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

export const revalidate = 0; 

const DEPARTMENTS = ['All', 'Mobiles', 'Laptops', 'Audio', 'Wearables', 'Cameras', 'Home', 'Health, Fitness & Beauty'];
const PRICE_RANGES = [
  { label: 'Under AED 100', min: 0, max: 100 },
  { label: 'AED 100 to AED 500', min: 100, max: 500 },
  { label: 'AED 500 to AED 2,000', min: 500, max: 2000 },
  { label: 'AED 2,000 & Above', min: 2000, max: 999999 },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = Array.isArray(params.q) ? params.q[0] : params.q || '';
  const category = Array.isArray(params.category) ? params.category[0] : params.category || 'All';
  const minPrice = parseInt((Array.isArray(params.min) ? params.min[0] : params.min) || '0', 10);
  const maxPrice = parseInt((Array.isArray(params.max) ? params.max[0] : params.max) || '999999', 10);
  const minRating = parseInt((Array.isArray(params.rating) ? params.rating[0] : params.rating) || '0', 10);
  const selectedBrands = Array.isArray(params.brand) ? params.brand : (params.brand ? [params.brand] : []);

  const standardKeys = ['q', 'category', 'min', 'max', 'brand', 'rating'];
  const activeSpecs: Record<string, string[]> = {};
  
  Object.keys(params).forEach(k => {
    if (!standardKeys.includes(k) && params[k]) {
      activeSpecs[k] = Array.isArray(params[k]) ? params[k] as string[] : [params[k] as string];
    }
  });

  const results = await getSearchResults({ 
    q, category, minPrice, maxPrice, brands: selectedBrands, minRating, specs: activeSpecs
  });

  const availableBrands = Array.from(new Set(results.map((p: any) => p.brand)))
    .filter(b => b && b !== 'Unknown').slice(0, 20);
  selectedBrands.forEach(sb => { if (!availableBrands.includes(sb)) availableBrands.push(sb); });

  const specAggregator: Record<string, Set<string>> = {};
  
  results.forEach((p: any) => {
    if (p.attributes) {
      Object.entries(p.attributes).forEach(([k, v]) => {
        if (typeof v === 'string' && v.length < 25 && v.trim().length > 0) {
          const cleanKey = k.replace(/[^a-zA-Z0-9 ]/g, '').trim();
          if (cleanKey.toLowerCase().includes('review') || cleanKey.toLowerCase().includes('rank')) return;
          if (!specAggregator[cleanKey]) specAggregator[cleanKey] = new Set();
          specAggregator[cleanKey].add(v.trim());
        }
      });
    }
  });

  const dynamicFilters = Object.entries(specAggregator)
    .filter(([_, values]) => values.size >= 2 && values.size <= 12)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5);

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4 flex flex-col md:flex-row gap-6 items-start">
      
      <aside className="w-full md:w-[220px] flex-shrink-0 text-[13px] text-[#0F1111]">
        <form method="GET" action="/search" className="sticky top-20 flex flex-col gap-4">
          <input type="hidden" name="q" value={q} />
          
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-sm">Filters</h2>
            {q && <Link href={`/search?q=${q}`} className="text-blue-600 hover:text-orange-500 hover:underline">Clear</Link>}
          </div>

          <div>
            <h3 className="font-bold mb-1.5">Department</h3>
            <div className="flex flex-col gap-1.5">
              {DEPARTMENTS.map(cat => (
                <label key={cat} className="flex items-start gap-2 cursor-pointer group">
                  <input type="radio" name="category" value={cat} defaultChecked={category === cat} className="mt-0.5 w-3.5 h-3.5 text-blue-600 focus:ring-0" />
                  <span className={`group-hover:text-orange-600 ${category === cat ? 'font-bold' : ''}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-1.5">Customer Reviews</h3>
            <div className="flex flex-col gap-1.5">
              {[4, 3, 2, 1].map(stars => (
                <label key={stars} className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="rating" value={String(stars)} defaultChecked={minRating === stars} className="w-3.5 h-3.5 text-blue-600 focus:ring-0" />
                  <span className="flex items-center group-hover:text-orange-600">
                    <span className="text-[#FFA41C] text-sm tracking-widest mr-1">{'★'.repeat(stars)}</span>
                    <span className="text-gray-300 text-sm tracking-widest mr-1">{'★'.repeat(5-stars)}</span>
                    & Up
                  </span>
                </label>
              ))}
            </div>
          </div>

          {availableBrands.length > 0 && (
            <div>
              <h3 className="font-bold mb-1.5">Brand</h3>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                {availableBrands.map((brand: any) => (
                  <label key={String(brand)} className="flex items-start gap-2 cursor-pointer group">
                    <input type="checkbox" name="brand" value={String(brand)} defaultChecked={selectedBrands.includes(String(brand))} className="mt-0.5 w-3.5 h-3.5 rounded-sm text-blue-600 focus:ring-0 border-gray-400" />
                    <span className="group-hover:text-orange-600 leading-tight">{String(brand)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold mb-1.5">Price</h3>
            <div className="flex flex-col gap-1.5 mb-2">
              {PRICE_RANGES.map(range => (
                <Link key={range.label} href={`/search?q=${q}&category=${category}&min=${range.min}&max=${range.max}`} className="hover:text-orange-600">
                  {range.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input type="number" name="min" placeholder="Min" defaultValue={minPrice > 0 ? minPrice : ''} className="w-16 px-2 py-1 border border-gray-400 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 shadow-inner" />
              <input type="number" name="max" placeholder="Max" defaultValue={maxPrice < 999999 ? maxPrice : ''} className="w-16 px-2 py-1 border border-gray-400 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 shadow-inner" />
              <button type="submit" className="px-3 py-1 bg-white border border-gray-400 rounded-sm hover:bg-gray-50 shadow-sm">Go</button>
            </div>
          </div>

          {dynamicFilters.map(([specName, specValues]) => {
            const sortedValues = Array.from(specValues as Set<string>).sort();
            return (
              <div key={String(specName)}>
                <h3 className="font-bold mb-1.5">{String(specName)}</h3>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {sortedValues.map((val: any) => (
                    <label key={String(val)} className="flex items-start gap-2 cursor-pointer group">
                      <input type="checkbox" name={String(specName)} value={String(val)} defaultChecked={activeSpecs[String(specName)]?.includes(String(val))} className="mt-0.5 w-3.5 h-3.5 rounded-sm text-blue-600 focus:ring-0 border-gray-400" />
                      <span className="group-hover:text-orange-600 leading-tight">{String(val)}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-2 pb-10">
            <button type="submit" className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full py-1.5 shadow-sm text-sm font-medium transition-colors">
              Apply Filters
            </button>
          </div>
        </form>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mb-4 pb-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {q ? `Results for "${q}"` : 'All Products'}
          </h1>
          <span className="text-sm text-gray-600">Showing {results.length} results</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((product: any) => (
              <div key={product.id} className="h-full w-full">
                <ProductCard p={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">No results for {q}</h3>
            <p className="text-gray-500 mt-2 text-sm">Try checking your spelling or clearing your filters.</p>
            <Link href="/search" className="inline-block mt-4 text-blue-600 hover:text-orange-600 hover:underline text-sm">View all products</Link>
          </div>
        )}
      </main>
    </div>
  );
}