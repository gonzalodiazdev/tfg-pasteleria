document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".btn-add");
  const cartCount = document.getElementById("cart-count");

  updateCartCount();

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      if (!card) return;

      const id = Number(btn.dataset.id);

      const name = (card.querySelector(".product-title")?.textContent || "").trim();
      const priceText = (card.querySelector(".product-price")?.textContent || "").trim();
      const imgSrc = card.querySelector(".product-thumb img")?.getAttribute("src") || "";

      const price = parsePrice(priceText);

      const cart = getCart();
      const existing = cart.find((p) => Number(p.id) === id);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, qty: 1, img: imgSrc });
      }

      setCart(cart);
      updateCartCount();
      showAlert("Producto añadido al carrito");
    });
  });

  function parsePrice(text) {
    // "6,30 €" -> 6.30
    const normalized = text.replace(",", ".").replace(/[^\d.]/g, "");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
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
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    if (cartCount) cartCount.textContent = totalQty;
  }

  function showAlert(text) {
    const alertEl = document.getElementById("site-alert");
    if (!alertEl) return;

    alertEl.textContent = text;
    alertEl.classList.add("show");

    setTimeout(() => {
      alertEl.classList.remove("show");
    }, 2200);
  }
});
