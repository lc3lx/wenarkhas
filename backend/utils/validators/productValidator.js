const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Category = require('../../models/categoryModel');
const SubCategory = require('../../models/subCategoryModel');

exports.createProductValidator = [
  check('title')
    .isLength({ min: 3 })
    .withMessage('must be at least 3 chars')
    .notEmpty()
    .withMessage('Product required')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Too long description'),

  check('colors')
    .optional()
    .isArray()
    .withMessage('availableColors should be array of string'),
  check('imageCover').notEmpty().withMessage('Product imageCover is required'),
  check('images')
    .optional()
    .isArray()
    .withMessage('images should be array of string'),
  check('category')
    .notEmpty()
    .withMessage('Product must be belong to a category')
    .isMongoId()
    .withMessage('Invalid ID formate')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id: ${categoryId}`)
          );
        }
      })
    ),

  check('subcategories')
    .optional()
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Subcategories must be an array');
      }
      return true;
    })
    .custom((subcategoriesIds) => {
      if (!Array.isArray(subcategoriesIds)) return true;
      
      return SubCategory.find({ _id: { $in: subcategoriesIds } })
        .then(subcategories => {
          if (subcategories.length !== subcategoriesIds.length) {
            return Promise.reject(new Error('One or more subcategories do not exist'));
          }
        });
    })
    .custom((subcategoriesIds, { req }) => {
      if (!req.body.category || !Array.isArray(subcategoriesIds)) return true;
      
      return SubCategory.find({ category: req.body.category })
        .then(categorySubcategories => {
          const categorySubcategoryIds = categorySubcategories.map(sc => sc._id.toString());
          const allExist = subcategoriesIds.every(id => categorySubcategoryIds.includes(id));
          
          if (!allExist) {
            return Promise.reject(new Error('One or more subcategories do not belong to the selected category'));
          }
        });
    }),

  check('brand').optional().isMongoId().withMessage('Invalid ID formate'),
  check('ratingsAverage')
    .optional()
    .isNumeric()
    .withMessage('ratingsAverage must be a number')
    .isLength({ min: 1 })
    .withMessage('Rating must be above or equal 1.0')
    .isLength({ max: 5 })
    .withMessage('Rating must be below or equal 5.0'),
  check('ratingsQuantity')
    .optional()
    .isNumeric()
    .withMessage('ratingsQuantity must be a number'),

  validatorMiddleware,
];

exports.getProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  body('title')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
