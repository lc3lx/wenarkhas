const asyncHandler = require("express-async-handler");
const ProductStore = require("../models/productStoreModel");
const factory = require("./handlersFactory");

// @desc    Get all product stores
// @route   GET /api/v1/product-stores
// @access  Public
exports.getProductStores = factory.getAll(ProductStore);

// @desc    Get specific product store by id
// @route   GET /api/v1/product-stores/:id
// @access  Public
exports.getProductStore = factory.getOne(ProductStore);

// @desc    Create new product store
// @route   POST /api/v1/product-stores
// @access  Private/Admin
// @body    {productId, storeId, price, priceAfterDiscount, stock, url}
exports.createProductStore = factory.createOne(ProductStore);

// @desc    Update specific product store
// @route   PUT /api/v1/product-stores/:id
// @access  Private/Admin
// @body    {price, priceAfterDiscount, stock, url}
exports.updateProductStore = factory.updateOne(ProductStore);

// @desc    Delete specific product store
// @route   DELETE /api/v1/product-stores/:id
// @access  Private/Admin
exports.deleteProductStore = factory.deleteOne(ProductStore);

// @desc    Get all products for specific store
// @route   GET /api/v1/stores/:storeId/products
// @access  Public
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
  const storeId = req.params.storeId;
  
  const products = await ProductStore.find({ storeId })
    .populate('productId', 'title description imageCover')
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

// @desc    Get all stores for specific product
// @route   GET /api/v1/products/:productId/stores
// @access  Public
exports.getProductStores = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  
  const stores = await ProductStore.find({ productId })
    .populate('storeId', 'name logo')
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    results: stores.length,
    data: stores,
  });
});
