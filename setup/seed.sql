create schema if not exists practice;

create table practice.products (
  product_id integer primary key,
  product_name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock_quantity integer not null check (stock_quantity >= 0),
  description text,
  released_at timestamp without time zone not null
);

insert into practice.products (
  product_id,
  product_name,
  category,
  price,
  stock_quantity,
  description,
  released_at
) values
  (1,  'Wireless Mouse',            'Electronics', 29.90,  15, 'Compact wireless mouse', timestamp '2026-08-31 23:59:59'),
  (2,  'Mechanical Keyboard',       'Electronics', 89.00,   8, null,                     timestamp '2026-09-01 00:00:00'),
  (3,  'USB-C Hub',                 'Electronics', 49.50,   0, '',                       timestamp '2026-09-14 09:30:00'),
  (4,  'Noise-Canceling Headphones','Electronics',129.99,   5, 'Over-ear design',        timestamp '2026-09-30 23:59:59'),
  (5,  'Cotton T-Shirt',            'Apparel',     19.90,  30, '  Basic fit  ',           timestamp '2026-08-15 10:00:00'),
  (6,  'Linen Shirt',               'Apparel',     45.00,  12, null,                     timestamp '2026-09-10 10:00:00'),
  (7,  'Running Socks',             'Apparel',     12.50,   0, '',                       timestamp '2026-10-01 00:00:00'),
  (8,  'Desk Lamp',                 'Home',        34.00,   7, 'Warm light',             timestamp '2026-09-05 18:00:00'),
  (9,  'Ceramic Mug',               'Home',        15.00,  20, null,                     timestamp '2026-07-21 09:00:00'),
  (10, 'Storage Basket',            'Home',        22.00,   4, 'Woven basket',           timestamp '2026-09-29 11:00:00'),
  (11, 'SQL Basics',                'Books',       28.00,  11, 'Beginner SQL guide',     timestamp '2026-09-14 23:59:59'),
  (12, 'PostgreSQL Practice',       'Books',       36.50,   6, 'Hands-on workbook',      timestamp '2026-09-15 00:00:00'),
  (13, 'Spring Boot Intro',         'Books',       41.00,   0, '',                       timestamp '2026-08-28 14:00:00'),
  (14, 'Oat Granola',               'Food',         8.90,  25, 'No added sugar',         timestamp '2026-09-03 08:00:00'),
  (15, 'Dark Chocolate',            'Food',         6.50,  40, null,                     timestamp '2026-09-30 08:00:00'),
  (16, 'Coffee Beans',              'Food',        18.00,   9, 'Medium roast',           timestamp '2026-10-01 00:00:00'),
  (17, 'Yoga Mat',                  'Sports',      31.00,  10, 'Non-slip surface',       timestamp '2026-09-12 07:00:00'),
  (18, 'Steel Bottle',              'Sports',      24.00,   0, '750ml',                  timestamp '2026-08-31 00:00:00'),
  (19, 'Trail Backpack',            'Sports',      75.00,   3, '',                       timestamp '2026-09-20 12:00:00'),
  (20, 'Gift Card',                 'Other',       50.00, 100, 'Digital delivery',       timestamp '2026-09-01 12:00:00');
