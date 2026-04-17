import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const API_ORDERS_URL = `${API_URL}/api/orders`;

  const cartCountEl = document.getElementById("cart-count");

  const orderLinesEl = document.getElementById("order-lines");
  const orderSubtotalEl = document.getElementById("order-subtotal");
  const orderTotalEl = document.getElementById("order-total");
  const orderIvaNoteEl = document.getElementById("order-iva-note");

  const placeOrderBtn = document.getElementById("place-order");

  const form = document.getElementById("checkout-form");
  const terms = document.getElementById("terms");

  const shippingCost = 0;

  updateCartCount();
  renderOrderSummary();

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async () => {
      await handlePlaceOrder();
    });
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

  function renderOrderSummary() {
    const cart = getCart();

    if (!orderLinesEl) return;

    orderLinesEl.innerHTML = "";

    if (!cart.length) {
      orderLinesEl.innerHTML = `<div class="order-empty">Tu carrito está vacío.</div>`;
      setTotals(0, shippingCost);
      updateCartCount();
      return;
    }

    cart.forEach(item => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const line = price * qty;

      const row = document.createElement("div");
      row.className = "order-line";
      row.innerHTML = `
        <span class="order-product">
          ${escapeHTML(item.name || "Producto")} <strong class="order-x">× ${qty}</strong>
        </span>
        <span class="order-sub">${formatEUR(line)} <small class="muted">(IVA incluido)</small></span>
      `;
      orderLinesEl.appendChild(row);
    });

    const subtotal = cart.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0),
      0
    );

    setTotals(subtotal, shippingCost);
    updateCartCount();
  }

  function setTotals(subtotal, shipping) {
    const total = subtotal + shipping;

    if (orderSubtotalEl) {
      orderSubtotalEl.textContent = `${formatEUR(subtotal)} (IVA incluido)`;
    }

    if (orderTotalEl) {
      orderTotalEl.textContent = formatEUR(total);
    }

    if (orderIvaNoteEl) {
      orderIvaNoteEl.textContent = "IVA incluido en el precio final";
    }
  }

  async function handlePlaceOrder() {
    const cart = getCart();

    if (!cart.length) {
      showMessageModal("No puedes finalizar", "El carrito está vacío.");
      return;
    }

    if (form && !form.checkValidity()) {
      form.reportValidity();
      showMessageModal("Revisa el formulario", "Completa todos los campos obligatorios.");
      return;
    }

    if (!terms || !terms.checked) {
      showMessageModal("Falta confirmación", "Debes aceptar los términos y condiciones.");
      return;
    }

    const customer = collectCheckoutData();

    const subtotal = cart.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0),
      0
    );

    const total = subtotal + shippingCost;

    const payload = {
      customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: customer.address1,
      shipping_city: customer.city,
      shipping_postal_code: customer.zip,
      shipping_province: customer.province,
      notes: customer.notes,
      subtotal,
      shipping_cost: shippingCost,
      total,
      items: cart.map(item => ({
        product_id: Number(item.id),
        product_name: item.name,
        quantity: Number(item.qty) || 1,
        unit_price: Number(item.price) || 0,
        line_total: (Number(item.qty) || 1) * (Number(item.price) || 0)
      }))
    };

    try {
      const response = await fetch(API_ORDERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo crear el pedido");
      }

      setCart([]);
      updateCartCount();
      renderOrderSummary();

      showMessageModal(
        "Compra realizada con éxito",
        `Pedido nº ${data.order_id}. Gracias por tu compra.`,
        () => {
          window.location.href = "./tienda.html";
        }
      );
    } catch (error) {
      console.error("Error enviando pedido:", error);
      showMessageModal("Error al realizar el pedido", "Inténtalo de nuevo.");
    }
  }

  function collectCheckoutData() {
    const get = (id) => (document.getElementById(id)?.value || "").trim();

    return {
      firstName: get("firstName"),
      lastName: get("lastName"),
      country: get("country"),
      address1: get("address1"),
      zip: get("zip"),
      city: get("city"),
      province: get("province"),
      phone: get("phone"),
      email: get("email"),
      notes: get("notes")
    };
  }

  function updateCartCount() {
    if (!cartCountEl) return;

    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    cartCountEl.textContent = totalQty;
  }

  function showMessageModal(title, message, onAccept = null) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15, 23, 42, 0.45)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    overlay.style.zIndex = "9999";

    const modal = document.createElement("div");
    modal.style.width = "100%";
    modal.style.maxWidth = "460px";
    modal.style.background = "#ffffff";
    modal.style.borderRadius = "18px";
    modal.style.boxShadow = "0 20px 40px rgba(0,0,0,0.18)";
    modal.style.padding = "28px 24px 22px";
    modal.style.textAlign = "center";
    modal.style.border = "1px solid #d7e2ee";

    const heading = document.createElement("h3");
    heading.textContent = title;
    heading.style.margin = "0 0 12px";
    heading.style.fontSize = "1.4rem";
    heading.style.color = "#1e3a5f";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.margin = "0 0 20px";
    text.style.lineHeight = "1.5";
    text.style.color = "#334155";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Aceptar";
    btn.style.border = "none";
    btn.style.borderRadius = "10px";
    btn.style.padding = "12px 18px";
    btn.style.fontWeight = "700";
    btn.style.cursor = "pointer";
    btn.style.background = "#1e3a5f";
    btn.style.color = "#ffffff";

    btn.addEventListener("click", () => {
      overlay.remove();
      if (typeof onAccept === "function") {
        onAccept();
      }
    });

    modal.appendChild(heading);
    modal.appendChild(text);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function formatEUR(value) {
    const v = Number(value) || 0;
    return v.toFixed(2).replace(".", ",") + " €";
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