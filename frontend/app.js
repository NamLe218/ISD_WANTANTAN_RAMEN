import { setOrders, incrementNextOrderId, syncOrders, syncMenu, setCart } from './js/state.js';
import { showPage, showToast } from './js/ui.js';
import { openSheetForItem, changeSheetQty, changeSheetQtyRamen, confirmSheet, closeSheet, openRamen, openRamenFromHome, chooseSingle, toggleTopping, addMenuItem, openEditFromCart, openEditForExistingOrder, changeCartQty, removeCartItem, confirmOrder, processOrder, completeQrPayment, closeQrModal } from './js/cart.js';
import { checkAdminAccess, updateOrderStatus, renderKitchen as updateKitchenUI, toggleStock, applyStockVisuals } from './js/admin.js';
import { markAsDelivered, renderDeliveryBoard as updateDeliveryUI } from './js/delivery.js';
import { confirmCancelOrder, closeCancelModal, executeCancelOrder } from './js/ui.js';
import { acknowledgeOrder, updateQueueOrderStatus, openKitchenOrderDetail, closeKitchenOrderDetail, renderKitchenQueue as updateKitchenQueueUI, isKitchenModalOpen, updateStatusFromModal } from './js/kitchen.js';
import { cancelOrder, updateTrackingUI, checkOrderStatuses } from './js/tracking.js';

/* ─── ATTACH TO WINDOW FOR HTML ONCLICK ─── */
window.showPage = showPage;
window.showToast = showToast;
window.checkAdminAccess = checkAdminAccess;
window.closeSheet = closeSheet;
window.markAsDelivered = markAsDelivered;
window.acknowledgeOrder = acknowledgeOrder;
window.openKitchenOrderDetail = openKitchenOrderDetail;
window.cancelOrder = cancelOrder;

window.closeKitchenOrderDetail = closeKitchenOrderDetail;
window.updateQueueOrderStatus = updateQueueOrderStatus;
window._ktUpdateStatus = updateStatusFromModal;
window.setFilter = (btn) => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterMenu(btn.dataset.category, document.getElementById('menuSearch').value.trim());
};
window.filterMenuBySearch = () => {
    const active = document.querySelector('.filter-tab.active');
    filterMenu(active ? active.dataset.category : 'all', document.getElementById('menuSearch').value.trim());
};
window.openRamen = openRamen;
window.openRamenFromHome = openRamenFromHome;
window.addMenuItem = addMenuItem;
window.changeSheetQty = changeSheetQty;
window.changeSheetQtyRamen = changeSheetQtyRamen;
window.confirmSheet = confirmSheet;
window.chooseSingle = chooseSingle;
window.toggleTopping = toggleTopping;
window.openEditFromCart = openEditFromCart;
window.changeCartQty = changeCartQty;
window.removeCartItem = removeCartItem;
window.confirmOrder = confirmOrder;
window.completeQrPayment = completeQrPayment;
window.closeQrModal = closeQrModal;
window.updateOrderStatus = updateOrderStatus;
window.toggleStock = toggleStock;
window.openEditForExistingOrder = openEditForExistingOrder;
window.confirmCancelOrder = confirmCancelOrder;
window.closeCancelModal = closeCancelModal;
window.executeCancelOrder = executeCancelOrder;
window.selectPay = (el) => {
    document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
};

setInterval(checkOrderStatuses, 1000);

function filterMenu(category, term) {
    term = (term || '').toLowerCase();
    document.querySelectorAll('#menuGrid .menu-card').forEach(card => {
        const matchCat = category === 'all' || card.dataset.category === category;
        const matchText = !term || (card.dataset.name || '').toLowerCase().includes(term);
        card.style.display = matchCat && matchText ? 'flex' : 'none';
    });
}

/* ─── CLOCK ─── */
function updateClock() {
    const el = document.getElementById('kitchenClock');
    const el2 = document.getElementById('adminClock');
    const t = new Date().toLocaleTimeString('vi-VN');
    if (el) el.textContent = t;
    if (el2) el2.textContent = t;
}
setInterval(updateClock, 1000);
updateClock();

/* ─── INITIALIZATION ─── */
window.addEventListener('load', async () => {
    // Hydrate state from Backend
    await syncMenu(true);
    await syncOrders();
    import('./js/ui.js').then(ui => ui.renderMenu());
    applyStockVisuals(); // Apply overlays to hardcoded home page cards

    // Auto-refresh logic for real-time updates
    setInterval(async () => {
        const statusPage = document.getElementById('page-status');
        const adminPage = document.getElementById('page-admin-dash');
        const deliveryPage = document.getElementById('page-delivery');
        const kitchenQueuePage = document.getElementById('page-kitchen');

        const isDataPageActive = (statusPage && statusPage.classList.contains('active')) ||
            (adminPage && adminPage.classList.contains('active')) ||
            (deliveryPage && deliveryPage.classList.contains('active')) ||
            (kitchenQueuePage && kitchenQueuePage.classList.contains('active'));

        if (isDataPageActive) {
            await syncOrders();
            if (statusPage && statusPage.classList.contains('active')) updateOrderStatusUI();
            if (adminPage && adminPage.classList.contains('active')) updateKitchenUI();
            if (deliveryPage && deliveryPage.classList.contains('active')) updateDeliveryUI();
            if (kitchenQueuePage && kitchenQueuePage.classList.contains('active') && !isKitchenModalOpen()) updateKitchenQueueUI();
        }
    }, 5000); // Check every 5 seconds

    const url = new URL(window.location.href);
    const payment = url.searchParams.get("payment");
    const orderId = url.searchParams.get("orderId");

    let isPaymentReturn = false;
    if (payment === "success") {
        const pendingCart = localStorage.getItem('pending_cart');
        if (pendingCart) {
            setCart(JSON.parse(pendingCart));
            localStorage.removeItem('pending_cart');
        }
        processOrder('paid', orderId);
        isPaymentReturn = true;
    }
    if (payment === "fail") {
        showToast('Payment failed!', true);
        isPaymentReturn = true;
    }
    if (payment === "invalid") {
        showToast('Payment verification failed!', true);
        isPaymentReturn = true;
    }
    if (isPaymentReturn) {
        showPage('order', document.querySelector('.nav-links a:nth-child(3)'));
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
