/**
 * Global error handler middleware
 *
 * Handles and formats errors for all routes, providing appropriate
 * HTTP status codes and descriptive messages for known failure scenarios.
 */
module.exports = (err, req, res, next) => {
    console.error("❌ FULL ERROR:", err);

    // ── Determine HTTP status code ──────────────────────────────────
    let status = err.status || err.statusCode || 500;
    let message = err.message || 'An unexpected error occurred';

    // MySQL / database error codes
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
        status = 500;
        message = 'Database schema error. Please contact support.';
    } else if (err.code === 'ER_DUP_ENTRY') {
        status = 409;
        message = 'Duplicate entry: a record with this value already exists.';
    } else if (err.code === 'ER_NO_DEFAULT_FOR_FIELD' || err.code === 'ER_BAD_NULL_ERROR') {
        status = 400;
        message = 'Missing required field. Please check your request and try again.';
    } else if (err.code === 'ER_DATA_TOO_LONG') {
        status = 400;
        message = 'One or more values exceed the allowed length.';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
        status = 503;
        message = 'Failed to connect to the database. Please try again later.';
    }

    // ── Route-specific contextual messages ─────────────────────────
    const path = req.path || '';

    if (status === 500 || status === 503) {
        if (path.includes('/menu') && req.method === 'GET') {
            // Failed to load main menu or item images
            message = 'Failed to load the menu. Please refresh the page or try again later.';
        } else if (path.includes('/menu') && (req.method === 'PATCH' || req.method === 'PUT')) {
            // Failed to update price / availability after selection
            message = 'Failed to update item information. Please try again.';
        } else if (path.includes('/orders') && req.method === 'POST') {
            message = 'Failed to place your order. Please check your connection and try again.';
        } else if (path.includes('/orders') && req.method === 'PATCH') {
            message = 'Failed to update the order. Please try again.';
        } else if (path.includes('/orders') && req.method === 'DELETE') {
            message = 'Failed to cancel the order. Please try again.';
        } else if (path.includes('/payment')) {
            message = 'Payment processing failed. Please try a different payment method.';
        }
    }

    // ── Send response ───────────────────────────────────────────────
    const body = {
        success: false,
        message,
    };

    // Include extra debug info only in development
    if (process.env.NODE_ENV !== 'production') {
        body.code = err.code;
        body.sqlMessage = err.sqlMessage;
        body.stack = err.stack;
    }

    res.status(status).json(body);
};