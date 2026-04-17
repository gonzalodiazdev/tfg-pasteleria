import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = `${API_URL}/api/products`;

  let product = null;

  function formatEUR(value) {
    const v = Number(value) || 0;
    return v.toFixed(2).replace(".", ",") + " €";
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function updateCartCount() {
    const el = document.getElementById("cart-count");
    if (!el) return;

    const cart = getCart();
    const total = cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    el.textContent = total;
  }

  function buildNutritionTable(text) {
    const rows = parseNutrition(text);

    return `
      <table class="nutrition-table" aria-label="Tabla nutricional por 100 gramos">
        <tbody>
          ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="tab-note">Valores orientativos. Pueden variar ligeramente según elaboración.</p>
    `;
  }

  function parseNutrition(text) {
    if (!text || typeof text !== "string") {
      return [["Información nutricional", "No disponible"]];
    }

    const cleaned = text.trim();

    if (!cleaned) {
      return [["Información nutricional", "No disponible"]];
    }

    const parts = cleaned
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    if (!parts.length) {
      return [["Información nutricional", cleaned]];
    }

    return parts.map(part => [part, "-"]);
  }

  function showToast(text) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 30);
    setTimeout(() => {
      toast.classList.remove("show");
      toast.remove();
    }, 2200);
  }

  function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "1";
  }

  function normalizeImagePath(path) {
    if (!path) return "";
    return path.replace(/^src\//, "../");
  }

  function extractUnitsText(unitsText) {
    return unitsText || "Formato no especificado";
  }

  function mapProductFromApi(apiProduct) {
    return {
      id: String(apiProduct.id),
      name: `${apiProduct.name} (${extractUnitsText(apiProduct.units)})`,
      title: apiProduct.name,
      price: Number(apiProduct.price) || 0,
      img: normalizeImagePath(apiProduct.image),
      cat: extractUnitsText(apiProduct.units),
      short: apiProduct.short_description || "",
      desc: apiProduct.description || "",
      ingredients: apiProduct.ingredients || "No disponible",
      allergens: apiProduct.allergens || "No disponible",
      nutrition: apiProduct.nutrition || "",
      weight: apiProduct.weight || "No disponible",
      storage: apiProduct.storage_info || "No disponible"
    };
  }

  function renderProduct(p) {
    const img = document.getElementById("p-img");
    img.src = p.img;
    img.alt = p.title;

    document.getElementById("p-title").textContent = p.title;
    document.getElementById("p-price").textContent = formatEUR(p.price);
    document.getElementById("p-short").textContent = p.short;
    document.getElementById("p-cat").textContent = p.cat;

    document.getElementById("p-desc").textContent = p.desc;
    document.getElementById("p-ingredients").textContent = p.ingredients;
    document.getElementById("p-allergens").textContent = p.allergens;

    document.getElementById("p-nutrition").innerHTML = buildNutritionTable(p.nutrition);

    document.getElementById("p-weight").textContent = p.weight;
    document.getElementById("p-storage").textContent = p.storage;

    document.title = `${p.title} | Productos Álvarez`;
  }

  async function loadProduct() {
    const id = getProductId();

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      product = mapProductFromApi(data);
      renderProduct(product);
    } catch (error) {
      console.error("Error cargando producto:", error);

      const title = document.getElementById("p-title");
      const desc = document.getElementById("p-desc");

      if (title) title.textContent = "Producto no encontrado";
      if (desc) desc.textContent = "No se pudo cargar la información del producto.";
    }
  }

  function bindQuantityControls() {
    const qtyInput = document.getElementById("qty");
    const plusBtn = document.getElementById("qty-plus");
    const minusBtn = document.getElementById("qty-minus");

    if (!qtyInput || !plusBtn || !minusBtn) return;

    plusBtn.addEventListener("click", () => {
      qtyInput.value = Math.max(1, (Number(qtyInput.value) || 1) + 1);
    });

    minusBtn.addEventListener("click", () => {
      qtyInput.value = Math.max(1, (Number(qtyInput.value) || 1) - 1);
    });
  }

  function bindAddToCart() {
    const addBtn = document.getElementById("add-to-cart");
    const qtyInput = document.getElementById("qty");

    if (!addBtn || !qtyInput) return;

    addBtn.addEventListener("click", () => {
      if (!product) return;

      const qty = Math.max(1, Number(qtyInput.value) || 1);

      const cart = getCart();
      const existing = cart.find(p => String(p.id) === String(product.id));

      if (existing) {
        existing.qty = (Number(existing.qty) || 0) + qty;
        if (!existing.img) existing.img = product.img;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          qty,
          img: product.img
        });
      }

      setCart(cart);
      updateCartCount();
      showToast("Producto añadido al carrito");
    });
  }

  async function init() {
    updateCartCount();
    bindQuantityControls();
    bindAddToCart();
    await loadProduct();
  }

  init();
});