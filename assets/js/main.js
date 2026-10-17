(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };

  // Mobile menu
  const menuBtn = $(".menu-btn"), menu = $("#primary-nav");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Theme toggle
  const root = document.documentElement, themeBtn = $(".theme-btn");
  const saved = store.get("theme");
  if (saved) root.dataset.theme = saved;
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      const next = dark ? "light" : "dark";
      root.dataset.theme = next;
      store.set("theme", next);
      themeBtn.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  // Portfolio filter
  const chips = $$(".chip[data-filter]"), items = $$("[data-category]");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    const f = chip.dataset.filter;
    items.forEach((it) => { it.hidden = !(f === "all" || it.dataset.category.split(" ").includes(f)); });
  }));

  // Reveal on scroll
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    reveals.forEach((r) => io.observe(r));
  } else reveals.forEach((r) => r.classList.add("in"));

  // Contact form (Formspree / Web3Forms compatible: set the form's action URL)
  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = $(".status", form);
      if (!form.action || form.action.includes("YOUR_FORM_ID")) {
        status.textContent = "Form not connected yet — set your Formspree endpoint in contact.html.";
        return;
      }
      status.textContent = "Sending…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error();
        form.reset();
        status.textContent = "Thanks! I'll reply within two business days.";
      } catch { status.textContent = "Something went wrong. Please email me directly."; }
    });
  }

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
