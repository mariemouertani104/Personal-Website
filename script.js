function toggleMenu() {
  const menuLinks = document.querySelector(".menu-links"); // Use querySelector for a single element
  const hamburgerIcon = document.querySelector(".hamburger-icon"); // Use querySelector for a single element

  if (menuLinks) {
    menuLinks.classList.toggle("open");
  }

  if (hamburgerIcon) {
    hamburgerIcon.classList.toggle("open");
  }
}



 