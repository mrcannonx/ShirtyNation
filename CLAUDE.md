# ShirtyNation

## What This Is
Automated AI shirt factory — from design to customer's door. The largest selection of shirts in every niche. GPT-5.4 generates designs, Printify prints & ships, customers browse a premium dark-themed storefront.

## Tech Stack
- **Framework:** Next.js 16.2.2 (React 19, Turbopack)
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide icons
- **Database:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe Checkout
- **Fulfillment:** Printify API (print-on-demand)
- **Hosting:** Vercel
- **Design Generation:** GPT-5.4 image gen (external)

## Supabase Project
- **Project ID:** `eqrjzjdilpopblctnkms`
- **URL:** `https://eqrjzjdilpopblctnkms.supabase.co`
- **Region:** us-west-2
- **Tables:** products, orders, categories, newsletter_subscribers

## Design System
- **Palette:** Dark-first with burnt orange accent
  - Background: `#0A0A0A`, Surface: `#141414`, Elevated: `#1C1C1C`
  - Accent: `#E8630A` (burnt orange), Hover: `#C2410C`
  - Text: `#F5F5F5` / `#A3A3A3` / `#737373` / `#525252`
  - Border: `#262626`
- **Typography:** Inter (font-sans)
- **Logo:** SHIRTY (white) + NATION (orange), font-black

## Key Architecture Patterns
- **POD model:** Products are never "out of stock" — unlimited supply via Printify
- **Status enum:** draft | active | sold_out | archived (not boolean in_stock)
- **Size/Color variants:** Cart items keyed by `productId__size__color`
- **Cart:** localStorage persistence (`shirtynation-cart`)
- **Printify service:** `src/lib/printify.ts` — catalog, upload, create, order
- **Full-text search:** PostgreSQL tsvector on products (name, description, category)
- **Admin auth:** Supabase email/password, middleware-protected /admin/*

## Categories (seeded)
Funny, Motivational, Vintage, Gaming, Sports, Music, Dad Jokes, Coding, Animals, Trending

## Domain
shirtynation.com

## Automated Pipeline
```
GPT-5.4 generates design PNG
  -> Upload to Supabase Storage (designs bucket)
  -> Upload to Printify via API
  -> Create product on Printify with all variants
  -> Save product to Supabase (products table)
  -> Product goes live on storefront

Customer orders on shirtynation.com
  -> Stripe Checkout
  -> Webhook creates order in Supabase
  -> Auto-submit to Printify API
  -> Printify prints & ships
  -> Printify webhook updates tracking
  -> Customer gets shirt
```
