const express = require('express');
const router = express.Router();
const { getAllTables, updateTableStatus } = require('../controllers/tableController');

// GET   /api/tables       — list all tables
router.get('/', getAllTables);

// PATCH /api/tables/:id   — update table occupied status
router.patch('/:id', updateTableStatus);

module.exports = router;
