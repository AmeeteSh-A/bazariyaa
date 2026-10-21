import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function parseSize(item: any) {
  const rawSize = item.weight || item.size || '';
  const str = String(rawSize).toLowerCase().replace(/\s/g, '');
  const match = str.match(/^([\d.]+)([a-z]+)$/);
  
  if (match) {
    return { value: parseFloat(match[1]), unit: match[2] };
  }
  
  if (typeof item.weight === 'number' && item.uom) {
    return { value: item.weight, unit: item.uom.toLowerCase() };
  }
  
  return { value: null, unit: null };
}

async function uploadProducts(filePath: string) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const items = Array.isArray(data) ? data : [data];

  const payload = items.map(item => {
    const size = parseSize(item);
    return {
      retailer: item.website,
      product_url: item.product_url,
      sku: item.sku || item.product_id || null,
      name: item.name || item.product_name,
      brand: item.brand || null,
      category: item.category || null,
      price: item.current_price || item.price,
      regular_price: item.regular_price || item.msrp_price || null,
      currency: item.currency || 'AED',
      size_value: size.value,
      size_unit: size.unit,
      in_stock: item.in_stock !== undefined ? item.in_stock : item.stock_status === 'In Stock',
      image_url: item.main_image || item.product_image || (item.images && item.images[0]) || null,
      raw_data: item
    };
  });

  const { error } = await supabase.from('grocery_products').insert(payload);
  if (error) throw error;
}

const CATEGORIES = [
  { cat: 'produce', name: 'Fresh Produce', icon: '🥦', tint: '#E4EFDE', count: 320 },
  { cat: 'dairy', name: 'Dairy & Breakfast', icon: '🥛', tint: '#EDE9FC', count: 148 },
  { cat: 'oils', name: 'Oils, Ghee & Masala', icon: '🛢️', tint: '#F0EAD6', count: 214 },
  { cat: 'staples', name: 'Rice, Atta & Pulses', icon: '🌾', tint: '#F5EFD6', count: 176 },
  { cat: 'snacks', name: 'Snacks & Biscuits', icon: '🍪', tint: '#F6E2DC', count: 260 },
  { cat: 'beverages', name: 'Beverages', icon: '🧃', tint: '#E4EFDE', count: 190 },
  { cat: 'frozen', name: 'Frozen Foods', icon: '🧊', tint: '#E0EAF6', count: 84 },
  { cat: 'personal', name: 'Personal Care', icon: '🧴', tint: '#F6E0EC', count: 210 },
  { cat: 'household', name: 'Household', icon: '🧽', tint: '#E0EAF6', count: 168 },
  { cat: 'baby', name: 'Baby Care', icon: '🍼', tint: '#EDE9FC', count: 72 }
];

async function uploadCategories() {
  const { error } = await supabase.from('grocery_categories').upsert(CATEGORIES);
  if (error) throw error;
}

async function run() {
  try {
    await uploadCategories();
    
    const files = [
      'alnamoosfresh_products.json',
      'barakat_parsed_products.json',
      'bigfresh_06_10_2026.json',
      'falconfresh_06_10_2026.json',
      'razitrade_products.json'
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        await uploadProducts(file);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();