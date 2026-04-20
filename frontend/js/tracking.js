import { orders, trackedOrderIds, notifiedOrders, setTrackedOrderIds } from './state.js';
import { showToast, showPage } from './ui.js';
import { renderKitchen } from './admin.js';

export function updateTrackingUI() {
    const container = document.getElementById('statusListContainer');
    if (!container) return;

    container.innerHTML = '';
    const activeOrders = orders.filter(o => trackedOrderIds.includes(o.id));

    if (activeOrders.length === 0) {
        container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">⏳</div><div>You have no active orders.</div></div>`;
        return;
    }

    activeOrders.sort((a,b) => b.id - a.id).forEach(order => {
        const div = document.createElement('div');
        div.className = 'status-card';
        div.innerHTML = `
            <div>
                <div style="font-weight:700; font-size:14px; margin-bottom:4px;">#${order.id} - ${order.item} (x${order.qty})</div>
                <div style="font-size:11px; color:var(--mid);">${order.notes}</div>
            </div>
            <div class="status-indicator ${order.status}">${order.status}</div>
        `;
        container.appendChild(div);
    });
}

export function checkOrderStatuses() {
    // Check if tracked orders need notifications
    trackedOrderIds.forEach(id => {
        const order = orders.find(o => o.id === id);
        if (order && order.status === 'done' && !notifiedOrders.has(id)) {
            showToast(`🍜 Your ${order.item} is ready for collection!`, false);
            notifiedOrders.add(id);
            if(document.getElementById('page-status').classList.contains('active')) {
                updateTrackingUI();
            }
        }
    });
}

export function cancelOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) {
        showToast('Order not found', true);
        return;
    }
    if (order.status !== 'new') {
        showToast('Order cannot be cancelled after preparation has started', true);
        return;
    }
    if (confirm(`Cancel your order of ${order.item}?`)) {
        // Send to backend via our api patch method.
        import('./api.js').then(api => {
           api.updateRemoteOrder(id, 'cancelled').then(() => {
               const newTracked = trackedOrderIds.filter(t => t !== id);
               setTrackedOrderIds(newTracked);
               showToast('Order cancelled successfully');
               import('./state.js').then(state => state.syncOrders().then(() => updateTrackingUI()));
           });
        });
    }
}
