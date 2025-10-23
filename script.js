const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.querySelector(".nav__links");
const form = document.getElementById("rsvp-form");
const statusEl = document.getElementById("form-status");
const countdownEl = document.getElementById("countdown");
const scheduleTabs = document.querySelectorAll(".schedule__tab");
const schedulePanels = document.querySelectorAll(".schedule__content");
const mapFrame = document.getElementById("directions-map");
const mapButtons = document.querySelectorAll(".directions__item");
const gallerySwiperEl = document.querySelector(".gallery__swiper");

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzDsPlgyuIgYjfyK8nUvvQ4Ae0zmI4r_KeSbLu-jnExajjzvTJD-vGxI5Kdxi3w5UN5/exec";
const WEDDING_DATE = new Date("2026-08-01T20:30:00Z"); // adjust to local time as needed

function closeMobileMenu() {
  if (!navLinks || !navToggle) return;
  navToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("nav__links--open");
}

function handleNavToggle() {
  if (!navToggle || !navLinks) return;
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  navLinks.classList.toggle("nav__links--open");
}

function handleSmoothScroll(event) {
  const target = event.target;
  if (!(target instanceof HTMLAnchorElement)) return;
  const href = target.getAttribute("href");
  if (!href || !href.startsWith("#")) return;

  const section = document.querySelector(href);
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView({ behavior: "smooth" });
  closeMobileMenu();
}

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("form-status--success", "form-status--error");
  if (type) {
    statusEl.classList.add(type);
  }
}

async function submitForm(event) {
  event.preventDefault();
  if (!form) return;

  const formData = new FormData(form);
  const submitButton = form.querySelector(".rsvp-form__submit");

  setStatus("Sending your RSVP...", "");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    setStatus("Thank you! Your RSVP has been received.", "form-status--success");
    form.reset();
  } catch (error) {
    console.error("RSVP submission failed:", error);
    setStatus("Something went wrong. Please email us while we fix this.", "form-status--error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit RSVP";
  }
}

function startCountdown() {
  if (!countdownEl) return;

  function update() {
    const now = new Date();
    const diff = WEDDING_DATE.getTime() - now.getTime();

    const units = {
      days: Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0),
      hours: Math.max(Math.floor((diff / (1000 * 60 * 60)) % 24), 0),
      minutes: Math.max(Math.floor((diff / (1000 * 60)) % 60), 0),
      seconds: Math.max(Math.floor((diff / 1000) % 60), 0),
    };

    Object.entries(units).forEach(([unit, value]) => {
      const el = countdownEl.querySelector(`[data-unit="${unit}"]`);
      if (el) {
        el.textContent = String(value).padStart(2, "0");
      }
    });
  }

  update();
  setInterval(update, 1000);
}

function handleScheduleSwitch(event) {
  const button = event.currentTarget;
  const day = button.getAttribute("data-day");
  if (!day) return;

  scheduleTabs.forEach((tab) => {
    const isActive = tab === button;
    tab.classList.toggle("schedule__tab--active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  schedulePanels.forEach((panel) => {
    const isMatch = panel.id === `schedule-${day}`;
    panel.classList.toggle("schedule__content--active", isMatch);
  });
}

function handleMapSwitch(event) {
  if (!mapFrame) return;
  const button = event.currentTarget;
  const src = button.getAttribute("data-map-src");
  if (!src) return;

  const title = button.getAttribute("data-map-title");
  if (title) {
    mapFrame.title = title;
  }

  if (mapFrame.getAttribute("src") !== src) {
    mapFrame.setAttribute("src", src);
  }

  mapButtons.forEach((mapButton) => {
    const isActive = mapButton === button;
    mapButton.classList.toggle("directions__item--active", isActive);
    mapButton.setAttribute("aria-pressed", String(isActive));
  });
}

function initGallerySwiper() {
  if (!gallerySwiperEl || typeof Swiper === "undefined") return;

  // eslint-disable-next-line no-new
  new Swiper(gallerySwiperEl, {
    slidesPerView: 1.1,
    spaceBetween: 16,
    loop: true,
    grabCursor: true,
    navigation: {
      nextEl: ".gallery__button--next",
      prevEl: ".gallery__button--prev",
    },
    pagination: {
      el: ".gallery__pagination",
      clickable: true,
    },
    keyboard: {
      enabled: true,
    },
    breakpoints: {
      600: {
        slidesPerView: 1.6,
        spaceBetween: 18,
      },
      900: {
        slidesPerView: 2.4,
        spaceBetween: 22,
      },
      1200: {
        slidesPerView: 3,
        spaceBetween: 24,
      },
    },
  });
}

if (navToggle) {
  navToggle.addEventListener("click", handleNavToggle);
}

if (navLinks) {
  navLinks.addEventListener("click", handleSmoothScroll);
}

if (form) {
  form.addEventListener("submit", submitForm);
}

if (scheduleTabs.length) {
  scheduleTabs.forEach((tab) => tab.addEventListener("click", handleScheduleSwitch));
}

if (mapButtons.length && mapFrame) {
  mapButtons.forEach((button) => {
    const isActive = button.classList.contains("directions__item--active");
    button.setAttribute("aria-pressed", String(isActive));
    button.addEventListener("click", handleMapSwitch);
  });
}

initGallerySwiper();
startCountdown();
