export interface ClassifiedItem {
  concept_slug: string; 
  concept_name: string; 
  brand: string;        
  variant: string;      
  form: 'fresh' | 'juice' | 'dried' | 'frozen' | 'canned' | 'flavored' | 'powder';
  base_qty: number;     
  base_unit: 'g' | 'kg' | 'ml' | 'L' | 'pc';
  is_organic: boolean;
  confidence: number;   
}

const SYSTEM_PROMPT = `
You are an expert grocery data normalizer for an aggregator platform. 
Your job is to take messy, raw retailer product titles and extract strict, normalized attributes.

RULES:
1. brand: If it is raw produce, meat, or herbs without a clear brand, output "Generic".
2. variant: The absolute bare-minimum clean name of the product. STRIP the brand, size, country of origin (e.g., Australia, Egypt), emojis, and marketing fluff (e.g., "premium quality", "ready to eat", "box", "bundal", "bag").
   - Example: "Carrot premium quality Australia 🇦🇺 - 1 box 9kg" -> variant: "Carrot"
   - Example: "Amul Taaza Milk 1L" -> variant: "Taaza Milk"
   - Example: "Coriander Leaves Chopped 250g" -> variant: "Coriander Leaves"
3. concept_slug: A single, generic lowercase noun identifying the core product family (e.g., "milk", "coriander", "carrot", "apple"). 
4. base_qty & base_unit: Normalize to standard units (g, kg, ml, L, pc). Convert fractions (e.g., 0.5kg -> 500g). If no size is found, default to 1 pc.
5. form: MUST be one of: fresh, juice, dried, frozen, canned, flavored, powder. Default to fresh for produce.
6. is_organic: true only if explicitly stated.

Output ONLY valid JSON matching this schema:
{
  "concept_slug": "string",
  "concept_name": "string",
  "brand": "string",
  "variant": "string",
  "form": "string",
  "base_qty": 0,
  "base_unit": "string",
  "is_organic": false,
  "confidence": 0.95
}
`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function classifyListing(rawTitle: string, retries = 3): Promise<ClassifiedItem | null> {
  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b", 
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Normalize this title: "${rawTitle}"` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`[Attempt ${attempt}] Rate limited. Waiting 5s...`);
          await delay(5000);
          continue;
        }
        console.error("Groq API Error:", await response.text());
        return null;
      }

      const data = await response.json();
      const parsed: ClassifiedItem = JSON.parse(data.choices[0].message.content);
      
      const validUnits = ['g', 'kg', 'ml', 'L', 'pc'];
      if (!validUnits.includes(parsed.base_unit)) parsed.base_unit = 'pc';

      return parsed;
    } catch (error: any) {
      console.warn(`[Attempt ${attempt}] Network error for "${rawTitle}": ${error.message}`);
      if (attempt === retries) return null;
      await delay(3000); 
    }
  }
  return null;
}