const fs = require('fs');
let code = fs.readFileSync('frontend/app.js', 'utf8');

code = code.replace(/import { openSheetForItem.* } from '\.\/js\/cart\.js';/, "import { openSheetForItem, changeSheetQty, changeSheetQtyRamen, confirmSheet, closeSheet, openRamen, openRamenFromHome, chooseSingle, toggleTopping, addMenuItem, openEditFromCart, openEditForExistingOrder, changeCartQty, removeCartItem, processOrder, completeQrPayment, closeQrModal, openOrderSummary, closeOrderSummary, approveOrderSummary, closePaymentModal, confirmPaymentAndSend } from './js/cart.js';");

code = code.replace(/window\.confirmOrder = confirmOrder;/, `window.openOrderSummary = openOrderSummary;
window.closeOrderSummary = closeOrderSummary;
window.approveOrderSummary = approveOrderSummary;
window.closePaymentModal = closePaymentModal;
window.confirmPaymentAndSend = confirmPaymentAndSend;`);

fs.writeFileSync('frontend/app.js', code);
