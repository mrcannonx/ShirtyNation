-- Price comparison cache
create table if not exists price_comparisons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  comparisons jsonb not null default '[]',
  query_used text,
  created_at timestamptz default now(),
  unique(product_id)
);

create index if not exists idx_price_comparisons_product on price_comparisons(product_id);

alter table price_comparisons enable row level security;

create policy "Price comparisons are viewable by everyone"
  on price_comparisons for select using (true);

create policy "Price comparisons are writable by service role"
  on price_comparisons for insert to service_role with check (true);

create policy "Price comparisons are updatable by service role"
  on price_comparisons for update to service_role using (true);
