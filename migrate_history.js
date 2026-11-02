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
            if (item.url) {
                productId = item.url;
            } else if (item.site_name && item.product_id) {
                productId = `${item.site_name}_${item.product_id}`.toLowerCase();
            }

            if (!item.history || !Array.isArray(item.history)) continue;

            item.history.sort((a, b) => new Date(getDate(a.timestamp)) - new Date(getDate(b.timestamp)));

            const prices = [];
            for (const record of item.history) {
                const price = getNum(record.price);
                if (price > 0) {
                    if (prices.length === 0 || prices[prices.length - 1] !== price) {
                        prices.push(price);
                    }
                }
            }

            const sparkline = prices.slice(-30);

            if (sparkline.length > 0) {
                historyBatch.push({
                    id: productId,
                    history: sparkline
                });
            }

            if (historyBatch.length >= BATCH_SIZE) {
                const { error } = await supabase.rpc('bulk_update_history', { payload: historyBatch });
                if (error) console.error('Supabase RPC Error:', error.message);
                else updatedCount += historyBatch.length;
                
                historyBatch = [];
            }
        } catch (err) {
            console.error(`Skipped a row due to parse error:`, err.message);
        }
    }

    if (historyBatch.length > 0) {
        const { error } = await supabase.rpc('bulk_update_history', { payload: historyBatch });
        if (error) console.error('Supabase RPC Error:', error.message);
        else updatedCount += historyBatch.length;
    }
    
    console.log(`Finished processing ${filePath}. Total updated: ${updatedCount}`);
}

async function runMigration() {
    try {
        await processHistoryFileStream('./electronics_data/bazaria_raw/product_price_history.json');
        await processHistoryFileStream('./perfume_data/pricehistory.json');
        
        console.log('Price History Migration Complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();