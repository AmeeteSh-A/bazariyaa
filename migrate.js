require('dotenv').config();
const fs = require('fs');
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

async function processProductFile(filePath) {
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

            let variants = item.variants || item.variant_info || [];
            if (item.attributes && item.attributes.all_variants) variants = item.attributes.all_variants;

            let inStock = true;
            if (item.in_stock !== undefined) {
                inStock = Boolean(item.in_stock);
            } else if (item.stock_status) {
                inStock = String(item.stock_status).toLowerCase().includes('in stock');
            }

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
                variants: variants
            });

            offersBatch.push({
                product_id: id,
                retailer: String(item.site_name || item.website_name || item.website || 'Store'),
                price: price,
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
            console.error(`Skipped a row in ${filePath} due to error:`, err.message);
        }
    }

    if (productsBatch.length > 0) {
        await supabase.from('products').upsert(productsBatch, { onConflict: 'id' });
        await supabase.from('product_offers').insert(offersBatch);
    }
    console.log(`Finished processing products from ${filePath}`);
}

async function processHistoryFile(filePath) {
    const records = loadRecords(filePath);
    let historyBatch = [];

    for (const item of records) {
        try {
            const productId = String(item.product_id || item._id);
            if (!item.history || !Array.isArray(item.history)) continue;

            for (const record of item.history) {
                const price = getNum(record.price);
                if (price > 0) {
                    historyBatch.push({
                        product_id: productId,
                        recorded_at: getDate(record.timestamp),
                        price: price
                    });
                }

                if (historyBatch.length >= BATCH_SIZE) {
                    await supabase.from('product_price_history').insert(historyBatch);
                    historyBatch = [];
                }
            }
        } catch (err) {
            console.error(`Skipped a row in ${filePath} due to error:`, err.message);
        }
    }

    if (historyBatch.length > 0) {
        await supabase.from('product_price_history').insert(historyBatch);
    }
    console.log(`Finished processing history from ${filePath}`);
}

async function runMigration() {
    try {
        await processProductFile('./electronics_data/bazaria_raw/product_details.json');
        await processProductFile('./perfume_data/Fulll_PDP_Details.json');
        await processProductFile('./grocery/alnamoosfresh_products.json');
        await processProductFile('./grocery/barakat_parsed_products.json');
        await processProductFile('./grocery/bigfresh_06_10_2026.json');
        await processProductFile('./grocery/falconfresh_06_10_2026.json');
        await processProductFile('./grocery/razitrade_products.json');

        await processHistoryFile('./electronics_data/bazaria_raw/product_price_history.json');
        await processHistoryFile('./perfume_data/pricehistory.json');
        
        console.log('Database Migration Complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();