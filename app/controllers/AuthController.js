const db = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect" });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err)
          return res.status(500).json({ error: "Erreur de vérification" });

        if (!isMatch) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        res.json({
          message: "Connexion réussie",
          user: { id: user.id, username: user.username },
        });
      });
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).json({ error: "Erreur de hachage" });

      const query =
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

      db.query(query, [username, email, hash], (err, results) => {
        if (err) {
          return res.status(500).json({
            error: "Erreur lors de l'inscription",
            details: err.message,
          });
        }

        res.status(201).json({
          message: "Utilisateur créé avec succès",
          userId: results.insertId,
        });
      });
    });
  },
};
