document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("admin-login-form");
    const statusBox = document.getElementById("login-status");
  
    const ADMIN_USER = "admin";
    const ADMIN_PASSWORD = "admin123";
  
    if (sessionStorage.getItem("adminAuth") === "true") {
      window.location.href = "./admin.html";
      return;
    }
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const username = document.getElementById("admin-username").value.trim();
      const password = document.getElementById("admin-password").value.trim();
  
      if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        sessionStorage.setItem("adminAuth", "true");
        sessionStorage.setItem("adminUser", username);
        window.location.href = "./admin.html";
        return;
      }
  
      showStatus("Usuario o contraseña incorrectos.");
    });
  
    function showStatus(message) {
      statusBox.textContent = message;
      statusBox.className = "login-status show error";
    }
  });