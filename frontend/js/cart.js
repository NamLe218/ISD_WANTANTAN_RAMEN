import { cart, setCart, orders, setOrders, currentTable, incrementNextOrderId, PRICES, TOPPING_PRICE, syncOrders, menu, setTrackedOrderIds, trackedOrderIds } from './state.js';
import { showToast, showPage, updateCartUI, formatVND, isRamenItem, inferType } from './ui.js';
import { payWithVNPay, createRemoteOrder, updateRemoteOrder } from './api.js';
import { renderKitchen } from './admin.js';

let sheetMode = 'add'; // 'add' | 'edit' | 'modify'
let sheetIndex = -1;
let sheetOrderId = -1;
let sheetItemName = '';
let sheetQtyValue = 1;     // for non-ramen items
let sheetRamenQty = 1;     // for ramen items

/* ─── FUNCTIONS CALLED FROM MENU / HTML ─── */

export function openRamen(name) {
    openSheetForItem(name, 'add');
}

export function openRamenFromHome(name) {
    openSheetForItem(name, 'add');
}

export function addMenuItem(name) {
    openSheetForItem(name, 'add');
}

export function chooseSingle(btn) {
    const group = btn.closest('.option-buttons');
    group.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateSheetPrice();
}

export function toggleTopping(btn) {
    btn.classList.toggle('active');
    updateSheetPrice();
}

export function completeQrPayment() {
    closeQrModal();
    processOrder('paid');
}

export function closeQrModal() {
    document.getElementById('qrModalBackdrop').classList.remove('show');
    document.getElementById('qrModal').classList.remove('show');
}

export function openSheetForItem(name, mode, index) {
    const menuItem = menu.find(m => m.name === name);
    if (menuItem && (menuItem.is_available === 0 || menuItem.is_available === false)) {
        showToast("This item is currently out of stock", true);
        return;
    }

    sheetMode = mode || 'add';
    sheetIndex = typeof index === 'number' ? index : -1;
    sheetItemName = name;
    sheetQtyValue = 1;
    sheetRamenQty = 1;

    const ramen = isRamenItem(name);

    document.getElementById('sheetTitle').textContent =
        sheetMode === 'modify' ? 'Modify Your Order' :
            (ramen ? 'Customise Your Ramen' : 'Add to Order');

    document.getElementById('sheetSub').textContent = ramen
        ? 'Choose one in each category. Toppings are optional.'
        : 'Adjust quantity before adding.';

    document.getElementById('sheetRamen').style.display = ramen ? 'block' : 'none';
    document.getElementById('sheetSimple').style.display = ramen ? 'none' : 'block';
    document.getElementById('sheetQtyRamen').style.display = ramen ? 'flex' : 'none';

    document.getElementById('sheetPrimaryBtn').textContent =
        sheetMode === 'modify' ? 'Update Order' :
            (mode === 'edit' ? 'Update Item' : 'Add to Order');

    document.getElementById('sheetQty').textContent = '1';
    document.getElementById('sheetRamenQtyNum').textContent = '1';

    const imgEl = Array.from(document.querySelectorAll('.menu-card-name')).find(el => el.textContent.trim() === name);
    if (imgEl) {
        const card = imgEl.closest('.menu-card');
        const src = card.querySelector('img').src;
        if (document.getElementById('sheetImage')) document.getElementById('sheetImage').src = src;
        if (document.getElementById('sheetImgContainer')) document.getElementById('sheetImgContainer').style.display = 'block';

        const catEl = card.querySelector('.menu-card-cat');
        if (document.getElementById('sheetCat')) document.getElementById('sheetCat').textContent = catEl ? catEl.textContent : '';

        const descEl = card.querySelector('.menu-card-desc');
        if (document.getElementById('sheetDesc')) {
            document.getElementById('sheetDesc').textContent = descEl ? descEl.textContent : '';
            document.getElementById('sheetDesc').style.display = descEl ? 'block' : 'none';
        }
    } else {
        if (document.getElementById('sheetImgContainer')) document.getElementById('sheetImgContainer').style.display = 'none';
        if (document.getElementById('sheetCat')) document.getElementById('sheetCat').textContent = '';
        if (document.getElementById('sheetDesc')) {
            document.getElementById('sheetDesc').textContent = '';
            document.getElementById('sheetDesc').style.display = 'none';
        }
    }

    resetSheetDefaults(ramen);
    updateSheetPrice();

    document.getElementById('sheetBackdrop').classList.add('show');
    document.getElementById('sheet').classList.add('show');
}

export function closeSheet() {
    document.getElementById('sheetBackdrop').classList.remove('show');
    document.getElementById('sheet').classList.remove('show');
}

export function resetSheetDefaults(ramen) {
    if (!ramen) return;
    const defaults = { noodleType: 'Thin straight', firmness: 'Normal', saltiness: 'Regular' };
    document.querySelectorAll('#sheetRamen .option-buttons').forEach(group => {
        const isToppings = group.dataset.key === 'toppings';
        const btns = Array.from(group.querySelectorAll('.opt-btn'));
        btns.forEach(b => b.classList.remove('active'));
        if (!isToppings) {
            const defaultBtn = btns.find(b => b.dataset.value === defaults[group.dataset.key]) || btns[0];
            if (defaultBtn) defaultBtn.classList.add('active');
        }
    });
}

export function updateSheetPrice() {
    const el = document.getElementById('sheetPriceLine');
    if (!el) return;
    try {
        const base = PRICES[sheetItemName] || 0;
        if (isRamenItem(sheetItemName)) {
            const toppings = document.querySelectorAll('#sheetRamen .opt-btn.toggle.active').length;
            el.textContent = formatVND((base + toppings * TOPPING_PRICE) * sheetRamenQty);
        } else {
            el.textContent = formatVND(base * sheetQtyValue);
        }
    } catch (err) {
        console.error('Failed to update price after selection:', err);
        el.textContent = '—';
        showToast('Failed to update price. Please try again.', true);
    }
}

export function changeSheetQty(delta) {
    const newQty = sheetQtyValue + delta;
    if (newQty < 1) {
        showToast('Minimum quantity is 1.', true);
        return;
    }
    if (newQty > 10) {
        showToast('Maximum quantity is 10.', true);
        return;
    }
    sheetQtyValue = newQty;
    document.getElementById('sheetQty').textContent = String(sheetQtyValue);
    updateSheetPrice();
}

export function changeSheetQtyRamen(delta) {
    const newQty = sheetRamenQty + delta;
    if (newQty < 1) {
        showToast('Minimum quantity is 1.', true);
        return;
    }
    if (newQty > 10) {
        showToast('Maximum quantity is 10.', true);
        return;
    }
    sheetRamenQty = newQty;
    document.getElementById('sheetRamenQtyNum').textContent = String(sheetRamenQty);
    updateSheetPrice();
}

export async function confirmSheet() {
    const ramen = isRamenItem(sheetItemName);
    const qty = ramen ? sheetRamenQty : sheetQtyValue;

    // ── Validate quantity ───────────────────────────────────────────
    if (qty < 1 || qty > 10) {
        showToast('Invalid quantity — please enter a value between 1 and 10.', true);
        return;
    }

    // ── Validate ramen customisation is not left empty ───────────────
    if (ramen) {
        const missingGroups = [];
        document.querySelectorAll('#sheetRamen .option-buttons').forEach(group => {
            const key = group.dataset.key;
            if (key === 'toppings') return; // toppings are optional
            const active = group.querySelector('.opt-btn.active');
            if (!active) missingGroups.push(key);
        });
        if (missingGroups.length > 0) {
            const label = missingGroups
                .map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()))
                .join(', ');
            showToast(`Please select an option for: ${label}.`, true);
            return;
        }
    }

    if (sheetMode === 'modify') {
        let updateData = { qty };
        if (ramen) {
            const sel = getRamenSelections('#sheetRamen');
            updateData.notes = buildRamenNotes(sel);
        }

        const result = await updateRemoteOrder(sheetOrderId, updateData);
        if (result.success) {
            showToast('Order updated successfully');
            await syncOrders();
            showPage('status', document.getElementById('nav-status'));
        } else {
            showToast('Failed to update order', true);
        }
        return;
    }

    if (sheetMode === 'edit' && cart[sheetIndex]) {
        if (ramen) {
            const sel = getRamenSelections('#sheetRamen');
            const price = (PRICES[sheetItemName] + (sel.toppings || []).length * TOPPING_PRICE) * qty;
            cart[sheetIndex] = { name: sheetItemName, qty, notes: buildRamenNotes(sel), price, type: inferType(sheetItemName) };
        } else {
            const unit = PRICES[sheetItemName] || 0;
            cart[sheetIndex].qty = qty;
            cart[sheetIndex].price = unit * qty;
        }
        updateCartUI();
        showToast('Item updated');
        closeSheet();
        return;
    }

    if (ramen) {
        const sel = getRamenSelections('#sheetRamen');
        const price = (PRICES[sheetItemName] + (sel.toppings || []).length * TOPPING_PRICE) * qty;
        cart.push({ name: sheetItemName, qty, notes: buildRamenNotes(sel), price, type: 'food' });
    } else {
        const unit = PRICES[sheetItemName];
        if (!unit) { showToast('Item not available', true); return; }
        cart.push({ name: sheetItemName, qty, notes: '—', price: unit * qty, type: inferType(sheetItemName) });
    }

    updateCartUI();
    showToast('Added to order — ' + sheetItemName);
    closeSheet();
}

export function getRamenSelections(scopeSelector) {
    const sel = {};
    document.querySelectorAll(scopeSelector + ' .option-buttons').forEach(group => {
        const key = group.dataset.key;
        if (key === 'toppings') {
            sel[key] = Array.from(group.querySelectorAll('.opt-btn.toggle.active')).map(b => b.dataset.value);
        } else {
            const active = group.querySelector('.opt-btn.active');
            sel[key] = active ? active.dataset.value : null;
        }
    });
    return sel;
}

export function buildRamenNotes(sel) {
    return [
        'Noodles: ' + (sel.noodleType || 'Thin straight'),
        'Firmness: ' + (sel.firmness || 'Normal'),
        'Saltiness: ' + (sel.saltiness || 'Regular'),
        'Toppings: ' + ((sel.toppings && sel.toppings.length) ? sel.toppings.join(', ') : 'None'),
    ].join(' · ');
}

export function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

export function changeCartQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    const unitPrice = item.price / item.qty;
    item.qty = Math.max(1, item.qty + delta);
    item.price = unitPrice * item.qty;
    updateCartUI();
}

export function openEditFromCart(index) {
    const item = cart[index];
    if (!item) return;
    sheetRamenQty = item.qty;
    sheetQtyValue = item.qty;
    openSheetForItem(item.name, 'edit', index);
    document.getElementById('sheetQty').textContent = String(item.qty);
    document.getElementById('sheetRamenQtyNum').textContent = String(item.qty);
}

export function openEditForExistingOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    sheetMode = 'modify';
    sheetOrderId = orderId;
    sheetItemName = order.item;
    sheetQtyValue = order.qty;
    sheetRamenQty = order.qty;

    openSheetForItem(order.item, 'modify', -1);

    // Set quantities
    document.getElementById('sheetQty').textContent = String(order.qty);
    document.getElementById('sheetRamenQtyNum').textContent = String(order.qty);

    // If it's a ramen, try to pre-select based on notes
    if (isRamenItem(order.item) && order.notes) {
        const parts = order.notes.split(' · ');
        parts.forEach(p => {
            if (!p.includes(':')) return;
            const [key, val] = p.split(':').map(s => s.trim());
            if (key === 'Noodles') setActiveOption('noodleType', val);
            if (key === 'Firmness') setActiveOption('firmness', val);
            if (key === 'Saltiness') setActiveOption('saltiness', val);
            if (key === 'Toppings' && val !== 'None') {
                const tops = val.split(', ');
                document.querySelectorAll('#sheetRamen .opt-btn.toggle').forEach(btn => {
                    if (tops.includes(btn.dataset.value)) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
            }
        });
    }
}

function setActiveOption(groupKey, value) {
    const group = document.querySelector(`#sheetRamen .option-buttons[data-key="${groupKey}"]`);
    if (!group) return;
    group.querySelectorAll('.opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
}

export function askOrderConfirm() {
    const backdrop = document.getElementById('orderConfirmBackdrop');
    const modal = document.getElementById('orderConfirmModal');
    const btnYes = document.getElementById('orderConfirmYes');
    const btnNo = document.getElementById('orderConfirmNo');

    if (!backdrop || !modal || !btnYes || !btnNo) return Promise.resolve(true);

    backdrop.classList.add('show');
    modal.classList.add('show');

    return new Promise(resolve => {
        const cleanup = () => {
            backdrop.classList.remove('show');
            modal.classList.remove('show');
            btnYes.removeEventListener('click', onConfirm);
            btnNo.removeEventListener('click', onCancel);
            backdrop.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeydown);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const onKeydown = (e) => {
            if (e.key === 'Escape') onCancel();
        };

        btnYes.addEventListener('click', onConfirm);
        btnNo.addEventListener('click', onCancel);
        backdrop.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeydown);
    });
}

export async function confirmOrder() {
    if (!cart.length) {
        showToast('Add items before confirming!', true);
        return;
    }

    const userConfirmed = await askOrderConfirm();
    if (!userConfirmed) return;

    const payEl = document.querySelector('.pay-method.active');
    const isQR = payEl && payEl.dataset.pay === 'paid';

    if (isQR) {
        const orderId = "ORDER_" + Date.now();
        const amount = cart.reduce((sum, item) => sum + item.price, 0);

        payWithVNPay(orderId, amount);

        return; 
    }

    processOrder('unpaid');
}

export async function processOrder(paymentStatus, externalOrderId = null) {
    if (!cart.length) return;

    const result = await createRemoteOrder(currentTable, cart, paymentStatus);

    if (result.success) {
        // Track the newly created orders
        const newIds = result.data.order_ids || [];
        setTrackedOrderIds([...trackedOrderIds, ...newIds]);

        setCart([]);
        updateCartUI();
        await syncOrders(); // Refresh local list from server

        if (paymentStatus === 'paid') {
            showToast('✅ Payment success & order sent!');
        } else {
            showToast('Order sent (cash)');
        }
        showPage('status', document.querySelector('.nav-links a:nth-child(4)'));
    } else {
        showToast('Failed to place order: ' + result.message, true);
    }
}
