const express = require('express');
const {
  getProductStores,
  getProductStore,
  createProductStore,
  updateProductStore,
  deleteProductStore,
  getStoreProducts,
  getProductStores: getStoresForProduct,
} = require('../controller/productStoreController');

const { protect, allowedTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getProductStores);
router.get('/:id', getProductStore);

// Protected routes (Admin only)
router.use(protect, allowedTo('admin'));
router.post('/', createProductStore);
router.put('/:id', updateProductStore);
router.delete('/:id', deleteProductStore);

// Nested routes
router.get('/stores/:storeId/products', getStoreProducts);
router.get('/products/:productId/stores', getStoresForProduct);

module.exports = router;
