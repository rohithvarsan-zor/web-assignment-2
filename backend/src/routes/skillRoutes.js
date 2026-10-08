const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { successResponse } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT id, name FROM skills';
    const params = [];

    if (search) {
      sql += ' WHERE name ILIKE $1';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC';
    const result = await query(sql, params);
    return successResponse(res, result.rows, 'Skills fetched successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
