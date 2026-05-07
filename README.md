# Wantantan Ramen — Restaurant Ordering System

A full-stack, real-time restaurant ordering and kitchen management system built for a Japanese ramen restaurant. Customers can browse the menu, customize their ramen, and track order status live — while staff manage inventory, kitchen tickets, and deliveries from dedicated dashboards.

---

## Features

### Customer-Facing
- **Dynamic Menu** — Browse mains (ramen), sides, and drinks fetched live from the database
- **Ramen Customization** — Choose noodle type, firmness, broth saltiness, and add-on toppings (with pricing)
- **Shopping Cart** — Add, edit quantity, remove items, and add special notes before ordering
- **Real-Time Order Tracking** — Track your order's status (Pending → Preparing → Ready ✓) with live polling every 5 seconds
- **Order Cancellation** — Cancel a pending order before the kitchen starts preparation
- **Payment** — Pay via VNPay (online redirect) or QR code at the table
- **"Ready" Notifications** — Toast notification fires automatically when your order is ready

### Kitchen
- **Kitchen Queue** (`/kitchen`) — Kanban-style board separating Food and Drinks across New / Prep / Done columns
- **One-Click Actions** — "▶ Start Prep" and "✓ Mark Done" buttons advance order status instantly
- **Live Clock** — Real-time clock displayed in the kitchen dashboard (GMT+7)
- **Auto-Refresh** — Dashboard polls for new orders every 5 seconds automatically

### Admin Panel
- **PIN-Protected Access** — Staff enter a 4-digit PIN to access the admin dashboard
- **Inventory Management** — Toggle any menu item between *Available* and *Out of Stock* with a single click; updates propagate live to the customer menu
- **Kitchen Overview** — Unified view of all order counters (New / Prep / Done) across Food and Drinks categories

### Delivery Board
- **Delivery Dashboard** — Lists orders ready for table delivery; staff can mark them as delivered

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 5 |
| **Database** | MySQL 8 (via `mysql2/promise` connection pool) |
| **Frontend** | Vanilla JS (ES Modules), HTML5, Vanilla CSS |
| **Payments** | VNPay (HMAC-SHA512 signature verification) |
| **Dev Server** | Nodemon |

---

## Project Structure

```
ISD_WANTANTAN_RAMEN/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool (reads from .env)
│   ├── controllers/
│   │   ├── menuController.js  # Menu CRUD + availability toggle
│   │   ├── orderController.js # Order CRUD + status management
│   │   └── tableController.js # Restaurant table management
│   ├── middleware/
│   │   └── errorHandler.js    # Centralized error handler
│   ├── routes/
│   │   ├── menuRoutes.js      # GET /api/menu, PATCH availability
│   │   ├── orderRoutes.js     # Full CRUD on /api/orders
│   │   ├── paymentRoutes.js   # VNPay create-payment & return callback
│   │   └── tableRoutes.js     # GET /api/tables
│   ├── .env                   # Environment variables (not committed)
│   └── server.js              # Express app entry point
│
├── frontend/
│   ├── css/
│   │   ├── variables.css      # Design tokens (colors, spacing)
│   │   ├── base.css           # Global resets & typography
│   │   ├── components.css     # Reusable UI components
│   │   └── pages.css          # Page-specific styles
│   ├── js/
│   │   ├── api.js             # All fetch() calls to the backend API
│   │   ├── state.js           # Global in-memory state (menu, orders, cart)
│   │   ├── ui.js              # DOM rendering helpers & page navigation
│   │   ├── cart.js            # Cart logic, ramen customizer, order flow
│   │   ├── admin.js           # Admin/kitchen dashboard rendering
│   │   ├── kitchen.js         # Kitchen queue view & order detail modal
│   │   ├── delivery.js        # Delivery board rendering
│   │   └── tracking.js        # Customer order tracking & cancellation
│   ├── Images/                # Static image assets
│   ├── app.js                 # Frontend entry point — imports & wires all modules
│   └── index.html             # Single-page application shell
│
├── database/
│   ├── schema.sql             # Table definitions (tables, menu_items, orders, etc.)
│   ├── seed.sql               # Minimal seed for quick setup
│   └── seed_data.sql          # Full seed: 10 tables, 22 menu items, customization options
│
└── package.json               # Root scripts: start / dev
```

---

## Database Schema

```
tables               — Physical restaurant tables (id: A1–D1, seats, is_occupied)
menu_items           — Food & drinks with category, price (VND), availability flag
customization_options— Ramen add-ons: noodle_type, firmness, saltiness, topping
orders               — One row per ordered item; tracks status & payment lifecycle
```

### Order Status Flow
```
new  ──▶  prep  ──▶  done
 │
 └──▶  cancelled   (only from 'new', customer-initiated)
```

### Payment Status
```
unpaid  ──▶  paid   (updated after successful VNPay callback or QR confirmation)
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MySQL 8 server running locally or remotely

### 1. Clone & Install

```bash
git clone https://github.com/NamLe218/ISD_WANTANTAN_RAMEN.git
cd ISD_WANTANTAN_RAMEN
npm install
cd backend && npm install && cd ..
```

### 2. Configure Environment

Create `backend/.env`:

```env
# Database
MYSQLHOST=localhost
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=your_password
MYSQLDATABASE=wantantan_ramen

# Server
PORT=3000

# VNPay (optional — only needed for online payments)
VNP_TMN_CODE=your_terminal_code
VNP_HASH_SECRET=your_secret_key
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/api/payment/vnpay-return
```

### 3. Set Up the Database

```sql
-- In your MySQL client:
SOURCE database/schema.sql;
SOURCE database/seed_data.sql;
```

### 4. Run the App

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

---

## API Reference

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menu` | List all menu items (filter with `?category=mains\|sides\|drinks`) |
| `GET` | `/api/menu/:id` | Get a single menu item |
| `PATCH` | `/api/menu/:id/availability` | Toggle item availability (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create order(s) from cart |
| `GET` | `/api/orders` | List all orders (filter with `?status=&type=`) |
| `GET` | `/api/orders/:id` | Get a single order |
| `PATCH` | `/api/orders/:id` | Update status, qty, notes, or payment |
| `DELETE` | `/api/orders/:id` | Delete an order |

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tables` | List all restaurant tables |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/create-payment` | Generate VNPay redirect URL |
| `GET` | `/api/payment/vnpay-return` | VNPay callback — verifies signature and redirects |

### Health Check
```
GET /api/health
→ { success: true, message: "🍜 Wantantan Ramen API is running!", timestamp: "..." }
```

---

## Pages & Navigation

| Page | Role | Description |
|------|------|-------------|
| Home | Customer | Hero section + featured ramen cards |
| Menu | Customer | Full menu grid with category filters and search |
| Order Status | Customer | Real-time order tracker with cancel option |
| Kitchen | Staff | Kanban queue (Food & Drinks) with status actions |
| Admin | Staff (PIN: `1234`) | Inventory toggles + kitchen counters |

> **Note:** The default admin PIN is `1234`. Change this for any production deployment.