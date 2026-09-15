create schema if not exists practice;

create table if not exists practice.categories (
  category text primary key,
  category_name text not null
);

insert into practice.categories (category, category_name) values
  ('Electronics', '전자기기'),
  ('Apparel',     '의류'),
  ('Home',        '생활'),
  ('Books',       '도서'),
  ('Food',        '식품'),
  ('Sports',      '스포츠'),
  ('Stationery',  '문구')
on conflict (category) do nothing;

create table if not exists practice.price_bands (
  band_id integer primary key,
  band_name text not null,
  min_price numeric(10, 2) not null check (min_price >= 0),
  max_price numeric(10, 2) not null check (max_price >= min_price)
);

insert into practice.price_bands (band_id, band_name, min_price, max_price) values
  (1, 'Budget',    0.00,  29.99),
  (2, 'Standard', 20.00,  79.99),
  (3, 'Premium',  50.00, 199.99)
on conflict (band_id) do nothing;
