const express = require("express");

const authService = require("../controller/authController");

const {
  addProductToWishlist,
  removeProductFromWishlist,
  getLoggedUserWishlist,
} = require("../controller/wishlistController");

const router = express.Router();

router.use(authService.protect, authService.allowedTo("user"));

router.route("/").post(addProductToWishlist).get(getLoggedUserWishlist);

router.delete("/:productStoreId", removeProductFromWishlist);

module.exports = router;
