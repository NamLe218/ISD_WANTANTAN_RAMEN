import { showToast } from './ui.js';

const API_BASE = 'http://localhost:3000/api';

/* ─── MENU API ─── */
export async function getMenu(fetchUnavailable = false) {
    try {
        const url = fetchUnavailable ? `${API_BASE}/menu?all=true` : `${API_BASE}/menu`;
        const res = await fetch(url);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error('Menu fetch failed:', err);
        return [];
    }
}

export async function patchMenuAvailability(id, is_available) {
    try {
        const res = await fetch(`${API_BASE}/menu/${id}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available })
        });
        return await res.json();
    } catch (err) {
        return { success: false, message: err.message };
    }
}

/* ─── ORDERS API ─── */
export async function fetchAllOrders(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/orders?${query}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error('Orders fetch failed:', err);
        return [];
    }
}

export async function createRemoteOrder(tableId, items, paymentStatus = 'unpaid') {
    try {
        const body = {
            table_id: tableId,
            payment_status: paymentStatus,
            items: items.map(it => ({
                item_name: it.name,
                qty: it.qty,
                notes: it.notes,
                item_type: it.type || 'food',
                total_price: it.price
            }))
        };

        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return await res.json();
    } catch (err) {
        console.error('Order creation failed:', err);
        return { success: false, message: 'Network error' };
    }
}

export async function patchOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return await res.json();
    } catch (err) {
        console.error('Order status update failed:', err);
        return { success: false };
    }
}

export async function updateRemoteOrder(orderId, data) {
    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (err) {
        console.error('Order update failed:', err);
        return { success: false, message: 'Network error' };
    }
}

export async function deleteRemoteOrder(orderId) {
    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch (err) {
        console.error('Order deletion failed:', err);
        return { success: false, message: 'Network error' };
    }
}

/* ─── PAYMENT API ─── */
export async function payWithVNPay(orderId, amount) {
    try {
        const res = await fetch(`${API_BASE}/payment/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount })
        });

        const data = await res.json();

        // Show VietQR in a popup
        const qrUrl = `https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg?amount=${amount}&addInfo=${orderId}`;
        const qrImg = document.getElementById('qrImage');
        const qrLnk = document.getElementById('qrLink');
        
        if (qrImg) qrImg.src = qrUrl;
        if (qrLnk) qrLnk.href = data.paymentUrl;

        document.getElementById('qrModalBackdrop').classList.add('show');
        document.getElementById('qrModal').classList.add('show');

    } catch (err) {
        console.error(err);
        showToast('Payment error!', true);
    }
}
