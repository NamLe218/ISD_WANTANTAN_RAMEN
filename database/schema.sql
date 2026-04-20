-- ═══════════════════════════════════════════════════════════════
--  Wantantan Ramen — Database Schema (revised)
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS wantantan_ramen
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wantantan_ramen;

-- ─── TABLES (physical restaurant tables) ───
CREATE TABLE IF NOT EXISTS tables (
    id          VARCHAR(10) PRIMARY KEY COMMENT 'e.g. A1, B4, C2',
    seats       INT DEFAULT 4,
    is_occupied BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- ─── MENU ITEMS ───
CREATE TABLE IF NOT EXISTS menu_items (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    category     ENUM('mains', 'sides', 'drinks') NOT NULL,
    price        INT NOT NULL COMMENT 'Price in VND',
    description  TEXT,
    image_url    VARCHAR(500),
    is_ramen     BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── RAMEN CUSTOMIZATION OPTIONS ───
-- Stores all possible options (e.g. "Extra firm", "Less salty")
CREATE TABLE IF NOT EXISTS customization_options (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    category     ENUM('noodle_type', 'firmness', 'saltiness', 'topping') NOT NULL,
    label        VARCHAR(50) NOT NULL  COMMENT 'Display name, e.g. "Extra Firm"',
    extra_price  INT DEFAULT 0        COMMENT 'Additional cost in VND (0 for free options)'
) ENGINE=InnoDB;

-- ─── ORDERS (one per item / flattened structure) ───
CREATE TABLE IF NOT EXISTS orders (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    table_id       VARCHAR(10) NOT NULL,
    item_name      VARCHAR(100) NOT NULL,
    qty            INT NOT NULL DEFAULT 1,
    notes          TEXT COMMENT 'Special requests or customisation',
    status         ENUM('new', 'prep', 'done', 'cancelled') DEFAULT 'new',
    payment_status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    item_type      ENUM('food', 'drinks', 'desserts') DEFAULT 'food',
    total_price    INT NOT NULL DEFAULT 0 COMMENT 'Total price for this order item row',
    customer_notified BOOLEAN DEFAULT FALSE COMMENT 'Tracks if customer got UI notification when done',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
) ENGINE=InnoDB;