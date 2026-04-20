-- ═══════════════════════════════════════════════════════════════
--  01-Wantantan Ramen — Seed Data
-- ═══════════════════════════════════════════════════════════════

USE wantantan_ramen;

-- ─── MENU ITEMS ───
INSERT INTO menu_items (name, category, price, description, image_url, unit_label, is_ramen) VALUES

-- Ramen (Mains)
('Original Tonkotsu', 'mains', 129000,
 'Rich pork bone broth with chashu, soft-boiled egg, and scallions.',
 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=800&auto=format&fit=crop',
 'bowl', TRUE),

('Spicy Miso Ramen', 'mains', 139000,
 'Miso broth, chili oil, sweet corn, bamboo shoots.',
 'https://images.unsplash.com/photo-1772217261042-0175d0b2fcb0?q=80&w=800&auto=format&fit=crop',
 'bowl', TRUE),

('Shoyu Ramen', 'mains', 129000,
 'Soy-based broth with tender chashu and nori.',
 'https://images.unsplash.com/photo-1707322467700-945f9bef9c58?q=80&w=800&auto=format&fit=crop',
 'bowl', TRUE),

-- Sides
('Gyoza (5 pcs)', 'sides', 69000,
 'Pan-fried pork dumplings with tare dipping sauce.',
 'https://images.unsplash.com/photo-1738681336104-608b4e7dc3b0?q=80&w=800&auto=format&fit=crop',
 'plate', FALSE),

('Extra Chashu', 'sides', 35000,
 'Two extra slices of slow-braised pork belly.',
 'https://images.unsplash.com/photo-1768204037765-2c744f4330ca?q=80&w=800&auto=format&fit=crop',
 'add-on', FALSE),

-- Drinks
('Coca-Cola', 'drinks', 45000,
 'Ice-cold Coca-Cola, served chilled.',
 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
 'bottle', FALSE),

('Iced Green Tea', 'drinks', 35000,
 'Refreshing chilled green tea.',
 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=800&auto=format&fit=crop',
 'glass', FALSE),

-- Desserts
('Matcha Cheesecake', 'desserts', 79000,
 'Creamy matcha-infused cheesecake.',
 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=800&auto=format&fit=crop',
 'slice', FALSE),

('Matcha Ice Cream', 'desserts', 59000,
 'Traditional Japanese matcha ice cream.',
 'https://images.unsplash.com/photo-1633933358116-a27b902fad35?q=80&w=800&auto=format&fit=crop',
 'cup', FALSE);

-- ─── TABLES ───
INSERT INTO tables (id, seats, is_occupied) VALUES
('A1', 2, FALSE),
('A2', 2, FALSE),
('A3', 2, FALSE),
('B1', 4, FALSE),
('B2', 4, FALSE),
('B3', 4, FALSE),
('B4', 4, FALSE),
('C1', 6, FALSE),
('C2', 6, FALSE),
('C3', 8, FALSE);

-- ─── SAMPLE ORDERS (for demo) ───
INSERT INTO orders (table_id, item_name, qty, notes, status, payment_status, item_type, total_price) VALUES
('A1', 'Iced Green Tea', 2, '—', 'new', 'unpaid', 'drinks', 70000),
('B4', 'Original Tonkotsu', 1,
 'Noodles: Thin straight · Firmness: Firm · Saltiness: Rich · Toppings: Soft-boiled egg',
 'prep', 'paid', 'food', 144000),
('C2', 'Spicy Miso Ramen', 2,
 'Noodles: Medium wavy · Firmness: Normal · Saltiness: Regular · Toppings: None',
 'done', 'paid', 'food', 278000);
