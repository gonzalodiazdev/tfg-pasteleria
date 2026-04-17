import { API_URL as BASE_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {

  const grid = document.getElementById("gallery-grid");
  const empty = document.getElementById("gallery-empty");
  const filterBtns = document.querySelectorAll(".gallery-filters .filter-btn");
  const cartCount = document.getElementById("cart-count");

  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbCaption = document.getElementById("lightbox-caption");
  const lbPrev = document.querySelector(".lightbox-nav.prev");
  const lbNext = document.querySelector(".lightbox-nav.next");

  const BASE = "../assets/img/galeria/";

  const STATIC_IMAGES = [
    { src: BASE + "taller-01.webp", tag: "taller", alt: "Taller - Obrador" },
    { src: BASE + "taller-02.webp", tag: "taller", alt: "Taller - Preparación" },

    { src: BASE + "procedimiento-01.webp", tag: "procedimiento", alt: "Procedimiento - Ingredientes" },
    { src: BASE + "procedimiento-02.webp", tag: "procedimiento", alt: "Procedimiento - Mezcla" },
    { src: BASE + "procedimiento-03.webp", tag: "procedimiento", alt: "Procedimiento - Horneado" }
  ];

  let dynamicCatalogImages = [];
  let currentFilter = "all";
  let currentList = [];
  let currentIndex = 0;

  await init();

  async function init() {
    await loadDynamicCatalogImages();
    bindFilters();
    render();
    updateCartCount();
    bindLightbox();
  }

  async function loadDynamicCatalogImages() {
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) throw new Error("No se pudieron cargar los productos del catálogo");

      const products = await response.json();

      dynamicCatalogImages = products.map((product) => ({
        src: "../" + normalizeAssetPath(product.image),
        tag: product.display_mode === "shop" ? "producto" : "proximos",
        alt: product.name,
        stock: Number(product.stock) || 0
      }));
    } catch (error) {
      console.error("Error cargando productos dinámicos de galería:", error);
      dynamicCatalogImages = [];
    }
  }

  function getAllImages() {
    return [...STATIC_IMAGES, ...dynamicCatalogImages];
  }

  function bindFilters() {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        currentFilter = btn.dataset.filter || "all";
        render();
      });
    });
  }

  function render() {
    const allImages = getAllImages();

    currentList = allImages.filter(img => {
      if (currentFilter === "all") return true;
      return img.tag === currentFilter;
    });

    grid.innerHTML = "";

    if (!currentList.length) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    currentList.forEach((img, idx) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      card.setAttribute("aria-label", `Abrir imagen: ${img.alt}`);

      const badge =
        img.tag === "producto" && img.stock === 0
          ? `<span class="gallery-tag" style="background:#b42318;color:#fff;">Fuera de stock</span>`
          : `<span class="gallery-tag">${labelTag(img.tag)}</span>`;

      card.innerHTML = `
        <img src="${img.src}" alt="${escapeHTML(img.alt)}" loading="lazy">
        ${badge}
      `;

      card.addEventListener("click", () => openLightbox(idx));
      grid.appendChild(card);
    });
  }

  function labelTag(tag) {
    const map = {
      producto: "Producto",
      taller: "Taller",
      procedimiento: "Procedimiento",
      proximos: "Próximamente"
    };
    return map[tag] || tag;
  }

  function bindLightbox() {
    document.querySelectorAll("[data-close='1']").forEach(el => {
      el.addEventListener("click", closeLightbox);
    });

    if (lbPrev) lbPrev.addEventListener("click", () => step(-1));
    if (lbNext) lbNext.addEventListener("click", () => step(+1));

    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(+1);
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    paintLightbox();

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function step(dir) {
    const len = currentList.length;
    currentIndex = (currentIndex + dir + len) % len;
    paintLightbox();
  }

  function paintLightbox() {
    const item = currentList[currentIndex];
    if (!item) return;

    lbImg.src = item.src;
    lbImg.alt = item.alt;

    const stockLabel =
      item.tag === "producto" && item.stock === 0
        ? " · Fuera de stock"
        : "";

    lbCaption.textContent = `${labelTag(item.tag)} · ${item.alt}${stockLabel}`;
  }

  function isOpen() {
    return lightbox.classList.contains("is-open");
  }

  function updateCartCount() {
    if (!cartCount) return;
    const cart = getCart();
    const total = cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    cartCount.textContent = total;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function normalizeAssetPath(path) {
    return String(path || "").replace(/^src\//, "");
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});