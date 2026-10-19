# Bazariyaa — Workflow & Page Map

How the pages connect, what each one does, and how to keep this project in sync.

_Last updated: 19 Oct 2026 (ported to Next.js)_

---

## 1. Core user journey

**Discover → Search → Filter → Evaluate → Compare → Trust → Buy**

```
Landing ──search / category──► Product (PDP) ──Buy now──► Retailer
   │                              │
   │                              └─ Comparison Matrix (on PDP)
   │
   └──Grocery──► Grocery (categories) ──tile / search / list──► Grocery Search ──Add to Cart──► Retailer
```

---

## 2. Pages (final set)

| Page | File | Purpose | Key sections |
|---|---|---|---|
| **Home** | `Bazariyaa Landing.dc.html` | Explain Bazariyaa, start search | Announcement bar · header · hero + live trending feed · categories · top-reviewed products (Buy now) · trust scores · best time to buy · community reviews · stats · FAQ · newsletter · footer |
| **Product Detail** | `Bazariyaa Product.dc.html` | Decide confidently on one product (Apple iPhone 17 Pro) | Breadcrumb · gallery + wishlist · variants · buy box · AI summary · pros/cons · price history · retailer prices · specs · reviews · alternatives · **Comparison Matrix** · video reviews · FAQ · sticky buy bar |
| **Grocery** | `Bazariyaa Grocery.dc.html` | Grocery entry | Deliver-to pill · hero search · list input (type/upload/paste/speak) · 12 category tiles (image slots) · footer |
| **Grocery Search** | `Bazariyaa Grocery Search.dc.html` | Compare grocery products by value | Hero + banner · search · list input → whole-basket store totals · vertical category nav · horizontal subcategory chips · horizontal comparison cards (unit price, retailers, Add to Cart) · floating compare |

### Header (all pages)
Logo → Home · Home · Categories · Search · Grocery · (Sign in / Get the app). No Compare link — comparison lives on the PDP.

---

## 3. Link map

| From | Action | To |
|---|---|---|
| Any header | Logo / Home | `Bazariyaa Landing.dc.html` |
| Any header | Categories | `Bazariyaa Landing.dc.html#categories` |
| Any header | Search | `Bazariyaa Landing.dc.html#top` |
| Any header | Grocery | `Bazariyaa Grocery.dc.html` |
| Landing product card | Buy now | `Bazariyaa Product.dc.html` |
| Grocery | Search / list buttons | `Bazariyaa Grocery Search.dc.html` |
| Grocery | Category tile label | `Bazariyaa Grocery Search.dc.html#<category>` |
| PDP / Grocery Search | Floating compare | `Bazariyaa Product.dc.html#compare` |

---

## 4. Data & behaviour

- All data is mocked inside each page's logic class (`PRODUCTS`, `PHONES`, `CATS`, `REVIEWS`…).
- **Comparison Matrix**: first column = the product whose PDP is open; max 4 products; same category only; winner highlighted per row.
- **Unit price**: auto-normalised (`/100ml`, `/100g`, `/kg`, `/pc`); hover reveals on desktop, always visible on mobile.
- **Lowest retailer** is named inside the Buy / Add to Cart CTA.
- **Grocery list**: one item per line → matched products → per-store basket totals → cheapest store + savings.

---

## 5. Assets

```
assets/logo.png            header logo
assets/logo-white.png      footer logo
assets/grocery/*.png       grocery hero banner + pack shots
image-slot.js              drag-and-drop image placeholders (Grocery tiles)
uploads/                   source files from the client
```

Missing real imagery: PDP gallery, video thumbnails, non-oil grocery products (emoji fallback).

---

## 6. Keeping this in sync

Update **DESIGN.md** and **WORKFLOW.md** whenever you:
1. Add, remove or rename a page → update §2 and §3 here.
2. Change header/nav → update §2 "Header".
3. Add or change a colour, type size, radius or component → update DESIGN.md.
4. Add assets → update §5.
5. Bump the `_Last updated_` date on both files.

### Developer handoff (React / Next.js + Tailwind)
- **A working React 18 + TypeScript + Vite build lives in `bazariyaa-react/`** (routes `/`, `/product/:slug`, `/grocery`, `/grocery/:category`). Keep it in sync with the `.dc.html` pages; tokens in `bazariyaa-react/src/styles/tokens.css` mirror DESIGN.md.
- Map DESIGN.md §2 colours to `tailwind.config` `theme.extend.colors`.
- Each `.dc.html` = one route: `/`, `/product/[slug]`, `/grocery`, `/grocery/[category]`.
- Repeated pieces to extract as components: Header, Footer, SearchBar, Chip, ProductCard, GroceryCard, RetailerChip, BuyBox, ComparisonMatrix, FAQ.

## Next.js port (2026-10-19)
- Stack: Next.js App Router (was Vite + React Router). UI = plain CSS tokens (`app/styles/`), no Tailwind.
- Routes: `/` → `app/page.tsx`; `/product/[id]` → static slug first, else Supabase row id; `/grocery`, `/grocery/search`, `/grocery/[category]`; `app/not-found.tsx`.
- Page UIs live in `views/` (client components); `app/**/page.tsx` are thin server wrappers that fetch Supabase and pass props.
- Data: `lib/adapter.ts` (Supabase → DbProduct) → `lib/toUiProduct.ts` (DbProduct → UI Product). Search: `components/SearchBar.tsx` → `/api/search`.
- Grocery pages still use static `data/grocery.ts`.
- `_reference_old_app/` holds the previous Tailwind pages; delete once happy.
