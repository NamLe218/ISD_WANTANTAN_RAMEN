require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

/* ─── MIDDLEWARE ─── */
app.use(cors());
app.use(express.json());

/* ─── DEBUG LOG (optional) ─── */
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

/* ─── API ROUTES ─── */
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payment', paymentRoutes);

/* ─── STATIC FRONTEND ─── */
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ─── HEALTH CHECK ─── */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🍜 Wantantan Ramen API is running!',
        timestamp: new Date().toISOString()
    });
});

/* ─── FAVICON FALLBACK ─── */
app.get('/favicon.ico', (req, res) => res.status(204).end());

/* ─── SPA FALLBACK ─── */
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Error serving index.html:', err.message);
            next(err);
        }
    });
});

/* ─── ERROR HANDLER ─── */
app.use(errorHandler);

/* ─── START SERVER ─── */
app.listen(PORT, () => {
    console.log(`\n🍜 ═══════════════════════════════════════════════════`);
    console.log(`   01-Wantantan Ramen API Server`);
    console.log(`Server running on port ${PORT}`);
    console.log(`   API Health: http://localhost:${PORT}/api/health`);
    console.log(`═══════════════════════════════════════════════════════\n`);
});