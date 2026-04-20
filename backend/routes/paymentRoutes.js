const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qs = require('qs');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

function getVietNamDateString() {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 7)); // GMT+7
    
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${nd.getFullYear()}${pad(nd.getMonth() + 1)}${pad(nd.getDate())}${pad(nd.getHours())}${pad(nd.getMinutes())}${pad(nd.getSeconds())}`;
}

/* ================= CREATE PAYMENT ================= */
router.post('/create-payment', (req, res) => {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
        return res.status(400).json({ error: 'Missing orderId or amount' });
    }

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = getVietNamDateString();

    const ipAddr =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: amount * 100,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    res.json({ paymentUrl });
});

/* ================= RETURN FROM VNPAY ================= */
router.get('/vnpay-return', (req, res) => {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
        return res.redirect('http://localhost:3000/?payment=invalid');
    }

    if (vnp_Params['vnp_ResponseCode'] !== '00') {
        return res.redirect('http://localhost:3000/?payment=fail');
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    return res.redirect(`http://localhost:3000/?payment=success&orderId=${orderId}`);
});

module.exports = router;