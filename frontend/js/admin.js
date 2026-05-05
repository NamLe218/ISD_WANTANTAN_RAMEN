import { orders, menu } from './state.js';
import { showPage, showToast, normalizeStatus } from './ui.js';

export function checkAdminAccess() {
    const pin = document.getElementById('staffPin').value;
    if (pin === "1234") {
        document.getElementById('staffPin').value = '';
        showPage('admin-dash');
        showToast("Welcome, Staff");
        import('./state.js').then(s => s.syncMenu(true).then(() => renderAdminInventory()));
    } else {
        showToast("Invalid PIN", true);
    }
}

export function renderAdminInventory() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    container.innerHTML = '';

    if (menu.length === 0) {
        container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">📦</div><div>No menu items loaded.</div></div>`;
        return;
    }

    const FALLBACK_IMG = 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800';

    menu.forEach(item => {
        const isOut = item.is_available === 0 || item.is_available === false;
        const imgSrc = item.image_url || FALLBACK_IMG;

        const card = document.createElement('div');
        card.className = `inv-card ${isOut ? 'inv-card--out' : ''}`;
        card.dataset.name = item.name;
        card.dataset.cat = (item.category || '').toLowerCase();
        card.innerHTML = `
            <div class="inv-card-img-wrap">
                <img class="inv-card-img"
                     src="${imgSrc}"
                     alt="${item.name}"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMG}';">
                ${isOut ? '<div class="inv-card-out-overlay"><div class="inv-card-out-badge">Out of Stock</div></div>' : ''}
                <div class="inv-card-cat-badge">${item.category || '—'}</div>
            </div>
            <div class="inv-card-body">
                <div class="inv-card-name">${item.name}</div>
                <div class="inv-card-price">${item.price ? item.price.toLocaleString('vi-VN') + 'đ' : '—'}</div>
                <button class="inv-toggle-btn ${isOut ? 'inv-toggle-btn--out' : 'inv-toggle-btn--in'}"
                        onclick="toggleStock('${item.name.replace(/'/g, "\\'")}')">
                    ${isOut ? '🔴 Mark as Available' : '✅ Mark Out of Stock'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

export async function toggleStock(itemName) {
    const item = menu.find(m => m.name === itemName);
    if (!item) {
        showToast(`Item "${itemName}" not found in menu state`, true);
        return;
    }

    // Read current availability as boolean (handles both 0/1 integers and true/false)
    const currentlyAvailable = item.is_available === 1 || item.is_available === true;
    const newStatus = !currentlyAvailable;

    const { patchMenuAvailability } = await import('./api.js');
    const { syncMenu } = await import('./state.js');
    const { renderMenu } = await import('./ui.js');

    const result = await patchMenuAvailability(item.id, newStatus);
    if (result && result.success) {
        // Optimistically update local state immediately so UI is consistent
        item.is_available = newStatus ? 1 : 0;

        // Re-render admin inventory right away with optimistic state
        renderAdminInventory();

        // Wait briefly for DB write to commit, then re-sync for accuracy
        await new Promise(resolve => setTimeout(resolve, 400));
        await syncMenu(true);
        renderAdminInventory();
        renderMenu();
        showToast(`${itemName} marked as ${newStatus ? 'Available' : 'Out of Stock'}`);
    } else {
        const msg = result && result.message ? result.message : 'Unknown error';
        showToast(`Failed to update ${itemName}: ${msg}`, true);
    }
}


export function applyStockVisuals() {
    document.querySelectorAll('.menu-card').forEach(card => {
        const nameNode = card.querySelector('.menu-card-name');
        if (!nameNode) return;
        const name = nameNode.textContent;
        const menuItem = menu.find(m => m.name === name);
        if (menuItem && (menuItem.is_available === 0 || menuItem.is_available === false)) {
            card.classList.add('out-of-stock');
            if (!card.querySelector('.out-of-stock-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'out-of-stock-overlay';
                overlay.innerHTML = '<div class="out-of-stock-badge">Out of Stock</div>';
                card.appendChild(overlay);
            }
        } else {
            card.classList.remove('out-of-stock');
            const overlay = card.querySelector('.out-of-stock-overlay');
            if (overlay) overlay.remove();
        }
    });
}

function updateKitchenCountersFromBuckets(buckets) {
    function setTextIfExists(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    }

    const drinksNew = buckets.drinks.new.length;
    const drinksPrep = buckets.drinks.prep.length;
    const drinksDone = buckets.drinks.done.length;

    const foodNew = buckets.food.new.length;
    const foodPrep = buckets.food.prep.length;
    const foodDone = buckets.food.done.length;

    setTextIfExists('kitchenNewCount', drinksNew + foodNew);
    setTextIfExists('kitchenPrepCount', drinksPrep + foodPrep);
    setTextIfExists('kitchenDoneCount', drinksDone + foodDone);

    setTextIfExists('drinks-new-badge', drinksNew);
    setTextIfExists('drinks-prep-badge', drinksPrep);
    setTextIfExists('drinks-done-badge', drinksDone);

    setTextIfExists('food-new-badge', foodNew);
    setTextIfExists('food-prep-badge', foodPrep);
    setTextIfExists('food-done-badge', foodDone);
}

export function renderKitchen() {
    const buckets = {
        drinks: { new: [], prep: [], done: [] },
        food: { new: [], prep: [], done: [] },
    };

    [...orders]
        .sort((a, b) => a.createdAt - b.createdAt)
        .forEach(order => {
            const col = normalizeStatus(order.status);
            const grp = order.type === 'food' ? buckets.food : buckets.drinks;
            if (grp[col]) grp[col].push(order);
        });

    ['drinks', 'food'].forEach(type => {
        ['new', 'prep', 'done'].forEach(col => {
            const el = document.getElementById(type + '-' + col);
            if (!el) return;
            el.innerHTML = '';

            buckets[type][col].forEach(order => {
                const paidClass = order.paymentStatus === 'paid' ? 'paid' : 'unpaid';
                const paidLabel = order.paymentStatus === 'paid' ? '✓ PAID' : '⚠ UNPAID';
                const normStatus = normalizeStatus(order.status);
                const minutesAgo = Math.max(0, Math.round((Date.now() - order.createdAt) / 60000));
                const timeLabel = minutesAgo === 0 ? 'Just now' : minutesAgo + ' min ago';

                // Track if it's new
                const isJustAdded = (Date.now() - order.createdAt) < 3000;
                const highlightClass = isJustAdded ? 'highlight' : '';

                // Determine next action button
                let nextBtn = '';
                if (normStatus === 'new') {
                    nextBtn = `<button class="order-action-btn prep-btn" onclick="updateOrderStatus(${order.id}, 'prep')">▶ Start Prep</button>`;
                } else if (normStatus === 'prep') {
                    nextBtn = `<button class="order-action-btn done-btn" onclick="updateOrderStatus(${order.id}, 'done')">✓ Mark Done</button>`;
                } else {
                    nextBtn = `<span class="order-completed-label">✔ Completed</span>`;
                }

                const card = document.createElement('div');
                card.className = `order-card status-${normStatus} ${highlightClass}`;
                card.innerHTML = `
          <div class="order-top">
            <div>
              <div class="order-id">#${order.id}</div>
              <div class="order-table">Table ${order.table}</div>
            </div>
            <span class="badge-pay ${paidClass}">${paidLabel}</span>
          </div>
          <div class="order-main">${order.item}</div>
          <div class="order-qty">Qty: ${order.qty}</div>
          ${order.notes && order.notes !== '—'
                        ? `<div class="order-notes">${order.notes}</div>`
                        : ''}
          <div class="order-footer">
            <span class="badge-pay ${paidClass}" style="font-size:10px;">${paidLabel}</span>
            ${nextBtn}
          </div>
          <div class="time-chip">${timeLabel}</div>`;

                el.appendChild(card);
            });
        });
    });

    updateKitchenCountersFromBuckets(buckets);
}

export async function updateOrderStatus(orderId, newStatus) {
    const { patchOrderStatus } = await import('./api.js');
    const { syncOrders } = await import('./state.js');
    const { updateTrackingUI } = await import('./tracking.js');

    const ok = await patchOrderStatus(orderId, newStatus);
    if (ok) {
        await syncOrders();
        renderKitchen();
        if (document.getElementById('page-status').classList.contains('active')) {
            updateTrackingUI();
        }
    }
}
