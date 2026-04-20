const express = require('express');
const router = express.Router();
const { getAllMenuItems, getMenuItemById, updateMenuItemAvailability } = require('../controllers/menuController');

// GET /api/menu         — list all menu items (optionally filter by ?category=)
router.get('/', getAllMenuItems);

// GET /api/menu/:id     — get a single menu item
router.get('/:id', getMenuItemById);

// PATCH /api/menu/:id/availability — toggle in-stock status
router.patch('/:id/availability', updateMenuItemAvailability);

module.exports = router;
