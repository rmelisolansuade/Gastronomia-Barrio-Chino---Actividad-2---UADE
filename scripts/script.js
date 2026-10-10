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
