import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
    const LOGIN_URL = `${API_URL}/api/auth/login`;
    const form = document.getElementById("login-form");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();
  
      try {
        const response = await fetch(LOGIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Credenciales incorrectas");
        }
  
        sessionStorage.setItem("userAuth", "true");
        sessionStorage.setItem("userEmail", data.user.email);
        sessionStorage.setItem("userName", data.user.name);
  
        window.location.href = "./mis-pedidos.html";
      } catch (error) {
        console.error("Error iniciando sesión:", error);
        alert(error.message || "Error iniciando sesión");
      }
    });
  });