const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Endpoint público para autenticación local simulada (mock)
router.post('/login', authController.login);

module.exports = router;
