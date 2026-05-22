const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const https = require("https");
const fs = require("fs");

const app = express();

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute = require("./routes/Admin");

app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin", adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");
const {
  authenticateTokenPage,
  authorizeRolePage,
} = require("./middleware/auth");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "login.html")),
);
app.get("/register", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "register.html")),
);
app.get("/profile", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "profile.html")),
);
app.get("/admin", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "admin.html")),
);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Une erreur est survenue sur le serveur." });
});

//config ssl
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
};

// Démarrage du serveur avec l'option https
https.createServer(sslOptions, app).listen(8443, () => {
  console.log("Serveur HTTPS démarré sur https://localhost:8443");
});
