const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { orderStatusSchema, orderQuerySchema, validate, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get('/orders', authenticate, authorize('ADMIN'), validateQuery(orderQuerySchema), asyncHandler(async (req, res) => {
  const { page, limit, status, sort } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('userId', 'name email')
    .populate('items.productId', 'name price')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

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

// @desc    Update order status (Admin)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
router.patch('/orders/:id/status', authenticate, authorize('ADMIN'), validate(orderStatusSchema), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('items.productId');
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update order status
  await order.updateStatus(status);

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
}));

// @desc    Get order statistics (Admin)
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $in: ['PAID', 'SHIPPED', 'DELIVERED'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    success: true,
    data: {
      orderStats: stats,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
}));

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', authenticate, authorize('ADMIN'), validateQuery(orderQuerySchema), asyncHandler(async (req, res) => {
  const { page, limit, sort } = req.query;
  const skip = (page - 1) * limit;

  const users = await User.find({})
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
}));

module.exports = router;
