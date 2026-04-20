const pool = require('../config/db');

/**
 * GET /api/menu
 * Query params: ?category=mains|sides|drinks
 */
async function getAllMenuItems(req, res, next) {
    try {
        const { category, all } = req.query;
        let sql = 'SELECT * FROM menu_items WHERE 1=1';
        const params = [];

        if (all !== 'true') {
            sql += ' AND is_available = TRUE';
        }

        if (category && category !== 'all') {
            sql += ' AND category = ?';
            params.push(category);
        }

        sql += ' ORDER BY category, name';
        const [rows] = await pool.query(sql, params);

        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/menu/:id
 */
async function getMenuItemById(req, res, next) {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM menu_items WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/menu/:id/availability
 * Body: { is_available: boolean }
 */
async function updateMenuItemAvailability(req, res, next) {
    try {
        const { is_available } = req.body;
        
        if (typeof is_available !== 'boolean' && is_available !== 'true' && is_available !== 'false') {
            return res.status(400).json({ success: false, message: 'is_available boolean is required' });
        }
        
        const availability = is_available === true || is_available === 'true';

        const [result] = await pool.query(
            'UPDATE menu_items SET is_available = ? WHERE id = ?',
            [availability, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.json({ success: true, message: 'Menu item availability updated', data: { id: parseInt(req.params.id), is_available: availability } });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllMenuItems, getMenuItemById, updateMenuItemAvailability };
