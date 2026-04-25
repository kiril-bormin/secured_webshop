const express = require("express");
const router = express.Router();
const controller = require("../controllers/AdminController");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

router.get(
  "/users",
  authenticateToken,
  authorizeRole("admin"),
  controller.getUsers,
);

module.exports = router;
