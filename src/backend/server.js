const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "https://tfg-pasteleriav2.netlify.app" }));
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando correctamente" });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS db_ok");
    res.json({
      message: "Conexión a MySQL correcta",
      data: rows
    });
  } catch (error) {
    console.error("Error de conexión a MySQL:", error);
    res.status(500).json({
      message: "Error conectando con la base de datos",
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});