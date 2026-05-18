const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // GET /api/admin/users
  // ----------------------------------------------------------
  getUsers: (_req, res, next) => {
    db.query(
      "SELECT id, username, email, role, address FROM users",
      (err, results) => {
        if (err) {
          return next(err);
        }
        res.json(results);
      },
    );
  },
};
