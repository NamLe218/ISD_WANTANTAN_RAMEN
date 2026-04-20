const pool = require('../config/db');

/**
 * GET /api/tables
 */
async function getAllTables(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM tables ORDER BY id');
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/tables/:id
 * Body: { is_occupied: true/false }
 */
async function updateTableStatus(req, res, next) {
    try {
        const { is_occupied } = req.body;

        const [result] = await pool.query(
            'UPDATE tables SET is_occupied = ? WHERE id = ?',
            [is_occupied, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        res.json({ success: true, message: 'Table status updated' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllTables, updateTableStatus };
