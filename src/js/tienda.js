import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const SHOP_URL = `${API_URL}/api/products?mode=shop`;

  const grid = document.getElementById("product-grid");
  const cartCount = document.getElementById("cart-count");
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const filterBtns = document.querySelectorAll(".filter-btn");

  if (!grid) return;

  let products = [];
  let currentFilter = "all";
  let currentQuery = "";

  await init();

  async function init() {
    await loadProducts();
    bindFilters();
    bindSearch();
    render();
    updateCartCount();
  }

  async function loadProducts() {
    try {
      const response = await fetch(SHOP_URL);
      if (!response.ok) throw new Error("No se pudieron cargar los productos");
      products = await response.json();
    } catch (error) {
      console.error("Error cargando productos tienda:", error);
      grid.innerHTML = `<div class="shop-empty">No se pudieron cargar los productos.</div>`;
    }
  }

  function bindFilters() {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        currentFilter = btn.dataset.filter;
        render();
      });
    });
  }

  function bindSearch() {
    if (!searchInput || !searchClear) return;

    searchInput.addEventListener("input", () => {
      currentQuery = (searchInput.value || "").trim().toLowerCase();
      render();
    });

    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      currentQuery = "";
      render();
      searchInput.focus();
    });
  }

  function render() {
    const filtered = products
      .filter(p => {
        if (currentFilter === "all") return true;
        return normalizeUnitsLabel(p.units) === currentFilter;
      })
      .filter(p => {
        if (!currentQuery) return true;
        return (
          String(p.name || "").toLowerCase().includes(currentQuery) ||
          String(p.short_description || "").toLowerCase().includes(currentQuery)
        );
      });

    grid.innerHTML = "";

    if (!filtered.length) {
      grid.innerHTML = `<div class="shop-empty">No hay productos con ese filtro.</div>`;
      return;
    }

    filtered.forEach(p => {
      const outOfStock = Number(p.stock) <= 0;

      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <a class="product-thumb" href="./producto.html?id=${p.id}">
          <img src="../${normalizeAssetPath(p.image)}" alt="${escapeHTML(p.name)}">
        </a>

        <div class="product-info">
          <h3 class="product-title">${escapeHTML(formatProductName(p.name, p.units))}</h3>
          <p class="product-desc">${escapeHTML(p.short_description || "")}</p>

          <div class="product-meta" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="product-price">${formatEUR(p.price)}</span>
            ${
              outOfStock
                ? `<span style="display:inline-flex; align-items:center; border-radius:999px; padding:7px 12px; font-size:.78rem; font-weight:700; background:#b42318; color:#fff;">Fuera de stock</span>`
                : `
                  <button
                    class="btn-add"
                    type="button"
                    data-id="${p.id}"
                    data-name="${escapeAttr(formatProductName(p.name, p.units))}"
                    data-price="${p.price}"
                    data-img="../${normalizeAssetPath(p.image)}">
                    Añadir
                  </button>
                `
            }
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".btn-add").forEach(btn => {
      btn.addEventListener("click", () => addToCart(btn));
    });
  }

  function addToCart(btn) {
    const id = btn.dataset.id;
    const product = products.find(p => String(p.id) === String(id));

    if (!product || Number(product.stock) <= 0) {
      showToast("Producto fuera de stock");
      return;
    }

    const name = btn.dataset.name;
    const price = Number(btn.dataset.price) || 0;
    const img = btn.dataset.img || "";

    const cart = getCart();
    const existing = cart.find(p => String(p.id) === String(id));

    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + 1;
      if (!existing.img) existing.img = img;
    } else {
      cart.push({ id, name, price, qty: 1, img });
    }

    setCart(cart);
    updateCartCount();
    showToast("Producto añadido al carrito");
  }

  function normalizeUnitsLabel(unitsText) {
    const text = String(unitsText || "").toLowerCase();
  
    if (text.includes("6")) return "6";
    if (text.includes("8")) return "8";
  
    if (
      text.includes("20") ||
      text.includes("24") ||
      text.includes("caja surtida") ||
      text.includes("caja de galletas")
    ) {
      return "24";
    }
  
    return "other";
  }

  function formatProductName(name, units) {
    if (!name) return "Producto";
    if (!units) return name;
    if (name.includes("(")) return name;
    return `${name} (${units})`;
  }

  function normalizeAssetPath(path) {
    return String(path || "").replace(/^src\//, "");
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem("cart")) || []; }
    catch { return []; }
  }

  function setCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function updateCartCount() {
    if (!cartCount) return;
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    cartCount.textContent = total;
  }

  function formatEUR(value) {
    const v = Number(value) || 0;
    return v.toFixed(2).replace(".", ",") + " €";
  }

  function showToast(text) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 30);
    setTimeout(() => { toast.classList.remove("show"); toast.remove(); }, 2300);
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(str) {
    return escapeHTML(str).replace(/\n/g, " ").trim();
  }
});