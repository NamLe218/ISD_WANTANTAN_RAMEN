import { orders, currentTable, isAdminLoggedIn, adminUsername, syncOrders, syncMenu, menu, cart } from './state.js';
import { renderDeliveryBoard } from './delivery.js';
import { renderKitchenQueue } from './kitchen.js';
import { deleteRemoteOrder } from './api.js';

/* ─── HELPERS ─── */
export function formatVND(n) {
    return Math.round(n).toLocaleString('vi-VN') + 'đ';
}

export function isRamenItem(name) {
    const lower = (name || '').toLowerCase();
    return lower.includes('ramen') || lower.includes('tonkotsu');
}

export function inferType(name) {
    const drinkKeywords = ['tea', 'cola', 'coffee', 'juice', 'drink', 'water', 'beer', 'soda'];
    return drinkKeywords.some(k => name.toLowerCase().includes(k)) ? 'drinks' : 'food';
}

export function normalizeStatus(s) {
    if (s === 'ready') return 'prep';
    if (s === 'served' || s === 'delivered') return 'done';
    return s; // 'new' | 'prep' | 'done'
}

/* ─── TOAST ─── */
export function showToast(msg, isError) {
    const t = document.getElementById('toast');
    const backdrop = document.getElementById('toastBackdrop');
    if (!t) return;
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastIcon').textContent = isError ? '✕' : '✓';
    t.classList.toggle('error', !!isError);
    t.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    setTimeout(() => {
        t.classList.remove('show');
        if (backdrop) backdrop.classList.remove('show');
    }, 2800);
}

/* ─── PAGE NAVIGATION ─── */
export async function showPage(name, linkEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + name);
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (linkEl) linkEl.classList.add('active');
    window.scrollTo(0, 0);

    // Sync from server for data-driven pages
    if (['admin-dash', 'status', 'delivery', 'kitchen', 'menu', 'home'].includes(name)) {
        if (name === 'menu' || name === 'home') {
            await syncMenu();          // customers only see available items
            if (name === 'menu') renderMenu();
        }
        if (name === 'admin-dash') await syncMenu(true); // admin sees all items
        await syncOrders();
    }

    if (name === 'admin-dash') {
        const adminUtils = await import('./admin.js');
        adminUtils.renderKitchen();
        adminUtils.renderAdminInventory();
    }
    if (name === 'order') updateCartUI();
    if (name === 'status') {
        import('./tracking.js').then(m => m.updateTrackingUI());
    }
    if (name === 'delivery') renderDeliveryBoard();
    if (name === 'kitchen') renderKitchenQueue();
    if (name === 'home') {
        renderPopularDishes();
        // Apply overlays to hardcoded home-page cards after menu data is fresh
        import('./admin.js').then(a => a.applyStockVisuals());
    }
}

/* ─── HOME UI ─── */
export function renderPopularDishes() {
    const grid = document.getElementById('popularGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const popular = menu.filter(item => item.is_ramen).slice(0, 4);

    popular.forEach(item => {
        const card = document.createElement('div');
        const isUnavailable = item.is_available === 0 || item.is_available === false;
        
        card.className = `menu-card ${isUnavailable ? 'out-of-stock' : ''}`;
        
        if (!isUnavailable) {
            card.onclick = () => window.openRamenFromHome(item.name);
        }

        card.innerHTML = `
            ${isUnavailable ? '<div class="out-of-stock-overlay"><div class="out-of-stock-badge">Out of Stock</div></div>' : ''}
            <img src="${item.image_url || 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'}" alt="${item.name}"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'; this.title='Image failed to load';">
            <div class="menu-card-body">
                <div class="menu-card-top">
                    <div>
                        <div class="menu-card-name">${item.name}</div>
                        <div class="menu-card-cat">${item.category.charAt(0).toUpperCase() + item.category.slice(1)} · Ramen</div>
                    </div>
                    <div class="menu-card-price">${formatVND(item.price)}<span> / bowl</span></div>
                </div>
                <div class="menu-card-desc">${item.description || ''}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Update hero stats from live menu data
    const totalDishes = menu.length;
    const totalRamen  = menu.filter(item => item.is_ramen).length;
    const elDishes = document.getElementById('statDishes');
    const elRamen  = document.getElementById('statRamen');
    if (elDishes) elDishes.textContent = totalDishes;
    if (elRamen)  elRamen.textContent  = totalRamen;
}

/* ─── MENU UI ─── */
export function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    grid.innerHTML = '';

    menu.forEach(item => {
        const card = document.createElement('div');
        const isUnavailable = item.is_available === 0 || item.is_available === false;
        
        card.className = `menu-card ${isUnavailable ? 'out-of-stock' : ''}`;
        card.dataset.category = item.category;
        card.dataset.name = item.name;
        
        if (!isUnavailable) {
            if (item.is_ramen) {
                card.onclick = () => window.openRamen(item.name);
            } else {
                card.onclick = () => window.addMenuItem(item.name);
            }
        }

        card.innerHTML = `
            ${isUnavailable ? '<div class="out-of-stock-overlay"><div class="out-of-stock-badge">Out of Stock</div></div>' : ''}
            <img src="${item.image_url || 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'}" alt="${item.name}"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1552611052-33e04de081de?w=800'; this.title='Image failed to load';">
            <div class="menu-card-body">
                <div class="menu-card-top">
                    <div>
                        <div class="menu-card-name">${item.name}</div>
                        <div class="menu-card-cat">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</div>
                    </div>
                    <div class="menu-card-price">${formatVND(item.price)}</div>
                </div>
                <div class="menu-card-desc">${item.description || ''}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ─── CART UI ─── */
export function updateCartUI() {
    const body = document.getElementById('cartBody');
    if (!body) return;
    body.innerHTML = '';
    let total = 0;

    if (!cart.length) {
        body.innerHTML = `
      <tr><td colspan="5">
        <div class="cart-empty">
          <div>Your order is empty.</div>
          <div style="margin-top:6px; font-size:11px; color:#999;">Go to the menu to add items.</div>
        </div>
      </td></tr>`;
    } else {
        cart.forEach((item, i) => {
            total += item.price;
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td data-label="Item" style="cursor:pointer;" onclick="window.openEditFromCart(${i})">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-notes cart-notes-mobile">${item.notes}</div>
        </td>
        <td data-label="Qty">
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="window.changeCartQty(${i}, -1)">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="window.changeCartQty(${i}, 1)">+</button>
          </div>
        </td>
        <td data-label="Customisation" class="cart-td-notes" style="cursor:pointer;" onclick="window.openEditFromCart(${i})">
          <div class="cart-item-notes">${item.notes}</div>
        </td>
        <td data-label="Price" class="cart-price">${formatVND(item.price)}</td>
        <td><button class="cart-remove" onclick="window.removeCartItem(${i})">✕</button></td>`;
            body.appendChild(tr);
        });
    }

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatVND(total);
}

/* ─── CANCELLATION LOGIC ─── */
let cancelOrderId = -1;

export function confirmCancelOrder(orderId) {
    cancelOrderId = orderId;
    document.getElementById('orderCancelBackdrop').classList.add('show');
    document.getElementById('orderCancelModal').classList.add('show');
}

export function closeCancelModal() {
    document.getElementById('orderCancelBackdrop').classList.remove('show');
    document.getElementById('orderCancelModal').classList.remove('show');
}

export async function executeCancelOrder() {
    if (cancelOrderId === -1) return;
    const result = await deleteRemoteOrder(cancelOrderId);
    if (result.success) {
        showToast('Order cancelled');
        closeCancelModal();
        await syncOrders();
        const { updateTrackingUI } = await import('./tracking.js');
        updateTrackingUI();
    } else {
        showToast('Failed to cancel order', true);
    }
}

/* ─── CUSTOMER STATUS DISPLAY ─── */
export function renderOrderStatus() {
    const el = document.getElementById('statusListContainer');
    if (!el) return;
    el.innerHTML = '';
    
    if (!currentTable) {
        renderErrorState(el, 'Session Expired', 'Your dining session has ended. Please scan the QR code at your table to start a new order.', '');
        return;
    }

    const tableOrders = orders.filter(o => o.table === currentTable).sort((a, b) => b.createdAt - a.createdAt);
    
    if (tableOrders.length === 0) {
        renderErrorState(el, 'No Active Orders', 'You haven\'t placed any orders yet. Head over to our menu to discover our authentic ramen bowls!', '');
        return;
    }
    
    tableOrders.forEach(order => {
        const normStatus = normalizeStatus(order.status);
        const minutesAgo = Math.max(0, Math.round((Date.now() - order.createdAt) / 60000));
        const timeLabel = minutesAgo === 0 ? 'Just now' : minutesAgo + ' min ago';
        
        let statusText = '';
        let isActive = false;
        let canModify = (normStatus === 'new');

        if (normStatus === 'new') { statusText = 'Pending'; isActive = true; }
        else if (normStatus === 'prep') { statusText = 'Preparing'; isActive = true; }
        else if (normStatus === 'done') { statusText = 'Ready to Serve'; isActive = false; }
        
        if (normStatus === 'done' && !order.customerNotified) {
            showToast('Your ' + order.item + ' is ready!', false);
            order.customerNotified = true;
        }

        const card = document.createElement('div');
        card.className = `status-card status-${normStatus}`;
        card.innerHTML = `
            <div class="status-card-header">
                <div class="status-id-badge">Order #${order.id}</div>
                <div class="status-indicator">
                    <span class="status-dot ${isActive ? 'pulse' : ''}"></span>
                    ${statusText}
                </div>
            </div>
            <div class="status-item-details">
                <div class="status-item-name">${order.item} × ${order.qty}</div>
                ${order.notes && order.notes !== '—' ? `<div class="status-item-notes">${order.notes}</div>` : ''}
            </div>
            
            <div class="status-card-controls">
                <button class="status-edit-btn" ${!canModify ? 'disabled' : ''} onclick="window.openEditForExistingOrder(${order.id})">
                    Modify
                </button>
                <button class="status-cancel-btn" ${!canModify ? 'disabled' : ''} onclick="window.confirmCancelOrder(${order.id})">
                    Cancel
                </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 8px;">
                <div class="time-chip">${timeLabel}</div>
                <div style="font-size: 10px; color: var(--mid); text-transform: uppercase; letter-spacing: 0.5px;">Table ${order.table}</div>
            </div>
        `;
        el.appendChild(card);
    });
}

export function renderErrorState(container, title, message, icon) {
    container.innerHTML = `
        <div class="status-error-state">
            <div class="status-error-icon">${icon}</div>
            <div class="status-error-title">${title}</div>
            <div class="status-error-msg">${message}</div>
            <button class="back-btn" onclick="window.showPage('menu')" style="max-width: 200px; margin-top: 12px;">Back to Menu</button>
        </div>
    `;
}

export function toggleMobileNav() {
    const navLinks = document.getElementById('navLinks');
    const burgerBtn = document.getElementById('burgerBtn');
    if (navLinks) navLinks.classList.toggle('active');
    if (burgerBtn) burgerBtn.classList.toggle('active');
}

export function closeMobileNav() {
    const navLinks = document.getElementById('navLinks');
    const burgerBtn = document.getElementById('burgerBtn');
    if (navLinks) navLinks.classList.remove('active');
    if (burgerBtn) burgerBtn.classList.remove('active');
}
