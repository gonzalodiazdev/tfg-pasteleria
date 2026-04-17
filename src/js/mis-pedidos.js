import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  if (sessionStorage.getItem("userAuth") !== "true") {
    window.location.href = "./login.html";
    return;
  }

  const email = sessionStorage.getItem("userEmail");
  const list = document.getElementById("user-orders-list");
  const logoutBtn = document.getElementById("logout-user");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("userAuth");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userName");
      window.location.href = "./login.html";
    });
  }

  try {
    const response = await fetch(`${API_URL}/api/orders/user/${encodeURIComponent(email)}`);
    const orders = await response.json();

    if (!response.ok) {
      throw new Error("No se pudieron cargar los pedidos");
    }

    if (!orders.length) {
      list.innerHTML = `
        <article class="order-empty">
          <h3 style="margin-top:0; color:#1e3a5f;">Todavía no tienes pedidos</h3>
          <p>Puedes realizar una compra como invitado o con este mismo correo para ver aquí tu historial.</p>
        </article>
      `;
      return;
    }

    list.innerHTML = orders.map(order => `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <h3>Pedido #${order.id}</h3>
            <p>Realizado el ${formatDate(order.created_at)}</p>
          </div>
          <span class="order-badge ${escapeClass(order.status)}">${formatStatus(order.status)}</span>
        </div>

        <div class="order-card-body">
          <div class="order-grid">
            <div class="order-box">
              <span class="order-box-label">Total</span>
              <div class="order-box-value">${formatEUR(order.total)}</div>
            </div>

            <div class="order-box">
              <span class="order-box-label">Correo</span>
              <div class="order-box-value">${escapeHTML(order.customer_email)}</div>
            </div>

            <div class="order-box">
              <span class="order-box-label">Teléfono</span>
              <div class="order-box-value">${escapeHTML(order.customer_phone || "-")}</div>
            </div>

            <div class="order-box">
              <span class="order-box-label">Método de pago</span>
              <div class="order-box-value">${escapeHTML(order.payment_method || "Simulado")}</div>
            </div>
          </div>

          <div class="order-box">
            <span class="order-box-label">Dirección de entrega</span>
            <div class="order-box-value">
              ${escapeHTML(order.shipping_address)}, ${escapeHTML(order.shipping_city)}
              (${escapeHTML(order.shipping_postal_code)}), ${escapeHTML(order.shipping_province)}
            </div>
          </div>

          <div class="order-box">
            <span class="order-box-label">Notas</span>
            <div class="order-box-value">${escapeHTML(order.notes || "Sin observaciones")}</div>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    list.innerHTML = `
      <article class="order-empty">
        <h3 style="margin-top:0; color:#1e3a5f;">Error cargando pedidos</h3>
        <p>No se pudieron recuperar tus pedidos en este momento.</p>
      </article>
    `;
  }

  function formatEUR(value) {
    const v = Number(value) || 0;
    return v.toFixed(2).replace(".", ",") + " €";
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString("es-ES");
  }

  function formatStatus(status) {
    const map = {
      pending: "Pendiente",
      paid: "Pagado",
      shipped: "Enviado",
      cancelled: "Cancelado"
    };
    return map[status] || status;
  }

  function escapeClass(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
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