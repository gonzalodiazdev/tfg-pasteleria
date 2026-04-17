import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
    const REGISTER_URL = `${API_URL}/api/auth/register`;
    const form = document.getElementById("register-form");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value.trim();
  
      try {
        const response = await fetch(REGISTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, password })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "No se pudo registrar el usuario");
        }
  
        window.location.href = "./login.html";
      } catch (error) {
        console.error("Error registrando usuario:", error);
        alert(error.message || "Error registrando usuario");
      }
    });
  });