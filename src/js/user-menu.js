document.addEventListener("DOMContentLoaded", () => {
    const slot = document.getElementById("user-menu-slot");
    if (!slot) return;
  
    const isLogged = sessionStorage.getItem("userAuth") === "true";
  
    const path = window.location.pathname.replace(/\\/g, "/");
    const isIndex =
      path.endsWith("/index.html") ||
      path === "/" ||
      path.endsWith("/");
  
    const loginHref = isIndex ? "./src/pages/login.html" : "./login.html";
    const registerHref = isIndex ? "./src/pages/register.html" : "./register.html";
    const ordersHref = isIndex ? "./src/pages/mis-pedidos.html" : "./mis-pedidos.html";
  
    if (!isLogged) {
      slot.innerHTML = `
        <a href="${loginHref}">Iniciar sesión</a>
        <a href="${registerHref}">Registrarse</a>
      `;
      return;
    }
  
    slot.innerHTML = `
      <a href="${ordersHref}">Mis pedidos</a>
      <a href="#" id="logout-user-link">Cerrar sesión</a>
    `;
  
    const logoutLink = document.getElementById("logout-user-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("userAuth");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userName");
  
        if (isIndex) {
          window.location.href = "./index.html";
        } else {
          window.location.href = "./tienda.html";
        }
      });
    }
  });