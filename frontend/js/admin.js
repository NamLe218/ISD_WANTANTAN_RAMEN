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
    if(!container) return;
    container.innerHTML = '';

    menu.forEach(item => {
        const isOut = item.is_available === 0 || item.is_available === false;
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `
            <div style="font-weight:600; font-size:13px;">${item.name}</div>
            <button class="inv-toggle ${isOut ? 'unavailable' : ''}" onclick="toggleStock('${item.name}')">
                ${isOut ? 'Out of Stock' : 'Available'}
            </button>
        `;
        container.appendChild(div);
    });
    
    applyStockVisuals();
}

export async function toggleStock(itemName) {
    const item = menu.find(m => m.name === itemName);
    if (!item) return;
    const newStatus = item.is_available ? 0 : 1;
    
    const { patchMenuAvailability } = await import('./api.js');
    const { syncMenu } = await import('./state.js');
    const { renderMenu } = await import('./ui.js');
    
    const success = await patchMenuAvailability(item.id, newStatus);
    if (success) {
        await syncMenu(true);
        renderAdminInventory();
        renderMenu(); // Safely rewrites DOM using true backend state
        showToast(`${itemName} status updated`);
    } else {
        showToast(`Failed to update ${itemName}`, true);
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
            if(!card.querySelector('.out-of-stock-overlay')) {
                 const overlay = document.createElement('div');
                 overlay.className = 'out-of-stock-overlay';
                 overlay.innerHTML = '<div class="out-of-stock-badge">Out of Stock</div>';
                 card.appendChild(overlay);
            }
        } else {
            card.classList.remove('out-of-stock');
            const overlay = card.querySelector('.out-of-stock-overlay');
            if(overlay) overlay.remove();
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
    if(ok) {
        await syncOrders();
        renderKitchen();
        if(document.getElementById('page-status').classList.contains('active')) {
            updateTrackingUI();
        }
    }
}
