# Bazariyaa — Design System

India's honest product-discovery & price-comparison platform. Calm, content-first, trustworthy. One accent colour; borders over shadows; typography leads the hierarchy.

_Last updated: 19 Oct 2026_

---

## 1. Brand

| Asset | File | Use |
|---|---|---|
| Logo (dark text) | `assets/logo.png` (252×68) | All headers, light backgrounds — render at `height: 30px` |
| Logo (white text) | `assets/logo-white.png` | Dark footers (`#332F2D`) |
| Grocery hero banner | `assets/grocery/hero-banner.png` | Grocery Search hero, right column |
| Grocery pack shots | `assets/grocery/*.png` | Product cards (contain-fit on white) |

Voice: plain, helpful, honest. Never hype. Numbers over adjectives ("Lowest in 3 months", "Save ₹1,500").

---

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F2F4F5` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs |
| `ink` | `#000000` | Primary text |
| `ink-2` | `#1A1A1A` | Long-form body |
| `muted` | `#787574` | Secondary text |
| `faint` | `#A5A2A6` | Tertiary text, struck MRP |
| `border` (Zinc-200) | `#E4E4E7` | **Default 1px card / input border** |
| `border-hover` | `#D4D4D8` | Hover border |
| `divider` | `#F0F0F1` | Inner row dividers |
| `fill-soft` | `#F7F7F8` | Info blocks, chips |
| `violet` (primary) | `#5433EB` | Primary CTAs, active states, links, focus |
| `violet-hover` | `#3F24C0` | CTA hover |
| `violet-wash` | `#EDE9FC` | Selected chips, badges |
| `violet-border` | `#C9BEF5` | Selected outline |
| `green` | `#1F7A5A` | Savings, "Lowest price", verified |
| `green-wash` | `#E4EFDE` | Discount pill bg |
| `slate` | `#332F2D` | Dark footer / stats band |
| `black-bar` | `#000000` | Top announcement bar |

Rules: violet is selective — CTAs, active, selected, links, focus only. No gradients except the subtle hero tint. Text ≥ 4.5:1 contrast.

Category tile tints (Grocery): `#E4EFDE` `#F6E2DC` `#EDE9FC` `#F5EFD6` `#F0EAD6` `#F6E0EC` `#E0EAF6`.

---

## 3. Typography

Font: **Inter** (400 / 500 / 600) via Google Fonts. Body tracking `-0.011em`.

| Role | Size / Weight / Tracking |
|---|---|
| Hero H1 | 44–60px / 600 / -0.035em, line-height 1.02–1.05 |
| Section H2 | 28–38px / 600 / -0.035em |
| Card H2 | 20px / 600 / -0.03em |
| Eyebrow | 12px / 600 / uppercase / violet |
| Body L | 17–18px / 400 / -0.014em / line-height 1.45 |
| Body | 14–15px / 400–500 |
| Meta | 12–13px / 400 / muted |
| Price | 19–32px / 600 / -0.03 → -0.04em |

---

## 4. Spacing, radius, elevation

- **8px grid**: 8 · 16 · 24 · 32 · 48 · 64 · 80
- Page gutter: `32px`; content max-width `1200px` (Landing/Product) or `1360px` (Grocery)
- Section padding: `64px` vertical (80 for signature sections)
- Card padding: `24px` (compact cards 16–20px)
- Radius: pill `9999px` · card `20–24px` · tile/image `14–16px` · chip `8–12px`
- Elevation: **none by default** — `1px solid #E4E4E7`. Hover only: `0 8px 24px rgba(0,0,0,.05)` + `translateY(-2px)`. Overlays/dropdowns: `0 8px 24px rgba(0,0,0,.08)`.

---

## 5. Components

| Component | Spec |
|---|---|
| **Primary button** | violet bg, white 14–15px/600, pill, `10–13px × 18–22px` padding |
| **Secondary button** | white bg, 1px Zinc-200, black text, pill |
| **Chip** | 13–14px/500, pill, white + border; selected = violet-wash bg + violet text (or solid violet for primary filters) |
| **Search bar** | white pill, 1px border, search icon left, violet circular/pill submit right; focus border violet |
| **Product card (Landing)** | image 4:3, "👍 96% Recommended" badge, name, rating, price + MRP, sparkline, violet **Buy now** |
| **Grocery card (horizontal)** | `[product 1.7fr | price 116px | retailers 1fr | CTA 148px]`; image box 140×156 white + border; heart = 32px white circle top-right inside image; variant chips; info blocks (unit price, attribute, rating, best value); retailer mini-cards with LOWEST PRICE; "Add to Cart · ₹x at Store" |
| **Retailer chip** | 11px/600, hover → dark tooltip with price + status; lowest = violet |
| **Buy box (PDP)** | price 32px, MRP struck, discount pill (green) with hover saving, "Buy now — ₹x at Store", "Add to compare" |
| **Comparison matrix** | white card, frozen first column (current PDP product), BEST pill per winning row, + Add product |
| **FAQ accordion** | white card, 1px border, `+` rotates 45° when open |
| **Image slot** | `image-slot.js` drop target; transparent when filled |
| **Floating compare** | fixed bottom-right violet pill with count; hidden at 0 |

Icons: 1.75–2px stroke line icons (Lucide-style), `currentColor` or violet.

---

## 6. Motion

Subtle and purposeful. 160–250ms ease. Hover lift 2px, image zoom 1.07, fade-up 8–14px on load, pulse only on "LIVE". Respect `prefers-reduced-motion`.

---

## 7. Responsive

- ≤1180px: grocery cards → 2 columns (product spans full width)
- ≤960px: hero graphics hide, hero stacks
- ≤640px: grocery cards → 1 column; unit price always visible (no hover)
- ≤560px: category tiles → 2 columns
