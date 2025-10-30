const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');
const { orderStatusSchema, paginationSchema, validate, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');
const { emailQueue } = require('../utils/queue');

const router = express.Router();

// @desc    Create order from cart (checkout)
// @route   POST /api/orders/checkout
// @access  Private/User
router.post('/checkout', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get user's cart
      const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      // Calculate total amount
      let totalAmount = 0;
      const orderItems = [];

      // Process each cart item
      for (const cartItem of cart.items) {
        const product = cartItem.productId;
        
        // Check if product still exists and has enough stock
        if (!product) {
          throw new AppError(`Product ${cartItem.productId} not found`, 404);
        }

        if (product.availableStock < cartItem.quantity) {
          throw new AppError(`Insufficient stock for product ${product.name}`, 400);
        }

        // Reserve stock atomically
        await product.reserveStock(cartItem.quantity);

        // Add to order items
        orderItems.push({
          productId: product._id,
          quantity: cartItem.quantity,
          priceAtPurchase: product.price
        });

        totalAmount += product.price * cartItem.quantity;
      }

      // Create order
      const order = await Order.create([{
        userId: req.user._id,
        items: orderItems,
        totalAmount,
        status: 'PENDING_PAYMENT'
      }], { session });

      // Clear cart
      await cart.clearCart();

      res.status(201).json({
        success: true,
        message: 'Order created successfully. Please complete payment within 15 minutes.',
        data: {
          order: order[0],
          paymentDeadline: order[0].paymentDeadline
        }
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @desc    Process payment for order
// @route   POST /api/orders/:id/pay
// @access  Private/User
router.post('/:id/pay', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).populate('items.productId');
      
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Check if order belongs to user
      if (order.userId.toString() !== req.user._id.toString()) {
        throw new AppError('Unauthorized access to order', 403);
      }

      // Check if order is in correct status
      if (order.status !== 'PENDING_PAYMENT') {
        throw new AppError('Order is not in pending payment status', 400);
      }

      // Check if order is expired
      if (order.isExpired()) {
        // Cancel expired order and release stock
        order.status = 'CANCELLED';
        await order.save();

        // Release reserved stock
        for (const orderItem of order.items) {
          const product = orderItem.productId;
          await product.releaseReservedStock(orderItem.quantity);
        }

        throw new AppError('Order has expired. Please create a new order.', 400);
      }

      // Mock payment processing
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      const payment = await Payment.create([{
        orderId: order._id,
        transactionId,
        amount: order.totalAmount,
        status: 'SUCCESS'
      }], { session });

      // Update order status
      order.status = 'PAID';
      await order.save();

      // Confirm stock deduction
      for (const orderItem of order.items) {
        const product = orderItem.productId;
        await product.confirmStockDeduction(orderItem.quantity);
      }

      // Queue email notification job
      await emailQueue.add('send-confirmation-email', {
        orderId: order._id,
        userId: req.user._id,
        userEmail: req.user.email,
        totalAmount: order.totalAmount
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          order,
          payment: payment[0]
        }
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}));

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private/User
router.get('/', authenticate, authorize('USER'), validateQuery(paginationSchema), asyncHandler(async (req, res) => {
  const { page, limit, sort } = req.query;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ userId: req.user._id })
    .populate('items.productId')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments({ userId: req.user._id });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
}));

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/User
router.get('/:id', authenticate, authorize('USER'), asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.productId');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if order belongs to user
  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Unauthorized access to order', 403);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

module.exports = router;
