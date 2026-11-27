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

  const jeDoDna = () =>
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

  // link stranice na kojoj se trenutno nalazimo (npr. "O nama" na o-nama.html)
  const trenutna = links.find((link) => link.getAttribute("aria-current") === "page");
  let poslednja = null; // poslednja sekcija koju je posmatrač označio
  let naDnu = false;    // da li je strana trenutno skrolovana do dna

  const oznaciAktivan = (id) => {
    const postoji = links.some((link) => link.getAttribute("href") === `#${id}`);
    links.forEach((link) => {
      // ako nijedna sekcija nije označena, aktivna je link trenutne stranice
      const aktivan = postoji ? link.getAttribute("href") === `#${id}` : link === trenutna;
      link.classList.toggle("is-active", aktivan);
    });
  };

  if ("IntersectionObserver" in window && sekcije.length) {
    const observer = new IntersectionObserver(
      (unosi) => {
        // na dnu strane Kontakt ima prednost (vidi niže)
        if (jeDoDna()) return;
        unosi.forEach((unos) => {
          if (unos.isIntersecting) {
            poslednja = unos.target.id;
            oznaciAktivan(poslednja);
          } else if (trenutna) {
            poslednja = null;
            oznaciAktivan(null); // izašli smo iz footera
          }
        });
      },
      // sekcija je "aktivna" kad prelazi sredinu ekrana
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sekcije.forEach((sekcija) => observer.observe(sekcija));
  }

  // footer je nizak i ne stigne do sredine ekrana, pa se Kontakt
  // označava kad se strana skroluje do dna
  window.addEventListener(
    "scroll",
    () => {
      if (jeDoDna()) {
        naDnu = true;
        oznaciAktivan("kontakt");
      } else if (naDnu) {
        // napustili smo dno: vrati prethodno stanje
        naDnu = false;
        oznaciAktivan(poslednja);
      }
    },
    { passive: true }
  );

  /* ---------- Flip kartice ---------- */
  document.querySelectorAll(".card").forEach((kartica) => {
    const prednja = kartica.querySelector(".card__face--front");
    const zadnja = kartica.querySelector(".card__face--back");

    kartica.addEventListener("click", () => {
      const okrenuta = kartica.classList.toggle("is-flipped");
      kartica.setAttribute("aria-pressed", String(okrenuta));

      // čitač ekrana čita samo stranu koja je trenutno vidljiva
      prednja.setAttribute("aria-hidden", String(okrenuta));
      zadnja.setAttribute("aria-hidden", String(!okrenuta));

      // restart odskoka pri svakom okretanju
      kartica.classList.remove("is-popping");
      void kartica.offsetWidth;
      kartica.classList.add("is-popping");
    });

    kartica.addEventListener("animationend", (e) => {
      if (e.animationName === "odskok") kartica.classList.remove("is-popping");
    });
  });

  /* ---------- Zvezdice (ocena iz data-ocena) ---------- */
  const SVG_NS = "http://www.w3.org/2000/svg";

  const napraviZvezde = (el) => {
    const ocena = Math.round(Number(el.dataset.ocena));
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", `Ocena ${el.dataset.ocena} od 5`);
    el.textContent = "";

    for (let i = 0; i < 5; i++) {
      const svg = document.createElementNS(SVG_NS, "svg");
      const use = document.createElementNS(SVG_NS, "use");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", i < ocena ? "star" : "star star--prazna");
      svg.setAttribute("aria-hidden", "true");
      svg.style.setProperty("--i", i);
      use.setAttribute("href", "#i-zvezda");
      svg.appendChild(use);
      el.appendChild(svg);
    }
  };

  document.querySelectorAll(".stars[data-ocena]").forEach(napraviZvezde);

  /* ---------- Recenzije: zbir, filteri i animacije ---------- */
  const recGrid = document.querySelector(".rec-grid");

  if (recGrid) {
    const kartice = [...recGrid.querySelectorAll(".rec")];
    const manjeAnimacija = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const imaObserver = "IntersectionObserver" in window;

    // --- zbir ocena (računa se iz kartica) ---
    const sumarno = document.getElementById("sumarno");
    const ocene = kartice.map((k) => Number(k.dataset.ocena));
    const ukupno = ocene.length;
    const prosek = ukupno ? ocene.reduce((a, b) => a + b, 0) / ukupno : 0;
    const format = (n) => n.toFixed(1).replace(".", ",");
    const rec = (n) => (n % 10 === 1 && n % 100 !== 11 ? "recenzije" : "recenzija");

    const prosekEl = document.getElementById("sumarno-prosek");
    document.getElementById("sumarno-ukupno").textContent = `na osnovu ${ukupno} ${rec(ukupno)}`;

    const zvezdeZbir = document.getElementById("sumarno-zvezde");
    zvezdeZbir.dataset.ocena = prosek.toFixed(1);
    napraviZvezde(zvezdeZbir);

    sumarno.querySelectorAll(".bar").forEach((red) => {
      const broj = ocene.filter((o) => o === Number(red.dataset.ocena)).length;
      red.style.setProperty("--udeo", ukupno ? `${(broj / ukupno) * 100}%` : "0%");
      red.querySelector(".bar__count").textContent = broj;
    });

    // broj raste od 0 do proseka
    const animirajProsek = () => {
      if (manjeAnimacija) {
        prosekEl.textContent = format(prosek);
        return;
      }
      const pocetak = performance.now();
      const trajanje = 1500;
      const korak = (sada) => {
        const p = Math.min((sada - pocetak) / trajanje, 1);
        const lagano = 1 - Math.pow(1 - p, 3);
        prosekEl.textContent = format(prosek * lagano);
        if (p < 1) requestAnimationFrame(korak);
      };
      requestAnimationFrame(korak);
    };

    if (imaObserver) {
      const zbirObserver = new IntersectionObserver(
        (unosi, obs) => {
          if (unosi[0].isIntersecting) {
            sumarno.classList.add("is-in");
            animirajProsek();
            obs.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      zbirObserver.observe(sumarno);
    } else {
      sumarno.classList.add("is-in");
      prosekEl.textContent = format(prosek);
    }

    // --- pojavljivanje kartica pri skrolu ---
    const pokaziKarticu = (kartica, kasnjenje) => {
      kartica.style.setProperty("--d", `${kasnjenje}ms`);
      kartica.classList.add("is-in");
    };

    const kartObserver = imaObserver
      ? new IntersectionObserver(
          (unosi) => {
            let n = 0;
            unosi.forEach((unos) => {
              if (!unos.isIntersecting) return;
              pokaziKarticu(unos.target, n++ * 90);
              kartObserver.unobserve(unos.target);
            });
          },
          { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        )
      : null;

    if (kartObserver) kartice.forEach((k) => kartObserver.observe(k));
    else kartice.forEach((k) => pokaziKarticu(k, 0));

    // --- filteri ---
    const filteri = [...document.querySelectorAll(".filter")];
    const brojEl = document.getElementById("rec-broj");
    const praznoEl = document.getElementById("rec-prazno");

    const prolazi = (kartica, filter) =>
      filter === "sve" ||
      (filter === "5" ? kartica.dataset.ocena === "5" : kartica.dataset.tip === filter);

    const primeni = (filter) => {
      let prikazano = 0;

      kartice.forEach((kartica) => {
        if (kartObserver) kartObserver.unobserve(kartica);
        kartica.classList.remove("is-in");
        kartica.hidden = !prolazi(kartica, filter);
      });

      void recGrid.offsetWidth; // da se animacija pokrene ispočetka

      kartice.forEach((kartica) => {
        if (kartica.hidden) return;
        pokaziKarticu(kartica, Math.min(prikazano, 8) * 70);
        prikazano++;
      });

      brojEl.textContent = `Prikazano ${prikazano} od ${ukupno} ${rec(ukupno)}`;
      praznoEl.hidden = prikazano > 0;
    };

    filteri.forEach((dugme) => {
      dugme.addEventListener("click", () => {
        filteri.forEach((f) => f.setAttribute("aria-pressed", String(f === dugme)));
        primeni(dugme.dataset.filter);
      });
    });

    brojEl.textContent = `Prikazano ${ukupno} od ${ukupno} ${rec(ukupno)}`;
  }

  /* ---------- Godina u footeru ---------- */
  const godina = document.getElementById("godina");
  if (godina) godina.textContent = new Date().getFullYear();
})();
