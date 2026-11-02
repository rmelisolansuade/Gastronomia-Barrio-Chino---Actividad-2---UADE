document.querySelectorAll(".site-navigation").forEach((navigation) => {
  const toggle = navigation.querySelector(".mobile-menu-toggle");
  const menuLinks = navigation.querySelector(".mobile-navigation-list");
  const callToAction = navigation.querySelector(":scope > a:last-child");

  if (!toggle || !menuLinks) return;

  const setMenuOpen = (isOpen) => {
    navigation.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación");
  };

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.querySelectorAll(".mobile-navigation-list a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  callToAction?.addEventListener("click", () => setMenuOpen(false));

  navigation.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) setMenuOpen(false);
  });
});

document.querySelectorAll("#preguntas-frecuentes details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    const answer = item.querySelector(".faq-answer");
    if (!answer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    answer.classList.remove("is-animating");
    void answer.offsetWidth;
    answer.classList.add("is-animating");
  });
});

const backToTop = document.getElementById("back-to-top");

if (backToTop) {
  const updateBackToTop = () => {
    const visible = window.scrollY > 240;
    backToTop.classList.toggle("hidden", !visible);
    backToTop.setAttribute("aria-hidden", String(!visible));
  };

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  updateBackToTop();
}
