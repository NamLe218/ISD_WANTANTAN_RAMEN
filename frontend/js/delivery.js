import { orders, setOrders, syncOrders } from './state.js';
import { showToast, normalizeStatus } from './ui.js';
import { patchOrderStatus } from './api.js';

export async function renderDeliveryBoard() {
    const el = document.getElementById('deliveryList');
    if (!el) return;
    el.innerHTML = '';

    // Filter for only 'done' (Completed) orders that haven't been delivered/served yet
    // In our system, 'done' means kitchen is finished.
    const completedOrders = orders.filter(o => normalizeStatus(o.status) === 'done');

    if (completedOrders.length === 0) {
        el.innerHTML = `
            <div class="status-error-state">
                <div class="status-error-icon">🚚</div>
                <div class="status-error-title">No completed orders available</div>
                <div class="status-error-msg">Once the kitchen completes an order, it will appear here for delivery to the table.</div>
            </div>
        `;
        return;
    }

    completedOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'delivery-card';
        card.innerHTML = `
            <div class="delivery-card-main">
                <div class="delivery-table-code">Table ${order.table}</div>
                <div class="delivery-order-id">#${order.id}</div>
                <div class="delivery-dish-name">${order.item} × ${order.qty}</div>
            </div>
            <button class="delivery-btn" onclick="window.markAsDelivered(${order.id})">
                <span class="delivery-btn-icon">✅</span>
                Deliver
            </button>
        `;
        el.appendChild(card);
    });
}

export async function markAsDelivered(orderId) {
    const result = await patchOrderStatus(orderId, 'done');
    
    if (result.success) {
        await syncOrders();
        renderDeliveryBoard();
        showToast(`Order #${orderId} marked as delivered!`);
    } else {
        showToast('Failed to mark as delivered', true);
    }
}
