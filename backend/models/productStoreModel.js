const mongoose = require("mongoose");

const productStoreSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    priceAfterDiscount: Number,
    stock: {
      type: Number,
      default: 0,
    },
    url: String, // رابط المنتج في المتجر
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductStore", productStoreSchema);
