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

    activeOrders.sort((a, b) => b.id - a.id).forEach(order => {
        const canCancel = order.status === 'new';
        const minutesAgo = Math.max(0, Math.round((Date.now() - order.createdAt) / 60000));
        const timeLabel = minutesAgo === 0 ? 'Just now' : minutesAgo + ' min ago';

        let statusLabel = order.status;
        if (order.status === 'new')  statusLabel = 'Pending';
        if (order.status === 'prep') statusLabel = 'Preparing';
        if (order.status === 'done') statusLabel = 'Ready ✓';

        const div = document.createElement('div');
        div.className = `status-card status-${order.status === 'prep' ? 'prep' : order.status === 'done' ? 'done' : 'new'}`;
        div.innerHTML = `
            <div class="status-card-header">
                <div class="status-id-badge">Order #${order.id}</div>
                <div class="status-indicator">
                    <span class="status-dot ${canCancel || order.status === 'prep' ? 'pulse' : ''}"></span>
                    ${statusLabel}
                </div>
            </div>
            <div class="status-item-details">
                <div class="status-item-name">${order.item} × ${order.qty}</div>
                ${order.notes && order.notes !== '—' ? `<div class="status-item-notes">${order.notes}</div>` : ''}
            </div>
            <div class="status-card-controls">
                <button class="status-cancel-btn" ${!canCancel ? 'disabled' : ''}
                    onclick="window.confirmCancelOrder(${order.id})">
                    Cancel Order
                </button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px dashed var(--border); padding-top:8px;">
                <div class="time-chip">${timeLabel}</div>
                <div style="font-size:10px; color:var(--mid); text-transform:uppercase; letter-spacing:0.5px;">Table ${order.table}</div>
            </div>
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
