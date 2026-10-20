/* ==========================================================================
   Portfolio - Mariem Ouertani
   Sommaire :
   1. Utilitaires
   2. Thème clair / sombre
   3. Langue EN / FR
   4. Menu mobile (et 4b. section active)
   5. Écran d'intro
   6. Particules d'arrière-plan
   7. Initialisation
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Utilitaires
     ------------------------------------------------------------------------ */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const root = document.documentElement;

  // localStorage peut être indisponible (navigation privée, cookies bloqués)
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* ignoré */ }
    },
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ------------------------------------------------------------------------
     2. Thème clair / sombre
     Le thème est porté par l'attribut data-bs-theme de <html>, ce qui reste
     compatible avec les composants Bootstrap ajoutés plus tard.
     ------------------------------------------------------------------------ */
  function setTheme(theme) {
    root.setAttribute("data-bs-theme", theme);
    storage.set("theme", theme);
  }

  function toggleTheme() {
    setTheme(root.getAttribute("data-bs-theme") === "light" ? "dark" : "light");
    initParticles(); // les particules changent de couleur avec le thème
  }


  /* ------------------------------------------------------------------------
     3. Langue EN / FR
     - data-i18n="cle"                : remplace le contenu de l'élément
     - data-i18n-attr="alt:cle;..."   : remplace un ou plusieurs attributs
     Le contenu anglais présent dans le HTML est mémorisé au chargement, puis
     restauré lorsque l'on repasse en anglais.
     ------------------------------------------------------------------------ */
  const defaults = { text: new Map(), attrs: new Map() };

  function readContent(element) {
    return element.tagName === "TITLE" ? element.textContent : element.innerHTML;
  }

  function writeContent(element, value) {
    if (element.tagName === "TITLE") {
      element.textContent = value;
    } else {
      element.innerHTML = value;
    }
  }

  function parseAttrSpec(spec) {
    return spec
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const separator = pair.indexOf(":");
        return { attr: pair.slice(0, separator).trim(), key: pair.slice(separator + 1).trim() };
      });
  }

  function cacheDefaults() {
    $$("[data-i18n]").forEach((element) => {
      defaults.text.set(element, readContent(element));
    });

    $$("[data-i18n-attr]").forEach((element) => {
      const values = {};
      parseAttrSpec(element.dataset.i18nAttr).forEach(({ attr }) => {
        values[attr] = element.getAttribute(attr);
      });
      defaults.attrs.set(element, values);
    });
  }

  function applyLanguage(lang) {
    const dictionary = lang === "fr" ? TRANSLATIONS.fr : {};

    $$("[data-i18n]").forEach((element) => {
      const translated = dictionary[element.dataset.i18n];
      writeContent(element, translated !== undefined ? translated : defaults.text.get(element));
    });

    $$("[data-i18n-attr]").forEach((element) => {
      parseAttrSpec(element.dataset.i18nAttr).forEach(({ attr, key }) => {
        const translated = dictionary[key];
        element.setAttribute(attr, translated !== undefined ? translated : defaults.attrs.get(element)[attr]);
      });
    });

    // Le bouton affiche la langue vers laquelle on peut basculer
    $$(".lang-label").forEach((label) => {
      label.textContent = lang === "fr" ? "EN" : "FR";
    });

    root.setAttribute("lang", lang);
    storage.set("lang", lang);
  }

  function toggleLanguage() {
    applyLanguage(root.getAttribute("lang") === "fr" ? "en" : "fr");
  }


  /* ------------------------------------------------------------------------
     4. Menu mobile
     ------------------------------------------------------------------------ */
  function initMenu() {
    const toggle = $("#nav-toggle");
    const menu = $("#nav-menu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));

    // Ferme le menu après un clic sur un lien, en dehors du menu, ou avec Échap
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-nav")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }


  /* ------------------------------------------------------------------------
     4b. Section active dans la barre de navigation
     ------------------------------------------------------------------------ */
  function initScrollSpy() {
    const links = $$(".nav-menu a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    const linkById = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
    const sections = [...linkById.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const setActive = (id) => {
      linkById.forEach((link, key) => {
        link.classList.toggle("is-active", key === id);
        if (key === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    // La section qui traverse une fine bande située dans le haut de l'écran devient active
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-25% 0px -70% 0px" });

    sections.forEach((section) => observer.observe(section));

    // En bas de page, la dernière section (Contact) devient active même si elle est courte
    window.addEventListener("scroll", () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) setActive(sections[sections.length - 1].id);
    }, { passive: true });

    setActive(sections[0].id);
  }


  /* ------------------------------------------------------------------------
     4c. Apparition progressive des éléments au défilement
     ------------------------------------------------------------------------ */
  function initReveal() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

    const selector = [
      ".section-heading", ".about-photo", ".about-text", ".tl-item",
      ".skill-card", ".award-panel",
      ".contact-list", ".site-footer",
    ].join(",");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        observer.unobserve(element);
        element.classList.add("is-visible");

        // Une fois l'animation terminée, on retire les classes pour rendre la main au CSS normal
        element.addEventListener("transitionend", function cleanup(event) {
          if (event.target !== element || event.propertyName !== "opacity") return;
          element.classList.remove("reveal", "is-visible");
          element.removeAttribute("data-reveal");
          element.style.removeProperty("--reveal-delay");
          element.removeEventListener("transitionend", cleanup);
        });
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    $$(selector).forEach((element) => {
      const siblings = [...element.parentElement.children].filter((node) => node.matches(selector));
      const index = Math.max(siblings.indexOf(element), 0);

      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", `${(index % 4) * 100}ms`);

      // Direction d'entrée : la frise alterne gauche / droite, la photo arrive de la gauche
      if (element.classList.contains("tl-item")) {
        element.dataset.reveal = index % 2 === 0 ? "left" : "right";
      } else if (element.classList.contains("about-photo")) {
        element.dataset.reveal = "left";
      } else if (element.classList.contains("about-text")) {
        element.dataset.reveal = "right";
      }

      observer.observe(element);
    });
  }


  /* ------------------------------------------------------------------------
     4d. Ligne lumineuse de la frise (se remplit pendant le défilement)
     ------------------------------------------------------------------------ */
  function initTimeline() {
    const timelines = $$(".timeline");
    if (!timelines.length) return;

    let waiting = false;
    const update = () => {
      timelines.forEach((timeline) => {
        const rect = timeline.getBoundingClientRect();
        const progress = Math.min(Math.max(window.innerHeight * 0.6 - rect.top, 0), rect.height);
        timeline.style.setProperty("--tl-progress", `${progress}px`);
      });
      waiting = false;
    };

    window.addEventListener("scroll", () => {
      if (!waiting) {
        waiting = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }


  /* ------------------------------------------------------------------------
     4g. Bouton « Voir plus / Voir moins » sur les cartes de projet
     ------------------------------------------------------------------------ */
  function initProjectToggles() {
    $$(".project-more-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".project-card");
        if (!card) return;
        const expanded = card.classList.toggle("is-expanded");
        const moreLabel = $(".more-label", button);
        const lessLabel = $(".less-label", button);
        if (moreLabel) moreLabel.hidden = expanded;
        if (lessLabel) lessLabel.hidden = !expanded;
        button.setAttribute("aria-expanded", String(expanded));
      });
    });
  }


  /* ------------------------------------------------------------------------
     4e. Halo lumineux qui suit la souris sur les cartes de compétences
     ------------------------------------------------------------------------ */
  function initSpotlight() {
    $$(".skill-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }


  /* ------------------------------------------------------------------------
     4f. Bouton « Copier l'e-mail »
     ------------------------------------------------------------------------ */
  function initCopyEmail() {
    const button = $("#copy-email");
    if (!button) return;
    const label = $("span", button);

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.email);
      } catch {
        return; // copie impossible (navigateur ou contexte non sécurisé)
      }

      const previous = label.innerHTML;
      label.textContent = root.getAttribute("lang") === "fr" ? TRANSLATIONS.fr["contact.copied"] : "Copied!";
      button.classList.add("is-done");

      setTimeout(() => {
        label.innerHTML = previous;
        button.classList.remove("is-done");
      }, 2000);
    });
  }


  /* ------------------------------------------------------------------------
     5. Écran d'intro
     ------------------------------------------------------------------------ */
  function runSplash() {
    const splash = $("#splash");
    if (!splash) return;

    if (prefersReducedMotion) {
      splash.remove();
      return;
    }

    const letters = $$(".splash-letter", splash);

    // 1. Les lettres apparaissent l'une après l'autre
    letters.forEach((letter, index) => {
      setTimeout(() => letter.classList.add("is-visible"), (index + 1) * 400);
    });

    // 2. Les lettres disparaissent vers le haut
    setTimeout(() => {
      letters.forEach((letter, index) => {
        setTimeout(() => {
          letter.classList.remove("is-visible");
          letter.classList.add("is-leaving");
        }, (index + 1) * 50);
      });
    }, 2000);

    // 3. L'écran d'intro glisse vers le haut puis est retiré de la page
    setTimeout(() => splash.classList.add("is-hidden"), 2300);
    setTimeout(() => splash.remove(), 3500);
  }


  /* ------------------------------------------------------------------------
     6. Particules d'arrière-plan (bibliothèque particles.js)
     ------------------------------------------------------------------------ */
  const PARTICLES_CONFIG = {
    particles: {
      number: { value: 29, density: { enable: true, value_area: 80 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: false },
      size: {
        value: 3,
        random: true,
        anim: { enable: true, speed: 2.4, size_min: 0.1, sync: false },
      },
      line_linked: {
        enable: true,
        distance: 128,
        color: "#ffffff",
        opacity: 0.4,
        width: 0.64,
      },
      move: {
        enable: true,
        speed: 1.6,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
      },
    },
    interactivity: {
      detect_on: "window",
      events: {
        onhover: { enable: false },
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
      modes: { push: { particles_nb: 4 } },
    },
    retina_detect: true,
  };

  function initParticles() {
    if (prefersReducedMotion || typeof window.particlesJS !== "function") return;

    // Supprime l'instance précédente (utile lors d'un changement de thème)
    if (Array.isArray(window.pJSDom) && window.pJSDom.length) {
      window.pJSDom.forEach((instance) => instance.pJS.fn.vendors.destroypJS());
      window.pJSDom = [];
    }

    // Particules blanches en mode sombre, bleues en mode clair
    const isLight = root.getAttribute("data-bs-theme") === "light";
    const color = isLight ? "#2f3fe0" : "#ffffff";
    const config = JSON.parse(JSON.stringify(PARTICLES_CONFIG));
    config.particles.color.value = color;
    config.particles.line_linked.color = color;
    config.particles.line_linked.opacity = isLight ? 0.3 : 0.4;
    config.particles.opacity.value = isLight ? 0.6 : 0.5;

    window.particlesJS("particles-js", config);
  }


  /* ------------------------------------------------------------------------
     7. Initialisation
     ------------------------------------------------------------------------ */
  function init() {
    cacheDefaults();
    applyLanguage(storage.get("lang") === "fr" ? "fr" : "en");

    $("#theme-toggle")?.addEventListener("click", toggleTheme);
    $("#lang-toggle")?.addEventListener("click", toggleLanguage);

    initMenu();
    initScrollSpy();
    initReveal();
    initTimeline();
    initSpotlight();
    initProjectToggles();
    initCopyEmail();
    initParticles();
    runSplash();
  }

  init();
})();