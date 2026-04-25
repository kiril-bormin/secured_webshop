const express = require("express");
const router = express.Router();
const controller = require("../controllers/AuthController");
const { authenticateToken } = require("../middleware/auth");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/refresh", authenticateToken, controller.refresh);

module.exports = router;
