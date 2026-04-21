/**
 * Global error handler middleware
 */
module.exports = (err, req, res, next) => {
    console.error("❌ FULL ERROR:", err);

    res.status(500).json({
        success: false,
        message: err.message,
        code: err.code,
        sqlMessage: err.sqlMessage,
        stack: err.stack
    });
};