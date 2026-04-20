const pool = require('../config/db');

/**
 * POST /api/orders
 * Body: { table_id, items: [{ item_name, qty, notes, item_type, total_price, payment_status }] }
 */
async function createOrder(req, res, next) {
    try {
        const { table_id, items, payment_status } = req.body;

        if (!table_id || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: 'table_id and at least one item are required',
            });
        }

        // --- Out of stock management check ---
        const itemNames = items.map(i => i.item_name);
        const [menuItems] = await pool.query(
            'SELECT name, is_available FROM menu_items WHERE name IN (?)',
            [itemNames]
        );

        const outOfStock = [];
        items.forEach(item => {
            const menuItem = menuItems.find(m => m.name === item.item_name);
            if (menuItem && !menuItem.is_available) {
                outOfStock.push(item.item_name);
            }
        });

        if (outOfStock.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot place order. The following items are out of stock: ${outOfStock.join(', ')}`,
                outOfStock
            });
        }
        // -------------------------------------

        const insertedIds = [];

        for (const item of items) {
            const [result] = await pool.query(
                `INSERT INTO orders (table_id, item_name, qty, notes, status, payment_status, item_type, total_price, customer_notified)
                 VALUES (?, ?, ?, ?, 'new', ?, ?, ?, FALSE)`,
                [
                    table_id,
                    item.item_name,
                    item.qty || 1,
                    item.notes || '—',
                    payment_status || item.payment_status || 'unpaid',
                    item.item_type || 'food',
                    item.total_price || 0,
                ]
            );
            insertedIds.push(result.insertId);
        }

        res.status(201).json({
            success: true,
            message: `${insertedIds.length} order(s) created`,
            data: { order_ids: insertedIds },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/orders
 * Query params: ?status=new|prep|done  &type=food|drinks
 */
async function getAllOrders(req, res, next) {
    try {
        const { status, type, table_id } = req.query;
        let sql = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (type) {
            sql += ' AND item_type = ?';
            params.push(type);
        }
        if (table_id) {
            sql += ' AND table_id = ?';
            params.push(table_id);
        }

        sql += ' ORDER BY created_at ASC';
        const [rows] = await pool.query(sql, params);

        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/orders/:id
 */
async function getOrderById(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/orders/:id
 * Body: { status, qty, notes, customer_notified }
 */
async function updateOrder(req, res, next) {
    try {
        const updateFields = [];
        const params = [];

        const { status, qty, notes, customer_notified } = req.body;

        const validStatuses = ['new', 'prep', 'done', 'cancelled'];
        if (status !== undefined) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                });
            }
            updateFields.push('status = ?');
            params.push(status);
        }

        if (qty !== undefined) {
            updateFields.push('qty = ?');
            params.push(parseInt(qty, 10));
        }

        if (notes !== undefined) {
            updateFields.push('notes = ?');
            params.push(notes);
        }

        if (customer_notified !== undefined) {
            updateFields.push('customer_notified = ?');
            params.push(customer_notified === true || customer_notified === 'true');
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(req.params.id);

        const sql = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order updated', data: { id: parseInt(req.params.id) } });
    } catch (err) {
        next(err);
    }
}

/**
 * DELETE /api/orders/:id
 */
async function deleteOrder(req, res, next) {
    try {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order deleted' });
    } catch (err) {
        next(err);
    }
}

module.exports = { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder };
