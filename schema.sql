-- Smart Restaurant schema for Supabase
create extension if not exists pgcrypto;

create table if not exists public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default 'Restaurant',
  logo_url text,
  address text,
  phone text,
  email text,
  currency text not null default 'INR',
  tax_rate numeric not null default 5,
  discount_rate numeric not null default 0,
  language_preference text not null default 'en',
  theme text not null default 'cobalt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ta text,
  created_at timestamptz not null default now()
);

insert into public.menu_categories (slug, name_en, name_ta) values
  ('breakfast', 'Breakfast', 'காலை உணவு'),
  ('meals', 'Meals', 'சாப்பாடு'),
  ('biriyani', 'Biriyani', 'பிரியாணி'),
  ('snacks', 'Snacks', 'சிற்றுண்டி'),
  ('drinks', 'Drinks', 'பானங்கள்'),
  ('desserts', 'Desserts', 'இனிப்புகள்')
on conflict (slug) do nothing;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete set null,
  name_en text not null,
  name_ta text,
  description_en text,
  description_ta text,
  image_url text,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  qr_code text,
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved')),
  created_at timestamptz not null default now()
);

insert into public.restaurant_tables (table_number)
select generate_series(1, 5)
on conflict (table_number) do nothing;

create table if not exists public.dining_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.restaurant_tables(id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.dining_sessions
  drop constraint if exists dining_sessions_table_id_fkey;
alter table public.dining_sessions
  add constraint dining_sessions_table_id_fkey
  foreign key (table_id) references public.restaurant_tables(id) on delete set null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.dining_sessions(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  order_number text not null unique,
  status text not null default 'placed' check (status in ('placed', 'cooking', 'ready', 'served', 'cancelled')),
  instructions text,
  total_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial')),
  payment_method text check (payment_method in ('cash', 'upi', 'card')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name_en text not null,
  item_name_ta text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.dining_sessions(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  total_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  payment_method text check (payment_method in ('cash', 'upi', 'card')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'kitchen', 'cashier')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_orders_session on public.orders(session_id);
create index if not exists idx_orders_table on public.orders(table_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_dining_sessions_table on public.dining_sessions(table_id);

create or replace function public.has_staff_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active
      and role = any(required_roles)
  );
$$;

grant execute on function public.has_staff_role(text[]) to anon, authenticated;

create or replace function public.place_order(
  p_order_number text,
  p_table_number integer,
  p_instructions text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_table_id uuid;
  created_order public.orders%rowtype;
  menu_item public.menu_items%rowtype;
  item_payload jsonb;
  item_quantity integer;
  order_subtotal numeric(10,2) := 0;
  order_tax numeric(10,2) := 5;
  order_items_json jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Order items must be an array';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'An order must contain at least one item';
  end if;

  select id into target_table_id
  from public.restaurant_tables
  where table_number = p_table_number;

  if target_table_id is null then
    raise exception 'Table % does not exist', p_table_number;
  end if;

  insert into public.orders (order_number, table_id, status, instructions, total_amount, payment_status)
  values (p_order_number, target_table_id, 'placed', coalesce(p_instructions, ''), 0, 'pending')
  returning * into created_order;

  for item_payload in select value from jsonb_array_elements(p_items) as items(value)
  loop
    item_quantity := (item_payload->>'quantity')::integer;

    if item_quantity < 1 then
      raise exception 'Item quantity must be positive';
    end if;

    select * into menu_item
    from public.menu_items
    where id = (item_payload->>'id')::uuid
      and is_active
    for update;

    if not found then
      raise exception 'A selected menu item is unavailable';
    end if;

    if menu_item.stock < item_quantity then
      raise exception 'Insufficient stock for %', menu_item.name_en;
    end if;

    order_subtotal := order_subtotal + menu_item.price * item_quantity;

    insert into public.order_items (
      order_id,
      menu_item_id,
      item_name_en,
      item_name_ta,
      quantity,
      unit_price,
      subtotal
    ) values (
      created_order.id,
      menu_item.id,
      menu_item.name_en,
      menu_item.name_ta,
      item_quantity,
      menu_item.price,
      menu_item.price * item_quantity
    );

    update public.menu_items
    set stock = stock - item_quantity,
        updated_at = now()
    where id = menu_item.id;
  end loop;

  select coalesce((
    select tax_rate
    from public.restaurant_settings
    order by created_at
    limit 1
  ), 5) into order_tax;

  update public.orders
  set total_amount = order_subtotal * (1 + order_tax / 100),
      updated_at = now()
  where id = created_order.id
  returning * into created_order;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', menu_item_id,
    'name', item_name_en,
    'tamilName', coalesce(item_name_ta, ''),
    'quantity', quantity,
    'unitPrice', unit_price
  )), '[]'::jsonb) into order_items_json
  from public.order_items
  where order_id = created_order.id;

  return jsonb_build_object(
    'id', created_order.order_number,
    'tableNumber', p_table_number,
    'status', created_order.status,
    'createdAt', created_order.created_at,
    'total', created_order.total_amount,
    'paymentStatus', created_order.payment_status,
    'paymentMethod', 'cash',
    'instructions', created_order.instructions,
    'items', order_items_json
  );
end;
$$;

revoke all on function public.place_order(text, integer, text, jsonb) from public;
grant execute on function public.place_order(text, integer, text, jsonb) to anon, authenticated;

alter table public.restaurant_settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.dining_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.bills enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can read active menu items" on public.menu_items;
drop policy if exists "Staff can manage menu items" on public.menu_items;
drop policy if exists "Public read categories" on public.menu_categories;
drop policy if exists "Staff manage categories" on public.menu_categories;
drop policy if exists "Authenticated users can read tables" on public.restaurant_tables;
drop policy if exists "Staff can manage tables" on public.restaurant_tables;
drop policy if exists "Orders accessible to authenticated users" on public.orders;
drop policy if exists "Kitchen and cashier can insert orders" on public.orders;
drop policy if exists "Staff can update orders" on public.orders;
drop policy if exists "Authenticated users read order items" on public.order_items;
drop policy if exists "Staff manage order items" on public.order_items;
drop policy if exists "Cashiers read bills" on public.bills;
drop policy if exists "Cashiers manage bills" on public.bills;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Public read restaurant settings" on public.restaurant_settings;
drop policy if exists "Admins manage settings" on public.restaurant_settings;
drop policy if exists "Staff read dining sessions" on public.dining_sessions;
drop policy if exists "Admins manage dining sessions" on public.dining_sessions;
drop policy if exists "Staff read orders" on public.orders;
drop policy if exists "Staff update orders" on public.orders;
drop policy if exists "Staff read order items" on public.order_items;
drop policy if exists "Admins manage menu items" on public.menu_items;
drop policy if exists "Admins manage categories" on public.menu_categories;
drop policy if exists "Public read tables" on public.restaurant_tables;
drop policy if exists "Admins manage tables" on public.restaurant_tables;

create policy "Public can read active menu items" on public.menu_items
  for select using (is_active or public.has_staff_role(array['admin']));
create policy "Admins manage menu items" on public.menu_items
  for all using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));
create policy "Public read categories" on public.menu_categories
  for select using (true);
create policy "Admins manage categories" on public.menu_categories
  for all using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));
create policy "Public read tables" on public.restaurant_tables
  for select using (true);
create policy "Admins manage tables" on public.restaurant_tables
  for all using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));
create policy "Staff read dining sessions" on public.dining_sessions
  for select using (public.has_staff_role(array['admin', 'kitchen', 'cashier']));
create policy "Admins manage dining sessions" on public.dining_sessions
  for all using (public.has_staff_role(array['admin'])) with check (public.has_staff_role(array['admin']));
create policy "Staff read orders" on public.orders
  for select using (public.has_staff_role(array['admin', 'kitchen', 'cashier']));
create policy "Staff update orders" on public.orders
  for update using (public.has_staff_role(array['admin', 'kitchen', 'cashier']))
  with check (public.has_staff_role(array['admin', 'kitchen', 'cashier']));
create policy "Staff read order items" on public.order_items
  for select using (public.has_staff_role(array['admin', 'kitchen', 'cashier']));
create policy "Cashiers read bills" on public.bills
  for select using (public.has_staff_role(array['admin', 'cashier']));
create policy "Cashiers manage bills" on public.bills
  for all using (public.has_staff_role(array['admin', 'cashier']))
  with check (public.has_staff_role(array['admin', 'cashier']));
create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles
  for all using (public.has_staff_role(array['admin']))
  with check (public.has_staff_role(array['admin']));
create policy "Public read restaurant settings" on public.restaurant_settings
  for select using (true);
create policy "Admins manage settings" on public.restaurant_settings
  for all using (public.has_staff_role(array['admin']))
  with check (public.has_staff_role(array['admin']));

grant select on public.menu_categories, public.menu_items, public.restaurant_tables, public.restaurant_settings to anon, authenticated;
grant insert, update, delete on public.menu_items, public.menu_categories, public.restaurant_tables, public.restaurant_settings to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, insert, update, delete on public.bills to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read menu images" on storage.objects;
drop policy if exists "Admins can upload menu images" on storage.objects;

create policy "Public can read menu images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'menu-images');

create policy "Admins can upload menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-images' and public.has_staff_role(array['admin']));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_items';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
      execute 'alter publication supabase_realtime add table public.orders';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_items'
    ) then
      execute 'alter publication supabase_realtime add table public.order_items';
    end if;
  end if;
end;
$$;
