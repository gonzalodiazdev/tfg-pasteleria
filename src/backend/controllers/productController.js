const pool = require("../config/db");

const getAllProducts = async (req, res) => {
  try {
    const { mode } = req.query;

    let query = `
      SELECT 
        id,
        name,
        slug,
        short_description,
        description,
        price,
        units,
        image,
        category,
        ingredients,
        allergens,
        nutrition,
        weight,
        storage_info,
        stock,
        is_featured,
        is_active,
        display_mode
      FROM products
      WHERE is_active = 1
    `;

    const params = [];

    if (mode === "shop" || mode === "gallery") {
      query += ` AND display_mode = ?`;
      params.push(mode);
    }

    query += ` ORDER BY id ASC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({
      message: "Error obteniendo productos",
      error: error.message
    });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        name,
        slug,
        short_description,
        description,
        price,
        units,
        image,
        category,
        ingredients,
        allergens,
        nutrition,
        weight,
        storage_info,
        stock,
        is_featured,
        is_active,
        display_mode
      FROM products
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo productos admin:", error);
    res.status(500).json({
      message: "Error obteniendo productos admin",
      error: error.message
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        id,
        name,
        slug,
        short_description,
        description,
        price,
        units,
        image,
        category,
        ingredients,
        allergens,
        nutrition,
        weight,
        storage_info,
        stock,
        is_featured,
        is_active,
        display_mode
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error obteniendo producto por ID:", error);
    res.status(500).json({
      message: "Error obteniendo producto",
      error: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      short_description,
      description,
      price,
      units,
      image,
      category,
      ingredients,
      allergens,
      nutrition,
      weight,
      storage_info,
      stock,
      is_featured,
      is_active,
      display_mode
    } = req.body;

    if (!name || !slug || !short_description || !description || !price || !units || !image) {
      return res.status(400).json({
        message: "Faltan campos obligatorios del producto"
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO products (
        name,
        slug,
        short_description,
        description,
        price,
        units,
        image,
        category,
        ingredients,
        allergens,
        nutrition,
        weight,
        storage_info,
        stock,
        is_featured,
        is_active,
        display_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        short_description,
        description,
        Number(price),
        units,
        image,
        category || "magdalenas",
        ingredients || null,
        allergens || null,
        nutrition || null,
        weight || null,
        storage_info || null,
        Number(stock) || 0,
        Number(is_featured) ? 1 : 0,
        Number(is_active) === 0 ? 0 : 1,
        display_mode || "shop"
      ]
    );

    res.status(201).json({
      message: "Producto creado correctamente",
      product_id: result.insertId
    });
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({
      message: "Error creando producto",
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      short_description,
      description,
      price,
      units,
      image,
      category,
      ingredients,
      allergens,
      nutrition,
      weight,
      storage_info,
      stock,
      is_featured,
      is_active,
      display_mode
    } = req.body;

    const [result] = await pool.query(
      `
      UPDATE products
      SET
        name = ?,
        slug = ?,
        short_description = ?,
        description = ?,
        price = ?,
        units = ?,
        image = ?,
        category = ?,
        ingredients = ?,
        allergens = ?,
        nutrition = ?,
        weight = ?,
        storage_info = ?,
        stock = ?,
        is_featured = ?,
        is_active = ?,
        display_mode = ?
      WHERE id = ?
      `,
      [
        name,
        slug,
        short_description,
        description,
        Number(price),
        units,
        image,
        category || "magdalenas",
        ingredients || null,
        allergens || null,
        nutrition || null,
        weight || null,
        storage_info || null,
        Number(stock) || 0,
        Number(is_featured) ? 1 : 0,
        Number(is_active) === 0 ? 0 : 1,
        display_mode || "shop",
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Producto no encontrado"
      });
    }

    res.json({
      message: "Producto actualizado correctamente"
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({
      message: "Error actualizando producto",
      error: error.message
    });
  }
};

const updateProductDisplayMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_mode, stock } = req.body;

    if (!["shop", "gallery"].includes(display_mode)) {
      return res.status(400).json({
        message: "display_mode no válido"
      });
    }

    const [result] = await pool.query(
      `
      UPDATE products
      SET display_mode = ?, stock = ?
      WHERE id = ?
      `,
      [display_mode, Number(stock) || 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Producto no encontrado"
      });
    }

    res.json({
      message: "Visibilidad del producto actualizada correctamente"
    });
  } catch (error) {
    console.error("Error actualizando display_mode:", error);
    res.status(500).json({
      message: "Error actualizando visibilidad del producto",
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Producto no encontrado"
      });
    }

    res.json({
      message: "Producto eliminado correctamente"
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({
      message: "Error eliminando producto",
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  updateProductDisplayMode,
  deleteProduct
};