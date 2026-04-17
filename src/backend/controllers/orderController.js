const pool = require("../config/db");

const createOrder = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_province,
      notes,
      subtotal,
      shipping_cost,
      total,
      items
    } = req.body;

    if (
      !customer_name ||
      !customer_email ||
      !shipping_address ||
      !shipping_city ||
      !shipping_postal_code ||
      !shipping_province ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Faltan datos obligatorios del pedido"
      });
    }

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `
      INSERT INTO orders (
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        notes,
        subtotal,
        shipping_cost,
        total,
        payment_method,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customer_name,
        customer_email,
        customer_phone || null,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        notes || null,
        Number(subtotal) || 0,
        Number(shipping_cost) || 0,
        Number(total) || 0,
        "simulated",
        "pending"
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const lineTotal = Number(item.line_total) || 0;

      const [productRows] = await connection.query(
        `
        SELECT id, name, stock
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`El producto con ID ${productId} no existe`);
      }

      const product = productRows[0];
      const currentStock = Number(product.stock) || 0;

      if (currentStock < quantity) {
        throw new Error(`Stock insuficiente para "${product.name}"`);
      }

      await connection.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          productId,
          item.product_name,
          quantity,
          unitPrice,
          lineTotal
        ]
      );

      await connection.query(
        `
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
        `,
        [quantity, productId]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "Pedido creado correctamente",
      order_id: orderId
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Error creando pedido:", error);

    return res.status(500).json({
      message: "Error creando pedido",
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        notes,
        subtotal,
        shipping_cost,
        total,
        status,
        payment_method,
        created_at
      FROM orders
      ORDER BY id DESC
    `);

    res.json(orders);
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    res.status(500).json({
      message: "Error obteniendo pedidos",
      error: error.message
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `
      SELECT
        id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        notes,
        subtotal,
        shipping_cost,
        total,
        status,
        payment_method,
        created_at
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Pedido no encontrado"
      });
    }

    const [items] = await pool.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
      `,
      [id]
    );

    res.json({
      ...orders[0],
      items
    });
  } catch (error) {
    console.error("Error obteniendo detalle del pedido:", error);
    res.status(500).json({
      message: "Error obteniendo detalle del pedido",
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "paid", "shipped", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Estado no válido"
      });
    }

    const [result] = await pool.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Pedido no encontrado"
      });
    }

    res.json({
      message: "Estado del pedido actualizado correctamente"
    });
  } catch (error) {
    console.error("Error actualizando estado del pedido:", error);
    res.status(500).json({
      message: "Error actualizando estado del pedido",
      error: error.message
    });
  }
};
const getOrdersByUserEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const normalizedEmail = String(email).trim().toLowerCase();

    const [orders] = await pool.query(
      `
      SELECT
        id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_province,
        notes,
        subtotal,
        shipping_cost,
        total,
        status,
        payment_method,
        created_at
      FROM orders
      WHERE LOWER(customer_email) = ?
      ORDER BY id DESC
      `,
      [normalizedEmail]
    );

    res.json(orders);
  } catch (error) {
    console.error("Error obteniendo pedidos por email:", error);
    res.status(500).json({
      message: "Error obteniendo pedidos del usuario",
      error: error.message
    });
  }
};
module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserEmail,
  updateOrderStatus
};