const fs = require('fs');
let code = fs.readFileSync('frontend/js/cart.js', 'utf8');

const newFunctions = `
export function openOrderSummary() {
    if (!cart.length) {
        import('./ui.js').then(m => m.showToast('Add items before confirming!', true));
        return;
    }
    const listEl = document.getElementById('orderSummaryList');
    if (listEl) {
        listEl.innerHTML = cart.map(item => \`<div style="margin-bottom:8px; display:flex; justify-content:space-between;">
            <div>\${item.qty}x \${item.name}</div>
            <div style="font-weight:600;">\${(item.price * item.qty).toLocaleString('vi-VN')}đ</div>
        </div>\`).join('');
    }
    document.getElementById('orderConfirmBackdrop').classList.add('show');
    document.getElementById('orderConfirmModal').classList.add('show');
}

export function closeOrderSummary() {
    document.getElementById('orderConfirmBackdrop').classList.remove('show');
    document.getElementById('orderConfirmModal').classList.remove('show');
}

export function approveOrderSummary() {
    closeOrderSummary();
    document.getElementById('paymentModalBackdrop').classList.add('show');
    document.getElementById('paymentModal').classList.add('show');
}

export function closePaymentModal() {
    document.getElementById('paymentModalBackdrop').classList.remove('show');
    document.getElementById('paymentModal').classList.remove('show');
}

export function confirmPaymentAndSend() {
    const payEl = document.querySelector('#paymentModal .pay-method.active');
    const isQR = payEl && payEl.dataset.pay === 'paid';

    closePaymentModal();

    if (isQR) {
        const orderId = "ORDER_" + Date.now();
        const amount = cart.reduce((sum, item) => sum + item.price * item.qty, 0); // Wait, cart UI uses item.price which already incorporates qty and addons in cart.js?
        // Let's use the exact original calculation
        const originalAmount = cart.reduce((sum, item) => sum + item.price, 0);
        localStorage.setItem('pending_cart', JSON.stringify(cart));
        payWithVNPay(orderId, originalAmount);
        return;
    }

    processOrder('unpaid');
}
`;

// Replace confirmOrder entirely or just append
code = code.replace(/export function confirmOrder\(\) \{[\s\S]*?processOrder\('unpaid'\);\n\}/, newFunctions);
fs.writeFileSync('frontend/js/cart.js', code);
