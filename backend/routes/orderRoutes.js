const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
} = require('../controllers/orderController');

// POST   /api/orders       — create order(s) from cart
router.post('/', createOrder);

// GET    /api/orders       — list all orders (optionally filter by ?status= &type=)
router.get('/', getAllOrders);

// GET    /api/orders/:id   — get a single order
router.get('/:id', getOrderById);

// PATCH  /api/orders/:id   — update order details (status, qty, notes, notifications)
router.patch('/:id', updateOrder);

// DELETE /api/orders/:id   — delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
