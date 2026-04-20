-- ═══════════════════════════════════════════════════════════════
--  Wantantan Ramen — Seed Data
--  Run AFTER schema.sql to populate the database
-- ═══════════════════════════════════════════════════════════════

USE wantantan_ramen;

-- ─── CLEAR EXISTING DATA (safe re-run) ───
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE orders;
TRUNCATE TABLE customization_options;
TRUNCATE TABLE menu_items;
TRUNCATE TABLE tables;
SET FOREIGN_KEY_CHECKS = 1;


-- ═══════════════════════════════════════════
--  1. RESTAURANT TABLES
-- ═══════════════════════════════════════════
INSERT INTO tables (id, seats, is_occupied) VALUES
    ('A1', 2, FALSE),
    ('A2', 2, FALSE),
    ('A3', 4, FALSE),
    ('B1', 4, FALSE),
    ('B2', 4, FALSE),
    ('B3', 6, FALSE),
    ('C1', 6, FALSE),
    ('C2', 8, FALSE),
    ('C3', 8, FALSE),
    ('D1', 10, FALSE);


-- ═══════════════════════════════════════════
--  2. MENU ITEMS — Mains (Ramen bowls)
-- ═══════════════════════════════════════════
INSERT INTO menu_items (name, category, price, description, image_url, is_ramen, is_available) VALUES

-- ── Signature Ramen ──
('Original Tonkotsu',
 'mains', 129000,
 'The classic. 18-hour pork bone broth, thin noodles, chashu pork, soft-boiled egg, scallions & black garlic oil.',
 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Spicy Miso Ramen',
 'mains', 139000,
 'Rich miso broth with chili paste, ground pork, bean sprouts, corn, butter & a kick of togarashi.',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Shoyu Ramen',
 'mains', 129000,
 'Soy sauce-based clear broth, wavy noodles, bamboo shoots, nori, chashu & a marinated egg.',
 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Black Garlic Tonkotsu',
 'mains', 145000,
 'Our signature tonkotsu elevated with roasted black garlic oil (mayu), woodear mushrooms & extra chashu.',
 'https://images.unsplash.com/photo-1614563637806-1d0e645e0940?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Tantanmen',
 'mains', 149000,
 'Creamy sesame-based broth with spicy minced pork, bok choy, crushed peanuts & chili oil drizzle.',
 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Veggie Miso Ramen',
 'mains', 119000,
 'Plant-based miso broth with tofu, shiitake mushrooms, corn, edamame, leafy greens & sesame seeds.',
 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Spicy Tonkotsu',
 'mains', 139000,
 'Our rich tonkotsu broth infused with house-made chili oil, topped with chashu, egg & crispy shallots.',
 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&auto=format&fit=crop',
 TRUE, TRUE),

('Yuzu Shio Ramen',
 'mains', 135000,
 'Light sea-salt broth brightened with yuzu citrus, chicken chashu, bamboo shoots & fresh herbs.',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
 TRUE, TRUE);


-- ═══════════════════════════════════════════
--  3. MENU ITEMS — Sides
-- ═══════════════════════════════════════════
INSERT INTO menu_items (name, category, price, description, image_url, is_ramen, is_available) VALUES

('Gyoza (5 pcs)',
 'sides', 69000,
 'Pan-fried pork & cabbage dumplings with crispy bottoms, served with ponzu dipping sauce.',
 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Karaage Chicken',
 'sides', 79000,
 'Japanese-style fried chicken thigh bites, double-fried for extra crunch. Served with kewpie mayo.',
 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Takoyaki (6 pcs)',
 'sides', 65000,
 'Crispy octopus balls drizzled with takoyaki sauce, kewpie mayo, bonito flakes & aonori.',
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Edamame',
 'sides', 39000,
 'Steamed young soybeans tossed with sea salt and a touch of sesame oil.',
 'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Extra Chashu',
 'sides', 35000,
 'Three slices of our 48-hour braised pork belly, torched to order.',
 'https://images.unsplash.com/photo-1632709810780-b5a4343cebec?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Crispy Pork Bao (2 pcs)',
 'sides', 59000,
 'Fluffy steamed buns filled with crispy pork belly, pickled cucumber & hoisin glaze.',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Spicy Cucumber Salad',
 'sides', 45000,
 'Smashed cucumbers tossed with chili oil, garlic, soy sauce, rice vinegar & toasted sesame.',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
 FALSE, TRUE);


-- ═══════════════════════════════════════════
--  4. MENU ITEMS — Drinks
-- ═══════════════════════════════════════════
INSERT INTO menu_items (name, category, price, description, image_url, is_ramen, is_available) VALUES

('Iced Green Tea',
 'drinks', 35000,
 'Refreshing cold-brewed Japanese green tea, lightly sweetened. Perfect with ramen.',
 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Coca-Cola',
 'drinks', 25000,
 'Classic Coca-Cola, served ice cold in a glass bottle.',
 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Calpis Soda',
 'drinks', 39000,
 'Sweet & tangy Japanese yogurt-flavored carbonated drink on ice.',
 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Matcha Latte',
 'drinks', 55000,
 'Ceremonial-grade matcha whisked with steamed milk. Available hot or iced.',
 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Japanese Beer (Asahi)',
 'drinks', 59000,
 'Asahi Super Dry draft — crisp, clean, and perfectly paired with ramen.',
 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Yuzu Lemonade',
 'drinks', 45000,
 'Sparkling lemonade made with fresh yuzu citrus juice, honey & soda water.',
 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&auto=format&fit=crop',
 FALSE, TRUE),

('Ramune Soda',
 'drinks', 35000,
 'Iconic Japanese marble soda in original flavor. Fun to open, fun to drink!',
 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&auto=format&fit=crop',
 FALSE, TRUE);


-- ═══════════════════════════════════════════
--  5. RAMEN CUSTOMIZATION OPTIONS
-- ═══════════════════════════════════════════

-- Noodle type
INSERT INTO customization_options (category, label, extra_price) VALUES
    ('noodle_type', 'Thin Straight',    0),
    ('noodle_type', 'Thin Wavy',        0),
    ('noodle_type', 'Thick Straight',   0),
    ('noodle_type', 'Thick Wavy',       0);

-- Firmness
INSERT INTO customization_options (category, label, extra_price) VALUES
    ('firmness', 'Soft (Yawaraka)',      0),
    ('firmness', 'Regular (Futsu)',      0),
    ('firmness', 'Firm (Katame)',        0),
    ('firmness', 'Extra Firm (Barikata)', 0);

-- Saltiness / Broth intensity
INSERT INTO customization_options (category, label, extra_price) VALUES
    ('saltiness', 'Light (Assari)',     0),
    ('saltiness', 'Regular',            0),
    ('saltiness', 'Rich (Kotteri)',     0);

-- Toppings (extras with price)
INSERT INTO customization_options (category, label, extra_price) VALUES
    ('topping', 'Extra Chashu',          25000),
    ('topping', 'Soft-Boiled Egg',       15000),
    ('topping', 'Extra Nori (3 sheets)', 10000),
    ('topping', 'Corn',                  10000),
    ('topping', 'Butter',                10000),
    ('topping', 'Bamboo Shoots',         10000),
    ('topping', 'Spicy Bean Sprouts',    10000),
    ('topping', 'Woodear Mushrooms',     15000),
    ('topping', 'Extra Scallions',        5000),
    ('topping', 'Crispy Garlic Chips',   10000);


-- ═══════════════════════════════════════════
--  ✅ Done! Verify counts:
-- ═══════════════════════════════════════════
SELECT 'tables'                AS entity, COUNT(*) AS total FROM tables
UNION ALL
SELECT 'menu_items (mains)',   COUNT(*) FROM menu_items WHERE category = 'mains'
UNION ALL
SELECT 'menu_items (sides)',   COUNT(*) FROM menu_items WHERE category = 'sides'
UNION ALL
SELECT 'menu_items (drinks)',  COUNT(*) FROM menu_items WHERE category = 'drinks'
UNION ALL
SELECT 'customization_options', COUNT(*) FROM customization_options;
