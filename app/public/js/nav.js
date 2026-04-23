// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
window.authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = options.headers ? { ...options.headers } : {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("topbar");
  if (!nav) return;
  const user = JSON.parse(localStorage.getItem("user") || "null");

  let links = `<a href="/">Accueil</a>`;

  if (user) {
    links += `<a href="/profile">Profil</a>`;
    if (user.role === "admin" || user.is_admin === 1) {
      // Assuming role based on common practices
      links += `<a href="/admin">Admin</a>`;
    }
    links += `<a href="#" id="logoutBtn">Déconnexion</a>`;
  } else {
    links += `<a href="/login">Connexion</a>`;
    links += `<a href="/register">Inscription</a>`;
  }

  nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                    ${links}
                </nav>
            </div>
        </header>
    `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }
});
