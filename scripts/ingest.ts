import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { classifyListing } from '../lib/search/classifier';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function processExistingListings() {
  console.log('Fetching raw listings from database...');
  
  const { data: listings, error: fetchErr } = await supabase
    .from('grocery_listings')
    .select('*')
    .is('match_confidence', null);

  if (fetchErr) {
    console.error('Error fetching listings:', fetchErr);
    return;
  }

  if (!listings || listings.length === 0) {
    console.log('No unprocessed listings found. Everything is up to date.');
    return;
  }

  console.log(`Found ${listings.length} items to process. Starting AI ingestion (Rate limited to ~30 RPM for Groq free tier)...`);

  for (const item of listings) {
    try {
      console.log(`\n🧠 Classifying: "${item.title}"...`);
      const classified = await classifyListing(item.title);
      
      if (!classified) {
        console.log(`⚠️ Skipped (Classification failed): ${item.title}`);
        await delay(2000); 
        continue;
      }

      console.log(`✅ Classified as: ${classified.brand} ${classified.variant} (${classified.base_qty}${classified.base_unit})`);

      // 1. UPSERT CONCEPT
      let { data: concept } = await supabase
        .from('grocery_concepts')
        .select('id').eq('slug', classified.concept_slug).single();

      if (!concept) {
        const { data: newConcept, error: cErr } = await supabase
          .from('grocery_concepts')
          .insert({ slug: classified.concept_slug, kind: 'category_inferred' })
          .select('id').single();
        if (cErr) throw cErr;
        concept = newConcept;
      }

      // 2. UPSERT CANONICAL PRODUCT
      const normalizedSize = `${classified.base_qty}${classified.base_unit}`;
      let { data: product } = await supabase
        .from('grocery_products')
        .select('id')
        .eq('brand', classified.brand)
        .eq('variant', classified.variant)
        .eq('normalized_size', normalizedSize)
        .single();

      if (!product) {
        const { data: newProduct, error: pErr } = await supabase
          .from('grocery_products')
          .insert({ brand: classified.brand, variant: classified.variant, normalized_size: normalizedSize })
          .select('id').single();
        if (pErr) throw pErr;
        product = newProduct;
      }

      // 3. UPDATE EXISTING LISTING
      const unitPrice = item.price / (classified.base_qty || 1);
      
      const { error: lErr } = await supabase
        .from('grocery_listings')
        .update({
          product_id: product.id,
          concept_id: concept.id,
          form: classified.form,
          is_organic: classified.is_organic,
          base_qty: classified.base_qty,
          base_unit: classified.base_unit,
          unit_price: unitPrice,
          match_confidence: classified.confidence || 0.9
        })
        .eq('id', item.id);

      if (lErr) throw lErr;

      console.log(`💾 Updated DB entry for: ${item.retailer} - ${item.sku}`);

      // Wait 2 seconds to keep Groq free tier happy (~30 RPM)
      await delay(3500);

    } catch (err) {
      console.error(`❌ DB Error on SKU ${item.sku}:`, err);
      await delay(3500);
    }
  }
  console.log('\nIngestion complete.');
}

processExistingListings();