function toggleMenu() {
  const menuLinks = document.querySelector(".menu-links");
  const hamburgerIcon = document.querySelector(".hamburger-icon");

  if (menuLinks) {
    menuLinks.classList.toggle("open");
  }

  if (hamburgerIcon) {
    hamburgerIcon.classList.toggle("open");
  }
}

// Fermer le menu si on clique en dehors
document.addEventListener("click", function (e) {
  const nav = document.getElementById("hamburger-nav");
  const menuLinks = document.querySelector(".menu-links");
  const hamburgerIcon = document.querySelector(".hamburger-icon");

  if (nav && !nav.contains(e.target)) {
    if (menuLinks) menuLinks.classList.remove("open");
    if (hamburgerIcon) hamburgerIcon.classList.remove("open");
  }
});

// ============================================
// THEME TOGGLE — Dark / Light Mode
// ============================================

function toggleTheme() {
  const body = document.body;
  const isDark = !body.classList.contains("light-mode");

  if (isDark) {
    body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
  } else {
    body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }

  updateThemeIcons();
}

function updateThemeIcons() {
  const isLight = document.body.classList.contains("light-mode");
  const icons = document.querySelectorAll(".theme-icon");
  icons.forEach((icon) => {
    icon.textContent = isLight ? "🌙" : "☀️";
  });
}

// Au chargement : restaurer le thème sauvegardé
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }
  updateThemeIcons();
});
