const cron = require('node-cron');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Function to cancel expired orders
const cancelExpiredOrders = async () => {
  try {
    console.log('🕐 Checking for expired orders...');
    
    // Find orders that are expired (PENDING_PAYMENT and past payment deadline)
    const expiredOrders = await Order.find({
      status: 'PENDING_PAYMENT',
      paymentDeadline: { $lt: new Date() }
    }).populate('items.productId');

    if (expiredOrders.length === 0) {
      console.log('✅ No expired orders found');
      return;
    }

    console.log(`🔄 Found ${expiredOrders.length} expired orders, processing...`);

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        // Update order status to CANCELLED
        order.status = 'CANCELLED';
        await order.save();

        // Release reserved stock for each item
        for (const orderItem of order.items) {
          const product = orderItem.productId;
          if (product) {
            await product.releaseReservedStock(orderItem.quantity);
            console.log(`📦 Released ${orderItem.quantity} units of ${product.name} back to available stock`);
          }
        }

        console.log(`❌ Order ${order._id} cancelled due to payment timeout`);
      } catch (error) {
        console.error(`❌ Error processing expired order ${order._id}:`, error);
      }
    }

    console.log(`✅ Processed ${expiredOrders.length} expired orders`);
  } catch (error) {
    console.error('❌ Error in cancelExpiredOrders:', error);
  }
};

// Schedule the job to run every minute
const startOrderTimeoutJob = () => {
  cron.schedule('* * * * *', () => {
    cancelExpiredOrders();
  });
  
  console.log('⏰ Order timeout job started - checking every minute');
};

module.exports = {
  cancelExpiredOrders,
  startOrderTimeoutJob
};
