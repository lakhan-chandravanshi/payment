const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  availableStock: {
    type: Number,
    required: [true, 'Available stock is required'],
    min: [0, 'Available stock cannot be negative'],
    default: 0
  },
  reservedStock: {
    type: Number,
    required: [true, 'Reserved stock is required'],
    min: [0, 'Reserved stock cannot be negative'],
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to calculate total stock
productSchema.virtual('totalStock').get(function() {
  return this.availableStock + this.reservedStock;
});

// Method to reserve stock
productSchema.methods.reserveStock = function(quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  this.availableStock -= quantity;
  this.reservedStock += quantity;
  return this.save();
};

// Method to release reserved stock
productSchema.methods.releaseReservedStock = function(quantity) {
  if (this.reservedStock < quantity) {
    throw new Error('Insufficient reserved stock to release');
  }
  this.reservedStock -= quantity;
  this.availableStock += quantity;
  return this.save();
};

// Method to confirm stock deduction
productSchema.methods.confirmStockDeduction = function(quantity) {
  if (this.reservedStock < quantity) {
    throw new Error('Insufficient reserved stock to confirm');
  }
  this.reservedStock -= quantity;
  this.stock -= quantity;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
