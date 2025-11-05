const express = require('express');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');
const { productSchema, productUpdateSchema, paginationSchema, validate, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', validateQuery(paginationSchema), asyncHandler(async (req, res) => {
  const { page, limit, sort, search } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Execute query with pagination
  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
}));

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: { product }
  });
}));

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', authenticate, authorize('ADMIN','USER'), validate(productSchema), asyncHandler(async (req, res) => {
  const { name, price, description, stock } = req.body;

  const product = await Product.create({
    name,
    price,
    description,
    stock,
    availableStock: stock,
    reservedStock: 0
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
}));

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', authenticate, authorize('ADMIN','USER'), validate(productUpdateSchema), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Update fields
  const { name, price, description, stock } = req.body;
  
  if (name) product.name = name;
  if (price) product.price = price;
  if (description) product.description = description;
  if (stock !== undefined) {
    const stockDifference = stock - product.stock;
    product.stock = stock;
    product.availableStock += stockDifference;
  }

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
}));

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('ADMIN','USER'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));
//Lakhan
module.exports = router;
