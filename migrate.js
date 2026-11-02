require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const BATCH_SIZE = 250;

function getNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    if (val.$numberDouble) return parseFloat(val.$numberDouble) || 0;
    if (val.$numberInt) return parseFloat(val.$numberInt) || 0;
    if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
    return 0;
}

function getDate(val) {
    if (!val) return new Date().toISOString();
    if (val.$date && val.$date.$numberLong) return new Date(parseInt(val.$date.$numberLong)).toISOString();
    return new Date(val).toISOString();
}

function loadRecords(filePath) {
    console.log(`Loading ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (content.startsWith('[')) {
        return JSON.parse(content);
    } else {
        return content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    }
}

async function processGroceryFile(filePath) {
    const records = loadRecords(filePath);
    let batch = [];

    for (const item of records) {
        try {
            let sizeValue = 1;
            let sizeUnit = 'pc';
            const rawSize = item.weight || item.size || item.uom || item.attributes?.Weight || '';
            const sizeMatch = String(rawSize).match(/([\d.]+)\s*(g|kg|ml|l|pc|pcs|pkt)/i);
            
            if (sizeMatch) {
                sizeValue = parseFloat(sizeMatch[1]);
                sizeUnit = sizeMatch[2].toLowerCase();
            }

            let inStock = true;
            if (item.in_stock !== undefined) inStock = Boolean(item.in_stock);
            else if (item.stock_status) inStock = String(item.stock_status).toLowerCase().includes('in stock');

            batch.push({
                retailer: item.website || item.retailer || 'Store',
                product_url: item.product_url || '#',
                sku: String(item.sku || item.product_id || ''),
                name: item.name || item.product_name || 'Unknown',
                brand: item.brand || 'Unknown',
                category: item.category || 'Grocery',
                price: getNum(item.current_price || item.price),
                regular_price: getNum(item.regular_price || item.msrp_price || item.price),
                currency: item.currency || 'AED',
                size_value: sizeValue,
                size_unit: sizeUnit,
                in_stock: inStock,
                image_url: item.main_image || item.product_image || (item.images && item.images[0]) || null
            });

            if (batch.length >= BATCH_SIZE) {
                await supabase.from('grocery_products').insert(batch);
                batch = [];
            }
        } catch (err) {
            console.error(`Skipped grocery row in ${filePath}:`, err.message);
        }
    }

    if (batch.length > 0) {
        await supabase.from('grocery_products').insert(batch);
    }
    console.log(`Finished processing groceries from ${filePath}`);
}

async function processTechFile(filePath) {
    const records = loadRecords(filePath);
    let productsBatch = [];
    let offersBatch = [];

    for (const item of records) {
        try {
            const id = String(item._id?.$oid || item._id || item.product_id || item.url);
            if (!id || id === 'undefined') continue;

            let category = 'Uncategorized';
            if (item.category1) category = item.category1;
            else if (item.category && typeof item.category === 'string') category = item.category;
            else if (item.categories && item.categories.length > 0) {
                category = typeof item.categories[0] === 'string' ? item.categories[0] : item.categories[0].name;
            }

            let inStock = true;
            if (item.in_stock !== undefined) inStock = Boolean(item.in_stock);
            else if (item.stock_status) inStock = String(item.stock_status).toLowerCase().includes('in stock');

            let highlights = item.highlights || item.feature_bullets || [];
            if (typeof highlights === 'string') highlights = [highlights];

            const price = getNum(item.price || item.current_price || item.sale_price);

            productsBatch.push({
                id: id,
                slug: id,
                name: item.product_title || item.product_name || item.name || 'Unknown',
                brand: item.brand || 'Unknown',
                category: category,
                price: price,
                mrp: getNum(item.msrp || item.msrp_price || item.regular_price || item.original_price),
                rating: getNum(item.average_rating || item.rating),
                reviews: String(getNum(item.number_of_reviews || item.review_count || item.reviews)),
                currency: item.currency_code || item.currency || 'AED',
                image: item.main_image || item.product_image || (item.images && item.images[0]) || null,
                description: item.description || item.product_description || item.short_description || null,
                attributes: item.attributes || item.product_specification || item.specifications || {},
                highlights: highlights,
                variants: item.variants || item.variant_info || []
            });

            offersBatch.push({
                product_id: id,
                retailer: String(item.site_name || item.website_name || item.website || 'Store'),
                price: price,
                url: String(item.product_url || item.url || '#'),
                delivery: String(item.standard_delivery?.date || item.delivery_info || 'View on store'),
                in_stock: inStock
            });

            if (productsBatch.length >= BATCH_SIZE) {
                await supabase.from('products').upsert(productsBatch, { onConflict: 'id' });
                await supabase.from('product_offers').insert(offersBatch);
                productsBatch = [];
                offersBatch = [];
            }
        } catch (err) {
            console.error(`Skipped tech row in ${filePath}:`, err.message);
        }
    }

    if (productsBatch.length > 0) {
        await supabase.from('products').upsert(productsBatch, { onConflict: 'id' });
        await supabase.from('product_offers').insert(offersBatch);
    }
    console.log(`Finished processing tech from ${filePath}`);
}

// --- HISTORY PARSER (Delta Compressed) ---
async function processHistoryFileStream(filePath) {
    console.log(`Streaming history from ${filePath}...`);
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let historyBatch = [];
    let updatedCount = 0;

    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === '[' || trimmed === ']') continue;

        try {
            const cleanLine = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
            const item = JSON.parse(cleanLine);

            let productId = String(item.product_id || item._id);
            if (item.url) productId = item.url;
            else if (item.site_name && item.product_id) productId = `${item.site_name}_${item.product_id}`.toLowerCase();

            if (!item.history || !Array.isArray(item.history)) continue;

            item.history.sort((a, b) => new Date(getDate(a.timestamp)) - new Date(getDate(b.timestamp)));

            const prices = [];
            for (const record of item.history) {
                const price = getNum(record.price);
                if (price > 0 && (prices.length === 0 || prices[prices.length - 1] !== price)) {
                    prices.push(price);
                }
            }

            if (prices.length > 0) {
                historyBatch.push({ id: productId, history: prices.slice(-30) });
            }

            if (historyBatch.length >= BATCH_SIZE) {
                const { error } = await supabase.rpc('bulk_update_history', { payload: historyBatch });
                if (!error) updatedCount += historyBatch.length;
                historyBatch = [];
            }
        } catch (err) {
            console.error(`Skipped history row in ${filePath}:`, err.message);
        }
    }

    if (historyBatch.length > 0) {
        await supabase.rpc('bulk_update_history', { payload: historyBatch });
        updatedCount += historyBatch.length;
    }
    console.log(`Finished processing ${filePath}. Total tracked: ${updatedCount}`);
}

// --- EXECUTION MANAGER ---
async function runMigration() {
    try {
        // 1. Tech & Perfumes (Goes to 'products' & 'product_offers')
        await processTechFile('./electronics_data/bazaria_raw/product_details.json');
        await processTechFile('./perfume_data/Fulll_PDP_Details.json');
        
        // 2. Groceries (Goes strictly to 'grocery_products')
        await processGroceryFile('./grocery/alnamoosfresh_products.json');
        await processGroceryFile('./grocery/barakat_parsed_products.json');
        await processGroceryFile('./grocery/bigfresh_06_10_2026.json');
        await processGroceryFile('./grocery/falconfresh_06_10_2026.json');
        await processGroceryFile('./grocery/razitrade_products.json');

        // 3. Attach history directly to Tech 'products' table
        await processHistoryFileStream('./electronics_data/bazaria_raw/product_price_history.json');
        await processHistoryFileStream('./perfume_data/pricehistory.json');
        
        console.log('⚡ All Data Migrated & Separated Successfully ⚡');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();