const express = require("express");
const router = express.Router();
const controller = require("../controllers/AuthController");
const rateLimit = require("express-rate-limit");

// Limiteur pour le login afin de prévenir le brute-force
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // fois 5 requêtes
  message: {
    error:
      "Trop de tentatives de connexion, veuillez réessayer dans une minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, controller.login);
router.post("/register", controller.register);
router.post("/refresh", controller.refresh);

module.exports = router;
