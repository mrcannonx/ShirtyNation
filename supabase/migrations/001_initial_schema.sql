-- RackHaul Database Schema

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  category text not null default 'other',
  brand text,
  size text,
  condition text not null default 'New with Tags',
  images text[] default '{}',
  in_stock boolean default true,
  featured boolean default false,
  created_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  status text not null default 'pending',
  tracking_number text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_in_stock on products(in_stock);
create index if not exists idx_products_featured on products(featured);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- RLS Policies
alter table products enable row level security;
alter table orders enable row level security;

-- Products: anyone can read, only authenticated users can write
create policy "Products are viewable by everyone"
  on products for select using (true);

create policy "Products are editable by authenticated users"
  on products for insert to authenticated with check (true);

create policy "Products are updatable by authenticated users"
  on products for update to authenticated using (true);

create policy "Products are deletable by authenticated users"
  on products for delete to authenticated using (true);

-- Orders: only authenticated users can read/write
create policy "Orders are viewable by authenticated users"
  on orders for select to authenticated using (true);

create policy "Orders are insertable by service role"
  on orders for insert to service_role with check (true);

create policy "Orders are updatable by authenticated users"
  on orders for update to authenticated using (true);

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Allow public access to product images
create policy "Product images are publicly accessible"
  on storage.objects for select using (bucket_id = 'products');

create policy "Authenticated users can upload product images"
  on storage.objects for insert to authenticated with check (bucket_id = 'products');

create policy "Authenticated users can update product images"
  on storage.objects for update to authenticated using (bucket_id = 'products');

create policy "Authenticated users can delete product images"
  on storage.objects for delete to authenticated using (bucket_id = 'products');
