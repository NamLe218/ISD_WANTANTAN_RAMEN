import { fetchAllOrders, getMenu } from './api.js';

/* ─── APPLICATION STATE ─── */
export let currentTable = 'A1';
export let cart = [];
export let orders = [];
export let nextOrderId = 101;
export let menu = [];

export let trackedOrderIds = JSON.parse(localStorage.getItem('tracked_orders') || '[]');
export let notifiedOrders = new Set();

export function setTrackedOrderIds(ids) {
    trackedOrderIds = ids;
    localStorage.setItem('tracked_orders', JSON.stringify(ids));
}

/* ─── ADMIN AUTH STATE ─── */
export let isAdminLoggedIn = false;
export let adminUsername = '';

/* Admin credentials (in production, this should be server-side) */
export const ADMIN_ACCOUNTS = [
    { username: 'admin', password: 'admin123' },
    { username: 'kitchen', password: 'kitchen123' },
];

/* ─── MENU PRICES (VND) ─── */
export const PRICES = {
    'Original Tonkotsu': 129000,
    'Spicy Miso Ramen': 139000,
    'Shoyu Ramen': 129000,
    'Gyoza (5 pcs)': 69000,
    'Extra Chashu': 35000,
    'Iced Green Tea': 35000,
    'Coca-Cola': 45000,
    'Matcha Cheesecake': 79000,
    'Matcha Ice Cream': 59000,
};

export const TOPPING_PRICE = 15000;

export async function syncOrders() {
    const data = await fetchAllOrders();
    setOrders(data.map(o => ({
        id: o.id,
        table: o.table_id,
        item: o.item_name,
        qty: o.qty,
        notes: o.notes,
        status: o.status,
        paymentStatus: o.payment_status,
        type: o.item_type,
        createdAt: new Date(o.created_at).getTime(),
        customerNotified: !!o.customer_notified
    })));
}

export async function syncMenu(fetchAll = false) {
    menu = await getMenu(fetchAll);
}

export function setCart(newCart) {
    cart.length = 0;
    cart.push(...newCart);
}

export function setOrders(newOrders) {
    orders.length = 0;
    orders.push(...newOrders);
}

export function setAdminLoggedIn(val) {
    isAdminLoggedIn = val;
}

export function setAdminUsername(val) {
    adminUsername = val;
}

export function incrementNextOrderId() {
    return nextOrderId++;
}
