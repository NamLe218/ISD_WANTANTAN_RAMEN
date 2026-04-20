const fs = require('fs');
let html = fs.readFileSync('frontend/index.html', 'utf8');

const payCardRegex = /<div class="pay-card">([\s\S]*?)<\/div>\s*<\/div>\s*<footer>/m;
const checkoutBlock = `<div class="pay-card">
                <h2>Ready to order?</h2>
                <p class="pay-card-sub">Review your items carefully.</p>
                <button class="order-now" onclick="openOrderSummary()">Checkout →</button>
                <button class="back-btn" onclick="showPage('menu', document.querySelector('.nav-links a:nth-child(2)'))">← Back to Menu</button>
            </div>
        </div>
        <footer>`;

html = html.replace(payCardRegex, checkoutBlock);

const paymentModalHtml = `<div class="sheet-backdrop" id="paymentModalBackdrop" onclick="closePaymentModal()"></div>
    <div class="sheet" id="paymentModal" style="text-align: center; padding: 20px;">
        <div class="sheet-head" style="justify-content: center; position: relative; margin-bottom: 5px;">
            <div class="sheet-title">Payment Method</div>
            <button class="sheet-close" onclick="closePaymentModal()" style="position: absolute; right: 0; top: 0;">✕</button>
        </div>
        <p style="font-size: 13px; color: var(--mid); margin-bottom: 16px;">Choose how you will pay.</p>
        
        <div class="pay-method active" data-pay="paid" onclick="selectPay(this)" style="text-align: left; margin-bottom: 10px;">
            <span class="pay-icon">💳</span>
            <div>
                <div class="pay-label">Card / QR Payment</div>
                <div style="font-size:11px; color:#888;">Pay online at this step</div>
            </div>
            <span class="pay-status-badge paid">PAID</span>
        </div>

        <div class="pay-method" data-pay="unpaid" onclick="selectPay(this)" style="text-align: left; margin-bottom: 20px;">
            <span class="pay-icon">💵</span>
            <div>
                <div class="pay-label">Cash at Counter</div>
                <div style="font-size:11px; color:#888;">Pay when picking up or after dining</div>
            </div>
            <span class="pay-status-badge unpaid">UNPAID</span>
        </div>

        <button class="order-now" onclick="confirmPaymentAndSend()">✓ Confirm &amp; Send to Kitchen</button>
    </div>
`;
html = html.replace('</body>', paymentModalHtml + '</body>');

const confirmModalRegex = /<div class="order-confirm-modal" id="orderConfirmModal"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/;
const newConfirmModal = `<div class="order-confirm-modal" id="orderConfirmModal" role="dialog" aria-modal="true" aria-labelledby="orderConfirmTitle">
        <div class="divider-kanji" style="margin-bottom:8px;">🛒</div>
        <h3 id="orderConfirmTitle" style="margin-bottom:12px;">Order Summary</h3>
        <div id="orderSummaryList" style="max-height: 200px; overflow-y: auto; text-align: left; margin-bottom: 16px; border: 1px solid #eee; padding: 10px; border-radius: 8px; font-size: 13px;">
            <!-- populated by JS -->
        </div>
        <div class="order-confirm-actions">
            <button class="order-confirm-btn" onclick="approveOrderSummary()">Approve &amp; Continue</button>
            <button class="order-cancel-btn" onclick="closeOrderSummary()">Cancel</button>
        </div>
    </div>`;
html = html.replace(confirmModalRegex, newConfirmModal);

fs.writeFileSync('frontend/index.html', html);
