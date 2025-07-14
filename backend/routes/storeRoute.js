const express = require('express');
const {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoresWithin,
  getStoresByCategory
} = require('../controller/storeController');

const { protect, allowedTo } = require('../controller/authController');

const router = express.Router();

// Public routes
router.get('/', getStores);
router.get('/:id', getStore);
router.get('/radius/:lat/:lng/:distance', getStoresWithin);
router.get('/category/:categoryId', getStoresByCategory);

// Protected routes (Admin/Manager)
router.use(protect);

router.post('/', allowedTo('admin', 'manager'), createStore);
router
  .route('/:id')
  .put(allowedTo('admin', 'manager'), updateStore)
  .delete(allowedTo('admin'), deleteStore);

module.exports = router;
