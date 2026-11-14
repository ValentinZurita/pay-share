create table tables (
  id   serial primary key,
  name text not null
);

create table bills (
  id          serial primary key,
  table_id    int not null references tables(id),
  total_cents int not null check (total_cents > 0),
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);
-- Solo una cuenta abierta por mesa
create unique index one_open_bill_per_table on bills(table_id) where status = 'open';

create table payments (
  id                 serial primary key,
  bill_id            int not null references bills(id),
  amount_cents       int not null check (amount_cents > 0),   -- parte (venta)
  tip_cents          int not null default 0 check (tip_cents >= 0),
  charged_cents      int not null check (charged_cents > 0),  -- lo que realmente se pidió a Pey (1 en DEMO_MODE)
  payer_name         text check (char_length(payer_name) <= 20),  -- opcional: "Miguel pagó $200"
  method             text not null check (method in ('qr','pn')),
  status             text not null default 'pending' check (status in ('pending','paid')),
  pey_qr_id          text unique,   -- id del QR (codiQrId en el webhook)
  pey_transaction_id text unique,   -- transactionId de Pey
  expires_at         timestamptz,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);
create index payments_bill_idx on payments(bill_id);

insert into tables(name) select 'Mesa ' || g from generate_series(1,6) g;

-- Seguridad: la llave pública solo lee
alter table tables   enable row level security;
alter table bills    enable row level security;
alter table payments enable row level security;
create policy read_tables   on tables   for select to anon using (true);
create policy read_bills    on bills    for select to anon using (true);
create policy read_payments on payments for select to anon using (true);

-- Tiempo real
alter publication supabase_realtime add table bills, payments;
