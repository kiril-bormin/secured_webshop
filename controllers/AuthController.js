const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const PEPPER = process.env.PEPPER;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

// Convertit une duree comme "10m" ou "7d" en millisecondes pour les dates d'expiration en BDD.
const parseDurationToMs = (value) => {
  const match = /^([0-9]+)([smhd])$/.exec(value || "");
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (unitMs[unit] || 0);
};

// Hash le refresh token avant de le stocker en base.
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Cree un access token courte duree pour les appels API.
const buildAccessToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

// Cree un refresh token longue duree pour la rotation de session.
const buildRefreshToken = (user) =>
  jwt.sign({ id: user.id, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  // Authentifie un utilisateur et genere les tokens d'acces et de refresh.
  login: (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) return next(err);

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect" });
      }

      const user = results[0];

      // Vérification du mdp données avec celui en base (haché + pepper)
      const passwordWithPepper = password + PEPPER;

      bcrypt.compare(passwordWithPepper, user.password, (err, isMatch) => {
        if (err) return next(err);

        if (!isMatch) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        // Refuse la connexion si le secret refresh n'est pas configure.
        if (!REFRESH_SECRET) {
          const err = new Error("Refresh secret manquant");
          return next(err);
        }

        const token = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);
        const refreshTokenHash = hashToken(refreshToken);
        const refreshExpiresAt = new Date(
          Date.now() + parseDurationToMs(REFRESH_EXPIRES_IN),
        );

        // Enregistre le hash du refresh token pour permettre rotation/revocation.
        const insertQuery =
          "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)";

        db.query(
          insertQuery,
          [user.id, refreshTokenHash, refreshExpiresAt],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Erreur de création du refresh token" });
            }

            res.json({
              message: "Connexion réussie",
              token,
              refreshToken,
              user: { id: user.id, username: user.username, role: user.role },
            });
          },
        );
      });
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  // Cree un compte utilisateur et stocke le mot de passe hashe.
  register: (req, res) => {
    const { username, email, password } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      });
    }

    const passwordWithPepper = password + PEPPER;

    bcrypt.hash(passwordWithPepper, saltRounds, (err, hash) => {
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

  // ----------------------------------------------------------
  // POST /api/auth/refresh
  // ----------------------------------------------------------
  // Echange un refresh token valide contre un nouvel access token.
  refresh: (req, res) => {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token manquant" });
    }
    if (!REFRESH_SECRET) {
      return res.status(500).json({ error: "Refresh secret manquant" });
    }

    // Verifie la signature et le type du refresh token.
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Refresh token invalide" });
    }

    if (!payload || payload.type !== "refresh") {
      return res.status(401).json({ error: "Refresh token invalide" });
    }

    const refreshTokenHash = hashToken(refreshToken);
    // Verifie en BDD que le refresh token n'est ni expire ni revoque.
    const selectQuery =
      "SELECT rt.id, rt.user_id, u.username, u.role FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = ? AND rt.expires_at > NOW() AND (rt.revoked_at IS NULL OR rt.revoked_at > NOW())";

    db.query(selectQuery, [refreshTokenHash], (err, results) => {
      if (err) return res.status(500).json({ error: "Erreur serveur" });
      if (results.length === 0) {
        return res.status(401).json({ error: "Refresh token invalide" });
      }

      const row = results[0];
      const user = {
        id: row.user_id,
        username: row.username,
        role: row.role,
      };

      // Rotation: marque l'ancien refresh token comme révoqué avec une courte tolérance,
      // pour permettre une seconde requête parallèle avant de le rendre définitivement invalide.
      const revokeQuery =
        "UPDATE refresh_tokens SET revoked_at = DATE_ADD(NOW(), INTERVAL 5 SECOND) WHERE id = ?";
      db.query(revokeQuery, [row.id], (revokeErr) => {
        if (revokeErr) {
          return res.status(500).json({ error: "Erreur serveur" });
        }

        const token = buildAccessToken(user);
        const newRefreshToken = buildRefreshToken(user);
        const newRefreshTokenHash = hashToken(newRefreshToken);
        const refreshExpiresAt = new Date(
          Date.now() + parseDurationToMs(REFRESH_EXPIRES_IN),
        );

        // Stocke le hash du nouveau refresh token apres rotation.
        const insertQuery =
          "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)";

        db.query(
          insertQuery,
          [user.id, newRefreshTokenHash, refreshExpiresAt],
          (insertErr) => {
            if (insertErr) {
              return res
                .status(500)
                .json({ error: "Erreur de création du refresh token" });
            }

            res.json({
              message: "Token rafraîchi",
              token,
              refreshToken: newRefreshToken,
            });
          },
        );
      });
    });
  },
};
