const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  updateProductDisplayMode,
  deleteProduct
} = require("../controllers/productController");

router.get("/", getAllProducts);
router.get("/admin/all", getAllProductsAdmin);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.put("/:id/display-mode", updateProductDisplayMode);
router.delete("/:id", deleteProduct);

module.exports = router;