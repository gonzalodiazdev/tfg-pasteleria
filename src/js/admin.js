import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("adminAuth") !== "true") {
    window.location.href = "./admin-login.html";
    return;
  }

  const PRODUCTS_API_URL = `${API_URL}/api/products`;
  const PRODUCTS_ADMIN_API_URL = `${API_URL}/api/products/admin/all`;
  const ORDERS_API_URL = `${API_URL}/api/orders`;

  const tableBody = document.getElementById("products-table-body");
  const ordersTableBody = document.getElementById("orders-table-body");
  const statusBox = document.getElementById("admin-status");
  const searchInput = document.getElementById("admin-search");
  const logoutBtn = document.getElementById("logout-admin");

  let products = [];
  let orders = [];
  let currentQuery = "";
  let openOrderDetailId = null;

  init();

  async function init() {
    bindEvents();
    await loadProducts();
    await loadOrders();
  }

  function bindEvents() {
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("adminAuth");
        sessionStorage.removeItem("adminUser");
        window.location.href = "./admin-login.html";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentQuery = (searchInput.value || "").trim().toLowerCase();
        renderProducts();
      });
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(PRODUCTS_ADMIN_API_URL);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      products = await response.json();
      renderProducts();
    } catch (error) {
      console.error("Error cargando productos:", error);
      showStatus("No se pudieron cargar los productos.", "error");
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="admin-empty">Error cargando productos.</div>
          </td>
        </tr>
      `;
    }
  }

  async function loadOrders() {
    if (!ordersTableBody) return;

    try {
      const response = await fetch(ORDERS_API_URL);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      orders = await response.json();
      renderOrders();
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="admin-empty">Error cargando pedidos.</div>
          </td>
        </tr>
      `;
    }
  }

  function renderProducts() {
    if (!tableBody) return;

    const filtered = products.filter((product) => {
      if (!currentQuery) return true;

      return (
        String(product.name || "").toLowerCase().includes(currentQuery) ||
        String(product.slug || "").toLowerCase().includes(currentQuery)
      );
    });

    if (!filtered.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="admin-empty">No hay productos para mostrar.</div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map((product) => {
      const activeBadge = product.is_active
        ? `<span class="admin-badge admin-badge-active">Activo</span>`
        : `<span class="admin-badge admin-badge-inactive">Inactivo</span>`;

      const modeLabel = product.display_mode === "shop" ? "En tienda" : "Próximamente";

      return `
        <tr>
          <td>${product.id}</td>
          <td>
            <div class="admin-product-name">${escapeHTML(product.name)}</div>
            <div class="admin-product-meta">${escapeHTML(product.slug)}</div>
          </td>
          <td>${formatEUR(product.price)}</td>
          <td>
            <input
              type="number"
              min="0"
              value="${Number(product.stock) || 0}"
              data-stock-id="${product.id}"
              style="width:90px; padding:8px 10px; border:1px solid #c9d6e3; border-radius:8px;"
            >
          </td>
          <td>${activeBadge}</td>
          <td>
            <span class="admin-product-meta">${modeLabel}</span>
          </td>
          <td>
            <select data-display-mode-id="${product.id}">
              <option value="shop" ${product.display_mode === "shop" ? "selected" : ""}>Tienda</option>
              <option value="gallery" ${product.display_mode === "gallery" ? "selected" : ""}>Próximamente</option>
            </select>
          </td>
          <td>
            <div class="admin-table-actions">
              <button class="admin-btn admin-btn-primary" type="button" data-save-catalog-id="${product.id}">
                Guardar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    bindCatalogActions();
  }

  function renderOrders() {
    if (!ordersTableBody) return;

    if (!orders.length) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="admin-empty">No hay pedidos todavía.</div>
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = orders
      .map((order) => {
        return `
          <tr>
            <td>#${order.id}</td>
            <td>
              <div class="admin-product-name">${escapeHTML(order.customer_name)}</div>
              <div class="admin-product-meta">${escapeHTML(order.customer_email)}</div>
            </td>
            <td>${formatEUR(order.total)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
              <select data-order-status-id="${order.id}">
                <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="paid" ${order.status === "paid" ? "selected" : ""}>Paid</option>
                <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
                <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
              </select>
            </td>
            <td>
              <div class="admin-table-actions">
                <button class="admin-btn admin-btn-primary" type="button" data-save-order-id="${order.id}">
                  Guardar estado
                </button>
                <button class="btn-edit" type="button" data-toggle-detail-id="${order.id}">
                  ${openOrderDetailId === order.id ? "Ocultar detalle" : "Ver detalle"}
                </button>
              </div>
            </td>
          </tr>
          <tr id="order-detail-row-${order.id}" style="display:none;">
            <td colspan="6">
              <div class="admin-empty">Cargando detalle...</div>
            </td>
          </tr>
        `;
      })
      .join("");

    bindOrderActions();

    if (openOrderDetailId) {
      toggleOrderDetail(openOrderDetailId, true);
    }
  }

  function bindCatalogActions() {
    document.querySelectorAll("[data-save-catalog-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.saveCatalogId;
        const modeSelect = document.querySelector(`[data-display-mode-id="${id}"]`);
        const stockInput = document.querySelector(`[data-stock-id="${id}"]`);

        if (!modeSelect || !stockInput) return;

        await updateCatalogProduct(id, modeSelect.value, stockInput.value);
      });
    });
  }

  function bindOrderActions() {
    document.querySelectorAll("[data-save-order-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.saveOrderId;
        const select = document.querySelector(`[data-order-status-id="${id}"]`);
        if (!select) return;

        await updateOrderStatus(id, select.value);
      });
    });

    document.querySelectorAll("[data-toggle-detail-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.toggleDetailId);
        await toggleOrderDetail(id);
      });
    });
  }

  async function updateCatalogProduct(id, display_mode, stock) {
    try {
      const response = await fetch(`${PRODUCTS_API_URL}/${id}/display-mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          display_mode,
          stock: Number(stock) || 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el catálogo");
      }

      showStatus(`Producto actualizado correctamente.`, "success");
      await loadProducts();
    } catch (error) {
      console.error("Error actualizando catálogo:", error);
      showStatus(error.message || "Error actualizando catálogo.", "error");
    }
  }

  async function toggleOrderDetail(id, forceOpen = false) {
    const detailRow = document.getElementById(`order-detail-row-${id}`);
    if (!detailRow) return;

    const isVisible = detailRow.style.display !== "none";

    if (isVisible && !forceOpen) {
      detailRow.style.display = "none";
      openOrderDetailId = null;
      renderOrders();
      return;
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/${id}`);

      if (!response.ok) {
        throw new Error("No se pudo cargar el detalle del pedido");
      }

      const order = await response.json();

      detailRow.innerHTML = `
        <td colspan="6">
          <div style="background:#f9fbfd; border:1px solid #d7e2ee; border-radius:14px; padding:16px;">
            <div style="margin-bottom:12px;">
              <strong>Cliente:</strong> ${escapeHTML(order.customer_name)}<br>
              <strong>Email:</strong> ${escapeHTML(order.customer_email)}<br>
              <strong>Teléfono:</strong> ${escapeHTML(order.customer_phone || "-")}<br>
              <strong>Dirección:</strong> ${escapeHTML(order.shipping_address)}, ${escapeHTML(order.shipping_city)} (${escapeHTML(order.shipping_postal_code)}), ${escapeHTML(order.shipping_province)}<br>
              <strong>Notas:</strong> ${escapeHTML(order.notes || "-")}
            </div>

            <div style="overflow:auto;">
              <table class="admin-table" style="min-width:0;">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unidad</th>
                    <th>Total línea</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    order.items.length
                      ? order.items.map(
                          (item) => `
                            <tr>
                              <td>${escapeHTML(item.product_name)}</td>
                              <td>${item.quantity}</td>
                              <td>${formatEUR(item.unit_price)}</td>
                              <td>${formatEUR(item.line_total)}</td>
                            </tr>
                          `
                        ).join("")
                      : `
                        <tr>
                          <td colspan="4">No hay líneas de pedido.</td>
                        </tr>
                      `
                  }
                </tbody>
              </table>
            </div>
          </div>
        </td>
      `;

      detailRow.style.display = "table-row";
      openOrderDetailId = id;
      renderOrdersButtonState(id);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      detailRow.innerHTML = `
        <td colspan="6">
          <div class="admin-empty">No se pudo cargar el detalle del pedido.</div>
        </td>
      `;
      detailRow.style.display = "table-row";
      openOrderDetailId = id;
      renderOrdersButtonState(id);
    }
  }

  function renderOrdersButtonState(id) {
    document.querySelectorAll("[data-toggle-detail-id]").forEach((btn) => {
      const btnId = Number(btn.dataset.toggleDetailId);
      btn.textContent = btnId === id && openOrderDetailId === id ? "Ocultar detalle" : "Ver detalle";
    });
  }

  async function updateOrderStatus(id, status) {
    try {
      const response = await fetch(`${ORDERS_API_URL}/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el pedido");
      }

      showStatus(`Pedido #${id} actualizado a "${status}".`, "success");
      await loadOrders();
    } catch (error) {
      console.error("Error actualizando pedido:", error);
      showStatus(error.message || "Error actualizando pedido.", "error");
    }
  }

  function showStatus(message, type = "success") {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = `admin-status show ${type}`;
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

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});