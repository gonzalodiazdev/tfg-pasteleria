const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// En producción (Netlify) inyecta window.__BACKEND_URL__ via snippet injection
// o reemplaza la cadena vacía con la URL de tu backend desplegado
export const API_URL = isLocal
  ? "http://localhost:3000"
  : (window.__BACKEND_URL__ || "");
