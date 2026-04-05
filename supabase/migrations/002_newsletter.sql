-- Newsletter subscribers
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;

-- Anyone can subscribe (insert), only authenticated can read/delete
create policy "Anyone can subscribe to newsletter"
  on newsletter_subscribers for insert to service_role with check (true);

create policy "Authenticated users can view subscribers"
  on newsletter_subscribers for select to authenticated using (true);

create policy "Authenticated users can delete subscribers"
  on newsletter_subscribers for delete to authenticated using (true);
