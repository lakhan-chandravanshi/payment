const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');
const { cartItemSchema, validate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private/User
router.get('/', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  res.json({
    success: true,
    data: { cart }
  });
}));

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private/User
router.post('/items', authenticate, authorize('USER'), validate(cartItemSchema), asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if product has enough stock
  if (product.availableStock < quantity) {
    throw new AppError('Insufficient stock available', 400);
  }

  // Find or create cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  // Add item to cart
  await cart.addItem(productId, quantity);

  // Populate the cart with product details
  await cart.populate('items.productId');

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: { cart }
  });
}));

// @desc    Update item quantity in cart
// @route   PUT /api/cart/items/:productId
// @access  Private/User
router.put('/items/:productId', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 0) {
    throw new AppError('Quantity must be a positive number', 400);
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Check if product has enough stock (only if increasing quantity)
  const existingItem = cart.items.find(item => item.productId.toString() === productId);
  if (existingItem && quantity > existingItem.quantity) {
    const additionalQuantity = quantity - existingItem.quantity;
    if (product.availableStock < additionalQuantity) {
      throw new AppError('Insufficient stock available', 400);
    }
  }

  // Update item quantity
  await cart.updateItemQuantity(productId, quantity);

  // Populate the cart with product details
  await cart.populate('items.productId');

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: { cart }
  });
}));

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private/User
router.delete('/items/:productId', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Remove item from cart
  await cart.removeItem(productId);

  // Populate the cart with product details
  await cart.populate('items.productId');

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: { cart }
  });
}));

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private/User
router.delete('/', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.clearCart();

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: { cart }
  });
}));

module.exports = router;
