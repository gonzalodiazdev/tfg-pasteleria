const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Faltan datos obligatorios"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Ya existe un usuario con ese correo"
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
      `,
      [name.trim(), normalizedEmail, password_hash]
    );

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail
      }
    });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({
      message: "Error registrando usuario",
      error: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      `
      SELECT id, name, email, password_hash, is_active
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }

    const user = rows[0];

    if (Number(user.is_active) === 0) {
      return res.status(403).json({
        message: "Usuario inactivo"
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }

    res.json({
      message: "Login correcto",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      message: "Error iniciando sesión",
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser
};