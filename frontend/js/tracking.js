import { orders, trackedOrderIds, notifiedOrders, setTrackedOrderIds, menu, PRICES } from './state.js';
import { showToast, showPage, formatVND } from './ui.js';
import { renderKitchen } from './admin.js';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800';

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
        let statusClass = 'new';
        if (order.status === 'new')  { statusLabel = 'Pending';    statusClass = 'new'; }
        if (order.status === 'prep') { statusLabel = 'Preparing';  statusClass = 'prep'; }
        if (order.status === 'done') { statusLabel = 'Ready ✓';   statusClass = 'done'; }

        // Look up item image from menu state
        const menuItem = menu.find(m => m.name === order.item);
        const imgSrc = (menuItem && menuItem.image_url) ? menuItem.image_url : FALLBACK_IMG;
        const itemPrice = menuItem ? formatVND(menuItem.price * order.qty) : '';

        const div = document.createElement('div');
        div.className = `status-card status-${statusClass}`;
        div.innerHTML = `
            <div class="status-card-img-wrap">
                <img class="status-card-img"
                     src="${imgSrc}"
                     alt="${order.item}"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMG}';">
                <div class="status-card-img-overlay">
                    <span class="status-card-qty-badge">× ${order.qty}</span>
                    <span class="status-card-status-badge status-badge-${statusClass}">
                        <span class="status-dot ${canCancel || order.status === 'prep' ? 'pulse' : ''}"></span>
                        ${statusLabel}
                    </span>
                </div>
            </div>
            <div class="status-card-body">
                <div class="status-card-header">
                    <div class="status-id-badge">Order #${order.id}</div>
                    <div class="status-card-time">${timeLabel} · Table ${order.table}</div>
                </div>
                <div class="status-item-details">
                    <div class="status-item-name">${order.item}</div>
                    ${order.notes && order.notes !== '—' ? `<div class="status-item-notes">${order.notes}</div>` : ''}
                    ${itemPrice ? `<div class="status-item-price">${itemPrice}</div>` : ''}
                </div>
                <div class="status-card-controls">
                    <button class="status-cancel-btn" ${!canCancel ? 'disabled' : ''}
                        onclick="window.confirmCancelOrder(${order.id})">
                        Cancel Order
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}


export function checkOrderStatuses() {
    trackedOrderIds.forEach(id => {
        const order = orders.find(o => o.id === id);
        if (order && order.status === 'done' && !notifiedOrders.has(id)) {
            // Only toast if orders have been loaded at least once (prevents stale
            // notifications firing immediately on page load for already-done orders)
            if (checkOrderStatuses._initialised) {
                showToast(`🍜 Your ${order.item} is ready for collection!`, false);
                if (document.getElementById('page-status').classList.contains('active')) {
                    updateTrackingUI();
                }
            }
            notifiedOrders.add(id);
        }
    });
    // After first pass, mark as initialised — future done transitions will toast
    checkOrderStatuses._initialised = true;
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
