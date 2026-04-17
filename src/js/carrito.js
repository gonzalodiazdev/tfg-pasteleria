/* =========================================================
   carrito.js
   - Lee el carrito desde localStorage ("cart")
   - Pinta los items en #cart-items
   - Calcula totales e IVA (10% incluido)
   - Muestra botón "Finalizar compra" hacia ./checkout.html
   ========================================================= */

   document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // REFERENCIAS DOM
    // =========================
    const cartList = document.getElementById("cart-items"); // contenedor donde renderizamos los productos
    const cartCountEl = document.getElementById("cart-count"); // contador del icono del carrito (header)
  
    // Seguridad: si no existe el contenedor del carrito, no hacemos nada
    if (!cartList) return;
  
    // =========================
    // INIT
    // =========================
    renderCart();
    updateCartCount();
  
  
    // =========================================================
    // 1) STORAGE HELPERS
    // =========================================================
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
  
  
    // =========================================================
    // 2) FORMATOS
    // =========================================================
    function formatEUR(value) {
      const v = Number(value) || 0;
      return v.toFixed(2).replace(".", ",") + " €";
    }
  
  
    // =========================================================
    // 3) FIX RUTAS IMAGEN
    //    - Evita que desde /src/pages/ las rutas relativas se rompan.
    //    - Normaliza rutas típicas del proyecto:
    //      "../assets/img/..." o "./src/assets/img/..." o "src/assets/img/..."
    // =========================================================
    function normalizeImgPath(src) {
      if (!src || typeof src !== "string") return "";
  
      const s = src.trim();
  
      // 1) Si ya es URL absoluta o path absoluto desde raíz, lo dejamos
      if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) {
        return s;
      }
  
      // 2) Si viene con "./" lo limpiamos
      let fixed = s.replace(/^\.\//, "");
  
      // 3) Si viene como "src/assets/..." lo convertimos a "/src/assets/..."
      if (fixed.startsWith("src/")) {
        return "/" + fixed;
      }
  
      // 4) Si viene como "../assets/..." lo dejamos tal cual
      //    (porque carrito.html está en src/pages/ y esa ruta es correcta)
      return fixed;
    }
  
  
    // =========================================================
    // 4) RENDER DEL CARRITO
    // =========================================================
    function renderCart() {
      const cart = getCart();
      cartList.innerHTML = "";
  
      // Si está vacío
      if (!cart.length) {
        cartList.innerHTML = `<div class="cart-empty">Tu carrito está vacío.</div>`;
        updateSummary(cart);
        updateCartCount();
        return;
      }
  
      // Pintamos cada item
      cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 0;
        const lineSubtotal = price * qty;
  
        const img = normalizeImgPath(item.img);
  
        const row = document.createElement("div");
        row.className = "cart-item";
  
        row.innerHTML = `
          <!-- Eliminar -->
          <button
            class="cart-remove"
            type="button"
            data-index="${index}"
            aria-label="Eliminar producto">
            ×
          </button>
  
          <!-- Imagen -->
          <div class="cart-thumb">
            <img src="${img}" alt="${item.name || "Producto"}" />
          </div>
  
          <!-- Nombre -->
          <div class="cart-product">
            <div class="cart-name">${item.name || ""}</div>
          </div>
  
          <!-- Precio unitario -->
          <div class="cart-price">${formatEUR(price)}</div>
  
          <!-- Cantidad -->
          <div class="cart-qty">
            <div class="cart-controls">
              <button type="button" class="minus" data-index="${index}" aria-label="Restar">−</button>
              <span class="qty-value">${qty}</span>
              <button type="button" class="plus" data-index="${index}" aria-label="Sumar">+</button>
            </div>
          </div>
  
          <!-- Subtotal linea -->
          <div class="cart-subtotal">
            ${formatEUR(lineSubtotal)}
            <span class="cart-subnote">(incl. impuestos)</span>
          </div>
        `;
  
        cartList.appendChild(row);
      });
  
      bindButtons();
      updateSummary(cart);
      updateCartCount();
    }
  
  
    // =========================================================
    // 5) EVENTOS BOTONES (+ / − / eliminar)
    // =========================================================
    function bindButtons() {
  
      // +1
      document.querySelectorAll(".plus").forEach((btn) => {
        btn.addEventListener("click", () => {
          changeQty(Number(btn.dataset.index), +1);
        });
      });
  
      // -1
      document.querySelectorAll(".minus").forEach((btn) => {
        btn.addEventListener("click", () => {
          changeQty(Number(btn.dataset.index), -1);
        });
      });
  
      // eliminar
      document.querySelectorAll(".cart-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          removeItem(Number(btn.dataset.index));
        });
      });
    }
  
  
    // =========================================================
    // 6) LÓGICA DE CANTIDAD / ELIMINAR
    // =========================================================
    function changeQty(index, amount) {
      const cart = getCart();
      if (!cart[index]) return;
  
      const current = Number(cart[index].qty) || 0;
      cart[index].qty = current + amount;
  
      // si baja a 0 o menos, eliminamos
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
  
      setCart(cart);
      renderCart(); // re-render completo para recalcular totales
    }
  
    function removeItem(index) {
      const cart = getCart();
      if (!cart[index]) return;
  
      cart.splice(index, 1);
      setCart(cart);
      renderCart();
    }
  
  
    // =========================================================
    // 7) RESUMEN (subtotal, IVA incluido, total, botón checkout)
    //    IMPORTANTE:
    //    - El enlace a checkout debe ser "./checkout.html"
    //      porque carrito.html está en src/pages/
    // =========================================================
    function updateSummary(cart) {
      const summaryEl = document.getElementById("cart-total");
      if (!summaryEl) return;
  
      // Subtotal (ya lo tratamos como IVA incluido)
      const subtotal = cart.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
        0
      );
  
      // IVA incluido (10%): extraemos la parte del IVA de un total con IVA
      const base = subtotal / 1.10;
      const iva = subtotal - base;
  
      summaryEl.innerHTML = `
        <div class="summary-box">
          <h3>Totales del carrito</h3>
  
          <div class="summary-row">
            <span>Subtotal</span>
            <span id="summary-subtotal">
              ${formatEUR(subtotal)} <small>(incl. impuestos)</small>
            </span>
          </div>
  
          <div class="summary-row">
            <span>IVA (10%)</span>
            <span id="summary-iva">${formatEUR(iva)}</span>
          </div>
  
          <div class="summary-row summary-strong">
            <span>Total</span>
  
            <span class="summary-total-actions">
              <span id="summary-total">${formatEUR(subtotal)}</span>
  
              <!-- Link real (navega de verdad) -->
              <a class="cart-checkout" href="./checkout.html">Finalizar compra</a>
            </span>
          </div>
  
          <p class="summary-note" id="summary-total-note">
            incluye ${formatEUR(iva)} IVA
          </p>
        </div>
      `;
    }
  
  
    // =========================================================
    // 8) CONTADOR CARRITO (header)
    // =========================================================
    function updateCartCount() {
      if (!cartCountEl) return;
  
      const cart = getCart();
      const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  
      cartCountEl.textContent = totalQty;
    }
  
  });
  