import { orders, setOrders, syncOrders } from './state.js';
import { showToast, normalizeStatus } from './ui.js';
import { patchOrderStatus } from './api.js';

let _currentKtOrderId = null; // Track which order the detail modal is showing

export function isKitchenModalOpen() {
    return _currentKtOrderId !== null;
}

export function renderKitchenQueue() {
    // Map to Spring 2 Kanban columns
    const cols = {
        'drinks-new': document.getElementById('drinks-new'),
        'drinks-prep': document.getElementById('drinks-prep'),
        'drinks-done': document.getElementById('drinks-done'),
        'food-new': document.getElementById('food-new'),
        'food-prep': document.getElementById('food-prep'),
        'food-done': document.getElementById('food-done')
    };

    if (!cols['food-new']) return; // Ensure elements reside on the active DOM segment

    // Clear all existing contents natively
    Object.values(cols).forEach(col => col && (col.innerHTML = ''));
    
    // Default trackers
    const counts = { 'drinks-new': 0, 'drinks-prep': 0, 'drinks-done': 0, 'food-new': 0, 'food-prep': 0, 'food-done': 0 };

    // FIFO sort: oldest first (ascending createdAt)
    const sortedOrders = [...orders]
        .filter(o => o.status !== 'delivered')
        .sort((a, b) => a.createdAt - b.createdAt);

    sortedOrders.forEach(order => {
        const normStatus = normalizeStatus(order.status);
        const type = order.type === 'drinks' ? 'drinks' : 'food';
        
        const colId = `${type}-${normStatus}`;
        if (!cols[colId]) return;

        counts[colId]++;

        const minutesAgo = Math.max(0, Math.round((Date.now() - order.createdAt) / 60000));
        const timeLabel = minutesAgo === 0 ? 'Just now' : minutesAgo + ' min ago';
        const timestamp = new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = `kitchen-queue-card ${order.isNewArrival ? 'attention' : ''} status-${normStatus}`;
        card.onclick = () => window.openKitchenOrderDetail(order.id);
        
        const payBadge = order.paymentStatus === 'paid' 
            ? '<span class="badge-pay paid">PAID</span>' 
            : '<span class="badge-pay unpaid">UNPAID</span>';

        card.innerHTML = `
            <div class="kq-card-header">
                <div class="kq-id">#${order.id} ${payBadge}</div>
                <div class="kq-time">${timestamp} (${timeLabel})</div>
            </div>
            <div class="kq-main">
                <div class="kq-table">Table ${order.table}</div>
                <div class="kq-item">${order.item} × ${order.qty}</div>
                ${order.notes && order.notes !== '—' ? `<div class="kq-notes">${order.notes}</div>` : ''}
            </div>
            <div class="kq-footer">
                <div class="kq-status-badge">${normStatus.toUpperCase()}</div>
                <div class="kq-actions">
                    <select class="kq-select" onchange="event.stopPropagation(); window.updateQueueOrderStatus(${order.id}, this.value)">
                        <option value="new" ${normStatus === 'new' ? 'selected' : ''}>New</option>
                        <option value="prep" ${normStatus === 'prep' ? 'selected' : ''}>Preparing</option>
                        <option value="done" ${normStatus === 'done' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            ${order.isNewArrival ? '<div class="kq-new-tag">NEW ARRIVAL</div>' : ''}
        `;
        cols[colId].appendChild(card);
    });

    // Update Kanban column badges 
    for (let key in counts) {
        const badge = document.getElementById(`${key}-badge`);
        if (badge) badge.textContent = counts[key];
    }

    // Update global dashboard statistics
    const elNew = document.getElementById('kitchenNewCount');
    const elPrep = document.getElementById('kitchenPrepCount');
    const elDone = document.getElementById('kitchenDoneCount');
    if (elNew) elNew.textContent = counts['drinks-new'] + counts['food-new'];
    if (elPrep) elPrep.textContent = counts['drinks-prep'] + counts['food-prep'];
    if (elDone) elDone.textContent = counts['drinks-done'] + counts['food-done'];
}

export function acknowledgeOrder(orderId) {
    const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
            return { ...o, isNewArrival: false };
        }
        return o;
    });
    setOrders(updatedOrders);
    renderKitchenQueue();
}

export function openKitchenOrderDetail(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    _currentKtOrderId = orderId;

    // Acknowledge automatically when opening detail
    acknowledgeOrder(orderId);

    document.getElementById('ktId').textContent = `#${order.id}`;
    document.getElementById('ktTable').textContent = `TABLE ${order.table}`;
    document.getElementById('ktQty').textContent = order.qty;
    document.getElementById('ktItemName').textContent = order.item;

    const specsGrid = document.getElementById('ktSpecsGrid');
    const toppingsList = document.getElementById('ktToppingsList');
    const notesBox = document.getElementById('ktNotes');
    
    specsGrid.innerHTML = '';
    toppingsList.innerHTML = '';
    
    // Parse ramen notes if they exist (format: "Noodles: X · Firmness: Y · Saltiness: Z · Toppings: A, B")
    if (order.notes && order.notes.includes(' · ')) {
        const parts = order.notes.split(' · ');
        const specs = [];
        let toppings = [];

        parts.forEach(part => {
            if (part.startsWith('Noodles:')) specs.push({ label: 'Noodle Type', value: part.replace('Noodles:', '').trim() });
            else if (part.startsWith('Firmness:')) specs.push({ label: 'Noodle Firmness', value: part.replace('Firmness:', '').trim() });
            else if (part.startsWith('Saltiness:')) specs.push({ label: 'Broth Saltiness', value: part.replace('Saltiness:', '').trim() });
            else if (part.startsWith('Toppings:')) {
                const tStr = part.replace('Toppings:', '').trim();
                if (tStr !== 'None') toppings = tStr.split(', ');
            }
        });

        specs.forEach(s => {
            const div = document.createElement('div');
            div.className = 'kt-spec-item';
            div.innerHTML = `<div class="kt-spec-label">${s.label}</div><div class="kt-spec-value">${s.value}</div>`;
            specsGrid.appendChild(div);
        });

        if (toppings.length > 0) {
            document.getElementById('ktToppingsContainer').style.display = 'block';
            toppings.forEach(t => {
                const span = document.createElement('span');
                span.className = 'kt-topping-tag';
                span.textContent = t;
                toppingsList.appendChild(span);
            });
        } else {
            document.getElementById('ktToppingsContainer').style.display = 'none';
        }
        
        document.getElementById('ktCoreSpecsContainer').style.display = 'block';
        notesBox.textContent = "No additional staff notes.";
    } else {
        // Not a ramen item or no special specs
        document.getElementById('ktCoreSpecsContainer').style.display = 'none';
        document.getElementById('ktToppingsContainer').style.display = 'none';
        notesBox.textContent = order.notes || "No specific notes.";
    }

    document.getElementById('ktModalBackdrop').classList.add('show');
    document.getElementById('ktModal').classList.add('show');
}

export function closeKitchenOrderDetail() {
    _currentKtOrderId = null;
    document.getElementById('ktModalBackdrop').classList.remove('show');
    document.getElementById('ktModal').classList.remove('show');
}

// Called by the modal's status buttons (window._ktUpdateStatus)
export async function updateStatusFromModal(newStatus) {
    if (!_currentKtOrderId) return;
    const result = await patchOrderStatus(_currentKtOrderId, newStatus);
    if (result.success) {
        closeKitchenOrderDetail();
        await syncOrders();
        renderKitchenQueue();
        showToast(newStatus === 'done' ? `Order #${_currentKtOrderId} completed! ✓` : `Order #${_currentKtOrderId} is now being prepared`);
    } else {
        showToast('Failed to update status', true);
    }
}

export async function updateQueueOrderStatus(orderId, newStatus) {
    const result = await patchOrderStatus(orderId, newStatus);
    if (result.success) {
        await syncOrders(); // Refresh from DB
        renderKitchenQueue();
        if (newStatus === 'done') {
            showToast(`Order #${orderId} completed!`);
        }
    } else {
        showToast('Failed to update status', true);
    }
}
