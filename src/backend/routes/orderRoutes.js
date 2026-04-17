const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserEmail,
  updateOrderStatus
} = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/user/:email", getOrdersByUserEmail);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);

module.exports = router;