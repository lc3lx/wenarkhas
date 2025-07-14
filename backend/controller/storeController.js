const Store = require('../models/storeModel');
const factory = require('./handlersFactory');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

// @desc    Get all stores
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = factory.getAll(Store);

// @desc    Get specific store by id
// @route   GET /api/v1/stores/:id
// @access  Public
exports.getStore = factory.getOne(Store);

// @desc    Create store
// @route   POST  /api/v1/stores
// @access  Private/Admin-Manager
exports.createStore = factory.createOne(Store);

// @desc    Update specific store
// @route   PUT /api/v1/stores/:id
// @access  Private/Admin-Manager
exports.updateStore = factory.updateOne(Store);

// @desc    Delete specific store
// @route   DELETE /api/v1/stores/:id
// @access  Private/Admin
exports.deleteStore = factory.deleteOne(Store);

// @desc    Get stores within radius
// @route   GET /api/v1/stores/radius/:lat/:lng/:distance
// @access  Public
exports.getStoresWithin = asyncHandler(async (req, res, next) => {
  const { lat, lng, distance } = req.params;

  // Check if lat and lng are valid numbers
  if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
    return next(new ApiError('Please provide valid lat, lng and distance', 400));
  }

  const radius = distance / 6378.1; // Convert distance to radians

  const stores = await Store.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    },
    isActive: true
  });

  res.status(200).json({
    status: 'success',
    results: stores.length,
    data: {
      data: stores
    }
  });
});

// @desc    Get stores by category
// @route   GET /api/v1/stores/category/:categoryId
// @access  Public
exports.getStoresByCategory = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({ 
    categories: req.params.categoryId,
    isActive: true 
  });

  res.status(200).json({
    status: 'success',
    results: stores.length,
    data: {
      data: stores
    }
  });
});
