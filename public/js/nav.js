// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return false;
  }

  const result = await response.json();
  if (result.token) localStorage.setItem("token", result.token);
  if (result.refreshToken) {
    localStorage.setItem("refreshToken", result.refreshToken);
  }
  return true;
};

window.authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = options.headers ? { ...options.headers } : {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
  if (!refreshed) return response;

  const newToken = localStorage.getItem("token");
  const retryHeaders = options.headers ? { ...options.headers } : {};
  if (newToken) retryHeaders.Authorization = `Bearer ${newToken}`;

  return fetch(url, {
    ...options,
    headers: retryHeaders,
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
      localStorage.removeItem("refreshToken");
      window.location.href = "/";
    });
  }
});
