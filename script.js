(() => {
  "use strict";

  const navbar = document.getElementById("navbar");
  const burger = navbar.querySelector(".navbar__burger");
  const menu = document.getElementById("navbar-menu");
  const links = [...menu.querySelectorAll(".navbar__link")];
  const mobilni = window.matchMedia("(max-width: 900px)");

  /* ---------- Mobilni meni ---------- */
  const jeOtvoren = () => burger.getAttribute("aria-expanded") === "true";

  const postaviMeni = (otvoren) => {
    menu.classList.toggle("is-open", otvoren);
    burger.setAttribute("aria-expanded", String(otvoren));
    burger.setAttribute("aria-label", otvoren ? "Zatvori meni" : "Otvori meni");
  };

  burger.addEventListener("click", () => postaviMeni(!jeOtvoren()));

  // zatvori meni kad se klikne link
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) postaviMeni(false);
  });

  // zatvori meni kad se klikne van navbara
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target)) postaviMeni(false);
  });

  // zatvori meni na Escape i vrati fokus na dugme
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && jeOtvoren()) {
      postaviMeni(false);
      burger.focus();
    }
  });

  // reset kad se pređe između mobilnog i desktop prikaza
  mobilni.addEventListener("change", () => postaviMeni(false));

  /* ---------- Senka i smanjenje navbara pri skrolu ---------- */
  const naSkrol = () => {
    navbar.classList.toggle("navbar--scrolled", window.scrollY > 10);
  };

  naSkrol();
  window.addEventListener("scroll", naSkrol, { passive: true });

  /* ---------- Aktivni link prema sekciji na ekranu ---------- */
  const sekcije = links
    .map((link) => {
      const href = link.getAttribute("href");
      return href.length > 1 && href.startsWith("#")
        ? document.querySelector(href)
        : null;
    })
    .filter(Boolean);

  const oznaciAktivan = (id) => {
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window && sekcije.length) {
    const observer = new IntersectionObserver(
      (unosi) => {
        unosi.forEach((unos) => {
          if (unos.isIntersecting) oznaciAktivan(unos.target.id);
        });
      },
      // sekcija je "aktivna" kad prelazi sredinu ekrana
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sekcije.forEach((sekcija) => observer.observe(sekcija));
  }
})();
